# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-serial-production-deploy-and-post-release-verification |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 9 |
| Mode | serial（最終） |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の 13 ステップ deploy フロー / module 設計 / Mermaid に対して、alternative 3 案（deploy 戦略 / tag 戦略 / 24h verify 戦略）を比較し、PASS-MINOR-MAJOR 判定でレビューを締める。

## 実行タスク

1. alternative 3 案（deploy 戦略 / tag 戦略 / 24h verify 戦略）
2. PASS-MINOR-MAJOR 判定
3. 不変条件 #4/#5/#10/#11/#15 review
4. open question clearance（Phase 1 から繰り越し）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/_design/phase-3-review.md | review 観点 |
| 必須 | doc/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/phase-02.md | レビュー対象 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | production 正本 |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-03.md | review pattern |

## 実行手順

### ステップ 1: alternative 3 案
- A 案: blue/green deploy（preview 環境を一時 production 切替）
- B 案: canary deploy（一部 traffic のみ新版へ）
- C 案: in-place deploy（直接 production を上書き、wrangler rollback で復旧）

### ステップ 2: PASS-MINOR-MAJOR
- 4 領域 × 3 案

### ステップ 3: 不変条件 review
- #4/#5/#10/#11/#15

### ステップ 4: open question clearance

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採択案を verify suite 対象に |
| Phase 10 | review 結果を GO/NO-GO 根拠に |
| 上流 09a | staging で同戦略を採用済み（in-place 確認） |
| 上流 09b | rollback 手順 4 種を採択戦略に紐付け |

## 多角的チェック観点（不変条件）

- #4: 採択案で本人本文 override の経路がない
- #5: 採択案で web → D1 直接アクセスの経路がない
- #10: 採択案で cron / Workers / D1 が無料枠内
- #11: 採択案で admin が本人本文を編集できない
- #15: 採択案で attendance 重複 / 削除済みの整合性が rollback 後も保たれる

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 3 案作成 | 3 | pending | A / B / C |
| 2 | PASS-MINOR-MAJOR | 3 | pending | 12 セル |
| 3 | 不変条件 review | 3 | pending | #4/#5/#10/#11/#15 |
| 4 | open question clearance | 3 | pending | Phase 1 持ち越し |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | alternative 3 案 / PASS-MINOR-MAJOR |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 完了条件

- [ ] alternative 3 案
- [ ] PASS-MINOR-MAJOR 12 セル以上
- [ ] MAJOR 0 件、または差し戻し記録あり
- [ ] 不変条件 review 完了

## タスク100%実行確認【必須】

- 全実行タスクが completed
- main.md 完成
- artifacts.json の phase 3 を completed に更新

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採択案 C / PASS-MINOR-MAJOR 結果
- ブロック条件: MAJOR 残存で次 Phase に進まない

## Alternative 3 案

| 案 | 概要 | Pros | Cons |
| --- | --- | --- | --- |
| A | blue/green deploy（preview 環境を一時 production に昇格） | rollback が早い（DNS 切り戻し） | Cloudflare Workers preview の無料枠を消費、production URL の DNS 切替手順が複雑 |
| B | canary deploy（一部 traffic のみ新版） | 影響範囲を最小化 | Workers Routes / Pages の split traffic は MVP 対象外、設定コスト高 |
| C（採択） | in-place deploy（直接 production を上書き、wrangler rollback で復旧） | spec/15-infrastructure-runbook.md と一致、運用シンプル、無料枠負荷最小 | 一時的に新版が全 traffic を受ける（incident 時は wrangler rollback で 1〜2 分以内に復旧） |

## PASS-MINOR-MAJOR 判定

| 領域 | A | B | C |
| --- | --- | --- | --- |
| deploy 速度 | MINOR（DNS 切替） | MINOR（設定複雑） | PASS |
| rollback 速度 | PASS（DNS 切戻） | MINOR（traffic 戻し） | PASS（wrangler rollback） |
| 無料枠負荷 | MINOR（preview 倍） | PASS | PASS |
| 運用複雑度 | MAJOR（DNS 操作） | MAJOR（split traffic） | PASS |

採択: **C 案**（in-place deploy）。MAJOR 0、MINOR 0、PASS 4。staging 09a と同方式で運用統一。

## 不変条件 review 結果

| 不変条件 | 結果 | 根拠 |
| --- | --- | --- |
| #4 | PASS | C 案 deploy フローに本人本文 override 経路なし |
| #5 | PASS | web → D1 直接アクセスの経路なし、Phase 6 で build artifact 再確認 |
| #10 | PASS | C 案で 24h Cloudflare Analytics で確認、無料枠 10% 以下 |
| #11 | PASS | admin UI に編集 form なし、Phase 11 で確認 |
| #15 | PASS | rollback 後 attendance 重複防止 SQL を Phase 6 / 11 で確認 |

## tag 戦略レビュー

| tag 形式 | Pros | Cons | 判定 |
| --- | --- | --- | --- |
| `vYYYYMMDD-HHMM`（採択） | 時刻まで一意、視覚的にいつ deploy したかわかる | semver と機能的差分わからない | PASS（MVP 段階で十分） |
| semver `vMAJOR.MINOR.PATCH` | 機能的意味あり | MVP 段階では何が major / minor / patch か未確定、運用負荷高 | MINOR（後続 task で移行検討） |
| `release-<n>` | シンプル | 重複時に判別困難 | MINOR |

## 24h verify 戦略レビュー

| 戦略 | Pros | Cons | 判定 |
| --- | --- | --- | --- |
| 手動 dashboard 確認（採択） | コスト 0、Cloudflare Analytics で十分 | 人間の集中力依存 | PASS（MVP 段階で十分） |
| Cloudflare Analytics API + GitHub Actions | 自動化 | API 制限、Actions 無料枠負荷、設定コスト | MINOR（後続 task） |
| Sentry alert | 早期検知 | Sentry 本接続が別 task | MINOR（09b で placeholder のみ） |

## open question clearance

| Q | 結論 |
| --- | --- |
| Q1: tag を local で打つか CI で自動化か | local（MVP）、CI 化は後続 task |
| Q2: 24h SLA 違反時 hotfix path | 09b incident runbook の P0 / P1 経路 |
| Q3: incident runbook 共有先 placeholder を実値化するか | NO、`<placeholder>` のまま、share-evidence.md に「実値で送信した」のみ記録 |

すべて Phase 1 で先取り解決済み、Phase 3 で再確認。
