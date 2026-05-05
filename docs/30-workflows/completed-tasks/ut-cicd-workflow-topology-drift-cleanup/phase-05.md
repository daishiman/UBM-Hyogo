# Phase 5: 実装ランブック（仕様更新手順）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（仕様更新手順） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略：整合性検証戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（runbook for spec update） |

## 目的

本タスクは docs-only / specification-cleanup であり、実装対象は `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `deployment-cloudflare.md` の正本仕様のみ。yaml / wrangler.toml そのものの変更は派生タスクに委譲する。本 Phase では、Phase 4 の検証スイートを使って drift を検出し → 差分マトリクスを作成し → 正本仕様を更新し → 派生タスクを起票する までの仕様更新手順を Step 順に確定し、Phase 12（ドキュメント更新）が破綻なく実体ファイルを編集できる runbook を整備する。

## 実行タスク

1. 更新対象ファイル一覧（docs 側）を確定する（完了条件: 仕様書ファイル・想定更新セクション・更新粒度の表が完成）。
2. 起票対象ファイル一覧（unassigned-task 側）の命名規則を確定する（完了条件: `UT-CICD-DRIFT-IMPL-NNN-<slug>.md` の slug 命名と最小フィールドが定義）。
3. 順序付き runbook（Step 0〜6）を完成する（完了条件: drift 検出 → マトリクス → 分類 → 仕様更新案 → 派生タスク起票方針 → 検証 → 引き渡し の順で漏れ無し）。
4. 仕様書更新の擬似 diff（before/after の section テンプレ）を記述する（完了条件: 各正本仕様について「現行記述 → 更新後記述」の例 1 件以上が示される）。
5. canUseTool 適用範囲を明記する（完了条件: 本タスクは Edit / Write 系のみ、外部 CLI（wrangler / gh）は不要であることが明記）。
6. sanity check コマンド（仕様更新前後の比較）を整備する（完了条件: rg ベースの before/after 確認手順が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-02.md | 差分マトリクス schema・更新方針 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-04.md | rg コマンド集・派生タスク漏れ検証 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | 更新対象 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 更新対象 |
| 必須 | docs/30-workflows/unassigned-task/ | 派生タスク起票先ディレクトリ |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-05.md | 標準 runbook 形式 |

## 更新対象ファイル一覧（docs 側 = 本タスク内で実施）

| パス | 想定更新セクション | 更新粒度 | 主な変更内容 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | workflow 一覧 / Node・pnpm バージョン / job 構成 / trigger / required_status_checks 名称 | section 単位 rewrite | 現行 yaml 実体（5 ファイル）に同期 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | deploy target（Pages / Workers / OpenNext） / wrangler.toml 抜粋 / build 出力 | section 単位 rewrite | Pages vs Workers 混在の事実記載のみ（判断は派生タスクへ） |

## 起票対象ファイル一覧（unassigned-task 側 = 派生タスク起票方針）

| 命名 | 想定対象 |
| --- | --- |
| `UT-CICD-DRIFT-IMPL-001-<slug>.md` | drift マトリクス DRIFT-NN のうち impl 必要に分類された差分の単位起票 |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION.md` | Pages vs Workers 判断の独立タスク（判断保留 → 派生） |
| `UT-CICD-DRIFT-IMPL-OBS-SYNC-NNN-<slug>.md` | 05a observability-matrix.md の更新が必要となった場合のみ |

最小フィールド: メタ情報 / 起票元（差分 ID） / 何を達成するか / 変更対象ファイル / 受入条件 / 不変条件影響。

## runbook

### Step 0: 事前準備

```bash
mise exec -- pnpm install
# 検証ツール
which rg yamllint actionlint || echo "install required"
```

### Step 1: drift 検出（Phase 4 の rg コマンド適用）

Phase 4 の rg-based grep スイートを順に実行し、出力を `outputs/phase-11/manual-smoke-log.md` に貼り付ける。代表コマンド:

```bash
rg -n "node-version|pnpm|web-cd|ci.yml|validate-build|wrangler|pages_build_output_dir" \
  .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails
```

### Step 2: 差分マトリクス作成

Phase 2 の 8 列 schema に従い、`outputs/phase-02/drift-matrix-design.md` の表本体を埋める。1 行 1 差分。差分 ID は `DRIFT-01` から連番。

### Step 3: 分類（docs-only / impl 必要 / 判断保留）

Phase 2 の 5 ルールを適用。各行に分類タグを記入。不変条件 #5 / #6 抵触行は blocker 印を立てる。

### Step 4: 正本仕様の更新案作成（docs-only 行のみ）

`deployment-gha.md` / `deployment-cloudflare.md` の更新案を `outputs/phase-02/canonical-spec-update-plan.md` に記述。実体ファイルへの編集は Phase 12 で実施。

### Step 5: 派生タスク起票方針の列挙（impl 必要 / 判断保留 行のみ）

各行について `unassigned-task/UT-CICD-DRIFT-IMPL-NNN-<slug>.md` を作成する起票方針を `outputs/phase-12/unassigned-task-detection.md` 草案に列挙。実ファイルの起票は Phase 12 で実施。

### Step 6: 整合性検証

