# UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION

```yaml
issue_number: 287
task_id: UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION
task_name: Pages vs Workers deploy target decision
category: 改善
target_feature: CI/CD workflow topology
priority: 高
scale: 中規模
status: spec_created
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
dependencies: [#58]
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION |
| 親タスク | UT-CICD-DRIFT |
| 起源 drift | DRIFT-03 / DRIFT-10 |
| workflow_state | spec_created |
| 現在の配置 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` へ移管済み |
| 優先度 | HIGH |
| 分類 | docs-only ADR decision（実 cutover は `task-impl-opennext-workers-migration-001` へ委譲） |
| 起票日 | 2026-04-29 |

## 親タスク背景

UT-CICD-DRIFT は docs-only / specification-cleanup として `deployment-gha.md` / `deployment-cloudflare.md` の drift 解消に閉じた。`apps/web/wrangler.toml` の Pages 形式 (`pages_build_output_dir = ".next"`) を OpenNext Workers 形式 (`main = ".open-next/worker.js"` + `[assets]`) へ cutover するか保留するかの判断は、CLAUDE.md の「Cloudflare Workers + Next.js via @opennextjs/cloudflare」記述と現実体に **drift** が残るため、本派生で確定する。

## 状態更新（2026-05-01）

本起票は `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` として Phase 1-12 の仕様化が完了した。ADR-0001 は Accepted / Workers cutover で確定済み。実装作業はこのファイルでは継続せず、`task-impl-opennext-workers-migration-001` が `.github/workflows/web-cd.yml`、Cloudflare side cutover runbook、smoke validation を担当する。

## 範囲

1. ADR 起票: 「apps/web を Pages 形式継続するか、OpenNext Workers 形式へ cutover するか」
2. cutover を決定する場合の作業項目:
   - `apps/web/wrangler.toml` の `pages_build_output_dir` 削除 + `main = ".open-next/worker.js"` 設定
   - `[assets]` binding 設定
   - `.github/workflows/web-cd.yml` の deploy step を `pages deploy` → `wrangler deploy` へ
   - smoke test / staging 検証
3. 保留を決定する場合の作業項目:
   - `deployment-cloudflare.md` の判定表「現状（2026-04-29）」列を継続維持
   - CLAUDE.md の「@opennextjs/cloudflare」記述を「将来仕様」として明記

## 不変条件 reaffirmation

| # | 不変条件 | 適用 |
| --- | --- | --- |
| #5 | D1 への直接アクセスは apps/api に閉じる | cutover 後も apps/web に `[[d1_databases]]` を追加しない |
| #6 | GAS prototype を本番昇格しない | 影響なし |

## 受入条件

- [x] AC-1: ADR が `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` に起票される
- [x] AC-2: 決定（cutover）が `deployment-cloudflare.md` 判定表に反映される
- [x] AC-3: cutover 決定時の実装責務が `task-impl-opennext-workers-migration-001` に委譲される
- [x] AC-4: 不変条件 #5 抵触なし

## 苦戦箇所【記入必須】

- Pages 形式と OpenNext Workers 形式は、仕様上の理想と現行 deploy 実体が分かれやすい。
- cutover 判定を急ぐと、`web-cd.yml` / `wrangler.toml` / Cloudflare 側設定の三者整合が崩れやすい。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Pages と Workers の二重記述が残り、下流タスクが誤った deploy target を前提にする | ADR で cutover / 保留を明示し、`deployment-cloudflare.md` に current state と future state を分けて記録する |
| cutover 時に apps/web から D1 へ直接接続する構成を追加してしまう | 不変条件 #5 を AC に固定し、`apps/web/wrangler.toml` に `[[d1_databases]]` を追加しないことを検証する |

## 検証方法

- `rg -n "pages_build_output_dir|^main\\s*=|\\[assets\\]|wrangler deploy|pages deploy" apps/web/wrangler.toml .github/workflows/web-cd.yml .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- ADR と `deployment-cloudflare.md` の決定文が同じ deploy target を指していることを確認する。

## スコープ（含む/含まない）

| 含む | 含まない |
| --- | --- |
| ADR 作成、cutover / 保留判断、判断結果の仕様反映 | 本タスク起票時点での cutover 実作業、Cloudflare 実環境 deploy、apps/api の D1 migration 方針変更 |

## 委譲先 / 関連

- 関連: `task-impl-opennext-workers-migration-001`（既存 unassigned-task に類似議題あり、統合可否を含めて検討）
- 関連: `UT-GOV-006-web-deploy-target-canonical-sync`（既存 backlog。着手時に本タスクへ統合するか、UT-GOV-006 を close / supersede するかを最初に決める）
- 関連: UT-CICD-DRIFT (親)
