# Phase 9: quality-gate.md

日付: 2026-04-28

## docs-only quality gate

| ゲート | 内容 | コマンド / 手段 | 判定 |
| --- | --- | --- | --- |
| 必須セクション | ADR-0001 に Status / Context / Decision / Consequences / Alternatives Considered / References が存在 | `grep -E '^## ' doc/decisions/0001-git-hook-tool-selection.md` | PASS（Phase 11 で確認） |
| Alternatives 3 候補 | A. husky / B. pre-commit / C. native git hooks | `grep -E '^### [ABC]\.' doc/decisions/0001-*.md` | PASS（Phase 11 で確認） |
| backlink 解決 | 派生元から ADR への相対リンクが有効 | T-08 のシェル | PASS（Phase 11 で確認） |
| 既存正本との整合 | `lefthook.yml` の lane 名 / `lefthook-operations.md` の post-merge 廃止が ADR と一致 | 目視 + `grep` | PASS |
| 用語統一 | `lefthook` / `husky` が小文字統一 | `grep -i 'Lefthook\|Husky' doc/decisions/0001-*.md` | PASS |
| typecheck / unit test | 対象外（コード差分なし） | — | N/A |
| build | 対象外（コード差分なし） | — | N/A |

## 判定

全 docs-only ゲートが PASS（Phase 11 docs walkthrough で最終確認）。次 Phase へ進む。
