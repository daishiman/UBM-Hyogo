# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 名称 | 最終レビュー |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

AC-1〜AC-12 を逐次チェックし、Phase 11（手動テスト / 動作証跡）に進む可否を判定する。

## AC チェックリスト

| AC | 内容 | 検証方法 | Gate |
| --- | --- | --- | --- |
| AC-1 | 依存追加 + `pnpm install` 成功 | `cat apps/web/package.json \| jq '.devDependencies'` | tailwindcss / @tailwindcss/postcss / cva / tailwind-merge / clsx 全て存在 |
| AC-2 | postcss.config.mjs が `@tailwindcss/postcss` 単独 | `cat apps/web/postcss.config.mjs` | autoprefixer 不在 |
| AC-3 | tokens.css に必須 OKLch tokens 全て | TC-RED-01 GREEN | test pass |
| AC-4 | @theme inline で token bridge → utility 生成 | TC-RED-04 + TC-EXT-01 GREEN | test pass + 生成 CSS に `.bg-accent` + `var(--ubm-color-accent)` |
| AC-5 | OKLch fallback (`@supports not`) 宣言 | TC-RED-02 GREEN | test pass |
| AC-6 | styles.css 削除 + layout.tsx import 切替 | `! test -e apps/web/app/styles.css` + `grep '@/styles/globals.css' apps/web/app/layout.tsx` | exit 0 |
| AC-7 | typecheck 0 error | Phase 9 evidence | typecheck.log |
| AC-8 | build:cloudflare exit 0 | Phase 9 evidence | build.log + `.open-next/worker.js` 存在 |
| AC-9 | preview:cloudflare で `/` 200 | Phase 9 evidence | preview-curl.log = 200 |
| AC-10 | tokens.test.ts pass | Phase 9 evidence | test.log |
| AC-11 | HEX 直書き 0 件 | Phase 9 evidence | hex-grep-gate.log exit 0 |
| AC-12 | apps/api 不変 | Phase 9 evidence | apps-api-diff-zero.log = 0 |

## レビュー観点（補助）

- **diff scope 規律**（元タスク末尾参照）: `git diff main...HEAD --name-only` の出力が、Phase 2 §「変更対象ファイル」 + 本 workflow package（`docs/30-workflows/task-09-w3-par-tailwind-v4-setup/`）配下のみで構成されているか
- **コミット粒度**: 1 コミットに依存追加 / 設定 / styles 削除 / テスト追加が論理的にまとまっているか（Phase 13 で squash 可）
- **コメント残存**: TODO / FIXME / debug log が残っていないか

## 完了条件

- [ ] AC-1〜AC-12 すべて GREEN（または明示的な保留理由が記録されている）
- [ ] レビュー観点 3 項目に問題なし
- [ ] `outputs/phase-10/ac-matrix.md` に AC × 検証結果が表形式で保存

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/ac-matrix.md`
