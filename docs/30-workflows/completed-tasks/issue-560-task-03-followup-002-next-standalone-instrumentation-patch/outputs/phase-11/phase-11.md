# Phase 11 Output — NON_VISUAL evidence

スクリーンショット撮影対象なし（CLI script + CI gate）。代わりに以下のコマンドログを evidence とする。

## CI gate fail evidence (verify-only)

```text
$ cd apps/web && node ../../scripts/patch-next-standalone-instrumentation.mjs --verify-only
[patch-next-standalone-instrumentation] event=verify_start mode=verify-only target=.../apps/web/.next/standalone/apps/web/.next
[patch-next-standalone-instrumentation] event=verify_failed reason=missing target=.../apps/web/.next/standalone/apps/web/.next/server/instrumentation.js message=Sentry server instrumentation missing in standalone build artifact
exit 1
```

## CI gate pass evidence (regression test PASS)

`outputs/phase-9/quality-evidence.log` に node --test 9/9 PASS の記録あり:

```text
✔ TC-01: cwd guard fails outside apps/web
✔ TC-02: missing input causes failure
✔ TC-03: happy path copies instrumentation to standalone
✔ TC-04: trace files[] are copied to standalone
✔ TC-05: overwrite stale standalone artifact
✔ TC-06a: --verify-only fails when artifact missing
✔ TC-06b: --verify-only fails when tokens absent
✔ TC-06c: --verify-only succeeds after copy
✔ TC-07: malformed trace JSON causes structured failure
ℹ tests 9 / pass 9 / fail 0
```

## build:cloudflare evidence

`mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` was executed and failed before patch script execution because OpenNext/esbuild reported `Host version "0.25.4" does not match binary version "0.21.5"`. This is recorded in `outputs/phase-9/build-cloudflare-evidence.log` and is not counted as a successful standalone artifact verification.

## cwd guard evidence

```text
$ node scripts/patch-next-standalone-instrumentation.mjs   # repo root cwd
[patch-next-standalone-instrumentation] event=cwd_guard_failed cwd=/.../task-20260508-190304-wt-4
exit 1
```
