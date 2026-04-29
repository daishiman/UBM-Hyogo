# Phase 9 — 品質保証 主成果物

## 実行コマンド

```
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
```

## 結果

| 軸 | 結果 |
| --- | --- |
| typecheck | PASS (`tsc -p apps/api/tsconfig.json --noEmit` exit 0) |
| test | PASS (Test Files 40 passed / Tests 231 passed) |
| 既存テスト破壊 | なし (adminNotes.test.ts も note_type 列追加に対して全 7 件 pass) |

## a11y (API contract)

- error response はすべて `{ code, ...detail }` 形式で機械可読。
- 422 は `issues` を zod 標準形式で返し、UI 側のフィールドフォーカスに利用可能。
- 429 は `Retry-After` header を含むため UI で再試行カウントダウン可能。

## secret hygiene

- 新規 secret 導入なし。
- `RESPONDER_URL` は wrangler vars (公開可)。
- session resolver は 05a/b の Auth.js cookie 経由に置換予定（MVP は dev token のみ）。

## free-tier 見積もり

`free-tier.md` 参照。
