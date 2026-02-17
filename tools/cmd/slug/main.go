package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var (
	stripWords = map[string]bool{
		// articles
		"a": true, "an": true, "the": true,
		// filler
		"for": true, "with": true, "and": true, "or": true,
		"to": true, "in": true, "of": true, "on": true,
		"by": true, "is": true, "it": true, "be": true,
		"as": true, "at": true, "do": true,
	}

	nonAlnum       = regexp.MustCompile(`[^a-z0-9]+`)
	multiHyphen    = regexp.MustCompile(`-{2,}`)
	maxSlugLen     = 50
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

const usage = `Usage: slug [TOPIC ...]

Generate a URL-safe kebab-case slug from a topic string.

Arguments are joined into a single string, so quoting is optional:
  slug refactor auth module    # refactor-auth-module
  slug "refactor auth module"  # same result

Articles (a, an, the) and common filler words are stripped.
Output is truncated to 50 characters on a word boundary.`

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--help" {
		fmt.Println(usage)
		return
	}

	if len(os.Args) < 2 {
		return
	}

	input := strings.Join(os.Args[1:], " ")
	result := slug(input)
	if result != "" {
		fmt.Println(result)
	}
}
