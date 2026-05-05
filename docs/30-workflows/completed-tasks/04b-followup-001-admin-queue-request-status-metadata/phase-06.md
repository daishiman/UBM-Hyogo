# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 4 (followup, serial) |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |

## 目的

Phase 5 の擬似コードに対し、route / helper / migration の各層で発生し得る failure case を網羅し、http status / DB 事後状態 / recovery 手順を確定する。特に「migration 適用失敗時の rollback」「backfill 失敗時のリカバリ」「state transition 構造的拒否の異常系」を runbook 化する。

## 実行タスク

1. failure case 表（401 / 403 / 404 / 409 / 422 / 5xx を網羅）
2. helper 層の異常系（state transition 違反 / 不存在 noteId / 空 reason）
3. migration 0007 の適用失敗時の rollback 手順
4. backfill 失敗（途中失敗 / 部分適用）時のリカバリ手順
5. partial index 作成失敗時の対処（既存同名 index / DDL 衝突）
6. D1 障害時（5xx）の動作と再試行ポリシー

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-05.md | runbook + 擬似コード |
| 必須 | phase-04.md | テスト計画 |
| 必須 | phase-03.md | 採用案 C のリスク 5 件 |
| 必須 | apps/api/src/routes/me/index.ts | 04b 既存 route の error response 形式 |
| 必須 | scripts/cf.sh | rollback 操作経路 |
| 参考 | docs/30-workflows/02-application-implementation/07a-parallel-tag-assignment-queue-resolve-workflow/phase-06.md | failure case 表の体裁 |

## failure case 表

| # | case | trigger | http | 期待動作 | recovery |
| --- | --- | --- | --- | --- | --- |
| 1 | 401 unauthenticated | session 切れで `POST /me/visibility-request` | 401 | error response、DB 不変 | UI で再 login |
| 2 | 403 admin gate 不通過 | 一般 user が 07a / 07c の resolve route に到達（本タスク対象外だが helper 契約として確認） | 403 | DB 不変 | admin 申請 |
| 3 | 404 noteId 不存在 | `markResolved(noteId='non_existent', adminId)` | - | helper 戻り値 `null`、UPDATE 0 件 | 呼出側（07a/07c）が 404 を返す |
| 4 | 409 pending 既存 | pending 行存在中の本人再 POST | 409 DUPLICATE_PENDING_REQUEST | 既存 pending 行は不変、新規 INSERT なし | UI で「処理中」表示 |
| 5 | 409 既に resolved | `markResolved` を resolved 行に呼ぶ | - | helper 戻り値 `null`、UPDATE 0 件（構造的拒否） | 呼出側で 409 を返す |
| 6 | 409 既に rejected | `markRejected` を rejected 行に呼ぶ | - | helper 戻り値 `null`、UPDATE 0 件 | 呼出側で 409 を返す |
| 7 | 422 reason 空 | `markRejected(noteId, adminId, reason='')` | - | 呼出側 zod で 422、helper 到達せず | 呼出側 (07a/07c) で reason 必須を zod 強制 |
| 8 | 422 general 行への resolve | `markResolved` を general 行に呼ぶ | - | UPDATE 0 件、戻り値 `null`（general は request_status NULL のため WHERE 不一致） | 呼出側で「対象外」エラー |
| 9 | 5xx D1 失敗 | UPDATE 実行時に D1 が一時障害 | 5xx | helper が throw、route で 500 + retry 推奨 | UI で再試行 |
| 10 | migration 0007 ALTER 失敗 | 列名衝突 / 型不一致 | 適用失敗 | migrations table へ未記録 | rollback runbook へ |
| 11 | migration 0007 backfill 部分失敗 | UPDATE 中に D1 quota 超過 | 部分適用 | リカバリ runbook へ | 検証 SQL → 残行 UPDATE |
| 12 | partial index 作成失敗 | 既存同名 index 衝突 | DDL 失敗 | `CREATE INDEX IF NOT EXISTS` で冪等化済み | 名前衝突なら別名で再作成 |
| 13 | adminId 不正（空文字） | `markResolved(noteId, adminId='')` | - | UPDATE は走るが `resolved_by_admin_id=''` が記録される | 呼出側 zod で `min(1)` 強制（07a/07c 責務） |
| 14 | 同時 resolve 競合 | 同一 noteId に対して並列 markResolved | - | 1 つだけ `changes=1`、他は `changes=0` で `null` 戻り | 呼出側で 1 つの成功を採用 |

> helper は state transition の構造的拒否を担い、認可・`adminId`・`reason` の入力 validation は 07a / 07c の route zod 責務とする。本タスクではその責務境界を契約として固定する。

## state transition 異常系（構造的拒否の網羅）

| from | 呼出 | 結果 | 検証 |
| --- | --- | --- | --- |
| resolved | markResolved | 戻り値 null / changes 0 | unit test |
| resolved | markRejected | 戻り値 null / changes 0 | unit test |
| rejected | markResolved | 戻り値 null / changes 0 | unit test |
| rejected | markRejected | 戻り値 null / changes 0 | unit test |
| general (NULL) | markResolved | 戻り値 null / changes 0 | unit test |
| general (NULL) | markRejected | 戻り値 null / changes 0 | unit test |

これらは全て `WHERE request_status='pending'` の述語によって SQL 層で拒否され、アプリ if 文に依存しない。

## migration rollback 手順

migration 0007 適用失敗 / 適用後に致命的問題発覚時の復旧手順。

