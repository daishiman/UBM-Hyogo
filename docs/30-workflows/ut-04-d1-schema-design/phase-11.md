# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | application_specification（manual smoke / non-visual） |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは Cloudflare D1 の schema 設計および migration ファイル適用のみで構成され、エンドユーザー向け UI を提供しない。
  - 出力先は D1 テーブル（DDL 適用結果）と wrangler / scripts/cf.sh の CLI ログのみで、画面 / コンポーネント / レイアウト / インタラクションを伴わない。
  - 結果として screenshot による視覚証跡は不要。CLI 出力（`.schema` / `migrations list` / `INSERT` 結果）と D1 行の SELECT 結果が一次証跡となる。
- 必須 outputs:
  - `outputs/phase-11/main.md`（smoke 実行サマリー / 既知制限 / NON_VISUAL evidence 差分表）
  - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログ）
  - `outputs/phase-11/link-checklist.md`（仕様書 / 正本仕様 / migration / runbook 参照リンク検証）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体不要）。
- 参照: `.claude/skills/task-specification-creator/references/phase-11-non-visual-link-checklist.md`

## 目的

Phase 5 の migration runbook に基づき作成された `apps/api/migrations/*.sql` を、ローカル（`--local`）および dev 環境において **scripts/cf.sh 経由で** 適用し、AC-1〜AC-12 がエンドツーエンドで動作することの一次証跡を採取する。production 環境への適用は UT-06 / UT-26 へ委譲し、本 Phase は **「migration が apply できる」「.schema が期待 DDL を返す」「制約違反 INSERT が reject される」「マッピングが成立する」** の確認に範囲を絞る。**wrangler 直接呼び出しは禁止**、すべて `bash scripts/cf.sh d1 ...` 経由で実行する。

## 実行タスク

1. dev 環境への migration apply を `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev` で実行し、成功を確認する（完了条件: 全 migration が `Migrated` 状態）。
2. `bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --command ".schema"` で適用後の schema を取得する（完了条件: 全テーブル DDL が出力）。
3. `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev` で migration 履歴が期待通りであることを確認する（完了条件: 適用済み migration が連番で並ぶ）。
4. NOT NULL violation INSERT を意図的に投げ、reject されることを確認する（完了条件: SQLITE_CONSTRAINT_NOTNULL エラー）。
5. UNIQUE violation INSERT（同一 `response_id` で 2 回挿入）を投げ、2 回目が reject されることを確認する（完了条件: SQLITE_CONSTRAINT_UNIQUE エラー）。
6. FK validation INSERT を投げ、reject されることを確認する（完了条件: SQLITE_CONSTRAINT_FOREIGNKEY エラー / `PRAGMA foreign_keys = ON;` 効いている）。
7. 正常系 INSERT（fixture 1 行）を投げ、SELECT で取得できることを確認する（完了条件: 1 行取得 + すべてのカラムが想定値）。
8. 既知制限とNON_VISUAL evidence と参照リンク検証を `outputs/phase-11/link-checklist.md` に列挙する（完了条件: L1〜L4 の保証範囲 / 保証外が明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-05/implementation-runbook.md | smoke 対象の migration 手順 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-07/ac-matrix.md | AC × smoke 項目の対応 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-10/go-no-go.md | GO 判定の前提確認 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-link-checklist.md | NON_VISUAL 代替 evidence プレイブック |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | scripts/cf.sh / wrangler 操作手順 |
| 必須 | CLAUDE.md（プロジェクトルート） | scripts/cf.sh ラッパー利用ルール |
| 参考 | https://www.sqlite.org/lang_createtable.html | SQLite 制約仕様 |

## 実行手順

### ステップ 1: dev 環境への migration apply

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev
```

- 期待値: 全 migration（`0001_init.sql` 等）が `Migrated 🌀` で成功。
- 失敗時: `wrangler.toml` の `[[d1_databases]]` binding 名 / database_id を確認。`bash scripts/cf.sh d1 list` で database 実在確認。
- **wrangler を直接呼ばない**（CLAUDE.md 準拠）。

### ステップ 2: schema 確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --command ".schema"
```

- 期待値: `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` の 6 テーブル DDL が出力。
- 各テーブルに想定カラム（`id` / `response_id` / `email` / `public_consent` / `rules_consent` / `created_at` / `updated_at` 等）が含まれる。
- 各 index（`idx_member_responses_email` 等）が定義されている。

### ステップ 3: migration list 確認

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev
```

- 期待値: 適用済み migration が連番（`0001_init` ...）で並ぶ。未適用が無いこと。

### ステップ 4: NOT NULL violation INSERT

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO member_responses (id) VALUES (1);"
```

