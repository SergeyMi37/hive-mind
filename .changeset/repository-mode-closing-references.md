---
'@link-assistant/hive-mind': patch
---

Repository mode no longer merges a pull request that leaves the listed issues open (#2306): issues still attached to a stale combined issue are moved with `replace_parent`, the closing references required by the combined issue body are checked together with native sub-issues, `--auto-merge` is held back while any of them is missing, and the log is uploaded again after post-solve restart iterations.

Also refreshes the CI-enforced dependency pins (use-m 8.16.4, command-stream 1.1.0, links-notation 0.21.3, secretlint 13.0.6, lint-staged 17.6.0, Formal AI 0.352.1) and adapts command result handling to command-stream 1.x, whose `stdout`/`stderr` are always-truthy stream objects.
