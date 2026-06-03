# スキルフィードバックレポート — admin-attendance-dashboard-ux

workflow_state: `implemented_local_runtime_pending` / 生成日: 2026-06-02

本 wave で観察したテンプレート/ワークフロー改善点を記録する。いずれも本タスク（`apps/web` UI/UX 是正・implemented_local_runtime_pending）の
作成中に検出した **既存 phase 成果物・artifacts の内部 drift** であり、owning skill のテンプレ本体に欠陥があるわけではない。
各 item の routing（promote / defer / reject / no-op）を明記する。

## 観察事項

| # | 観点 | 観察内容 | 実測 | routing |
| --- | --- | --- | --- | --- |
| SF-1 | ワークフロー改善（検証コマンド drift） | 旧記述では存在しない `apps/web/vitest.config.ts` を参照していた。実 SSOT はリポジトリルートの `vitest.config.ts` | `ls apps/web/vitest.config.*` → no matches / `ls vitest.config.ts` → 存在 / focused vitest PASS | **no-op（owning skill 非変更）**。タスク固有 artifacts / phase docs を `--root=. --config=vitest.config.ts` へ補正済み。task-specification-creator skill のテンプレ欠陥ではない |
| SF-2 | ドキュメント改善（新規/更新 誤分類） | phase-2-design.md / phase-9-qa.md / phase-13-pr.md は `KpiPanel.spec.tsx` を「新規」と記していたが、当該 spec は既に存在（更新が正） | `ls .../__tests__/` に `KpiPanel.spec.tsx` 実在 | **no-op（owning skill 非変更）**。タスク固有の分類 drift。本 wave で該当 phase docs / documentation-changelog.md / implementation-guide.md を「更新（既存ファイル）」へ補正済み。skill テンプレ側に再発防止の追加ルールは不要（Phase 12 着手時に実コード差分/ファイル実在を再判定する既存ルールで捕捉可能） |
| SF-3 | テンプレート改善（参考） | 通過例（issue-837）の compliance check は `## Verification commands` / `## Four-condition verdict`（番号なし）等の旧見出しを併用しており、canonical 9 の番号付き見出し（`## 1. Summary verdict` 〜 `## 9. Four-condition verdict`）と表記が分かれている | template `Required Sections`（1..9）が SSOT。本 wave は逐語 9 見出しで作成 | **reject（反映しない）**。canonical SSOT は `phase12-compliance-check-template.md` の `Required Sections` 1..9 であり、過去通過例の旧表記は historical なものとして扱う。本 wave は SSOT に逐語準拠したため skill 更新は不要 |

## promotion gate 判定

| 判定 | item | 根拠 |
| --- | --- | --- |
| Promote | （なし） | owning skill（task-specification-creator / aiworkflow-requirements）の SKILL.md / references / assets / LOGS に反映すべき再発防止ルールは検出されなかった |
| Defer | （なし） | `docs/30-workflows/unassigned-task/` へ formalize すべき横断改善は検出されなかった（SF-1/SF-2 はタスク固有 artifacts の補正で完結） |
| Reject / No-op | SF-1 / SF-2 / SF-3 | SF-1/SF-2 はタスク固有 artifacts の記述 drift で workflow-local 補正（documentation-changelog.md）に閉じる。SF-3 は canonical SSOT 準拠済みで反映不要 |

## まとめ

本タスクで owning skill への昇格が必要な改善点は **0 件**。検出した 3 件はいずれも本タスク固有の artifacts 記述 drift（SF-1/SF-2）
または historical 表記差（SF-3）であり、workflow-local の補正記録、aiworkflow-requirements の workflow ledger 同期、
SSOT 逐語準拠で完結する（no-op / reject）。
改善点なしでも本レポートは出力必須のため、観察事項と routing を上記に明記した。
