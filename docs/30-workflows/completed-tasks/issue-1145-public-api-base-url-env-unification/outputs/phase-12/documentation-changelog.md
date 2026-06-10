> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — ドキュメント変更ログ

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本 wave で発生した（または発生しなかった）ドキュメント同期を Step 単位で個別に記録する。
workflow-local 同期と global skill sync を別ブロックで記録する（FB-BEFORE-QUIT-003）。「該当なし」も明記する。

## 実装状況テーブル

| key | value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| 実装ファイル変更 | **実施済み**（19 ファイルの削除 / rename + `.github/workflows/*` env injection + aiworkflow 正本同期） |
| local screenshot | **該当なし**（NON_VISUAL・スクリーンショット不要） |
| commit / push / PR | 未実施（user-gated） |
| deploy（staging / production 再 deploy） | 未実施（user-gated・wrangler vars 反映に必要） |

## workflow-local 同期

| Step | 対象 | 変更 |
| --- | --- | --- |
| 1-A | `docs/30-workflows/completed-tasks/issue-1145-public-api-base-url-env-unification/index.md` | 既存（調査結果サマリ + scope + AC-1〜AC-9 + Phase 構成） |
| 1-A | 同 `outputs/phase-1/phase-1.md` 〜 `phase-3/phase-3.md` | 既存（要件 / 設計 / 設計レビュー） |
| 1-A | 同 `outputs/phase-12/*`（strict 7） | **新規作成**（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md） |
| 1-A | 同 `outputs/phase-12/phase-12.md` | **新規作成**（Phase 12 エントリ・main.md 導線） |
| 1-A | 同 `outputs/phase-13/phase-13.md` | **新規作成**（PR phase・user-gated・再 deploy 要否を明記） |
| 1-A | 同 `outputs/phase-11/*` | **該当なし**（NON_VISUAL・スクリーンショット不要） |
| 1-B | `index.md` frontmatter `status` | `implemented_local_evidence_captured`（実装・検証・正本同期完了） |
| 1-C | `docs/00-getting-started-manual/specs/design-tokens.md` | **該当なし**（env キー変更のみ・不変） |
| 1-C | `apps/web/src/styles/tokens.css` | **該当なし**（トークン定義不変） |
| 1-C | `CLAUDE.md` env 不変条件本文 | **該当なし（本文編集不要）**。旧キー削除は重複排除方向で整合・記載済みアクセサに変更なし（system-spec-update-summary §1-C） |

## global skill sync

| Step | 対象 | 変更 |
| --- | --- | --- |
| 2 | aiworkflow-requirements system spec（env/accessor contract） | current contract を `NEXT_PUBLIC_API_BASE_URL` 単一へ同期。旧 `PUBLIC_API_BASE_URL` / `getApiBaseEnv` / `ApiBaseEnv` は削除済みとして明記。 |
| 2 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` | implemented_local_evidence_captured workflow として探索導線を反映済み |
| 2 | `.claude/skills/aiworkflow-requirements/references/workflow-*-artifact-inventory.md` | `workflow-issue-1145-public-api-base-url-env-unification-artifact-inventory.md` 作成済み |
| 2 | `.claude/skills/*/SKILL.md` / changelog | **該当なし**。skill-feedback 候補 0 件（`skill-feedback-report.md`） |
| 2 | skill indexes（`indexes/*-map.md` / `keywords.json`） | `pnpm indexes:rebuild` で検証 |

## グローバル仕様への影響

| 観点 | 判定 |
| --- | --- |
| 公開 API / D1 / Google Form | 影響なし（不変） |
| design tokens / UI | 影響なし（NON_VISUAL・新規トークンなし） |
| 認証境界 / env アクセサ | 旧キー削除は重複排除方向で整合。`process.env.*` 直接参照を増やさない（AC-9） |
| Cloudflare Secrets / GitHub Variables | 影響なし（旧キーは非機密 `[vars]` 管理で Secret 不在。put/delete しない） |
| aiworkflow-requirements system spec | Step 2 実施済み（env/accessor contract 同期） |

## まとめ

本 wave のドキュメント変更は workflow-local の Phase 12 strict 7 + Phase 13 + Phase 12 エントリの新規作成、および
`index.md` の `implemented_local_evidence_captured` 整合。design-tokens.md・tokens.css・公開 API spec・CLAUDE.md 本文への反映は該当なし。
NON_VISUAL のためスクリーンショットは取得しない。git 操作・deploy・Issue mutation は user-gated。
