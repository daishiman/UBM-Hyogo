# Phase 7 主成果物 — AC マトリクス / カバレッジ確認

> 仕様: `phase-07.md`

## AC マトリクス（12 行 × 6 列）

| AC ID | 内容 | 検証方法 | evidence path | Phase | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | OAuth client（staging/production）が同一 project / 同一 consent screen / redirect URI matrix と一致 | Console 設定 screenshot + matrix 表 diff 0 | `outputs/phase-02/oauth-redirect-uri-matrix.md` / `outputs/phase-11/staging/redirect-uri-actual.md` / `outputs/phase-11/production/redirect-uri-actual.md` / `outputs/phase-11/production/oauth-client-screenshot.png` | Phase 5 / 11 (A+B) | spec_created |
| AC-2 | Cloudflare Secrets 3 key が staging/production 双方で `cf.sh` 経由で配置 | `cf.sh secret list` の stdout 確認（値は出ない） | `outputs/phase-11/staging/secrets-list-*.txt` / `outputs/phase-11/production/secrets-list-*.txt` | Phase 5 / 11 (A+C) | spec_created |
| AC-3 | secrets-placement-matrix.md が `02-auth.md` / `13-mvp-auth.md` から参照 | Phase 12 で link 追記 + grep 検証 | `outputs/phase-02/secrets-placement-matrix.md` / `outputs/phase-12/system-spec-update-summary.md` | Phase 2 / 12 | spec_created |
| AC-4 | staging で 9 ケース PASS + screenshot 9 + curl + session JSON + wrangler-dev.log | smoke-checklist 順次実行 → manual-smoke-log.md 記録 | `outputs/phase-11/staging/0X-*.png` / `outputs/phase-11/staging/curl-*.txt` / `session-member.json` / `session-admin.json` / `wrangler-dev.log` | Phase 11 (A) | spec_created |
| AC-5 | `/login?gate=...` redirect / `/admin/*` 非管理者 redirect / allowlist 一致時のみ `/admin` | M-04 / M-07 / M-10 を curl `Location` header で検証 | `outputs/phase-11/staging/admin-gate-redirect.txt` / `screenshot-M-04.png` / `screenshot-M-08.png` | Phase 11 (A) | spec_created |
| AC-6 | consent screen が production / verification submitted（or verified） | Stage B-2 で submit → 完了画面 screenshot | `outputs/phase-11/production/consent-screen.png` / `verification-submission.md` | Phase 11 (B) | spec_created |
| AC-7 | 外部 Gmail で本番 login smoke PASS | Stage C-3 で testing user 未登録 Gmail で login → screenshot | `outputs/phase-11/production/login-smoke.png` / `login-smoke-log.md` | Phase 11 (C) | spec_created |
| AC-8 | privacy/terms/home が production で 200 | `curl -I` 3 URL | `outputs/phase-11/production/url-200-check.txt` | Phase 5 / 11 (B 前提) | spec_created |
| AC-9 | `wrangler login` / 平文 token 不在 | `git grep` 0 件 + `~/.../wrangler/config/default.toml` 不在 | `outputs/phase-11/staging/wrangler-login-absence.txt` / `outputs/phase-11/production/wrangler-login-absence.txt` | Phase 5 / 11 (A+C) | spec_created |
| AC-10 | B-03 制約状態が `13-mvp-auth.md` から読み取れる | Phase 12 で B-03 セクション更新 + Phase 11 evidence link | `outputs/phase-12/system-spec-update-summary.md` / `13-mvp-auth.md`（更新後） | Phase 11 (B/C) / 12 | spec_created |
| AC-11 | 無料枠運用：課金 product 不在 / Workers/Secrets 無料枠内 | Phase 9 で 4 サービス試算 | `outputs/phase-09/free-tier-estimation.md` | Phase 9 | spec_created |
| AC-12 | 05a Phase 11 placeholder を本タスク outputs link で上書き | Phase 12 で 05a main.md 更新 | 05a `outputs/phase-11/main.md`（更新後）/ `outputs/phase-12/implementation-guide.md` | Phase 12 | spec_created |

## Stage A/B/C と AC の対応

| Stage | 該当 AC |
| --- | --- |
| Stage A: staging smoke | AC-1 (staging) / AC-2 (staging) / AC-4 / AC-5 / AC-9 (staging) |
| Stage B: verification 申請 | AC-1 (production) / AC-6 / AC-8 / AC-10 (submitted) |
| Stage C: production smoke | AC-2 (production) / AC-7 / AC-9 (production) / AC-10 (verified) |
| Phase 12 反映 | AC-3 / AC-10 / AC-12 |
| Phase 9 単独 | AC-11 |

## coverage 代替指標

| 指標 | 目標 | 計測 |
| --- | --- | --- |
| 手動 smoke PASS 率 | 100%（staging 9 + production 1 = 10 ケース） | manual-smoke-log.md |
| evidence 配置率 | 100%（AC-4/6/7/9 必須 path 全生成） | Phase 11 完了時の `ls` 確認 |
| 設定整合率 | 100%（matrix と actual diff 0） | Phase 11 で actual 表生成 |

## 計測対象 allowlist

```
outputs/phase-02/oauth-redirect-uri-matrix.md
outputs/phase-02/secrets-placement-matrix.md
outputs/phase-02/consent-screen-spec.md
outputs/phase-02/staging-vs-production-runbook.md
outputs/phase-05/implementation-runbook.md
outputs/phase-09/main.md
outputs/phase-09/free-tier-estimation.md
outputs/phase-11/staging/**
outputs/phase-11/production/**
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-12/**
```

## 禁止パターン（広域指定）

```
apps/**           # 設定運用のみ。実装ファイル不変
.claude/**        # mirror parity 対象外
~/.config/**      # ローカル個人設定不変
```

## 4 条件評価（更新）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-7 / AC-10 で B-03 解除 evidence 化 / AC-4 で staging placeholder 解消 |
| 実現性 | PASS | Phase 5 runbook が `cf.sh` 単一経路 / 既存 op 運用と整合 |
| 整合性 | PASS（要 Stage A 確認） | Phase 2 matrix と Phase 11 actual で diff 0 確認 |
| 運用性 | PASS | Stage 間ゲート + B-03 解除条件 a/b/c が読み取れる |

## Phase 9 / 11 への引き継ぎ

- 代替指標 3 種 → Phase 9 で実測値 / Phase 11 で evidence 生成
- AC マトリクス → Phase 10 go-no-go の根拠
- Stage A/B/C 対応表 → Phase 11 段階間ゲート判定
- 広域指定禁止ルール → Phase 8 / 9 で逸脱防止
