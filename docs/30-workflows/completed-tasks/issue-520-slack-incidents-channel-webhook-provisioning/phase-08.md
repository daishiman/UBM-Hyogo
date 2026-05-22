# Phase 8: DRY 化 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

本タスクで導入する **secret 命名 / 1Password 参照規約 / channel 名 / redaction grep pattern / `cf.sh secret put` 投入手順** が、リポジトリ内で重複 / 散在しないように single source of truth (SSOT) へ集約する方針を確定する。issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の DRY 設計（D-01〜D-06）と整合させ、本タスクが新規導入するのは **運用面（channel / webhook / secret 配置 / runbook）の SSOT** に限定し、route 実装側 helper（`smokeMessagePrefix` / `sendSentrySmoke` / `sendSlackSmoke`）には触れないことを再確認する。

## 入力

- Phase 1〜7 確定 output（AC / 設計 / テスト戦略 / 実装ランブック / 異常系 / AC マトリクス）
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の Phase 8 DRY 検査観点（D-01〜D-06）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md`
- `scripts/cf.sh` 実装

## 検査観点（D-ID）

| D-ID | 観点 | SSOT 配置先 | 検査 |
| --- | --- | --- | --- |
| D-01 | secret 名 `SLACK_WEBHOOK_INCIDENT` 単一定義 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | staging / production / GitHub Secrets / 1Password / `.env.example` で同一名を使う。env で値を分けるが命名は変更しない |
| D-02 | 1Password 参照規約 `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` の DRY 化 | `deployment-secrets-management.md` の op:// 参照テーブル | 本タスク以降に追加される secret も同テーブルに集約。runbook / `.env.example` / phase-* 仕様書からは「テーブル参照」の形式で引用 |
| D-03 | channel 名 `ubm-hyogo-incidents` の単一定義 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | route コード（issue-495 spec で確定済み）/ runbook / phase-* 仕様書 / aiworkflow-requirements は同 reference を SSOT として参照のみ。コード側に文字列リテラルとして散在させない（必要時は env 経由で注入） |
| D-04 | redaction grep pattern の集約 | `scripts/redaction-grep.sh`（既存があれば追記、無ければ新規作成。新規作成判断は Phase 5 実装ランブックで確定） | `hooks\.slack\.com/services/[A-Z0-9]` / `B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}` / `xox[bp]-` の 3 pattern を 1 スクリプトに集約。Phase 9 / Phase 11 G4 / Phase 13 PR body 確認の 3 経路から同スクリプトを呼び出す |
| D-05 | `cf.sh secret put` stdin 投入のテンプレ化 | `scripts/cf.sh`（既存ラッパー）を確認。`secret put` サブコマンドが op run 経由で stdin から値を渡すテンプレートを runbook に明示。`scripts/cf.sh` 内に未定義であれば最小拡張する（拡張範囲は Phase 5 で確定） | runbook と phase-* 仕様書では `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env <env>` という単一形式のみ提示。`wrangler secret put` 直接実行を一切登場させない |
| D-06 | env-aware Slack prefix `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` の SSOT | `apps/api/src/routes/admin/smoke-observability.ts`（issue-495 spec で確定）+ `observability-monitoring.md` | 本タスクでは route コードに触れず、runbook / phase-* / test fixture では observability-monitoring.md を参照源として記述（リテラルを runbook 内に独立して再定義しない） |
| D-07 | redaction-safe テスト fixture | `apps/api/src/routes/admin/smoke-observability.test.ts` | route validation を通すため canonical host を分割結合で組み立てる。source 上に `hooks.slack.com/services/...` の連続 literal は置かず、`bash scripts/redaction-grep.sh .` で 0 hit を保証する |
| D-08 | runbook と phase-* 仕様書の重複排除 | `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` | channel 作成 / webhook 発行 / 1Password 投入 / `cf.sh` 投入 / GitHub Secrets 登録 / smoke 着弾確認の手順詳細は runbook が SSOT。phase-05 / phase-11 仕様書からは runbook へのリンクと gate 紐付けのみ記述する |

## 重複排除候補（具体）

### 1. `SLACK_WEBHOOK_INCIDENT` 命名

| 配置先 | 値の差異 | 命名 |
| --- | --- | --- |
| Cloudflare Workers secret (staging) | env scoped binding 値 | `SLACK_WEBHOOK_INCIDENT` |
| Cloudflare Workers secret (production) | env scoped binding 値 | `SLACK_WEBHOOK_INCIDENT` |
| GitHub Actions secret | repo scoped 値 | `SLACK_WEBHOOK_INCIDENT` |
| 1Password item | canonical 値 | `SLACK_WEBHOOK_INCIDENT` |
| `.env.example` | op:// 参照プレースホルダー | `SLACK_WEBHOOK_INCIDENT` |

DoD: 全配置先で同一名。env で値を分岐するが命名は不変。

### 2. op:// 参照規約 `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>`

DoD: `deployment-secrets-management.md` の secret 一覧表に行追加し、phase-* / runbook / `.env.example` 各所からはテーブル参照を促す記述のみとする。

### 3. channel 名 `ubm-hyogo-incidents`

DoD: `observability-monitoring.md` を SSOT とし、runbook / phase-* / aiworkflow-requirements 内の他 reference からはこの記述を引用する形にする。route コード（issue-495 担当）は env / config 経由で channel 名を扱うため、本タスクから新たな literal を導入しない。

### 4. redaction grep pattern

DoD: `scripts/redaction-grep.sh` の有無を Phase 5 実装ランブック冒頭で確認:

- 既存あり: 本タスクの 3 pattern が既に含まれていれば追記不要。差分があれば追記。
- 既存なし: 新規作成し、Phase 9 検証コマンド / Phase 11 G4 / Phase 13 PR body 確認の 3 箇所から `bash scripts/redaction-grep.sh` で呼び出す。

### 5. `cf.sh secret put` テンプレート

DoD: `scripts/cf.sh` に `secret put` サブコマンドが存在するか Phase 5 で確認。op run 経由で stdin から値を渡す形が既存実装で satisfied であれば追記不要。未対応であれば最小拡張（仕様: `bash scripts/cf.sh secret put <NAME> --config <path> --env <env>` で stdin から値を受け取り `wrangler secret put` を内部で実行）。

## SSOT 構造図

```
[SSOT]
 ├─ deployment-secrets-management.md
 │    ├─ secret 命名規約（SLACK_WEBHOOK_INCIDENT）
 │    └─ op:// 参照表（UBM-Hyogo/Slack Incident Webhook (<env>)/url）
 │
 ├─ observability-monitoring.md
 │    ├─ channel 名（ubm-hyogo-incidents）
 │    └─ env-aware prefix（[STAGING SMOKE] / [PRODUCTION SMOKE]）
 │
 ├─ scripts/redaction-grep.sh
 │    └─ 3 pattern（hooks.slack.com / B<id>/<token> / xox[bp]-）
 │
 ├─ scripts/cf.sh secret put
 │    └─ op run + stdin + wrangler secret put のラップ
 │
 └─ docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md
      └─ channel/webhook 発行 → 1Password → cf.sh → gh secret → smoke 確認の手順詳細

