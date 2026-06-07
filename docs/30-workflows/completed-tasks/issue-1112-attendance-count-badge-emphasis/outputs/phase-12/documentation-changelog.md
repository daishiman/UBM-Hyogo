# Phase 12 — ドキュメント変更ログ

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本 wave で発生した（または発生しなかった）ドキュメント同期を Step 単位で個別に記録する。
「該当なし」も明記する。

## 実装状況テーブル

| key | value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| 実装ファイル変更 | 実施済み（5 ファイル） |
| local screenshot | 実施済み（3 PNG + screenshot-inventory.json） |
| commit / push / PR | 未実施（user-gated） |

## workflow-local 同期

| Step | 対象 | 変更 |
| --- | --- | --- |
| 1-A | `docs/30-workflows/completed-tasks/issue-1112-attendance-count-badge-emphasis/outputs/phase-12/*`（strict 7） | **新規作成**（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md） |
| 1-A | 同 `outputs/phase-11/screenshots/*` / `screenshot-inventory.json` | **新規作成**（local Playwright fixture screenshot 3 点 + inventory） |
| 1-A | 同 `outputs/phase-13/phase-13.md` | **新規作成**（PR phase・`pending_user_approval`） |
| 1-B | `index.md` / artifacts の `workflow_state` | `implemented_local_evidence_captured` へ同期 |
| 1-C | `docs/00-getting-started-manual/specs/design-tokens.md` | **該当なし**（新規トークンなし・不変） |
| 1-C | `apps/web/src/styles/tokens.css` | **該当なし**（トークン定義不変） |

## global skill sync

| Step | 対象 | 変更 |
| --- | --- | --- |
| 2 | aiworkflow-requirements system spec（公開 interface/型/API カタログ） | **該当なし（N/A）**。追加 export は admin 内部 helper に閉じ、公開 surface 変更なし。 |
| 2 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` | **反映済み**。implemented workflow として探索導線を追加。 |
| 2 | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1112-attendance-count-badge-emphasis-artifact-inventory.md` | **新規作成**。 |
| 2 | `.claude/skills/*/SKILL.md` / changelog | **該当なし**。skill-feedback 候補 0 件（`skill-feedback-report.md`）。 |
| 2 | skill indexes（`indexes/*-map.md` / `keywords.json`） | `pnpm indexes:rebuild` で検証。 |

## グローバル仕様への影響

| 観点 | 判定 |
| --- | --- |
| 公開 API / D1 / Google Form | 影響なし（不変） |
| design tokens | 影響なし（新規トークンなし） |
| 認証境界 / env アクセサ | 影響なし |
| aiworkflow-requirements system spec | N/A（Step 2 該当なし） |

## まとめ

本 wave のドキュメント変更は workflow-local の状態同期、Phase 12 strict 7、Phase 13、aiworkflow workflow 参照登録。
design-tokens.md・tokens.css・公開 spec への反映は該当なし。git 操作は user-gated。
