# Unassigned Task Detection

## Summary

Detected downstream task candidates: 4 → formalized as 3 unassigned-task specs + 3 GitHub Issues (2026-05-27 update; candidate 1 と candidate 4 を followup-001 に統合)。

これらは現サイクルの隠れた未実装ではなく、いずれも API contract / storage contract / 製品スコープの変更を伴う「実装漏れではない next wave」である。本サイクルは UI placeholder で coherent に着地させた上で、各候補を spec + Issue に formalize した。

## Candidates → Formalized

| Candidate | Reason current cycle cannot complete | Formalized spec / Issue |
| --- | --- | --- |
| list response `zone` / `tags` / `occupation` enrichment | shared schema + apps/api SELECT 拡張 / N+1 設計が必要 | `docs/30-workflows/unassigned-task/admin-members-prototype-redesign-followup-001-list-response-enrichment.md` / #981 |
| list-zone chip rendering from real data | 上記 enrichment 依存 | followup-001 に統合 / #981 |
| persisted Drawer tag pill editing | tag write endpoint + audit + idempotency-key 配線が必要 | `docs/30-workflows/unassigned-task/admin-members-prototype-redesign-followup-002-drawer-tag-pill-editing.md` / #982 |
| photo-backed avatar rendering | photo URL / storage contract (R2 + 署名付き URL) 未確定 | `docs/30-workflows/unassigned-task/admin-members-prototype-redesign-followup-003-photo-backed-avatar.md` / #983 |

## Current-cycle resolution

The current implementation spec resolves the user-facing gap without pretending these contracts exist:

- hue is derived by deterministic memberId hash;
- list-only missing values render placeholders;
- drawer remains the detail source;
- disabled tag pills avoid false persistence affordances.

## Formalization summary

- 未タスク spec: 3 件 (`docs/30-workflows/unassigned-task/admin-members-prototype-redesign-followup-{001,002,003}-*.md`)
- GitHub Issue: 3 件 (#981 / #982 / #983) — `type:followup` + `wave:2-plus` + `unassigned` + 優先度 / scale / area ラベル付与済み
- 苦戦箇所 (将来の参照用) は各 spec の「苦戦箇所」節と Issue 本文に二重記録済み

## Verification (2 cycles)

- 1 回目: workflow Phase 12 outputs + apps/web Phase 11 evidence から 4 候補を抽出
- 2 回目: 独立 grep (TODO/FIXME/describe.skip/test.skip) で 0 件、関連 OPEN issue は今回起票分 (#981/#982/#983) のみ、追加 hidden 候補なし

## Formalization boundary

3 候補は本ワークフローの不変条件 (no API endpoint / shared schema / D1 / storage 変更) の外側にあるが、wave:2-plus として明示的に formalize した。実装着手は別ワークフロー / 別 PR で行う。
