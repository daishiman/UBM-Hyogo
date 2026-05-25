**[実装区分: 実装ガイド]**

# Implementation Guide

## Part 1: 中学生レベル

この変更は、同じカメラで「家で撮る写真」と「会場で撮る写真」を別々のアルバムに保存できるようにするものです。今までは保存先が決まっていたため、会場で撮った写真が家用のアルバムに混ざる危険がありました。

そこで、保存先を書いたメモを渡されたときだけ、そのメモの場所へ写真を入れるようにしました。メモがないときは、今まで通りの家用アルバムに保存します。

また、会場での確認を間違えないように、実行するための短い手順書を1つ作りました。この手順書は会場確認だけを行い、会場の設営や公開作業は勝手に行いません。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| Playwright | 画面を自動で見に行く係 |
| evidence | 確認した証拠写真や記録 |
| staging | 本番前の試し打ち場所 |
| environment variable | 実行時に渡すメモ |
| smoke test | まず壊れていないか見る短い確認 |

## Part 2: 技術者レベル

### Interface / constants

```ts
const EVIDENCE_DIR = resolve(
  process.cwd(),
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
    '../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots',
)
```

`PLAYWRIGHT_EVIDENCE_DIR` が設定されている場合のみ screenshot 出力先を差し替える。未設定時の local baseline path は親 workflow の current completed path を使う。

### Shell API

```bash
bash scripts/run-login-staging-smoke.sh <staging-base-url>
PLAYWRIGHT_STAGING_BASE_URL=<staging-base-url> bash scripts/run-login-staging-smoke.sh
```

引数があれば引数を優先し、なければ `PLAYWRIGHT_STAGING_BASE_URL` を読む。URL 未指定、または `https://` 以外は実行前に失敗する。

### Implementation Steps

1. `login-smoke.spec.ts` の `EVIDENCE_DIR` を env override 化する。
2. `scripts/run-login-staging-smoke.sh` を追加し、staging base URL と evidence dir を設定する。
3. helper は `pnpm --dir apps/web exec playwright test playwright/tests/login-smoke.spec.ts --project=staging --grep 'renders LoginCard|captures mobile input' --reporter=line` だけを実行し、staging evidence 対象の 7 screenshot test に限定する。
4. deploy、secret、commit、push、PR は helper の責務外に置く。

### Verification Commands

```bash
bash -n scripts/run-login-staging-smoke.sh
bash scripts/run-login-staging-smoke.sh
PLAYWRIGHT_STAGING_BASE_URL=http://example.test bash scripts/run-login-staging-smoke.sh
pnpm --filter @ubm-hyogo/web typecheck
pnpm verify:phase12-compliance -- docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke
```

### Known Limits

staging deploy と staging smoke 本実行は user-gated のため、この実装サイクルでは local validation までを完了状態にする。Phase 11 runtime evidence は user 承認後に `pending` から `present` へ昇格する。
