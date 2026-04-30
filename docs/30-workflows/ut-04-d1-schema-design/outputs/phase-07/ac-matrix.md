# Phase 7: AC マトリクス / カバレッジ確認 (UT-04 D1 Schema Design)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 / D1 データスキーマ設計 |
| Phase | 7 / 13 |
| 状態 | drafted |
| docsOnly | true |

## 目的

`index.md` の AC-1〜AC-12 を唯一の registry とし、Phase 4（検証スイート）/ Phase 5（実装ランブック）/ Phase 6（failure case）/ Phase 11（手動 smoke）の成果物を縦串でトレースする。schema は宣言的 SQL のため line/branch coverage ではなく代替指標 3 種を採用し、4 条件評価の更新まで行う。

## AC マトリクス

| AC# | AC 内容 | Phase 4 検証 | Phase 11 smoke | Phase 5 runbook | 関連 failure case (Phase 6) | 成果物パス |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | D1 テーブル定義（DDL）が設計ドキュメントとして文書化されている | 経路 1（dry-run）+ Phase 5 既存 SQL レビュー | dev remote の `sqlite_master` スナップショットで確認 | Step 1（list）/ Step 2 schema 確認 | #1 | `outputs/phase-02/schema-design.md`、`apps/api/migrations/0001_init.sql` |
| AC-2 | Wrangler マイグレーションファイルが作成され構文エラーなく適用可能 | 経路 2, 3（local / remote apply） | Step 3 dev remote apply 実演 | Step 1〜3 | #1, #2, #4 | `apps/api/migrations/0001_init.sql`〜`0006_admin_member_notes_type.sql` |
| AC-3 | Sheets と D1 カラムのマッピング表が作成 | §3 マッピング契約表 | dev で 1 行 INSERT し mapping 確認 | （runbook では Step 2 の schema 確認で間接担保） | #5, #10 | `outputs/phase-04/test-strategy.md` §3、`outputs/phase-02/sheets-d1-mapping.md` |
| AC-4 | dev 環境でマイグレーション適用が成功 | spec PR では手順仕様のみ。実 apply は後続実行 wave | Step 3 dev remote apply の証跡は TBD | Step 2〜3 | #3, #13 | Phase 11 `manual-smoke-log.md`（placeholder） |
| AC-5 | PK / NOT NULL / UNIQUE / FK / INDEX が適切に定義 | 制約 8 ケース（C1〜C7）+ INDEX 確認 | dev で `sqlite_master` から index/制約を確認 | verification step（index 列挙） | #5, #6, #7, #8, #9, #10 | `apps/api/migrations/0001_init.sql`、Phase 4 `test-strategy.md` §2 |
| AC-6 | data-contract.md と schema 整合性レビュー完了 | §3 マッピングを data-contract.md と diff | Phase 11 で staging 上の整合性を最終確認 | （責務型: runbook 内では明示なし） | （責務型・個別 case 無し。逸脱は MAJOR で go-no-go 直結） | `outputs/phase-03/main.md`、`docs/01-infrastructure-setup/03-serial-data-source-and-storage-contract/.../data-contract.md` |
| AC-7 | dev / production runbook が文書化 | 経路 5（rollback）+ §5 検証コマンド集 | Step 4（backup）/ Step 5（production apply）の 1 件以上を staging で実演 | Step 0〜5 + rollback / restore | #2, #11, #12, #13, #14 | `outputs/phase-05/implementation-runbook.md` |
| AC-8 | 連番マイグレーション規約が明文化 | 経路 1（list 順序確認）/ 経路 4（冪等） | dev での migration 列挙ログ | Step 1 の `migrations list` | #3, #4, #13 | `outputs/phase-02/migration-strategy.md`、`apps/api/migrations/` 連番 |
| AC-9 | DATETIME を ISO 8601 TEXT で統一 | C8（DATETIME 検証） + §3 変換規則 | dev で `submitted_at` を SELECT し ISO 8601 確認 | （runbook では明示なし、verification step の SELECT で確認） | #10（CHECK 違反相当の mapper reject） | `outputs/phase-02/schema-design.md`、Phase 4 §3 |
| AC-10 | `PRAGMA foreign_keys = ON;` の取り扱い確定 | 既存 0001〜0006 は FK 未使用。FK 導入時の PRAGMA 方針を固定 | Phase 11 では `PRAGMA foreign_keys` 確認手順のみ。違反 INSERT は N/A | Phase 5 / migration-strategy §4 | #7, #8, #9 | `outputs/phase-02/migration-strategy.md` §4 |
| AC-11 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS | 本 Phase の 4 条件評価表 | Phase 11 smoke で整合性最終確認 | Step 0〜5 が全成功 | MAJOR 検出時は Phase 10 blocker | `outputs/phase-10/go-no-go.md`（Phase 10 で確定） |
| AC-12 | D1 アクセスは `apps/api` に閉じる（schema 配置先固定） | spec PR の path allowlist grep | `apps/web` から D1 binding 参照無しを Phase 13 で grep | runbook の全コマンドが `apps/api/migrations/` に閉じる | #13（環境取り違え経路で path 逸脱検知） | `apps/api/migrations/`、`outputs/phase-13/local-check-result.md` |

