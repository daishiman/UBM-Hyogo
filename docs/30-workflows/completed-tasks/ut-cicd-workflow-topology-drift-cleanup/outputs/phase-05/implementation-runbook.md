# Phase 5 成果物: 実装ランブック（仕様更新手順）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 5 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup（runbook） |
| 編集対象 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `deployment-cloudflare.md`（実体編集は Phase 12） |
| 派生起票 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md`（実体起票は Phase 12） |

## 全体方針

本タスクは docs-only / specification-cleanup であり、実装対象は正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）のみ。yaml / wrangler.toml そのものの変更は派生タスクに委譲する。本 runbook は「Phase 4 の検証スイートで drift を検出 → 差分マトリクス作成 → 正本仕様の更新案作成 → 派生タスク起票方針列挙 → 整合性検証」の Step 順を確定し、Phase 12 が破綻なく実体ファイルを編集できる手順を整備する。

## 更新対象ファイル一覧（docs 側 = 本タスク内で実施）

| パス | 想定更新セクション | 更新粒度 | 主な変更内容 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | workflow 一覧 / Node・pnpm version / job 構成 / trigger / required_status_checks 名称 | section 単位 rewrite | 現行 yaml 実体（`backend-ci.yml` / `ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml` の 5 ファイル）に同期 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | deploy target（Pages / Workers / OpenNext） / wrangler.toml 抜粋 / build 出力 | section 単位 rewrite | Pages vs Workers 混在の事実記載のみ（current contract の判断は派生タスクへ） |

## 起票対象ファイル一覧（unassigned-task 側 = 派生タスク起票方針）

### 命名規則

`UT-CICD-DRIFT-IMPL-NNN-<slug>.md`

- `NNN`: 3 桁連番（drift マトリクス DRIFT-NN との対応を維持）
- `<slug>`: kebab-case（例 `pages-vs-workers-decision`）
- 例: `UT-CICD-DRIFT-IMPL-001-node-version-sync.md`

### 主な起票対象

| 命名 | 想定対象 |
| --- | --- |
| `UT-CICD-DRIFT-IMPL-001-<slug>.md` 〜 連番 | drift マトリクス DRIFT-NN のうち impl 必要に分類された差分の 1 件起票 |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION.md` | apps/web の current contract 確定タスク（判断保留） |
| `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC.md` | 05a observability-matrix.md の更新が必要となった場合 |
| `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP.md` | composite action 化 |
| `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY.md` | reusable workflow 化 |
| `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION.md` | cron 表記 SSOT 同期 |
| `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md` | verify-indexes.yml trigger 最適化 |

### 最小フィールド

各 unassigned-task md に最低限以下を含めること:

1. メタ情報（タスク ID / 命名 / 作成日 / 状態）
2. 起票元（`UT-CICD-DRIFT` の DRIFT-NN ID）
3. 何を達成するか（goal 文）
4. 変更対象ファイル（yaml / wrangler.toml 等の絶対パス）
5. 受入条件（AC 案）
6. 不変条件影響（#5 / #6 抵触の有無）

## runbook（Step 0〜6）

### Step 0: 事前準備

```bash
mise exec -- pnpm install
which rg yamllint actionlint || echo "install required"
```

ローカルで `rg` は必須、`yamllint` / `actionlint` は Phase 9 / 11 で利用するため事前確認のみ。

### Step 1: drift 検出（Phase 4 の rg コマンド適用）

Phase 4 の rg-based grep スイート 7 件を順に実行し、出力を Phase 11 の `manual-smoke-log.md` に貼り付ける。代表コマンド（AC-10 必須）:

```bash
rg -n "node-version|pnpm|web-cd|ci.yml|validate-build|wrangler|pages_build_output_dir" \
  .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails
```

### Step 2: 差分マトリクス作成

Phase 2 の 8 列 schema に従い、`outputs/phase-02/drift-matrix-design.md` の表本体を埋める。1 行 1 差分。差分 ID は `DRIFT-01` から連番。

### Step 3: 分類（docs-only / impl 必要 / 判断保留）

Phase 2 の判別ルール 5 件を適用。各行に分類タグを記入。**不変条件 #5 / #6 抵触行は blocker 印（先頭セルに `🚫`）を立てる**ことで最優先扱いとする。

### Step 4: 正本仕様の更新案作成（docs-only 行のみ）

`deployment-gha.md` / `deployment-cloudflare.md` の更新案を `outputs/phase-02/canonical-spec-update-plan.md` に記述。**実体ファイルへの編集は Phase 12 で実施**（本 Phase / 本タスク内では編集しない）。

### Step 5: 派生タスク起票方針の列挙（impl 必要 / 判断保留 行のみ）

各行について `unassigned-task/UT-CICD-DRIFT-IMPL-NNN-<slug>.md` を作成する起票方針を `outputs/phase-12/unassigned-task-detection.md` 草案に列挙。**実ファイルの起票は Phase 12 で実施**。

### Step 6: 整合性検証（派生タスク漏れチェック）

Phase 4 の派生タスク漏れ検証コマンドで impl 必要行数 = 派生タスクファイル数を確認。差分があれば Step 5 にループバック。

```bash
# Phase 12 完了後に実行
rg -c "^\| impl 必要 \|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md 2>/dev/null | wc -l
```

