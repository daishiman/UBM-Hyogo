# admin_member_notes リクエスト処理メタデータ整備 - タスク指示書

## メタ情報

```yaml
issue_number: 217
```

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | 04b-followup-001-admin-queue-request-status-metadata                |
| タスク名     | admin_member_notes リクエスト処理メタデータ整備                     |
| 分類         | 改善                                                                |
| 対象機能     | visibility_request / delete_request の処理状態管理                  |
| 優先度       | 高                                                                  |
| 見積もり規模 | 中規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | 04b Phase 12                                                        |
| 発見日       | 2026-04-29                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04b で `POST /me/visibility-request` / `POST /me/delete-request` を実装した結果、
本人申請は `admin_member_notes` に `note_type='visibility_request' | 'delete_request'`
として queue される。MVP では「同 type の最新行が存在すれば pending」という極めて
単純化したロジックで再申請ガードをかけている（`adminNotes.hasPendingRequest`）。

### 1.2 問題点・課題

- 「同 type の最新行が存在 = pending」は処理済みの行も pending 扱いしてしまうため、
  admin が処理を完了した後に本人が再申請する経路が論理的に塞がる
- 07a / 07c で admin が queue を resolve するワークフローを実装する際、
  「処理中 / 処理済み」を識別するメタデータが存在しないため audit と整合が取れない
- delete_request を物理削除で解消する運用に倒すか、論理削除＋status 列で表現するかが未決
- visibility_request 処理結果（公開許可されたか拒否されたか）が note_type からは復元不能

### 1.3 放置した場合の影響

- admin 処理後の再申請が永続的にブロックされる
- 07a / 07c タスクが状態遷移を表現できないまま着手され、追加 migration が必要になる
- 監査要件（`who/when/result`）を audit_log だけで満たすのは可能だが、queue 単体の
  最新状態が note_type 行群の order by に依存することになり、参照クエリが複雑化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`admin_member_notes` の visibility_request / delete_request 行に「処理状態」と
「処理結果メタデータ」を列として追加し、本人再申請ガードと admin resolve workflow が
同じ正本を参照できる構造に揃える。

### 2.2 最終ゴール

- `admin_member_notes` に `request_status` (例: `pending|resolved|rejected`) と
  `resolved_at` / `resolved_by_admin_id` 列が追加されている
- `adminNotes.hasPendingRequest` が `request_status='pending'` の行のみで判定する
- 07a / 07c が resolve 時に `request_status` を更新できる API / repository helper が用意される
- 処理済みの request type は本人が再申請可能になる

### 2.3 スコープ

#### 含むもの

- `admin_member_notes` への追加列の DDL（migration 0007 想定）
- `repository/adminNotes.ts` への state transition helper（`markResolved` / `markRejected`）
- `hasPendingRequest` の `request_status='pending'` 限定化
- 既存行の backfill ルール（一般 note は status NULL、request 行は status='pending' 初期化）

#### 含まないもの

- 07a / 07c admin resolve workflow 本体（参照タスクとして委譲）
- audit_log schema 変更（既存 audit 構造を維持）
- 物理削除の導入（論理削除運用を踏襲）

### 2.4 成果物

- `apps/api/migrations/0007_admin_member_notes_request_status.sql`
- `apps/api/src/repository/adminNotes.ts` の state helper 追加差分
- `apps/api/src/repository/__tests__/adminNotes.test.ts` のテスト追加
- spec `07-edit-delete.md` の queue 状態遷移セクション追記

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04b の `0006_admin_member_notes_type.sql` が main にマージされている
- 07a / 07c タスクが未着手か、着手前の合意ができている

### 3.2 依存タスク

- 04b マージ完了（必須前提）
- 02c の adminNotes 基盤（既存）

### 3.3 必要な知識

- D1 / SQL の ALTER TABLE と既存行 backfill
- `_shared/db.ts` 経由の transaction
- 不変条件 #4（response_fields は本人 PATCH 不可）と #11（path に :memberId 禁止）
- 07a / 07c の admin queue resolve の責務境界

### 3.4 推奨アプローチ

`request_status` は `note_type IN ('visibility_request','delete_request')` の行にのみ
意味を持つため、CHECK 制約ではなく partial index と repository 層の guard で表現する。
backfill は 04b 適用以降に作られた pending 行に対して `request_status='pending'` を入れ、
それ以前の (note_type='general') 行は NULL のままにする。

---

## 4. 実行手順

### Phase構成

1. spec 改訂と migration 設計
2. migration 実装と backfill
3. repository / route 層への組み込み
4. テストと spec 同期

### Phase 1: spec 改訂と migration 設計

