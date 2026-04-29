# unassigned-task-detection — 派生未アサインタスク検出

## 検出方針

本 UT-25 ワークフロー（Cloudflare Secrets 本番配置）の **スコープ外で発生する派生タスク** を抽出する。本ワークフローでカバーできるものは未アサイン扱いしない。

---

## current（本タスク完了で発生する派生タスク）

### UT-25-DERIV-01: SA Service Account key 定期ローテーション運用 SOP

| 項目 | 値 |
| --- | --- |
| 優先度 | HIGH |
| 親仕様候補 | `docs/30-workflows/unassigned-task/UT-25-DERIV-01-sa-key-rotation-sop.md`（新規） |
| 着手前提 | UT-25 Phase 13 完了（初回配置済） |
| 概要 | Google Service Account key の定期ローテーション運用 SOP を策定する。ローテーション頻度（例: 90 日 / 半年）/ 旧 key 失効猶予 / Cloudflare Secret 上書きの順序 / `apps/api` の無停止性確認手順を文書化する |
| 検出元 | Phase 11 `outputs/phase-11/main.md` §保証できない範囲 |

### UT-25-DERIV-02: SA key 失効監視

| 項目 | 値 |
| --- | --- |
| 優先度 | HIGH |
| 親仕様候補 | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md`（新規） |
| 着手前提 | UT-25 Phase 13 完了 + UT-26 完了（疎通テスト確立後でないと監視 alert の意味がない） |
| 概要 | SA key 失効・無効化（Google 側）を検出する仕組み。Sheets API 401/403 応答の監視 + Cloudflare Workers logs / Sentry alerting / 定期 health check の組合せ。失効時の rollback 経路を `outputs/phase-13/rollback-runbook.md` に逆参照する |
| 検出元 | Phase 11 `outputs/phase-11/main.md` §保証できない範囲 |

### UT-25-DERIV-03: Cloudflare Secret 監査ログ運用

| 項目 | 値 |
| --- | --- |
| 優先度 | MEDIUM |
| 親仕様候補 | `docs/30-workflows/unassigned-task/UT-25-DERIV-03-cf-secrets-audit-log.md`（新規） |
| 着手前提 | UT-25 Phase 13 完了 |
| 概要 | Cloudflare Workers Secret の参照・更新 audit log を Cloudflare API で取得し、誰がいつ secret を put/delete したかの記録を残す経路を整備する。本タスクの Phase 11 では smoke 実走者の手動ログのみで、システマティックな audit ではない |
| 検出元 | Phase 11 `outputs/phase-11/main.md` §保証できない範囲 |

### UT-25-DERIV-04: GitHub Actions 経由の secret 自動配置（将来）

| 項目 | 値 |
| --- | --- |
| 優先度 | LOW（MVP では不要） |
| 親仕様候補 | `docs/30-workflows/unassigned-task/UT-25-DERIV-04-cf-secrets-oidc-cd.md`（新規・将来） |
| 着手前提 | secret rotation が頻繁化したタイミング |
| 概要 | OIDC + Cloudflare API トークン経由で GitHub Actions から secret を put する CD パイプライン。MVP 段階では手動配置で十分（Phase 1 §機会コスト 参照） |
| 検出元 | Phase 1 `phase-01.md` §機会コスト |

---

## deferred（本タスク完了後に必要になる可能性があるが優先度低）

| ID | 内容 | 優先度 | 着手判断基準 |
| --- | --- | --- | --- |
| UT-25-DEFER-01 | Cloudflare Workers Secret bulk export（災害復旧用 backup） | LOW | DR 計画策定時 |
| UT-25-DEFER-02 | `.dev.vars` の op run 自動 wrap スクリプト整備 | LOW | ローカル開発者が増えた時 |

---

## 検出ルール

| 観点 | 検出根拠 |
| --- | --- |
| 「保証できない範囲」 | Phase 11 main.md §保証できない範囲 4 項目 |
| 「機会コスト」 | Phase 1 phase-01.md §機会コスト |
| 「正本反映結果」 | Phase 12 system-spec-update-summary.md §反映実行結果 |
| 「Phase 13 引き渡し」 | Phase 13 phase-13.md §次オペレーション |

## issue 登録タイミング

- UT-25-DERIV-01 / 02 / 03: Phase 13 PR マージ後ただちに登録
- UT-25-DERIV-04 / DEFER-01 / DEFER-02: 着手判断基準到達時に登録

> 本ファイルは検出のみ。実 issue 登録は Phase 13 完了後の別オペレーション。
