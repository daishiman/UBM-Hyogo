# Phase 9 Output: 品質保証 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

Status: spec_created
Runtime evidence: pending_user_approval（Phase 11 着手前に実値で再判定する）

## 1. 6 軸品質ガード（production 厳格版）

| # | 軸 | 内容 | 判定基準 | evidence |
| --- | --- | --- | --- | --- |
| 1 | 静的検証 | typecheck / lint / build が exit 0 | 3/3 PASS | `outputs/phase-11/preflight-typecheck.md` / `preflight-lint.md` / `preflight-build.md` |
| 2 | 上流 green | 09a-A / 09b-A / 09b-B が green | 3/3 PASS | `outputs/phase-11/upstream-green-evidence.md` |
| 3 | observability 疎通 | Sentry / Slack / optional Logpush が production binding で疎通 | 2 required PASS + Logpush optional | `outputs/phase-11/observability-{sentry,slack}.md + optional observability-logpush.md` |
| 4 | redaction | secret 値混入 0 件 / wrangler 直書き 0 件 | grep 3 本すべて 0 hit | `outputs/phase-11/redaction-check.md` |
| 5 | 二重承認 | Phase 10 reviewer + Phase 13 user の approval | 2 段とも記録あり | `outputs/phase-10/main.md`（reviewer sign-off）/ `outputs/phase-11/user-approval-log.md` |
| 6 | 不変条件再確認 | #5 / #6 / #14 を build/grep/spec で事前検証 | 3/3 PASS | `outputs/phase-11/invariants.md`（事前: build artifact grep / spec 整合） |

1 軸でも fail なら **Phase 10 NO-GO** として扱う。

## 2. 静的検証（preflight）コマンドと判定

```bash
# Node 24 / pnpm 10 を mise で保証
mise exec -- pnpm typecheck > docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-11/preflight-typecheck.md 2>&1
mise exec -- pnpm lint      > docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-11/preflight-lint.md      2>&1
mise exec -- pnpm build     > docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-11/preflight-build.md     2>&1
```

| コマンド | 期待 exit | NO-GO 条件 |
| --- | --- | --- |
| `pnpm typecheck` | 0 | TS 型エラーが 1 件以上 |
| `pnpm lint` | 0 | lint エラーが 1 件以上（warn は許容） |
| `pnpm build` | 0 | build エラーが 1 件以上 / OpenNext 出力欠落 |

## 3. 上流 green の citation 手順

`outputs/phase-11/upstream-green-evidence.md` に次のテンプレで記録:

```md
# Upstream Green Evidence

## 09a-A staging smoke
- evidence: docs/30-workflows/09a-A-*/outputs/phase-11/smoke-public.md
- evidence: docs/30-workflows/09a-A-*/outputs/phase-11/smoke-member.md
- evidence: docs/30-workflows/09a-A-*/outputs/phase-11/smoke-admin.md
- 状態: green
- 確認日時: <YYYY-MM-DDThh:mmZ>

## 09b-A observability runtime
- evidence: outputs/phase-11/observability-sentry.md
- evidence: outputs/phase-11/observability-slack.md
- evidence: outputs/phase-11/observability-logpush.md
- 状態: green
- 確認日時: <YYYY-MM-DDThh:mmZ>

## 09b-B post-deploy smoke healthcheck
- evidence: docs/30-workflows/09b-B-*/outputs/phase-11/<post-deploy-smoke evidence>
- 状態: green
- 確認日時: <YYYY-MM-DDThh:mmZ>
```

3 上流すべて green が必要。1 件でも未 green なら本タスクは Phase 11 着手しない。

## 4. observability 疎通確認

| 経路 | 確認手順 | 期待 |
| --- | --- | --- |
| Sentry（API） | API Worker 上で意図的な 5xx / unhandled exception 発火 → Sentry 受信確認 | 1 イベント受信 |
| Sentry（Web） | Web Worker 上で client-side error 発火 → Sentry 受信確認 | 1 イベント受信 |
| Slack incident channel | 09b-A の test webhook から Slack へ送信 → 着信確認 | 着信 1 件 |
| Logpush (optional) | Cloudflare Dashboard の Logpush 設定 active 確認 + 過去 1h の配送ログ確認 | active / 配送あり。未導入の場合は NO-GO ではなく optional evidence として記録 |

各経路の evidence ファイルに「送信時刻 / 受信時刻 / イベント ID（mask 済み）」を記録。secret 値（DSN / Webhook URL）は転記禁止。

## 5. redaction 検証

```bash
# (a) secret 値混入チェック
rg -nE "(AUTH_SECRET|GOOGLE_(PRIVATE_KEY|CLIENT_SECRET)|MAIL_PROVIDER_KEY|RESEND_API_KEY|SLACK_WEBHOOK_URL|SENTRY_DSN|CLOUDFLARE_API_TOKEN)\s*[:=]\s*[A-Za-z0-9_\-]{6,}" \
  docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/

# (b) wrangler 直書きチェック
rg -niw "wrangler\s+(d1|deploy|rollback|secret|whoami)" \
  docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/

# (c) リポジトリ全体の .env 平文チェック
git grep -nE "AUTH_SECRET=[A-Za-z0-9]|GOOGLE_PRIVATE_KEY=-----BEGIN|MAIL_PROVIDER_KEY=[A-Za-z0-9]" -- ':(exclude).env.example'
```

