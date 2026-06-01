# Phase 3: 設計レビュー（ゲート）

## 3.1 一次結論（4条件評価）

| 条件 | 評価 | 根拠 |
|------|------|------|
| **価値性** | ✅ | 完了タスク台帳・dashboard・close-out audit の status 一貫性を回復し、後続 audit の手戻りコストを下げる |
| **実現性** | ✅ | 補正対象は 6 ファイル・JSON 値と checkbox のみ。1 サイクルで完了可能（CONST_007 充足）|
| **整合性** | ✅ | 整合先 state（`implemented_local_runtime_pending` + Gate-A/B passed + Gate-C pending）は issue-976 等の既存完了タスクと同一規約。構造変更なし |
| **運用性** | ✅ | `gate-metadata:validate` / `verify:phase12-compliance` / `jq` parity で機械検証可能 |

> **判定: Phase 4 へ進める（PASS）**

## 3.2 リスクと対策

| リスク | 対策 |
|--------|------|
| Phase 13 まで `completed` にして user-gated 境界を侵す | Phase 13 は `pending`、Gate-C は `pending` を明示維持（AC-2 / AC-6）|
| root と outputs/artifacts.json が diverge する | 補正後 `diff -u` で parity 0 を DoD 化（AC-3）|
| sub-task の phase status 表記不統一（`spec_created` 値混在）を見落とす | Phase 2 で `completed`/`pending` への正規化方針を固定（補正3）|
| gate `passed` に補正したが evidence path が実在しない | evidence path は既存の Phase 12 strict 7 / Phase 11 ファイルを指す。`gate-metadata:validate` が path 実在を検査するため、存在確認後にのみ `passed` 化 |
| aiworkflow register を誤って書き換える | register は既に `implemented_local_runtime_pending` 記載のため原則 no-op。`rg` で確認のみ |
| 実装コードや evidence を誤って変更 | 補正対象は status フィールドと checkbox のみ。`git status apps/` で apps/ 差分 0 を検証（不変条件）|

## 3.3 因果ループ

- **バランスループ（解消対象）**: status 放置 → 台帳 drift → audit 手戻り → 再度 status 確認…
  本タスクが artifacts を current facts に同期することでループを断つ。
- **強化ループ（防止）**: 1 サイクルで 6 ファイルを同 wave 補正し、parity / gate-metadata で
  即検証することで「部分補正による新たな drift」の連鎖を防ぐ。

## 3.4 docs-only 妥当性の再確認（CONST_004）

Phase 1 の判定（ドキュメントのみ）を再確認した。対象 6 ファイルはいずれも
`docs/30-workflows/` 配下の tracking メタデータ / レビュー文書であり、`apps/` のコード変更を
含意する目的はない。実装は既に存在・マージ済みのため「動作させる」目的も発生しない。
よって docs-only 判定を維持する。

## 3.5 Phase 4 への申し送り

- 検証は「補正後に満たすべき状態」を assert する read-only コマンド群として設計する
  （TDD RED 相当の事前 fail 確認も含む）。
- 補正実行（Phase 5 相当）は user-gated。本仕様書は手順と DoD を確定させるところまで。
