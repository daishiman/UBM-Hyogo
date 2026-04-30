# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-case） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5 runbook で組み立てた migration 適用処理に対し、migration 系 / 制約系 / DR（disaster recovery）系 / 環境系の 4 層で発生し得る異常系を網羅し、検出方法・復旧手順・ログ出力例を揃える。Phase 7 の AC トレース表に紐付けし、Phase 9 の品質保証で検証可能な形式にする。schema 自身は宣言的だが、適用フェーズでの失敗が production の SLA に直結するため、rollback / restore を確実に手順化する。

## 実行タスク

1. 異常系を 4 層別に列挙し、12 件以上のマトリクスを完成する（完了条件: 各ケースに分類・原因・検出・復旧・ログ例の 5 項目が埋まる）。
2. 各ケースの retry 戦略（即時失敗 / 手動 rollback / no-retry）を明示する（完了条件: 全件で戦略が一意）。
3. migration 失敗時の rollback 手順をコマンドベースで記述する（完了条件: 部分適用後の状態から復旧可能）。
4. FK 制約違反シナリオの挙動を検証する（完了条件: `PRAGMA foreign_keys=ON` 有効/無効それぞれの観測結果が記述）。
5. duplicate apply の冪等性検証を行う（完了条件: `d1_migrations` テーブルでスキップが観測される）。
6. D1 export → restore の DR 手順を整備する（完了条件: production export → 別 DB へ restore が成功するコマンド列が完結）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-05.md | runbook の例外パス起点 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-04.md | 制約テストとの wire-in |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | d1 export / restore 仕様 |
| 必須 | CLAUDE.md | scripts/cf.sh 経由実行ルール |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ | D1 制限値 |
| 参考 | https://www.sqlite.org/lang_altertable.html | ALTER TABLE 制約 |

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | 戦略 | 復旧 | ログ例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | migration | apply 失敗（SQL syntax error） | DDL 文法ミス | wrangler exit code != 0 | 即時失敗 | 該当 SQL ファイル修正 → 再 apply。`d1_migrations` には未記録のため再実行可能 | `{code:"D1_MIGRATION_SYNTAX",file:"0001_init.sql"}` |
| 2 | migration | apply 部分適用（複数文の一部失敗） | 単一 SQL ファイル内で一文目成功・二文目失敗 | 失敗後の `sqlite_master` に部分テーブル | 手動 rollback（DROP TABLE）→ 修正 → 再 apply | 部分テーブルを DROP 後に再 apply | `{code:"D1_MIGRATION_PARTIAL",applied:["t1"],failed:"t2"}` |
| 3 | migration | duplicate apply | 同一 migration の 2 回 apply | `d1_migrations` に既存行 → wrangler は no-op | no-retry（冪等動作） | 不要（正常） | `{code:"D1_MIGRATION_SKIPPED",version:"0001"}` |
| 4 | migration | migration 番号衝突 | dev / main で同番号別 SQL | wrangler 判定不能 / 順序逆転 | 即時失敗 | 番号繰り上げ（`0001` → `0003`）して再 apply | `{code:"D1_MIGRATION_CONFLICT"}` |
| 5 | 制約 | NOT NULL 違反（INSERT 時） | アプリ側で NULL を送信 | INSERT エラー | アプリ側で reject（schema は受信時点で防御） | mapper 側のバリデーション修正（UT-09） | `{code:"D1_NOT_NULL",column:"responseEmail"}` |
| 6 | 制約 | UNIQUE 違反（`response_id`） | Sheets で同 ID 重複行 | INSERT エラー or upsert で UPDATE 経路 | `INSERT ... ON CONFLICT DO UPDATE`（UT-09 で実装） | 冪等動作のため復旧不要 | `{code:"D1_UNIQUE_UPSERT",responseId:"r1"}` |
| 7 | 制約 | FOREIGN KEY 違反（child INSERT） | 親 `response_id` 不在 | `PRAGMA foreign_keys=ON` 時に INSERT エラー | 即時失敗 | アプリ側で先に親を upsert する順序保証 | `{code:"D1_FK_VIOLATION",child:"admin_member_profiles"}` |
| 8 | 制約 | FOREIGN KEY 違反（DELETE 時） | RESTRICT 設定下で親 DELETE | DELETE エラー | 即時失敗 | 子レコードを先に処理 | `{code:"D1_FK_RESTRICT",parent:"member_responses"}` |
| 9 | 制約 | `PRAGMA foreign_keys=ON` 未設定 | migration 冒頭の PRAGMA 漏れ | FK 違反が検出されず silent pass | 即時失敗（運用観点で危険） | `0001_init.sql` 冒頭に PRAGMA 追加 → 再 apply | `{code:"D1_FK_DISABLED"}` |
| 10 | 制約 | CHECK 違反（`publicConsent` 範囲外） | 0/1 以外の値投入 | INSERT エラー | mapper 側で reject | 値変換ルール修正 | `{code:"D1_CHECK_FAILED",column:"publicConsent"}` |
| 11 | DR | production 適用後の致命的データ破壊 | DDL 誤り（DROP COLUMN 等）を production に適用 | アプリ層からの query エラー | 即時失敗 | `bash scripts/cf.sh d1 export --output backup.sql` の事前バックアップから restore | `{code:"D1_DATA_LOSS",severity:"critical"}` |
| 12 | DR | export ファイル破損 | export 中断 / 通信エラー | restore 時の SQL parse error | 即時失敗 | 直近の別バックアップから restore、または前 commit の state へ revert | `{code:"D1_EXPORT_CORRUPT"}` |
| 13 | 環境 | dev / production の database_id 取り違え | wrangler.toml 設定ミス | dev migration が production に適用 | 即時失敗（重大） | 適用前に `d1 list` と `--env` を必ず突合。誤適用時は backup から restore | `{code:"D1_ENV_MISMATCH",applied_to:"production",intended:"dev"}` |
| 14 | 環境 | 1Password 認証失敗 | API token 期限切れ / op session 切れ | `scripts/cf.sh whoami` 失敗 | 即時失敗 | `op signin` 再実行 → token 再取得 | `{code:"CF_AUTH_FAILED"}` |

