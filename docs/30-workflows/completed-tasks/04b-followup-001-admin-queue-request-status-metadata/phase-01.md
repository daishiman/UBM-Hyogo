# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

`admin_member_notes.request_status` の値域・遷移・本人再申請可否・partial index 範囲・backfill 範囲を確定し、不変条件 #4 / #5 / #11 を破らない最小スキーマ拡張の責務範囲を Phase 2 設計へ handoff する。`hasPendingRequest` の判定ロジック移行（最新行存在 → `request_status='pending'`）の境界を AC 化する。

## 実行タスク

1. 現状コード確認（`apps/api/migrations/0006_admin_member_notes_type.sql`、`apps/api/src/repository/adminNotes.ts`、`routes/me/services.ts` の `hasPendingRequest` 呼出箇所）と「単純化された pending 判定」が再申請を塞ぐ構造の再現
2. `request_status` の値域 enum 定義（`pending` / `resolved` / `rejected` / NULL）と「general 行は NULL のみ許容」の制約方針確定
3. `resolved_at` 型（INTEGER unix epoch ms vs TEXT ISO8601）の選択根拠整理（既存列の `created_at` / `updated_at` 型と整合）
4. backfill 範囲の確定（既存 `visibility_request` / `delete_request` 行 → `pending` 化、`general` 行 → NULL 維持）
5. partial index の必要性判定（`WHERE request_status='pending'` 限定 index）
6. AC 11 件の quantitative 化（http status / DB 事後状態 / repository helper 戻り値）
7. 状態遷移許容/禁止の表化（pending → resolved / pending → rejected / それ以外は禁止）
8. 真の論点 3 件以上の抽出と暫定回答

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md | 元正本指示書 |
| 必須 | apps/api/migrations/0006_admin_member_notes_type.sql | 直前 migration 構造 |
| 必須 | apps/api/src/repository/adminNotes.ts | 既存 repository helper |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | queue 状態遷移 spec 追記対象 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | `admin_member_notes` 公式定義 |
| 必須 | CLAUDE.md | 不変条件 #4 / #5 / #11 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API 正本との整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本との整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | task workflow 正本との整合 |
| 参考 | docs/30-workflows/04b-parallel-member-self-service-api-endpoints/index.md | 課題発見元 workflow |

## 実行手順

### ステップ 1: 現状再現

```bash
# 04b 後の admin_member_notes の構造を確認
grep -n "hasPendingRequest\|findLatestByMemberAndType" apps/api/src/repository/adminNotes.ts
grep -rn "hasPendingRequest" apps/api/src/routes/me/
```

確認項目:
- `hasPendingRequest` が「最新行存在 = true」で resolved 行も pending 扱いになる構造
- 04b の DUPLICATE_PENDING_REQUEST 判定が再申請経路を塞ぐ事実

### ステップ 2: 値域 enum 確定

| 値 | 意味 | 適用 note_type |
| --- | --- | --- |
| `pending` | 申請受付済み・未処理 | `visibility_request` / `delete_request` |
| `resolved` | admin が承認/許可処理完了 | `visibility_request` / `delete_request` |
| `rejected` | admin が却下処理完了 | `visibility_request` / `delete_request` |
| `NULL` | 申請ではない（一般メモ） | `general` のみ |

> DDL は CHECK 制約を追加しないため、`general` 行の NULL 維持は DB 制約ではなく migration の初期状態、repository helper の `WHERE request_status='pending'` 述語、呼出側 validation で担保する。

### ステップ 3: 状態遷移表

| from | to | 条件 | 結果 |
| --- | --- | --- | --- |
| (insert) | `pending` | 04b POST /me/visibility-request, /me/delete-request | 新規行 + `request_status='pending'` |
| `pending` | `resolved` | 07a/07c admin が承認 | `markResolved(noteId, adminId)` |
| `pending` | `rejected` | 07a/07c admin が却下 | `markRejected(noteId, adminId, reason)` |
| `resolved` | * | 禁止 | UPDATE WHERE request_status='pending' で 0 件更新 |
| `rejected` | * | 禁止 | 同上 |
| `pending` | `pending` | 同 member × 同 type 重複申請 | 04b 側で 409、INSERT 自体を弾く |
| NULL (general) | * | 禁止 | repository helper の `WHERE request_status='pending'` で UPDATE 0 件。呼出側 validation では request 系 noteType のみ許可 |

### ステップ 4: AC quantitative

各 AC に対して以下 3 軸で測定指標化する:
- **http status**（route 層から見える結果）
- **DB 事後状態**（`admin_member_notes` の対象行の列値）
- **repository helper 戻り値**（true/false / row / null）

例:
- AC-3: `hasPendingRequest(memberId, 'visibility_request')`
  - DB 状態 (`request_status='pending'` の同 member × 同 type 行が 1 件以上) → `true`
  - DB 状態 (該当行 0 件、または resolved/rejected のみ) → `false`
