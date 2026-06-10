# スキルフィードバックレポート — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-08

本 wave で観察したテンプレート/ワークフロー/ドキュメント改善点を記録する。いずれも本タスク（`apps/web` sidebar shell の
collapsed/expanded レイアウト是正・implemented_local_evidence_captured）の作成中に検出した観察であり、owning skill のテンプレ本体に欠陥があるわけではない。
各 item の routing（promote / defer / reject / no-op）を明記する。改善点なしでも本レポートは出力必須のため、観察事項と routing を記載する。

## 観察事項

| # | 観点 | 観察内容 | 実測 | routing |
| --- | --- | --- | --- | --- |
| SF-1 | ワークフロー改善（検証コマンド drift） | focused vitest の設定パスとして `apps/web/vitest.config.ts` を想定しやすいが、実 SSOT はリポジトリルートの `vitest.config.ts` であり、`--root=.` 省略で「No test files」になる罠がある | `ls apps/web/vitest.config.*` → no matches / repo root の `vitest.config.ts` を `--root=.` 指定で参照 | **no-op（owning skill 非変更）**。タスク固有 artifacts / phase docs を `--root=. --config=vitest.config.ts` で記述済み。task-specification-creator skill のテンプレ欠陥ではなく、既知の repo 固有パターン（`unified-sidebar-shell` 系で確認済み） |
| SF-2 | ドキュメント改善（aside overflow の表現差） | `_shared-context.md` §3.4 は `globals.css:1986` の `[data-shell="sidebar"]{overflow:hidden}` を根本原因の overflow 関与として参照するが、`SidebarShell.tsx:102` の `<aside>` className には `overflow-visible` ユーティリティが付与されており、CSS rule と Tailwind class の優先順位が読み手に分かりにくい | 実コード Read で `<aside className="... overflow-visible ...">` を確認 / `globals.css:1986` の rule は shared-context の引用 | **no-op（owning skill 非変更）**。本 wave は documentation-changelog.md の D-2 に observation として記録し、実描画の確定を実装サイクル + Phase 11 TC-11-3（OOS-1 判定材料）へ委ねた。skill テンプレ側の追加ルールは不要 |
| SF-3 | テンプレート改善（VISUAL × implemented_local_evidence_captured の screenshot 表現） | VISUAL タスクで実装済みの場合、screenshot をどう表現するか（PNG 3 件・inventory の `status: "captured_local_fixture"`）の運用が、過去の通過例（local fixture present の VISUAL）と表記が分かれる | template / sibling `admin-attendance-dashboard-ux`（local present 版）を雛形にしつつ、本 wave は implemented_local_evidence_captured 用に inventory status を `captured_local_fixture`・各エントリ `present`・PNG 3 件 で表現 | **reject（反映しない）**。canonical SSOT（`phase-11-screenshot-guide.md` / `phase12-compliance-check-template.md`）は VISUAL evidence を status で表現する既存ルールで充足。implemented_local_evidence_captured の文脈差は本 wave の docs 記述で吸収済みで、skill 更新は不要（historical な表記差） |

## promotion gate 判定

| 判定 | item | 根拠 |
| --- | --- | --- |
| Promote | （なし） | owning skill（task-specification-creator / aiworkflow-requirements）の SKILL.md / references / assets / LOGS に反映すべき再発防止ルールは検出されなかった |
| Defer | （なし） | `docs/30-workflows/unassigned-task/` へ formalize すべき横断改善は検出されなかった（SF-1/SF-2 はタスク固有 docs の記述で完結） |
| Reject / No-op | SF-1 / SF-2 / SF-3 | SF-1/SF-2 はタスク固有の運用・observation で workflow-local 記述（documentation-changelog.md D-1/D-2）に閉じる。SF-3 は canonical SSOT 準拠済みで反映不要 |

## まとめ

本タスクで owning skill への昇格が必要な改善点は **0 件**。検出した 3 件はいずれも本タスク固有の運用観察（SF-1）・
observation（SF-2）または historical 表記差（SF-3）であり、workflow-local の補正記録、aiworkflow-requirements の workflow ledger 同期、
SSOT 準拠で完結する（no-op / reject）。改善点なしでも本レポートは出力必須のため、観察事項と routing を上記に明記した。