Phase 4 の派生タスク漏れ検証コマンドで impl 必要行数 = 派生タスクファイル数を確認。差分があれば Step 5 にループバック。

```bash
# Phase 12 完了後に実行
rg -c "^\\| impl 必要 \\|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md | wc -l
```

## 仕様書更新の擬似 diff（テンプレ）

### deployment-gha.md（例）

```diff
- ## CI workflow 一覧
- - `web-cd.yml`: deploy 担当
+ ## CI workflow 一覧（current facts）
+ - `ci.yml`: monorepo 全体の CI（typecheck / lint / build）
+ - `backend-ci.yml`: apps/api の CI
+ - `validate-build.yml`: build 検証
+ - `verify-indexes.yml`: skill indexes drift 検出
+ - `web-cd.yml`: apps/web の CD
```

### deployment-cloudflare.md（例）

```diff
- ## deploy target: Cloudflare Pages
- - `pages_build_output_dir = ".vercel/output/static"`
+ ## deploy target（混在状態の事実記載・判断は UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION）
+ - apps/web/wrangler.toml に Pages 表記と OpenNext Workers 方針が混在している
+ - 詳細: 派生タスクで current contract を確定する
```

## canUseTool 適用範囲

- 本 Phase 内で claude-code CLI からの自動編集が必要な場面: `outputs/phase-XX/*.md` の text 編集、`unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の新規作成（Phase 12 内）。
- 外部 CLI（`wrangler` / `gh issue`）は本タスク内では不要。`gh issue` は #58 が既に CLOSED であり再オープン禁止のため使用しない。
- canUseTool 推奨: Edit / Write のみ許可。`wrangler` / `gh` は本タスクでは N/A。

## sanity check

```bash
# 更新前 snapshot（Phase 12 編集前に実行）
rg -n "web-cd|ci.yml|validate-build|verify-indexes|backend-ci" .claude/skills/aiworkflow-requirements/references > /tmp/before.txt

# 更新後 snapshot（Phase 12 編集後に実行）
rg -n "web-cd|ci.yml|validate-build|verify-indexes|backend-ci" .claude/skills/aiworkflow-requirements/references > /tmp/after.txt

diff /tmp/before.txt /tmp/after.txt
```

差分が「workflow 名の追加 / Node・pnpm バージョン整合 / Pages vs Workers の事実記載」に限定されていることを目視。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook で組み立てた処理に対する failure case（仕様間矛盾・派生タスク漏れ等）を検証 |
| Phase 7 | runbook の各 Step を AC マトリクスの「実装」列に紐付け |
| Phase 9 | sanity check の rg コマンドを品質保証ログに記録 |
| Phase 11 | Step 1〜6 を staging 相当の手動 smoke として再実行 |
| Phase 12 | Step 4 / Step 5 を実体ファイル編集 / 派生タスク起票として実行 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば AC-1〜AC-7、AC-10 が満たせるか。
- 実現性: 全 Step がローカルツール（rg / yamllint）のみで完結するか。
- 整合性: 既存 aiworkflow-requirements skill の references 構造を破壊しないか（topic-map / resource-map との同期は Phase 12 で扱う）。
- 運用性: 派生タスク起票が手作業化しないよう命名規則が明確か。
- セキュリティ: Cloudflare Secret や API Token を読み取らない手順となっているか。
- 不変条件: #5 / #6 抵触行が blocker として最優先扱いされるか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 更新対象ファイル一覧（docs） | spec_created |
| 2 | 起票対象ファイル命名規則 | spec_created |
| 3 | runbook Step 0〜6 | spec_created |
| 4 | 擬似 diff（before/after） | spec_created |
| 5 | canUseTool 範囲判定 | spec_created |
| 6 | sanity check 整備 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | 更新対象一覧 / 起票対象命名規則 / Step 0〜6 / 擬似 diff / sanity check |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件

- [ ] 更新対象 docs 2 件が一覧化（deployment-gha.md / deployment-cloudflare.md）
- [ ] 起票対象 unassigned-task の命名規則と最小フィールドが定義
- [ ] runbook Step 0〜6 が順序付きで漏れ無し
- [ ] 擬似 diff が 2 仕様書で 1 件以上ずつ提示
- [ ] canUseTool 範囲が明記（Edit / Write のみ）
- [ ] sanity check の rg コマンドが before/after で記述

## タスク100%実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置予定
- Phase 4 の検証コマンドが Step 1 / Step 6 に紐付け
- 不変条件 #5 / #6 抵触行が blocker 印を持つ運用ルールが Step 3 に含まれる
- 実体ファイル編集（仕様書 / unassigned-task）は本 Phase で実施せず Phase 12 で実施することが明記

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - runbook 上の例外パス（drift 検出漏れ / 分類誤り / 派生タスク起票漏れ）を Phase 6 の failure case 入力として渡す
  - sanity check コマンドを Phase 11 で再利用
  - 擬似 diff を Phase 12 の実体編集ガイドに転用
- ブロック条件:
  - 派生タスク命名規則が未定義
  - canUseTool 範囲に外部 CLI を含めてしまう
  - 実体ファイル編集を本 Phase で実施してしまう
