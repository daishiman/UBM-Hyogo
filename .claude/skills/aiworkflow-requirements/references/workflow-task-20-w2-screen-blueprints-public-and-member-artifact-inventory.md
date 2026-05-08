# task-20 W2 Screen Blueprints public/member Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | task-20-w2-screen-blueprints-public-and-member |
| タスク種別 | docs-only / NON_VISUAL（公開 6 routes + 会員 2 routes の screen blueprint 仕様化） |
| ワークフロー | implemented-local（Phase 1-12 完了 / Phase 13 はユーザー承認待ち） |
| canonical task root | `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/` |
| 同期日 | 2026-05-07 |
| owner | docs/00-getting-started-manual/specs |
| domain | UI prototype alignment / MVP recovery / screen blueprint |
| depends_on | task-19（primitives 09c）/ task-09（design tokens 09b）/ task-08（design-tokens.md） |
| downstream | task-11（公開 §1/§2）/ task-12（公開 §3/§4）/ task-13（会員 §1）/ task-14（会員 §2）/ task-06（09-ui-ux index 接続） |

## Acceptance Criteria

要点:
- 公開 6 routes（`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`）が 09e に screen blueprint として固定されている
- 会員 2 routes（`/login`, `/profile`）が 09f に screen blueprint として固定されている
- 既存 API（`/public/*`, `/auth/*`, `/me/*`）境界のみ。新 endpoint / D1 schema / Secret 変更なし
- `pages-public.jsx` / `pages-member.jsx` 凍結 prototype の一字一句転記が fenced JSX block として保存されている
- §99 不採用要素ブロックで MVP scope 外 prototype 要素の trace を記録
- visual literal gate は fenced JSX block を除外する形で 0 hit
- `§TBD` / `TODO` 残存 0 hit

## Phase Outputs

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1 | `outputs/phase-01/` | 要件定義 |
| 2 | `outputs/phase-02/` | 設計 |
| 3 | `outputs/phase-03/` | spec source 抽出（09e/09f scope 確定） |
| 4-9 | `outputs/phase-{04..09}/` | spec authoring 各段階 |
| 10 | `outputs/phase-10/` | spec freeze |
| 11 | `outputs/phase-11/` | NON_VISUAL grep evidence（grep-api-trace / grep-copy-text / grep-invariants / grep-section-count / grep-visual-values / markdown-lint / placeholder / wc-lines） |
| 12 | `outputs/phase-12/` | strict 7 files: main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check |
| 13 | （未実行） | commit / push / PR は user approval 後 |

## 主要成果物

| ファイル | 役割 |
|---|---|
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | 公開 6 routes の screen blueprint（layout / props / state / API / copy / fenced JSX 転記 / §6 terms / §99 不採用要素） |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | 会員 2 routes の screen blueprint（同上 + login / profile gate states / §99 不採用要素） |

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Changelog v2026.05.07-task20-screen-blueprints |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | task-20 専用 lookup ブロック（workflow root / 状態 / 実 docs 正本 / scope / API 境界 / visual gate / downstream / evidence / boundary） |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | task-20 行（最初に読む / 必要に応じて読む） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | task-20 active entry |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 最新更新ヘッドライン |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-task20-screen-blueprints.md` | 同期 changelog |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-20-w2-screen-blueprints-2026-05.md` | L-T20W2-001..005 |

## 不採用 / 起票見送り（unassigned-task-detection.md より）

| 候補 | 判定理由 |
|---|---|
| UT-task-20-FU-00（API/BFF endpoint 追加） | 09e/09f を現行 API 正本に補正済みで実装タスク不要 |
| UT-task-20-FU-01（§X.7 link 補正） | `§TBD` / `TODO` zero-hit gate を採用 |
| UT-task-20-FU-02（LegalProse primitive） | task-19 / 09c primitive scope に吸収 |
| UT-task-20-FU-03（form preview cache） | task-12 runtime 実装時の問題、現契約は既存 `GET /public/form-preview` のみ |

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| Phase 11 NON_VISUAL grep evidence（8 log） | PASS |
| Phase 12 strict 7 files | PASS |
| visual literal gate（fenced JSX 除外） | PASS（0 hit） |
| `§TBD` / `TODO` zero-hit | PASS |
| screenshot 系不在 | PASS（NON_VISUAL） |
| artifacts.json parity（root のみ） | PASS（root が唯一正本） |
| Phase 13（commit / push / PR） | PENDING（user approval 待ち） |
