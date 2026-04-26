# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 5 |
| 下流 | Phase 7 |
| 状態 | pending |

## 目的

queue / schema / attendance の異常系を **D1 失敗 / 状態遷移違反 / 削除済み混入 / race condition** の 4 軸で洗う。

## failure cases

### 軸 1: D1 失敗

| ID | ケース | 期待 |
| --- | --- | --- |
| F-1 | `meeting_sessions` insert 時の PK 重複 | `insertMeeting` throw（route 層で 409） |
| F-2 | `member_attendance` 同 PK の並列 INSERT | 1 件成功、もう 1 件は PK 違反 throw → catch で `{ ok: false, reason: "duplicate" }` |
| F-3 | `tag_definitions` の seed 未投入 | `listAllTagDefinitions` が `[]` 返却 → AC-6 fail（01a seed の前提崩壊を検知） |
| F-4 | `form_manifests` に `state='active'` 0 件 | `getLatestVersion` 返却 `null` |
| F-5 | D1 接続失敗 | repository throw → API 層で 5xx |

### 軸 2: 状態遷移違反

| ID | ケース | 期待 |
| --- | --- | --- |
| ST-1 | `transitionStatus(qid, "queued")` を `resolved` から | throw `IllegalStateTransition` |
| ST-2 | `transitionStatus(qid, "resolved")` を `queued` から（飛ばし） | throw |
| ST-3 | 存在しない `queueId` への transitionStatus | throw `queue not found` |
| ST-4 | `schemaDiffQueue.resolve` を未存在 diffId | UPDATE rowcount=0 確認、warning log |

### 軸 3: 削除済み混入 / 認可境界

| ID | ケース | 期待 | 不変条件 |
| --- | --- | --- | --- |
| A-1 | `addAttendance(deletedMember, ses)` | `{ ok: false, reason: "deleted_member" }` | #15 |
| A-2 | `listAttendableMembers(ses)` に削除済み混入 | items から除外 | #15 |
| A-3 | `tagDefinitions.create()` 等の write API 試行 | API 不在（型エラー） | #13 |
| A-4 | schema 変更を `/admin/schema` 以外から触る | repository は提供しない（route 層が判定）、ただし `schemaQuestions.updateStableKey` が直接呼ばれない設計 | #14 |
| A-5 | `apps/web` から `apps/api/src/repository/*` import | depcruise error | #5 |

### 軸 4: race condition

| ID | ケース | 期待 |
| --- | --- | --- |
| R-1 | 並列 `addAttendance(m, s)` × 2 | 1 件成功、他は `{ ok: false, reason: "duplicate" }` |
| R-2 | 並列 `transitionStatus(qid, "reviewing")` × 2（楽観 lock 無し） | 両方成功するが結果は等価（idempotent） |
| R-3 | 並列 `upsertManifest` で active 2 件 | 03a sync の transaction 責務（このタスクではスコープ外、申し送り） |
| R-4 | 並列 `enqueue(qid)` で同じ queueId | INSERT OR REPLACE で 1 件残る（idempotent） |

## runbook 対処マッピング

| ID | runbook 対処 step | placeholder 該当 |
| --- | --- | --- |
| F-1 | route 層で 409 変換 | 04c 申し送り |
| F-2 | Step 3 try/catch（PK 違反 → reason） | `addAttendance` |
| F-3 | sanity check で seed 確認 | 01a 完了確認 |
| F-4 | Step 6 `null` 返却 | `getLatestVersion` |
| F-5 | repository は throw、route 層 5xx | 04c 申し送り |
| ST-1〜ST-2 | Step 5 ALLOWED_TRANSITIONS で throw | `transitionStatus` |
| ST-3 | Step 5 `if (!current) throw` | 同上 |
| ST-4 | Step 6 `resolve` で UPDATE rowcount 確認 | 申し送り（warning log） |
| A-1 | Step 3 deleted_member reason | `addAttendance` |
| A-2 | Step 3 `listAttendableMembers` JOIN | 同 ファイル |
| A-3 | Step 4 write API 不在 | 構造で守る |
| A-4 | Step 6 schemaQuestions の `updateStableKey` 呼出は 07b 限定 | 申し送り |
| A-5 | depcruise rule | 02c 担当 |
| R-1 | Step 3 PK 制約 | `addAttendance` |
| R-2 | idempotent 設計 | OK |
| R-3 | 03a sync の transaction | 03a 申し送り |
| R-4 | INSERT OR REPLACE | `enqueue` |

## 実行タスク

1. failure case 4 軸を `outputs/phase-06/failure-cases.md` に
2. runbook 対処マッピングを `outputs/phase-06/main.md` に
3. 03a / 04c / 07b への申し送りを main.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 5 runbook | 対処 step |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | 状態遷移 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 7 | AC matrix 検証列 |
| 04c / 07a/b/c | 申し送り |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| attendance 重複 | #15 | F-2, R-1 |
| 削除済み除外 | #15 | A-1, A-2 |
| tag 直接編集 | #13 | A-3 |
| schema 集約 | #14 | A-4 |
| boundary | #5 | A-5 |
| 状態遷移 | — | ST-1〜ST-4 |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | F-1〜F-5 | pending |
| 2 | ST-1〜ST-4 | pending |
| 3 | A-1〜A-5 | pending |
| 4 | R-1〜R-4 | pending |
| 5 | 申し送り | pending |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-06/main.md | 対処マップ + 申し送り |
| outputs/phase-06/failure-cases.md | 4 軸全 18 ケース |

## 完了条件

- [ ] 18 ケース文書化
- [ ] 各ケースに対処 or 申し送り
- [ ] 不変条件 #5/#13/#14/#15 全てに対応 case

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-06/* 配置済み
- [ ] artifacts.json の Phase 6 を completed

## 次 Phase

- 次: Phase 7
- 引き継ぎ事項: failure case + 対処
- ブロック条件: 不変条件 4 件のいずれかに case 無しなら Phase 7 進めない
