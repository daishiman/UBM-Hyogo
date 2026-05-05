# Phase 12 成果物: 実装ガイド (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 12 / 13（ドキュメント更新） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup |

---

## Part 1: 中学生レベル解説（日常の例え話）

### このタスクは何をしたの？

学校の **「教室の時間割表」** と **「職員室にある先生用の指導メモ」** がずれていた、という話です。

- **教室の時間割表** = `.github/workflows/*.yml`（実際に動いている CI/CD のワークフロー）
- **職員室の指導メモ** = `deployment-gha.md` / `deployment-cloudflare.md`（こうあってほしい、という正本仕様）

教室の時間割表は最新（Node 24・pnpm 10）に書き換わっていたのに、職員室の指導メモには「Node 22・pnpm 9」と古いまま書かれていました。それで、**メモのほうを最新に直しました**。

### 例え話 1: 古いメモを最新にする

> 先生のメモ「給食は 12:30 から」と書いてあるけど、本当は 12:15 から始まっている、というずれと同じ。
> 給食の時間（実体）は変えず、メモ（仕様書）の方を「12:15」に直した。

これが **docs-only 差分**。ファイルの中の文字を直すだけで終わる。

### 例え話 2: 別の宿題カードに分ける

> 「校舎裏で発表するか体育館で発表するか」という重い判断（Pages を使うか OpenNext Workers を使うか）は、メモ書き換えだけでは終わらない。教室を移動する作業（実体の `wrangler.toml` 書き換え）が必要。
> こういう案件は **別の宿題カード**（`UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION`）にして後で取り組む。

これが **impl 必要差分**。本タスクでは「宿題カードを切り出す」ところまでで終わり。

### 例え話 3: 死んでいる監視を直す

> 校長先生が見守りカメラのチェックリストに「3 番教室」と書いていたけど、3 番教室はもう存在しないことが判明。
> 「カメラリストの方を最新の教室名（`web-cd.yml` / `backend-ci.yml` / `verify-indexes.yml`）に直す」のは別の人の宿題（`UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC`）にしました。

つまり、本タスクは **「指導メモを直す部分」** だけを完了させ、教室の配置換えやカメラ設定変更は別宿題に渡しました。

### なぜこの分け方が大事？

- 「メモを直すだけ」と「教室を動かす」を一緒にやると、何かこわれた時にどちらが原因か分からなくなる。
- だから docs-only と impl 必要を **必ず分ける**。
- これで「メモは合っている？」「教室は正しい？」を別々にチェックできる。

---

## Part 2: 技術者レベル

### Phase 11 evidence 参照

| 証跡 | path | 判定 |
| --- | --- | --- |
| docs-only smoke summary | `outputs/phase-11/main.md` | PASS |
| manual smoke log | `outputs/phase-11/manual-smoke-log.md` | PASS（`yamllint` / `actionlint` は未導入のため N/A） |
| link checklist | `outputs/phase-11/link-checklist.md` | PASS（真の死リンク 0 件、Phase 12 生成済みファイルを再確認） |

本タスクは `visualEvidence: NON_VISUAL` のため、スクリーンショットは不要。`outputs/phase-11/screenshots/` も作成しない。

### 棚卸し対象 yaml（5 件）

| ファイル | 用途 | trigger | 主要 job | deploy target |
| --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | PR 品質ゲート | `pull_request` | `typecheck-lint` / `coverage-gate`（soft） | なし（CI のみ） |
| `.github/workflows/validate-build.yml` | ビルド検証 | `pull_request` / `push` | `validate-build` | なし |
| `.github/workflows/verify-indexes.yml` | aiworkflow-requirements skill indexes drift 検出 | `pull_request` / `push` | `verify-indexes` | なし |
| `.github/workflows/web-cd.yml` | apps/web CD | `push` (dev / main) | `deploy-staging` / `deploy-production` | Cloudflare Pages（現状） |
| `.github/workflows/backend-ci.yml` | apps/api CD | `push` (dev / main) | `deploy-staging` / `deploy-production`（D1 migrations apply 含む） | Cloudflare Workers |

### 抽出キー（rg 棚卸し用）

```
node-version       # 全 5 yaml で '24' に統一
pnpm/action-setup  # 全 5 yaml で v4
runs-on            # 全 job で ubuntu-latest
on: / jobs:        # trigger / job 構造の同定
pages_build_output_dir, main = ".open-next/worker.js"   # apps/web の deploy 形式判定
[triggers], [[d1_databases]], [[kv_namespaces]]         # apps/api の binding 種別
```

