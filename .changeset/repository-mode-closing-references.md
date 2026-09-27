---
'@link-assistant/hive-mind': patch
---

Repository mode no longer merges a pull request that leaves the listed issues open (#2306): issues still attached to a stale combined issue are moved with `replace_parent`, the closing references required by the combined issue body are checked together with native sub-issues, `--auto-merge` is held back while any of them is missing, and the log is uploaded again after post-solve restart iterations.
