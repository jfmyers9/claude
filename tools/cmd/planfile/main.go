package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var (
	nonAlnum    = regexp.MustCompile(`[^a-z0-9]+`)
	multiHyphen = regexp.MustCompile(`-{2,}`)
	maxSlugLen  = 50

	stripWords = map[string]bool{
		"a": true, "an": true, "the": true,
		"for": true, "with": true, "and": true, "or": true,
		"to": true, "in": true, "of": true, "on": true,
		"by": true, "is": true, "it": true, "be": true,
		"as": true, "at": true, "do": true,
	}
)

func slug(input string) string {
	s := strings.ToLower(input)

	words := strings.Fields(s)
	kept := words[:0]
	for _, w := range words {
		clean := nonAlnum.ReplaceAllString(w, "")
		if clean == "" {
			continue
		}
		if stripWords[clean] {
			continue
		}
		kept = append(kept, w)
	}

	s = strings.Join(kept, "-")
	s = nonAlnum.ReplaceAllString(s, "-")
	s = multiHyphen.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")

	if len(s) > maxSlugLen {
		cut := s[:maxSlugLen]
		if last := strings.LastIndex(cut, "-"); last > 0 {
			cut = cut[:last]
		}
		s = strings.TrimRight(cut, "-")
	}

	return s
}

func expandHome(path string) string {
	if strings.HasPrefix(path, "~/") || path == "~" {
		home, err := os.UserHomeDir()
		if err != nil {
			return path
		}
		return filepath.Join(home, path[1:])
	}
	return path
}

func plansDir(projectPath string) string {
	home, err := os.UserHomeDir()
	if err != nil {
		fatal("cannot determine home directory: %v", err)
	}
	base := filepath.Base(projectPath)
	return filepath.Join(home, ".claude", "plans", base)
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}

// parseFrontmatter splits a file into YAML frontmatter and body.
// Returns the raw YAML (without delimiters) and the body after the closing ---.
func parseFrontmatter(content string) (yaml string, body string, ok bool) {
	const delim = "---"

	if !strings.HasPrefix(content, delim+"\n") {
		return "", content, false
	}

	rest := content[len(delim)+1:]
	end := strings.Index(rest, "\n"+delim+"\n")
	if end < 0 {
		// Check for --- at end of file with no trailing newline
		if strings.HasSuffix(rest, "\n"+delim) {
			end = len(rest) - len(delim) - 1
			return rest[:end], "", true
		}
		return "", content, false
	}

	return rest[:end], rest[end+len(delim)+2:], true
}

// --- create ---

