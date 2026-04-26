# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化（リファクタリング相当） |
| 作成日 | 2026-04-23 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |
| implementation_mode | new |
| visibility | NON_VISUAL |

## 目的

Sheets→D1 data contract に登場する設定値（D1 schema 列定義 / Sheets column 定義 / env キー名 / sync パラメータ）の重複と表記揺れを排除し、Phase 2 の `data-contract.md` と Phase 5 の runbook 群が単一の正本テーブルから派生する状態へ集約する。コード実装は行わず、仕様書とテーブル定義の DRY 化に閉じる。

## 実行タスク

- D1 schema と Sheets column 定義の二重管理箇所を特定する
- env / Secrets キー名（GOOGLE_SERVICE_ACCOUNT_JSON 等）の表記を統一する
- sync 設定値（batch size / retry count / schedule cron / timeout）を constants 表として正本化する
- Before / After / 理由を表で固定し、refactor-record.md を作成する
- 削除対象（legacy 表記・実値混入の secret 例）を明示する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/data-contract.md | schema 正本（DRY 化の基準） |
| 必須 | outputs/phase-02/sync-flow.md | sync 設定値の出現箇所 |
| 必須 | outputs/phase-04/verification-commands.md | 検証時に参照される定数 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |
| 必須 | CLAUDE.md | 不変条件 1〜7 / Secrets 管理方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界の固定 |

## 実行手順

### ステップ 1: 重複箇所の棚卸し
- phase-02 / phase-04 / phase-05 で同じ schema 列名・cron 値・batch size が重複していないか grep ベースで列挙する。
- 表記揺れ（例: `service_account` vs `SERVICE_ACCOUNT_JSON` / `batchSize` vs `BATCH_SIZE`）を Before 列に転記する。

### ステップ 2: 正本テーブルへの集約
- D1 schema 列定義は phase-02 の `data-contract.md` を単一正本とし、他 phase からは参照のみとする。
- env / Secrets キーは「変数名 / 配置先 / 用途 / 確定 Phase」の 4 列正本に統合する。
- sync 設定値は `constants` テーブル（key / value / 単位 / 由来）として正本化する。

### ステップ 3: refactor-record の作成
- 「対象 / Before / After / 理由」表（[Feedback RT-03] 準拠）を outputs/phase-08/refactor-record.md に固定する。
- downstream task 04 / 05a / 05b への影響行を明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | refactor-record を入力に link 切れ・実値混入をスキャン |
| Phase 7 | AC-1〜AC-5 のトレース表現を統一 |
| Phase 10 | gate 判定の根拠（DRY 化が正本一意性に寄与する） |
| Phase 12 | spec sync 時の差分最小化 |

## 多角的チェック観点（AIが判断）

- 価値性: 重複削減により下流 task の手戻りが減るか。
- 実現性: 仕様書のみで完結し、コード変更を要求していないか。
- 整合性: 不変条件 5（D1 直接アクセスは apps/api 限定）と矛盾する記述が残っていないか。
- 運用性: Secrets が placeholder のみで構成され、1Password 正本ルールを破っていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複箇所棚卸し | 8 | completed | phase-02/04/05 横断 |
| 2 | env / Secrets キー統一 | 8 | completed | GOOGLE_SERVICE_ACCOUNT_JSON 軸 |
| 3 | sync constants 正本化 | 8 | completed | batch / retry / cron / timeout |
| 4 | refactor-record 作成 | 8 | completed | outputs/phase-08/refactor-record.md |
| 5 | 削除対象確定 | 8 | completed | legacy / 実値 secret |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactor-record.md | 対象 / Before / After / 理由表（主成果物） |
| ドキュメント | outputs/phase-08/main.md | Phase 8 サマリー |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

依存Phase 6: `outputs/phase-06/failure-cases.md`

依存成果物参照: `outputs/phase-06/failure-cases.md`

- [ ] refactor-record.md に 対象 / Before / After / 理由 が全て埋まっている
- [ ] env / Secrets / sync constants の正本 phase が 1 箇所に固定されている
- [ ] 削除対象が列挙され、phase-02 以降に逆流していない
- [ ] downstream handoff（04 / 05a / 05b）が明記されている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（実値 secret 混入・cron 値の重複）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: refactor-record.md を Phase 9 の link 切れ・実値混入チェックの入力に使う。
- ブロック条件: refactor-record.md が未作成、または Before/After 表が空欄を含む場合は Phase 9 へ進まない。

## Before / After 比較（[Feedback RT-03]）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| D1 schema 列定義の所在 | phase-02 / 04 / 05 に重複転記 | phase-02 `data-contract.md` を正本に統一 | 不変条件 1（schema 固定しすぎない）と DRY を両立 |
| Sheets column 名表記 | `responseEmail` / `response_email` 混在 | `responseEmail` を system field として固定 | 不変条件 3 と整合 |
| consent キー | `consent` / `agreeFlag` 混在 | `publicConsent` / `rulesConsent` に統一 | 不変条件 2 |
| sync auth env | `GSA_JSON` / `SERVICE_ACCOUNT` 混在 | `GOOGLE_SERVICE_ACCOUNT_JSON` に統一 | Secrets 一覧（index.md）に整合 |
| batch size | phase-04 と phase-05 で別値 | constants 表で 1 値に固定（placeholder） | 検証と運用の同期 |
| schedule cron | 文中に直書き | constants 表で 1 値（UTC 表記） | 表記揺れ排除 |
| retry / timeout | 未定義 | constants 表で初期値 placeholder 化 | 運用性向上 |

## 共通化パターン

- env / Secrets は「変数名 / 配置先 / 用途 / 確定 Phase」の 4 列で統一する
- sync constants は「key / value / 単位 / 由来 phase」の 4 列で統一する
- D1 schema 参照は「phase-02 を see-also」とのみ書き、再掲しない
- outputs 配置ルール（outputs/phase-XX/＊.md）を Phase 12 まで同一化する

## 削除対象一覧

- 旧 `agreeFlag` / `consent` 単一キー記述
- env キーの旧表記（`GSA_JSON` 等）
- 実値が混入した secret 例（プレースホルダー以外）
- Sheets を canonical store とする旧設計の残存記述（不変条件 4 / index.md スコープ外）
- GAS prototype を本番設計に持ち込む記述（不変条件 6）
