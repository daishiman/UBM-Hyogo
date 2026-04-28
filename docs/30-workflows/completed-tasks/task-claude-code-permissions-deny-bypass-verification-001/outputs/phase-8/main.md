# Phase 8 Output: リファクタリング

## 実施内容

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 目的 | 実効性を本タスクで確定 | 確定条件と runbook を仕様化 | spec_created と整合 |
| force push | `git push --force` | `git push --dry-run --force` | safety |
| AC 表現 | 達成済み表現 | covered / queued | 未実行との混同防止 |

## 判定

全面破棄は不要。既存 Phase 構成を活かす部分再構成で十分。
