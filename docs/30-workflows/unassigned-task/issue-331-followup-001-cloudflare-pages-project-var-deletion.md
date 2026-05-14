# Issue #331 Followup CLOUDFLARE_PAGES_PROJECT GitHub Variable Deletion - タスク指示書

> [SUPERSEDED] by `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/`
> Date: 2026-05-14
> Refs: GitHub Issue #638 (CLOSED)
>
> 本 unassigned-task spec は Phase 1-13 仕様書フォーマットに昇格された置換 spec に統合された。
> 履歴保全のため本ファイルは削除せず残置するが、新規参照は置換先を使うこと。

## メタ情報

```yaml
issue_number: pending
task_id: issue-331-followup-001-cloudflare-pages-project-var-deletion
task_name: Issue #331 Followup CLOUDFLARE_PAGES_PROJECT GitHub Variable Deletion
category: 整理
target_feature: GitHub Variables / Cloudflare Pages dormant cleanup
priority: 低
scale: 小規模
status: 未実施
source_phase: ../issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-09
dependencies: []
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-331-followup-001-cloudflare-pages-project-var-deletion` |
| タスク名 | Issue #331 Followup CLOUDFLARE_PAGES_PROJECT GitHub Variable Deletion |
| 分類 | 整理 |
| 対象機能 | GitHub Variables / Cloudflare Pages dormant cleanup |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-09 |
| source issue | Issue #331 (CI/CD runtime warning cleanup) / もとの fold 先 Issue #419 は CLOSED |
| taskType | external mutation (GitHub Variables) |
| visualEvidence | NON_VISUAL |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #331 (CI/CD runtime warning cleanup) の Phase-12 で、`web-cd.yml` の Cloudflare Pages deploy step を撤去し、`@opennextjs/cloudflare` 経由の Workers deploy に統一した（implementation-guide.md S2 セクション参照）。この改修により、GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` は workflow からの参照を失い、リポジトリ内のどのコードからも利用されなくなった。

ただし GitHub Variable の削除はリポジトリ外部 (GitHub API) への mutation であり、Phase-12 の docs-only スコープ外のため deferred に分類された (`unassigned-task-detection.md` の deferred items table 2 行目)。当初は Issue #419 (Pages dormant cleanup) に fold する想定だったが、Issue #419 は既に CLOSED のため、tracking gap が発生している。

### 1.2 問題点・課題

