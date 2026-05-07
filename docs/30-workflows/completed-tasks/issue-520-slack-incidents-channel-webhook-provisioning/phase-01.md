# Phase 1: 要件定義 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

CONST_004 適合根拠: 本タスクは Slack workspace 上の不可逆 SaaS 操作（channel 作成 / incoming webhook 発行）に加え、`scripts/cf.sh secret put` 経路での Cloudflare Workers secret 配置、1Password 正本 item 追加、GitHub Actions secret 登録、`apps/api/src/routes/admin/smoke-observability.test.ts` への redaction テスト追記、`.env.example` / `observability-monitoring.md` / `deployment-secrets-management.md` / runbook の編集を伴うため、コード・ドキュメント変更を含む実装タスクとして扱う。

CONST_007 適合根拠: 本タスクの全 13 phase は、後続実装プロンプトの 1 サイクル内で channel 作成・webhook 発行・3 本の secret 配置・redaction test 追記・runbook 化・staging/production 双方の smoke 着弾確認まで完遂できるスコープに収め、将来 PR / バックログ送りへの分離は行わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-520-slack-incidents-channel-webhook-provisioning |
| phase | 1 / 13 |
| wave | 09b-fu-prereq |
| mode | sequential |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #520 |
| extension_of | issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension |

## 目的

issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension が依存する `SLACK_WEBHOOK_INCIDENT` の **入手経路と配置経路** を確定する。具体的には以下を Phase 1 で AC / approval gate / evidence path / 自走禁止操作 / 用語として固定する:

1. Slack channel `#ubm-hyogo-incidents` の新規作成（既存時は再利用）
2. `#ubm-hyogo-incidents` 向け incoming webhook の発行
3. webhook URL の 1Password 保管（実値はドキュメントに残さない）
4. Cloudflare Workers staging / production secret への投入（`cf.sh secret put` 経由）
5. GitHub Actions secret 登録（CI smoke で参照する場合）
6. staging / production smoke endpoint からの prefix 別着弾確認
7. response / log / evidence / PR 本文での webhook URL fragment redaction-safe 担保

## 入力情報

- Issue #520 本文
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の AC-P1〜AC-P6（特に Slack prefix と redaction 要件）
- `apps/api/src/routes/admin/smoke-observability.ts` / `.test.ts`
- `apps/api/wrangler.toml`
- `scripts/cf.sh`
- `.env.example`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- CLAUDE.md（`scripts/cf.sh` 必須 / `wrangler` 直接禁止 / 1Password 参照のみ / 平文 `.env` 禁止）

## 出力（Phase 1 確定アウトプット）

`outputs/phase-01/main.md` に以下を確定する:

1. AC-1〜AC-8（後述）と各 AC の observable evidence path
2. 不変条件マッピング（INV #14 / #16 / #17 + webhook 実値非露出 INV）
3. 自走禁止操作リスト（実 channel 作成 / 実 webhook 発行 / 実 secret 投入 / 実 smoke 発火 / commit / push / PR / `wrangler` 直接実行）
4. multi-stage approval gate G1〜G4 の発動条件と通過記録 path
5. evidence path（channel-provisioning-log.md / webhook-smoke-log.md）
6. 用語集（incoming webhook / channel slug / webhook URL fragment / op:// 参照 / env-aware Slack prefix）

## AC（受入条件）

