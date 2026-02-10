---
name: gt
description: >
  Graphite branch management commands.
  Triggers: /gt, "restack", "show stack", "gt log".
allowed-tools: Bash
argument-hint: "restack | log | up | down | checkout"
---

# Graphite Operations

Parse `$ARGUMENTS` and run corresponding command:

| Arg        | Command              |
|------------|----------------------|
| restack    | `gt restack --only`  |
| log        | `gt log`             |
| up         | `gt up`              |
| down       | `gt down`            |
| checkout   | `gt checkout`        |
| *(empty)*  | `gt log`             |

Show output to user.