### drift 分類（Phase 2 SSOT）

| カテゴリ | 件数（base case） | 適用先 |
| --- | --- | --- |
| `docs-only`（仕様書側更新で完結） | 7 件（DRIFT-01/02/04(a)/05(a)/07/08/10） | 本タスク Phase 12 で `deployment-gha.md` / `deployment-cloudflare.md` を編集 |
| `impl-required`（yaml or wrangler.toml の構造変更を伴う） | 1 件確定 + 最大 3 件条件付き | `UT-CICD-DRIFT-IMPL-*` 派生タスク群へ委譲 |
| `既存タスクへ委譲` | 2 件（DRIFT-08 → coverage-80-enforcement / DRIFT-09 → UT-13） | 該当 task の責務として保留 |

### 派生タスク命名規則

```
UT-CICD-DRIFT-IMPL-<scope>-<short-summary>.md
```

具体例:

- `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION.md`
- `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC.md`
- `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP.md`
- `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY.md`
- `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION.md`
- `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md`

### 検証コマンド一覧

```bash
# 棚卸し
rg -n "node-version|pnpm|^on:|^jobs:" .github/workflows/

# 構文検証（ローカル要 brew install）
yamllint .github/workflows/
actionlint .github/workflows/*.yml

# wrangler.toml 整合
rg -n "pages_build_output_dir|^main\s*=|compatibility_date|\[triggers\]|\[\[d1_databases\]\]" \
   apps/web/wrangler.toml apps/api/wrangler.toml

# Issue 状態確認
gh issue view 58 --json state,title,url

# CODEOWNERS 構文検証（並列 UT-GOV-003 整合）
gh api repos/daishiman/UBM-Hyogo/codeowners/errors

# 派生タスク命名衝突
ls docs/30-workflows/unassigned-task/ | rg "UT-CICD-DRIFT-IMPL"
```

### 不変条件 reaffirmation

| # | 不変条件 | 本タスクでの reaffirmation |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | `apps/web/wrangler.toml` に `[[d1_databases]]` バインディングが存在しないことを §4 smoke で確認 |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 全 5 workflow yaml に GAS prototype を deploy 対象とする step なし |

### Phase 12 で行う実体ファイル更新

| ファイル | 更新内容 | 起源 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Node 22 → 24 / pnpm 9 → 10.33.2 / workflow 構成表に validate-build / verify-indexes 追加 / Discord 通知未実装注記 / coverage 段階性注記 | DRIFT-01 / 02 / 04(a) / 05(a) / 08 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Pages 形式 vs OpenNext Workers 形式の併記注記 / cron に `0 18 * * *` を追記し 3 件に同期 / KV binding 例の脚注 | DRIFT-03 / 07 / 09 / 10 |

### Phase 12 で **行わない** 変更（impl 必要差分）

- `.github/workflows/*.yml` 本体の編集
- `apps/web/wrangler.toml` の `pages_build_output_dir` → `main = ".open-next/worker.js"` cutover
- `apps/api/wrangler.toml` への KV binding 追加
- 05a `observability-matrix.md` の workflow 名同期

これらは派生 `UT-CICD-DRIFT-IMPL-*` タスクで実施。

### PR メッセージ草案

> [UT-CICD-DRIFT] CI/CD workflow topology and deployment spec drift cleanup (docs-only)
>
> ## 概要
> `.github/workflows/*.yml` の現行実体（Node 24 / pnpm 10.33.2 / 5 workflow 構成）と
> aiworkflow-requirements 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）の drift を
> docs-only で解消。実装変更が必要な差分は派生 `UT-CICD-DRIFT-IMPL-*` に委譲。
>
> ## 主な変更
> - `deployment-gha.md`: Node/pnpm バージョン同期、workflow 構成表に validate-build / verify-indexes 追加、Discord 通知未実装注記、coverage 段階性注記
> - `deployment-cloudflare.md`: Pages vs OpenNext Workers 併記、API cron 3 件に同期、KV 脚注
> - `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md`: 派生 impl タスクの起票方針登録
>
> ## docs-only / NON_VISUAL
> `apps/` / `packages/` 配下の変更なし。`workflow_state` は `spec_created` のまま据え置き。
>
> Closes #58 (already CLOSED, retained for reference)
