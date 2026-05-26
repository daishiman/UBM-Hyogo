---
phase: 10
title: ローカル検証手順
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 10 — ローカル検証手順

[実装区分: 実装仕様書]

## 1. 環境準備

```bash
# Node 24 / pnpm 10 確認
mise install
node -v                # 期待: v24.15.0
mise exec -- pnpm -v   # 期待: 10.33.2

# 依存インストール
mise exec -- pnpm install --force
```

> Vitest / esbuild runtime トラブル時: `mise exec -- pnpm verify:vitest-runtime` で 3 verify をまとめて実行。

## 2. 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 双方 exit 0。lint で fix 可能な違反は `mise exec -- pnpm lint --fix` で吸収。

## 3. adapter unit spec

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts
```

期待: 8 ケース全て green, branch coverage 100%。

coverage 表示:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts --coverage
```

## 4. ローカル dev server 起動と手動確認

### 4.1 API 側（apps/api）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api dev
# wrangler dev で D1 binding 経由の /public/members/:memberId が起動
# 既定 port: 8787
```

### 4.2 web 側（apps/web）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# Next.js dev / OpenNext Workers ローカル起動
# 既定 port: 8788
```

`.env` / `.dev.vars` で `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787` を `op://` 参照で設定（CLAUDE.md「ローカル `.env` の運用ルール」遵守）。

### 4.3 ブラウザ確認

```
http://127.0.0.1:8788/members/<seeded-member-id>
```

確認項目:

- [ ] PublicHeader / PublicFooter が表示される
- [ ] ProfileHero が summary（fullName / nickname / location / occupation）を描画する
- [ ] 6 section（または filter 後の section）が表示される
- [ ] `data-stable-key="response_email"` が DOM に存在しない（DevTools Elements で確認）
- [ ] `data-stable-key="public_consent"` が DOM に存在しない
- [ ] tags / attendance が表示される
- [ ] 存在しない `:id` でアクセスすると not-found 画面が表示される

## 5. Playwright spec

### 5.1 headed mode（手動確認用）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --headed --project=chromium
```

### 5.2 headless（CI 相当）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --project=chromium
```

### 5.3 snapshot 初回生成

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --update-snapshots --project=chromium
```

serial-06 の smoke screenshot は `apps/web/playwright/tests/serial-06-member-detail.spec.ts` が直接 `outputs/phase-11/screenshots/public-member-detail.png` に保存する。production-equivalent baseline は `serial-07-regression-evidence` 側で管理する。

## 6. PR pre-flight

```bash
bash scripts/verify-pr-ready.sh
```

期待: exit 0。失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を順に確認:

1. `gate-metadata:validate`
2. `verify:phase12-compliance`
3. `indexes:rebuild` drift

## 7. 動作確認用 D1 seed（補助・任意）

実 D1 ローカル DB に test member を seed する場合（Playwright in-process mockApi fixture（戦略B）を使わない場合の補助手段）:

```bash
# 認証確認
bash scripts/cf.sh whoami

# seed（実 SQL は serial-07 で確定）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --local \
  --command "INSERT INTO members (id, ...) VALUES ('member-fixture-001', ...);"
```

詳細 seed SQL は `serial-07-regression-evidence` で確定する。本 sub-workflow では Playwright in-process mockApi fixture（戦略B）を主とする。SSR fetch intercept のため `page.route()` は使わない（Phase 6 §3 参照）。

## 8. 検証コマンド一括実行

```bash
# DoD 一括（Phase 8 §3 と同等）
mise exec -- pnpm typecheck \
  && mise exec -- pnpm lint \
  && mise exec -- pnpm --filter @ubm-hyogo/web test -- \
       src/lib/adapters/__tests__/member-detail.spec.ts \
  && mise exec -- pnpm --filter @ubm-hyogo/web exec \
       playwright test public-member-detail --project=chromium \
  && bash scripts/verify-pr-ready.sh
```

## 9. 参照

- Phase 5 実装ガイド
- Phase 6 テスト方針
- Phase 7 品質ゲート
- CLAUDE.md「よく使うコマンド」「Cloudflare 系 CLI 実行ルール」「ローカル `.env` の運用ルール」
