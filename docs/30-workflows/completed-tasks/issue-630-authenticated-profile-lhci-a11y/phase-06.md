# Phase 6 — リスク・rollback 設計

## リスクと対策

| リスク | 検知 | 対策 / rollback |
| --- | --- | --- |
| `AUTH_SECRET` が CI に未設定 | LHCI step が `Error: AUTH_SECRET is required` で fail | GitHub Secrets に `AUTH_SECRET` を投入。Phase 13 で投入手順を明示。投入前は CI fail で gate される（fail-safe）|
| `authjs.session-token` cookie が認識されない | LHCI 計測時に /login へ redirect → a11y score 計測対象が誤る | `lhci-auth.cjs` に `await page.goto('http://localhost:3000/profile'); const status = await page.evaluate(() => location.pathname);` の pre-check を加え、`/login` redirect 時 throw |
| signSessionJwt の payload schema 変更 | unit test 失敗 / Playwright e2e 失敗 | `signSessionJwt` の API を `@ubm-hyogo/shared` 側で安定化。本タスクは shared 側を変更しない |
| storage-state.json の commit 事故 | grep gate / `.gitignore` | `.gitignore` に `apps/web/.lhci/` を追加。pre-commit `staged-task-dir-guard.sh` 範囲外なので Phase 11 で `git status` 確認を明文化 |
| AUTH_SECRET の log 漏洩 | CI log の grep | `lhci-auth-storage.ts` で `secret` を console.log しない。echo 系を入れない |
| LHCI authenticated job の flaky 失敗 | 連続 fail | `numberOfRuns: 1` のまま retry なし（hard gate）。flaky の場合は別タスクで原因追及 |

## Rollback 手順

1. `.github/workflows/lighthouse.yml` の authenticated step を revert（`git revert <commit>` か該当 step を comment-out）
2. `lighthouserc.json` に `"http://localhost:3000/profile"` を戻す（unauth redirect 計測に戻す）
3. `lighthouserc.authenticated.json` を削除しても CI は壊れない（unauth ジョブのみで完結）

## fail-safe 原則

- authenticated LHCI が壊れても unauth LHCI は影響を受けない（別 step / 別 config）
- AUTH_SECRET 未投入時は authenticated step のみ fail し、unauth step は緑になる
