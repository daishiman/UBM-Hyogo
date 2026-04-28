# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 6 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 5 (実装ランブック) |
| 下流 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

型 / zod / Forms client の異常系 18 ケースを列挙し、各ケースで test と挙動を確定する。不変条件 #1/#2/#3/#5/#6/#7 のうち trigger される項目を明示する。

## 実行タスク

1. 18 failure case 列挙
2. 期待挙動 + test ID
3. 不変条件 trigger
4. outputs/phase-06/main.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-strategy.md | test 軸 |
| 必須 | CLAUDE.md | 不変条件 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 7 | AC matrix |
| 11 | manual smoke |

## 多角的チェック観点（不変条件参照）

- **#1**: schema 変更検出
- **#2**: consent key normalizer 動作
- **#3**: responseEmail system field 性
- **#5**: ESLint boundary 違反検出
- **#6**: GAS prototype field の侵入検出
- **#7**: branded type 互換性違反検出

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 18 case | 6 | pending |
| 2 | 挙動 | 6 | pending |
| 3 | 不変条件 trigger | 6 | pending |
| 4 | outputs | 6 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-06/main.md |
| ドキュメント | outputs/phase-06/failure-modes.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 18 case + 期待挙動 + 不変条件 trigger 確定

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-06/ 2 ファイル
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 7
- 引き継ぎ事項: failure modes
- ブロック条件: case 漏れ

## 18 異常系ケース

### 型レイヤ（5 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 1 | `MemberId` を `ResponseId` 引数に渡す | tsc error TS2322 | #7 |
| 2 | `viewmodel/SessionUser` から `email` 削除 | consumer tsc error | #1 |
| 3 | `FormResponse.responseEmail` が `string` ではなく `ResponseEmail` でないと代入不可 | tsc error | #3 |
| 4 | `FormSchema.sections` に specific question 名 hardcode 試行 | tsc error（型に存在しない） | #1 |
| 5 | `MemberIdentity` に `profileOverrides` 追加 | tsc error（型に存在しない） | #4 補強 |

### zod レイヤ（7 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 6 | 必須 31 項目のうち 1 つ欠損 → parse | ZodError throw | #1 |
| 7 | email 不正形式 → parse | ZodError | #3 |
| 8 | `responseId` 空文字 → parse | ZodError | #7 |
| 9 | consent: `shareInfo: true` のみ → normalize | `publicConsent: true` に統一 | #2 |
| 10 | consent: 全旧キー混在 → normalize | 新キーで上書き、旧キー drop | #2 |
| 11 | viewmodel parse: 余剰フィールド | strict で reject | #1 |
| 12 | GAS prototype 由来 `companyType` 値 → parse | enum unknown で reject | #6 |

### Forms client レイヤ（4 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 13 | auth: JWT 署名失敗（鍵不正） | error throw, redact secret | secret hygiene |
| 14 | getForm: 401 → token refresh → 401 | error throw（無限ループ防止） | #5 |
| 15 | listResponses: 429 連続 5 回 → maxRetry 到達 | error throw, retry log 記録 | #5 |
| 16 | listResponses: 5xx 連続 5 回 → maxRetry 到達 | error throw | #5 |

### ESLint レイヤ（2 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 17 | `apps/web/page.tsx` から `@ubm/integrations/google` import | ESLint error | #5 |
| 18 | `apps/web/page.tsx` から `apps/api/handler` import | ESLint error | #5 |

## 不変条件 trigger summary

| 不変条件 | trigger ケース |
| --- | --- |
| #1 | 1, 2, 4, 6, 11 |
| #2 | 9, 10 |
| #3 | 3, 7 |
| #4 | 5 |
| #5 | 14, 15, 16, 17, 18 |
| #6 | 12 |
| #7 | 1, 8 |
