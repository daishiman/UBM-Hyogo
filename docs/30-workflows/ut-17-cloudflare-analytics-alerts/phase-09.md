# Phase 9: 実装着手

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 実装着手 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 8 (デプロイ計画) |
| 次 Phase | 10 (統合・運用準備) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は T1〜T11 を実コードとして着手するゲート。仕様書としては「着手前提・コミット粒度・evidence 取得計画」を固定する。 |

---

## 目的

Phase 4〜8 で固定した実装計画に基づき、実コードの着手 / コミット / staging deploy までを実施する。
本 Phase では実装作業そのものに加え、**着手前提の確認** と **evidence（Cloudflare Dashboard 設定値）の取得計画** を固定する。

---

## 9-1. 着手前提チェックリスト

| # | 確認項目 | 確認方法 | 期待 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | Phase 03 設計レビューが GO | `outputs/phase-03/design-review.md` | GO 判定 | [ ] |
| 2 | Slack channel が確定（staging / production） | UT-07 / 1Password | channel 名 2 件確定 | [ ] |
| 3 | 1Password に `cloudflare-alert-relay` Vault Item が存在 | 1Password 手動確認 | `SLACK_WEBHOOK_URL_STAGING` / `..._PRODUCTION` / `CF_WEBHOOK_AUTH_SECRET_STAGING` / `..._PRODUCTION` の 4 項目 | [ ] |
| 4 | Cloudflare account に Notifications 権限がある | `bash scripts/cf.sh whoami` | account 表示 | [ ] |
| 5 | Node 24 / pnpm 10 環境 | `mise exec -- node --version && pnpm --version` | `v24.x` / `10.x` | [ ] |
| 6 | feature ブランチが切れている | `git branch --show-current` | `feat/ut-17-cloudflare-alerts-slack-relay` | [ ] |
| 7 | dev ブランチからの分岐 | `git log --oneline dev..HEAD` で base が dev | dev 起点 | [ ] |

> 全 7 項目 [x] になるまで着手しない。

---

## 9-2. ブランチ戦略

| 項目 | 値 |
| --- | --- |
| ベース | `dev`（CLAUDE.md「既定ブランチは dev」遵守） |
| 作業ブランチ | `feat/ut-17-cloudflare-alerts-slack-relay` |
| PR 先 | `dev` |
| マージ後の昇格 | dev → main（別 PR / 別タスクで実施。本タスクは dev までで完了） |

---

## 9-3. コミット粒度方針

T1〜T11 を以下の **論理コミット 5 件** に集約する（過剰分割を避け、レビュー容易性を担保）:

| コミット # | 範囲 | 主なファイル | コミットメッセージ例 |
| --- | --- | --- | --- |
| 1 | T1〜T2（Secret 雛形 + .dev.vars.example） | `.dev.vars.example`、wrangler.toml 編集 | `chore(ut-17): wire SLACK_WEBHOOK_URL/CF_WEBHOOK_AUTH_SECRET via 1Password refs` |
| 2 | T3〜T4（route 雛形 + cf-webhook-auth verifier） | `routes/internal/alert-relay.ts`、`middleware/`、`lib/cf-webhook-auth.ts`、`types/` | `feat(ut-17): add /internal/alert-relay route with cf-webhook-auth 固定シークレット verification` |
| 3 | T5〜T6（formatter + sender） | `lib/cloudflare-alert-formatter.ts`、`lib/slack-sender.ts` | `feat(ut-17): format Cloudflare alerts to Japanese Slack Block Kit` |
| 4 | T7（vitest） | `test/*.test.ts`、`test/fixtures/` | `test(ut-17): cover cf-webhook-auth / formatter / sender / route handler` |
| 5 | T9 + T11 evidence + runbook | `outputs/phase-09/notification-policy-config.md`、`runbooks/*.md` | `docs(ut-17): record Notification Policy config and add runbook entries` |

> T8 / T10 staging / production deploy はコミット対象外（実行ログを `outputs/phase-09/deploy-log.md` に記録）。

---

## 9-4. T9 evidence 取得計画（Cloudflare Dashboard 設定）

`outputs/phase-09/notification-policy-config.md` を以下のフォーマットで作成する:

