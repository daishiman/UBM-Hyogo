# Phase 11 — Discovered Issues

## 検出事項

| ID | 内容 | 対応 |
| --- | --- | --- |
| P11-001 | dev Bearer token がヘッダ条件なしで有効だった | `x-ubm-dev-session: 1` が無い request では無効化 |
| P11-002 | Phase 11 固定成果物名が不足していた | `manual-test-checklist.md`, `manual-test-result.md`, `discovered-issues.md`, `screenshot-plan.json` を追加 |

## 未タスク化済み

- cross-isolate rate limit は将来タスク。
- admin queue の resolved metadata は 07a / 07c で扱う。
