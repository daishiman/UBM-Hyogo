# Slack failure injection evidence

本サイクルでは Slack webhook への real post は実施しない（自走禁止 §5）。
代わりに `scripts/smoke/__tests__/ci-summary-post.test.sh` の T-5-1 / T-5-2 / T-5-4 で
以下が `--dry-run` / no-webhook 経路で確認されている:

- summary.json -> redact 済み message への変換（jq + redact.sh）
- Bearer token を含む summary が Slack 送出 message から除去される（T-5-4 PASS）
- webhook 未設定時は exit 0 で stdout fallback（T-5-2 PASS）

real post の実測は G1-G4 承認後の runtime evidence cycle で取得する。
