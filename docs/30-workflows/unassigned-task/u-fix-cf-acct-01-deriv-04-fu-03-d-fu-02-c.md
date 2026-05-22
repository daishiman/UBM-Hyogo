# U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-C: Rotation Evidence Long-Term Retention

## 苦戦箇所

GitHub Actions artifact retention is not a durable audit store. Rotation decisions may need to be reviewed after the default retention window, especially when false positives appear weeks later.

## リスクと対策

| リスク | 対策 |
| --- | --- |
| evidence expires before review | copy redacted summaries to the approved long-term store |
| raw dataset is accidentally retained | retain summaries and hashes only; forbid raw feature JSONL |
| R2 retention path conflicts with cold storage | reuse Issue #514 partitioning style with a separate prefix |

## 検証方法

- Produce a redacted evidence manifest.
- Confirm retention copy excludes raw dataset files.
- Run leakage grep against retained objects or their local staging directory before upload.

## スコープ

Includes retention policy and storage path design. Excludes changing Issue #514 cold-storage exporter behavior unless explicitly approved.