合計: 14 件（要件 12 件以上を満たす）。

## migration 失敗時の rollback 手順

### Case 2: 部分適用の rollback

```bash
# 失敗状態の確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# 部分適用されたテーブルを手動 DROP
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "DROP TABLE IF EXISTS member_responses"

# d1_migrations の該当行も削除（再 apply を可能にする）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "DELETE FROM d1_migrations WHERE name = '0001_init.sql'"

# SQL 修正後に再 apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote
```

## FK 制約違反検証

```bash
# PRAGMA 有効化確認（必須）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "PRAGMA foreign_keys"
# 期待: 1（有効）

# 違反を意図的に発生させる
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "INSERT INTO admin_member_profiles(response_id) VALUES ('not_exists')"
# 期待: FOREIGN KEY constraint failed
```

## duplicate apply の冪等性検証

```bash
# 1 回目
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# 2 回目（no-op を期待）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local
# 期待: "No migrations to apply" または該当行をスキップする出力
```

## D1 export → restore DR 手順

```bash
# 1. production から export（事前バックアップ）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-$(date +%Y%m%d-%H%M%S).sql

# 2. 災害発生時: 新規 DB を作成（または既存を再利用）
bash scripts/cf.sh d1 list

# 3. restore（バックアップ SQL を適用）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --file backup-20260429-120000.sql

# 4. 検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT COUNT(*) FROM member_responses"
```

## 各ケース ↔ 検証スイート wire-in

| Case # | 対応スイート（Phase 4） |
| --- | --- |
| 1, 2, 4 | migration テスト（dry-run / apply / rollback） |
| 3 | migration 冪等性テスト |
| 5, 6, 7, 8, 10 | 制約テスト 8 ケース |
| 9 | migration テスト + 制約テスト（PRAGMA 確認） |
| 11, 12 | DR runbook 手動 smoke（Phase 11 で実施） |
| 13, 14 | 環境テスト（runbook 内 `whoami` / `--env` 確認） |

## 実行手順

1. 14 件のマトリクスを `outputs/phase-06/failure-cases.md` に転記。
2. 各ケースのログ JSON フォーマットを UT-07 通知基盤想定に合わせ統一。
3. 検証スイート wire-in を Phase 4 ファイル名と相互参照。
4. rollback / DR runbook をコマンドベースで記述。
5. open question（UT-10 / UT-07 で標準化される項目）を Phase 12 unassigned に送る。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 9 | 制約違反テストを 100% 通過率の指標に組み込む |
| Phase 11 | DR runbook を staging で 1 件以上手動 smoke |
| Phase 12 | UT-07 / UT-10 への引き継ぎを unassigned-task-detection に登録 |

## 多角的チェック観点

- 価値性: 各ケースが運用者にとって意味のある復旧パスを示しているか。
- 実現性: `scripts/cf.sh` 経由の rollback / export / restore が dev/production で成立するか。
- 整合性: ログ JSON フォーマットが UT-07 通知基盤の入力契約と一致するか。
- 運用性: 復旧コマンドがコピペで完結するか（オペレーター実行可能）。
- 認可境界: `--env production` 指定が必須化され誤適用が防げるか。
- セキュリティ: backup ファイルの保管場所と廃棄ルールが明示されているか（次タスクへの open question）。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 14 件の failure case マトリクス | spec_created |
| 2 | retry 戦略付与 | spec_created |
| 3 | rollback runbook | spec_created |
| 4 | FK 違反検証手順 | spec_created |
| 5 | duplicate apply 冪等性検証 | spec_created |
| 6 | D1 export/restore DR 手順 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 14 件マトリクス + rollback / DR runbook + ログ例 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] 12 件以上の failure case が分類別に網羅
- [ ] 全ケースで戦略が一意
- [ ] 全ケースに対応する Phase 4 スイートが指定
- [ ] migration 部分適用の rollback コマンドが完結
- [ ] D1 export → restore DR 手順がコマンド付き
- [ ] FK / 冪等性検証が観測可能なコマンドで記述

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 14 件全てに 5 項目（分類・原因・検出・復旧・ログ例）が記入
- Phase 5 runbook の各 Step 例外パスが全て failure case に対応
- wrangler 直叩きが本ドキュメント内にゼロ件

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - 14 件の failure case ID を AC マトリクスの「関連 failure case」列で参照
  - DR runbook を Phase 11 手動 smoke の対象に予約
- ブロック条件:
  - 12 件未満で Phase 7 へ進む
  - DR 復旧手順が記述されないケースが残る
