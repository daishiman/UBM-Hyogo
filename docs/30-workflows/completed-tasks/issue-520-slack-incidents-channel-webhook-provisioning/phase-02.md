# Phase 2: 設計 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の AC-1〜AC-8 を満たす **channel 作成 / webhook 発行 / secret 配置 / runbook 整備 / redaction test 追記 / 関連ドキュメント反映** を最小責務で設計する。実装区分は実装仕様書のため、変更対象ファイルのパス・変更種別・データ構造・副作用・テスト方針・DoD・ローカル実行コマンドまでを Phase 2 で確定する。

## 入力

- Phase 1 確定 AC-1〜AC-8 / G1〜G4 / 自走禁止 / 用語集 / redaction pattern
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の route 実装方針
- `scripts/cf.sh` 実装
- `.env.example` 既存内容
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md`

## 出力（`outputs/phase-02/main.md` に確定）

1. 変更対象ファイル一覧（パス・変更種別）
2. データ構造（secret 命名規約 / 1Password item path 規約 / channel 命名規約）
3. 入力 / 出力 / 副作用 / Idempotency
4. webhook 共有 vs 分離 比較と確定（既定: production / staging で同一 webhook URL を共有 + prefix で識別）
5. redaction grep pattern 確定
6. テスト方針（unit / redaction / cf.sh secret list / staging→production 段階確認）
7. ローカル実行コマンド一覧
8. DoD（完了条件）

## 変更対象ファイル一覧

| パス | 変更種別 | 変更内容 |
| --- | --- | --- |
| `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/` 配下 | 新規 | 本タスク仕様書一式（index.md / artifacts.json / phase-01..13.md / outputs/） |
| `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` | 新規 | channel 作成 / webhook 発行 / 1Password 投入 / `cf.sh secret put` 投入 / GitHub Secrets 登録 / smoke 着弾確認の運用手順 runbook |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | channel 名 `ubm-hyogo-incidents` / webhook 命名 `SLACK_WEBHOOK_INCIDENT` / env-aware Slack prefix の運用規約を追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | `SLACK_WEBHOOK_INCIDENT` の正本配置先（1Password / Cloudflare Secrets staging+production / GitHub Secrets）と op:// 参照規約を追記 |
| `.env.example` | 編集 | `SLACK_WEBHOOK_INCIDENT="op://UBM-Hyogo/Slack Incident Webhook (production)/url"` プレースホルダーを追加。実値は書かない |
| `apps/api/src/routes/admin/smoke-observability.test.ts` | 編集 | redaction-safe レスポンステスト追記（response body / error path に `hooks.slack.com/services/[A-Z0-9]` fragment が含まれないこと、log mock に webhook URL が出力されないことの assertion） |
| `apps/api/src/routes/admin/smoke-observability.ts` | 確認のみ | webhook URL を response に含めない既存設計が継続していることを spot check（コード変更は issue-495 spec で完了済み前提のため Phase 11 まで原則編集しない。redaction 漏れがあれば Phase 9 で最小修正） |

## データ構造

### secret 命名規約

| 用途 | secret 名 | 配置先 |
| --- | --- | --- |
| 共通 | `SLACK_WEBHOOK_INCIDENT` | Cloudflare Workers secret (staging / production) / GitHub Actions secret / 1Password |

`SLACK_WEBHOOK_INCIDENT` は issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension が確定済みの命名を継続採用する（衝突なし）。

### 1Password item path 規約

| vault | item | field | 用途 |
| --- | --- | --- | --- |
| `UBM-Hyogo-Production` | `SLACK_WEBHOOK_INCIDENT` | `url` | production / staging 共有 incoming webhook URL（既定: 単一 webhook 共有 + prefix 識別） |
| `UBM-Hyogo-Staging`（任意分離時のみ） | `SLACK_WEBHOOK_INCIDENT` | `url` | staging 専用 webhook URL（webhook 分離方針を選んだ場合のみ作成） |

参照は `op://<vault>/<item>/<field>` 形式。実値は env / log / docs / commit に書かない。

### channel 命名規約

| 用途 | slug | 説明 |
| --- | --- | --- |
| incident 一次受け | `ubm-hyogo-incidents` | staging / production 双方の smoke / 実インシデント通知を集約。prefix で env 識別 |

## 入力 / 出力 / 副作用 / Idempotency

| 項目 | 内容 |
| --- | --- |
| 入力 | Slack workspace admin 操作 / 1Password CLI / `scripts/cf.sh` / `gh secret set` |
| 出力 | channel 作成 / webhook URL 発行 / 1Password item / Cloudflare secret 2 件 / GitHub secret 1 件 / runbook / observability-monitoring.md / deployment-secrets-management.md / .env.example / smoke-observability.test.ts |
| 副作用 | **不可逆**: Slack workspace への channel 作成と webhook 発行（削除は別操作）。1Password / Cloudflare / GitHub への secret 配置 |
| Idempotency | 既存 channel が存在すれば再利用（同名 channel を再作成しない）。既存有効 webhook が存在すれば再利用。1Password item は upsert。Cloudflare / GitHub secret は同名上書き |

