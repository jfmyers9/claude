package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

type context struct {
	Branch         string   `json:"branch"`
	Commits        []commit `json:"commits"`
	Files          []string `json:"files"`
	Diff           string   `json:"diff"`
	Truncated      bool     `json:"truncated"`
	TruncatedFiles []string `json:"truncated_files"`
}

type commit struct {
	Hash    string `json:"hash"`
	Subject string `json:"subject"`
}

func main() {
	base := flag.String("base", "main", "base branch for comparison")
	format := flag.String("format", "text", "output format: text or json")
	maxTotal := flag.Int("max-total", 3000, "max total diff lines before truncation")
	maxFile := flag.Int("max-file", 200, "per-file diff line threshold for truncation")
	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, `Usage: gitcontext [flags]

Gather branch context (diff, log, files) for Claude Code skills.

Flags:`)
		flag.PrintDefaults()
	}
	flag.Parse()

	if *format != "text" && *format != "json" {
		fatal("invalid format %q: must be \"text\" or \"json\"", *format)
	}

	if err := verifyGitRepo(); err != nil {
		fatal("%v", err)
	}

	if err := verifyBaseExists(*base); err != nil {
		fatal("%v", err)
	}

	ctx, err := gather(*base, *maxTotal, *maxFile)
	if err != nil {
		fatal("%v", err)
	}

	switch *format {
	case "json":
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		enc.SetEscapeHTML(false)
		if err := enc.Encode(ctx); err != nil {
			fatal("encoding json: %v", err)
		}
	default:
		printText(ctx)
	}
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "gitcontext: "+format+"\n", args...)
	os.Exit(1)
}

func verifyGitRepo() error {
	_, err := git("rev-parse", "--git-dir")
	if err != nil {
		return fmt.Errorf("not in a git repository")
	}
	return nil
}

func verifyBaseExists(base string) error {
	_, err := git("rev-parse", "--verify", base)
	if err != nil {
		return fmt.Errorf("base branch %q does not exist", base)
	}
	return nil
}

func gather(base string, maxTotal, maxFile int) (context, error) {
	var ctx context

	branch, err := git("branch", "--show-current")
	if err != nil {
		return ctx, fmt.Errorf("getting current branch: %w", err)
	}
	ctx.Branch = strings.TrimSpace(branch)

	logOut, err := git("log", base+"..HEAD", "--format=%h %s")
	if err != nil {
		return ctx, fmt.Errorf("getting commit log: %w", err)
	}
	ctx.Commits = parseCommits(logOut)

	filesOut, err := git("diff", base+"...HEAD", "--name-only")
	if err != nil {
		return ctx, fmt.Errorf("getting changed files: %w", err)
	}
	ctx.Files = nonEmpty(strings.Split(strings.TrimSpace(filesOut), "\n"))

	diffOut, err := git("diff", base+"...HEAD")
	if err != nil {
		return ctx, fmt.Errorf("getting diff: %w", err)
	}

	diffLines := strings.Count(diffOut, "\n")
	if diffLines > maxTotal {
		diffOut, ctx.TruncatedFiles = truncateDiff(diffOut, maxFile)
		ctx.Truncated = true
	}
	ctx.Diff = diffOut

	if ctx.TruncatedFiles == nil {
		ctx.TruncatedFiles = []string{}
	}

	return ctx, nil
}

func git(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	out, err := cmd.Output()
	return string(out), err
}

func parseCommits(raw string) []commit {
	var commits []commit
	for _, line := range strings.Split(strings.TrimSpace(raw), "\n") {
		if line == "" {
			continue
		}
		hash, subject, ok := strings.Cut(line, " ")
		if !ok {
			continue
		}
		commits = append(commits, commit{Hash: hash, Subject: subject})
	}
	if commits == nil {
		commits = []commit{}
	}
	return commits
}

func nonEmpty(ss []string) []string {
	var out []string
	for _, s := range ss {
		if s != "" {
			out = append(out, s)
		}
	}
	if out == nil {
		out = []string{}
	}
	return out
}

// truncateDiff splits a unified diff into per-file sections and truncates
// files exceeding maxFile lines, keeping 50 head + 50 tail lines.
func truncateDiff(raw string, maxFile int) (string, []string) {
	sections := splitDiff(raw)
	var truncatedFiles []string
	var result strings.Builder

	for _, sec := range sections {
		lines := strings.SplitAfter(sec, "\n")
		// Remove trailing empty element from split
		if len(lines) > 0 && lines[len(lines)-1] == "" {
			lines = lines[:len(lines)-1]
		}

		if len(lines) <= maxFile {
			result.WriteString(sec)
			continue
		}

		fname := extractFilename(lines[0])
		truncatedFiles = append(truncatedFiles, fname)

		const keep = 50
		omitted := len(lines) - 2*keep

		for _, l := range lines[:keep] {
			result.WriteString(l)
		}
		fmt.Fprintf(&result,
			"... [truncated: %d lines omitted, use Read tool for full file] ...\n",
			omitted)
		for _, l := range lines[len(lines)-keep:] {
			result.WriteString(l)
		}
	}

	return result.String(), truncatedFiles
}

// splitDiff splits a combined diff into per-file sections.
// Each section starts with "diff --git".
func splitDiff(raw string) []string {
	const marker = "diff --git "
	var sections []string
	rest := raw

	for {
		idx := strings.Index(rest, marker)
		if idx < 0 {
			if rest != "" {
				// Leftover text before first marker (shouldn't happen, but be safe)
				if len(sections) > 0 {
					sections[len(sections)-1] += rest
				}
			}
			break
		}

		// Text before this marker belongs to the previous section
		if idx > 0 && len(sections) > 0 {
			sections[len(sections)-1] += rest[:idx]
		}

		// Find the next marker to delimit this section
		next := strings.Index(rest[idx+len(marker):], marker)
		if next < 0 {
			sections = append(sections, rest[idx:])
			break
		}
		end := idx + len(marker) + next
		sections = append(sections, rest[idx:end])
		rest = rest[end:]
	}

	return sections
}

func extractFilename(diffHeader string) string {
	// "diff --git a/foo/bar.go b/foo/bar.go\n" → "foo/bar.go"
	after, ok := strings.CutPrefix(strings.TrimSpace(diffHeader), "diff --git ")
	if !ok {
		return "<unknown>"
	}
	parts := strings.SplitN(after, " ", 2)
	if len(parts) < 1 {
		return "<unknown>"
	}
	return strings.TrimPrefix(parts[0], "a/")
}

func printText(ctx context) {
	fmt.Println("## Branch")
	fmt.Println(ctx.Branch)
	fmt.Println()

	fmt.Println("## Commits")
	for _, c := range ctx.Commits {
		fmt.Printf("%s %s\n", c.Hash, c.Subject)
	}
	fmt.Println()

	fmt.Println("## Changed Files")
	for _, f := range ctx.Files {
		fmt.Println(f)
	}
	fmt.Println()

	fmt.Println("## Diff")
	fmt.Print(ctx.Diff)
}
