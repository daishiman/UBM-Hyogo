# Phase 9 — QA

`[実装区分: 実装仕様書]`

## 1. 必須 gate

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts
mise exec -- pnpm vitest run apps/web/app/__tests__
mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts > /tmp/ratio.json && jq . /tmp/ratio.json
# Playwright smoke regression (PR push 後 CI で確認)
```

## 2. lefthook 確認

- pre-commit / pre-push hook を skip しない (`--no-verify` 禁止)
- `verify-indexes-up-to-date` / `verify-gate-metadata` が GREEN (本タスクは indexes 触らないため影響なし)

## 3. 出力

[outputs/phase-9/qa-result.md](outputs/phase-9/qa-result.md) に各コマンドの exit code と要約を記録。

## 4. DoD

- [ ] 全 gate GREEN
- [ ] 既存 spec の regression なし
- [ ] `actionlint` で新 workflow が valid
