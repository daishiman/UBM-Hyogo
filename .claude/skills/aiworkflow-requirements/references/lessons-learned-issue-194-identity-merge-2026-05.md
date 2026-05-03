# Lessons Learned — Issue #194 EMAIL_CONFLICT identity merge follow-up（2026-05-03）

> task: `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/`
> 関連 spec: `docs/00-getting-started-manual/specs/01-api-schema.md`（§Admin Identity Conflicts）/
> `docs/00-getting-started-manual/specs/08-free-database.md`（§identity_merge_audit / identity_aliases / identity_conflict_dismissals）/
> `docs/00-getting-started-manual/specs/11-admin-management.md`（§identity merge 節）
> 関連 LOGS: 2026-05-03 entry
> 関連 changelog: `changelog/20260503-issue-194-identity-merge.md`

## 教訓一覧

### L-IDENT-001: merge は **raw response を移動しない alias-only canonical 解決**
- **背景**: 「EMAIL_CONFLICT で同一人物の重複候補が出たら統合する」と聞くと、つい source の `member_responses` 行を target に書き換えたくなる。しかし不変条件 #11（管理者も本文を編集しない）と invariant #1（実フォーム schema をコードに固定しすぎない）を破る。
- **教訓**: merge 操作は次の 3 表のみを更新する atomic 単一 D1 batch とする。
  1. `identity_aliases (source_member_id PK, target_member_id, merged_at, merged_by, reason_redacted)` を upsert
  2. `identity_merge_audit` に 1 行 INSERT（auditId / source / target / reason_redacted / actor）
  3. `audit_log` に 1 行 INSERT（admin 操作トレースとして）
- 公開 / admin の表示側は `resolveCanonicalMemberId(memberId)` を経由して archived source を除外するだけで、過去 response 本文・status・tags は不変。
- **適用**: 今後の identity 統合系操作（同一人物の電話統合、SNS account 統合等）も alias 解決方式を踏襲する。物理 merge は禁止。

### L-IDENT-002: 候補抽出は **第一段階のみ confidence-100% で固定**（自動化と手動の境界）
- **背景**: 重複検出ロジックを最初から「電話一致 / 表記揺れ吸収 / fuzzy match」まで広げたくなるが、誤 merge が起きると不変条件 #11 違反のリカバリが困難になる。
- **教訓**: 第一段階は `name` exact match AND `affiliation` exact match（trim + NFKC 正規化のみ許容）に限定する。phone match や fuzzy は **scope out**（自動化はせず admin 目視に任せる）。`detectConflictCandidates()` (`apps/api/src/services/admin/identity-conflict-detector.ts:35`) はこの境界を構造的に守る。
- **適用**: 第二段階を後追いするなら新規 task として spec を切る。判定基準を expand する PR は admin UI の二段階確認 + dismiss 経路が稼働している実績が前提。

### L-IDENT-003: PII redaction は **入力時に永続化前 redact、表示時に都度 mask** の二段構え
- **背景**: merge `reason` / dismiss `reason` には admin が「同じ電話番号のため」「メール末尾だけ違う」等と書いてしまう余地があり、`identity_merge_audit.reason_redacted` に email / phone がそのまま残ると invariant #3（responseEmail は system field）と PII 最小化が崩れる。
- **教訓**:
  - 永続化前: `redactIdentityReason()` で email / phone を `[redacted]` に置換してから INSERT する（reason 上限 500 文字）。
  - 表示時: `maskResponseEmail()`（`先頭1文字 + "***" + "@" + domain`）を view-model 直前で適用する。
- **適用**: admin 入力 textarea を持つ全ての endpoint（dismiss / merge / 将来の note 系）でこの二段構えを既定とする。redact 関数を service 層に集約し、route 層で素通り INSERT させない。

### L-IDENT-004: `identity_conflict_dismissals` は **PK = `(source_member_id, target_member_id)` の upsert**
- **背景**: 「別人マーク（dismiss）」を log 形式で append すると、同じペアを何度 dismiss しても候補一覧に再出現してしまう（unique 制約がないため）。
- **教訓**: dismiss テーブルは `(source_member_id, target_member_id)` を PK とし、`reason / dismissed_by / dismissed_at` を UPSERT で更新する。`listIdentityConflicts()` は左外部結合でこのテーブルにヒットした候補を除外する。
- **適用**: 「再検出から除外する」系の管理操作は基本 upsert PK 設計（log 追記ではなく state の現在値を持つ）。

### L-IDENT-005: 取消 UI は **scope out**、リカバリは runbook で SQL 構築
- **背景**: 誤 merge を UI で「戻す」操作を提供すると、`identity_aliases` を消すだけでは `identity_merge_audit` との整合が崩れ、再 merge も走らせると audit が二重化する。
- **教訓**: 取消 UI を提供せず、`outputs/phase-12/implementation-guide.md` Part 3 の runbook に従って `identity_aliases` 削除 + `identity_merge_audit` に reverse 行 INSERT + `audit_log` に operator note INSERT を **手動 SQL の単一 batch** で実行する。MVP は誤 merge の検知 → 通知 → runbook 実行までを admin の責務とする。
- **適用**: 高リスク操作の取消は UI ではなく runbook で閉じる。runbook 化のときに `audit_log` に reverse トレースを残す規約を明示すること。

### L-IDENT-006: cursor pagination は **`(submittedAt DESC, memberId ASC)` の複合キー**
- **背景**: `listIdentityConflicts()` で source 側の `last_submitted_at` のみで cursor を切ると、同一秒で複数候補が発生したときにページ境界で重複 / 取りこぼしが起きる。03b の sync ledger と同じ罠。
- **教訓**: cursor を `(last_submitted_at, source_member_id)` の複合キーとし、SQL 側は `ORDER BY last_submitted_at DESC, source_member_id ASC` で固定する。03b sync の `(submittedAt DESC, responseId DESC)` パターンを admin list にも踏襲。
- **適用**: 監査・ledger・候補リスト系の cursor pagination は **時刻 + 一意 ID の複合キー** を既定とする。単一時刻 cursor は禁止。

## skill-feedback 申し送り

- S-IDENT-1: `task-specification-creator` skill に「PII を含む text 入力 endpoint は redact-on-write + mask-on-read」を必須チェックリスト化する候補（L-IDENT-003 由来）。
- S-IDENT-2: `task-specification-creator` skill の Phase 12 strict 7 / artifacts.json parity チェックを今後も継続。本タスクは `phase12-task-spec-compliance-check.md` を strict 7 の 7 番目として配置することで compliance を構造化できた。

## 確認パス

- `apps/api/src/repository/identity-merge.ts:78` `mergeIdentities()` — alias-only batch 実装
- `apps/api/src/repository/identity-merge.ts:165` `resolveCanonicalMemberId()` — 表示境界
- `apps/api/src/services/admin/identity-conflict-detector.ts:35` `detectConflictCandidates()` — 第一段階判定
- `apps/api/src/repository/identity-conflict.ts:80` `listIdentityConflicts()` — cursor pagination
- `apps/api/src/repository/identity-conflict.ts:174` `dismissIdentityConflict()` — upsert
- `apps/api/migrations/0010_identity_merge_audit.sql` / `0011_identity_aliases.sql` / `0012_identity_conflict_dismissals.sql`
- `packages/shared/src/schemas/identity-conflict.ts` — `MergeIdentityRequest/Response`, `maskResponseEmail`
