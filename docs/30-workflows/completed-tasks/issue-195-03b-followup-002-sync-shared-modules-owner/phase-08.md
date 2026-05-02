# Phase 8: 受け入れテスト（AC 検証）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 8 / 13 |
| --- | --- |
| 前 Phase | 7 |
| 次 Phase | 9（品質ゲート） |
| 状態 | completed |

## AC トレーサビリティ

| AC | 検証元 Phase | 検証コマンド | 期待 |
| --- | --- | --- | --- |
| AC-1 | Phase 6 U-1 | `find docs/30-workflows/_design -maxdepth 1 -type f -name '*.md' \| wc -l` | `>= 2` |
| AC-2 | Phase 6 U-2 | 5 列ヘッダ grep | 1 件 hit |
| AC-3 | Phase 6 U-3 | `_shared/` 行 grep | `>= 3` |
| AC-4 | Phase 7 I-1, I-2, I-3 | grep + 相対パス解決 | すべて exit 0 |
| AC-5 | Phase 6 U-4 | 変更ルール 4 項目 grep | `>= 4` |
| AC-6 | Phase 6 U-5 / 関連未割当節 grep | `grep -F '関連未割当' docs/30-workflows/_design/sync-shared-modules-owner.md` | 1 件以上 hit |
| AC-7 | Phase 9 secret hygiene | `grep -rE '(CLOUDFLARE_API_TOKEN=\|OAUTH_SECRET=\|sk-[A-Za-z0-9]{20,})' docs/30-workflows/_design/` | 0 件 |

## DoD

- AC-1〜AC-12 全項目 PASS
- `outputs/phase-08/acceptance.log` に各 AC ごとの実コマンド出力を記録

## 成果物

- `outputs/phase-08/acceptance.log`

## 完了条件

- 全 AC PASS

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
