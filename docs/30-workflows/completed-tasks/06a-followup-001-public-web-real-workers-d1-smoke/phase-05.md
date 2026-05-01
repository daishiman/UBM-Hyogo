# Phase 5: 実装ランブック

## 目的

local smoke と staging smoke を実行する手順を、`scripts/cf.sh` ラッパー経由で統一する。**`wrangler` 直接実行は CLAUDE.md ポリシーで禁止**しており、本ランブックでも一切記載しない。

## 前提

- mise / pnpm install 済み（Node 24 / pnpm 10）
- `.env` に 1Password 参照（`op://...`）が設定済み
- `apps/api/wrangler.toml` の D1 binding（dev / staging）が既存 migration apply 済み
- 本タスクの作業ディレクトリ = ワークツリー root

## 実行順序（高レベル）

1. esbuild mismatch 事前確認（`bash scripts/cf.sh whoami` が成功すること）
2. `apps/api` を `scripts/cf.sh` 経由で local dev 起動（D1 binding をローカルで使用）
3. `apps/web` を `PUBLIC_API_BASE_URL=http://localhost:8787` で起動
4. local curl matrix を実行し `outputs/phase-11/evidence/local-curl.log` に保存
5. `/members` のレスポンスに seed member が含まれることを確認（実体経路の証跡）
6. 不変条件 #5 を `rg -n "D1Database|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**'` で 0 件確認
7. staging deploy 状態確認（既存デプロイを使う場合は確認のみ、未デプロイなら `scripts/cf.sh deploy` 経由）
8. Cloudflare deployed vars 確認（`PUBLIC_API_BASE_URL` が staging API URL を指すこと。`apps/web/wrangler.toml` は現状未定義のため補助確認のみ）
9. staging curl matrix を実行し `outputs/phase-11/evidence/staging-curl.log` に保存
10. staging `/members` の screenshot を 1 枚保存

## 詳細手順は別ファイル

詳細コマンド列は `outputs/phase-05/runbook.md` を正本とする。本ファイルは「**順序の正本**」、runbook.md は「**コマンドの正本**」として責務分離する。

## ロールバック / 中断

- local 起動後 `Listening on http://127.0.0.1:8787` を **2 回連続 fresh 起動で観測できない場合** は Phase 6 の esbuild mismatch シナリオに分岐
- staging curl がいずれかで `5xx` を返した場合、`scripts/cf.sh rollback <VERSION_ID>` 経由で直前 deploy に戻す（version id は `wrangler deployments list` 相当を `scripts/cf.sh` 経由で取得）
- D1 migration drift が疑われる場合、`bash scripts/cf.sh d1 migrations list` で apply 状態を確認

## evidence 保存ルール

- すべて `outputs/phase-11/evidence/` 配下に保存
- 命名は Phase 4 の規則に従う
- secret 値は `redacted` で置換、API token / D1 ID は記録しない

## 完了条件

- [ ] 既存の完了条件を満たす

- AC-1〜7 のうち、local 起動 / curl matrix / staging vars / 不変条件 #5 trace が evidence で確認可能
- runbook.md の全コマンドが追跡可能（手書き履歴ではなく、コピペ実行できる粒度）

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 5
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- scripts/cf.sh 経由の起動 runbook を整備する
- direct wrangler 実行禁止と secret hygiene を確認する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-05/main.md`

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。
