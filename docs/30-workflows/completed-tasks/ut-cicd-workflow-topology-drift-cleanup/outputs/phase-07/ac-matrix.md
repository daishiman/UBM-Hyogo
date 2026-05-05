# Phase 7 成果物: AC マトリクス（traceability）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 7 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup（traceability） |

## 全体方針

index.md の AC-1〜AC-11 に対し、Phase 4（検証手段）/ Phase 5（仕様更新ファイル / runbook Step）/ Phase 6（failure case）の成果物を縦串で結ぶ。完全性指標は「docs-only 行数 = 仕様書 updated section 数」「impl 必要行数 = `UT-CICD-DRIFT-IMPL-*.md` ファイル数」の 2 軸を採用する。

## AC マトリクス（11 行 × 4 列）

| AC# | AC 内容 | 検証手段（Phase 4） | 更新ファイル / runbook Step（Phase 5） | 関連 failure case（Phase 6） |
| --- | --- | --- | --- | --- |
| AC-1 | `.github/workflows/` 配下の全 yaml が棚卸しされ、Node / pnpm / job / trigger / deploy target が表に固定されている | rg #1〜#5 + manual review + yamllint / actionlint | Step 1（drift 検出）/ Step 2（差分マトリクス作成） | #1, #2, #3, #4, #8 |
| AC-2 | `deployment-gha.md` 記述と current facts の差分マトリクスが作成され、各差分が「docs-only」「impl 必要」のいずれかに分類されている | rg #1〜#7 + 派生タスク漏れ検証 | Step 2 / Step 3（分類）/ `outputs/phase-02/drift-matrix-design.md` | #5, #6, #11 |
| AC-3 | `deployment-cloudflare.md` の Pages / Workers / OpenNext 方針と `apps/web/wrangler.toml` 実体の照合結果が表に記載されている | rg #4（deploy target）+ manual review + cross-doc link | Step 2 / `deployment-cloudflare.md` 更新案 | #7, #15 |
| AC-4 | 05a の cost guardrail 監視対象がすべて実在する workflow を指していることを確認、または存在しない workflow への参照が「impl 必要」差分として明示されている | cross-doc link 検証 + rg #1 | Step 2 / Step 3 | #5, #15 |
| AC-5 | Pages build budget 監視前提と OpenNext Workers 方針のどちらを current contract とするかの判断材料が Phase 2 で整理されている | manual review #1 | Phase 2 `canonical-spec-update-plan.md` / Step 5（派生タスク委譲） | #7 |
| AC-6 | docs-only 差分は本タスク内で正本仕様の更新案として記述されている（実体ファイルの編集は Phase 12 で実施） | rg before/after sanity check | Step 4 / 擬似 diff / Phase 12 実体編集 | #2, #3, #4, #10 |
| AC-7 | impl 必要差分はすべて `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の起票方針として Phase 2 で列挙されている | 派生タスク漏れ検証コマンド | Step 5 / `outputs/phase-12/unassigned-task-detection.md` | #5, #6, #15 |
| AC-8 | 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である | Phase 3 review + Phase 10 go-no-go | Phase 3 / Phase 10 | 全件（MAJOR 残存有無） |
| AC-9 | 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）に違反する workflow 構成が存在しないことを確認している | rg #6（不変条件 #5 抵触）+ manual review #4 | Step 3（判別ルール 5 適用） | #11, #12 |
| AC-10 | 検証コマンド（`rg -n "node-version\|pnpm\|web-cd\|ci.yml\|validate-build\|wrangler\|pages_build_output_dir" .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails`）の出力に基づく差分根拠が記録されている | 当該 rg #7（Phase 4 必須登録済み） | Step 1 / Phase 11 `manual-smoke-log.md` への貼り付け | #1, #8 |
| AC-11 | GitHub Issue #58 が CLOSED 状態のまま、本タスク仕様書が成果物として参照可能になっている | `gh issue view 58 --json state` | runbook 全体 / canUseTool 範囲（`gh` 不要） | #13 |

11 行 × 4 列に空セルなし。

## docs 完全性指標

### 計測方法

正本仕様の更新セクション数が drift マトリクスの「docs-only」行数と一致することを確認する。

```bash
# docs-only 行数
rg -c "^\| docs-only \|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md

