# システム仕様反映サマリ: issue-1029 public member photo display

> **[実装区分: 実装仕様書]**。本 workflow は `implemented_local_runtime_pending`（実コード配線・ローカル focused test/typecheck・local visual evidence 完了、staging/R2 実 URL capture は user-gated）。本書はシステム仕様反映の現在事実を記録する。

---

## Step 1-A: 完了タスク記録

| 項目 | 値 |
|------|-----|
| タスク | issue-1029 public member photo display |
| 完了内容 | Phase 1-13 タスク仕様書 + Phase 12 strict 7 + apps/packages local implementation |
| workflow_state | `implemented_local_runtime_pending` |
| 完了日 | 2026-05-31 |
| code 変更 | あり（apps/ packages/ の public photoUrl 実装を反映） |
| GitHub Issue | #1029（CLOSED のまま・mutation 無し） |

本サイクルで shared/API/web の実装とローカル focused test/typecheck まで完了した。staging deploy、runtime screenshot、commit、push、PR は user-gated。

## Step 1-B: 実装状況テーブル

| サブ領域 | 状態 | 根拠 |
|---------|------|------|
| 写真公開ポリシー ADR（`16-member-photo-public-exposure.md`） | `implemented_local_runtime_pending` | 実体作成済み |
| `PublicMemberListItemZ` / `PublicMemberProfileZ` photoUrl 追加 | `implemented_local_runtime_pending` | 実コード配線済み。list/profile とも余分キー reject をテスト |
| `listMemberPhotosByIds` batch helper | `implemented_local_runtime_pending` | 実コード配線済み。batch helper test PASS |
| route R2 env 配線 + presign resolver | `implemented_local_runtime_pending` | public route contract test PASS |
| use-case resolver DI | `implemented_local_runtime_pending` | list/profile use-case focused tests PASS |
| UI Avatar src 配線 | `implemented_local_runtime_pending` | MemberCard/ProfileHero component tests PASS |
| test（schema / matrix / fail-soft / UI fallback） | `implemented_local_runtime_pending` | focused Vitest + route contract + typecheck PASS |

> workflow 全体の `workflow_state` は `implemented_local_runtime_pending`。local Playwright screenshot は取得済み。staging/R2 実 URL capture だけ Gate-C user-gated として残る。

## Step 1-C: 関連タスク

| 関連タスク | 状態 | 関係 |
|-----------|------|------|
| #983（admin member photo + R2 storage） | **完了**（landed・commit `ae773ba38` / migration `0022_member_photos.sql`） | upstream。`member_photos` / `presignMemberPhotoGetUrl` / `Avatar src?` を再利用 |
| #983-followup-001（member self-photo upload） | 別タスク（未着手・本 task スコープ外） | self-upload は #983 invariant で分離 |
| #983-followup-003（member photo transcode/resize） | 別タスク（未着手・本 task スコープ外） | transcode/resize は #983 invariant で分離 |

## Step 2: 新規インターフェース追加（api-endpoints 反映）

本 task は public list/profile contract に新規 optional フィールド `photoUrl: z.string().url().optional()` を追加した。aiworkflow-requirements には `implemented_local_runtime_pending` の implemented contract として反映済み。

### ブロック A: workflow-local 同期（本サイクルで完了）

- `index.md` / `phase-1.md` / `phase-2.md` の成果物インベントリと契約設計に public `photoUrl` を記載済み。
- `outputs/phase-1/spec-extraction-map.md` の baseline から実装済み状態へ Phase 12 で昇格済み。
- `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` を作成済み。

### ブロック B: global skill sync（本サイクルで implemented として反映済み）

- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` の public member contract に implemented optional `photoUrl?` と写真公開 gate を反映済み。
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / artifact inventory / changelog / LOGS に `issue-1029` を登録済み。
- 実コード差分と test evidence は `outputs/phase-11/evidence/` と `outputs/phase-12/implementation-execution-record.md` に記録済み。

> [Feedback BEFORE-QUIT-003] に従い、workflow-local 同期（ブロック A）と global skill sync（ブロック B）を別ブロックで記録した。local visual evidence は取得済みで、staging/R2 実 URL capture は user-gated に行う。
