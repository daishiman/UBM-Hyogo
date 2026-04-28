# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6（異常系検証） |
| 次 Phase | 8（DRY 化） |
| 状態 | pending |

## 目的

AC-1〜AC-10 × verify × impl × failure × audit を 1 表に集約し、未対応 AC を 0 にする。

## 実行タスク

1. matrix 作成、独立保存。
2. 未対応抽出。
3. gate 評価。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/test-matrix.md | test mapping |
| 必須 | outputs/phase-05/main.md | 関数 |
| 必須 | outputs/phase-06/failure-cases.md | failure |

## 実行手順

### ステップ 1: matrix 作成
- 後述参照。

### ステップ 2: 未対応抽出
- 全 AC が verify / impl / failure / audit 列を持つ。

### ステップ 3: gate
- AC 全 green ならフェーズ 8 へ。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix を見て命名整理 |
| Phase 10 | gate 根拠 |
| Wave 8a | contract test 素材 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | AC-3 + AC-8 を mapping |
| responseEmail | #3 | AC-4 を mapping |
| 上書き禁止 | #4 | snapshot は consent のみ |
| ID 混同 | #7 | AC-7 を type test に mapping |
| schema 集約 | #14 | AC-2 を queue mapping |
| 無料枠 | #10 | AC-10 を runbook + counter mapping |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | matrix 作成 | 7 | pending | 10 行 |
| 2 | 未対応抽出 | 7 | pending | 0 件目標 |
| 3 | matrix 独立保存 | 7 | pending | ac-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | matrix |
| メタ | artifacts.json | phase 7 を `completed` |

## 完了条件

- [ ] AC-1〜AC-10 すべて 4 列埋め
- [ ] 未対応 0

## タスク100%実行確認【必須】

- [ ] サブタスク 3 件すべて completed
- [ ] AC-7 type test mapping
- [ ] AC-8 lint rule mapping
- [ ] AC-10 counter / runbook mapping
- [ ] artifacts.json の phase 7 が `completed`

## 次 Phase

- 次: 8（DRY 化）

## AC matrix

| AC | 内容 | verify (Phase 4) | impl 関数 (Phase 5) | failure (Phase 6) | audit / ledger |
| --- | --- | --- | --- | --- | --- |
| AC-1 current_response 切替 | pick-current-response.spec / forms-response-sync.spec / contract member_identities | resolveIdentity + pickCurrentResponse + memberIdentitiesRepo.setCurrent | FC-14 | sync_jobs.metrics_json.processed |
| AC-2 unknown → extra + queue | normalize-answer.spec + diffQueueWriter / contract response_fields + schema_diff_queue | normalizeAnswer + responseFieldsRepo.upsertExtra + schemaDiffQueueRepo.enqueue | FC-11 | schema_diff_queue insert |
| AC-3 consent snapshot | extract-consent.spec + snapshot-consent.spec / contract member_status | extractConsent + snapshotConsent | FC-12, FC-17 | member_status update |
| AC-4 responseEmail = system field | resolve-identity.spec / contract member_responses.response_email | resolveIdentity + memberResponsesRepo.upsert | - | member_responses row |
| AC-5 cursor pagination | cursor-store.spec / forms-response-sync.spec | cursorStore.read/write + runResponseSync loop | FC-9, FC-15 | sync_jobs.metrics_json.cursor |
| AC-6 同種 job 排他 | forms-response-sync.spec | syncJobs.tryAcquire | FC-6 | sync_jobs running 行 |
| AC-7 ID 混同禁止 | type test | Brand<> 型 import | FC-16 | TS compile |
| AC-8 ruleConsent 排除 | extract-consent.spec / lint | extractConsent + lint rule | FC-10 | lint CI |
| AC-9 is_deleted skip | snapshot-consent.spec / contract member_status 不変 | snapshotConsent | FC-17 | member_status 差分なし |
| AC-10 D1 write < 200 / sync | forms-response-sync.spec | writes counter + break | FC-19 | sync_jobs.metrics_json.writes |

## 未対応 AC

- 0 件
