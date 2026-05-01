# Runbook

## Part A: local fixture

1. `apps/api` と `apps/web` を起動する。
2. `http://localhost:3000/login` から magic link mock で member session を確立する。
3. `/profile` を開き、`M-08-profile.png` を取得する。
4. `devtools-snippets.md` の snippet を実行し、`M-09-no-form.devtools.txt` に保存する。
5. 同じ画面を `M-09-no-form.png` として保存する。
6. `/profile?edit=true` を開き、snippet 出力を `M-10-edit-query-ignored.devtools.txt`、画面を `M-10-edit-query-ignored.png` として保存する。

## Part B: staging

1. Phase 10 GO 判定で確定した staging URL を開く。
2. staging magic link で member session を確立する。
3. M-14 staging profile、M-15 edit CTA、M-16 localStorage ignored を取得する。

## Part C: secret hygiene

```bash
cd docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/outputs/phase-11/evidence
grep -RniE '(token|cookie|authorization|bearer|set-cookie)' . && echo 'FAIL' || echo 'PASS'
```

## Part D: parent diff

親 06b workflow の `manual-smoke-evidence.md` で M-08〜M-10、M-14-staging-profile、M-15-edit-cta、M-16-localstorage-ignored を `pending` から `captured` に更新し、差分を `manual-smoke-evidence-update.diff` に保存する。