# 更新セクション数（Phase 12 完了後）
rg -c "^## " .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
            .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
# 増減を before/after で diff 比較
```

### 証跡フォーマット

`outputs/phase-09/docs-completeness.json` に以下を記録:

```json
{
  "docs_only_rows": 0,
  "updated_sections": 0,
  "delta": 0,
  "pass": true
}
```

## 派生タスク完全性指標

### 計測方法

```bash
# impl 必要 行数
rg -c "^\| impl 必要 \|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md

# 派生タスクファイル数
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md 2>/dev/null | wc -l
```

両者が一致しない場合 Phase 12 NO-GO。判断保留行は `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` 1 件として加算する。

### 証跡フォーマット

`outputs/phase-09/derived-tasks-completeness.json` に同形式で記録。

## 計測対象 allowlist（広域指定の禁止）

本タスクは docs-only であり、コード coverage の計測対象は無い。代わりに以下に限定する:

```
.claude/skills/aiworkflow-requirements/references/deployment-gha.md
.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md
docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md
```

### 禁止パターン（広域指定）

```
# 以下は禁止: 既存仕様書全体の更新行数を含めると指標が歪む
.claude/skills/aiworkflow-requirements/references/**/*.md
docs/**/*.md
```

## Phase 9 への引き継ぎ項目

- docs 完全性指標の実測値（docs-only 行数 vs updated_sections 数）
- 派生タスク完全性指標の実測値（impl 必要行数 vs `UT-CICD-DRIFT-IMPL-*.md` ファイル数）
- gap 分析（不一致時の差分行 ID と原因タグ）
- 完全性指標の出力先パス（`outputs/phase-09/docs-completeness.json` / `outputs/phase-09/derived-tasks-completeness.json`）
- 広域指定禁止ルールの遵守確認

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 8 | 重複記述検出時、AC マトリクス行が崩れないことを確認 |
| Phase 9 | 完全性指標の実測 → docs-only / impl 必要 行数と一致確認 |
| Phase 10 | go-no-go の根拠として AC マトリクス空セルなしを参照 |
| Phase 11 | AC-1 / AC-9 / AC-10 を手動 smoke で再確認 |
| Phase 12 | AC-6 / AC-7 を実体ファイル編集 + 派生タスク起票で完了 |

## 多角的チェック観点

- 価値性: 11 件 AC が抜け漏れなく検証 → 更新ファイル → failure case にトレース
- 実現性: 完全性指標が変更ファイル限定で広域指定なし
- 整合性: Phase 4 / 5 / 6 のファイル名・Step 番号と差分ゼロ
- 運用性: 完全性指標コマンドが PR 上で再現可能
- 不変条件: AC-9 が rg #6 + manual review #4 に対応
- スコープ境界: AC-6 が「Phase 12 で実体編集」を明示

## 完了条件チェック

- [x] AC マトリクス 11 行 × 4 列に空セルなし
- [x] docs 完全性指標の計測コマンド記述
- [x] 派生タスク完全性指標の計測コマンド記述
- [x] 広域指定の禁止パターン例示
- [x] Phase 9 への引き継ぎ項目を箇条書き

## 次 Phase への引き渡し

- AC マトリクスを Phase 10 go-no-go の根拠とする
- docs / 派生タスク完全性指標を Phase 9 で実測
- 広域指定禁止ルールを Phase 8 / Phase 9 で逸脱防止
- ブロック条件: AC マトリクス空セル残存 / 完全性指標が広域指定に変質 / AC-11 の `gh issue view` 未確認
