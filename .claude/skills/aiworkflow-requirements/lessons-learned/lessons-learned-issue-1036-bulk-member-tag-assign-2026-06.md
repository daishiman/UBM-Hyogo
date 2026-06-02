# Lessons Learned: issue-1036 複数 member 一括 tag assign/unassign（bulk admin write）

親 issue-982（admin MemberDrawer 単一 tag pill 編集）の followup-003 を最新コードへ最適化したもの。
単一 member の admin manual write を **複数 member × 複数 tag の直積 bulk write** へ拡張した際の知見。
関連: [[lessons-learned-issue-982-drawer-tag-pill-editing-2026-05]]。

## L-I1036-001: Hono は登録順マッチ — `POST /members/tags/bulk` を `:memberId` route より前に登録する
- **状況**: `POST /admin/members/tags/bulk` を `POST/GET/DELETE /admin/members/:memberId/tags` と同じ router に追加したところ、後者が先に登録されていると `:memberId="tags"` に誤マッチして bulk endpoint に到達しなかった。
- **教訓**: Hono は登録順で route を評価するため、static segment を含む `…/tags/bulk` は `…/:memberId/tags` **より前に登録**する。tag master read（`GET /admin/tags`）は members prefix の外（`/admin` 直下）に mount し、`:memberId` collision 自体を構造的に避ける。route 順序は Phase 3 で先に確定し contract spec で固定する。

## L-I1036-002: bulk 再送冪等は #913 server idempotency store に依存させず DB 自然冪等で実現する
- **状況**: AC-5（同じ bulk 操作を再送しても二重付与しない）を満たすために #913（server-side Idempotency-Key store）が前提だと当初想定し、別タスク待ちで停滞しかけた。
- **教訓**: root assumption を疑い「bulk 冪等は server idempotency store が必要」→「`member_tags` 複合 PK の DB 自然冪等で十分」へ転換する。assign は `INSERT OR IGNORE`、unassign は `DELETE` とし、`meta.changes > 0` を実 mutation、`= 0` を `noop` と判定すれば再送は自然に no-op になる。これで #913 を **非依存**化し別タスク待ちの未タスクを生まない。

## L-I1036-003: 部分失敗レポート + 実 mutation のみ audit を両立するため `db.batch()` でなく逐次 loop で実装する
- **状況**: 性能を理由に `db.batch()`（all-or-nothing）で一括 write したくなったが、AC-2（不在 member を skip して他 member は継続＝部分成功）と AC-3（実 mutation した item だけ audit）を満たせない。
- **教訓**: 部分成功レポートと「実 mutation 単位 audit」を要求する bulk write は **逐次 loop** で実装する。N+1 は loop 内の毎回クエリでなく、tag master active set と member 削除状態 map を **loop 前に各 1 クエリで一括取得**して回避する。batch の atomicity が不要なユースケースでは loop + 事前一括取得が正解。

## L-I1036-004: 相関は `correlation_id` 列を新設せず audit の before/after payload に `batchId` を埋める
- **状況**: 「この 1 回の bulk 操作」で変更した audit 行をまとめて引きたいが、D1 schema 変更（`audit_log.correlation_id` 列追加）は不変条件で禁止。
- **教訓**: `crypto.randomUUID()` で生成した `batchId` を audit の payload（assign は `after:{tagId, source:"manual", batchId}`、unassign は `before:{tagId, batchId}`）に埋め込み、列追加なしで bulk 相関を担保する。schema を変えずに横断クエリ可能なメタを残す手段として JSON payload への識別子埋め込みは有効。

## L-I1036-005: 不変条件 #13「第3経路（bulk admin write）」を type-level gate allow list で self-document する
- **状況**: 「`member_tags` への write は限定経路のみ」という不変条件に、(1) queue resolve、(2) 単一 admin manual に続く **第3経路（bulk admin manual）** を追加する必要があった。
- **教訓**: 新しい write lane は `bulkApplyMemberTagsByAdmin` として helper を分離（SRP）し、`memberTags.readonly.test-d.ts` の allow list に追加して **type-level で自己文書化**する。`memberTags.ts` 先頭コメントの第1/第2経路記述は削除せず第3経路を追記する（既存経路を消さない）。stale-reference gate を壊さない非破壊追加。

## L-I1036-006: member skip 判定を tag 評価より先に行い `skipped_deleted` と `tag_not_found` の優先順位を固定する
- **状況**: 不在/削除済み member と未登録 tag が混在する入力で、どちらの status を返すか曖昧になった。
- **教訓**: member×tag 直積 loop では **member の書込対象判定を tag 評価より先**に行う。member 不在 or `is_deleted=1` なら tag を評価せず `skipped_deleted` で continue、書込対象 member に対してのみ tag active set を引いて `tag_not_found` を判定する。意図は `isWriteTarget(memberId, deletedMap): boolean` ヘルパに抽出して関数名で表現する。

## L-I1036-007: bulk picker は新規 primitive を生やさず既存 TagPill / useAdminMutation を再利用する
- **状況**: bulk 用に独自の tag toggle UI を組みたくなったが、プロトタイプ正本順位（新規 primitive を生やさない）と不変条件 #9/#10 に反する。
- **教訓**: tag picker は既存 `_shared/TagPill.tsx` を `MemberTagsEditor` と同一の props 渡し方（`selected` / `onClick` / `aria-pressed` / category グルーピング）で再利用し navigation drift を削減する。bulk 実行は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10、legacy `@/lib/useAdminMutation` 不使用）。props は既存 `{ selectedIds, onComplete }` を維持して選択基盤を再利用する。

## L-I1036-008: status を5値の判別共用体で表現し、tag master read（#1035 write）と read/write 責務分離する
- **状況**: bulk 結果の表示と集計、および tag master 取得の責務境界が不明確だった。
- **教訓**: 結果 item は `assigned / unassigned / noop / skipped_deleted / tag_not_found` の判別共用体で表現し、`resolveChangeStatus(changes, hitStatus)`（`changes>0?hit:"noop"`）と `summarizeBulkResult(results)` で分岐重複と UI 集計を局所化する。picker 用の `GET /admin/tags` は active tag の **read のみ**で、tag 定義の write/CRUD（#1035）とは read/write で責務分離し endpoint を重複させない。
