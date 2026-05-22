# Phase 7: 静的解析・型チェック

## 実行コマンド

```bash
# TypeScript（apps/api 改修なしだが regression 防止のため必ず実行）
mise exec -- pnpm typecheck 2>&1 | tee docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/typecheck.log

# ESLint
mise exec -- pnpm lint 2>&1 | tee docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/lint.log

# shellcheck（新規 shell スクリプト）
shellcheck scripts/smoke/runtime-attendance-provider.sh scripts/smoke/redact.sh \
  2>&1 | tee docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-07/shellcheck.log
```

## 期待結果

- `typecheck.log`: `error TS` を含まない（exit 0）
- `lint.log`: warning 0 / error 0
- `shellcheck.log`: SC2086（unquoted variable）/ SC2046（command substitution unquoted）等 0 件

## 失敗時対応

- TypeScript error → 本タスクは apps/api source を変更しないため、failure は無関係 regression。`git pull origin main` で base 同期し、それでも残る場合はユーザーへエスカレーション
- shellcheck warning → 必ず原因を修正。`# shellcheck disable=` での抑止禁止

## 完了条件

- 3 ログ全てが PASS で task root 配下の `outputs/phase-11/evidence/` および `outputs/phase-07/` に保存されている