## coverage 代替指標

schema は SQL 宣言的性質のため line/branch coverage は適用しない。

| 指標 | 目標 | 計測方法 | 出力先 |
| --- | --- | --- | --- |
| migration 適用成功率 | 実行 wave で 100% | 本 spec PR では手順と期待値を確定。実測は後続実行 wave | `outputs/phase-11/manual-smoke-log.md` に追記 |
| 制約検証通過率 | 実行 wave で 100% | 本 spec PR では C1〜C7 の検証手順を確定。実測は後続実行 wave | `outputs/phase-11/manual-smoke-log.md` に追記 |
| Sheets→D1 マッピング充足率 | spec 上 100% | Sheets 31 項目が mapping 済 or 「未使用」マーク | `outputs/phase-02/sheets-d1-mapping.md` |

### 計測対象 allowlist（変更ファイル限定）

```
apps/api/migrations/0001_init.sql
apps/api/migrations/0002_admin_managed.sql
apps/api/migrations/0002_sync_logs_locks.sql
apps/api/migrations/0003_auth_support.sql
apps/api/migrations/0004_seed_tags.sql
apps/api/migrations/0005_response_sync.sql
apps/api/migrations/0006_admin_member_notes_type.sql
apps/api/wrangler.toml         # binding/migrations_dir の差分確認のみ
docs/30-workflows/ut-04-d1-schema-design/outputs/**
```

### 禁止パターン（広域指定）

```
apps/api/**/*    # 既存ソース全域は対象外
apps/**          # monorepo 全域は禁止
```

## 計測の証跡記録（後続実行 wave で取得）

```bash
# 1. migration 適用成功率（Phase 4 経路 1〜4）
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-dev --env dev
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local   # 冪等
# production apply は本タスク内では実行しない（UT-06 承認後に runbook で実施）

# 2. 制約検証通過率（C1〜C7 順次実行）
# Phase 4 §5 のコマンドを順次実行し、期待エラーを構造化ログとして追記:
#   outputs/phase-09/manual-smoke-log.md

# 3. マッピング充足率（diff）
diff <(grep -c '^|' outputs/phase-04/test-strategy.md) <(echo 31)
```

## 4 条件評価（更新）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-1〜AC-12 が Phase 4 検証 / Phase 5 runbook / Phase 6 failure case / Phase 11 smoke で完全トレース。UT-09（Sheets→D1 同期）への前提が確立 |
| 実現性 | PASS | `scripts/cf.sh` 経由で 1Password 認証 → wrangler d1 操作が成立（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。esbuild / Node 24 不整合は cf.sh 内で解決 |
| 整合性 | PASS（要 Phase 11 確認） | data-contract.md / database-schema.md / Phase 2 schema-design / `apps/api/migrations/*.sql` の 4 文書間の diff ゼロを Phase 11 staging smoke で最終確認。AC-6 が責務 |
| 運用性 | PASS | Phase 5 runbook（Step 0〜5）と Phase 6 DR runbook（rollback / export-restore）がコマンドベースで完結。production 適用前バックアップが必須化、Step 5 / rollback / restore は canUseTool で人手承認必須 |

## Phase 9 への引き継ぎ項目

- 経路 1〜4 の実測ログ取得 → `outputs/phase-09/manual-smoke-log.md`
- 制約 C1〜C7 の期待エラー観測ログ → `outputs/phase-09/manual-smoke-log.md`
- Sheets 31 項目マッピング充足の diff 結果 → `outputs/phase-09/sheets-d1-mapping.md`
- 4 条件評価の最終 PASS 確定（Phase 10 go-no-go 入力）
- allowlist 逸脱検出（広域 `apps/api/**/*` 等）→ Phase 8 DRY 化 / Phase 9 で 0 件確認

## 完了条件

- [x] AC マトリクス 12 行 × 6 列に空セル無し（AC-6 の failure case 列のみ責務型で空可）
- [x] 代替指標 3 種が目標値・計測方法・出力先付きで定義
- [x] 広域指定の禁止パターンが例示
- [x] 計測コマンドが `scripts/cf.sh` 経由で記述（wrangler 直叩きゼロ）
- [x] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [x] Phase 9 引き継ぎ項目が箇条書きで明示
