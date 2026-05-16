# Phase 9 — Acceptance

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1: authed.spec.ts 5 ケース PASS | ✅ | `outputs/phase-11/evidence/test.txt` (`apps/web/src/lib/fetch/authed.spec.ts (13 tests)` PASS) |
| AC-2: useAdminMutation.spec.tsx 3 経路 PASS | ✅ | `test.txt` (`useAdminMutation.spec.tsx (9 tests)` PASS) |
| AC-3: trigger 中 isLoading=true→false | ✅ | hook 実装 finally で setIsLoading(false); 正常系 test で完了後 false 確認 |
| AC-4: open redirect 防止 5 ケース PASS | ✅ | `apps/web/src/lib/url/login-redirect.spec.ts (5 tests)` PASS |
| AC-5: silent refresh 不採用記録 | ✅ | `outputs/phase-02/auth-session-policy.md` |
| AC-6: Toast.spec.tsx alert role 描画 | ✅ | `outputs/phase-11/evidence/test.txt` (`Toast.spec.tsx (3 tests)` PASS) |
| AC-7: design-review.md Verdict=GO | ✅ | `outputs/phase-03/design-review.md` |
| AC-8: evidence 4 ログ exit 0 | ✅ | `outputs/phase-11/evidence/{typecheck,lint,test,build}.log` |
| AC-9: Phase 12 必須 7 ファイル存在 | ✅ | `outputs/phase-12/` |
