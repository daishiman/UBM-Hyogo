# Manual Smoke Log: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装 / NON_VISUAL evidence]

Status: PASS

## 実行コマンド

```bash
pnpm --filter @ubm-hyogo/web test:coverage
```

## stdout / stderr 抜粋

- Test Files: 40 passed (40)
- Tests: 359 passed (359)
- Duration: 38.26s
- Coverage: target auth/fetch/session files and `fetch-mock.ts` helper all satisfy Stmts/Lines/Funcs >=85% and Branches >=80%.
- Warning: local Node is `v22.21.1` while repo engine requests `24.x`; command still exited 0.

## 実行環境

- Node: v22.21.1（repo要求は 24.x）
- pnpm: 10.33.2
- 実行日時: 2026-05-03
- 実行ディレクトリ: repository root
