# Phase 3: 設計レビュー

## 目的

Phase 2 の設計（dismiss を merge と対称化して audit_log に記録する）が Phase 4（テスト作成）へ進めるかを、責務境界・状態所有権・4 条件・リスク・MINOR 指摘の観点で判定する。

---

## 1. 一次結論（4 条件評価）

| 条件 | 評価 | 根拠 |
| ---- | ---- | ---- |
| **価値性** | PASS | dismiss 操作が `/admin/audit` から追跡不可という監査ガバナンス上の欠落（CLAUDE.md #13）を解消する。管理者の「誰がいつ何を却下したか」を監査可能にし、merge との監査対称性を回復する。 |
| **実現性** | PASS | 変更は api 内の route + repository の 2 層のみ。新規 UI ゼロ・新規マイグレーションゼロ。merge の既存 `db.batch` パターンをそのまま踏襲でき、初回スコープに十分収まる。 |
| **整合性** | PASS | 依存方向（UI→route→repository→D1）が一方向で閉じる。`target_id` の意味を merge と統一し、責務境界（repository が atomicity と audit 記録を所有）が merge と同一層で矛盾しない。 |
| **運用性** | PASS | 既存 endpoint surface（パス・成功戻り値）不変のため後方互換。存在しない member は merge と同じ 404 surface に正規化する。`/admin/audit` UI の既存フィルタで運用可能。回帰テストで surface 維持を担保。 |

→ **4 条件すべて PASS**。

---

## 2. 責務境界レビュー

| 観点 | 判定 | コメント |
| ---- | ---- | -------- |
| repository が audit 記録を持つ妥当性 | ✅ 妥当 | merge（`mergeIdentities`）が既に同一層（repository）で `audit_log` INSERT を `db.batch` 内に持つ。dismiss も同じ層・同じパターンに揃えるのが整合的。route 層へ audit 記録を移すと merge と非対称になり責務が分散する。 |
| route の責務 | ✅ 妥当 | route は認証コンテキスト（`claims.sub` / `user.email`）を repository へ渡す薄い orchestration に徹する。merge endpoint と完全対称。 |
| atomicity の所有 | ✅ 妥当 | `db.batch` による「dismissals upsert + audit_log INSERT」のアトミック性は repository が所有。片方のみ commit される状態を構造的に排除。 |
| Error 定義位置 | ✅ 妥当 | `DismissAtomicBatchUnavailable` を `identity-conflict.ts` に置く（merge は `MergeAtomicBatchUnavailable` を identity-merge.ts に持つ対称配置）。 |

---

## 3. 状態所有権レビュー

| 状態 | 所有者 | 判定 |
| ---- | ------ | ---- |
| dismissal レコード（`identity_conflict_dismissals`） | repository / D1 | ✅ 既存どおり |
| 監査ログ（`audit_log`） | repository / D1（batch で同時 commit） | ✅ merge と同一所有 |
| actor 文脈（`actorAdminId` / `actorAdminEmail`） | route が認証から取得 → repository へ受け渡し | ✅ merge と対称 |
| reason の redact 責務 | repository（`redactIdentityReason` 適用） | ✅ 一貫（dismissals 列 + after_json 同一値） |

- 状態所有権の混在なし。`Facade`/`Service` 相当の層混在は発生しない。

---

## 4. リスク評価

| リスク | 深刻度 | 対策 | 残リスク |
| ------ | ------ | ---- | -------- |
| batch atomicity（環境差） | 中 | `typeof db.batch !== "function"` で `DismissAtomicBatchUnavailable` を throw（merge 同パターン）。テストで batch 非対応経路を検証（AC-5）。 | 低 |
| reason の PII 混入 | 中 | `redactIdentityReason()` を dismissals 列・after_json の両方に適用。redact 済み値のみ保存。テストで redact 反映を検証。 | 低 |
| `target_id` の意味不統一 | 中 | merge / dismiss ともに `target_id = target`（候補ターゲット member）で統一（§6）。`/admin/audit` の targetId フィルタで横断閲覧可能に。 | 低 |
| endpoint surface 破壊 | 中 | 成功戻り値 `{dismissedAt}`・パス不変。存在しない member は merge と同じ 404 `MEMBER_NOT_FOUND`。回帰テスト（AC-6）で担保。`actorAdminEmail` は repository 内部引数のみで surface 非露出。 | 低 |
| 引数順序変更による既存呼び出し漏れ | 低 | dismiss の呼び出し元は route 1 箇所のみ（grep 済み）。lane-A→lane-B 順依存で確実に追従。typecheck で検出。 | 低 |

- MAJOR リスクなし。すべて merge の既存パターン踏襲 + テスト担保で低残リスク化。

---

## 5. MINOR 指摘（未タスク候補化）

| ID | 指摘 | 判定 | 扱い |
| -- | ---- | ---- | ---- |
| MINOR-1 | `AuditLogPanel` に `identity.merge` / `identity.dismiss` のプリセット選択肢を追加すれば監査閲覧 UX が向上する | 根本解決に不要（自由入力フィルタで閲覧可能） | **Phase 12 未タスク候補**（スコープ外） |
| MINOR-2 | `audit_log` の `action` 値（`identity.merge` / `identity.dismiss` / `attendance.add`）を集約した型 union / 定数化があると将来のドリフト防止になる | 既存も文字列 brand 運用、本タスクで導入は過剰 | **Phase 12 未タスク候補**（任意） |
| MINOR-3 | `before_json` の field 名が merge / dismiss で揃うか | dismiss も `targetMemberId` を採用し、merge の payload shape と整合させる | 実装で反映 |

- MINOR-1 / MINOR-2 は Phase 12 の `unassigned-task-detection.md` で 0 件判定にせず未タスク候補として明示する。

---

## 6. Phase 4 へのゲート判定

| チェック項目 | 結果 |
| ------------ | ---- |
| 4 条件すべて PASS | ✅ |
| 責務境界が merge と同一層で閉じている | ✅ |
| 状態所有権の混在なし | ✅ |
| MAJOR リスクなし | ✅ |
| MINOR 指摘は未タスク候補化方針確定 | ✅ |
| 新シグネチャ・batch 構造・列マッピングが Phase 2 で確定 | ✅ |
| 既存命名規則（Phase 1）と整合 | ✅ |

### 判定: **PASS（Phase 4 へ進行可）**

- Phase 4 では次を RED テストとして設計する:
  1. dismiss 実行で `audit_log` に `action='identity.dismiss'` の 1 行が記録される（列マッピング検証）。
  2. dismissals upsert と audit_log INSERT のアトミック性（batch 経路）。
  3. `actorAdminEmail`（`user.email ?? null`）が `audit_log.actor_email` に反映される。
  4. `before_json` / `after_json`（audit_log payload に reason を含めない）構造検証。
  5. `db.batch` 非対応で `DismissAtomicBatchUnavailable` throw。
  6. 既存 endpoint surface（成功戻り値 `{dismissedAt}` / 404 `MEMBER_NOT_FOUND`）回帰。
- テストファイルは `*.spec.ts` / `*.contract.spec.ts` のみ（CLAUDE.md #8）。
