# Phase 11 成果物: 手動 smoke 実行ログ (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 11 / 13（手動 smoke test） |
| 実行日 | 2026-04-29 |
| 実行者 | Claude Code (final verification agent) |
| 実行環境 | macOS Darwin 25.3.0 / `.worktrees/task-20260429-212734-wt-4` |
| 種別 | docs-only / NON_VISUAL |

> **Token / Account ID 等の実値は本ログに一切含まれない。** 実値は `.env`（op:// 参照のみ）から `scripts/cf.sh` 経由で揮発的に注入される設計のため、ログマスクの対象外（最初から実値を保持しない）。

---

## §1. workflow yaml 棚卸し（rg）

### コマンド

```bash
rg -n "node-version|pnpm|^on:|^jobs:" .github/workflows/
```

### 抜粋（主要行のみ）

```
.github/workflows/backend-ci.yml:5:on:
.github/workflows/backend-ci.yml:13:jobs:
.github/workflows/backend-ci.yml:25:      - uses: pnpm/action-setup@v4
.github/workflows/backend-ci.yml:31:          node-version: '24'
.github/workflows/backend-ci.yml:32:          cache: pnpm
.github/workflows/backend-ci.yml:76:          node-version: '24'
.github/workflows/ci.yml:7:on:
.github/workflows/ci.yml:13:jobs:
.github/workflows/ci.yml:33:      - uses: pnpm/action-setup@v4
.github/workflows/ci.yml:41:          node-version: '24'
.github/workflows/ci.yml:79:      - uses: pnpm/action-setup@v4
.github/workflows/ci.yml:87:          node-version: '24'
.github/workflows/validate-build.yml:7:on:
.github/workflows/validate-build.yml:13:jobs:
.github/workflows/validate-build.yml:33:      - uses: pnpm/action-setup@v4
.github/workflows/validate-build.yml:41:          node-version: '24'
.github/workflows/web-cd.yml:5:on:
.github/workflows/web-cd.yml:13:jobs:
.github/workflows/web-cd.yml:25:      - uses: pnpm/action-setup@v4
.github/workflows/web-cd.yml:31:          node-version: '24'
.github/workflows/web-cd.yml:68:          node-version: '24'
.github/workflows/verify-indexes.yml:7:on:
.github/workflows/verify-indexes.yml:20:jobs:
.github/workflows/verify-indexes.yml:29:      - uses: pnpm/action-setup@v4
.github/workflows/verify-indexes.yml:35:          node-version: '24'
```

### 期待値との一致

- 全 5 workflow が `node-version: '24'` / `pnpm/action-setup@v4` で統一されている（drift-matrix-design.md DRIFT-01 と一致）。
- workflow ファイル一覧（5 件）が Phase 2 の棚卸し表と一致（DRIFT-02 が docs-only として残る）。
- **判定: PASS**

### 補助コマンド（actions / runs-on）

```
.github/workflows/ci.yml:16:    runs-on: ubuntu-latest
.github/workflows/ci.yml:60:    runs-on: ubuntu-latest
.github/workflows/backend-ci.yml:16:    runs-on: ubuntu-latest
.github/workflows/backend-ci.yml:61:    runs-on: ubuntu-latest
.github/workflows/validate-build.yml:16:    runs-on: ubuntu-latest
.github/workflows/web-cd.yml:16:    runs-on: ubuntu-latest
.github/workflows/web-cd.yml:53:    runs-on: ubuntu-latest
.github/workflows/verify-indexes.yml:23:    runs-on: ubuntu-latest
```

`actions/checkout@v4` / `actions/setup-node@v4` も全 workflow で揃っている。

---

## §2. yamllint

### コマンド

```bash
yamllint .github/workflows/
```

### 結果

```
$ which yamllint
yamllint not found
```

- **未インストール**。Homebrew (`brew install yamllint`) または pipx 経由での導入が必要。
- 本ワークツリーでは未導入 → 実行不能。Phase 5 ランブックの mise / Homebrew 手順に従い別途導入する想定。
- **判定: N/A（未インストール）**。impl 必要差分にはあたらない（local tooling の問題）。

---

## §3. actionlint

### コマンド

```bash
actionlint .github/workflows/*.yml
```

### 結果

```
$ which actionlint
actionlint not found
```

- **未インストール**。`brew install actionlint` で導入可能。
- **判定: N/A（未インストール）**。impl 必要差分にはあたらない。

> §2 / §3 が未実行であっても Phase 11 の docs-only smoke は §1 / §4 / §5 / §6 / §7 で十分に閉じられる（既知制限 #3 として `main.md` に記載）。

---

## §4. wrangler.toml の整合確認

### コマンド

