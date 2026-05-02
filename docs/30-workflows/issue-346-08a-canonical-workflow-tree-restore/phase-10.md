# Phase 10: ロールアウト / 後続連携

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 10 / 13 |
| Phase 名称 | ロールアウト / 後続連携 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 9 (セキュリティ / boundary 検証) |
| 次 Phase | 11 (evidence 取得) |
| 状態 | completed |

## 目的

本タスクが merge された後の (1) 09a / 09b / 09c の上流 contract gate 表現の確定、(2) 08a follow-up が新たに発生した場合の起票先方針、を確定する。本タスクは docs-only のため deploy / runtime rollout は無く、merge = rollout 完了とみなす。

## 09a / 09b / 09c の上流 contract gate 表現

A 採用前提で、以下の文言を 09a / 09b / 09c spec の「上流依存」「dependencies」セクションに反映する:

| 旧表現 | 新表現 |
| --- | --- |
| `08a-parallel-api-contract-repository-and-authorization-tests` を上流 contract gate とする | `08a-parallel-api-contract-repository-and-authorization-tests`（08a follow-up）を上流 contract gate とする |
| 上流: 旧 `02-application-implementation/08a-*` 系 path | 上流: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`（復元済み canonical root） |

09a-c spec が現時点で物理不在の場合、本表現の反映は当該 spec 作成時の責務とし、本タスクからは「`unassigned-task-detection.md` に新規未タスクとして 09a-c spec 作成を起票」する経路で引き継ぐ。

## 08a follow-up 起票先方針

08a 系列に新たな improvement / bug fix / migration が発生した場合の起票先を以下に固定する:

| 種別 | 起票先 | 理由 |
| --- | --- | --- |
| 既存 UT-08A-01〜06 範囲のテスト追加 | 該当 UT-08A-* に追記または新規 UT-08A-NN 起票 | 08a partial close-out の follow-up |
| 08a 自体を canonical workflow に「再昇格」させたい場合 | 新規 issue + 新規仕様書（本タスクの逆操作） | C → A 復元は別タスクとして扱う |
| 09a-c から見て 08a の AC が不足 | 新規 UT-08A-NN として `unassigned-task/` に起票 | 09a-c spec の AC drift 防止 |

## 後続タスクへの引き継ぎ事項

| 後続 | 引き継ぎ内容 |
| --- | --- |
| 09a-staging-deploy | 上流 contract gate 表現の置換（PR merge 後即適用可） |
| 09b-observability-and-cd-post-deploy | 同上 |
| 09c-serial-production-deploy-and-post-release-verification | 同上（最重要、production gate trace の根拠） |
| aiworkflow-requirements 全般 | `legacy-ordinal-family-register.md` の `current/partial` 状態語が今後増えた場合の参照例として本タスク差分が参考になる |

## rollout 完了判定

| 観点 | 判定基準 |
| --- | --- |
| broken link 解消 | `9a-9b-9c-link-check.log` PASS |
| aiworkflow drift 0 | `verify-indexes.log` PASS |
| canonical restoration 表現の統一 | `08a-reference-grep.log` の残存が canonical restoration 注記付きのみ |
| CI gate 通過 | `verify-indexes-up-to-date` workflow が green |

## 監視 / 復旧

- 監視: 後続 PR で 08a canonical path への直接参照が再発しないかを `verify-indexes-up-to-date` gate と markdown link check で継続検知。
- 復旧: drift が再発した場合、本仕様書の Phase 5 runbook を再実行して原状回復可能（docs-only のため安全）。

## 完了条件

- 09a-c の上流 contract gate 表現が新旧対比で確定
- 08a follow-up 起票先方針が表として確定
- 後続タスクへの引き継ぎ事項が明示
- rollout 完了判定基準が定義
- `outputs/phase-10/main.md` に記録

## 成果物

- `outputs/phase-10/main.md`
