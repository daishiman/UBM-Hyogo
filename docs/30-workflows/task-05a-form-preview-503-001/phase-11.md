# Phase 11: 手動テスト（NON_VISUAL）— task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 11 / 13 |
| wave | 05a-followup |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| タスク種別 | API endpoint HTTP status verification |
| 非視覚的理由 | UI 変更なし。HTTP status と JSON shape の検証で AC が完結する |
| 代替証跡 | curl 実測ログ + vitest PASS 件数（PASS 内訳含む） |

## 目的

`/public/form-preview` の 503 修復を staging / production の HTTP status 実測と、API test の green 結果で検証する。スクリーンショットは作らない。

## NON_VISUAL 宣言

本 Phase は **NON_VISUAL** タスクです。

- **タスク種別**: API endpoint HTTP status verification（HTTP ステータス・JSON shape の検証）
- **非視覚的理由**: 今回の修復は backend D1 データ整合と use-case 分岐の問題であり、UI 表示の変更を伴わない。`/register` page も既存挙動の status code 確認のみで AC-3 が達成される。
- **代替証跡**:
  1. `curl -s -o /dev/null -w "%{http_code}\n"` による HTTP status 実測ログ
  2. `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` の vitest PASS 件数 + 出力サマリ
  3. 必要に応じ `curl -s ... | jq '. | keys'` で JSON shape を確認
- **screenshots/.gitkeep を作らない**: NON_VISUAL のため `outputs/phase-11/screenshots/` ディレクトリ自体を作成しない。Feedback 4 に従い、本宣言と代替証跡をもって視覚証跡の代替とする。

## 実行タスク

1. staging API の HTTP status を実測する。完了条件: 200 を確認しログを保存。
2. production API の HTTP status を実測する。完了条件: 200 を確認しログを保存。
3. staging `/register` page の HTTP status を実測する。完了条件: 200 を確認。
4. vitest 結果を保存する。完了条件: 全 PASS の出力を貼付。

## 検証コマンド

```bash
# AC-1: staging API
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview

# AC-2: production API（URL は実測前に確定する）
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview

# AC-3: staging /register page
curl -s -o /dev/null -w "%{http_code}\n" \
  https://<web-staging-domain>/register

# 補助: JSON shape
curl -s https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview \
  | jq '{ schemaVersion, questionCount: (.questions | length) }'

# AC-4: vitest
pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts
```

## 参照資料

- `index.md` AC-1〜AC-3
- `outputs/phase-09/main.md` test 結果
- `outputs/phase-12/implementation-guide.md` runbook 部

## 実行手順

- 仕様書段階では実コマンドを叩かない。
- 実装サイクルで上記コマンドを実行し、`outputs/phase-11/manual-test-result.md` に出力を貼り付ける。

## 統合テスト連携

- 上流: Phase 10 GO 判定
- 下流: Phase 12 ドキュメント更新

## 多角的チェック観点

- 不変条件 #1 / #5 / #14
- production 200 維持（regress 検知）
- 503 → 200 の変化が D1 投入の前後で再現可能

## サブタスク管理

- [ ] staging API curl 結果記録
- [ ] production API curl 結果記録
- [ ] staging /register curl 結果記録
- [ ] vitest 結果記録
- [ ] outputs/phase-11/manual-test-result.md 完成

## 成果物

- `outputs/phase-11/manual-test-result.md`

## 完了条件

- 上記 4 件の証跡がすべて記録される
- スクリーンショットを作成していない（NON_VISUAL 宣言遵守）

## タスク100%実行確認

- [ ] 必須セクション充足
- [ ] NON_VISUAL 宣言の 3 要素（種別/理由/代替証跡）が冒頭に記載
- [ ] screenshots/ ディレクトリを作っていない

## 次 Phase への引き渡し

Phase 12 へ、curl 実測 evidence と vitest サマリを渡す。
