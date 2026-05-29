# Issue #958 — H3 公開フィルタ UX 改修

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | issue-958-h3-public-filter-ux |
| 親 workflow | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` (Spec-A 完了済) |
| 元 unassigned-task spec | `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-003-h3-public-filter-ux.md` |
| GitHub Issue | [#958](https://github.com/daishiman/UBM-Hyogo/issues/958) (CLOSED, Refs 運用) |
| ブランチ | `feat/issue-958-h3-public-filter-ux`（dev 起点） |
| 優先度 | medium |
| 規模 | medium |
| 実装区分 | 実装 |
| implementation_mode | `new` |
| screenshot mode | VISUAL（profile / public members / admin の3面）|
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implemented_local_runtime_pending` |
| implementation_state | `implemented_local` |
| ステータス | `implemented_local_runtime_pending / implementation / VISUAL / focused tests passed / local static visual present / staging visual pending` |

## なぜ docs-only ではなく実装仕様書か（CONST_004 根拠）

元 unassigned-task spec §1.2 / §2.1 / §2.3 は明確に **コード変更を必要とする UX 改修**:

- 「`publicConsent=false` の修正導線が UI に存在せず」「admin 側に一括 republish flow が無く」「public members 一覧が空の状態が来訪ユーザに『会員が存在しない / サイトが壊れている』と誤認させる」
- ゴールは「profile から publicConsent 状態を確認できる」「admin から一括 publish / republish 操作が可能」「`allHiddenByPublishState === false`」

これは設計合意・調査では解決できない。よってラベルが docs-only でも実装仕様書として作成（プロンプト CONST_004）。

## スコープ

### 含む（3 Track 並列実装可能）

| Track | 領域 | 変更面 | 主要 surface |
|-------|------|--------|------------|
| A | profile（会員） | `apps/web/app/(member)/profile/` | `PublicConsentCallout.tsx`（新規） / `page.tsx`（mount） |
| B | admin（バックオフィス） | `apps/web/src/components/admin/` + `apps/web/src/features/admin/` | `BulkRepublishDrawer.tsx`（新規） / `useBulkRepublish.ts`（新規） / `MembersClientShell.tsx`（既存 mount） |
| C | public（来訪者） | `apps/web/src/components/public/` + `apps/web/app/(public)/members/page.tsx` | `AllHiddenFallback.tsx`（新規） / `page.tsx`（fetch 追加 + 分岐） |

### 含まない

- `publicConsent` を直接 mutate する self-service mutation endpoint の新設（invariant #1 / CLAUDE.md #7 違反）
- D1 schema 変更（invariant #4）
- Google Form 仕様の変更
- `publishState` 既存 self-request flow（`/me/visibility-request`）の改修 → 既存 `RequestActionPanel.tsx` で完結済、本タスク対象外

## 不変条件（全 Phase で順守）

| ID | 条件 | 根拠 |
|----|------|------|
| INV-1 | 既存 API endpoint surface のみ利用、新 endpoint 追加禁止 | 元 spec §不変条件 / SCOPE.md |
| INV-2 | OKLch トークン正本化（`apps/web/src/styles/tokens.css`）、HEX 直書き禁止 | CLAUDE.md UI prototype alignment §不変条件 2 |
| INV-3 | D1 直接アクセス禁止（`apps/web` から D1 binding 禁止） | CLAUDE.md §重要な不変条件 5 |
| INV-4 | MVP では Google Form 再回答が `publicConsent` の正式更新経路 | CLAUDE.md §重要な不変条件 7 |
| INV-5 | テストファイルは `*.spec.{ts,tsx}` のみ | CLAUDE.md §重要な不変条件 8 |
| INV-6 | admin form input は `FormField` 経由、`apps/web/src/components/admin/` 直接 `<input>` 禁止 | CLAUDE.md §重要な不変条件 9 |
| INV-7 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | CLAUDE.md §重要な不変条件 10 |

## INV-4 reconcile 戦略（Track A の根幹設計）

`publicConsent` 状態の更新経路:

1. **正規経路**: Google Form 再回答 → `responses-sync` バッチ → `members.public_consent` 更新（既存）
2. **本タスクで追加**: profile に **状態可視化 + responderUrl への誘導 CTA**（mutation API は追加しない）

会員自身が toggle で直接書き換える経路は追加しない。CTA は「Google Form を開く」リンクのみ（既存 `editResponseUrl` / `responderUrl` 解決ロジックを再利用）。

## 受入条件 (Acceptance Criteria)

