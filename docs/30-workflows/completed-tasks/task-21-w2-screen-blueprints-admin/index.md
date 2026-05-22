# task-21-w2-screen-blueprints-admin — タスク仕様書 index

[実装区分: ドキュメントのみ]
判定根拠: 成果物は `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` 単一の markdown 仕様書のみ。`apps/` / `packages/` への code 変更を伴わない docs-only / NON_VISUAL タスク。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| ディレクトリ | docs/30-workflows/task-21-w2-screen-blueprints-admin |
| 親タスク | ui-prototype-alignment-mvp-recovery |
| 親 spec | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md |
| Wave | W2 (parallel — task-06/07/08/19/20/22 と並列実行可) |
| 実行種別 | sequential（13 phase 内）/ task 単位は parallel |
| 作成日 | 2026-05-07 |
| 担当 | Tech Writer |
| 状態 | spec_created（Phase 1〜12 completed / Phase 13 blocked_pending_user_approval） |
| ゲート状態 | NON_VISUAL |
| タスク種別 | docs-only / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| coverage AC | 適用外（pure docs-only。対象は `09g-screen-blueprints-admin.md` と本 workflow package のみで、`apps/` / `packages/` のテスト対象コードを追加しない） |
| artifacts | `artifacts.json` root-only（`outputs/artifacts.json` は作成しない） |
| Issue | （未起票 — 必要時に github-issue-manager で作成） |

## purpose

