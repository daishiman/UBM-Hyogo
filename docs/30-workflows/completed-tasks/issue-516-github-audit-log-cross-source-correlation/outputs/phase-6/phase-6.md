# Phase 6 出力: CLI / runbook 統合

## 実装ファイル
- `scripts/audit-correlation/run.sh` — CLI wrapper
- `scripts/audit-correlation/runner.ts` — node tsx entry
- `scripts/audit-correlation/grep-gate.sh` — PII 検出 gate
- `scripts/audit-correlation/fixtures/*.json` — 6 種の synthetic event
- `scripts/audit-correlation/__tests__/grep-gate.bats` — 5 テスト pass
- `scripts/audit-correlation/__tests__/runner-determinism.bats` — 3 テスト pass
- `docs/runbooks/audit-correlation.md` — HIGH alert 6 ステップ手順

## CLI 仕様
```
run.sh --github <gh.json> --cloudflare <cf.json> --salt <salt> [--out <out.json>]
exit code: 0=success, 1=correlation failure, 2=invalid args
```

## 動作確認結果
- HIGH dry-run: github-org-update-member + cloudflare-login-fail (同一 actor email, 5 分以内, IP 異なる) → severity `HIGH`、events 2 件。
- empty: edge-empty → `[]`。
- determinism: 同一入力で 2 回 run → diff なし。
- shellcheck: clean。
- bats: 8 テスト全 pass。

## salt 取扱い
- CLI 引数でのみ渡す。
- runner.ts は salt を error message / stdout に絶対に出さない。
- runbook で `op run` ラッパー経由の注入手順を記録。
