# Phase 9 — Risks and Mitigations

| # | リスク | 影響 | 緩和策 |
|---|--------|------|--------|
| R1 | `patterns-lessons-and-pitfalls.md` への 2 entry 追加が `server-component-e2e-pattern.md` 等と重複し drift の温床になる | 中 | cross-link 1 行 entry に留め、本文は専用 reference を SSOT として参照させる |
| R2 | Phase 10 spec の文言 backfill が `outputs/phase-12/implementation-guide.md` の判断記録と整合しなくなる | 低 | implementation-guide.md は read-only 参照とし、本 backfill は spec 本体の戦略B採用と整合する方向のみ | 
| R3 | unassigned-task を consumed 化することで `unassigned-task pre-flight gate` の集計が変化 | 低 | `bash scripts/verify-pr-ready.sh` が一括検証するため事後に必ず実行 |
| R4 | `verify:phase12-compliance` の canonical 9 headings 違反で fail | 中 | Phase 12 spec で SSOT に逐語準拠（番号 1..9 / 見出しテキスト固定） |
| R5 | Issue #884 を誤って close してしまう | 中 | ユーザー明示指示により OPEN のまま保持。`gh issue close` は実行禁止 |
| R6 | indexes drift で CI fail | 低 | T5 で `pnpm indexes:rebuild` を実行し drift 0 を確認 |
