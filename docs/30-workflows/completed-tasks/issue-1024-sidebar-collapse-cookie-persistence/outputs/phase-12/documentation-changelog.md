# documentation-changelog — issue-1024

> GitHub Issue #1024 は CLOSED のまま現行コードへ再スコープ（reopen しない）。NON_VISUAL / implemented_local_evidence_captured。

各 Step の結果を個別に記録する（該当なしも明記）。

## ブロック A: workflow-local 同期（本 workflow ディレクトリ内）

| Step | 結果 | 備考 |
|------|------|------|
| Step 1-A 完了タスク記録 | **記録済** | `outputs/phase-12/system-spec-update-summary.md` Step 1-A。 |
| Step 1-B 実装状況 | **記録済（implemented_local_evidence_captured）** | apps/web shell code changed; focused local evidence captured; commit/push/PR are user-gated. |
| Step 1-C 関連タスク | **記録済** | 親 unified-sidebar-shell / Task A / Task E / 起点 FU-ALSSM-001。 |
| Step 2 新規インターフェース | **記録済（workflow-local）** | cookie helper export + hook 引数 + prop。`apps/web/src/components/shell` 内に閉じる。 |
| index.md / artifacts.json | **既存（更新なし）** | Phase 一覧・status・gates は作成済。本サイクルで Phase 10-13 + outputs を追補。 |

## ブロック B: global skill sync（aiworkflow-requirements 等 skill 正本）

| 対象 | 結果 | 理由 |
|------|------|------|
| aiworkflow-requirements `references/` API/IPC/状態管理契約 | **公開契約更新 N/A / inventory 反映済** | 公開 export は shell 局所。Orchestrator 正本契約は非該当だが、workflow inventory と lessons は正本へ反映済。 |
| design-tokens / OKLch 正本 | **該当なし** | CSS 変更なし。 |
| `docs/00-getting-started-manual/specs/` 正本 | **該当なし** | API / D1 / Form schema 不変。 |
| CLAUDE.md 不変条件 | **追記なし** | 既存「`browserDocument()` 経由」「Web Storage 禁止トークン」ルールに整合するのみ。 |
| lessons-learned promote | **promote 済** | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-1024-sidebar-collapse-cookie-persistence-2026-05.md` に L-I1024-001..003 を追加。 |

## 結論

- workflow-local: Step 1-A / 1-B / 1-C / Step 2 すべて記録済。
- global skill sync: API/D1/Form 正本更新は N/A。aiworkflow inventory / quick-reference / resource-map / changelog / lessons-learned は反映済み。
