---
'@link-assistant/hive-mind': minor
---

Formal AI no longer costs disk, bandwidth or CPU on hosts that do not use it (#2305). The ~24 GB sidecar image is pulled by the first `--model formal-ai` task instead of in advance. Updates are checked hourly, and only while the image is present and was used within the unload window. The registry manifest digest is compared before any pull, so an unchanged release downloads nothing. A verified update removes the image it replaced. After `HIVE_MIND_FORMAL_AI_UNLOAD_AFTER` (default `5h`) without a Formal AI task, the sidecar container, its network and every Formal AI image are removed under the sidecar lock, and the log reports the bytes freed. The `hive-mind-formal-ai-memory` volume is always kept. The sidecar mounts tmpfs over its image `VOLUME`s and is removed with `--volumes`, so it no longer leaks anonymous volumes. `HIVE_MIND_FORMAL_AI_PREFETCH=true` restores eager pulling and updating.
