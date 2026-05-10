# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 5 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 実装手順

### S1: apps/api/wrangler.toml の vars 整理（serial 1）

1. ブランチ作成: `feat/issue-331-cicd-warning-cleanup`（base = `dev`）
2. `apps/api/wrangler.toml` を編集
   - top-level `[vars]` ブロック（L6〜L16 相当）を削除
   - 削除箇所にコメントを追加: `# top-level [vars] は env 配下に継承されないため削除。`
   - `[env.production.vars]` / `[env.staging.vars]` は変更しない
   - `[triggers]`, `[[d1_databases]]`, `[[analytics_engine_datasets]]` は残す（Phase 2 結論）
3. dry-run で warning ゼロ確認:
   ```bash
   bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 | grep -i warning || echo "OK: no warning"
   bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run 2>&1 | grep -i warning || echo "OK: no warning"
   ```
4. commit: `chore(api): drop top-level [vars] to silence wrangler env-inheritance warning (issue-331 S1)`

### S2: .github/workflows/web-cd.yml の Pages → Workers 移行（serial 2）

1. `apps/web/wrangler.toml` の `name` / `[env.staging]` / `[env.production]` を確認
2. `.github/workflows/web-cd.yml` を編集
   - staging deploy step を `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` に置換
   - production deploy step を `--env production` で同様に置換
   - `cloudflare/wrangler-action@v3` 利用ステップを削除
   - OpenNext build step（`pnpm --filter @ubm-hyogo/web exec opennextjs-cloudflare build`）を build 後に追加（`pnpm build` で代替できるなら不要）
   - env で `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を export
3. 静的検証:
   ```bash
   grep -rn 'pages deploy' .github/workflows/   # 0 件期待
   grep -n 'scripts/cf.sh deploy' .github/workflows/web-cd.yml
   ```
4. commit: `ci(web-cd): migrate from pages deploy to workers deploy via scripts/cf.sh (issue-331 S2)`

### Phase 12 同期（後続）

5. `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の web-cd 記述を Workers deploy に更新
6. `.claude/skills/aiworkflow-requirements/references/environment-variables.md` の `CLOUDFLARE_PAGES_PROJECT` 項を「未参照（廃止候補）」に注記

## 入出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | apps/api/wrangler.toml, .github/workflows/web-cd.yml, apps/web/wrangler.toml |
| 出力 | warning ゼロ dry-run、green な web-cd run |
| 副作用 | staging Pages project 配信停止（既存 URL は Workers の `*.workers.dev` に切替） |

## テスト方針

- Phase 4 の T-1〜T-9 を順次実行
- 失敗時は Phase 6 異常系へ

## ローカル実行コマンド

```bash
# 全検証パイプライン
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run 2>&1 | grep -i warning
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run 2>&1 | grep -i warning
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run 2>&1 | grep -i warning
grep -rn 'pages deploy' .github/workflows/

# CI 実行
gh workflow run web-cd.yml --ref dev
gh run watch
```

## DoD

- [ ] S1 で top-level `[vars]` 削除済み
- [ ] S2 で `pages deploy` が web-cd.yml から消滅、`scripts/cf.sh deploy` に置換済み
- [ ] dry-run で warning ゼロ
- [ ] commit が S1 / S2 で分離されている
- [ ] AC-1〜AC-6 をローカルで確認

## 成果物

- `outputs/phase-05/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 完了条件

- [ ] 本 Phase の成果物と受入条件が対応している。
- [ ] user-gated runtime 操作を自動実行していない。

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

