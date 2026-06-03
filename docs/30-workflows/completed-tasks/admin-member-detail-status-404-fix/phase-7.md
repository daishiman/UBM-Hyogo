# Phase 7: カバレッジ確認

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本 Phase は **変更箇所限定**のカバレッジ確認に閉じる。広域カバレッジ目標の追求は行わない（Feedback BEFORE-QUIT-002 / Feedback 5）。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 7（カバレッジ確認） |
| 依存 | Phase 5（実装）/ Phase 6（テスト拡充） |
| 分類 | NON_VISUAL（`apps/api` のみ） |
| implementation_mode | `new` |
| 主成果物 | 変更関数/ブロックの line/branch カバレッジ対象表 + 計測コマンド |

## 目的

本タスクで**追加・変更した関数とブランチ**（`ensureMemberStatusRow` / `defaultMemberStatusRow` / builder の degraded 分岐 / route の 404・ensure 分岐 / ingest の ensure 挿入 / migration 0024）に限定して line/branch を計測し、未到達ブランチが無いことを確認する。既存無変更コードや全リポジトリのカバレッジ率向上は本 Phase の対象外。

## 実行タスク

### 7.1 カバレッジ対象（変更箇所限定）

| ファイル | 対象シンボル / ブランチ | カバーするテスト（Phase 4/6） |
|---------|------------------------|------------------------------|
| `apps/api/src/repository/status.ts` | `ensureMemberStatusRow`（line 全行） | 4.1 行生成 / 4.1 冪等 |
| 同上 | `defaultMemberStatusRow`（line 全行・返却オブジェクト全フィールド） | 4.2 status 欠落 view（builder 経由で実行）/ 6.3 空 answers |
| `apps/api/src/repository/_shared/builder.ts` | `buildAdminMemberDetailView` の **新規 3 ブランチ**: ①`if (!identity) return null` ②`status ?? defaultMemberStatusRow(mid)`（status あり/無し両側）③`if (response) { 正常 } else { 劣化 }`（両側） | ① 4.2 identity 欠落 / ② 4.2 status 欠落 + 6.2 status あり / ③ 4.2 response 欠落 + 6.2 response あり |
| 同上 | degraded 分岐内 `fallbackResponseId`（current_response_id 非空 / 空文字 → member_id）の両側 | 4.2 response 欠落（非空側）/ 6.3 `current_response_id=""`（空文字側） |
| `apps/api/src/routes/admin/member-status.ts` | `if (!identity) return 404`（両側）/ `ensureMemberStatusRow` 呼出行 / `publishState !== undefined` 分岐 / `hiddenReason !== undefined` 分岐 | 4.3 identity 不在 404（true 側）+ 4.3 status 欠落成功（false 側）/ 6.3 hiddenReason のみ（hiddenReason 側）/ 6.2 publishState 更新（publishState 側） |
| `apps/api/src/jobs/sync-forms-responses.ts` | 新規 identity ブロック内 `ensureMemberStatusRow` 呼出行（line） | 4.4 / 6.4 新規 identity で行生成 |
| `apps/api/migrations/0025_backfill_member_status.sql` | backfill SQL の実行（orphan あり / 0 件 / 再適用） | 4.5 backfill + 冪等 / 6.3 orphan 0 件 / identity 0 件 |

### 7.2 ブランチ網羅チェックリスト（未到達ブランチが無いことの確認）

| ブランチ | true 側カバー | false 側カバー |
|---------|--------------|---------------|
| builder `!identity` | 4.2 identity 欠落 → null | 4.2/6.2 identity あり |
| builder `status ?? default`（status falsy 判定） | 4.2 status 欠落 → default | 6.2 status あり → 実 status |
| builder `if (response)` | 6.2 response あり → 正常 view | 4.2 response 欠落 → 劣化 view |
| builder `current_response_id 非空 ? : member_id` | 4.2 非空 current_response_id | 6.3 空文字 → member_id |
| route `!identity` | 4.3 identity 不在 → 404 | 4.3 status 欠落 → 200 |
| route `publishState !== undefined` | 6.2 publishState 更新 | 6.3 hiddenReason のみ（publishState undefined） |
| route `hiddenReason !== undefined` | 6.3 hiddenReason 更新 | 6.2 publishState のみ（hiddenReason undefined） |
| migration `WHERE ms.member_id IS NULL` | 4.5 orphan あり → 挿入 | 6.3 orphan 0 件 → no-op |

→ 全ブランチに対し両側を Phase 4/6 のケースで到達させる。未到達が残る場合は Phase 6 に最小ケースを追記する（広域目標は追わない）。

### 7.3 計測コマンド（変更ファイルに限定したレポート）

D1 group の coverage は `vitest.d1.config.ts` の `coverage.reportsDirectory: "apps/api/coverage/d1"` に出力される。変更ファイルのみを `--coverage.include` で絞って計測する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  --coverage \
  --coverage.include='apps/api/src/repository/status.ts' \
  --coverage.include='apps/api/src/repository/_shared/builder.ts' \
  --coverage.include='apps/api/src/routes/admin/member-status.ts' \
  --coverage.include='apps/api/src/jobs/sync-forms-responses.ts' \
  apps/api/src/repository/__tests__/status.repository.spec.ts \
  apps/api/src/repository/__tests__/builder.repository.spec.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/sync/migration-0024-backfill.contract.spec.ts
```

> migration 0024 は SQL ファイルのため line/branch カバレッジ計測の対象外。代わりに 7.1/7.2 の migration ケース（orphan あり / 0 件 / 再適用）が SQL の WHERE 分岐両側を実行することをもって網羅とみなす。

### 7.4 合格基準（変更箇所限定）

- 7.1 の変更シンボルが coverage レポートで **line 100%**（新規 helper `ensureMemberStatusRow` / `defaultMemberStatusRow` は全行到達）。
- 7.2 の全ブランチが両側到達（branch 未到達 0）。
- 既存無変更コードのカバレッジ率は本 Phase の合否に**含めない**（変更差分のみ判定）。

## 参照資料

- Phase 5 §5.2〜5.6（変更シンボルの実装方針）
- Phase 6 §6.2/6.3（境界・回帰ケース＝ブランチ到達源）
- `vitest.d1.config.ts:83-87`（coverage reportsDirectory）
- Feedback BEFORE-QUIT-002 / Feedback 5（カバレッジは変更箇所限定）

## 成果物

- 本ファイル（Phase 7: 変更箇所限定カバレッジ対象表 + ブランチ網羅チェックリスト + 計測コマンド）

## 統合テスト連携

- 7.2 のブランチ網羅は Phase 6 のケースと 1:1 で対応し、未到達があれば Phase 6 へ最小ケースを追記する。
- 7.4 の合格基準は Phase 9（品質保証）の全体実行・Phase 10（最終レビュー）の AC 充足判定で参照する。

## 完了条件

- [x] 変更関数/ブロック（helper 2 / builder 3 分岐 / route 4 分岐 / ingest 1 行 / migration）を対象として列挙した（7.1）
- [x] ブランチ両側到達チェックリストを作成しテスト対応を明示した（7.2）
- [x] 変更ファイルに限定した coverage 計測コマンドを確定した（7.3）
- [x] 変更箇所限定の合格基準（line 100% / branch 両側）を定義した（7.4）
- [x] 広域カバレッジ目標を追わない方針を明記した（Feedback BEFORE-QUIT-002 / Feedback 5）
