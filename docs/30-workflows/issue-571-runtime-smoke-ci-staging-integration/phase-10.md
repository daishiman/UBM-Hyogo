# Phase 10: 最終レビュー — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 / 13 |
| 入力 | Phase 1-9 全 outputs |
| 出力 | `outputs/phase-10/main.md`（最終レビュー結果 / Phase 11 着手可否判定 / blocker 一覧） |

## 目的

Phase 11（実測 evidence wave）に進む前に、**設計・実装・テスト・品質保証が首尾一貫している**ことを確認し、blocker / 残課題を確定する。

## レビュー観点

### A. 不変条件遵守
- INV #5（D1 直接アクセスは apps/api に閉じる）— 設計上は触れない。runtime 未実証
- INV #14（Cloudflare 無料枠維持）— 設計上は GitHub Actions 無料枠も含めて維持。runtime 未実証
- INV #16（secret 値を docs/log/PR/artifact に書かない）— grep gate Q-9 で保証。現 implementation cycle は secret 実値 0 件 grep で確認
- INV #17（incident response readiness）— Slack failure post 設計済み。runtime 未実証
- INV: Environment-scoped secret 分離 — AC-6 で設計済み。runtime 未実証

### B. AC 充足
全 AC-1〜AC-7 は evidence path / テスト / 異常系に設計上紐付いている（Phase 7 マトリクス）。runtime PASS は Phase 11 後にのみ記録する。

### C. 自走禁止操作
Phase 1 の自走禁止リスト 7 項目を Phase 5 / Phase 11 にも継承（commit / push / PR / Issue reopen / 実 secret 配置 / 実 smoke 発火 / 実 Slack post）。

### D. Issue #571 CLOSED 維持
本仕様書作成・後続実装でも Issue 状態を変更しない方針が一貫。

### E. 親タスク（issue-531）との整合
- issue-531 の `workflow_state: completed` を変更しない
- `runtime-attendance-provider.sh` への変更は **後方互換**（`--out-dir` 省略時に既存 path 維持）
- evidence canonical path 規約（summary-only / redaction）を本タスクが上書きしない

### F. 残課題（Phase 3 の R-1〜R-5 の状態）
| ID | 状態 | 引き継ぎ先 |
| --- | --- | --- |
| R-1 redaction 偽陰性 fixture | 設計上解消（T-1 F-4）/ 実装後検証 | Phase 4/9 |
| R-2 `set -x` 再発防止 | 設計上解消（Q-8 + verify-no-debug-trace）/ 実装後検証 | Phase 9 |
| R-4 required check 昇格 | ADR で 30 日連続 PASS gate に deferred | 別サイクル G5 |
| R-5 production 拡張 | scope out / staging 30 日観測後に起票・着手 | 別 Issue |

### G. blocker 一覧

| ID | blocker | 解消条件 |
| --- | --- | --- |
| B-1 | GitHub Environment `staging-runtime-smoke` 未作成 | G1 ユーザー承認 + 作成（Phase 11 wave） |
| B-2 | Environment secret 5 件未配置 | G1 同時 + `gh secret set --env staging-runtime-smoke ...` |
| B-4 | Slack incident webhook が test 環境で未動作 | G4 failure injection で実測 |
| B-5 | Issue #571 が CLOSED 状態の確認 | Q-13 ｇate 通過 |

## Phase 11 着手判定

- [ ] Phase 1-9 全 DoD 通過
- [ ] B-1〜B-5 のうち、Phase 11 evidence wave で解消する項目（B-1〜B-4）は **G1 ユーザー承認待ち**として明示
- [ ] B-5 は CI gate Q-13 で常時保証
- [ ] 仕様書全体に secret 実値が含まれていない

→ **判定: 本仕様書作成サイクル完了。後続実行サイクルで G1 承認後に Phase 5 実装 / Phase 11 evidence wave へ進む**

## 完了条件（DoD）

- [ ] 不変条件 A〜E 全件が `設計上充足 / runtime 未実証` として分類済み
- [ ] 残課題 R-1〜R-5 の状態が確定
- [ ] blocker B-1〜B-5 が列挙され Phase 11 着手前の解消条件が明示
- [ ] Phase 11 への引き渡し判定が明示
