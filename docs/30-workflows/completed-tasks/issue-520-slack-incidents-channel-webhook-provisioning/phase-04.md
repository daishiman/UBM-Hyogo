# Phase 4: テスト戦略 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜3 で確定した AC-1〜AC-8 / G1〜G4 / 設計（webhook 共有案 A / redaction pattern / 変更対象ファイル）に対し、**redaction-safe を最重要要件として** unit / integration / smoke / redaction grep / secret-verify の 5 区分でテスト戦略を確定する。本 Phase は仕様確定のみ。実 channel 作成 / 実 webhook 発行 / 実 secret 投入 / 実 smoke 発火は Phase 11 で G1〜G4 を順次通過させて実行する。

## 入力

- Phase 1 AC-1〜AC-8 / 自走禁止 8 項目 / G1〜G4
- Phase 2 設計 output（変更対象ファイル / 案 A / redaction pattern / テスト方針）
- Phase 3 GO 判定（SYS-01〜05 / STR-01〜04 / PRB-01〜05）
- `apps/api/src/routes/admin/smoke-observability.ts`
- `apps/api/src/routes/admin/smoke-observability.test.ts`
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の test 規約（`production-confirm` ヘッダ仕様 / token mismatch 仕様）

## テスト分類表

| 区分 | 目的 | 対象 | 実行 phase | 失敗時の treatment |
| --- | --- | --- | --- | --- |
| unit | route の境界条件（confirm 必須 / token mismatch / response shape） | `apps/api/src/routes/admin/smoke-observability.test.ts` | Phase 9 / CI | fail-fast、修正後 re-run |
| redaction (unit) | response / error path / log mock に webhook URL fragment が露出しないこと | 同上 | Phase 9 / CI | fail-fast、redaction 漏れは Phase 2 設計レビューに差し戻し |
| redaction (repo grep) | repo 全域に webhook URL / token fragment が混入しないこと | repo 全域 | Phase 9 / Phase 11 G4 / Phase 13 PR 直前 | fail-fast、commit / push / PR ブロック |
| secret-verify | Cloudflare staging+production / GitHub / 1Password に `SLACK_WEBHOOK_INCIDENT` が name レベルで存在すること（値非表示） | `cf.sh secret list` / `gh secret list` / `op item get` | Phase 11 G2 / G3 直後 | secret 不在なら G2/G3 差し戻し |
| smoke (staging) | staging route から `[STAGING SMOKE]` prefix で `#ubm-hyogo-incidents` 着弾 | issue-495 spec の staging route | Phase 11 G2 後 | staging 失敗時 G3 進行禁止 |
| smoke (production) | production route + `x-smoke-production-confirm: YES` で `[PRODUCTION SMOKE]` prefix 着弾 | 同 production route | Phase 11 G3 後 | 失敗時自動 rollback、G4 差し戻し |

## redaction grep gate

repo 全域に対し以下のいずれかの pattern が hit した時点で fail-fast（commit / push / PR ブロック）。

```bash
# 1. Slack incoming webhook host + path 先頭
rg -n 'hooks\.slack\.com/services/' .

# 2. webhook URL の B<id>/<token> fragment
rg -n 'B[0-9A-Z]{8,}' .

# 3. Slack bot / user token（万一 bot 化した場合の誤混入検出）
rg -n 'xox[bp]-' .

# 4. 仕様で既知の workspace 識別子の混入検出（具体値はここに書かない）
#    issue-495 / issue-520 spec で固定された workspace 識別子 fragment が
#    1Password 以外（repo / docs / log / PR body）に出現しないことを確認する。
```

期待結果: 上記いずれも **0 hits**。`rg -l --files-with-matches` での確認も併用し、手元で `--hidden --no-ignore` でも 0 hits であること。

> **注**: pattern 4 は具体 fragment 文字列を本仕様書に書かない。Phase 11 オペレータが Slack admin から取得した workspace 識別子 / channel 識別子の prefix（`T...` / `C...` の前 4 文字）を、運用 runbook の作業 worksheet にのみ転記し、grep 実行時に動的に組み立てる。

## `apps/api/src/routes/admin/smoke-observability.test.ts` 追記テスト案

issue-495 spec の既存 test を尊重し、本タスクでは **redaction 観点に絞った追記** のみを行う。route 本体ロジックの変更は伴わない。

| test name 案 | 検証内容 | 期待 |
| --- | --- | --- |
| `does not echo SLACK_WEBHOOK_INCIDENT in response body (success path)` | 200 応答時に `hooks.slack.com/services/` を含む文字列が body / headers に存在しない | redaction-safe |
| `does not echo SLACK_WEBHOOK_INCIDENT in error body (Slack 4xx/5xx)` | Slack 側エラー時の 4xx/5xx 応答 body に webhook URL fragment が露出しない | redaction-safe |
| `requires production-confirm header on production env` | `x-smoke-production-confirm: YES` 欠落時に 403 で fail-fast し、body に webhook URL fragment が出ない | 403 + redaction-safe |
| `rejects token mismatch with redacted response` | 想定外 token / Authorization で 401、body / log mock のいずれにも webhook URL fragment が出ない | 401 + redaction-safe |
| `does not log SLACK_WEBHOOK_INCIDENT to console mock` | `vi.spyOn(console, 'error')` / `console.log` の呼出引数すべてに webhook URL fragment が含まれない | log 経路 redaction |
| `uses redaction-safe webhook fixture only` | test 内で利用される webhook URL モックは、route validation を通すために canonical host を分割結合で組み立てる。source 上に `hooks.slack.com/services/...` の連続 literal は置かない | fixture 汚染防止 |

