# UT-06 Follow-up E: D1 バックアップの長期保管・自動化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-E |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2 |
| 作成日 | 2026-04-27 |
| 種別 | implementation |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-E |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

UT-06 Phase 5 では D1 バックアップを `outputs/phase-05/` 配下を一次保管としたが、長期保管・冗長化が未確立。R2 / 1Password Environments / 外部ストレージへ長期保管し、CI/CD の日次 cron で自動取得する。

## スコープ

### 含む

- `wrangler d1 export` を `bash scripts/cf.sh d1 export` 経由で日次実行する GitHub Actions / Cloudflare cron triggers の構築
- 保存先: R2 を第一候補（同一アカウント・無料枠内）、1Password Environments を補助
- 世代管理: 直近 30 日 + 月次スナップショット
- 復元手順 runbook の整備
- 失敗時のアラート（UT-08 通知基盤と統合）

### 含まない

- D1 binding そのものの変更
- 復元自動化（runbook ベースの手動復元で MVP）
- マルチリージョン保管

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-06 本番デプロイ完了 | 本番 D1 が存在することが前提 |
| 上流 | UT-12 R2 storage / UT-08 monitoring | 保存先・通知基盤の前提 |
| 関連 | UT-06 Phase 6 D-2 restore-empty.sql | 初回 migration 失敗時の復元雛形 |

## 苦戦箇所・知見

**1. 初回 migration 直後の空 export**
Phase 12 skill-feedback F-1 で確認した通り、初回マイグレーション適用前は `wrangler d1 export` が空 export を返す。これを「失敗」と解釈しないバリデーション（行数 0 を許容するか、初回フラグで分岐するか）が必要。

**2. R2 保管時の暗号化**
D1 export は SQL 平文。会員情報を含む場合は R2 側で SSE-C / KMS 等の暗号化が必須。`outputs/phase-09/secret-hygiene-checklist.md` を参照して機密性レベルを判定する。

**3. cron 実行の monthly 無料枠**
GitHub Actions private 無料枠（月 2,000 分）を圧迫しないよう、Cloudflare cron triggers を優先候補にする。GitHub Actions を使う場合は UT-05-FU-003 監視対象になる。

**4. 復元 runbook の机上演習**
バックアップだけでは意味がなく、「復元できる」ことを定期的に検証する必要がある。UT-06 Phase 6 で rollback-rehearsal を作成済みのため、その拡張として机上演習計画を含める。

## 受入条件

- [ ] 日次バックアップ cron が稼働し成功 log が確認できる
- [ ] R2 等の長期保管先に最低 30 日 + 月次スナップショットが保持される
- [ ] export ファイルに対する暗号化または ACL が設定済み
- [ ] 復元 runbook が整備され机上演習結果が記録されている
- [ ] バックアップ失敗時に UT-08 通知基盤経由でアラートが届く
- [ ] 初回 migration 前の空 export を許容するバリデーションを実装

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-E |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md | 一次保管の現状 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | F-1 反映済 |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md | 復元演習の参考 |