- 期待値: `SQLITE_CONSTRAINT_NOTNULL` エラーで reject。
- `response_id` / `email` 等の NOT NULL カラムが省略されているため失敗するはず。

### ステップ 5: UNIQUE violation INSERT

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO member_responses (response_id, email, name, public_consent, rules_consent) VALUES ('R-001', 'a@example.com', 'Alice', 1, 1);"

bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO member_responses (response_id, email, name, public_consent, rules_consent) VALUES ('R-001', 'b@example.com', 'Bob', 1, 1);"
```

- 期待値: 1 回目は成功、2 回目は `SQLITE_CONSTRAINT_UNIQUE` エラーで reject（`response_id` UNIQUE 制約）。

### ステップ 6: FK validation INSERT（該当する場合）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="PRAGMA foreign_keys;"

bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO audit_logs (actor, target_id, action) VALUES ('admin@example.com', 99999, 'update');"
```

- 期待値: `PRAGMA foreign_keys` が `1`（有効）。FK が設定されている場合、存在しない `target_id` 参照で `SQLITE_CONSTRAINT_FOREIGNKEY` エラー。
- FK が設計上不要なテーブル構成の場合は本ステップを `N/A` として `link-checklist.md` に記録。

### ステップ 7: 正常系 INSERT + SELECT

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="SELECT id, response_id, email, name, public_consent, rules_consent, created_at FROM member_responses WHERE response_id = 'R-001';"
```

- 期待値: ステップ 5 の 1 回目で挿入した行が取得できる。`created_at` が ISO 8601 UTC 形式。

### ステップ 8: ローカル smoke（補助）

```bash
mise exec -- pnpm wrangler d1 migrations apply ubm-hyogo-db-dev --local
mise exec -- pnpm wrangler d1 execute ubm-hyogo-db-dev --local --command=".schema"
```

- ローカルは `--local` 直接 wrangler 利用を許容（scripts/cf.sh は実 Cloudflare 向け）。`.dev.vars` / 1Password 不要。

## 代替 evidence 差分表（NON_VISUAL 必須）

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 保証外 / 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 migration apply | dev D1 への実 apply | `bash scripts/cf.sh d1 migrations apply --env dev` 実行ログ | DDL 適用成功 / 連番整合 | production apply（→ UT-06 / UT-26） |
| S-2 schema 一致 | アプリ側 repository での実利用 | `.schema` 出力 + DDL diff | テーブル / カラム / 型 / 制約 | runtime クエリ性能（→ UT-08 monitoring） |
| S-3 NOT NULL reject | アプリ層 validation | 直 INSERT で SQLITE_CONSTRAINT_NOTNULL | DB レベル制約 | アプリ側エラーハンドリング（→ UT-09 / 各 API タスク） |
| S-4 UNIQUE reject | UT-09 の idempotency | 直 INSERT で SQLITE_CONSTRAINT_UNIQUE | DB レベル冪等性保証 | sync 層の retry / upsert（→ UT-09） |
| S-5 FOREIGN KEY reject | アプリ側参照整合 | `PRAGMA foreign_keys` + 違反 INSERT | FK 有効化確認 | 実運用での cascade 挙動（→ UT-08） |
| S-6 mapping 成立 | Sheets→D1 実 sync | fixture 1 行 INSERT + SELECT 確認 | 型 / consent / timestamp 規約整合 | 実 Sheets API 経由の整合（→ UT-09 phase-11） |
| S-7 production apply | 本番 D1 への apply | dev での成功実績 + runbook 完備 | 手順の正しさ | production 実 apply（→ UT-06） |

> **NON_VISUAL のため screenshot 不要**。本表により「何を保証し、何を保証できないか」を明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入 |
| Phase 10 | GO/NO-GO 判定の前提として本 Phase の実行可否を確認 |
| Phase 12 | smoke 実行で判明した運用知見を unassigned-task-detection.md / skill-feedback-report.md に登録 |
| UT-06 | production 環境への migration apply を委譲（dev 成功実績を引き渡し） |
| UT-09 | schema 確定状態を mapper 実装の前提として引き渡し |
| UT-26 | staging-deploy-smoke で production 適用後の整合性を最終確認 |

## 多角的チェック観点

- 価値性: dev 環境で migration が適用でき、想定 DDL が成立しているか。
- 実現性: scripts/cf.sh 経由で全 D1 操作が完結しているか（wrangler 直接呼び出しが無いか）。
- 整合性: AC-1〜AC-12 の証跡パスが Phase 7 の AC matrix と整合しているか。
- 運用性: 制約違反 INSERT が DB レベルで reject されるか（アプリ層に頼らない防御線）。
- 認可境界: scripts/cf.sh が op 経由で API token を注入していること（実値が log に残らない）。
- Secret hygiene: ログに CLOUDFLARE_API_TOKEN / database_id 等が漏洩していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | dev 環境 migration apply | 11 | spec_created | scripts/cf.sh 経由 |
| 2 | .schema 確認 | 11 | spec_created | 6 テーブル DDL |
| 3 | migrations list 確認 | 11 | spec_created | 連番整合 |
| 4 | NOT NULL violation 確認 | 11 | spec_created | 制約 reject |
| 5 | UNIQUE violation 確認 | 11 | spec_created | 冪等性確認 |
| 6 | FK validation 確認 | 11 | spec_created | PRAGMA + 違反 INSERT |
| 7 | 正常系 INSERT + SELECT | 11 | spec_created | mapping 成立 |
| 8 | NON_VISUAL evidence と参照リンク検証 | 11 | spec_created | main / manual-smoke-log / link-checklist |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev` | outputs/phase-11/manual-smoke-log.md §1 | TBD |
| .schema 出力 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --command=".schema"` | outputs/phase-11/manual-smoke-log.md §2 | TBD |
| migrations list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev` | outputs/phase-11/manual-smoke-log.md §3 | TBD |
| NOT NULL reject | 上記ステップ 4 INSERT | outputs/phase-11/manual-smoke-log.md §4 | TBD |
| UNIQUE reject | 上記ステップ 5 INSERT × 2 | outputs/phase-11/manual-smoke-log.md §5 | TBD |
| FOREIGN KEY reject | 上記ステップ 6 INSERT | outputs/phase-11/manual-smoke-log.md §6 | TBD |
| 正常系 SELECT | 上記ステップ 7 SELECT | outputs/phase-11/manual-smoke-log.md §7 | TBD |
| 参照リンク検証 | `rg -n "outputs/phase-02|database-schema|deployment-cloudflare|apps/api/migrations" docs/30-workflows/ut-04-d1-schema-design` | outputs/phase-11/link-checklist.md | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録すること。CLOUDFLARE_API_TOKEN / database_id（UUID）は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | production 環境への apply は本 Phase で実行しない | 本番反映の確証 | UT-06（production deploy） / UT-26（staging-deploy-smoke） |
| 2 | 実 Sheets API 経由でのマッピング成立確認は行わない | 実 Form 連携 | UT-09 phase-11 で確認 |
| 3 | 性能観測（slow query / lock contention）は実運用後に判断 | 実トラフィック挙動 | UT-08 monitoring |
| 4 | field-level 暗号化は MVP 不採用 | PII 強化 | Phase 12 unassigned-task 候補 |
| 5 | audit_logs retention 自動削除は別タスク | storage 増加対策 | UT-08 / Phase 12 unassigned-task |
| 6 | NON_VISUAL のため screenshot 不要、CLI ログが一次証跡 | 視覚証跡なし | link-checklist.md で補完 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 実行サマリー・既知制限・NON_VISUAL evidence 差分表 |
| ログ | outputs/phase-11/manual-smoke-log.md | 7 命令分の実行ログ（コマンド / stdout / stderr） |
| 参照検証 | outputs/phase-11/link-checklist.md | workflow 内リンク・正本仕様・migration/runbook 参照のリンク検証 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブルの 7 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 代替 evidence 差分表（S-1〜S-7）が記述され、保証範囲 / 保証外が明示されている
- [ ] NOT NULL / UNIQUE / FOREIGN KEY 違反がそれぞれ DB レベルで reject されることを確認
- [ ] 正常系 INSERT + SELECT で mapping 成立を確認
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] すべての D1 操作が `bash scripts/cf.sh` 経由で実行されている（wrangler 直接呼び出し 0）

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1〜AC-12 の証跡採取コマンドが定義済み
- production apply（AC 該当部分）が UT-06 / UT-26 へ委譲されることが明記
- scripts/cf.sh 経由必須が明記
- artifacts.json の Phase 11 entry（`phase: 11`）が `completed`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - smoke 実行で得られた運用知見を Phase 12 の `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - 既知制限 #1（production apply 委譲）を UT-06 へ register
  - 既知制限 #4（field-level 暗号化）/ #5（audit_logs retention）を unassigned-task として formalize
  - schema 確定状態（DDL 適用済み）を UT-09 mapper 実装の前提として引き渡す
- ブロック条件:
  - manual evidence の 7 項目に未採取 / 未 N/A 化が残っている
  - 制約違反 INSERT のいずれかが reject されない（→ Phase 5 へ差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
  - wrangler 直接呼び出しが log に残っている（scripts/cf.sh 経由必須違反）