> **fixture 規約**: テスト内で `SLACK_WEBHOOK_INCIDENT` のモック値を組み立てる場合、Slack 実ホスト（`hooks.slack.com`）文字列を一切書かない。redaction-safe な組み立て fixture を使用し、redaction grep gate が test fixture を含めても 0 hits となるようにする。

## secret 配置 verification test（実値非表示）

| 対象 | コマンド | 期待出力 | 失敗時 |
| --- | --- | --- | --- |
| Cloudflare Workers staging | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` | `SLACK_WEBHOOK_INCIDENT` の name のみ列挙 | G2 差し戻し |
| Cloudflare Workers production | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` | 同上 | G3 差し戻し |
| GitHub Actions secret | `gh secret list --repo daishiman/UBM-Hyogo` | name 列に `SLACK_WEBHOOK_INCIDENT` が表示 | Phase 11 GitHub Secrets step に戻る |
| 1Password item | `op item get "SLACK_WEBHOOK_INCIDENT" --vault UBM-Hyogo-Production --format json \| jq '.fields[] \| select(.label=="url") \| .label'` | `"url"` の **label のみ** 表示。`--reveal` flag は使用禁止。値を grep / cat しない | G2 差し戻し |

> **絶対禁止**: `op read "op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PRODUCTION"` の出力を terminal に表示し続けないこと（値は直接 `op run` 経由で `cf.sh` に渡し、stdout に出さない）。`wrangler secret list` 直接実行禁止（必ず `cf.sh` 経由）。

## 連携 smoke（staging → production 段階確認）

### staging 単独 smoke（G2 通過後）

```bash
# Phase 11 で発火（仕様書 phase では実行禁止）
# 1. staging endpoint（issue-495 spec で確定済みの URL）に対し
#    Authorization 正規 token でテスト POST
# 2. Slack UI で `#ubm-hyogo-incidents` channel に
#    `[STAGING SMOKE]` prefix の message が着弾していることを目視確認
# 3. permalink を outputs/phase-11/webhook-smoke-log.md に記録
#    （permalink は workspace 識別子を含むため redaction 対象。
#     log には channel 名 + timestamp + first 4 chars のみ記録し、
#     full permalink は 1Password の作業 note に保管）
```

### production smoke（G3 通過後）

| ケース | リクエスト | 期待応答 | 期待 Slack |
| --- | --- | --- | --- |
| confirm ヘッダ正常 | `x-smoke-production-confirm: YES` + 正規 token | 200 + redacted body | `[PRODUCTION SMOKE]` prefix で着弾 |
| confirm ヘッダ欠落 | header なし + 正規 token | 403 + redacted body | **着弾しない** |
| confirm ヘッダ値不一致 | `x-smoke-production-confirm: NO` + 正規 token | 403 + redacted body | **着弾しない** |
| token mismatch | confirm 正常 + 不正 token | 401 + redacted body | **着弾しない** |

各ケース実行後、`outputs/phase-11/webhook-smoke-log.md` に応答 status / body の **redacted snippet**（webhook URL fragment / token を伏せた抜粋）と Slack 着弾の有無を記録する。

## ローカル実行コマンド

```bash
# 仕様書 phase（Phase 1〜10）で実行可能
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm/api test -- smoke-observability
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# redaction grep（本タスク仕様書 dir / repo 全域）
rg -n 'hooks\.slack\.com/services/' . || echo "OK: 0 hits"
rg -n 'B[0-9A-Z]{8,}' . || echo "OK: 0 hits"
rg -n 'xox[bp]-' . || echo "OK: 0 hits"

# Phase 11 で発火（仕様書 phase では実行禁止 / 参考のみ）
# bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
# gh secret list --repo daishiman/UBM-Hyogo
# op item get "SLACK_WEBHOOK_INCIDENT" --vault UBM-Hyogo-Production --format json | jq '.fields[].label'
```

## 検証コマンド

```bash
# 本仕様書 dir に実値混入なし
! rg -n 'hooks\.slack\.com/services/[A-Za-z0-9]' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
! rg -n 'xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# 必須セクション
grep -q "redaction" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-04.md
grep -q "secret-verify\|secret list" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-04.md
grep -q "production-confirm\|production_confirm" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/phase-04.md
```

## 成果物

- `outputs/phase-04/main.md`

## DoD（完了条件）

- [ ] テスト分類表（unit / redaction unit / redaction repo grep / secret-verify / smoke staging / smoke production）が確定
- [ ] redaction grep pattern（`hooks\.slack\.com/services/` / `B[0-9A-Z]{8,}` / `xox[bp]-`）が明示
- [ ] `smoke-observability.test.ts` への追記テスト案（confirm 必須 / token mismatch / response redaction / log redaction / fixture 規約）が明示
- [ ] secret-verify コマンド（cf.sh / gh / op）が name-only 経路として明示
- [ ] staging→production 段階 smoke の confirm ヘッダ要否ケース表が明示
- [ ] ローカル実行コマンドが mise exec 経由で記載
- [ ] 実 webhook URL fragment / token / workspace 識別子の混入なし

## 次 Phase への引き渡し

Phase 5 へ: テスト分類表、redaction grep pattern、追記 test 名、secret-verify コマンド、staging→production smoke ケース表、各 fail 時の treatment（fail-fast / G ゲート差し戻し）。

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