- AC-4: `markResolved(noteId, adminId)`
  - 対象行が `pending` → 戻り値 `noteId`、UPDATE 1 件、`request_status='resolved'` / `resolved_at=Date.now()` / `resolved_by_admin_id=adminId`
  - 対象行が `general` または既に `resolved`/`rejected` → 戻り値 `null`、UPDATE 0 件

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 状態遷移表 → Mermaid state machine 図化、列定義 → DDL 草案、partial index 設計 |
| Phase 4 | AC × 検証手段（unit / contract / migration smoke）の matrix 起点 |
| Phase 5 | DDL 実装、repository helper 実装、`hasPendingRequest` 改修の擬似コード化 |
| Phase 7 | AC マトリクスのトレース元 |
| Phase 10 | gate 判定根拠 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #4 | `member_responses` / `response_fields` には触れない | 申請メタは別テーブル `admin_member_notes` のみで完結 |
| #5 | migration / repository / route 全て `apps/api` 配下 | apps/web から D1 直接アクセス禁止 |
| #11 | `markResolved` / `markRejected` は `admin_member_notes` 行のみ更新 | member 本文に admin が直接書き込まない |
| 認可境界 | `markResolved` / `markRejected` の呼出は admin context 限定（07a/07c で強制） | 本タスクは helper 提供のみ、認可は呼出側責務 |
| 無料枠 | 1 resolve = 1 D1 write、partial index は pending 行のみ index 化（行数小） | 100k writes/日 / 5GB |
| audit | 既存 audit_log は本タスクで触れない（07a/07c が責務） | 監査 schema を増やさない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 現状コード再現 | 1 | pending | adminNotes.ts / routes/me |
| 2 | 値域 enum 確定 | 1 | pending | pending/resolved/rejected/NULL |
| 3 | 状態遷移表 | 1 | pending | 7 行以上 |
| 4 | AC quantitative | 1 | pending | 11 件 × 3 軸 |
| 5 | 真の論点抽出 | 1 | pending | 3 件以上 |
| 6 | 4 条件評価 | 1 | pending | automation-30 検証4条件 + 価値評価軸 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 値域 + 状態遷移表 + AC quantitative + true issue |
| メタ | artifacts.json | Phase 1 を completed |

## 完了条件

- [ ] 状態遷移表が 7 行以上で許容/禁止が明示
- [ ] AC 11 件すべてに測定指標（http status / DB 事後状態 / helper 戻り値）
- [ ] 真の論点 3 件以上に暫定回答
- [ ] 不変条件 #4 / #5 / #11 に対する担保案
- [ ] `request_status` 値域 enum と `general` 行 NULL 維持方針（DB CHECK ではなく repository / validation で担保）が確定

## タスク100%実行確認

- [ ] 全実行タスク 8 件 completed
- [ ] artifacts.json で phase 1 を completed
- [ ] outputs/phase-01/main.md が存在し AC matrix の前提を満たす

## 次 Phase への引き渡し

- 次: 2 (設計)
- 引き継ぎ: 状態遷移表 → Mermaid 状態遷移図、値域 → DDL 列定義、partial index 範囲、backfill SQL 範囲、repository helper interface
- ブロック条件: 値域 enum 未確定、AC 未定義、不変条件への影響未整理 のいずれかが残る場合は次へ進めない

## 真の論点

1. **enum を CHECK 制約で固定するか、層 guard（zod / repository）で守るか**
   - 採用方針: D1 の `ALTER TABLE ... ADD COLUMN` で CHECK 制約を後付けする操作は SQLite の制約上扱いづらい（テーブル再作成が必要）。値域は TEXT で受け、zod / repository helper の入口で固定する。Phase 3 の Alternative A で詳細評価。

2. **partial index `WHERE request_status='pending'` を作るか、既存 `idx_admin_notes_member_type` のみで足りるか**
   - 採用方針: pending 件数は admin の処理速度に依存し最小ながら、`hasPendingRequest` は本人申請のホットパスで呼ばれる。`(member_id, note_type) WHERE request_status='pending'` の partial index を追加することで pending 行のみ対象の高速検索を成立させる。

3. **backfill 範囲：既存全 request 行を pending 化するか、移行時に admin が手動 resolve するか**
   - 採用方針: 04b は MVP 直後で実運用 request 行は 0 件想定だが、staging データ・将来再適用に備えて migration 内で `UPDATE admin_member_notes SET request_status='pending' WHERE note_type IN ('visibility_request','delete_request')` を実行。general 行は NULL のまま。

4. **`resolved_at` を INTEGER (unix epoch ms) と TEXT (ISO8601) のどちらにするか**
   - 採用方針: 既存 `created_at` / `updated_at` が TEXT (ISO8601) の慣習だが、resolved_at は範囲検索の頻度が低くソート用途中心のため INTEGER unix epoch ms を採用すると bind 時の `Date.now()` を直接使え、JS との往復コストが小さい。Phase 2 で最終確定。

## 依存境界

- 上流: 04b（note_type 列追加）が main にマージ済み、02c の adminNotes 基盤
- 下流: 07a/07c が `markResolved` / `markRejected` を import して resolve workflow に組み込む
- responsibility: migration + repository helper + hasPendingRequest 改修 + spec 追記まで。admin resolve handler / route は本タスク対象外

## 価値とコスト

- 価値:
  - admin 処理後の本人再申請経路を論理的に開く（運用上の整合）
  - 07a/07c の DDL 変更コスト削減（先行投資）
  - audit 整合（処理状態が note_type 行群の order by に依存しなくなる）
- コスト:
  - migration 1 ファイル + repository 数十行 + テスト + spec 追記
  - 1 resolve = 1 D1 write × 月想定 < 100 件 = 100 writes/月（無料枠の 0.001%）
  - partial index storage は pending 件数（運用ピーク 10 件想定）に比例し無視可

## 4 条件評価

この Phase では automation-30 の検証4条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）を前提に、下表の価値評価軸を補助的に確認する。

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | admin 処理後の再申請を許容し audit 整合を取れるか | TBD（Phase 3 で確定） |
| 実現性 | `ALTER TABLE` + repository helper + spec 追記の組合せで MVP 内で完了するか | TBD |
| 整合性 | 不変条件 #4 / #5 / #11 を破らずに完了するか | TBD |
| 運用性 | 07a / 07c の後続実装が helper 1 セットで完結するか | TBD |