| ID | 条件 | 検証方法 |
|----|------|---------|
| AC-1 | profile に `publicConsent` 状態カードが表示される（consented / declined / unknown 全状態） | Phase 4 component spec + Phase 11 screenshot |
| AC-2 | `publicConsent !== "consented"` のとき Google Form CTA リンクが表示され、`href` が `responderUrl` または `editResponseUrl` を指す | Phase 4 component spec |
| AC-3 | admin `/admin/members` で hidden / member_only の member を選択し、一括 `public` 化できる | Phase 4 hook spec + Phase 11 manual |
| AC-4 | bulk 操作は 1 member ごとに既存 `PATCH /admin/members/:memberId/status` を呼び、進捗（成功/失敗件数）を表示する | Phase 4 hook spec |
| AC-5 | `/public/members?` で `publicMemberCount === 0 && memberCount > 0` のとき `AllHiddenFallback` が表示され、再公開を促す文言とログインリンクが出る | Phase 4 page spec + Phase 11 screenshot |
| AC-6 | 検索フィルタによる empty（`pagination.total === 0` だが `memberCount === 0` でない、かつ `q` 等の query あり）は従来の `EmptyState` を維持 | Phase 4 page spec |
| AC-7 | 全ての色は OKLch トークン経由、`verify-design-tokens` が pass | Phase 9 lint + Phase 7 |
| AC-8 | 新 endpoint なし（diff で `apps/api/src/routes/` に変更なし） | Phase 9 grep |
| AC-9 | typecheck / lint / vitest（追加 spec）green、`verify-pr-ready.sh` pass | Phase 7 / Phase 9 |

## 1 サイクル完了スコープ（CONST_005 適合性）

3 Track は **互いに独立** で並列実装可能。コード行数見積:

| Track | 追加 LOC | 影響 LOC | 既存依存 |
|-------|---------|---------|----------|
| A | ~180 | ~30（`page.tsx` mount） | `Callout` / `STABLE_KEY` / `responderUrl` |
| B | ~280 | ~60（list client mount） | `useAdminMutation` / `FormField` / 既存 PATCH endpoint |
| C | ~150 | ~25（`page.tsx` fetch 並列化） | `getPublicStats` API wrapper / `Callout` |

合計 ~700 LOC + tests。1 サイクル内完了に収まる。先送りタスクなし。

## 状態境界（skill 準拠）

この workflow は **ローカル実装と正本同期まで完了**している。focused Vitest は 4 files / 11 tests PASS。Phase 11 local static screenshots は 10 枚保存済み。staging verification・commit / push / PR は未実行であり、PASS とは主張しない。

| レイヤ | 状態 |
|--------|------|
| workflow root | `implemented_local_runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation | `implemented_local` |
| Phase 11 | `local_static_visual_present_staging_pending` |
| Phase 12 strict 7 | `outputs/phase-12/` に同期証跡として物理配置済み |

この境界により、実コード差分の truthfulness と aiworkflow-requirements の正本索引同期を両立する。

## Phase 一覧

| Phase | ファイル | 状態 |
|-------|---------|------|
| 1 | [phase-01-requirements.md](phase-01-requirements.md) | completed |
| 2 | [phase-02-design.md](phase-02-design.md) | completed |
| 3 | [phase-03-design-review.md](phase-03-design-review.md) | completed |
| 4 | [phase-04-test-design.md](phase-04-test-design.md) | completed |
| 5 | [phase-05-implementation.md](phase-05-implementation.md) | completed |
| 6 | [phase-06-test-expansion.md](phase-06-test-expansion.md) | completed |
| 7 | [phase-07-coverage.md](phase-07-coverage.md) | completed |
| 8 | [phase-08-refactor.md](phase-08-refactor.md) | completed |
| 9 | [phase-09-qa.md](phase-09-qa.md) | completed |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | completed |
| 11 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | runtime_pending |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | completed |
| 13 | [phase-13-pr.md](phase-13-pr.md) | spec_created |

## 参照

- 親 workflow: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/`
- 元 unassigned-task: `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-003-h3-public-filter-ux.md`
- CLAUDE.md §重要な不変条件 / §UI prototype alignment
- `docs/00-getting-started-manual/specs/00-overview.md` / `01-api-schema.md` / `13-mvp-auth.md`
- `apps/api/src/routes/me/services.ts` `resolveEditResponseUrl`
- `apps/api/src/routes/admin/member-status.ts` `PATCH /admin/members/:memberId/status`
- `apps/api/src/use-cases/public/get-public-stats.ts`
- `apps/web/app/(member)/profile/_components/RequestActionPanel.tsx`（既存・本タスク変更なし）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-958-h3-public-filter-ux-artifact-inventory.md`
