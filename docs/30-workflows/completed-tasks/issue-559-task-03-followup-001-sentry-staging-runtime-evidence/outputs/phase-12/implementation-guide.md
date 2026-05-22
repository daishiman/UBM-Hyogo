# Implementation Guide

## Part 1: 中学生レベル

Web サイトで問題が起きたとき、だれにも知らせが届かないと、壊れたまま時間がたってしまいます。これは、学校の教室で窓ガラスが割れたのに、先生に伝える係がいない状態に似ています。Sentry は、その「先生に知らせる係」です。

このタスクでは、本番に出す前の試し打ち場所で、本当に知らせが届くかを確認します。先に、必要なファイルがそろっているかを確認します。次に、秘密の連絡先を安全な保管場所から取り出して、Cloudflare に登録します。そのあと、試し打ち場所でページが開くこと、サーバー側とブラウザ側の両方から知らせが届くこと、作られたファイルに混ぜてはいけない文字が入っていないことを確認します。

今回のサイクルでは、必要なファイル確認、ローカルでの検査、作られたファイルの文字確認、秘密の値が漏れていないことの確認まで終わりました。ただし、秘密の連絡先を入れておく 1Password の場所がまだ用意されていません。そのため、実際の登録と試し打ち場所での確認は、用意が終わってから行います。

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| Sentry | Web サイトの故障を知らせる係 |
| staging | 本番公開前の試し打ち場所 |
| DSN | Sentry に知らせを届けるための秘密の連絡先 |
| Cloudflare Secret | サーバーだけが読める秘密の保管箱 |
| grep gate | 作ったファイルに混ぜてはいけない文字がないか探す検査 |
| runtime evidence | 実際に動かした証拠 |
| 1Password vault | 秘密の値をしまう鍵付きの棚 |

### Part 1 チェック

| 項目 | 判定 |
| --- | --- |
| 日常生活の例え話 | PASS（教室の窓ガラスと先生への連絡） |
| 専門用語 5 語以上の言い換え | PASS（7 語） |
| なぜ必要かを先に説明 | PASS |
| 本サイクルの未完了境界 | PASS（1Password 未 provisioning を明示） |

## Part 2: 技術者レベル

### Runtime contract

```ts
type SentryRuntimeEvidenceState =
  | "PASS_BOUNDARY_SYNCED_RUNTIME_PENDING"
  | "PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED";

interface SentryStagingRuntimeEvidence {
  workflowRoot: "docs/30-workflows/issue-559-task-03-followup-001-sentry-staging-runtime-evidence";
  environment: "staging";
  serverWorkerArtifact: "apps/web/.open-next/worker.js";
  requiredSecretName: "SENTRY_DSN_WEB";
  publicDsnSource: "NEXT_PUBLIC_SENTRY_DSN";
  evidence: {
    preflight: string;
    secretList?: string;
    deploy?: string;
    curl?: string;
    sentryServerScreenshot?: string;
    sentryBrowserScreenshot?: string;
    grepGate: string;
    dsnLeakScan: string;
  };
  state: SentryRuntimeEvidenceState;
}
```

### API / command signatures

```bash
# G0: repository preflight
test -f apps/web/src/instrumentation.ts
test -f apps/web/src/instrumentation-client.ts
test -f apps/web/src/lib/sentry/capture.ts

# G1 prerequisite: 1Password canonical source check
op item get 'Sentry Web DSN (staging)' --vault UBM-Hyogo --fields label=dsn --reveal=false
op item get 'Sentry Web DSN (staging)' --vault UBM-Hyogo --fields label=public_dsn --reveal=false

# G1: Cloudflare secret placement, after user approval only
op read 'op://UBM-Hyogo/Sentry Web DSN (staging)/dsn' \
  | bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging

# G4: server runtime artifact gate
rg -n 'requestIdleCallback|@sentry/nextjs' apps/web/.open-next/worker.js
```

### Configuration parameters

| Name | Location | Secret | Required for runtime verified |
| --- | --- | --- | --- |
| `SENTRY_DSN_WEB` | Cloudflare Secrets | yes | yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Cloudflare vars / public browser env | public DSN, not repo literal | yes |
| `SENTRY_ENVIRONMENT` | `apps/web/wrangler.toml` | no | yes |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `apps/web/wrangler.toml` | no | yes |
| `SENTRY_TRACES_SAMPLE_RATE` | `apps/web/wrangler.toml` | no | yes |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | `apps/web/wrangler.toml` | no | yes |

### Error handling and edge cases

| Case | Handling |
| --- | --- |
| Parent runtime files missing | Stop at G0. Keep parent task-03 at `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`. |
| 1Password vault/item missing | Do not run secret put. Resolve `task-issue-559-sentry-project-1password-dsn-provisioning-001.md` first. |
| `cf.sh secret list` prints value | Abort as secret hygiene violation. |
| staging curl is not 200 | Capture deploy log, do not promote parent state. |
| Sentry server/browser event missing | Keep runtime pending and diagnose DSN / release / init guard. |
| `worker.js` contains `requestIdleCallback` or `@sentry/nextjs` | Treat as AC-4 regression and return to parent task-03. |

## Part 3: 本サイクル（2026-05-08 / wt-13）の到達点

- worktree を `origin/dev` (`7d27f796`) に rebase し、親 task-03 の `instrumentation.ts` / `instrumentation-client.ts` / `lib/sentry/capture.ts` を取り込み済み。
- 再検証で spec FR-1 / FR-2 / NFR-1 の未実装差分を発見し、本サイクルで実コードに実装:
  - `apps/web/src/lib/env.ts`: `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` を `EnvSchema` に追加
  - `apps/web/wrangler.toml`: 各 vars セクションに `NEXT_PUBLIC_SENTRY_ENVIRONMENT` 追加
  - `apps/web/.dev.vars.example`: spec 正本 `op://UBM-Hyogo/...` に統一、`NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` 追加
  - `apps/web/src/lib/__tests__/env.test.ts`: `NEXT_PUBLIC_SENTRY_*` 3 テストケース追加
- G0 preflight PASS、ローカル品質ゲート 5 点 PASS（typecheck / lint / **445 tests** / next build / OpenNext Cloudflare build）。
- G4 grep gate（pre-deploy, scope=`apps/web/.open-next/worker.js`, post-implementation rebuild）PASS（`requestIdleCallback` / `@sentry/nextjs` 共に 0 件）。
- DSN leak scan PASS（プレースホルダ例 1 件のみ、実 DSN 漏洩なし）。
- G1 secret 投入は 1Password `UBM-Hyogo` vault / `Sentry Web DSN (staging|production)` item が未 provisioning のため halt。G2/G3/G5 未実行、状態は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 維持。
- 次サイクル prerequisite: Sentry project + 1Password vault/item provisioning。
