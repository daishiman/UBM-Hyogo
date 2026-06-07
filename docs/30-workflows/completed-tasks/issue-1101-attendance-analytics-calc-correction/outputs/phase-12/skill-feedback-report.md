# skill feedback report（issue-1101-attendance-analytics-calc-correction）

Phase 12 Task 5。本タスクで得た改善点を「テンプレート改善 / ワークフロー改善 / ドキュメント改善」の 3 観点で記録し、
各 item を owning skill（task-specification-creator / aiworkflow-requirements / skill-creator）または no-op に routing する。

## SF-1: 同一視覚ラベルが別ドメインで重複する場合の grep gate スコープ限定（ワークフロー改善）

| 項目 | 内容 |
| --- | --- |
| 観点 | ワークフロー改善（QA / grep gate 設計） |
| lesson | 視覚ラベル `0→1` / `1→10` / `10→100` が本リポジトリで **2 つの無関係なドメイン**に登場する: (1) 出席回数帯（`AttendanceZone`・本タスク対象）、(2) UBM 事業成長フェーズ（`byZone.ts` の `0to1` 等・`AboutUbm.tsx` 等の `0_to_1` 等・本タスク非対象）。同一ラベルが別ドメインで重複する場合、`rg '0→1'` のような素朴な grep gate は別ドメインのヒットを誤検出し「触っていないのに残存違反」と誤判定する |
| 改善内容 | grep gate のスコープを **型 import 境界で限定**する（`AttendanceZone` 型を import するファイル群に限定 = `apps/api/src/repository` / `apps/web/src/features/admin/attendance` / `packages/shared`）。別ドメインのファイルパスを明示除外し、検索対象を狭めることで誤検出を防ぐ |
| promotion target | **`task-specification-creator`**（Phase 9 QA / grep gate のスコープ限定パターンを `references/patterns-validation-and-audit.md` / `references/patterns-lessons-and-pitfalls.md` / `SKILL-changelog.md` へ同 wave 反映） |
| no-op reason | 該当なし（promotion candidate） |
| evidence path | `phase-1-requirements.md` §5（スコープ境界の厳格化・別ドメイン非変更）/ `phase-2-design.md` §0.5・完了条件。本 report SF-1 |

## SF-2: additive field 追加時の bind 順序整合チェックリスト（ドキュメント改善）

| 項目 | 内容 |
| --- | --- |
| 観点 | ドキュメント改善（実装ガイド品質） |
| lesson | SQL の SELECT に集計サブクエリを additive 追加すると period 等の bind セット数が増える（本タスクでは 2 → 3 セット）。bind 順序を SELECT 出現順に一致させないと「件数が他指標の値にすり替わる」サイレントバグになり、型チェックでは検出できない。implementation-guide にこの注意点を明記する慣行が有効 |
| 改善内容 | implementation-guide.md に「bind 順序の最大の注意点」を独立記載した（Part 2）。SQL additive 追加を含むタスクの実装ガイドでは bind 順序整合を必須 key section にする |
| promotion target | **no-op**（本タスクの implementation-guide.md 内で対応済み。skill reference への昇格までは不要） |
| no-op reason | 個別タスク固有の SQL 構造に依存する注意点であり、汎用テンプレート昇格より個別ガイド記載が適切 |
| evidence path | `outputs/phase-12/implementation-guide.md` Part 2「SQL（DISTINCT 集計）と bind 順序の注意」 |

## SF-3: VISUAL タスクで主証跡を component test に置く判断基準（テンプレート改善）

| 項目 | 内容 |
| --- | --- |
| 観点 | テンプレート改善（Phase 11 証跡メタ） |
| lesson | visualEvidence=VISUAL でも、変更が label 文言 / KPI タイル等の「文字列・値レベル」に限定されレイアウト/CSS 変更を伴わない場合、視覚回帰よりも component test（jsdom）が変更の正しさをより直接的に立証する。Phase 11 manual-test-result に「主証跡の定義」と「VISUAL だが component test を主証跡とする理由」を明記する型が有効 |
| 改善内容 | manual-test-result.md に証跡メタ表（primary/secondary source）と理由セクションを設けた |
| promotion target | **no-op**（既存の Phase 11 manual-test テンプレートで表現可能。本タスクで型を実証） |
| no-op reason | 既存テンプレート（manual-test-result.md の Summary / Gate 表 / Visual Runtime Boundary）で十分表現でき、新規 asset 追加は不要 |
| evidence path | `outputs/phase-11/manual-test-result.md`「証跡メタ」「VISUAL だが component test を主証跡とする理由」 |

## routing サマリー

| item | promotion target | 状態 |
| --- | --- | --- |
| SF-1（grep gate スコープ限定） | `task-specification-creator` | promoted in this wave |
| SF-2（bind 順序チェックリスト） | no-op | implementation-guide 内で対応済み |
| SF-3（VISUAL の主証跡 component test） | no-op | 既存テンプレートで表現済み |

owning skill への実反映（SF-1）は本サイクル内で実施済み。SF-2 / SF-3 は個別タスク内で対応済みまたは既存テンプレートで表現可能なため no-op とした。
