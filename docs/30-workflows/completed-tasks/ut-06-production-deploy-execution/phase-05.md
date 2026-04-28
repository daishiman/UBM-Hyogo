# Phase 5: 本番デプロイ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番デプロイ実行 (UT-06) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 本番デプロイ実行 |
| 作成日 | 2026-04-27 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系・ロールバック検証) |
| 状態 | pending |

## 目的

Phase 4 verify suite 全件 PASS と `outputs/phase-04/production-approval.md` の承認完了を前提に、OpenNext Workers（`apps/web`）/ API Workers（`apps/api`）/ D1 への本番初回デプロイを実行し、AC-1 〜 AC-7 を達成する。
不可逆操作（D1 マイグレーション本番適用）を伴うため、必ず D1 バックアップ取得を最初に実行する。
全実行手順・実施日時・コミット SHA・wrangler バージョン・各リソースのデプロイ ID・結果を `outputs/phase-05/` 配下に証跡として記録する。

## 実行タスク

- D1 本番バックアップを取得する（AC-7）
- D1 マイグレーションを本番適用する（AC-3）
- API Workers（`apps/api`）を本番デプロイする（AC-2）
- OpenNext Workers（`apps/web`）を本番デプロイする（AC-1）
- 即時 smoke test を実行する（AC-1 / AC-2 / AC-4 / AC-5）
- 実施記録を `deploy-execution-log.md` に文書化する（AC-6）
- バックアップ証跡を `d1-backup-evidence.md` に記録する（AC-7）
- マイグレーション適用記録を `migration-apply-record.md` に記録する（AC-3）
- 失敗発生時は即時 Phase 6（ロールバック検証）に委譲する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-04.md | verify suite 結果・preflight checklist |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-02.md | デプロイ手順設計・Mermaid 図・rollback runbook |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/phase-01.md | AC・既存資産インベントリ |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/index.md | AC の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live 方針 |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-02/rollback-runbook.md | ロールバック手順（失敗時に即参照） |
| 参考 | apps/api/wrangler.toml | `[env.production]` 構造 |

## 実行手順

### ステップ 1: D1 バックアップ取得（AC-7・必須前置き）

```bash
# 実行直前に timestamp を確定
TS=$(date +%Y%m%d-%H%M%S)

# 本番 D1 を SQL エクスポート
bash scripts/cf.sh d1 export <DB_NAME> \
  --env production \
  --output "outputs/phase-05/backup-${TS}.sql"

# サイズ・行数を確認
wc -l "outputs/phase-05/backup-${TS}.sql"
```

- 初回適用時はテーブル未作成のため空 export でも可（その旨を `d1-backup-evidence.md` に明記）
- バックアップファイルの保管場所（リポジトリ内の outputs か、別の安全な保管領域か）を `d1-backup-evidence.md` に記録する
- バックアップ取得が失敗した場合はステップ 2 以降を実行せず Phase 4 / Phase 6 へ差し戻し

### ステップ 2: D1 マイグレーション本番適用（AC-3）

```bash
# 適用前: 未適用件数を再確認
bash scripts/cf.sh d1 migrations list <DB_NAME> --env production

# 本番適用
bash scripts/cf.sh d1 migrations apply <DB_NAME> --env production

# 適用後: 履歴記録の確認
bash scripts/cf.sh d1 migrations list <DB_NAME> --env production

# テーブル存在確認
bash scripts/cf.sh d1 execute <DB_NAME> \
  --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

- 適用結果を下記「D1 マイグレーション実行記録テーブル」に記録する
- エラー発生時はステップ 3 に進まず Phase 6 のロールバック手順（D1 リストア）を起動する

### ステップ 3: API Workers（`apps/api`）本番デプロイ（AC-2）

```bash
# デプロイ実行
bash scripts/cf.sh deploy --env production

# 直近のデプロイ ID を取得
bash scripts/cf.sh deployments list --env production | head -n 5

# /health エンドポイント疎通確認
curl -sS -o /dev/null -w "%{http_code}\n" https://<api-host>/health
```

- 成功時はデプロイ ID（version_id）を「deploy-execution-log テーブル」に記録する
- 失敗時は Phase 6「Workers デプロイ失敗」シナリオへ即時遷移

### ステップ 4: OpenNext Workers（`apps/web`）本番デプロイ（AC-1）

```bash
# OpenNext adapter 出力を作成
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

# デプロイ実行
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# デプロイ ID 取得
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production | head -n 5