- 未参照の repository variable が残存することで、後続オペレーターが「実は使われている」と誤認し、誤った dependency 仮定を持つリスクがある。
- Issue #419 fold 先が消失しているため、本変数の削除責任が宙に浮いている。
- 設定の正本場所を 1 箇所に寄せる原則 (Issue #331 で wrangler env vars 二重定義を整理した経緯) と矛盾する dormant 設定が残る。

### 1.3 放置した場合の影響

- Pages 関連の cleanup を別タスクで再着手する際、再度 deferred 判定を繰り返す手戻りが発生する。
- Variable scope (repo / environment) の認識ズレを抱えたまま、別の Pages 関連変数削除と混同して誤削除する余地が残る。
- 監査・棚卸の観点で「未使用変数 0 件」の baseline を確立できない。

---

## 2. 何を達成するか（What）

### 2.1 目的

Issue #331 の Workers deploy 切替で未参照になった `CLOUDFLARE_PAGES_PROJECT` を GitHub repository variable から削除し、`.github/` 配下からの参照 0 件を grep gate で確認する。

### 2.2 最終ゴール

- `gh variable list --repo daishiman/UBM-Hyogo` の出力に `CLOUDFLARE_PAGES_PROJECT` が存在しない状態。
- `rg CLOUDFLARE_PAGES_PROJECT .github/` の hit が 0 件。
- 削除前後の evidence (list 出力) を本 unassigned task の実行記録として残せる状態。

### 2.3 スコープ

#### 含むもの

- `CLOUDFLARE_PAGES_PROJECT` repository variable の削除 (repo scope)。
- 削除前後の `gh variable list` evidence 取得。
- `.github/` 配下の grep gate 確認。

#### 含まないもの

- environment-scoped 変数 (`staging` / `production`) の削除。本タスクは repo scope のみ。
- Cloudflare Pages project 本体の削除 (Issue #419 のスコープであり、CLOSED のため再オープンまたは別 issue 採番が必要)。
- staging Pages project retirement (deferred items table 3 行目)。
- OIDC / step-scoped `CF_TOKEN_*` cutover (deferred items table 1 行目)。
- commit / push / PR 作成 (本タスクは外部 mutation のみで、リポジトリ差分は生まない)。

### 2.4 成果物

- 削除前 evidence: `gh variable list --repo daishiman/UBM-Hyogo | grep CLOUDFLARE_PAGES_PROJECT` の出力。
- 削除後 evidence: 同コマンドが exit 1 (hit 0) を返すことの記録。
- grep gate evidence: `rg CLOUDFLARE_PAGES_PROJECT .github/` が hit 0 を返すことの記録。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `gh` CLI が `daishiman/UBM-Hyogo` への repository variable write 権限を持つ token で認証されていること (`gh auth status` で確認)。
- Issue #331 の `web-cd.yml` 改修 (commit `4a630dbb` 系列) が既に `dev` / `main` にマージ済みであること。未マージの場合、削除すると CI が壊れる。
- 本タスク開始前に `rg CLOUDFLARE_PAGES_PROJECT .github/` を実行し、既に hit 0 であることを確認する (Issue #331 PR マージ後の状態)。

### 3.2 依存タスク

- Source workflow: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/`
- Source detection: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md`
- 元 fold 先 Issue #419 (CLOSED) — 再オープンは不要、本タスクが新たな canonical owner となる。

### 3.3 必要な知識

- `gh variable` サブコマンドの repo scope と environment scope の区別。
  - repo scope: `gh variable delete <NAME> --repo <OWNER>/<REPO>`
  - environment scope: `gh variable delete <NAME> --env <ENV_NAME> --repo <OWNER>/<REPO>`
  - 本タスク対象は repo scope のみ。
- `ripgrep` (`rg`) による grep gate 実行。
- GitHub Actions workflow ファイル内での `vars.CLOUDFLARE_PAGES_PROJECT` 参照表記。

### 3.4 推奨アプローチ

1. 削除前 evidence を取得する。
2. `.github/` 配下の grep gate で hit 0 を再確認する (安全装置)。
3. `gh variable delete` を実行する。
4. 削除後 evidence を取得する。
5. 本ファイルに実行ログを追記、または完了タスクとして移動する判断をユーザーに委ねる。

### 3.5 実行コマンド

```bash
# Step 1: 削除前 evidence
gh variable list --repo daishiman/UBM-Hyogo | grep CLOUDFLARE_PAGES_PROJECT

# Step 2: grep gate (hit 0 を期待)
rg CLOUDFLARE_PAGES_PROJECT .github/

# Step 3: 削除実行
gh variable delete CLOUDFLARE_PAGES_PROJECT --repo daishiman/UBM-Hyogo

# Step 4: 削除後 evidence (exit 1 / 出力空 を期待)
gh variable list --repo daishiman/UBM-Hyogo | grep CLOUDFLARE_PAGES_PROJECT || echo "DELETED OK"
```

---

## 4. 苦戦箇所・将来の課題解決のための知見

### 4.1 closed issue への fold が tracking gap を生む

Phase-12 の deferred items table では「Fold into Issue #419 dormant Pages cleanup」と記載していたが、Issue #419 は既に CLOSED であり、closed issue に新規作業を fold すると owner 不在となる。

**教訓**: deferred items の fold 先 issue が open かどうかを Phase-12 detection 時に確認し、CLOSED の場合は fold せず独立の unassigned task を作成する運用に統一する。

### 4.2 「設定の正本場所を 1 箇所に寄せる」原則の踏襲

Issue #331 では `wrangler.toml` の env vars 二重定義 (`[vars]` と `[env.staging.vars]` 両方に同じキー) が `wrangler` runtime warning を生んでいた。これは「同じ設定値が複数箇所に存在すると、片方の更新漏れで誤動作する」アンチパターンの典型例。

`CLOUDFLARE_PAGES_PROJECT` も同根で、未参照の dormant variable が残ると「Pages deploy 系の設定はここにある」と誤認させる。**正本でない設定は速やかに削除する**ことが、wrangler 二重定義整理と同じ原則の延長。

### 4.3 GitHub Variable の scope 取り違えに注意

GitHub Variables は以下 2 scope を持つ:

| scope | 削除コマンド | 影響範囲 |
| --- | --- | --- |
| repository | `gh variable delete NAME --repo OWNER/REPO` | リポジトリ全体 |
| environment | `gh variable delete NAME --env ENV --repo OWNER/REPO` | 当該 environment のみ |

`gh variable list` も `--env` フラグの有無で出力が変わるため、削除前後の evidence は両方の scope で取得しておくと安全。本タスクは **repo scope のみ** が対象。environment scope に同名変数があった場合は別タスク扱いとし、誤削除しないこと。

### 4.4 `wrangler.toml` への migration を伴わない pure 削除

本タスクは `wrangler.toml` への `vars` 移行を伴わない (Issue #331 で Workers deploy は `wrangler deploy` の引数で project 名を渡す構成に統一済みで、`CLOUDFLARE_PAGES_PROJECT` 自体が概念的に不要)。「未参照変数の削除」と「正本移管」を混同しないこと。

---

## 5. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/implementation-guide.md` (S2 セクション)
- `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/` (CLOSED, 参考のみ)
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

### 参考資料

- GitHub CLI: `gh variable` subcommand reference
- Cloudflare Workers deploy via `@opennextjs/cloudflare`

---

## 6. 備考

本タスクは外部 mutation のみで、リポジトリ内に commit / PR を生成しない。実行後は本ファイルを `docs/30-workflows/completed-tasks/` 配下へ移動するか、status を `完了` に更新するかをユーザーが判断する。
