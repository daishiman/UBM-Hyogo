# Phase 10: 最終レビュー — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 10 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 9 の品質ゲート結果を受けて、不変条件 #14 / #15 / #16 のチェックリストと上流 (05b 本体) / 下流 (05b-B / 09a / 09c) のブロック解消条件、user approval gate、`spec_created` どまりの境界を最終確認する。本 Phase の PASS は「仕様書としての整合 PASS」であり「production 実測 PASS ではない」ことを明示する。

## 不変条件チェックリスト

| # | 不変条件 | 確認項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- | --- |
| #16 | secret values never documented | env 名 / op:// 参照のみ記載 | Phase 9 の secret 実値検出 grep | 0 件 |
| #16 | secret values never documented | provider response body / token を outputs に転記しない | outputs/phase-*/ の手動レビュー | 0 件 |
| #15 | Auth session boundary | `AUTH_SECRET` を本タスクで触らない | Phase 2 採用 env 名表 / Phase 5 runbook | `AUTH_SECRET` は本タスク変更対象外と明記 |
| #15 | Auth session boundary | session JWT 経路 (`13-mvp-auth.md`) に影響なし | Phase 3 影響範囲表 | Magic Link send 経路のみ更新 |
| #14 | Cloudflare free-tier | 新規 Secret / Variable を増やさない | Phase 2 採用 env 名表 | 既存 3 値の name 確定のみ |
| #14 | Cloudflare free-tier | KV / D1 / cron の追加なし | Phase 1 / 2 影響範囲 | 追加なし |
| #14 | Cloudflare free-tier | Resend 1 経路維持（provider 切替なし） | Phase 2 決定理由 | provider は変更しない |

## 上流ブロック解消確認

| 上流 | 解消条件 | 本タスクでの達成 |
| --- | --- | --- |
| 05b Magic Link provider 本体 | 実装側 env 名（`MAIL_PROVIDER_KEY` 等）の再変更を要求しない | spec を実装に片寄せ済み（Phase 2） |
| `10-notification-auth.md` | 環境変数表の旧名置換方針が確定 | Phase 12 Step 1-A で更新計画化 |
| `08-free-database.md` | シークレット配置表の旧名置換方針が確定 | Phase 12 Step 1-A で更新計画化 |
| `environment-variables.md` / `deployment-secrets-management.md` | spec docs への cross-reference 追加 | Phase 12 Step 1-B で更新計画化 |

## 下流ブロック解消確認

| 下流 | 解消条件 | 本タスクでの提供物 |
| --- | --- | --- |
| 05b-B-magic-link-callback-credentials-provider | `AUTH_URL` / `MAIL_FROM_ADDRESS` の正本確定 | Phase 2 採用 env 名表 |
| 09a-A-staging-deploy-smoke-execution | staging smoke AC（secret list name 確認 + 200 + 受信トレイ到達） | Phase 11 readiness 手順 |
| 09c-A-production-deploy-execution | production fail-closed (502 `MAIL_FAILED`) 仕様化 | Phase 2 fail-closed 仕様 / Phase 6 異常系 |

## user approval gate 一覧

| # | 操作 | 承認主体 | 承認証跡 |
| --- | --- | --- | --- |
| 1 | spec docs (10-notification-auth.md / 08-free-database.md) の commit / push / PR | user | Phase 13 PR 作成承認 |
| 2 | aiworkflow references の commit / push | user | Phase 13 PR 作成承認 |
| 3 | Cloudflare Secrets への `MAIL_PROVIDER_KEY` 投入 (staging) | user | 本タスク範囲外。下流 09a または別 unassigned-task で実施 |
| 4 | Cloudflare Variables への `MAIL_FROM_ADDRESS` / `AUTH_URL` 投入 (staging) | user | 同上 |
| 5 | Cloudflare Secrets / Variables への投入 (production) | user | 本タスク範囲外。下流 09c で実施 |
| 6 | 旧名 (`RESEND_API_KEY` 等) の Cloudflare からの削除 | user | 旧名が誤投入されていた場合のみ。下流タスクで実施 |
| 7 | Magic Link 実送信 smoke (staging) | user | 下流 09a で実施 |
| 8 | production deploy 実行 | user | 下流 09c で実施 |

## `spec_created` どまりの境界明示

本タスクは下記境界を持つ。Phase 10 PASS は (a) 範囲内のみを保証する。

### (a) 本タスクの達成範囲（spec_created で完了）

- 採用 env 名 3 値の決定と決定理由の文書化
- 後方互換 alias 不採用の判断と根拠
- production fail-closed (502 `MAIL_FAILED`) の仕様化
- 同期マッピング表（Cloudflare / 1Password / `.env` op 参照 / docs）
- spec docs / aiworkflow references / runbook の更新計画
- staging smoke readiness 手順（secret list name 確認まで）

