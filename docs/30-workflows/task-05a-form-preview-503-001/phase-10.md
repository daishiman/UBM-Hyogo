# Phase 10: 最終レビュー — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 10 / 13 |
| wave | 05a-followup |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

AC-1〜AC-6 の充足判定、blocker / MINOR の切り分け、未タスク化判断を実施し、Phase 11 へ進める GO/NO-GO を出す。

## AC 判定基準

| AC | 内容 | 判定方法 | GO 条件 |
| --- | --- | --- | --- |
| AC-1 | staging `GET /public/form-preview` が 200 | curl 実測 | HTTP 200 + JSON `{ schemaVersion, questions[] }` shape |
| AC-2 | production `GET /public/form-preview` が 200 維持 | curl 実測 | HTTP 200 |
| AC-3 | staging `/register` が 200 | curl 実測 | HTTP 200 |
| AC-4 | use-case test の null / 正常 両ケース green | `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` | 全 PASS |
| AC-5 | implementation-guide.md に Part 1（中学生レベル）+ Part 2（技術詳細）両方 | Phase 12 成果物確認 | 両 Part 存在・内容 |
| AC-6 | Phase 12 strict 7 files が揃う | outputs/phase-12 ファイル一覧 | `main.md` + 6 補助成果物すべて実在 |

## blocker / MINOR の切り分け

| 区分 | 例 | 対応 |
| --- | --- | --- |
| **blocker** | staging 503 が再現する / `schema_versions` 投入失敗 / typecheck・lint・test の失敗 | Phase 11 進行不可。Phase 5 へ戻し再修復 |
| **MINOR** | structured logging 採否のみ未確定 / line budget が 5% 以内で超過 | Phase 11 進行可。後追い対応で OK |
| **未タスク化対象** | production schema sync 自動化 / 全 public route の structured logging 統一 | `unassigned-task-detection.md` に記録、別タスク化判断 |

## 実行タスク

1. AC-1〜AC-6 の evidence path と判定基準を確認する。
2. blocker / MINOR / 未タスク化の切り分けを `outputs/phase-10/main.md` に記録する。
3. Phase 11 へ進める GO / NO-GO を判定する。

## 参照資料

- `outputs/phase-09/main.md`
- `outputs/phase-08/main.md`
- `index.md`（AC 一覧）
- `packages/shared/src/errors.ts`

## 実行手順

- 仕様書段階では実判定を行わず、判定基準と GO/NO-GO テンプレを固定する。
- 実装サイクルで Phase 9 結果を踏まえて outputs/phase-10/main.md に判定結果を埋める。

## 統合テスト連携

- 上流: Phase 9 品質保証
- 下流: Phase 11 手動テスト

## 多角的チェック観点

- 不変条件 #1 / #5 / #14
- production への影響範囲が AC-2 で担保されているか
- staging 修復手順が再現可能か（runbook 化）

## サブタスク管理

- [ ] AC 判定表が完成
- [ ] blocker / MINOR / 未タスク化の切り分けが記録される
- [ ] GO/NO-GO 判定が出る
- [ ] outputs/phase-10/main.md を作成する

## 成果物

- `outputs/phase-10/main.md`

## 完了条件

- AC-1〜AC-6 すべて GO
- blocker 0 件

## タスク100%実行確認

- [ ] 必須セクション充足
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、AC 判定表と curl 実測予定 URL を渡す。
