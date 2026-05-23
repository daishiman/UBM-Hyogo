[実装区分: 実装仕様書]

# Phase 11: NON_VISUAL local PASS 5 点セット取得

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-11/main.md` |
| visualEvidence | NON_VISUAL |
| ui_routes | `[]`（API smoke evidence と同等の static analysis evidence） |

## テスト方式

本タスクは UI を持たず、CI gate / static analysis のみ。Phase 11 evidence は
NON_VISUAL local PASS 5 点セットを **canonical path** `outputs/phase-11/evidence/` に固定する。

## 必須 outputs

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 index（テスト方式 / 必須 outputs リンク） |
| `outputs/phase-11/manual-smoke-log.md` | 実行コマンド / 期待 / 実測 / PASS-FAIL テーブル |
| `outputs/phase-11/link-checklist.md` | spec ↔ script ↔ workflow ↔ fixture 参照リンクチェック |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm typecheck` 出力 |
| `outputs/phase-11/evidence/lint.log` | `pnpm lint` 出力（`lint-stable-key-update --strict` を含むチェーン） |
| `outputs/phase-11/evidence/test.log` | `pnpm test -- scripts/lint-stable-key-update.spec.ts` 出力 |
| `outputs/phase-11/evidence/build.log` | `pnpm build` 出力 |
| `outputs/phase-11/evidence/grep-gate.log` | `node scripts/lint-stable-key-update.mjs --strict` 出力 |

## manual-smoke-log.md 必須メタ

- 証跡の主ソース: vitest 件数（最低 12 ケース PASS）+ guard script `[stable-key-update-lint] OK`
- screenshot を作らない理由: `NON_VISUAL`（CI gate / static analysis）
- 実行日時 / branch 名

## link-checklist.md 最小項目

- `index.md` → `phase-{01..13}.md` の参照
- `phase-12.md` → `outputs/phase-12/*.md` の参照
- guard script (`scripts/lint-stable-key-update.mjs`) → fixture (`scripts/__fixtures__/stable-key-update-lint/`) の参照
- spec (`scripts/lint-stable-key-update.spec.ts`) → guard script の参照
- docs (`database-implementation-core.md`) → guard script の参照
- CI workflow (`verify-stable-key-update.yml`) → guard script の参照

## 状態語彙

- `apps/` 配下に dead code 削除差分があり、local PASS 5 点が揃った場合: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（CI runtime は Phase 13 PR で取得）
- 仕様書のみで code 差分がない場合（spec_created 単独）: `CONTRACT_READY_IMPLEMENTATION_PENDING`

> 本タスクは spec 承認後の同一サイクル内で code 反映を行う前提のため、運用上は **local 実装後 → `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`** を採用する。

## 完了条件

- [ ] 5 点 evidence log が `outputs/phase-11/evidence/` に存在
- [ ] `manual-smoke-log.md` に主証跡（vitest 件数 / guard 出力）記録
- [ ] `link-checklist.md` がすべて OK
- [ ] 状態語彙が `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` または `CONTRACT_READY_IMPLEMENTATION_PENDING` のいずれかで明示

## 次Phase

Phase 12（documentation）
