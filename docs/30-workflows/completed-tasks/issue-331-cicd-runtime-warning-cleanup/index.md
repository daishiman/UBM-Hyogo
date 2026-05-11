# issue-331-cicd-runtime-warning-cleanup - タスク仕様書 index

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| タスク名 | apps/api wrangler.toml vars 継承 warning 解消 + web-cd.yml の pages deploy → workers deploy 移行 |
| ディレクトリ | docs/30-workflows/issue-331-cicd-runtime-warning-cleanup |
| Wave | 1 |
| 実行種別 | serial（サブタスク S1: apps/api wrangler 整理 → サブタスク S2: web-cd workflow 移行） |
| 作成日 | 2026-05-09 |
| 担当 | unassigned |
| 状態 | implemented-local / runtime evidence pending_user_approval |
| taskType | implementation |
| subtype | ci-config-cleanup |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | MEDIUM |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/331（CLOSED、PR 文脈は `Refs #331`） |

## 目的

GitHub issue #331 集約タスクのうち、調査の結果、以下 2 項目が残存している。本タスクはこの 2 項目を 1 サイクル内で完遂し、CI/CD の wrangler runtime warning ゼロを達成する。

1. **`apps/api/wrangler.toml` の vars 継承 warning 解消**: top-level `[vars]` ブロックと `[env.production.vars]` / `[env.staging.vars]` で同一キー（`ENVIRONMENT`, `SHEET_ID`, `FORM_ID`, `GOOGLE_FORM_ID`, `SHEETS_SPREADSHEET_ID`, `SYNC_BATCH_SIZE`, `SYNC_MAX_RETRIES`, `SYNC_RANGE`, `RETENTION_PURGE_MODE`, `TAG_QUEUE_PAUSED`）が重複しており、wrangler は env 配下に top-level vars を継承しないため warning を emit する。
2. **`.github/workflows/web-cd.yml` の `pages deploy` → `workers deploy` 移行**: `apps/web/wrangler.toml` は OpenNext Workers 構成（`main = ".open-next/worker.js"`、`[assets]`, `[env.staging]`, `[env.production]` 完備）に移行済みだが、`web-cd.yml` は依然 `cloudflare/wrangler-action@v3` で `command: pages deploy .next --project-name=...` を実行しており不整合。CLAUDE.md の「`wrangler` を直接呼ばない」「`scripts/cf.sh` ラッパーのみ」の不変条件にも違反するため、`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>` 経路に切り替える。

## 背景・派生元

- 由来: `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`
- 解決済み（スコープ外として明記）:
  - staging/production `CLOUDFLARE_API_TOKEN` 分離は target contract として存在するが、現行 `backend-ci.yml` / `web-cd.yml` は environment-scoped `CLOUDFLARE_API_TOKEN` を使用中。OIDC / step-scoped token cutover は別タスクで扱う
  - `apps/web` `pages_build_output_dir` 未設定 warning（OpenNext Workers 移行で消滅）

## スコープ

### 含む

- **S1: `apps/api/wrangler.toml` の vars 整理**
  - top-level `[vars]` の env-specific 重複キーを削除（または local-dev 用最小集合に限定）
  - `[env.production.vars]` / `[env.staging.vars]` を env-specific の正本として固定
  - `[triggers]`, `[[d1_databases]]`, `[[analytics_engine_datasets]]`, `[[r2_buckets]]` などの bindings の env 継承挙動を確認
  - `bash scripts/cf.sh deploy --dry-run` で warning がゼロになることを確認
- **S2: `.github/workflows/web-cd.yml` の Pages → Workers 移行**
  - `cloudflare/wrangler-action@v3` の `command: pages deploy ...` を、`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>` 経路に切り替える
  - staging（`dev` push）/ production（`main` push）双方で経路統一
  - `pages deploy` 文字列が `.github/workflows/` から消失することを `grep` で確認
  - 関連する Token / Variable 命名（現行 `CLOUDFLARE_API_TOKEN` / 廃止候補 `CLOUDFLARE_PAGES_PROJECT`）の整合確認
- aiworkflow-requirements の `deployment-gha.md` / `environment-variables.md` を current facts に同期（Phase 12）
- 上流タスク `U-FIX-CF-ACCT-02` および UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION の supersede 関係を index.md に明記