`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（658 行・凍結正本）の **管理層 8 routes** を `09g-screen-blueprints-admin.md` に **構造 contract として完全再現**する。
P50 baseline として `09g-screen-blueprints-admin.md` が既に存在する場合は「新規作成」ではなく **既存 09g の contract repair** として扱い、AC-1〜AC-9 に合わない現行記述を Phase 5〜10 で同一サイクル内に補正する。
プロトタイプ未掲載の admin 画面（meetings / requests / identity-conflicts / audit）は phase-3 §3 §5.3〜§5.7 の派生ルールを正本転記する。
AdminSidebar は §1 に集約し全画面共通として扱う。bulk-action / approve-reject / schema-apply confirm 等の操作手順を明文化する。
token は `--ubm-*` 名のみ参照し、視覚値（HEX / oklch / px / `bg-[`）は本仕様書に 0 件含めない。

## scope in / out

### scope in

- `09g-screen-blueprints-admin.md`（700〜1200 行）新規作成
- §1 AdminSidebar 共通セクション（1 箇所集約）
- §2 dashboard / §3 members / §4 tags / §6 schema（プロトタイプ掲載 4 画面の構造・copy・状態・API contract 転記。視覚値や任意 class は転記しない）
- §5 meetings / §7 requests / §8 identity-conflicts / §9 audit（未掲載 4 画面の派生ルール正本転記）
- bulk-action / approve-reject / schema-apply 二段確認の §X.7 操作手順
- §X.6 a11y（confirm Modal `role="dialog"` + `aria-modal="true"` + Esc close + focus trap）
- §99 不採用要素（TweaksPanel / theme switcher / data-theme）
- 09c / 09b / 09d / 09a への参照リンク

### scope out

- 実装コード（task-15 / task-16 / task-17）
- token 値そのもの（task-08）
- primitive 仕様（task-19）
- 公開 / 会員画面（task-20）
- shell / fixtures（task-22）
- pages-admin.jsx の改変（凍結正本のため不可）
- D1 schema 変更 / Google Form 仕様変更
- 新規 API endpoint 追加

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-01 scope-gate-all-screens | admin 8 routes scope 確定 |
| 上流 | phase-1 §3 admin routes 一覧 | 章立ての DAG 座標 |
| 上流 | phase-3 §2 admin API 接続表 | §X.4 API 表の正本 |
| 上流 | phase-3 §3 §5.3〜§5.7 派生ルール | 未掲載 4 画面の正本 |
| 上流 | pages-admin.jsx (L1-L658) | 掲載 4 画面 JSX の正本 |
| 下流 | task-15 / task-16 / task-17 | 各 admin 実装タスクの blueprint 正本 |
| 関連 | task-06 / 07 / 08 / 19 / 22 | mapping / token / primitive / icon の参照先 |

## phases ナビ

| Phase | 名称 | 状態 | 主成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed | AC-1〜N quantitative / 真の論点 / 4 条件評価 |
| 2 | 設計 | completed | 章立て・シグネチャ・派生ルール正本転記計画 |
| 3 | テスト戦略 | completed | markdown structure / grep 規制 / API trace check / mermaid count |
| 4 | TDD RED | completed | 09g 不在時の検証スクリプト fail 確認 |
| 5 | TDD GREEN | completed | §1 AdminSidebar 集約セクション作成 |
| 6 | 実装-本体1 | completed | §2 dashboard / §3 members 構造 contract 転記 |
| 7 | 実装-本体2 | completed | §4 tags / §5 meetings / §6 schema |
| 8 | 実装-本体3 | completed | §7 requests / §8 identity-conflicts / §9 audit / §99 不採用 |
| 9 | リファクタ・最適化 | completed | 重複除去 / Sidebar 参照リンク統一 / 行数調整（700〜1200 行） |
| 10 | 段階的有効化 | completed | markdown lint / 視覚値 0 件 / API trace 完全一致 |
| 11 | 検証（NON_VISUAL evidence） | completed | grep gate / structure check / api parity log を outputs/phase-11/evidence/ に保存 |
| 12 | ドキュメント整備 | completed | implementation-guide / system-spec-update / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成準備 | blocked_pending_user_approval | commit/push/PR の手順とゲート（ユーザー承認後実行） |

## 不変条件（task-21 §0.5 転記）

1. `pages-admin.jsx` は **凍結正本**。本タスクで改変しない。
2. prototype 掲載画面は JSX の **構造・copy・状態 contract** を転記する。視覚値、任意 class、prototype-only mock control は転記しない。
3. 視覚値（HEX / oklch / px）を本ファイルに **0 件**含める。
4. `apps/web` から D1 直接アクセス禁止（CLAUDE.md 不変条件 5）。
5. AdminSidebar は §1 に 1 箇所だけ記述し、各画面 §X からは「§1 参照」とリンクで集約する（重複禁止）。
6. bulk-action / approve-reject は確認ダイアログ（Modal）必須。`role="dialog"` + `aria-modal="true"` + Esc close + focus trap を §X.6 a11y に必ず記述。
7. schema-apply は二段確認（diff 表示 → apply confirm）を §X.3 状態遷移に明示。
8. 未掲載画面（meetings / requests / identity-conflicts / audit）は phase-3 §3 §5.3〜§5.7 の派生ルールに従い、新規 primitive を生成しない（09c の組合せのみ）。

## 触れるファイル

| 区分 | path | 用途 |
| --- | --- | --- |
| C/M | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | admin 9 セクション + §99 不採用。既存ファイルがある場合は AC に合わせて修正 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | L1-L658 転記元 |
| R（参照） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` | §3 admin routes |
| R（参照） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` | §2 API / §3 §5.3〜§5.7 派生 |
| R（参照） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | diff scope 規律 |

## DoD（task-21 §8 再構成）

- [x] `09g-screen-blueprints-admin.md` 作成または既存 repair・700〜1200 行
- [x] §1 AdminSidebar 共通セクション 1 箇所のみ存在
- [x] §2〜§9 で admin 8 routes blueprint が揃う
- [x] 各画面 §X に X.1〜X.8 の 8 サブセクションが揃う
- [x] 未掲載 4 画面が phase-3 §3 §5.3〜§5.7 派生ルールに従う
- [x] confirm Modal の `role="dialog"` + `aria-modal="true"` + focus trap + Esc close が §X.6 に記述
- [x] schema-apply の二段確認（diff → apply）が §6.3 状態遷移に明示
- [x] 視覚値（HEX / oklch / px / `bg-[`）が 0 件
- [x] phase-3 §2 admin API と §X.4 が完全一致
- [x] §99 不採用に TweaksPanel / theme switcher / data-theme の 3 件
- [x] markdown lint fallback / structure gate で error 0 相当
- [x] 09c / 09b / 09d / 09a への link が全画面で記述

## 実行モード

sequential（13 phase 内）。task 単位は task-06 / 07 / 08 / 19 / 20 / 22 と W2 parallel。
