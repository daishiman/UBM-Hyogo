---
phase: 10
title: ローカル検証手順
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
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
node -v   # v24.15.0
mise exec -- pnpm -v   # 10.33.2

# 依存インストール
mise exec -- pnpm install --force
```

## 2. 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 3. adapter unit spec

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts
```

期待: 6 ケース全て green, branch coverage 100%。

## 4. ローカル dev server 起動と手動確認

### 4.1 API 側（apps/api）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api dev
# wrangler dev で D1 binding 経由の /public/members/:memberId が起動
```

### 4.2 web 側（apps/web）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# Next.js / OpenNext Workers ローカル起動
```

### 4.3 ブラウザ確認

```
http://127.0.0.1:8788/members/<seeded-member-id>
```

確認項目:

- [ ] PublicHeader / PublicFooter が表示される
- [ ] ProfileHero が summary を描画する
- [ ] 6 section（または filter 後の section）が表示される
- [ ] `data-stable-key="response_email"` が DOM に存在しない（DevTools で確認）
- [ ] tags / attendance が表示される

## 5. Playwright spec

```bash
# headed mode で動作確認
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --headed --project=chromium

# headless で CI 相当実行
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --project=chromium
```

### 5.1 snapshot 初回生成

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --update-snapshots
```

baseline は `apps/web/tests/e2e/__screenshots__/` に保存される。

## 6. PR pre-flight

```bash
bash scripts/verify-pr-ready.sh
```

期待: exit 0。失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照。

## 7. 動作確認用 D1 seed（補助）

実 D1 ローカル DB に test member を seed する場合:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --local \
  --command "INSERT INTO members (id, ...) VALUES ('member-fixture-001', ...);"
```

詳細 seed SQL は serial-07 で確定する。本 sub-workflow では Playwright `page.route()` mock を採用してもよい。

## 8. 参照

- Phase 5 実装ガイド
- Phase 6 テスト方針
- CLAUDE.md「よく使うコマンド」
