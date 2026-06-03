# Phase 1 成果物: 要件定義

issue #1056（issue-57-followup-003）の要件定義主成果物。詳細な実行タスク・完了条件は `../../phase-01.md` を正本とする。

## 1. 背景

Issue #57 で KV/R2 free-tier limits を正本化し binding 棚卸し表（`deployment-cloudflare.md:308`）を新設したが、binding の活性状態と対応する Cloudflare alert policy の `enabled` 状態の整合は完全に手動依存。binding 活性 / free-tier 記録 / alert policy 有効化が #57 / UT-17-followup-006 / UT-33 に分散し、突き合わせる単一検証点が無い。

## 2. 既存 drift 検知との差分（他タスク解決済み調査）

- `cloudflare-alerts-drift.yml` + `diff.ts`：repo IaC 宣言 ↔ Cloudflare 実デプロイ Notification Policy の drift（**宣言 vs デプロイ**軸）。binding 活性を見ない。
- #1054（wrangler 三者ドリフト gate・未実装）：wrangler.toml ↔ env.ts 型 ↔ 棚卸し表（**型/棚卸し**軸）。alert policy enabled 次元を持たない。
- `scripts/` 全 grep で binding 活性 ↔ policy enabled を突合するスクリプトは 0 件。

→ **#1056 は他タスクで未解決**。issue アンカー（KV policy 2 件 enabled:false / r2-class-a enabled:true / ALERT_DEDUP_KV コメントアウト / SESSION_KV not applied / R2 3 binding active / 棚卸し表）は全て現行コードと一致し**陳腐化なし**。

## 3. 現状 binding↔policy 整合 baseline

| kind | wrangler 現状 | policy | enabled | 整合 |
| --- | --- | --- | --- | --- |
| KV | ALERT_DEDUP_KV コメントアウト / SESSION_KV 未適用 = inactive | workers-kv-writes-per-day / workers-kv-stored-bytes | false / false | 整合 |
| R2 | MEMBER_PHOTOS / UBM_AUDIT_COLD_STORAGE / UBM_AUDIT_APP_COLD_STORAGE = active | r2-class-a | true | 整合 |

→ 現時点の実ドリフトは **0 件**（baseline green）。価値は将来の有効化忘れ捕捉ガード + green baseline 確立。

## 4. 受入条件

AC-1〜AC-9（`../../index.md` の AC セクションを正本とする）。要点: 対応表明文化（AC-1）/ drift 2 種 read-only（AC-2）/ コメント尊重 parser（AC-3）/ baseline drift 0（AC-4）/ CLI サブコマンド（AC-5）/ 回帰 spec 6 ケース（AC-6）/ CI gate（AC-7）/ 棚卸し表追記 + 責務境界（AC-8）/ 4 条件 PASS（AC-9）。

## 5. 4 条件評価

価値性 / 実現性 / 整合性 / 運用性 すべて **PASS**（根拠は `../../phase-01.md` 4 条件評価テーブル）。

## 6. scope 再最適化

issue 原文の「設計のみ + CI gate 化 follow-up 分離可」を、CONST_004（実装必須）+ CONST_007（1 サイクル完結）に従い「検知モジュール + CLI + 回帰 spec + CI gate + 棚卸し表追記まで同一サイクル完結」へ最適化。CI gate は local-only で secret 不要のため分離する技術的理由が無い。

## 7. issue state 注記

`gh issue view 1056` 実測で **OPEN**（closedAt:null）。ユーザー認識「クローズド」と乖離するが Issue mutation は user-gated のため OPEN のまま spec 作成。
