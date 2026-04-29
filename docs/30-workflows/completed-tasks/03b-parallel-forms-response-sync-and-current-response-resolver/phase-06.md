# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 5（実装ランブック） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | pending |

## 目的

401 / 403 / 404 / 422 / 5xx / cursor lost / 二重起動 / quota / responseEmail 重複 / 旧 ruleConsent / consent 撤回 / 削除済み の failure case を網羅し、検出 / 期待挙動 / runbook 追記を整理する。

## 実行タスク

1. failure case 14 件以上列挙。
2. リスク R-1〜R-8（Phase 3）と対応付け。
3. sync_jobs.error 形を確定（job_type 別）。
4. retry / cursor 復旧戦略を runbook に追記する旨を残す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-03/main.md | リスク |
| 必須 | outputs/phase-04/main.md | test |
| 必須 | outputs/phase-05/main.md | runbook |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | sync 運用 |

## 実行手順

### ステップ 1: failure case 列挙
- 後述参照、独立保存。

### ステップ 2: リスク mapping
- R-1（cursor lost） → FC-9, FC-15
- R-2（quota） → FC-7
- R-3（email 重複） → FC-13
- R-4（unknown 漏れ） → FC-11
- R-5（二重起動） → FC-6
- R-6（snapshot 上書き事故） → FC-12
- R-7（タイ時不安定） → FC-14
- R-8（ruleConsent 旧名） → FC-10

### ステップ 3: error 形
- 03a と共通 `{ code, message, metrics_json }`、metrics_json に cursor / responseEmail / questionId を含めない（PII 配慮）。

### ステップ 4: retry / cursor 復旧
- 5xx / 429: exponential backoff 3 回
- cursor lost: `?fullSync=true` で手動復旧

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC への影響 |
| Phase 9 | 無料枠と secret hygiene |
| Phase 11 | 手動 smoke で一部再現 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | FC-10 で旧 ruleConsent 検出 |
| responseEmail | #3 | FC-13 で UNIQUE 違反対応 |
| 上書き禁止 | #4 | FC-12 で publish_state 触らない確認 |
| ID 混同 | #7 | FC-16 で型 brand 違反検出 |
| schema 集約 | #14 | FC-11 で diff queue 漏れ防止 |
| 無料枠 | #10 | FC-7, FC-15 で retry 上限 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case 列挙 | 6 | pending | 14+ |
| 2 | リスク mapping | 6 | pending | R-1〜R-8 |
| 3 | error 形 | 6 | pending | PII 抜き |
| 4 | retry / cursor 復旧 | 6 | pending | runbook 追記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | サマリ |
| ドキュメント | outputs/phase-06/failure-cases.md | 表 |
| メタ | artifacts.json | phase 6 を `completed` |

## 完了条件

- [ ] failure case 14+ 件
- [ ] R-1〜R-8 全 mapping
- [ ] error 形 PII 抜き

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] failure-cases.md 14 行以上
- [ ] R-1〜R-8 mapping 済み
- [ ] artifacts.json の phase 6 が `completed`

## 次 Phase

- 次: 7（AC マトリクス）

## failure cases

| ID | ケース | 検出 | 期待 | HTTP | sync_jobs.status |
| --- | --- | --- | --- | --- | --- |
| FC-1 | 未ログイン | authz | 401 | 401 | - |
| FC-2 | 一般会員 | authz | 403 | 403 | - |
| FC-3 | 鍵不正 | runResponseSync 例外 | failed code='AUTH_FAIL' | 500 | failed |
| FC-4 | Forms 401 | client | failed code='FORMS_AUTH' | 502 | failed |
| FC-5 | Forms 5xx | retry 3 回 → failed | failed code='FORMS_5XX' | 502 | failed |
| FC-6 | 同種 running | sync_jobs lock | 409 | 409 | - |
| FC-7 | Forms 429 quota | retry 3 → failed | failed code='QUOTA' | 502 | failed |
| FC-8 | nextPageToken 無限ループ | counter limit 100 | failed code='LOOP' | 500 | failed |
| FC-9 | cursor 不正値 | listResponses 400 | retry 1 → failed code='CURSOR_INVALID'、`?fullSync=true` で復旧 | 502 | failed |
| FC-10 | answer に旧 ruleConsent | extract-consent 正規化 | rulesConsent に正規化、success | 200 | succeeded |
| FC-11 | unknown を queue 投入忘れ | unit test | unit fail | - | - |
| FC-12 | snapshot で publish_state 上書き | snapshot-consent unit | unit fail（snapshot は consent のみ） | - | - |
| FC-13 | response_email UNIQUE 違反 | DB constraint | failed code='EMAIL_CONFLICT'、admin alert | 500 | failed |
| FC-14 | submittedAt タイ | pick-current-response unit | responseId desc tiebreak | - | - |
| FC-15 | cursor lost（metrics_json null） | cursor-store | full sync を fallback | 200 | succeeded |
| FC-16 | type 違反（MemberId / ResponseId 混同） | TS compile | compile error | - | - |
| FC-17 | is_deleted=true で snapshot | snapshot-consent | skip、status 不変 | 200 | succeeded |
| FC-18 | D1 timeout | catch | failed code='DB_TIMEOUT' | 500 | failed |
| FC-19 | per sync write 200 超過 | runResponseSync の writes counter | 200 で break、次回 cron 再開 | 200 | succeeded（partial） |

## sync_jobs.error 構造

```json
{
  "code": "FORMS_5XX",
  "message": "Google Forms returned 503 after 3 attempts",
  "metrics_json": { "job_type": "response_sync", "attempt": 3 }
}
```

PII（responseEmail / responseId / questionId）は metrics_json に含めない。

## retry / cursor 復旧

| 層 | 回数 | 間隔 | 失敗後 |
| --- | --- | --- | --- |
| Forms 5xx / 429 | 3 | 1s/2s/4s | failed → 次 cron |
| Forms timeout | 1 | - | failed → 次 cron |
| cursor invalid | 1 | - | `?fullSync=true` を runbook に明記 |
| D1 write fail | 0 | - | 即 failed |
| ledger close fail | 1 | 200ms | console.error |