| AC | 内容 | observable evidence |
| --- | --- | --- |
| AC-1 | Slack workspace に `#ubm-hyogo-incidents` channel が存在し、incoming webhook integration（または bot）が posting 権限を保持 | `outputs/phase-11/channel-provisioning-log.md` の channel ID（`C...` 形式の前 4 文字のみ）と integration 名 |
| AC-2 | `#ubm-hyogo-incidents` 向け incoming webhook が発行され、URL 値が 1Password の所定 vault/item に保管されている。**実値はドキュメント・evidence・log のいずれにも記載しない** | `op://UBM-Hyogo/Slack Incident Webhook (<env>)/url` 参照 path のみを記録 |
| AC-3 | `SLACK_WEBHOOK_INCIDENT` が staging / production 双方の Cloudflare Workers secret として `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --env <env>` 経由で投入済み | `bash scripts/cf.sh secret list --env staging` / `--env production` の name-only 出力で `SLACK_WEBHOOK_INCIDENT` が両 env に存在 |
| AC-4 | GitHub Actions secret として `SLACK_WEBHOOK_INCIDENT` が登録されている（CI smoke で参照する経路がある場合のみ） | `gh secret list --repo daishiman/UBM-Hyogo` で name 確認 |
| AC-5 | staging smoke endpoint からのテスト POST が `[STAGING SMOKE]` prefix で `#ubm-hyogo-incidents` に着弾 | `outputs/phase-11/webhook-smoke-log.md` の Slack permalink（手動取得）と staging Sentry event id short |
| AC-6 | production smoke endpoint からのテスト POST が `[PRODUCTION SMOKE]` prefix で同 channel に着弾 | 同 log の production セクション permalink + production Sentry event id short |
| AC-7 | response / log / evidence / PR 本文に webhook URL の `B.../...` 以降（path / token fragment）が一切露出しない | redaction grep gate（`hooks\.slack\.com/services/[A-Z0-9]`）が repo 全域で 0 hit |
| AC-8 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md` に channel 名 `ubm-hyogo-incidents` と webhook 命名規則 `SLACK_WEBHOOK_INCIDENT` / op:// 参照規約が反映されている | 該当ファイルの diff |

## 不変条件マッピング

| INV | 反映観点 |
| --- | --- |
| #14 Cloudflare free-tier | incoming webhook は Slack free plan 範囲。Workers secret 投入も無料枠内 |
| #16 secret values never documented | webhook URL 実値・workspace token・bot token を一切ファイルに残さない |
| #17 incident response readiness | `#ubm-hyogo-incidents` を incident 一次受け channel として整備 |
| INV(env-isolation) | staging / production 双方に同名 secret を配置するが、値は同一 webhook URL を共用するか別 webhook を発行するかを Phase 2 で確定 |
| INV(slack-no-fragment) | `B<id>/<token>` URL fragment を grep gate で repo 全域から排除 |

## 自走禁止操作

仕様書作成（Phase 1〜3 / 4〜10）で実行しないこと:

1. 実 Slack channel `#ubm-hyogo-incidents` の作成
2. 実 incoming webhook の発行（Slack admin UI / API のいずれも）
3. 1Password 正本 item への実 webhook URL 投入
4. `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT` の発火（staging / production 双方）
5. `gh secret set SLACK_WEBHOOK_INCIDENT` の発火
6. staging / production smoke endpoint への実 POST
7. `git commit` / `git push` / PR 作成
8. `wrangler` の直接実行（必ず `bash scripts/cf.sh` 経由）

これらは Phase 11 で G1〜G4 の user approval を得てから初めて実行する。

## multi-stage approval gate G1〜G4

| gate | 発動条件 | 通過記録 path |
| --- | --- | --- |
| G1 | Slack channel 作成 + incoming webhook 発行を行う直前（Slack workspace への不可逆 SaaS 操作 gate） | `outputs/phase-11/channel-provisioning-log.md` の G1 セクション |
| G2 | 1Password 正本 item 追加 + Cloudflare **staging** secret 配置（`cf.sh secret put --env staging`）を行う直前 | `outputs/phase-11/channel-provisioning-log.md` の G2 セクション |
| G3 | Cloudflare **production** secret 配置（`cf.sh secret put --env production`）+ staging smoke PASS を確認した直後の production 着手 gate | `outputs/phase-11/webhook-smoke-log.md` の G3 セクション |
| G4 | production smoke PASS + redaction grep gate PASS + evidence 確定保存 gate | `outputs/phase-11/webhook-smoke-log.md` の G4 セクション |

## evidence path（staging / channel / webhook 分離）

- `outputs/phase-11/main.md` — Phase 11 概要 / G1〜G4 通過サマリ
- `outputs/phase-11/channel-provisioning-log.md` — channel 作成 / webhook 発行 / 1Password 投入 / Cloudflare staging secret 配置の作業記録（G1 / G2）
- `outputs/phase-11/webhook-smoke-log.md` — Cloudflare production secret 配置 / staging smoke 結果 / production smoke 結果 / redaction grep 結果（G3 / G4）

## 用語集

| 用語 | 定義 |
| --- | --- |
| incoming webhook | Slack の channel 単位 POST endpoint。`https://hooks.slack.com/services/...` 形式。実値は 1Password のみで保持 |
| channel slug | `#` を除いた channel 名。本タスクでは `ubm-hyogo-incidents` |
| webhook URL fragment | Slack incoming webhook URL（`hooks` の services path 配下の workspace ID / channel ID / token を含む path 文字列）のうち、workspace ID 以降の path token 部分。redaction gate の対象 |
| op:// 参照 | 1Password CLI の secret 参照記法。例: `op://UBM-Hyogo/Slack Incident Webhook (<env>)/url` |
| env-aware Slack prefix | issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension で確定済みの `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` prefix |
| name-only 確認 | `cf.sh secret list` の secret 名のみ列挙（値は表示されない）出力での存在確認 |