両者が一致しない場合 Phase 12 NO-GO。判断保留行は `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` を impl 必要 1 件として加算。

## 仕様書更新の擬似 diff（テンプレ）

### deployment-gha.md（before/after 例）

```diff
- ## CI workflow 一覧
- - `web-cd.yml`: deploy 担当
+ ## CI workflow 一覧（current facts）
+ - `ci.yml`: monorepo 全体の CI（typecheck / lint / build）
+ - `backend-ci.yml`: apps/api の CI
+ - `validate-build.yml`: build 検証（Workers ビルド成果物の検証）
+ - `verify-indexes.yml`: skill indexes drift 検出（`.claude/skills/aiworkflow-requirements/indexes` 変更時のみ）
+ - `web-cd.yml`: apps/web の CD
+
+ ## Node / pnpm version
+ - Node: `.mise.toml` を SSOT とする（`node-version-file: .mise.toml` を推奨）
+ - pnpm: `package.json` の `packageManager` フィールドまたは `.mise.toml` を参照
```

### deployment-cloudflare.md（before/after 例）

```diff
- ## deploy target: Cloudflare Pages
- - `pages_build_output_dir = ".vercel/output/static"`
+ ## deploy target（混在状態の事実記載・current contract の確定は派生タスク `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION`）
+ - apps/web/wrangler.toml に Pages 表記（`pages_build_output_dir`）と OpenNext on Workers 方針（`main = ".open-next/worker.js"` 等）が混在している可能性
+ - apps/api: Cloudflare Workers 単一 deploy target
+ - 詳細: 派生タスクで current contract を確定し、本仕様書を後追いで SSOT 化する
```

## canUseTool 適用範囲

- 本タスク内で claude-code から自動編集が必要な場面: `outputs/phase-XX/*.md` の text 編集、`unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の新規作成（Phase 12 内）
- 外部 CLI（`wrangler` / `gh issue`）は **本タスク内では不要**
  - `gh issue` は #58 が CLOSED で再オープン禁止のため使用しない
  - `wrangler` は docs-only タスクのため使用しない
- canUseTool 推奨設定: **Edit / Write のみ許可**。`wrangler` / `gh` は N/A

## sanity check（before/after 比較）

```bash
# 更新前 snapshot（Phase 12 編集前に実行）
rg -n "web-cd|ci.yml|validate-build|verify-indexes|backend-ci" \
  .claude/skills/aiworkflow-requirements/references > /tmp/before.txt

# 更新後 snapshot（Phase 12 編集後に実行）
rg -n "web-cd|ci.yml|validate-build|verify-indexes|backend-ci" \
  .claude/skills/aiworkflow-requirements/references > /tmp/after.txt

diff /tmp/before.txt /tmp/after.txt
```

差分が「workflow 名の追加 / Node・pnpm version 整合 / Pages vs Workers の事実記載」に限定されていることを目視確認する。それ以外の差分が出た場合は Step 4 に戻る。

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 6 | runbook の例外パス（drift 検出漏れ / 分類誤り / 派生タスク起票漏れ）を failure case 入力 |
| Phase 7 | runbook 各 Step を AC マトリクス「実装」列に紐付け |
| Phase 9 | sanity check の rg コマンドを品質保証ログに記録 |
| Phase 11 | Step 1〜6 を staging 相当の手動 smoke として再実行 |
| Phase 12 | Step 4 / Step 5 を実体ファイル編集 / 派生タスク起票として実行 |

## 多角的チェック観点

- 価値性: runbook 通り進めれば AC-1〜AC-7・AC-10 が満たせる
- 実現性: 全 Step が rg / yamllint のみで完結（外部 CLI 不要）
- 整合性: aiworkflow-requirements skill references の topic-map / resource-map との同期は Phase 12 で扱う
- 運用性: 派生タスク命名規則明確化により手作業化を防止
- セキュリティ: Cloudflare Secret / API Token を読み取らない手順
- 不変条件: #5 / #6 抵触行は Step 3 で blocker 印を最優先扱い

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 更新対象ファイル一覧（docs） | done |
| 2 | 起票対象ファイル命名規則 | done |
| 3 | runbook Step 0〜6 | done |
| 4 | 擬似 diff（before/after） | done |
| 5 | canUseTool 範囲判定 | done |
| 6 | sanity check 整備 | done |

## 完了条件チェック

- [x] 更新対象 docs 2 件を一覧化（deployment-gha.md / deployment-cloudflare.md）
- [x] 起票対象 unassigned-task の命名規則と最小フィールド定義
- [x] runbook Step 0〜6 が順序付きで漏れなし
- [x] 擬似 diff を 2 仕様書で 1 件以上ずつ提示
- [x] canUseTool 範囲を明記（Edit / Write のみ）
- [x] sanity check の rg コマンドを before/after で記述

## 次 Phase への引き渡し

- Phase 6 へ runbook 例外パスを failure case 入力として引き渡し
- Phase 11 で sanity check コマンドを再実行
- Phase 12 で擬似 diff を実体編集ガイドに転用
- ブロック条件: 派生タスク命名規則未定義 / canUseTool に外部 CLI を含める / 実体ファイル編集を本 Phase で実施