# Web URL 疎通確認
curl -sS -o /dev/null -w "%{http_code}\n" https://<web-url>
```

- 成功時は Workers version_id を「deploy-execution-log テーブル」に記録する
- 失敗時は Phase 6「OpenNext Workers デプロイ失敗」シナリオへ即時遷移

### ステップ 5: 即時 smoke test（AC-1 / AC-2 / AC-4 / AC-5）

| 項目 | コマンド | 期待 | AC |
| --- | --- | --- | --- |
| Pages 200 OK | `curl -sI https://<pages-url> \| head -n 1` | `HTTP/... 200` | AC-1 |
| /health healthy | `curl -sS https://<api-host>/health` | healthy ペイロード | AC-2 |
| D1 SELECT 疎通 | `curl -sS https://<api-host>/health/db`（または相当 endpoint） | 1 件 SELECT 成功 | AC-4 |
| smoke 全件 PASS | 上記 3 件を順次実行 | 全件 PASS | AC-5 |

- 結果を「deploy-execution-log テーブル」の smoke test 列に記録する
- いずれか FAIL の場合は Phase 6「smoke test 失敗」シナリオへ即時遷移

### ステップ 6: 実施記録（AC-6）

- `outputs/phase-05/deploy-execution-log.md` に下記テンプレに従って記録する
- `outputs/phase-05/d1-backup-evidence.md` にバックアップ証跡を記録する
- `outputs/phase-05/migration-apply-record.md` にマイグレーション適用記録を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | verify suite PASS を前提に実行 |
| Phase 6 | 失敗発生時は本 Phase の実行ログを Phase 6 異常系シナリオの input とする |
| Phase 7 | AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 の証跡として deploy-execution-log を参照 |
| Phase 11 | smoke test の本実施結果を Phase 11 で再検証する根拠とする |

## 多角的チェック観点（AIが判断）

- 価値性: AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 が同一 Phase で完結しているか
- 実現性: wrangler コマンドが想定通り動作し、無料枠を超過しないか
- 整合性: 適用対象が production のみであり、staging / local に影響しないか
- 運用性: 失敗時に Phase 6 への遷移基準が明確であり、判断者・所要時間が事前定義されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | D1 バックアップ取得 | 5 | pending | AC-7 / ステップ 1 |
| 2 | D1 マイグレーション適用 | 5 | pending | AC-3 / ステップ 2 |
| 3 | Workers 本番デプロイ | 5 | pending | AC-2 / ステップ 3 |
| 4 | Pages 本番デプロイ | 5 | pending | AC-1 / ステップ 4 |
| 5 | 即時 smoke test | 5 | pending | AC-1 / AC-2 / AC-4 / AC-5 |
| 6 | deploy-execution-log 記録 | 5 | pending | AC-6 |
| 7 | d1-backup-evidence 記録 | 5 | pending | AC-7 |
| 8 | migration-apply-record 記録 | 5 | pending | AC-3 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/deploy-execution-log.md | デプロイ実施記録（実施日時・実施者・wrangler ver・SHA・各 deploy ID・結果） |
| ドキュメント | outputs/phase-05/d1-backup-evidence.md | D1 export バックアップ証跡（取得日時・ファイルパス・サイズ・初回空 export 判定） |
| ドキュメント | outputs/phase-05/migration-apply-record.md | マイグレーション適用記録（ファイル名・適用日時・結果・rollback 可否） |
| ドキュメント | outputs/phase-05/backup-<timestamp>.sql | 取得した D1 バックアップ SQL（または保管場所への参照） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- D1 バックアップが取得され、`d1-backup-evidence.md` に記録されている（AC-7）
- D1 マイグレーションが本番適用され、`migration-apply-record.md` に記録されている（AC-3）
- Workers が本番デプロイされ、`/health` が healthy を返す（AC-2）
- OpenNext Workers の Web URL が 200 OK を返す（AC-1）
- D1 SELECT 疎通が確認されている（AC-4）
- smoke test 全件 PASS（AC-5）
- `deploy-execution-log.md` に AC-6 の必須項目が記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 失敗発生時は Phase 6 への遷移が明記されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 6 (異常系・ロールバック検証)
- 引き継ぎ事項: deploy-execution-log / d1-backup-evidence / migration-apply-record・各 deploy ID・本番 URL を Phase 6 に渡す
- ブロック条件: AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 のいずれかが未達なら次 Phase に進まない（Phase 6 でロールバック検証を行うかを判断）

## deploy-execution-log テーブル（AC-6 必須テンプレ）

> `outputs/phase-05/deploy-execution-log.md` に下表をコピーして埋めること。