| 検証 | 期待 | NO-GO 条件 |
| --- | --- | --- |
| (a) secret 値 | 0 hit | 1 hit 以上で停止、該当行を mask または削除 |
| (b) wrangler 直書き | 0 hit | 1 hit 以上で `bash scripts/cf.sh` 経由に書き換え |
| (c) .env 平文 | 0 hit | 1 hit 以上で commit 履歴含めて escalate |

結果は `outputs/phase-11/redaction-check.md` に記録（hit 件数のみ・実値転記禁止）。

## 6. 二重承認ゲート（reviewer + user）

| gate | 発動 phase | 承認者 | 記録先 | 未取得時 |
| --- | --- | --- | --- | --- |
| Phase 10 reviewer | Phase 9 完了直後 | reviewer（solo dev は self-review） | `outputs/phase-10/main.md` § Reviewer Sign-off | Phase 11 進行不可 |
| Phase 11 mutation #1 (D1 apply) | Phase 11 step 6 直前 | user | `outputs/phase-11/user-approval-log.md` § d1-apply | step 7 未実行 |
| Phase 11 mutation #2 (API deploy) | Phase 11 step 9 直前 | user | 同 § api-deploy | step 10 未実行 |
| Phase 11 mutation #3 (Web deploy) | Phase 11 step 11 直前 | user | 同 § web-deploy | step 12 未実行 |
| Phase 11 mutation #4 (release tag push) | Phase 11 step 13 直前 | user | 同 § release-tag | State S14 未実行 |
| release/main promotion approval (G-1) | release/main promotion 直前 | user | `outputs/phase-13/main.md` § Approval | merge 不可 |

solo dev でも Phase 10 reviewer gate は skip しない。`outputs/phase-10/main.md` に self-review である旨と sign-off 日付（`reviewed_at`）を必ず記載する。

## 7. Phase 11 着手前 preflight チェックリスト

```text
[ PRODUCTION DEPLOY PREFLIGHT CHECKLIST ]
Task: 09c-A-production-deploy-execution
Date: <YYYY-MM-DD>

[1] 静的検証
  [ ] preflight-typecheck.md exit 0
  [ ] preflight-lint.md exit 0
  [ ] preflight-build.md exit 0

[2] 上流 green
  [ ] 09a-A staging smoke green
  [ ] 09b-A observability runtime green
  [ ] 09b-B post-deploy smoke green

[3] observability 疎通
  [ ] Sentry receive (API + Web)
  [ ] Slack incident channel reachable
  [ ] Logpush active or NOT_CONFIGURED_AS_OPTIONAL

[4] redaction
  [ ] secret 値混入 0 hit
  [ ] wrangler 直書き 0 hit
  [ ] .env 平文 0 hit

[5] 二重承認
  [ ] Phase 10 reviewer sign-off
  [ ] spec PR creation approval（dev→main PR）

[6] 不変条件再確認
  [ ] #5 boundary（build artifact grep）
  [ ] #6 apps/web → D1 直 import 0 件
  [ ] #14 free-tier 見積 PASS（spec ベース）

判定: GO / NO-GO（理由）
```

すべて check で **GO**、1 件でも未 check で **NO-GO**。

## 8. 不変条件 #5 / #6 / #14 の事前検証

| 不変条件 | 事前検証コマンド | 判定 |
| --- | --- | --- |
| #5 public/member/admin boundary | typecheck / lint で route 別 handler の型整合 | exit 0 |
| #6 apps/web から D1 直接禁止 | `rg -n "D1Database\\|env\\.DB" apps/web/src/ apps/web/.open-next/ 2>/dev/null` | 0 hit |
| #14 Cloudflare free-tier | spec 上の見積（Workers < 5k req/day, D1 reads < 500k/day, writes < 10k/day） | spec_covered |

実 metrics は Phase 11 step 17（24h verification）で取得。Phase 9 では spec / build artifact レベルでの事前確認のみ。

## 9. NO-GO トリガと差し戻し先

| トリガ | 差し戻し先 |
| --- | --- |
| 静的検証 fail | feature ブランチ修正 → 再実行 |
| 上流 09a-A 未 green | 09a-A の Phase 11 へ |
| 上流 09b-A 疎通失敗 | 09b-A の Phase 11 へ |
| 上流 09b-B 検知失敗 | 09b-B の Phase 11 へ |
| redaction hit | 該当行 mask / 削除 → 再実行 |
| reviewer sign-off 未取得 | Phase 10 で sign-off 取得 |
| user approval 未取得 | Phase 13 で user に依頼 |

## 10. Phase 10 への引き渡し

- 6 軸品質ガード（PASS / NO-GO 判定基準）
- preflight チェックリスト（Phase 11 着手前の最終確認）
- 二重承認ゲート設計（Phase 10 reviewer + Phase 13 user）
- 上流 green の citation 手順
- redaction 検証コマンド 3 本
- NO-GO 差し戻し先一覧
