# Phase 11: 手動 smoke / 実測 evidence — 05b-followup-002-parallel-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-followup-002-parallel-auth-mail-env-contract-alignment |
| phase | 11 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

人手または外部環境でしか確認できない証跡を定義する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 未反映の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts
- apps/api/src/routes/auth/index.ts
- apps/api/src/services/mail/magic-link-mailer.ts

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/05b-followup-002-parallel-auth-mail-env-contract-alignment/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05b Magic Link provider, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b Magic Link callback follow-up, 09a staging auth smoke, 09c production deploy readiness

## 多角的チェック観点

- #16 secret values never documented
- #15 Auth session boundary
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない。
- プロトタイプと仕様書の採用/不採用を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md

## 完了条件

- env 名の正本が1つに統一される
- Cloudflare/1Password/runbook の配置先が一致する
- production で未設定時 fail-closed の仕様が明記される
- staging smoke で Magic Link メール送信設定を確認できる
- secret 実値が repo/evidence に残らない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、AC、blocker、evidence path、approval gate を渡す。