### (b) 本タスクの非達成範囲（下流タスクへ委譲）

- spec docs / aiworkflow / runbook の commit / push / PR（Phase 13 user 承認後）
- Cloudflare Secrets / Variables への実 secret 値投入
- 1Password Vault item の実値登録
- staging / production での Magic Link 実送信 smoke
- production deploy
- 旧名 (`RESEND_API_KEY` 等) が Cloudflare に既投入されている場合のクリーンアップ

> **境界宣言**: 本 Phase の PASS は「仕様整合 PASS」であり、「production 実測 PASS」ではない。実測 evidence は下流 09a / 09c タスクで取得する。

## レビュー結果サマリ

| 項目 | 結果 |
| --- | --- |
| 不変条件 #14 / #15 / #16 | 全 PASS（チェックリスト 7 項目） |
| 上流ブロック解消 | 4 件すべて条件確定 |
| 下流ブロック解消 | 3 件すべて条件確定 |
| user approval gate | 8 件列挙 |
| `spec_created` 境界 | (a) 達成 / (b) 非達成 を分離 |
| Phase 9 品質ゲート結果 | grep 0 / parity OK / typecheck・lint・test 対象外 |

## 実行タスク

1. 不変条件 #14 / #15 / #16 のチェックリストを 7 項目で確認する。完了条件: 全項目に確認方法と期待結果が紐付く。
2. 上流 4 件 / 下流 3 件のブロック解消条件を確認する。完了条件: 各タスクに「本タスクでの達成 / 提供物」が記載される。
3. user approval gate を 8 件列挙する。完了条件: 操作・承認主体・承認証跡が表で揃う。
4. `spec_created` どまりの (a) 達成範囲 / (b) 非達成範囲を分離する。完了条件: production 実測との境界が明文化される。

## 参照資料

- Phase 1（要件 / 影響範囲 / AC ↔ evidence path）
- Phase 2（採用 env 名 / 同期マッピング / fail-closed 仕様）
- Phase 3（3 系統レビュー / 4 条件評価 / 不変条件整合）
- Phase 9（grep 検証 / artifacts.json parity / typecheck・lint・test 対象外）
- docs/00-getting-started-manual/specs/13-mvp-auth.md（不変条件 #15 確認用）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う
- 本 Phase の PASS を `production 実測 PASS` と誤読させない記述を outputs に残す

## 統合テスト連携

- 上流: 05b Magic Link provider, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B-magic-link-callback-credentials-provider, 09a-A-staging-deploy-smoke-execution, 09c-A-production-deploy-execution

## 多角的チェック観点

- #16 secret values never documented: チェックリスト項目 1〜2 で値の不在を構造的に確認
- #15 Auth session boundary: `AUTH_SECRET` の据え置きを Phase 2 / Phase 5 で確認
- #14 Cloudflare free-tier: 新規 Secret / Variable / KV / D1 / cron 追加ゼロを確認
- 未実装/未実測を PASS と扱わない: 本 Phase の PASS は仕様整合のみであり、production 実測の代替にしない
- プロトタイプと仕様書の採用/不採用を混同しない: GAS prototype の `RESEND_*` は本レビューの対象外

## サブタスク管理

- [ ] 不変条件チェックリスト 7 項目を確認した
- [ ] 上流 4 件 / 下流 3 件のブロック解消条件を確認した
- [ ] user approval gate 8 件を列挙した
- [ ] `spec_created` 境界 (a) / (b) を分離した
- [ ] outputs/phase-10/main.md を作成した

## 成果物

- outputs/phase-10/main.md（不変条件チェックリスト / 上流下流ブロック解消 / approval gate 一覧 / spec_created 境界 / レビュー結果サマリ）

## 完了条件

- 不変条件 #14 / #15 / #16 のチェックリストが 7 項目すべて PASS で記録されている
- 上流 4 件 / 下流 3 件のブロック解消条件が確認されている
- user approval gate が 8 件列挙されている
- `spec_created` どまりであり production 実測 PASS ではない境界が明文化されている
- Phase 9 品質ゲート結果（grep / parity / typecheck・lint・test 対象外）が引き継がれている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 11（手動 smoke / 実測 evidence）へ次を渡す:

- 不変条件チェックリストの結果（PASS）
- approval gate 8 件のうち Phase 11 で扱う対象（gate #3 / #4 / #7）
- `spec_created` 境界（手順記述完了 ≠ production 実測 PASS）
- 下流 09a / 09c が要求する staging smoke readiness 形式
