# Phase 11 — 検証手順 / evidence

## ローカル検証コマンド（evidence ログ取得）

```bash
mise exec -- pnpm typecheck \
  2>&1 | tee docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/outputs/phase-11/evidence/typecheck.log

mise exec -- pnpm lint \
  2>&1 | tee docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/outputs/phase-11/evidence/lint.log

mise exec -- pnpm --filter @ubm-hyogo/web test -- scripts/__tests__/lhci-auth-storage.spec.ts \
  2>&1 | tee docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/outputs/phase-11/evidence/test.log
```

## LHCI authenticated smoke

```bash
export AUTH_SECRET=test-secret-32-bytes-padding-xxx
export INTERNAL_API_BASE_URL=http://127.0.0.1:8787
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start &
SERVER_PID=$!
sleep 8

mise exec -- pnpm --filter @ubm-hyogo/web lhci:auth-storage
mise exec -- pnpm --filter @ubm-hyogo/web lhci:profile-mock-api &
MOCK_API_PID=$!
for i in {1..30}; do
  curl -fsS http://127.0.0.1:8787/health >/dev/null && break
  sleep 1
done

mise exec -- pnpm --filter @ubm-hyogo/web exec lhci autorun --config=../../lighthouserc.authenticated.json \
  2>&1 | tee docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/outputs/phase-11/evidence/lhci-authenticated-profile.log

cp apps/web/.lighthouseci-authenticated/*.html \
  docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/outputs/phase-11/evidence/lhci-authenticated-profile.html
cp apps/web/.lighthouseci-authenticated/*.json \
  docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/outputs/phase-11/evidence/lhci-authenticated-profile.json

kill $MOCK_API_PID
kill $SERVER_PID
unset AUTH_SECRET
unset INTERNAL_API_BASE_URL
```

## 受入判定

| 項目 | 期待 | 判定 |
| --- | --- | --- |
| typecheck | exit 0 | pass / fail |
| lint | exit 0 | pass / fail |
| unit test | 2 pass | pass / fail |
| LHCI authenticated accessibility | >= 0.90 | pass / fail |
| LHCI authenticated final URL | `/profile`（`/login` redirect していない） | pass / fail |
| authenticated pre-check | cookie 注入後の final URL が `/profile` | pass / fail |
| `git status` | storage-state.json が untracked になっていない（gitignore 効いている） | pass / fail |

## runtime evidence boundary

CI 実 runtime の evidence（GitHub Actions の LHCI report）は PR push 後に取得。
`outputs/phase-11/evidence/ci-lhci-report-url.md` に CI artifact URL を記録する。
