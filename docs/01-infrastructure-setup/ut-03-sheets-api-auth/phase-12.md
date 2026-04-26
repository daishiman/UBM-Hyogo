# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke テスト) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

本タスク（UT-03）の実施内容をシステム仕様書・実装ガイドに反映し、同一 Wave（Wave 1）内のタスク仕様書との整合を確認する。
将来の開発者が `sheets-auth.ts` を迷わず使えるよう、実装ガイドを整備する。

## 中学生レベルの概念説明

**なぜドキュメント更新が必要か？**

コードを書いただけでは、3ヶ月後の自分や別の開発者が「どうやって使うの？」「なぜこう実装したの？」と迷ってしまう。
Phase 12 では「説明書の更新」を行う。料理レシピを作ったら、材料と手順を書き残すのと同じ感覚。

**same-wave sync ルールとは？**

同じタイミング（Wave 1）で進行中の他のタスク（UT-01, UT-02, UT-09）と、用語・設計方針・シークレット管理方法が矛盾していないかを確認するルール。
チームで同時に複数の工事をするとき、電気工事と水道工事の配管が干渉しないように調整するイメージ。

## 実行タスク

- `outputs/phase-12/implementation-guide.md` を作成する（sheets-auth.ts の使い方ガイド）
- `outputs/phase-12/system-spec-update-summary.md` を作成する（aiworkflow-requirements への反映内容）
- `outputs/phase-12/documentation-changelog.md` を作成する（変更履歴）
- `outputs/phase-12/unassigned-task-detection.md` を作成する（本タスク実施で発見した未アサインタスク）
- `outputs/phase-12/skill-feedback-report.md` を作成する（task-specification-creator skill へのフィードバック）
- `outputs/phase-12/phase12-task-spec-compliance-check.md` を作成する（Phase 12 同期ルール遵守確認）
- aiworkflow-requirements の参照先 spec を更新する
- same-wave sync（UT-01, UT-02, UT-09 との整合確認）を実施する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルールの正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | シークレット管理ルール（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | 環境変数管理ルール（更新対象） |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | 本タスクの全体概要 |
| 参考 | docs/01-infrastructure-setup/ut-01-sheets-d1-sync-design/index.md | Wave 1 同期確認（UT-01） |
| 参考 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | Wave 1 同期確認（UT-02） |
| 参考 | docs/01-infrastructure-setup/ut-09-sheets-d1-sync-job/index.md | Wave 1 同期確認（UT-09）|

## 実行手順

### ステップ 1: implementation-guide.md の作成

`outputs/phase-12/implementation-guide.md` として `sheets-auth.ts` の使い方ガイドを作成する。

必須記載項目：

```markdown
# sheets-auth.ts 実装ガイド

## 概要
（sheets-auth.ts が何をするモジュールか 3 行以内で説明）

## 前提条件
（Service Account の作成・スプレッドシート共有設定・シークレット登録手順）

## 基本的な使い方

### ローカル開発環境
（.dev.vars の設定例・wrangler dev の起動方法・動作確認コマンド）

### staging / production 環境
（wrangler secret put のコマンド例・デプロイ手順）

## API リファレンス

### `getAccessToken(env: Env): Promise<string>`
（引数・戻り値・エラー型の説明）

### `fetchSheetsData(env: Env, spreadsheetId: string, range: string): Promise<SheetsResponse>`
（引数・戻り値・エラー型の説明）

## エラーハンドリング
（よくあるエラーと対処法の一覧）

## シークレットローテーション手順
（Service Account の鍵を更新する場合の手順）

## 制約事項
（Edge Runtime 制約・スコープ制限・無料枠制限等）
```

### ステップ 2: system-spec-update-summary.md の作成

`outputs/phase-12/system-spec-update-summary.md` として aiworkflow-requirements への反映内容を記録する。

必須記載項目：

```markdown
# システム仕様書更新サマリー

## 更新対象ファイル

### deployment-secrets-management.md への追記
（GOOGLE_SERVICE_ACCOUNT_JSON の管理方針・登録手順を追記した内容の要約）

### environment-variables.md への追記
（GOOGLE_SERVICE_ACCOUNT_JSON の環境変数定義を追記した内容の要約）

## 更新日
（YYYY-MM-DD）

## 更新者
（担当者名）
```

### ステップ 3: aiworkflow-requirements の参照先 spec を更新する

以下のファイルに `GOOGLE_SERVICE_ACCOUNT_JSON` に関する記述を追加する。

**更新対象 1**: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

追記内容の方針：
- `GOOGLE_SERVICE_ACCOUNT_JSON` を Cloudflare Secret として管理することを明記する
- `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` のコマンド例を追加する
- ローカル開発時は `.dev.vars` に設定し、`.gitignore` で除外することを明記する
- Service Account JSON の最小権限原則（spreadsheets.readonly スコープ）を記載する

**更新対象 2**: `.claude/skills/aiworkflow-requirements/references/environment-variables.md`

追記内容の方針：
- `GOOGLE_SERVICE_ACCOUNT_JSON` を環境変数一覧に追加する
- 型: `string`（JSON 文字列）、管理場所: Cloudflare Secret / `.dev.vars`（ローカル）を明記する
- `apps/api` の `wrangler.toml` に `[vars]` ではなく Secrets として設定することを明記する

### ステップ 4: documentation-changelog.md の作成

`outputs/phase-12/documentation-changelog.md` として変更履歴を記録する。

