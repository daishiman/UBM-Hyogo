# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-23 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |
| implementation_mode | new |
| task_kind | NON_VISUAL（インフラ・data contract） |

## 目的

Phase 2 設計と Phase 4 検証手順をもとに、(1) D1 schema migration、(2) wrangler.toml の D1 binding 追加、(3) GOOGLE_SERVICE_ACCOUNT_JSON の Cloudflare Secrets 登録、(4) sync worker の `apps/api/src/sync/` 配下への配置（CLAUDE.md 不変条件 5）を runbook 化する。実装ファイル新規/修正一覧を明示し、Phase 6 異常系検証へ引き継ぐ。

## 実行タスク

- D1 schema 作成（member_responses / member_identities / member_status / sync_audit）の migration SQL 設計
- wrangler.toml への D1 binding 追加手順（staging / prod env 別）
- GOOGLE_SERVICE_ACCOUNT_JSON の `wrangler secret put` 登録手順
- sync worker 配置（apps/api/src/sync/{client.ts, mapping.ts, runner.ts, audit.ts}）
- 実装ファイル一覧（新規/修正）の明示記載 [Feedback RT-03]
- d1-bootstrap-runbook.md / sync-deployment-runbook.md の整備

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/data-contract.md | schema / mapping |
| 必須 | outputs/phase-02/sync-flow.md | trigger / recovery / audit |
| 必須 | outputs/phase-04/verification-commands.md | 事前疎通・事後 smoke コマンド |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler d1 / migration / secret 手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 配置（不変条件 5） |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secret 配置 |

## 実行手順

### ステップ 1: D1 schema migration 整備
1. `apps/api/migrations/0001_init.sql` 設計（CREATE TABLE member_responses / member_identities / member_status / sync_audit）
2. staging への適用: `wrangler d1 migrations apply <DB> --env staging`
3. prod は Phase 11 smoke 後の手動適用（runbook に明記）
4. consent キー（publicConsent / rulesConsent, 不変条件 2）/ responseEmail（system field, 不変条件 3）/ admin_* 分離（不変条件 4）を schema に反映

### ステップ 2: wrangler.toml binding 追加
- `[[d1_databases]]` セクションを env=staging / prod で 2 系統分定義
- binding 名は `DB`、apps/api 内のみで参照（apps/web から参照禁止 = 不変条件 5）

### ステップ 3: secret 登録
- `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` を 1Password の値で実行
- prod も同様。Cloudflare Secrets が canonical、平文 .env 禁止
- GitHub Secrets（CI 用 CLOUDFLARE_API_TOKEN）は 04-cicd-secrets タスクで扱う旨を記載

### ステップ 4: sync worker 配置と実装ファイル一覧
- 新規: `apps/api/src/sync/client.ts`（Sheets API fetch ベースクライアント）
- 新規: `apps/api/src/sync/mapping.ts`（Sheets row → D1 row 変換 / consent 正規化）
- 新規: `apps/api/src/sync/runner.ts`（manual / scheduled / backfill エントリ）
- 新規: `apps/api/src/sync/audit.ts`（sync_audit append）
- 新規: `apps/api/src/routes/admin/sync.ts`（manual trigger 用 admin endpoint）
- 修正: `apps/api/wrangler.toml`（d1_databases / cron triggers / vars）
- 新規: `apps/api/migrations/0001_init.sql`
- 修正: `apps/api/src/index.ts`（route と scheduled handler の登録）

### ステップ 5: runbook 出力
- outputs/phase-05/d1-bootstrap-runbook.md（migration / staging/production 切替 / rollback）
- outputs/phase-05/sync-deployment-runbook.md（secret 登録 / worker deploy / cron 確認）
- outputs/phase-05/main.md（実装ファイル一覧 / 完了基準 / handoff）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 配置済み worker / D1 に対する異常系シナリオの実行起点 |
| Phase 7 | AC-3（runbook 化）の主たる証跡 |
| Phase 10 | gate 判定の実装証跡 |
| Phase 11 | prod migration の手動 smoke の前提 |

## 多角的チェック観点（AIが判断）

- 価値性: 実装者が runbook をコピペで staging 完走できるか
- 実現性: D1 無料枠 / Workers cron 制約に収まるか
- 整合性: 不変条件 5（apps/web から D1 直接アクセス禁止）/ 4（admin 分離）/ 2 / 3 / 7 を全て満たすか
- 運用性: rollback（migration down / 旧 dump 再投入）が runbook 化されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | migration SQL 設計 | 5 | completed | 0001_init.sql |
| 2 | wrangler.toml binding | 5 | completed | staging/production |
| 3 | secret 登録手順 | 5 | completed | wrangler secret put |
| 4 | sync worker 配置 | 5 | completed | apps/api/src/sync/ |
| 5 | 実装ファイル一覧 | 5 | completed | 新規/修正を明示 |
| 6 | runbook 整備 | 5 | completed | d1 / sync deployment |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/d1-bootstrap-runbook.md | D1 migration / rollback runbook |
| ドキュメント | outputs/phase-05/sync-deployment-runbook.md | secret / worker / cron deploy 手順 |
| ドキュメント | outputs/phase-05/main.md | 実装ファイル一覧と完了基準 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] migration SQL が consent / responseEmail / admin 分離を含む
- [ ] wrangler.toml binding が staging / prod 両方で定義済み
- [ ] GOOGLE_SERVICE_ACCOUNT_JSON 登録手順が runbook に記載
- [ ] sync worker が apps/api 配下に配置されている（apps/web には存在しない）
- [ ] 実装ファイル一覧（新規/修正）が main.md に明示
- [ ] rollback 手順が d1-bootstrap-runbook.md に含まれる

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 不変条件 4 / 5 / 6（GAS prototype 不昇格）/ 7 を逸脱していない
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 配置済み sync worker と D1 schema を Phase 6 の異常系シナリオで突く
- ブロック条件: 実装ファイル一覧 / runbook いずれかが未整備なら次 Phase に進まない

## 手順全文 (コピペ可)

```bash
# 1. D1 作成（staging）
wrangler d1 create ubm-hyogo-db-staging
# 2. migration 適用
wrangler d1 migrations apply ubm-hyogo-db-staging --env staging
# 3. secret 登録
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
# 4. worker deploy
wrangler deploy --env staging
# 5. 疎通確認（Phase 4 verification-commands.md を流用）
wrangler d1 execute ubm-hyogo-db-staging --env staging --command "select count(*) from member_responses"
```

## 設定ファイル全文（placeholder）

- `apps/api/wrangler.toml`: d1_databases / triggers.crons / vars に SHEET_ID を記載
- `apps/api/migrations/0001_init.sql`: member_responses / member_identities / member_status / sync_audit
- 実値（DB ID / SHEET_ID）は 1Password / GitHub Variables から取得し、コミットしない

## 各ステップ後の sanity check

- apps/web 配下に D1 アクセスコードが追加されていないこと
- consent キーが publicConsent / rulesConsent 以外に増えていないこと
- responseEmail が user 入力 column ではなく system field 列に入っていること
- migration 失敗時の down SQL または dump-restore 手順が runbook にあること