[参照側 — SSOT を引用するのみ]
 ├─ phase-04.md / phase-05.md / phase-11.md
 ├─ apps/api/src/routes/admin/smoke-observability.test.ts（fixture は無害値）
 └─ .env.example（op:// プレースホルダー）
```

## 重複検出時の集約方針

| 状況 | 方針 |
| --- | --- |
| phase-* / runbook に同じ手順が冗長記述 | runbook を SSOT、phase-* はリンク + gate 紐付けのみに整理 |
| redaction pattern の散在 | `scripts/redaction-grep.sh` に集約。phase-* には呼び出しコマンドのみ |
| op:// 参照表の重複 | `deployment-secrets-management.md` を SSOT、他は表参照のみ |
| `cf.sh secret put` ラッパー未対応 | 最小拡張で対応（Phase 5 実装ランブックで明記） |
| route 実装側 helper への波及 | issue-495 spec の責務。本タスクから触れない（FIX-NEEDED の場合は issue-495 へ差し戻し） |

## サブタスク管理

- [ ] D-01〜D-08 検査
- [ ] 重複検出表（命名 / op:// / channel / redaction / cf.sh / runbook）を `outputs/phase-08/main.md` に記録
- [ ] SSOT 構造図を記録
- [ ] FIX-NEEDED があれば戻し or DEFER の方針を明示

## 検証コマンド

```bash
# SSOT に集約されているか
test -f .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
test -f .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
test -f scripts/cf.sh

# 仕様書側に webhook 実値混入がない
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}|xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# Phase 8 output に必須 D-ID と SSOT 構造記述
grep -q "D-01\|D-08" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-08/main.md
grep -q "SSOT\|SLACK_WEBHOOK_INCIDENT\|ubm-hyogo-incidents" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-08/main.md
```

## 成果物

- `outputs/phase-08/main.md`（D-01〜D-08 判定表 / SSOT 構造図 / 重複排除方針）

## 完了条件

- [ ] D-01〜D-08 すべてに判定（PASS / FIX-NEEDED / FORWARD）
- [ ] secret 命名 / op:// 参照 / channel 名 / redaction pattern / `cf.sh secret put` テンプレ / runbook の各 SSOT が確定
- [ ] route 実装側 helper（issue-495 担当）に波及していないことを再確認
- [ ] FIX-NEEDED があれば戻し先（Phase 2 / 5 / runbook 改修）が明示
- [ ] 実 webhook URL fragment / token 混入なし（grep gate PASS）

## 次 Phase への引き渡し

Phase 9 へ: DRY 検査結果（PASS / FORWARD）/ SSOT 構造図 / 集約済み redaction grep スクリプト経路 / `cf.sh secret put` テンプレ確定状況。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
