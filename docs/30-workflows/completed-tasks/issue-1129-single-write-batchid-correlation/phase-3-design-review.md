# Phase 3: 設計レビュー（Gate-A）— issue-1129 単一 tag write batchId 相関キー付与

## ステータス: completed / Gate-A: passed

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 単一責務 | PASS | route 層の audit payload 拡張に限定。repository / migration / web 非変更 |
| AC 網羅 | PASS | AC-1..6 が Phase 1-3（定義）/ Phase 5-6（実装・テスト）/ Phase 10（衝突検証）に割当済 |
| 既存資産再利用（FB-SDK-07-1） | PASS | `batchId` キー・`$.batchId` 検索 SQL・`crypto.randomUUID()` を再利用。新規 surface ゼロ |
| 命名一貫性（FB-SDK-07-4） | PASS | bulk の `batchId` を逐語再利用。意味論差（correlation id・群サイズ1）は guide に明記 |
| 不変条件整合 | PASS | 不変条件 #13 の第2経路（単一 admin manual）の payload 拡張のみ。経路・action 名不変 |
| 1 サイクル完了（CONST_007） | PASS | 1 プロダクトファイル 2 箇所編集 + テスト 2 ファイル拡充。先送り分割なし |
| schema 非破壊 | PASS | migration なし。`audit_log` 列・index 不変。`GET /admin/audit` query surface 不変 |

## 因果ループ（システム観点）

- 強化ループ: 単一 write に batchId 付与 → audit viewer で単一/bulk を同一導線で追跡可能 → 監査運用の一貫性向上 → 相関フィルタの利用価値増。
- バランスループ: batchId を全 audit 行に無制限付与 → payload 肥大 / sparse 性低下の懸念 → だが単一 write は 1 行 1 UUID で payload 増分は ~50 byte に限定 → 肥大リスクは無視可能。

## トレードオフ確定

| 論点 | 採用 | 不採用 | 理由 |
| --- | --- | --- | --- |
| 相関単位 | リクエスト単位（群サイズ1） | セッション単位 | セッション横断は header/session token 新設が必要で schema/フィルタ非改修制約を破る。価値不確実 |
| batchId 生成位置 | route 層 | repository 層 | repository `Promise<boolean>` 維持で影響最小。audit 関心は route が保持 |
| payload キー名 | `batchId`（再利用） | 新キー `correlationId` 等 | 新キーだと `GET /admin/audit` の `json_extract('$.batchId')` 改修が必要 → AC-4 違反 |

## 残課題（Phase 10 / 未タスク検出へ引き継ぐ候補）

| 候補 | 分類 | 扱い |
| --- | --- | --- |
| セッション単位（複数リクエスト横断）相関 | scope out / 将来層 | 需要顕在化時に別 Issue。request header / session token 設計が前提。今サイクルでは起票しない（YAGNI） |

## Gate-A 判定

**PASS** — Phase 4（テスト作成）へ進む。Phase 1-3 設計確定: 相関 = リクエスト単位 / batchId = route 層生成 / payload は bulk 完全一致 / schema 変更なし。AC-1..6 は 1 実装サイクルで完了可能。

## 完了条件
- [x] 設計レビュー観点を全て PASS 判定
- [x] トレードオフ（相関単位 / 生成位置 / キー名）を確定
- [x] Gate-A passed を記録
