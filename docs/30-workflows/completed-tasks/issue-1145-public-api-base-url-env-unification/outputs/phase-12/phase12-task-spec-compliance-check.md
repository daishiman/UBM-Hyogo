> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — task-spec compliance check

メタ:

| key | value |
| --- | --- |
| workflow_id | `issue-1145-public-api-base-url-env-unification` |
| workflow_state | `implemented_local_evidence_captured` |
| issue | #1145（`CLOSED`） |
| implementation_mode | `new`（削除・rename 主体） |
| visualEvidence | NON_VISUAL |
| 判定 | **PASS** |

## 1. Summary verdict

本ワークフローは、同一 API base URL に対する 2 命名（`NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL`）併存を
解消する env 単一化リファクタリングの **実装仕様書**である。`implemented_local_evidence_captured` 時点で仕様書（index.md / Phase 1-13 /
Phase 12 strict-7）を整備し、実コード / 設定 / spec / GitHub Actions env injection / aiworkflow 正本同期を実施した。
commit・push・PR・staging+production 再 deploy・Issue mutation は user-gated として残す。Phase 1-3 の仕様アウトプット、Phase 12 strict 7 outputs、Phase 13、
changed-files 分類 / phase status / evidence inventory / same-wave sync / runtime 境界 / archive gate のいずれも
整合しており、総合判定は **PASS**。

## 2. Changed-files classification

本 wave では実コード・設定・spec・GitHub Actions env injection・aiworkflow 正本を同一サイクルで更新した。実装対象の主要 19 件
（index.md §2 正本）に加え、`.github/workflows/*` の旧キー注入も削除した。

| パス | 種別 | 分類 |
| --- | --- | --- |
| `apps/web/src/lib/env.ts` | 編集（削除） | source（schema / 型 / accessor から旧キー除去・`ApiBaseEnv` 型 + `getApiBaseEnv()` 削除） |
| `apps/web/src/lib/fetch/public.ts` | 編集（削除） | source（`?? env.PUBLIC_API_BASE_URL` 削除・コメント更新） |
| `apps/web/wrangler.toml` | 編集（削除） | config（`[vars]` 3 セクション削除） |
| `apps/web/.dev.vars.example` | 編集（削除） | config |
| `apps/web/playwright.config.ts` | 編集（削除） | config |
| `apps/web/playwright.admin-schema-diff.config.ts` | 編集（削除） | config |
| `apps/og/src/member-source.ts` | 編集（rename） | source（`OgEnv` + `fetchViaBaseUrl`） |
| `apps/og/wrangler.toml` | 編集（rename） | config（`[vars]` 3 セクション） |
| spec 群 11 ファイル（index.md §2.3） | 編集 | test（seed / assert / テスト名移行・`getApiBaseEnv` テスト 2 件削除） |

新規ファイル無し。新規 env キー・新規 accessor・新規 primitive・新規 OKLch トークン無し。公開 API / D1 / Google Form /
`tokens.css` / `design-tokens.md` 不変。

## 3. `workflow_state` and phase status consistency

| 項目 | 値 | 整合 |
| --- | --- | --- |
| `index.md` frontmatter `status` | `implemented_local_evidence_captured` | OK |
| `implementation_status` | `implemented_local_evidence_captured`（実コード・検証・正本同期完了） | OK |
| Phase 1-3 | completed（要件 / 設計 / 設計レビュー GO） | OK |
| Phase 4-11 | completed（実装・テスト・NON_VISUAL 代替証跡取得完了） | OK |
| Phase 12 | strict 7 作成 | OK |
| Phase 13 | `pending_user_approval`（PR / deploy / Issue mutation user-gated） | OK |

`implemented_local_evidence_captured` と各 Phase の status は矛盾なし。commit / push / PR / deploy / Issue mutation は完了扱いしていない。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| visual evidence (NON_VISUAL) | outputs/phase-11/manual-test-result.md | n/a |

