package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"
)

type Phase struct {
	Phase int      `json:"phase"`
	Title string   `json:"title"`
	Tasks []string `json:"tasks"`
	Deps  []int    `json:"deps"`
}

var (
	// **Phase N: Description** (bold inline)
	boldPhaseRe = regexp.MustCompile(`^\*\*Phase\s+(\d+):\s*(.+?)\*\*$`)
	// ### Phase N: Description (heading level 3)
	headingPhaseRe = regexp.MustCompile(`^###\s+Phase\s+(\d+):\s*(.+)$`)
	// Numbered list item: "N. text"
	numberedItemRe = regexp.MustCompile(`^(\d+)\.\s+(.+)$`)
	// Sub-item: indented text under a numbered item
	subItemRe = regexp.MustCompile(`^\s+[-*]\s+(.+)$`)
	// Independence keywords in description or task text
	independentRe = regexp.MustCompile(`(?i)(independent of|no dependency)`)
)

func stripFrontmatter(content string) string {
	if !strings.HasPrefix(content, "---\n") {
		return content
	}
	rest := content[4:]
	end := strings.Index(rest, "\n---\n")
	if end < 0 {
		if strings.HasSuffix(rest, "\n---") {
			return ""
		}
		return content
	}
	return rest[end+5:]
}

func parsePhases(content string) []Phase {
	body := stripFrontmatter(content)
	lines := strings.Split(body, "\n")

	var phases []Phase
	var current *Phase
	var lastTaskIdx int

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Check for phase markers
		if m := boldPhaseRe.FindStringSubmatch(trimmed); m != nil {
			num, _ := strconv.Atoi(m[1])
			phases = append(phases, Phase{Phase: num, Title: m[2], Tasks: []string{}, Deps: nil})
			current = &phases[len(phases)-1]
			lastTaskIdx = -1
			continue
		}
		if m := headingPhaseRe.FindStringSubmatch(trimmed); m != nil {
			num, _ := strconv.Atoi(m[1])
			phases = append(phases, Phase{Phase: num, Title: m[2], Tasks: []string{}, Deps: nil})
			current = &phases[len(phases)-1]
			lastTaskIdx = -1
			continue
		}

		if current == nil {
			continue
		}

		// Check for sub-items before numbered items (indented lines)
		if m := subItemRe.FindStringSubmatch(line); m != nil && lastTaskIdx >= 0 {
			current.Tasks[lastTaskIdx] += " — " + m[1]
			continue
		}

		// Check for numbered list items
		if m := numberedItemRe.FindStringSubmatch(trimmed); m != nil {
			current.Tasks = append(current.Tasks, m[2])
			lastTaskIdx = len(current.Tasks) - 1
			continue
		}
	}

	// Compute dependencies
	for i := range phases {
		phases[i].Deps = computeDeps(phases, i)
	}

	return phases
}

func computeDeps(phases []Phase, idx int) []int {
	p := phases[idx]

	// Check title for independence markers
	combined := p.Title
	for _, t := range p.Tasks {
		combined += " " + t
	}

	if independentRe.MatchString(combined) {
		return []int{}
	}

	// Default: depends on previous phase
	if idx == 0 {
		return []int{}
	}
	return []int{phases[idx-1].Phase}
}

const usage = `Usage: phases [FILE]

Parse phase markers from a plan markdown file and output JSON.

Reads from FILE if given, or stdin if piped. Recognizes:
  **Phase N: Description**    (bold inline)
  ### Phase N: Description    (heading level 3)

Collects numbered list items as tasks under each phase.
Detects dependency keywords ("independent of", "no dependency")
to override the default sequential dependency chain.

Output: JSON array of phases with number, title, tasks, and deps.`

func main() {
	if len(os.Args) > 1 && (os.Args[1] == "--help" || os.Args[1] == "-h") {
		fmt.Println(usage)
		return
	}

	var data []byte
	var err error

	if len(os.Args) > 1 {
		data, err = os.ReadFile(os.Args[1])
		if err != nil {
			fmt.Fprintf(os.Stderr, "phases: %v\n", err)
			os.Exit(1)
		}
	} else {
		info, statErr := os.Stdin.Stat()
		if statErr == nil && (info.Mode()&os.ModeCharDevice) == 0 {
			data, err = io.ReadAll(os.Stdin)
			if err != nil {
				fmt.Fprintf(os.Stderr, "phases: reading stdin: %v\n", err)
				os.Exit(1)
			}
		}
	}

	phases := parsePhases(string(data))
	if phases == nil {
		phases = []Phase{}
	}

	out, err := json.MarshalIndent(phases, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "phases: %v\n", err)
		os.Exit(1)
	}
	fmt.Println(string(out))
}