func cmdCreate(args []string) {
	fs := flag.NewFlagSet("planfile create", flag.ExitOnError)
	topic := fs.String("topic", "", "topic string for frontmatter (required)")
	project := fs.String("project", "", "absolute path to project root (required)")
	slugFlag := fs.String("slug", "", "explicit slug for filename")
	prefix := fs.String("prefix", "", "prepend to slug, e.g. review")
	body := fs.String("body", "", "body content")
	fs.Parse(args)

	if *topic == "" {
		fatal("--topic is required")
	}
	if *project == "" {
		fatal("--project is required")
	}

	projectPath := expandHome(*project)

	s := *slugFlag
	if s == "" {
		s = slug(*topic)
	}
	if s == "" {
		fatal("could not derive slug from topic")
	}

	if *prefix != "" {
		s = *prefix + "-" + s
	}

	filename := s + ".md"
	dir := plansDir(projectPath)

	if err := os.MkdirAll(dir, 0755); err != nil {
		fatal("cannot create directory %s: %v", dir, err)
	}

	fullPath := filepath.Join(dir, filename)

	bodyContent := *body
	if bodyContent == "" {
		// Read from stdin if piped
		info, err := os.Stdin.Stat()
		if err == nil && (info.Mode()&os.ModeCharDevice) == 0 {
			data, err := io.ReadAll(os.Stdin)
			if err != nil {
				fatal("reading stdin: %v", err)
			}
			bodyContent = string(data)
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)

	var buf strings.Builder
	buf.WriteString("---\n")
	buf.WriteString("topic: " + yamlQuote(*topic) + "\n")
	buf.WriteString("project: " + yamlQuote(projectPath) + "\n")
	buf.WriteString("created: " + now + "\n")
	buf.WriteString("status: draft\n")
	buf.WriteString("---\n")
	if bodyContent != "" {
		buf.WriteString(bodyContent)
		// Ensure trailing newline
		if !strings.HasSuffix(bodyContent, "\n") {
			buf.WriteString("\n")
		}
	}

	if err := os.WriteFile(fullPath, []byte(buf.String()), 0644); err != nil {
		fatal("writing file: %v", err)
	}

	fmt.Println(fullPath)
}

// yamlQuote wraps a value in double quotes if it contains characters
// that could be misinterpreted by YAML parsers.
func yamlQuote(s string) string {
	if strings.ContainsAny(s, ":{}[]&*?|>!%@`#,\"'\n\\") || strings.HasPrefix(s, " ") || strings.HasSuffix(s, " ") {
		escaped := strings.ReplaceAll(s, `\`, `\\`)
		escaped = strings.ReplaceAll(escaped, `"`, `\"`)
		return `"` + escaped + `"`
	}
	return s
}

// --- read ---

func cmdRead(args []string) {
	fs := flag.NewFlagSet("planfile read", flag.ExitOnError)
	frontmatter := fs.Bool("frontmatter", false, "output frontmatter as JSON")
	fs.Parse(args)

	if fs.NArg() < 1 {
		fatal("usage: planfile read [--frontmatter] <file>")
	}

	filePath := expandHome(fs.Arg(0))
	data, err := os.ReadFile(filePath)
	if err != nil {
		fatal("reading file: %v", err)
	}

	content := string(data)
	yamlStr, body, hasFM := parseFrontmatter(content)

	if *frontmatter {
		if !hasFM {
			fmt.Println("{}")
			return
		}
		m := parseYAMLMap(yamlStr)
		j, err := json.Marshal(m)
		if err != nil {
			fatal("marshaling JSON: %v", err)
		}
		fmt.Println(string(j))
		return
	}

	fmt.Print(body)
}

// parseYAMLMap parses simple key: value YAML into a map.
// Handles quoted and unquoted string values — sufficient for our frontmatter.
func parseYAMLMap(yamlStr string) map[string]string {
	m := make(map[string]string)
	for _, line := range strings.Split(yamlStr, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		idx := strings.Index(line, ":")
		if idx < 0 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		val := strings.TrimSpace(line[idx+1:])
		// Strip surrounding quotes
		if len(val) >= 2 && val[0] == '"' && val[len(val)-1] == '"' {
			val = val[1 : len(val)-1]
			val = strings.ReplaceAll(val, `\"`, `"`)
			val = strings.ReplaceAll(val, `\\`, `\`)
		} else if len(val) >= 2 && val[0] == '\'' && val[len(val)-1] == '\'' {
			val = val[1 : len(val)-1]
		}
		m[key] = val
	}
	return m
}

// --- latest ---

func cmdLatest(args []string) {
	fs := flag.NewFlagSet("planfile latest", flag.ExitOnError)
	project := fs.String("project", "", "project path (default: git root or cwd)")
	fs.Parse(args)

	projectPath := *project
	if projectPath == "" {
		// Try git root
		out, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
		if err == nil {
			projectPath = strings.TrimSpace(string(out))
		} else {
			wd, err := os.Getwd()
			if err != nil {
				fatal("cannot determine working directory: %v", err)
			}
			projectPath = wd
		}
	} else {
		projectPath = expandHome(projectPath)
	}

	dir := plansDir(projectPath)
	entries, err := os.ReadDir(dir)
	if err != nil {
		fatal("no plans found for project %s", filepath.Base(projectPath))
	}

	var latestPath string
	var latestTime time.Time

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		if info.ModTime().After(latestTime) {
			latestTime = info.ModTime()
			latestPath = filepath.Join(dir, e.Name())
		}
	}

	if latestPath == "" {
		fatal("no plan files found in %s", dir)
	}

	fmt.Println(latestPath)
}

// --- delete ---

func cmdDelete(args []string) {
	fs := flag.NewFlagSet("planfile delete", flag.ExitOnError)
	fs.Parse(args)

	if fs.NArg() < 1 {
		fatal("usage: planfile delete <file>")
	}

	filePath := expandHome(fs.Arg(0))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		fatal("file not found: %s", filePath)
	}

	if err := os.Remove(filePath); err != nil {
		fatal("deleting file: %v", err)
	}

	fmt.Printf("Deleted: %s\n", filePath)
}

const usage = `Usage: planfile <command> [options]

Commands:
  create    Create a new plan file
  read      Read plan file body or frontmatter
  latest    Find most recently modified plan file
  delete    Delete a plan file

Run 'planfile <command> --help' for details.`

func main() {
	if len(os.Args) < 2 {
		fmt.Println(usage)
		os.Exit(1)
	}

	cmd := os.Args[1]
	rest := os.Args[2:]

	switch cmd {
	case "create":
		cmdCreate(rest)
	case "read":
		cmdRead(rest)
	case "latest":
		cmdLatest(rest)
	case "delete":
		cmdDelete(rest)
	case "--help", "-h", "help":
		fmt.Println(usage)
	default:
		fatal("unknown command: %s\nRun 'planfile --help' for usage.", cmd)
	}
}