| 項目 | 値 |
| --- | --- |
| 実施日時（開始） | YYYY-MM-DD HH:MM:SS JST |
| 実施日時（完了） | YYYY-MM-DD HH:MM:SS JST |
| 実施者 | <GitHub handle> |
| 立会レビュアー | <GitHub handle> |
| wrangler バージョン | `wrangler --version` の出力 |
| Node.js バージョン | `.mise.toml` 固定値（24.15.0 想定） |
| pnpm バージョン | `.mise.toml` 固定値（10.33.2 想定） |
| 対象ブランチ | main |
| コミット SHA | `git rev-parse HEAD` |
| 初回デプロイ判定 | YES / NO |

### リソース別実行記録

| # | リソース | コマンド要約 | デプロイ ID / version_id | 開始 | 完了 | 結果 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | D1 backup | `wrangler d1 export ... --env production` | n/a | | | PASS / FAIL | バックアップファイル名 |
| 2 | D1 migration | `wrangler d1 migrations apply ... --env production` | n/a | | | PASS / FAIL | 適用件数 |
| 3 | Workers (apps/api) | `wrangler deploy --env production` | <version_id> | | | PASS / FAIL | service name |
| 4 | OpenNext Workers (apps/web) | `wrangler deploy --config apps/web/wrangler.toml --env production` | <version_id> | | | PASS / FAIL | service name |
| 5 | smoke: Pages 200 | `curl -sI https://<pages-url>` | n/a | | | PASS / FAIL | response |
| 6 | smoke: /health | `curl -sS https://<api-host>/health` | n/a | | | PASS / FAIL | response |
| 7 | smoke: D1 SELECT | `curl -sS https://<api-host>/health/db` | n/a | | | PASS / FAIL | response |

### 総合判定

| 項目 | 値 |
| --- | --- |
| 総合結果 | PASS / FAIL |
| Phase 6 への遷移要否 | 不要 / 要（理由: ） |
| 次アクション | Phase 6 異常系・ロールバック検証へ |

## D1 マイグレーション実行記録テーブル（AC-3 必須テンプレ）

> `outputs/phase-05/migration-apply-record.md` に下表をコピーして埋めること。

| # | マイグレーションファイル名 | 適用日時 | 結果 | rollback 可否 | rollback 手順への参照 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `0001_<name>.sql` | YYYY-MM-DD HH:MM:SS | PASS / FAIL | YES / NO | `outputs/phase-02/rollback-runbook.md#d1` | スキーマ初期化 |
| 2 | `0002_<name>.sql` | | | | | |
| ... | | | | | | |

### 適用前後サマリー

| 項目 | 適用前 | 適用後 |
| --- | --- | --- |
| 未適用件数 | <preflight 値> | 0 |
| 適用済件数 | <preflight 値> | <preflight 値 + 適用件数> |
| 検出されたテーブル | （Phase 4 ステップ 6 結果） | `SELECT name FROM sqlite_master WHERE type='table';` の結果 |

### バックアップ参照

- バックアップファイル: `outputs/phase-05/backup-<timestamp>.sql`
- バックアップ取得証跡: `outputs/phase-05/d1-backup-evidence.md`
- リストア手順: `outputs/phase-02/rollback-runbook.md` の D1 セクション

## 失敗時の即時アクション（Phase 6 への委譲基準）

| 失敗箇所 | 即時アクション | Phase 6 シナリオ参照 |
| --- | --- | --- |
| ステップ 1（D1 backup 失敗） | ステップ 2 以降を実行しない・Phase 4 verify suite と権限を再確認 | Phase 6: D1 マイグレーション中エラー（前段） |
| ステップ 2（migration 適用失敗） | バックアップから手動リストアを実施 | Phase 6: D1 マイグレーション中エラー |
| ステップ 3（Workers デプロイ失敗） | Workers のみロールバック（前 version_id があれば）・D1 リストア要否を判断 | Phase 6: Workers デプロイ失敗 |
| ステップ 4（Pages デプロイ失敗） | Pages のみロールバック（前 deployment があれば）・Workers/D1 ロールバック要否を判断 | Phase 6: Pages デプロイ失敗 |
| ステップ 5（smoke test 失敗） | 失敗箇所に応じて全系統ロールバック検討 | Phase 6: 本番 URL 404 / /health 5xx / D1 binding 未解決 |

**判断者:** delivery 担当 + レビュアー 1 名
**判断 SLA:** 失敗検出から 5 分以内に Phase 6 シナリオに遷移するか、再試行するかを判断する
