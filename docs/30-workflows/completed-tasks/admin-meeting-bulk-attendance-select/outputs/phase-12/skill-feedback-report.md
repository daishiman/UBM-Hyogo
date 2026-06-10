# スキルフィードバックレポート — admin-meeting-bulk-attendance-select

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-09

本 wave で観察した改善点・教訓を記録する。各 item の routing（promote / defer / reject / no-op）を明記する。
本タスクで owning skill のテンプレ本体へ昇格すべき再発防止ルールは **0 件**である。

## 観察事項

| # | 観点 | 観察内容 | 実測 | routing |
| --- | --- | --- | --- | --- |
| SF-1 | 前提コード検証（誤報訂正の教訓） | 初回のコード調査 SubAgent が `meetings.ts`（plural toggle route）のみを見て「一括取込 endpoint は存在しない」と誤報した。実際は `attendance.ts:120-175` に存在し `index.ts:283` で mount 済み | `attendance.ts` を直接 Read して endpoint 実在 + mount を確認。Phase 1 §4 に「訂正記録」として明記 | **no-op（owning skill 非変更）**。FB-01 / Issue #1065 gate（「設計前提に引用する契約は実コードを Read 済み」）が既存 reference に存在し、本タスクはそれに従って訂正済み。skill テンプレ欠陥ではなく、既存ルールで捕捉できた成功例 |
| SF-2 | 設計判断（既存 endpoint 再利用で API 変更ゼロ） | 一括追加に新規 endpoint を作らず、既存 import endpoint（all-or-nothing / dryRun）を再利用することで AC-12（apps/api 非変更）を構造的に満たせた | 再利用 endpoint の row status / commit 条件 / IMPORT_MAX_ROWS を実コードから確認し SSOT に転記 | **no-op（観察）**。「既存 endpoint surface のみ利用し UI 側に adapter を置く」方針は CLAUDE.md「UI prototype alignment 正本順位」に既存記載あり。本タスクはそれを忠実に適用した事例として記録 |
| SF-3 | UX 設計（all-or-nothing と未出席のみ選択の整合） | 一括取込は all-or-nothing（1 件でも失敗で全件未 commit）だが、選択母集合を未出席候補のみに限定することで通常 duplicate を構造的に回避し、UX の破綻を防げた | Phase 2 §5 / SSOT §5 に設計を明記。`committed:false` 時の選択保持（AC-7）と整合 | **no-op（観察）**。API の業務的失敗（HTTP 200 + committed:false）を UI でどう扱うかは本タスク固有の設計判断。横断ルール化するほどの一般性はないため owning skill 非変更 |
| SF-4 | テンプレート（VISUAL local evidence と staging user-gate 分離） | 初期成果物では local fixture screenshot まで user-gated 扱いにしていたが、VISUAL 実装タスクでは local fixture PNG を同サイクルで取得し、staging 認証済み baseline のみ user-gated とする方が検証4条件に整合する | 2026-06-09 review で `outputs/phase-11/screenshots/` に 7 PNG を生成し、metadata / Phase 12 参照を修正 | **no-op（owning skill 非変更）**。今回の漏れは本タスク成果物の close-out 表現 drift であり、ユーザー指定 CONST_006/007 に従うことで同サイクル修正済み。横断テンプレ改修が必要な新規ルールではない |

## promotion gate 判定

| 判定 | item | 根拠 |
| --- | --- | --- |
| Promote | （なし） | owning skill（task-specification-creator / aiworkflow-requirements）の SKILL.md / references / assets / LOGS に反映すべき再発防止ルールは検出されなかった |
| Defer | （なし） | `docs/30-workflows/unassigned-task/` へ formalize すべき横断改善は検出されなかった |
| Reject / No-op | SF-1 / SF-2 / SF-3 / SF-4 | SF-1/SF-2/SF-3 は既存ルールの成功適用例または本タスク固有設計。SF-4 は本タスク成果物内の close-out drift として同サイクル修正済み |

## まとめ

本タスクで owning skill への昇格が必要な改善点は **0 件**。検出した 4 件はいずれも既存ルール
（FB-01 前提コード検証 / 既存 endpoint 再利用方針 / VISUAL local screenshot と staging user-gate 境界）の成功適用例、
または本タスク固有の UX 設計判断であり、skill テンプレ本体の更新は不要（no-op / reject）。

教訓として最も価値が高いのは SF-1（SubAgent の別 route 誤報 → 直接 Read で訂正）である。これは
「複数 route ファイルがある領域では、調査 SubAgent の報告を鵜呑みにせず、契約引用前に対象 endpoint の
実ファイルを直接 Read する」という FB-01 gate の重要性を再確認した事例として、本レポートに残す。
改善点なしでも本レポートは出力必須のため、観察事項と routing を上記に明記した。
