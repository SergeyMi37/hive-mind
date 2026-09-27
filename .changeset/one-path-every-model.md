---
'@link-assistant/hive-mind': patch
---

Run every model through one code path (#2320). A deliberate draft restarts the AI instead of stopping after fake restores (#2312). Restart feedback names the uncommitted files, and Formal AI no longer has a private prompt dialect (#2313). `--tool agent` keeps gh auth (#2314). Critical-error recovery pushes to `recovery/<branch>`, never to the PR branch (#2315). The repeated-tool-call breaker covers every adapter (#2316). Attribution identity is read only from generation records (#2317). The PR Changes section is regenerated from the diff after every session (#2318). A manual Hello World end-to-end matrix is added (#2319).
