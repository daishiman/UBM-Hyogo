---
phase: 10
title: ローカル検証コマンド
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 10 — ローカル検証コマンド

[実装区分: 実装仕様書]

## 1. 前提

- Node 24 / pnpm 10 (`mise` 経由)
- 1Password CLI (`op`) 認証済
- ローカル `apps/web` dev サーバが起動できる状態 (`pnpm --filter @ubm-hyogo/web dev`)

## 2. 検証コマンド一覧 (順序通り実行)

### 2.1 依存確認

```bash
mise exec -- pnpm install
```

### 2.2 静的検査

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

### 2.3 build

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

### 2.4 selector 重複・マーカー整合チェック

```bash
# parallel-02 マーカー数
grep -c 'parallel-02.*(start)' apps/web/src/styles/globals.css   # 期待: 3
grep -c 'parallel-02.*(end)'   apps/web/src/styles/globals.css   # 期待: 3

# @layer components の閉じ括弧が 1 個
grep -cE '^@layer components ?\{?$' apps/web/src/styles/globals.css   # 期待: 1

# selector が parallel-02 ブロック内のみで出現
grep -nE 'data-component="(tag-pill|member-card)"|data-visibility=' apps/web/src/styles/globals.css
```

### 2.5 HEX 直書きなし確認 (verify-design-tokens 相当)

```bash
grep -rEn 'bg-\[#|text-\[#|border-\[#' apps/web/src && echo "HEX 直書きあり (NG)" || echo "HEX 直書きなし (OK)"
```

### 2.6 Playwright visual / a11y

```bash
# 初回 baseline 生成
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --grep "parallel-02" --update-snapshots

# 通常実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --grep "parallel-02"

# a11y
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --grep "a11y.*(tag-pill|member-card|visibility)"
```

### 2.7 dev サーバ目視確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# http://localhost:3000/members を開いて
#  - tag 選択 → 塗りつぶし反映確認
#  - card hover → border / shadow transition 確認
# http://localhost:3000/members/[id] を開いて
#  - section の左 border + icon 確認
```

### 2.8 PR pre-flight

```bash
bash scripts/verify-pr-ready.sh
```

## 3. 検証結果の保存

各コマンドの stdout / stderr を `outputs/phase-10/` 配下に保存する:

```bash
mkdir -p docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/outputs/phase-10/

mise exec -- pnpm typecheck \
  > docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/outputs/phase-10/typecheck.log 2>&1

mise exec -- pnpm lint \
  > docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/outputs/phase-10/lint.log 2>&1
```

これらのログは Phase 11 evidence inventory で参照される。

## 4. 失敗時のフォールバック

| 失敗ステップ | フォールバック |
|------------|---------------|
| `pnpm install` | `pnpm install --force` → lockfile 再生成 |
| `typecheck` | 型 import 漏れ確認 (本件は CSS のみなので通常発生しない) |
| `lint` | `pnpm lint --fix` 実行 |
| `build` | `next build --webpack` を直接実行してエラー箇所特定 |
| Playwright | `playwright install chromium` でブラウザ再取得 |
| `verify-pr-ready.sh` | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照 |
