# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 8 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 8 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-08/main.md

## 完了条件

- [x] Phase 8 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 08 — DRY 化

[実装区分: 実装仕様書]

## 既存 `scripts/smoke/` 共通処理の再利用検討

| 既存資産 | 内容 | 本タスクでの利用 |
| --- | --- | --- |
| `scripts/smoke/provision-staging-secrets.sh` | 1Password から staging secrets を注入 | session cookie 取得手順は本 script 引数で受けるため非依存。runbook で `op read` 例示のみ |
| `scripts/smoke/runtime-attendance-provider.sh` | attendance smoke の shell wrapper | 構造を参考にする（set -euo pipefail / exit code 設計） |
| `scripts/smoke/ci-summary-post.sh` | CI summary 投稿 | 直接の依存なし。将来 CI 連携時に流用可能性あり |
| `scripts/smoke/__tests__/*.test.sh` | shell test 慣習 | テスト命名・assertion パターンを揃える |

## 本タスクで導入する共通要素

- なし。`tag-queue-race.mjs` 内に閉じる純関数で完結する。

## 将来の DRY 化候補（先送り）

- 複数 smoke で `redact()` / `writeEvidence()` を共有するなら `scripts/smoke/_lib/` に切り出す。今サイクルではスコープ外（CONST_007: 1 サイクル内で完結させるため、共通化前提の追加変更を増やさない）。

## 重複検査

- `analyzeResults` 相当のロジックは既存 smoke 群には存在しない（grep 確認は実装フェーズで実施）。
- HTTP fetch wrapper も既存 .mjs smoke にはない。新規 `fetch` 利用は本 script のみ。

## 成果物

- `outputs/phase-08/main.md`

## 次 Phase

- [phase-09.md](./phase-09.md): 品質保証
