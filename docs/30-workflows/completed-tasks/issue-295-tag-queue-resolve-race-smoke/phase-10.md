# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 10 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 10 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-10/main.md

## 完了条件

- [x] Phase 10 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 10 — 最終レビュー

[実装区分: 実装仕様書]

## 不変条件レビュー

| # | 条件 | 本タスクでの遵守 |
| --- | --- | --- |
| #5 | `apps/web` から D1 直接アクセス禁止 | smoke script は `apps/api` の HTTP endpoint 経由のみで D1 にアクセス。直接 D1 binding を持たない |
| `wrangler` 直接禁止 | `scripts/cf.sh` ラッパー利用 | Phase 11 副作用確認 SQL は `bash scripts/cf.sh d1 execute` を使う |
| test 命名 #8 | `*.test.{ts,tsx}` 禁止 | 本タスクの新規 test は `.test.sh`（shell test）。.ts/.tsx は新規追加なし |
| `.env` 実値読み取り禁止 | session cookie は `op://` 経由で取得し引数で渡す。`.env` 読み込みなし |

## secrets レビュー

- evidence JSON / stdout に cookie / token 含まれないこと（`redact()` で保証、Phase 09 で grep 検証）
- README / 仕様書にも実値を記載しない（`op read 'op://Vault/Staging/admin_cookie'` の参照のみ）

## スコープレビュー（CONST_007）

- 本サイクル内で実装・shell test・README・staging 実行・evidence 保存・Phase 12 ドキュメント更新まで完了する
- 先送り項目: なし（CI 化は明示的に out-of-scope）

## AC レビュー

- AC-1〜AC-5 が Phase 02 設計 / Phase 04 テスト / Phase 11 手動 smoke で全てカバーされる
- AC-4 のみ手動 SQL 確認（script 範疇外）。これは不変条件 #5 のため許容

## 残課題

- なし

## 成果物

- `outputs/phase-10/main.md`

## 次 Phase

- [phase-11.md](./phase-11.md): 手動 smoke（staging 実行）
