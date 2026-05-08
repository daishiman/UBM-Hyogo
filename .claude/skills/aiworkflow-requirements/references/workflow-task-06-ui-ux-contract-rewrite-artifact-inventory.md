# task-06-ui-ux-contract-rewrite Artifact Inventory

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-06-ui-ux-contract-rewrite |
| タスク種別 | implementation / NON_VISUAL（primary spec rewrite） |
| ワークフロー | implemented-local（Phase 1-12 completed / Phase 13 pending_user_approval） |
| canonical task root | `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/` |
| primary spec | `docs/00-getting-started-manual/specs/09-ui-ux.md`（396 行・契約のみ） |
| 同期日 | 2026-05-07 |
| owner | Tech Writer |
| domain | UI 契約正本（19 routes × 13 primitives + feature components） |
| Wave | 2 |
| 実行種別 | parallel |
| depends_on | task-01（19 routes scope-gate）/ task-07（09a path のみ） / task-08（09b path のみ） |

## Acceptance Criteria

詳細は `outputs/phase-07/main.md`（AC-1〜AC-14）を正本とする。要点:

- AC-1〜AC-2: H2 10 件（§1〜§10）/ `### 2.` 19+ 件（19 routes + global fallback）
- AC-3〜AC-6: 視覚詳細値の混入 0 件（HEX / `oklch()` / px / `bg-[#`）
- AC-7〜AC-11: §2 contract entry 完備 / §3.1 primitives 13 件 / §4.2 login 5 状態 / §5.2 dialog drawer aria-modal / §6.3 token prefix 8 種
- AC-12: §2 API 列が `apps/api` 経由または API 不要であり apps/web → D1 直接参照 0 件（不変条件 #5）
- AC-13: §8 で gas-prototype / tweaks panel / theme switcher / `data-theme` / AvatarStoreProvider localStorage を不採用明記
- AC-14: repository lint / TypeScript lint exit 0

## Phase Outputs（task-06 内成果物）

| Phase | 場所 | 主要成果物 | 行数 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-01/main.md` | 要件定義 | 87 |
| 2 | `outputs/phase-02/main.md` + `chapter-skeleton.md` | 章立て確定 §1〜§10 | 122 + 86 |
| 3 | `outputs/phase-03/main.md` | 設計レビュー | 77 |
| 4 | `outputs/phase-04/main.md` + `verify-matrix.md` | テスト戦略 / verify matrix | 61 + 22 |
| 5 | `outputs/phase-05/main.md` + `runbook.md` | 実装ランブック | 56 + 92 |
| 6 | `outputs/phase-06/main.md` | 異常系検証 | 133 |
| 7 | `outputs/phase-07/main.md` | AC-1〜AC-14 マトリクス（AC 正本） | 53 |
| 8 | `outputs/phase-08/main.md` | DRY 化（重複表の集約判断） | 73 |
| 9 | `outputs/phase-09/main.md` | 品質保証（grep gate / structure check / markdown lint / trace check） | 85 |
| 10 | `outputs/phase-10/main.md` | 最終レビュー | 86 |
| 11 | `outputs/phase-11/main.md` + `evidence/` + `link-checklist.md` + `manual-smoke-log.md` + `phase-11-non-visual-alternative-evidence.md` | NON_VISUAL alternative evidence 4 種 | 16 + 15 + 12 + 10 |
| 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,phase12-task-spec-compliance-check,skill-feedback-report,unassigned-task-detection}.md` | strict 7 outputs | 64 + 123 + 57 + 73 + 56 + 59 + 49 |
| 13 | `phase-13.md`（仕様のみ） | PR 作成（pending_user_approval） | 208 |

`index.md`（245 行）/ `artifacts.json` を上位エントリポイントとして固定する。

## Primary Spec 書き換え（実成果物）

| ファイル | 役割 | 行数 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | 19 routes + 13 primitives + feature components の契約のみを正本化 | 396 |

§構造:

- §1 位置づけと正本主義（§1.2 に 09a..09h index 表）
- §2 19 routes 全画面契約（公開 6 / 会員 2 / 管理 8 / 共通 3 + global fallback）
- §3 component 契約（13 primitives + feature components）
- §4 状態列挙（§4.2 login 5 状態 input/sent/unregistered/deleted/error）
- §5 アクセシビリティ契約（dialog / drawer / form / live region）
- §6 token 参照規則（§6.2 grep gate / §6.3 prefix 8 種）
- §7 Storybook 正本主義 / §8 不採用 / §9 用語集 / §10 改訂履歴

## 視覚詳細委譲先（path 確定 / 中身は別 task）

