# UT-17 Phase 4: Critical Path

## クリティカルパス

```
[外部] T1 (1Password)
   ↓
[外部] T2 (Cloudflare Secrets)
   ↓
[本サイクル] T3 (Hono route 雛形)
   ↓
   ├─→ T4 (cf-webhook-auth middleware)
   └─→ T5 (formatter) → T6 (slack-sender)
                            ↓
                         T7 (vitest 整備)
                            ↓
[外部]                   T8 (staging deploy + curl)
                            ↓
[外部]                   T9 (Dashboard 設定)
                            ↓
[外部]                   T10 (production deploy)
                            ↓
[本サイクル]              T11 (runbook 追記)
```

## 実行順序の根拠

1. T3（route 雛形）は T4・T5・T6 の host となるため最上流。
2. T4（middleware）と T5/T6（formatter / sender）は独立な pure function 群で並行可能だが、本サイクルでは T4 → T5 → T6 の直列で実装することで PR diff の review 容易性を優先。
3. T7（vitest）は T4-T6 の振る舞いを赤→緑にする TDD 手順。Phase 6（test 先行）→ Phase 7（実装）として、本ドキュメントの T7 は両 phase を跨ぐ。
4. T9（Dashboard 設定）は staging URL に対する curl 検証（T8）の後に行う必要がある。
5. T11（runbook）は本番動作確認後の運用ドキュメント整備で最終段。

## 本サイクルで完了するもの

- T3 / T4 / T5 / T6 / T7 / T11 をローカルでグリーンに収束。
- typecheck / vitest がローカルで PASS。
- runbook が Phase 12 same-wave sync 用にドラフト完成。

## 本サイクルでスキップするもの（外部操作）

- T1 1Password vault item 登録
- T2 `bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET` × 2 環境、`SLACK_WEBHOOK_URL` × 2 環境
- T8 staging deploy + curl で Slack 通知到達確認
- T9 Cloudflare Dashboard Notification Policy 4 種設定
- T10 production deploy + Notification Policy 切替

実装サマリで「外部操作残（T1, T2, T8, T9, T10）」として明記する。