## webhook 共有 vs 分離 比較

| 案 | 概要 | pros | cons | 採否 |
| --- | --- | --- | --- | --- |
| **A（既定採用）** | staging / production で同一 webhook URL を共有し、message prefix `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` のみで識別 | 1Password item / Slack webhook が 1 本で管理コスト最小・redaction gate も 1 pattern で網羅 | webhook URL 漏洩時の影響範囲が両 env に及ぶ | 採用 |
| B | staging / production で別 webhook を発行し別 URL を投入 | 漏洩時影響範囲を env で分離 | 1Password item 2 本 / Slack webhook 2 本 / runbook 複雑化 / prefix と URL の二重識別になり可読性低下 | 不採用（必要時は将来別タスクで再評価） |

> 既定 A を採用する根拠: AC-7 の redaction gate と `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` prefix（issue-495 spec で確定済み）で env 識別が成立し、漏洩時のローテーションコストも 1 本分で済むため。

## redaction grep pattern

repo 全域に対して以下の `rg` パターンが 0 hit であることを Phase 11 G4 / Phase 9 で確認する:

- `hooks\.slack\.com/services/[A-Z0-9]` — Slack incoming webhook host + path 先頭
- `B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}` — webhook URL の `B<id>/<token>` fragment
- `xox[bp]-` — Slack bot / user token（万一 bot 化した場合の誤混入検出）

## テスト方針

| 区分 | 内容 |
| --- | --- |
| unit / redaction | `apps/api/src/routes/admin/smoke-observability.test.ts` に response / error path で webhook URL fragment が返らないことの assertion を追加。`SLACK_WEBHOOK_INCIDENT` モック値は実 Slack ホストパターン（`hooks.slack.com/services/...`）を一切使わず、redaction-safe な組み立て fixture のみを使用する。test fixture にも実ホスト文字列を書き込まない |
| repo grep gate | `! rg -n 'hooks\.slack\.com/services/[A-Z0-9]'` を Phase 9 / Phase 11 G4 で実行 |
| cf.sh secret list | `bash scripts/cf.sh secret list --env staging` / `--env production` で `SLACK_WEBHOOK_INCIDENT` の name 存在確認（値は表示されない） |
| GitHub secret 確認 | `gh secret list --repo daishiman/UBM-Hyogo` で name のみ確認 |
| staging smoke | issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の staging route から POST し `[STAGING SMOKE]` prefix で `#ubm-hyogo-incidents` 着弾を Slack UI で確認 |
| production smoke | 同 production route + `x-smoke-production-confirm: YES` で POST し `[PRODUCTION SMOKE]` prefix 着弾を確認 |

## ローカル実行コマンド一覧（仕様書 phase で実行可能なもののみ）

```bash
# 仕様書整合確認
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 仕様書内 redaction 事前確認（実値混入防止）
rg -n 'hooks\.slack\.com/services/[A-Z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hits"
rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hits"
rg -n 'xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/ || echo "OK: 0 hits"

# Phase 11 で発火する操作（仕様書 phase では実行禁止 / 参考のみ）
# bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env staging
# bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env production
# bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
# gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo
```

## 検証コマンド

```bash
# 仕様書に実値混入なし
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}|xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# 必須セクション
grep -q "案 A\|webhook 共有" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-02/main.md
grep -q "G1\|G2\|G3\|G4" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-02/main.md
grep -q "ubm-hyogo-incidents\|SLACK_WEBHOOK_INCIDENT" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-02/main.md
grep -q "op://" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-02/main.md
```

## 成果物

- `outputs/phase-02/main.md`

## DoD（完了条件）

- [ ] 変更対象ファイル一覧（パス + 変更種別）が明示
- [ ] secret 命名規約 / 1Password item path 規約 / channel 命名規約が確定
- [ ] webhook 共有 vs 分離 の比較と採用案（A）の根拠が記録
- [ ] 入力 / 出力 / 副作用 / Idempotency が表化
- [ ] redaction grep pattern が確定
- [ ] テスト方針（unit / redaction / cf.sh / GitHub / staging+production smoke）が確定
- [ ] ローカル実行コマンド一覧が掲載
- [ ] G1〜G4 が Phase 1 から継承され、各 gate の実装側 hook（runbook / cf.sh / gh / smoke）と紐付け済み
- [ ] 実 webhook URL fragment / token が混入していない（grep gate PASS）

## 次 Phase への引き渡し

Phase 3 へ: 案 A 採用設計、変更対象ファイル一覧、命名規約 3 種、redaction pattern、テスト方針、DoD、G1〜G4 hook。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- [ ] 必須成果物が存在する
- [ ] runtime pending と static PASS の境界が明記されている

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
