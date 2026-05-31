# Phase 8: リファクタリング

**[実装区分: 実装仕様書]**

Issue #987（dismiss を merge と対称化し `audit_log` に `action='identity.dismiss'` を記録する根本解決）における、構造改善・重複排除・抽象化判断の仕様。本サイクルは API repository / route の監査記録追加に閉じ、UI 新規実装ゼロ・新規 migration なしを維持する。リファクタリングは「実装で生じる変更の構造化」と「過剰抽象化の回避判断」に絞り、最小差分を正とする。

---

## 1. 変更内容（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `apps/api/src/repository/identity-conflict.ts` `dismissIdentityConflict()` | `identity_conflict_dismissals` への単一 `prepare().bind().run()`（1 statement）。`audit_log` 未記録。引数は `(c, source, target, actorAdminId, reason)` | `db.batch([...])` による 2-statement アトミック実行（`identity_conflict_dismissals` INSERT + `audit_log` INSERT）。`actorAdminEmail` 引数を追加し署名を `(c, source, target, actorAdminId, actorAdminEmail, reason)` に拡張 | merge（`identity-merge.ts`）と対称化し、dismiss を `/admin/audit` から時系列追跡可能にする。dismissals 行と audit_log 行の整合性を batch でアトミック保証 |
| 同上（batch 不可時の失敗系） | 例外型なし（単一 run のため batch 非依存） | `DismissAtomicBatchUnavailable` を新設し、`typeof db.batch !== "function"` のとき throw（merge の `MergeAtomicBatchUnavailable` と対称） | テスト環境・将来の D1 driver 差異で batch 未提供のときに silent partial write を防ぐ fail-fast |
| 同上（audit_log payload 整形） | なし | `before_json = {sourceMemberId, targetMemberId}` / `after_json = {dismissalId, dismissedAt}` を JSON 文字列化して bind。`action='identity.dismiss'`, `target_type='member'`, `target_id=target`, `actor_email = actorAdminEmail ?? null` | merge の audit payload 形（`sourceMemberId` / `targetMemberId` を持つ JSON 列）と一貫させ、`/admin/audit` の既存パーサで読めるようにする。reason は既存 `redactIdentityReason()` で dismissal table に保存するが、audit_log payload には入れず PII 混入リスクを避ける |
| `apps/api/src/routes/admin/identity-conflicts.ts` dismiss endpoint | repository へ `actorAdminEmail` を渡していない（merge endpoint は `user.email ?? null` を渡す） | dismiss 呼び出しに `user.email ?? null` を追加配線（merge endpoint と同じ式） | actor_email を audit_log に残すため。route の外形（path / 戻り値 `{ dismissedAt }` / status code）は不変 |

> 既存の `redactIdentityReason()` は `identity-conflict.ts` 内で dismissal reason 保存に使用する。audit_log は dismissal metadata のみに限定し、reason 生値を payload に入れない（新規ユーティリティを作らない）。

---

## 2. merge / dismiss の audit_log INSERT 共通化判断

### 共通化候補
両者は `audit_log` に対して `(audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)` の 9 列 INSERT を行う点が共通。「`audit_log` INSERT 用の prepared statement を生成するヘルパ（例: `buildAuditLogInsert(db, payload)`）」を抽出する余地はある。

### 本サイクルの判断: **共通化は見送る（最小に留める）**

| 観点 | 内容 |
| --- | --- |
| batch 構造の非対称 | merge は 3-statement batch（`identity_aliases` + `identity_merge_audit` + `audit_log`）、dismiss は 2-statement batch（`identity_conflict_dismissals` + `audit_log`）。batch 全体を共通化することは形が異なり不可。共通化できるのは `audit_log` の 1 statement のみ |
| 抽象化コスト | 1 statement のためにヘルパを跨ぐと、bind 引数の順序・型（`AdminId` / `AdminEmail` / `AuditAction` の cast）を引数で受け渡す薄いラッパになり、可読性向上が小さい一方で 2 ファイル間の結合を生む |
| 最小差分原則 | 本タスクの目的は「dismiss を audit_log に記録する」一点。merge は既に正しく動作中であり、merge 側へ触れる変更（共通ヘルパ導入）は回帰リスクのみ増やす |
| 結論 | 本サイクルでは共通化しない。dismiss 側で merge の `audit_log` INSERT 列順・cast をコピーして揃える（コードの形を merge に合わせることで「読めば対称」と分かる状態を担保） |

### 未タスク候補化の可否
「`audit_log` INSERT ヘルパ抽出（merge / dismiss / 将来の identity.* 操作の DRY 化）」は **未タスク候補にしない**。理由: (1) 現状 2 箇所のみで DRY 化の閾値（3 箇所以上の重複）に達していない、(2) batch 全体は共通化不可で効果が `audit_log` 1 行に限定される、(3) 将来 identity.* 操作が増えた時点で再評価すべき投機的抽象化。Phase 12 の未タスク検出では「観測された重複が 2 箇所のみ・効果限定」を根拠に no-op と記録する。

---

## 3. navigation drift / duplicate 確認

| 確認項目 | 判定 | 根拠 |
| --- | --- | --- |
| route surface 重複 | なし | dismiss endpoint（`POST /admin/identity-conflicts/:id/dismiss`）は既存 1 箇所のみ。新規 route 追加なし |
| audit action 名重複 | なし | `action='identity.dismiss'` は新規 literal。既存 `identity.merge` と衝突しない。`AuditAction` 型 union に `identity.dismiss` が含まれるか（Phase 3/4 で型定義済）を typecheck で担保 |
| UI 画面の重複・ナビゲーション drift | 該当なし | UI 変更ゼロ。`/admin/audit` は既存。新規画面・新規リンク追加なし |
| repository 関数の重複定義 | なし | `dismissIdentityConflict()` は 1 定義のみを拡張。並行する別実装を生やさない |
| 例外型の重複 | なし | `DismissAtomicBatchUnavailable` は新規。`MergeAtomicBatchUnavailable` とは別クラス（対称命名だが別 import） |

---

## 4. DoD

- [x] `dismissIdentityConflict()` が `db.batch` 2-statement（dismissals + audit_log）に再構成されている
- [x] `actorAdminEmail` 引数が追加され、route から `user.email ?? null` が配線されている
- [x] `DismissAtomicBatchUnavailable` が新設され batch 不可時に throw する
- [x] audit_log の列順・cast が merge（`identity-merge.ts`）と対称な形になっている
- [x] `audit_log` INSERT 共通ヘルパは導入していない（最小差分判断を本ファイルに記録済み）
- [x] navigation drift / duplicate がないことを本ファイルで確認済み
- [x] route 外形（path / 成功戻り値）は不変。存在しない member は merge と同じ 404 `MEMBER_NOT_FOUND` に正規化済み

---

## 5. 参照

- 前段: `outputs/phase-3/phase-3.md`（データモデル / audit_log 列定義）、`outputs/phase-4/phase-4.md`（contract spec）、`outputs/phase-6/phase-6.md`（実装詳細）
- 後段: `outputs/phase-9/phase-9.md`（品質保証一括判定）、`outputs/phase-10/phase-10.md`（最終レビュー）
- 対比実装: `apps/api/src/repository/identity-merge.ts:119-167`（merge の 3-statement batch）