本タスクは **NON_VISUAL**（env キーの削除 / rename のみで UI/UX/DOM/レイアウトに変更がない）ため、Phase 11
スクリーンショットは不要であり取得しない。NON_VISUAL 証跡は AC-7 / AC-2 の grep gate 0 件・typecheck / lint /
targeted vitest green（`implementation-guide.md` §2.6）で代替する。2026-06-08 に grep 0 件、web direct targeted 9 files / 79 tests PASS、og 6 files / 23 tests PASS、web typecheck/lint PASS、og typecheck PASS を確認した。`@ubm-hyogo/web` package 全体 test は今回変更外の既存 UI spec 2 件 red のため、本 Gate-B の主証跡には含めない。

## 5. Phase 12 strict 7 file inventory

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

strict 7 すべて present。加えて `outputs/phase-12/phase-12.md`（エントリ）/ `outputs/phase-13/phase-13.md`（PR phase）も present。

## 6. Skill/reference/system spec same-wave sync

| 対象 | 判定 |
| --- | --- |
| aiworkflow-requirements system spec（env contract / accessor contract） | `references/environment-variables.md` ほか current contract を `NEXT_PUBLIC_API_BASE_URL` 単一へ同期。旧 `PUBLIC_API_BASE_URL` / `getApiBaseEnv()` / `ApiBaseEnv` は削除済みとして明記 |
| aiworkflow-requirements workflow index / artifact inventory | implemented_local_evidence_captured workflow として `resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / artifact inventory へ反映 |
| `.claude/skills/*` SKILL changelog | skill-feedback 0 件のため変更なし |
| `CLAUDE.md` env 不変条件 | 本文編集不要（旧キー削除は重複排除方向で整合・記載済みアクセサに変更なし。`system-spec-update-summary.md` §1-C） |
| `design-tokens.md` / `tokens.css` | 該当なし（env 変更のみ・不変） |
| skill indexes 再生成 | `pnpm indexes:rebuild` で検証 |

公開 API / D1 / design token / CLAUDE.md 本文の正本変更は不要。

## 7. Runtime or user-gated boundary

以下は user の明示承認後にのみ実行（Phase 13）:

- commit・push・PR 作成（base=`dev`）
- staging 再 deploy・production 再 deploy（wrangler vars 変更の本番反映に必要・`scripts/cf.sh` 経由）
- Issue #1145 の状態確認・変更（再 OPEN / close コメント）

`implemented_local_evidence_captured` 時点では実装・ローカル検証・正本同期まで完了。GitHub 操作・deploy は Phase 13（`pending_user_approval`）に明記。

## 8. Archive/delete stale-reference gate

本ワークフローは `implemented_local_evidence_captured` であり、未タスク検出 0 件・Phase 12 完了条件充足のため
completed-tasks への lifecycle path move を実施済み（現 root: `docs/30-workflows/completed-tasks/issue-1145-public-api-base-url-env-unification/`）。
移動に伴い dir 内自己参照（artifacts.json ×2 / phase-12 strict 成果物）と skill 正本（task-workflow-active / artifact-inventory / quick-reference / resource-map）の
full-path 参照を completed-tasks パスへ書換済み。topic-map / keywords は `indexes:rebuild` で再生成。よって stale reference（旧 active root パス参照・dangling link）は残らない。
commit / PR / deploy / Issue mutation は引き続き user-gated。ファイル削除は行わない（消費元 unassigned spec は #1145 body backlink 保護のため tombstone 維持）。

## 9. Four-condition verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| ① 仕様充足 | PASS | AC-1〜AC-9 を実装・検証済み。apps/.github 旧キー grep 0 件、targeted tests と typecheck/lint PASS |
| ② strict 7 outputs 完備 | PASS | 7 ファイル present（§5） |
| ③ same-wave sync 整合 | PASS | aiworkflow env contract / workflow indexes / artifact inventory を同一 wave で更新（§6） |
| ④ runtime/user-gated 境界明確 | PASS | 実装・ローカル検証・正本同期は完了。commit / PR / deploy / Issue mutation のみ Phase 13 user-gated（§7） |

**総合判定: PASS**（`implemented_local_evidence_captured`・issue #1145 CLOSED・状態変更なし・NON_VISUAL）。
