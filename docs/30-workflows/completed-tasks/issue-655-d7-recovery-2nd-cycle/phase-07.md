# Phase 7 — local 検証

## 目的

PR-A の dirty diff を local で typecheck / lint / focused test まで通す。

## 実行コマンド

```bash
# 依存 (Node 24 / pnpm 10 確定)
mise exec -- pnpm install

# typecheck
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# focused test (Phase 6)
mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts
mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/recovery-rootcause-helper.spec.ts

# workflow YAML 静的検証
mise exec -- pnpm exec actionlint .github/workflows/cf-audit-log-7day-summary.yml

# (条件付き) cf-audit-log-monitor.yml 修正時
mise exec -- pnpm exec actionlint .github/workflows/cf-audit-log-monitor.yml

# CLI smoke (recovery mode dry-run、`--since` 必須 validation 確認)
mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
  --aggregate --window 168 --recovery-mode --input ./tmp/empty --out ./tmp/out.json \
  --expected-snapshots 168 --require-non-skeleton || echo "exit=$? (2 expected when --since missing)"
```

## 期待結果

- `pnpm typecheck` exit 0
- `pnpm lint` exit 0
- focused test 全 TC PASS
- `actionlint` exit 0
- CLI smoke が `exit 2 + since is required` を表示

## 完了条件

- [ ] 上記コマンドの結果を `outputs/phase-11/evidence/local-verify.log` に保存
- [ ] failure があれば Phase 5 / Phase 6 に戻り修正、最大 3 回まで
