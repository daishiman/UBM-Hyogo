**[実装区分: 実装仕様書 / 状態: spec_created]**

# System spec update summary

issue #872 [FU-LOGIN-001] が正本仕様 (`docs/00-getting-started-manual/specs/`) と関連 ledger に与える影響を Step 1-A / 1-B / 1-C / Step 2 の単位で記録する。

## Step 1-A: 完了タスク記録

| ledger | 反映内容 | 反映先 |
|--------|---------|--------|
| `docs/30-workflows/LOGS.md` | 1 行追記: `issue-872-google-brand-4tone-icon-and-tokens-exempt — FU-LOGIN-001 consumed / 4-tone GoogleBrandIcon + verify-design-tokens brandIconExemptPaths` | LOGS top |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 1 行追記 | changelog top |

## Step 1-B: 実装状況テーブル

| workflow_id | spec 状態 | 実装状態 |
|-------------|-----------|----------|
| `issue-872-google-brand-4tone-icon-and-tokens-exempt` | `spec_created` (本仕様書時点) | 未着手 |

実装完了後は `implemented_local_visual_evidence_captured` へ更新し、`artifacts.json#workflow_state` / `outputs/phase-12/phase-12.md` / `phase12-task-spec-compliance-check.md` の 3 箇所を同 wave で同期。

## Step 1-C: 関連タスク (FU-LOGIN-001 consumed)

| 関連 task | 関係性 | 反映 |
|-----------|--------|------|
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` (親 workflow) | FU-LOGIN-001 の発行元 | `outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-001 行に `consumed (issue-872)` 表記追加 |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | 切り出した unassigned-task spec | `status: consumed` + `canonical_workflow: docs/30-workflows/issue-872-.../` を frontmatter / 本文に追加 |
| issue #872 (GitHub) | recipient issue | CLOSED 維持。PR 本文は `Refs #872` |

## Step 2: 影響する正本 spec

| spec file | 影響 | 更新要否 | 反映内容 |
|-----------|------|---------|---------|
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | brand-asset exempt の仕組みを追加する必要 | **更新必須** | 新章 `## Brand-asset exempt` (path-glob exempt の対象範囲 / 2 層 exempt 設計 / 追加方針 / OKLch 不変条件への影響範囲) |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | /login UI の Magic Link + Google ghost 構造は不変。OAuth button 内のアイコン source が `Icon` → `GoogleBrandIcon` に変わるのみ | 任意更新 (本 task では touch しない) | n/a |
| `docs/00-getting-started-manual/specs/02-auth.md` | Auth.js 経路 / OAuth provider 列は不変 | 不要 | n/a |
| `docs/00-getting-started-manual/specs/00-overview.md` | 機能数・スコープ不変 | 不要 | n/a |

### 新規 interface の system spec 反映必要性判定

| 新規 interface | system spec 反映 | 根拠 |
|----------------|------------------|------|
| `GoogleBrandIcon` component (`apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx`) | **不要** (`09b-design-tokens.md` の brand-asset exempt 章で「brand-icons/ 配下に置く」と原則記述するだけで、個別 component 名は spec に書かない方針) | spec はコンポーネント名の列挙場所ではない。具体は code / inventory が正本 |
| `brandIconExemptPaths` (`scripts/verify-design-tokens.ts` の DEFAULTS) | **必要** (`09b-design-tokens.md` の新章で path-glob exempt の対象範囲を明記) | exempt rule は token policy の正本仕様の一部 |
| `brandTokenPrefixes` (`scripts/verify-design-tokens.ts`, reserved) | **必要** (同章で「reserved / 未使用」を明記) | 将来拡張点を spec に記録 |

## aiworkflow-requirements skill への影響

- `docs/30-workflows/LOGS.md` に本ワークフロー root を 1 行追加
- `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md}` に本 workflow を追記
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` と artifact inventory に本 workflow を追記
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に entry 追加
- generated index (`topic-map.md` / `keywords.json`) は必要時に `mise exec -- pnpm indexes:rebuild` で drift を確認

## 不変条件への影響

- CLAUDE.md「重要な不変条件」 #2 (OKLch token 正本) は本 task で初めて例外を導入する。例外スコープは `apps/web/src/components/ui/brand-icons/*.svg` に限定し、`verify-design-tokens` の path-glob filter で表現
- 他不変条件 (#1 schema 固定回避 / #3 responseEmail / #5 D1 直接禁止 等) は影響なし

## 次 Phase への引き継ぎ

Step 1-A〜1-C と Step 2 の反映は実装と同一 PR (Phase 13) 内で diff 適用する。`indexes:rebuild` drift は同 wave 内で commit。
