BINDIR := bin
CMDS := $(notdir $(wildcard cmd/*))

.PHONY: all clean

all: $(CMDS:%=$(BINDIR)/%)

$(BINDIR)/%: cmd/%/main.go
	@mkdir -p $(BINDIR)
	go build -o $@ ./cmd/$*

clean:
	rm -rf $(BINDIR)