### 含まない

- `apps/api` のコードロジック変更
- `apps/web` のコードロジック変更
- D1 schema 変更
- Google Form schema 変更
- API Token のスコープ最小化監査（別タスク）
- Token ローテーション運用（issue-407 別タスク）
- `apps/web/wrangler.toml` の bindings 追加（必要に応じて env-specific 確認のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | FIX-CF-ACCT-ID-VARS-001（completed） | account ID 参照修正済み。S2 移行の前提 |
| 上流 | OpenNext Workers 移行（apps/web/wrangler.toml） | S2 の前提（Workers 構成は完了済み） |
| 並列 | なし | サブタスク内では S1 → S2 の serial 実行 |
| 下流 | dev/main の web-cd 全体 | S2 完了後、`pages deploy` 経路は廃止 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/wrangler.toml | S1 修正対象 |
| 必須 | .github/workflows/web-cd.yml | S2 修正対象 |
| 必須 | apps/web/wrangler.toml | S2 設定確認（変更は最小限） |
| 必須 | scripts/cf.sh | S2 が呼び出すラッパー |
| 必須 | CLAUDE.md（Cloudflare 系 CLI 実行ルール） | 不変条件の根拠 |
| 必須 | docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md | 直接の派生元 |
| 参考 | https://github.com/daishiman/UBM-Hyogo/issues/331 | 集約 issue |
| 参考 | https://developers.cloudflare.com/workers/wrangler/configuration/#inheritance | env 継承仕様 |
| 参考 | https://developers.cloudflare.com/workers/static-assets/ | OpenNext Workers + Assets |

## 受入条件 (AC)

- AC-1: `apps/api/wrangler.toml` で top-level `[vars]` の env-specific 重複キーが解消されている（local-dev 用最小集合 or 削除）
- AC-2: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run` / `--env staging --dry-run` の vars 継承 warning がゼロ（runtime evidence は Phase 13 user approval 後に取得）
- AC-3: `.github/workflows/web-cd.yml` が `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>` 経路（または `wrangler-action` で Workers deploy）に移行されている
- AC-4: `pages deploy` 文字列が `.github/workflows/web-cd.yml` から消失（`grep -rn 'pages deploy' .github/workflows/` で 0 件）
- AC-5: staging deploy が成功（`gh workflow run web-cd.yml --ref dev` が green）
- AC-6: production deploy で wrangler warning が CI ログにゼロ
- AC-7: aiworkflow-requirements の `deployment-gha.md` / `environment-variables.md` が current facts へ同期されている
- AC-8: 関連仕様書（`U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`、UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION）の supersede 関係が index.md に明記されている
- AC-9: 不変条件（D1 直接アクセス禁止、`wrangler` 直接呼び出し禁止）を侵害しないことを確認している
- AC-10: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- AC-11: Phase 12 close-out で 7 ファイル（main.md + 6 補助）が揃っている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計（vars 整理 / Workers 移行設計） | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke test | phase-11.md | completed_static_runtime_pending | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md（+ 6 補助） |
| 13 | PR作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 変更対象ファイル一覧

| パス | 変更種別 | サブタスク |
| --- | --- | --- |
| apps/api/wrangler.toml | 編集 | S1 |
| .github/workflows/web-cd.yml | 編集 | S2 |
| apps/web/wrangler.toml | 編集（必要時のみ・bindings 確認） | S2 |
| .claude/skills/aiworkflow-requirements/references/deployment-gha.md | 編集 | Phase 12 |
| .claude/skills/aiworkflow-requirements/references/environment-variables.md | 編集 | Phase 12 |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 影響なし（CI / 設定ファイル変更のみ） |
| CLAUDE.md Cloudflare CLI 実行ルール | `wrangler` 直接呼び出し禁止、`scripts/cf.sh` ラッパー経由のみ | S2 で workflow を `scripts/cf.sh` 経路に再整合 |

## 重要な参照ルール

- `wrangler` を直接呼び出さない。CI / ローカル双方で `bash scripts/cf.sh ...` 経路を正本とする
- `.env` 実値は読まない、API Token 値は出力・転記しない
- main 直接 push 禁止、PR base は `dev`

## 関連リンク

- 上位 README: ../README.md
- 直接の派生元: ../completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/331
- supersede 候補: UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION
