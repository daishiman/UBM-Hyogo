> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — 検証サマリ（strict 7 outputs）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## メタ情報

| key | value |
| --- | --- |
| workflow_id | `issue-1145-public-api-base-url-env-unification` |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_mode | `new`（削除・rename 主体） |
| visualEvidence | NON_VISUAL（UI/UX 変更なし） |
| issue | #1145（`CLOSED`・状態変更しない） |
| 検証判定 | **PASS（実装・ローカル検証・strict 7・正本同期完了）** |
| package | `@ubm-hyogo/web` / `@ubm-hyogo/og` |

## サマリ判定

本ワークフローは、同一 API base URL に対する 2 命名（`NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL`）の併存を
解消する env 単一化リファクタリングの **実装仕様書**である。`implemented_local_evidence_captured` 時点で、実コード 19 ファイルの削除 / rename、`.github/workflows/*` env injection、targeted tests、typecheck/lint、aiworkflow 正本同期を完了した。commit・PR・staging/production 再 deploy・Issue mutation は **user-gated**。

挙動（base URL 値・解決優先順位・transport 選択）は不変。本タスクは値の付け替えではなく **重複命名の除去 / rename**
であり、UI/UX への影響はない（NON_VISUAL）。

## 変更ファイル（19 ファイル + GitHub Actions env injection）

index.md §2 の表を正本とする。要約:

| 層 | 数 | 種別 |
| --- | --- | --- |
| apps/web プロダクション / 設定 | 6 | env.ts / fetch/public.ts / wrangler.toml / .dev.vars.example / playwright.config.ts / playwright.admin-schema-diff.config.ts |
| apps/og プロダクション / 設定 | 2 | src/member-source.ts / wrangler.toml（**rename**） |
| spec 群 | 11 | seed / assert / テスト名を `NEXT_PUBLIC_API_BASE_URL` へ移行 |

- apps/web: 旧 `PUBLIC_API_BASE_URL` を **削除**。`getApiBaseEnv()` 関数と `ApiBaseEnv` 型も**削除**（production consumer 0 件）。
- apps/og: 単一キー運用のため **削除でなく rename**（`PUBLIC_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL`）。
- 保持する識別子: `NEXT_PUBLIC_API_BASE_URL` / `getPublicFetchEnv` / `PublicFetchEnv` / `OgEnv` / `fetchViaBaseUrl` / `fetchMemberSummary`。

新規ファイル無し。新規 env キー・新規 accessor・新規 primitive を増やさない。

## 検証観点の要旨

- **Four-condition verdict**: ① 仕様充足（AC-1〜AC-9 が Phase 1-11 で定義済み）② strict 7 outputs 完備
  ③ same-wave skill/spec sync を判定（CLAUDE.md env 不変条件への影響を記録）④ runtime/user-gated 境界が明確。
  詳細は `phase12-task-spec-compliance-check.md` 参照。
- **未タスク検出**: current 0 件（`unassigned-task-detection.md`）。全 19 ファイル + `.github/workflows/*` env injection を今回サイクルで完了。
- **skill feedback**: 候補 0 件（`skill-feedback-report.md`）。学び（CLOSED issue の現行コード最適化フロー / apps/og 編入の scope 拡大判断）は記録。

## 視覚証跡

本タスクは **NON_VISUAL**（env キー削除 / rename のみで UI/UX 変更なし）のため、**Phase 11 スクリーンショットは不要**。
詳細は `implementation-guide.md` の `## 視覚証跡` を参照。

## 後続（user-gated）

commit・push・PR（base=`dev`）・staging+production 再 deploy・Issue #1145 状態確認は、ユーザーの明示承認後にのみ実行する
（Phase 13 = `pending_user_approval`）。