## 実行タスク

1. **AC を observable evidence path と 1:1 対応化**: AC-1〜AC-8 について各々 evidence の置き場と確認コマンドを Phase 1 output に明記する。完了条件: AC ごとに evidence path が 1 つ以上紐づく。
2. **自走禁止操作の明文化**: 上記 8 項目以上を列挙し、Phase 1〜10 の作業範囲と Phase 11 の発火範囲を明確化する。完了条件: 仕様書 phase で実行する操作が SaaS 副作用 0 件であることが読み取れる。
3. **G1〜G4 の依存関係確定**: G1（channel/webhook 作成）→ G2（1Password + staging secret）→ G3（production secret + staging smoke PASS）→ G4（production smoke + redaction）の linearity を明示する。完了条件: 各 gate の前提が前段 gate の通過に依存していることが図表で確認できる。
4. **redaction gate 設計**: webhook URL fragment の grep pattern を `hooks\.slack\.com/services/[A-Z0-9]` 等で固定し、Phase 11 までに何度でも再実行可能とする。完了条件: grep 0 hit を AC-7 の判定とする。
5. **既存 issue-495 spec との境界明確化**: 本タスクは route 実装に踏み込まず、`smoke-observability.test.ts` への redaction-safe 追記（response が webhook URL fragment を返さないことの assertion）に限定する。完了条件: scope out が index.md と整合。

## 制約事項

- webhook URL 実値・Slack workspace token・bot token を repo / docs / log / PR body / evidence にいかなる形でも書かない（INV #16）
- Cloudflare 無料枠維持（INV #14）
- secret 投入は `bash scripts/cf.sh secret put` の stdin 経由のみ。`wrangler secret put` 直接実行禁止
- `.env` には実値ではなく op:// 参照のみを記述（CLAUDE.md `.env` 運用ルール）
- 仕様書 phase（1〜10）では実 Slack 操作 / 実 secret 投入 / 実 smoke 発火 / commit / push / PR を実行しない
- production smoke の Slack message には実 user data を含めない（issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の規約継続）

## 検証コマンド

```bash
# 参照資料が存在
test -f apps/api/src/routes/admin/smoke-observability.ts
test -f apps/api/src/routes/admin/smoke-observability.test.ts
test -f apps/api/wrangler.toml
test -f scripts/cf.sh
test -f .env.example
test -f .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
test -f .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

# Phase 1 output が AC / gate / evidence path / 用語集を含む
grep -q "AC-1\|AC-8" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-01/main.md
grep -q "G1\|G4" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-01/main.md
grep -q "ubm-hyogo-incidents\|SLACK_WEBHOOK_INCIDENT" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-01/main.md

# 仕様書に実 webhook URL fragment が混入していないこと（grep gate prefigure）
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
```

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/`
- `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/artifacts.json`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- 本 phase は仕様確定のみ。実 channel / webhook / secret / smoke はいずれも未発火
- 後続 runtime wave で Phase 11 evidence contract に従い、channel-provisioning-log.md / webhook-smoke-log.md を分離取得する

## 完了条件

- [ ] AC-1〜AC-8 が observable evidence path と 1:1 で対応
- [ ] 不変条件マッピング（INV #14 / #16 / #17 + webhook 実値非露出 INV + env-isolation INV）が明示
- [ ] 自走禁止操作リスト（最低 8 項目）が明記
- [ ] G1〜G4 の発動条件と通過記録 path が明示
- [ ] evidence path（channel-provisioning-log.md / webhook-smoke-log.md）が決定
- [ ] 用語集に incoming webhook / channel slug / webhook URL fragment / op:// 参照 / env-aware Slack prefix が定義
- [ ] 実 webhook URL fragment / token / workspace token が含まれていない（grep gate PASS）

## タスク 100% 実行確認

- [ ] 必須セクションが全て埋まっている
- [ ] issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の route 実装範囲を侵食していない（scope out 整合）
- [ ] 実 Slack 操作 / 実 secret 投入 / 実 smoke 発火 / commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ:

- 確定 AC-1〜AC-8 と evidence path
- G1〜G4 gate 一覧
- 自走禁止操作リスト
- 用語集
- redaction grep pattern 候補
