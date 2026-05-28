# Phase 10 — 最終レビュー

[実装区分: 実装仕様書]

## 1. AC 充足チェック

Phase 1 §3 の AC-1〜AC-12 をすべて再走確認し、結果を `outputs/phase-11/ac-trace.md` に記録する。

| AC | 検証手段 | 期待 |
| --- | --- | --- |
| AC-1 (page-head) | DOM スナップショット + visual baseline mobile/laptop | prototype 同等 |
| AC-2 (FilterCard) | PillNav unit + URL 同期 spec | filter enum マッピング正常 |
| AC-3 (table 列) | MembersTable unit + visual | 8 列描画 |
| AC-4 (drawer 4セクション) | MemberDrawer unit + a11y | DOM 4 セクション存在 |
| AC-5 (publish mutation) | unit + manual | 楽観更新 + rollback |
| AC-6 (delete mutation) | unit + manual | confirm 後 mutation |
| AC-7 (HEX 0 件) | `verify-design-tokens` | exit 0 |
| AC-8 (FormField) | grep `<input ` / `<textarea ` not under FormField | 0 件 |
| AC-9 (200) | staging curl | 200 OK |
| AC-10 (Playwright 16 PNG) | `outputs/phase-11/screenshots/` | 16 PNG present (or env-gated 注記) |
| AC-11 (a11y) | jest-axe | 0 violation |
| AC-12 (typecheck/lint/build/test) | Phase 9 コマンド | 全 PASS |

## 2. リスク残ログ

- スコープ外として明示した followup-004 候補（list response tags 拡張 / tag pill write / avatar 画像 / zone chip list 列表示）を `outputs/phase-12/unassigned-task-detection.md` に記録（理由付きで明確に "本サイクル out-of-scope" マーク）

## 3. 4-condition verdict

実装完了後の判定は `outputs/phase-12/phase12-task-spec-compliance-check.md` に同期済み。2026-05-27 時点では local implementation + Phase 11 evidence 取得済み、外部操作のみ user-gated boundary とする。

- **Condition 1 — task spec readiness**: PASS（Phase 1-13 + strict 7 present）
- **Condition 2 — implementation completed**: PASS（Lane A〜D 対象の web 実装・adapter・shared primitive・member util 反映済み）
- **Condition 3 — local evidence captured**: PASS（`outputs/phase-11/*` + 16 screenshots present）
- **Condition 4 — external ops boundary**: PASS_WITH_BOUNDARY（commit / push / PR / staging deploy は user-gated）

現在の workflow_state: `implemented_local_evidence_captured`
