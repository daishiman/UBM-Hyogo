---
phase: 8
title: Definition of Done
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 8: Definition of Done — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 元 issue 完了条件（必須）

- [ ] `apps/api/src/jobs/sheets-fetcher.ts`（および周辺 sync ジョブ）で Sheets API 401/403 が `SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN` の error code 付きで構造化ログ出力されている
- [ ] Cloudflare Workers logs が（既存）alert-relay 経路で Slack / mail に転送されている
- [ ] alert dedup が「直近 10 分で 401/403 が 3 件目以降を suppress」する KV ロジックで動作している
- [ ] `apps/api` の `*/15 * * * *` cron（既存）に sheets-auth-healthcheck が**相乗り実行**されている。**新規 cron 追加なし**
- [ ] staging で意図的失効させ alert が発火し、payload 内の rollback runbook リンクが正しく解決できることを確認した
- [ ] 5xx / 429 / network timeout は alert 対象から除外されていることを test ケースで確認した
- [ ] UT-25 Phase 13 `rollback-runbook.md` に本監視からの逆参照が追記されている
- [ ] UT-25-DERIV-01 作成者向けに rotation 時の alert mute 手順が申し送られている（runbook section 化）

## 2. ワークフロー固有 DoD

- [ ] Phase 11 evidence 表のすべての行に対応する artifact が存在する
- [ ] Phase 12 canonical 9 headings 自己点検が完了している
- [ ] `artifacts.json` の `gates[]` が Gate-A〜D まで揃っている
- [ ] Cron 配列が `apps/api/wrangler.toml` で 3 本のまま（変更前後 diff で確認）
- [ ] 新規 ts ファイルすべてに対応する `*.spec.ts` が存在する
- [ ] PR base が `dev` で作成されている（main 直接 PR ではない）

## 3. CI gate 通過

Phase 7 §1 の全 gate が PR 上で green であること。

## 4. ドキュメント DoD

- [ ] `index.md` / `SCOPE.md` / `artifacts.json` が drift なく整合
- [ ] phase-13 PR draft が生成済み（実 PR 作成は user 承認後）
- [ ] rotation 時 alert mute 手順が Phase 9 / Phase 11 に明記