```bash
rg -n "pages_build_output_dir|^main\s*=|compatibility_date|\[triggers\]|\[\[d1_databases\]\]" \
   apps/web/wrangler.toml apps/api/wrangler.toml
```

### 出力

```
apps/web/wrangler.toml:2:pages_build_output_dir = ".next"
apps/web/wrangler.toml:3:compatibility_date = "2025-01-01"
apps/api/wrangler.toml:2:main = "src/index.ts"
apps/api/wrangler.toml:3:compatibility_date = "2025-01-01"
apps/api/wrangler.toml:19:[triggers]
apps/api/wrangler.toml:25:[[d1_databases]]
```

### 期待値との一致

- `apps/web/wrangler.toml` は **Pages 形式**（`pages_build_output_dir = ".next"`）で運用中 → drift-matrix DRIFT-03 / DRIFT-07 と一致。
- `deployment-cloudflare.md` 記載の OpenNext Workers 形式（`main = ".open-next/worker.js"`）とは**非整合**で、これは impl 必要差分（`UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION`）として委譲済み。
- `apps/api/wrangler.toml` は `main = "src/index.ts"` + `[triggers]` + `[[d1_databases]]` を保持し、不変条件 #5（D1 アクセスは apps/api 限定）を満たす。
- **判定: PASS（差分は派生タスクへ委譲済みで説明可能）**

---

## §5. 05a observability-matrix mapping

### コマンド

```bash
rg -n "ci\.yml|backend-ci\.yml|validate-build\.yml|verify-indexes\.yml|web-cd\.yml" \
   docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/
```

> 起票元 path は task spec では `docs/05a-parallel-observability-and-cost-guardrails/` 表記だが、実体は `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/` 配下に移動済み。本タスクの doc reference として整合。

### 抜粋

```
docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md:43:| GitHub Actions CI runs | GitHub / Actions / ci.yml | ops |
docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md:52:| GitHub Actions build validation | GitHub / Actions / validate-build.yml | ops |
docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md:53:| GitHub Actions typecheck / lint | GitHub / Actions / ci.yml | ops |
docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/skill-feedback-report.md:21:| deployment-gha.md | 要追跡 | 現行 `.github/workflows/ci.yml` / `validate-build.yml` との topology drift を `task-ref-cicd-workflow-topology-drift-001` として formalize |
```

### 期待値との一致

- 05a が観測対象として記載した workflow 名: `ci.yml` / `validate-build.yml` の 2 件のみ。
- 実体 5 件のうち `web-cd.yml` / `backend-ci.yml` / `verify-indexes.yml` の 3 件は 05a の matrix に未列挙 → DRIFT-06 と一致（impl 必要差分として `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` に委譲済み）。
- **判定: PASS（差分は派生タスクとして起票方針確定済み）**

---

## §6. 派生タスク命名衝突チェック

### コマンド

```bash
ls docs/30-workflows/unassigned-task/ | rg "UT-CICD-DRIFT-IMPL"
```

### 出力

```
（一致 0 件）
```

- 既存 `docs/30-workflows/unassigned-task/` 配下に `UT-CICD-DRIFT-IMPL-*.md` という命名のファイルは存在しない。
- `task-ref-cicd-workflow-topology-drift-001.md` は本タスクの起票元で、派生 IMPL タスクとは別ファイル。
- **判定: PASS（命名衝突 0 件）**

---

## §7. GitHub Issue #58 状態確認

### コマンド

```bash
gh issue view 58 --json state,title,url
```

### 出力

```json
{"state":"CLOSED","title":"[UT-CICD-DRIFT] CI/CD workflow topology and deployment spec drift cleanup","url":"https://github.com/daishiman/UBM-Hyogo/issues/58"}
```

- `state == CLOSED` を確認。CLOSED のまま仕様書を成果物として残す原典指示と整合。
- **判定: PASS**

---

## §8. ローカルツール導入状況サマリー

| ツール | インストール状況 | 影響 | 補完手段 |
| --- | --- | --- | --- |
| `rg` (ripgrep) | 導入済み | §1 / §4 / §5 で全行抽出可能 | — |
| `gh` (GitHub CLI) | 導入済み | §7 Issue 状態確認可能 | — |
| `yamllint` | **未導入** | §2 構文検査スキップ | `brew install yamllint` で導入 |
| `actionlint` | **未導入** | §3 GHA 構文検査スキップ | `brew install actionlint` で導入 |
| `node` (mise via Node 24) | 導入済み（mise） | Phase 12 generate-index 等で利用 | — |

> 既知制限 #3（`yamllint` / `actionlint` 未導入環境では §2 / §3 がスキップされる）として `main.md` に明記。