```bash
# 1. 状態確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 2. 直近 backup を確認（Phase 5 ステップ 6 で取得した backup-pre-0007.sql）
ls -la backup-pre-0007.sql

# 3a. 列削除による rollback（SQLite の制約: ALTER TABLE DROP COLUMN は 3.35+ で対応）
#     D1 の SQLite version で DROP COLUMN が使える場合
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "DROP INDEX IF EXISTS idx_admin_notes_pending_requests;
   ALTER TABLE admin_member_notes DROP COLUMN resolved_by_admin_id;
   ALTER TABLE admin_member_notes DROP COLUMN resolved_at;
   ALTER TABLE admin_member_notes DROP COLUMN request_status;"

# 3b. DROP COLUMN が使えない場合は backup から restore（最終手段）
#     production では極力避ける。backup の時刻以降の差分が失われるため。
#     必要時のみ user 承認のもと実施する。

# 4. migrations table 整合
#     0007 行を削除して再適用可能にする
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "DELETE FROM d1_migrations WHERE name = '0007_admin_member_notes_request_status'"
```

> production rollback は **user 承認必須**。staging で先に検証する。

## backfill 失敗時のリカバリ手順

migration 0007 内の `UPDATE ... SET request_status='pending'` が部分適用で停止した場合。

```bash
# 1. 残行件数を確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "SELECT COUNT(*) AS leftover FROM admin_member_notes
    WHERE note_type IN ('visibility_request','delete_request')
      AND request_status IS NULL"

# 2. leftover > 0 なら再 UPDATE（idempotent）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "UPDATE admin_member_notes
      SET request_status = 'pending'
    WHERE note_type IN ('visibility_request','delete_request')
      AND request_status IS NULL"

# 3. 再検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "SELECT COUNT(*) AS leftover FROM admin_member_notes
    WHERE note_type IN ('visibility_request','delete_request')
      AND request_status IS NULL"
# 期待: leftover = 0
```

UPDATE は `IS NULL` ガードで冪等。複数回流しても general 行や既に pending の行は影響を受けない。

## partial index 作成失敗時の対処

```bash
# 既存同名 index がある場合（IF NOT EXISTS で抑止済みだが念のため）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_admin_notes_pending_requests'"

# 列名 typo / WHERE 句エラーの場合は migration ファイル修正 → 再適用
```

## D1 障害時の再試行ポリシー

| 操作 | 障害時の挙動 | 再試行 |
| --- | --- | --- |
| `markResolved` / `markRejected` の UPDATE | helper が throw | route layer で 500 を返し、UI で retry 案内 |
| `hasPendingRequest` の SELECT | helper が throw | route で 500、UI で retry |
| migration 適用 | wrangler 側 stderr | runbook の rollback / リカバリへ |

D1 自体は atomic な単一文 UPDATE のため、文の途中失敗による中間状態は発生しない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | failure case 14 件を AC マトリクスの異常系列にトレース |
| Phase 8 | rollback / リカバリ手順の重複部分を DRY 化対象に |
| Phase 11 | manual smoke で 409 / 202 の挙動を curl で確認 |

## 多角的チェック観点

| 不変条件 | 異常系担保 | 検証 |
| --- | --- | --- |
| #4 | rollback で `member_responses` に副作用を出さない | rollback SQL は `admin_member_notes` のみ対象 |
| #5 | 全 rollback / リカバリ操作が `bash scripts/cf.sh` 経由 | runbook 全行で確認 |
| #11 | rollback 時にも member 本文（`response_fields`）に触れない | 上記と同様 |
| 認可 | 401 / 403 が呼出側で正しく出る | helper 契約として `adminId` 必須 |
| 構造的拒否 | resolved → resolved 等が UPDATE 0 件で阻止 | unit test 6 行で網羅 |
| 冪等性 | backfill UPDATE と partial index DDL が冪等 | `IS NULL` ガード + `IF NOT EXISTS` |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 表 | 6 | pending | 14 件 |
| 2 | state transition 異常系 | 6 | pending | 6 行 |
| 3 | migration rollback | 6 | pending | DROP COLUMN + d1_migrations |
| 4 | backfill リカバリ | 6 | pending | 冪等 UPDATE |
| 5 | partial index 失敗対処 | 6 | pending | IF NOT EXISTS |
| 6 | D1 障害再試行 | 6 | pending | retry policy |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure case + recovery + rollback 手順 |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 14 件以上に http status / 期待動作 / recovery
- [ ] state transition 異常系 6 行を構造的拒否で網羅
- [ ] migration rollback 手順が DROP COLUMN + d1_migrations 整合を含む
- [ ] backfill リカバリが冪等 UPDATE で完結
- [ ] partial index 作成失敗が IF NOT EXISTS で抑止
- [ ] D1 障害時の再試行ポリシーが route 層 retry に紐付く

## タスク100%実行確認

- [ ] 全実行タスク 6 件 completed
- [ ] artifacts.json で phase 6 を completed
- [ ] outputs/phase-06/main.md が Phase 7 AC マトリクスの異常系列入力として参照可能

## 次 Phase への引き渡し

- 次: 7 (AC マトリクス)
- 引き継ぎ: failure case 14 件と state transition 異常系 6 行を AC × 異常系列のソースに
- ブロック条件: rollback 手順が `bash scripts/cf.sh` を経由しない / backfill が非冪等 / state transition の構造的拒否が SQL ガードに依存していない場合は Phase 6 へ差し戻し