#### 目的

`request_status` enum と `resolved_*` 列の意味、本人再申請可否の遷移を spec に固定する。

#### 手順

1. `07-edit-delete.md` に queue 状態遷移図と `request_status` の値定義を追記
2. `0007_admin_member_notes_request_status.sql` の DDL を起草
3. backfill SQL を整理（既存 visibility_request / delete_request 行は pending 化）

#### 完了条件

spec と DDL 草案が整合し、不変条件を侵さない

### Phase 2: migration 実装と backfill

#### 目的

D1 に列追加し、既存行の状態を確定させる。

#### 手順

1. `apps/api/migrations/0007_admin_member_notes_request_status.sql` を追加
2. local で `bash scripts/cf.sh d1 migrations apply` 経由で smoke
3. backfill 結果を select で検証

#### 完了条件

`request_status` 列が追加され、backfill 後の pending 行件数が想定通り

### Phase 3: repository / route 層への組み込み

#### 目的

`hasPendingRequest` と新 helper（`markResolved` / `markRejected`）を実装し、route 層と整合させる。

#### 手順

1. `repository/adminNotes.ts` を更新
2. `routes/me/services.ts` の `memberSelfRequestQueue` から呼ぶ guard を pending 限定にする
3. 07a / 07c で利用される resolve helper の interface を export

#### 完了条件

`hasPendingRequest` が `request_status='pending'` のみを真とする

### Phase 4: テストと spec 同期

#### 目的

挙動と spec を同期し、再発防止策を残す。

#### 手順

1. `adminNotes.test.ts` に state transition テストを追加
2. `routes/me/index.test.ts` に「処理済み後の再申請が成功する」ケースを追加
3. `07-edit-delete.md` の状態遷移節を最終化

#### 完了条件

全テスト緑、spec と実装が同期

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `admin_member_notes.request_status` / `resolved_at` / `resolved_by_admin_id` が追加されている
- [ ] `hasPendingRequest` が pending 行のみで判定する
- [ ] 処理済み後の本人再申請が許可される
- [ ] 07a / 07c から呼べる state transition helper が export されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `apps/api` テスト緑

### ドキュメント要件

- [ ] `docs/00-getting-started-manual/specs/07-edit-delete.md` の queue 状態遷移節が更新済み
- [ ] migration 0007 のロールバック手順が phase-12 implementation-guide に記載

---

## 6. 検証方法

### テストケース

- pending 行が存在する状態で本人が再申請 → 409 (Already pending)
- resolved 行のみ存在する状態で本人が再申請 → 202 (新規 pending 行追加)
- admin が markResolved した後、`hasPendingRequest` が false を返す

### 検証手順

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api test
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
```

---

## 7. リスクと対策

| リスク                                                   | 影響度 | 発生確率 | 対策                                                         |
| -------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------ |
| backfill 漏れにより既存 pending 行が NULL のまま残る     | 高     | 中       | migration 内で `UPDATE ... WHERE note_type IN (...)` を実行 |
| 07a / 07c が resolve API を別形式で実装し二重定義        | 中     | 中       | repository helper を export し interface を共通化            |
| request_status を CHECK 制約で固定すると D1 で扱いづらい | 中     | 中       | enum 値は zod / repository 層で守り、DDL は TEXT のまま      |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/implementation-guide.md`
- `apps/api/migrations/0006_admin_member_notes_type.sql`
- `apps/api/src/repository/adminNotes.ts`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`

### 参考資料

- 不変条件 #4 / #11 / #12

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `hasPendingRequest` を `note_type の最新行が存在 = pending` と単純化したため、admin が処理した後の再申請経路が論理的に塞がる構造になった              |
| 原因     | 04b スコープでは admin resolve workflow（07a / 07c）が未着手で、状態を表現する列を追加する意思決定までは含められなかった                              |
| 対応     | 04b ではガード条件を「同 type の最新行存在」とし、resolved metadata は本タスクで補強する方針とした                                                    |
| 再発防止 | queue 系を新設する際は「初回登録の前」「処理中」「処理完了後」の遷移を repository helper の入口で確定させ、最新行 order by に依存しないルールを徹底する |

### レビュー指摘の原文（該当する場合）

```
04b Phase 12 unassigned-task-detection.md にて「admin queue request status / resolved metadata」を 07a / 07c 着手前の前提条件として識別
```

### 補足事項

07a / 07c が走る前に解決しておくと、admin 側の resolve workflow 実装が DDL 変更を伴わず
repository helper だけで完結できる。本タスクの先行投資により、後続タスクのスコープが
小さくなり、レビューコストも下がる。
