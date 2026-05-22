# Phase 13 — PR 作成 / runtime evidence

## 事前準備

1. GitHub Secrets `AUTH_SECRET` を投入する（未投入時は authenticated step が fail する）:

   ```bash
   gh secret set AUTH_SECRET --body "$(op read 'op://Employee/ubm-hyogo-env/AUTH_SECRET')"
   ```

   ※ 実値は出力しない。op 参照のみ。

2. ブランチ作成:

   ```bash
   git checkout -b feat/issue-630-authenticated-profile-lhci
   ```

## commit

`Refs #630` を含めた commit message:

```
feat(lhci): add authenticated /profile a11y measurement (issue-630)

- generate test session JWT via signSessionJwt and write LHCI storageState
- add lighthouserc.authenticated.json with puppeteerScript injecting session cookie
- run authenticated LHCI as a second step in lighthouse.yml
- drop /profile from unauthenticated LHCI urls (Q-02 decision)
- update specs/02-auth.md and e2e-quality-uplift backlog

Refs #630
```

## PR 作成

```bash
git push -u origin feat/issue-630-authenticated-profile-lhci
gh pr create --base dev --title "feat(lhci): authenticated /profile a11y measurement (issue-630)" \
  --body "$(cat <<'EOF'
## Summary
- LHCI に authenticated /profile の accessibility >= 0.90 gate を追加
- signSessionJwt で test session JWT を発行し、puppeteerScript で cookie 注入
- unauth LHCI から /profile を除外（redirect 計測を停止）

## Implementation
- `apps/web/scripts/lhci-auth-storage.ts` (new)
- `apps/web/lhci/lhci-auth.cjs` (new)
- `lighthouserc.authenticated.json` (new)
- `lighthouserc.json` (edit: remove /profile)
- `.github/workflows/lighthouse.yml` (edit: add auth step)
- `apps/web/scripts/__tests__/lhci-auth-storage.spec.ts` (new test)
- `docs/00-getting-started-manual/specs/02-auth.md` (SSOT)
- `docs/30-workflows/e2e-quality-uplift/backlog.md` (close EXT-X1)

## Test plan
- [ ] pnpm typecheck
- [ ] pnpm lint
- [ ] pnpm --filter @ubm-hyogo/web test (focused)
- [ ] LHCI CI workflow green (authenticated /profile accessibility >= 0.90)

Refs #630
EOF
)"
```

## runtime evidence 収集

1. PR 作成後、`lighthouse-ci` workflow の run を確認
2. authenticated LHCI report HTML を artifact からダウンロードし、
   `outputs/phase-11/evidence/lhci-authenticated-profile.html` に保存
3. `outputs/phase-11/evidence/ci-lhci-report-url.md` に Actions run URL を記録
4. accessibility score の数値を `outputs/phase-11/evidence/ci-result-summary.md` に記録

## post-merge

1. `dev` への merge 後、`e2e-quality-uplift/backlog.md` の EXT-X1 が closed であることを確認
2. follow-up 候補（admin authenticated LHCI）を `unassigned-task/` または新規 issue に登記
3. 本タスク dir を `completed-tasks/` 配下に移動するかは Phase 12 outputs の指示に従う