```markdown
# Cloudflare Notification Policy 設定 evidence — UT-17

## 取得日: YYYY-MM-DD
## 取得者: <担当者名>

## 設定済み Notification Policy 一覧

| # | Policy 名 | metric | threshold | destination (URL) | env | スクショ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | UBM Workers Requests > 80% | `workers_requests` | 80% of 100,000/day | `https://api.<production-domain>/internal/alert-relay` | production | `screenshots/policy-1-workers.png` |
| 2 | UBM D1 Rows Read > 80% | `d1_rows_read` | 80% of 5,000,000/day | 同上 | production | `screenshots/policy-2-d1.png` |
| 3 | UBM Pages Builds > 80% | `pages_builds` | 80% of 500/month | 同上 | production | `screenshots/policy-3-pages.png` |
| 4 | UBM R2 Class A > 80% | `r2_class_a_operations` | 80% of 1,000,000/month | 同上 | production | `screenshots/policy-4-r2.png` |

## staging 用 Policy（テスト時のみ）

| # | Policy 名 | destination | env |
| --- | --- | --- | --- |
| S-1 | UBM Workers Requests > 80% (staging) | `https://api-staging.<domain>/internal/alert-relay` | staging |

> staging 用 Policy はテスト後に**削除**する（本番運用時の重複通知を防ぐ）。

## Cloudflare Dashboard「Send Test Notification」実施記録

| Policy | 実施日時 | Slack 受信時刻 | 結果 |
| --- | --- | --- | --- |
| 1〜4 | YYYY-MM-DD HH:MM | YYYY-MM-DD HH:MM | PASS / FAIL |

## スクショ保管場所

`outputs/phase-09/screenshots/` に PNG で保管（policy-1〜4 + send-test-notification UI）
```

---

## 9-5. 着手手順（T1〜T11 実行ログ）

実装中は `outputs/phase-09/execution-log.md` に各 T の実施結果を逐次記録する:

```markdown
# UT-17 実装実行ログ

## T1: Slack Webhook URL 取得 + 1Password 登録
- 実施日: YYYY-MM-DD HH:MM
- 結果: PASS / FAIL
- 備考: 1Password Vault `cloudflare-alert-relay` 作成、Item 4 件登録

## T2: cf-webhook-auth secret 生成 + Cloudflare Secrets 投入
- 実施日: YYYY-MM-DD HH:MM
- 実行コマンド: `bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --env staging`
- 結果: PASS / FAIL

（T3 〜 T11 同様）
```

---

## 9-6. CONST_005 不変条件再確認

実装着手直前に以下を再確認:

- [ ] `apps/web` 配下に変更がないこと
- [ ] D1 binding を新規追加していないこと
- [ ] `wrangler` を直接実行していないこと
- [ ] `.env` に実値が書き込まれていないこと
- [ ] PR 本文・コミットメッセージ・ログに Slack Webhook URL / cf-webhook-auth secret 値が含まれていないこと
- [ ] UT-08-IMPL（WAE custom alerts）と同一関数 / route を共有していないこと

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-08-IMPL | 同一 `apps/api` Worker への変更 | 着手時点で UT-08 PR がマージ済みなら rebase。未マージなら本タスク先行で OK |
| UT-07 | Slack channel 確定 | 9-1 #2 で確認 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-04.md | T1〜T11 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-05.md | 関数シグネチャ |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-08.md | デプロイ手順 |
| 参考 | CLAUDE.md「ブランチ戦略」 | dev base 運用 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/notification-policy-config.md | T9 evidence（Dashboard 設定値テーブル + スクショ参照） |
| ドキュメント | outputs/phase-09/screenshots/*.png | Cloudflare Dashboard スクショ（4 policy + send-test UI） |
| ドキュメント | outputs/phase-09/execution-log.md | T1〜T11 実行ログ |
| ドキュメント | outputs/phase-09/deploy-log.md | T8 / T10 staging / production deploy 結果 |
| コード | apps/api/src/routes/internal/alert-relay.ts ほか Phase 5 の変更ファイル一覧 | 実装本体 |
| メタ | artifacts.json | phase-09 を completed に更新 |

---

## 完了条件

- [ ] 9-1 着手前提 7 項目が全て [x]
- [ ] T1〜T11 が `execution-log.md` に PASS で記録されている
- [ ] T9 evidence（4 policy のテーブル + スクショ）が `notification-policy-config.md` に記録されている
- [ ] vitest が PASS（line coverage ≥ 80%）
- [ ] staging deploy（T8）が成功し、Slack staging channel に日本語通知が到達
- [ ] CONST_005 不変条件 6 項目が全 PASS
- [ ] コミット粒度が 9-3 の 5 件に整理されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 10（統合・運用準備）
- 引き継ぎ事項:
  - `notification-policy-config.md` は Phase 11 受入テスト evidence の入力
  - `execution-log.md` の各 T 結果は Phase 12 documentation-changelog に転記
- ブロック条件: 9-1 着手前提のいずれかが [ ] のまま、または T7 vitest が FAIL の場合