```markdown
# ドキュメント変更履歴

## UT-03 Sheets API 認証方式設定 Phase 12（YYYY-MM-DD）

### 新規作成
- docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-10.md
- docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-11.md
- docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-12.md
- docs/01-infrastructure-setup/ut-03-sheets-api-auth/phase-13.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md（本ファイル）
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

### 更新
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
  （GOOGLE_SERVICE_ACCOUNT_JSON の管理方針を追記）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
  （GOOGLE_SERVICE_ACCOUNT_JSON の環境変数定義を追記）
```

### ステップ 5: unassigned-task-detection.md の作成

`outputs/phase-12/unassigned-task-detection.md` として本タスク実施中に発見した未アサインタスクを記録する。

```markdown
# 未アサインタスク検出レポート

## 検出日
YYYY-MM-DD

## 検出された未アサインタスク

| # | 内容 | 優先度 | 推奨アサイン先 | 発見 Phase |
| --- | --- | --- | --- | --- |
| 1 | （例）Service Account の有効期限監視アラートが未設定 | 中 | 04-serial-cicd-secrets-and-environment-sync | Phase 5 |
| 2 | （例）Sheets API のレートリミット超過時のリトライ処理が未実装 | 中 | UT-09 | Phase 6 |

（本タスク実施中に発見した未アサインタスクを上記形式で記載する。発見がなければ「検出なし」と記載する）
```

### ステップ 6: skill-feedback-report.md の作成

`outputs/phase-12/skill-feedback-report.md` として `task-specification-creator` skill へのフィードバックを記録する。

```markdown
# task-specification-creator スキルフィードバックレポート

## 対象タスク
UT-03 Sheets API 認証方式設定

## フィードバック

### 良かった点
（Phase 設計・仕様書テンプレートで特に役立った点を記載）

### 改善提案
（仕様書テンプレートやプロセスで改善できる点を記載）

### Edge Runtime 固有の注意点
（Web Crypto API / Node.js API 判別に関して仕様書テンプレートに追加すべき観点があれば記載）
```

### ステップ 7: same-wave sync の実施

Wave 1 内のタスク（UT-01, UT-02, UT-09）との整合を確認し、`outputs/phase-12/phase12-task-spec-compliance-check.md` に記録する。

```markdown
# Phase 12 同期ルール遵守確認

## same-wave sync（Wave 1）

| タスク | 確認観点 | 整合状態 |
| --- | --- | --- |
| UT-01 (Sheets→D1 同期方式定義) | sheets-auth.ts のインターフェースが UT-01 の設計と矛盾しないか | PASS / FAIL / 要確認 |
| UT-02 (D1 WAL mode 設定) | D1 アクセス方針が UT-02 の設計と矛盾しないか | PASS / FAIL / 要確認 |
| UT-09 (Sheets→D1 同期ジョブ実装) | sheets-auth.ts のエクスポート形式が UT-09 の実装予定と整合するか | PASS / FAIL / 要確認 |

## Phase 12 同期ルール遵守確認

- [ ] spec-update-workflow.md の手順通りに実施した
- [ ] deployment-secrets-management.md を更新した
- [ ] environment-variables.md を更新した
- [ ] same-wave sync を全タスクに対して実施した
- [ ] 未アサインタスクを記録した

## 確認日
YYYY-MM-DD
```

## 多角的チェック観点（AIが判断）

- 価値性: implementation-guide.md が実際に下流タスク（UT-09）の実装開始に必要な情報を網羅しているか
- 実現性: aiworkflow-requirements の更新が既存の記述と矛盾なく追記できているか
- 整合性: same-wave sync で Wave 1 タスクとの矛盾が検出されなかったか（または検出した場合に記録されているか）
- 運用性: 将来のシークレットローテーション・Service Account 変更時に implementation-guide.md が手順書として機能するか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md 作成 | 12 | pending | sheets-auth.ts の使い方ガイド |
| 2 | system-spec-update-summary.md 作成 | 12 | pending | aiworkflow-requirements 反映内容 |
| 3 | deployment-secrets-management.md 更新 | 12 | pending | GOOGLE_SERVICE_ACCOUNT_JSON 追記 |
| 4 | environment-variables.md 更新 | 12 | pending | 環境変数定義追記 |
| 5 | documentation-changelog.md 作成 | 12 | pending | 変更履歴記録 |
| 6 | unassigned-task-detection.md 作成 | 12 | pending | 未アサインタスク検出 |
| 7 | skill-feedback-report.md 作成 | 12 | pending | task-specification-creator へのフィードバック |
| 8 | phase12-task-spec-compliance-check.md 作成 | 12 | pending | same-wave sync 遵守確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | sheets-auth.ts の使い方ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements への反映内容 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未アサインタスク検出レポート |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | task-specification-creator へのフィードバック |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 同期ルール遵守確認 |
| 更新 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | GOOGLE_SERVICE_ACCOUNT_JSON 管理方針の追記 |
| 更新 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | GOOGLE_SERVICE_ACCOUNT_JSON 環境変数定義の追記 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 6種の必須成果物が全て `outputs/phase-12/` に配置されている
- `deployment-secrets-management.md` に `GOOGLE_SERVICE_ACCOUNT_JSON` の記述が追加されている
- `environment-variables.md` に `GOOGLE_SERVICE_ACCOUNT_JSON` の環境変数定義が追加されている
- same-wave sync（UT-01, UT-02, UT-09）の整合確認が記録されている
- `phase12-task-spec-compliance-check.md` の全チェックボックスが確認済みである

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（same-wave 矛盾検出時の対処・spec 更新の副作用確認）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: `outputs/phase-12/documentation-changelog.md` の変更ファイル一覧を Phase 13 の PR change-summary として使用する
- ブロック条件: 6種の必須成果物が未作成の場合は Phase 13 に進まない。same-wave sync で重大な矛盾が検出された場合は矛盾を解消してから Phase 13 に進む