| 委譲先 spec path | 担当 task | 役割 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09a-prototype-map.md` | task-07 | prototype source ↔ 本番 component 行範囲 mapping |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | task-08 | OKLch / radius / shadow / typography / spacing token 値 |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | task-19 | primitive 完全仕様（JSX inline + a11y） |
| `docs/00-getting-started-manual/specs/09d-icons.md` | task-22 | icon カタログ（icons.jsx 由来） |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | task-20 | 公開層 blueprint |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | task-20 | 会員層 blueprint |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | task-21 | 管理層 blueprint |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | task-22 | app shell + fixture data |

## 下流 task への引渡し点

| 下流 task | 引渡し点（09-ui-ux.md セクション） | 用途 |
| --- | --- | --- |
| task-07 prototype-mapping-table（09a） | §1.2 index 表の 09a 行 | prototype 行範囲を 09a 側に格納する契約 |
| task-08 design-tokens-doc（09b） | §6 全体 + §1.2 09b 行 | OKLch token 値の正本を 09b に格納 |
| task-09 tailwind-v4-setup | §6.2 grep gate / §6.3 prefix 規則 | Tailwind v4 token 配線の入力 |
| task-10 ui-primitives | §3.1 primitives 13 件契約 | primitive 実装の契約 |
| task-11..17 各画面実装 | §2 routes 表（行 = 1 route 実装単位） | 画面実装の契約 |
| task-18 verify-design-tokens（CI gate） | §6.2 grep gate | HEX / `oklch()` / px / `bg-[#` を CI で 0 件強制 |
| task-19 primitives 完全仕様（09c） | §3.1 + §1.2 09c 行 | primitive JSX + a11y を 09c に展開 |
| task-20 公開層・会員層 blueprint（09e/09f） | §2.1 / §2.2 + §1.2 | 画面 blueprint 委譲 |
| task-21 管理層 blueprint（09g） | §2.3 + §1.2 | 管理画面 blueprint 委譲 |
| task-22 icons / shell + fixtures（09d/09h） | §1.2 09d / 09h 行 | icon set + app shell 委譲 |

## Same-wave skill / index sync（diff scope に含めるべきもの）

| ファイル | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | task-06 implementation-spec 完了 trigger 追補 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | task-06 close-out log |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `09-ui-ux contract grep` / `routes index grep` / `primitives index grep` / `a11y contract grep` / `token prefix grep` |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | task-06 row 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | UI/UX contract rewrite task-06 行（L19）+ inventory link |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | task-06 topic 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | task-06 active 行 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-task-06-ui-ux-contract-rewrite.md` | changelog 新規 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-06-ui-ux-contract-rewrite-2026-05.md` | L-T06-001..007 |
| `.claude/skills/task-specification-creator/SKILL.md` + `LOGS/_legacy.md` | NON_VISUAL × markdown contract rewrite テンプレ追加 |

## 重要な実装値（09-ui-ux.md で確定）

- token 名 prefix 8 種: `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-space-*` / `--ubm-text-*` / `--ubm-font-*` / `--ubm-dur-*` / `--ubm-ease-*`
- routes 数: 19（公開 6 / 会員 2 / 管理 8 / 共通 3）+ `global-error.tsx` fallback
- primitives 数: 13（Button / Card / Badge / Input / Select / Table / Tabs / Sidebar / Toast / Skeleton / DataTable / EmptyState / ErrorState）
- login 状態: 5（input / sent / unregistered / deleted / error）
- 不採用: tweaks panel / theme switcher / `data-theme="warm"|"cool"` / AvatarStoreProvider localStorage / gas-prototype 由来挙動

## Follow-up（task-06 スコープ外・別 wave で workflow dir 起票予定）

`outputs/phase-12/unassigned-task-detection.md` のとおり task-06 内に未割当作業は 0 件。委譲先 spec の中身生成はすべて以下 task に割当済み:

| 委譲先 task | 範囲 |
| --- | --- |
| task-07 / 08 | 09a / 09b の中身生成 |
| task-09 / 10 | tailwind v4 / ui primitives 実装 |
| task-11..17 | 19 routes 各画面実装 |
| task-18 | verify-design-tokens CI gate |
| task-19..22 | 09c / 09d / 09e / 09f / 09g / 09h 中身生成 |

## Validation Chain

| 検証項目 | 結果 | evidence |
| --- | --- | --- |
| §6.2 grep gate（HEX / oklch / px / `bg-[#`） | 0 件 PASS | `outputs/phase-11/evidence/grep-gate.log` |
| 構造検証（H2 10 / `### 2.` 19+） | PASS | `outputs/phase-11/evidence/structure-check.log` |
| markdown lint | exit 0 | `outputs/phase-11/evidence/markdown-lint.log` |
| trace check（contract → impl mapping） | PASS | `outputs/phase-11/evidence/trace-check.log` |
| AC-1〜AC-14 | PASS | `outputs/phase-07/main.md`（AC 正本） |
| Phase 12 strict 7 outputs | PASS | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 PR 作成 | PENDING | user approval 待ち |

## 不変条件 trace

- #2 consent キー `publicConsent` / `rulesConsent` 統一: §2 register / profile 表で参照
- #3 `responseEmail` system field: §2 profile / admin members 表で参照
- #5 `apps/web` から D1 直接アクセス禁止: §2 全 routes API 列で `apps/api` 経由のみ記述（AC-12）
- #6 GAS prototype を本番仕様に昇格させない: §8 で gas-prototype 由来を不採用明記（AC-13）
- 視覚詳細値 0 件: §6.2 grep gate（AC-3〜AC-6）
