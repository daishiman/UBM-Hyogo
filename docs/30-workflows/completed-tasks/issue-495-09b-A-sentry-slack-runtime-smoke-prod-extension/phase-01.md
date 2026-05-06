# Phase 1: 要件定義 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

CONST_004 適合根拠: 本タスクは `apps/api/src/routes/admin/smoke-observability.ts` の production 分岐拡張、対応する vitest 追加、`wrangler.toml` `[env.production.vars].ENVIRONMENT` / Worker name 確認、`scripts/cf.sh secret list/put` 経由の production secret name-only 確認・配置を伴うため、コード変更を伴う実装タスクとして扱う。Workers secrets は `wrangler.toml` に binding 宣言しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension |
| phase | 1 / 13 |
| wave | 09b-fu-extension |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #495 + production 拡張 |

## 目的

Issue #495 が staging まで確定した実 Provider smoke 経路を **production 環境にも redaction-safe に拡張する** ための AC / approval gate / evidence path / 自走禁止操作 / 用語を確定する。

## 入力情報

- Issue #495 本文（staging AC-1〜AC-5）
- 旧実装 baseline `apps/api/src/routes/admin/smoke-observability.ts`（Issue #495 production extension 前は `c.env.ENVIRONMENT === "production"` 時 404 分岐）
- `apps/api/src/routes/admin/smoke-observability.test.ts`
- `apps/api/wrangler.toml`（`[env.staging]` / `[env.production]`）
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/`（staging 仕様正本）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- CLAUDE.md（`scripts/cf.sh` 必須 / `wrangler` 直接禁止 / 1Password 参照のみ）

## 出力（Phase 1 確定アウトプット）

`outputs/phase-01/main.md` に以下を確定する:

1. AC（staging 既存 AC-1〜AC-5 を継承 + production AC-P1〜AC-P6 を追加）
2. 不変条件マッピング（INV #14 / #16 / #17 + production env 境界 INV）
3. 自走禁止操作リスト（実 production secret 投入 / production smoke 実行 / commit / push / PR）
4. approval gate G1〜G4 の発動条件
5. evidence path（staging / production を分離）
6. 用語集（production_confirm header / env-aware Slack prefix / Sentry environment tag / multi-stage approval）

## 実行タスク

1. **production 拡張要件抽出**: 既存 staging 仕様の差分として「production 環境で実 smoke を許可する条件」「誤発火防止の追加 gate」「Slack 通知混線防止」「evidence 分離」の 4 点を抽出する。完了条件: 各点に AC が 1 つ以上紐づく。
2. **production AC を observable な事象に分解**: `x-smoke-production-confirm` ヘッダ必須化、`[PRODUCTION SMOKE]` prefix、production tag 付き Sentry event、redaction-safe response、G1〜G4 通過記録、staging/production evidence 分離。完了条件: AC-P1〜AC-P6 に observable evidence path を 1:1 で対応させる。
3. **multi-stage approval gate 設計**: G1（production secret 配置承認）/ G2（staging PASS 確認後の production 着手承認）/ G3（production smoke 実行承認）/ G4（evidence 確定承認）。完了条件: 各 gate の前提・通過記録 path・実行可能操作が明示される。
4. **Slack channel / prefix 戦略の確定**: 既定方針は `[PRODUCTION SMOKE]` prefix + 任意 `#smoke-test` 別 webhook 採用可。 webhook を分けるか prefix のみで運用するかは Phase 2 で確定する前提とし、Phase 1 ではどちらでも AC-P3 を満たせる状態にする。
5. **secret 命名整合確認**: production 環境でも staging と同じ secret 名（`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN`）を使う。値は別 1Password item 化し Cloudflare env-scoped Secret として分離する。完了条件: `cf.sh secret list --env production` の name-only 出力で命名重複なく env で区別可能。
6. **自走禁止操作の確定**: 実 production secret 配置、production smoke 発火、commit、push、PR 作成、`wrangler` 直接実行を gate 化。完了条件: 自走禁止 6 項目以上が列挙される。

## 制約事項

- production secret 値・staging secret 値を repo / docs / log / PR body / evidence にいかなる形でも書かない（INV #16）
- Cloudflare 無料枠維持（INV #14）。Sentry / Slack いずれも free plan 前提
- secret 投入は `bash scripts/cf.sh secret put` の stdin 経由のみ（CLAUDE.md 必須ルール）
- 本仕様書作成 phase（Phase 1-3）では route 編集 / test 追加 / deploy / 実 secret 投入 / commit / push / PR を行わない。`wrangler.toml` は env 名・Worker 名確認とコメント補足に限り、secret 実値・secret binding 宣言は追加しない
- production smoke の Slack message には実 user data を含めない（`UBM observability test <ISO8601>` 等の固定 message のみ）

## 検証コマンド（要件確定の確認）

```bash
# 参照資料が存在
test -f apps/api/src/routes/admin/smoke-observability.ts
test -f apps/api/src/routes/admin/smoke-observability.test.ts
test -f apps/api/wrangler.toml
test -d docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke

# Phase 1 output が AC / gate / evidence path / 用語集を含む
grep -q "AC-P1\|AC-P6" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-01/main.md
grep -q "G1\|G4" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-01/main.md
grep -q "production_confirm\|production-confirm" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-01/main.md

# 仕様書に実 secret 値が混入していない（grep gate prefigure）
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/
```

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/index.md`
- `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/artifacts.json`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- 本 phase は仕様確定のみ。実 smoke / 実 production secret 投入はしない。
- 後続 runtime wave で Phase 11 evidence contract に従い、staging-smoke-log.md / production-smoke-log.md を分離取得する。

## 完了条件

- [ ] AC-P1〜AC-P6（production 追加分）が observable evidence path と 1:1 で対応
- [ ] AC-1〜AC-5（staging 既存）が継承され継続有効と明記
- [ ] G1〜G4 の発動条件と通過記録 path が明示
- [ ] 自走禁止操作リストが明記（最低: 実 production secret 投入 / production smoke 発火 / commit / push / PR / wrangler 直接実行）
- [ ] 用語集に production_confirm header / env-aware prefix / Sentry environment tag / multi-stage approval が定義
- [ ] 実 secret 値が含まれていない（grep gate PASS）

## タスク 100% 実行確認

- [ ] 必須セクションが全て埋まっている
- [ ] 完了済み 09b-A 本体の復活ではなく production 拡張 follow-up である旨が明示
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ:

- 確定 AC-P1〜AC-P6 と evidence path
- G1〜G4 gate 一覧
- 自走禁止操作リスト
- 用語集
