# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 名称 | リファクタリング |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

GREEN 状態を維持しつつ、tokens.css / globals.css の可読性・保守性を上げる。**機能変更禁止**（テストが GREEN のまま）。

## リファクタリング項目

### R8-1. tokens.css のグルーピング再整理

- 論理ブロックを `/* ==== Section Name ==== */` 形式の太い区切りで明示
- 同カテゴリ内の token はアルファベット順に並べ替え
- コメントで token の意図を 1 行で記述（例: `--ubm-color-accent: warm orange brand color`）

### R8-2. globals.css のコメント整理

- ファイル冒頭のヘッダーコメントに「順序固定の意図」を明記
- `@theme inline` ブロック内を category（color / radius / shadow / font）でセクション分け
- `@layer base` 内は native element ごとにセクションコメント

### R8-3. `__fixtures__/utility-probe.tsx` の整理

- utility class を category ごとに改行整列
- ファイル冒頭にプローブ目的の説明コメント

### R8-4. tsconfig.json の paths 整理

- 既存 `paths` がある場合は `"@/*"` を末尾に追加
- 余分な entry を削除しない（影響範囲が広いため scope 外）

## 禁止事項

- token 値の変更（task-08 正本との同期が前提）
- @theme bridge の名前変更（下流 task-10..17 の interface）
- ファイル分割（globals.css の `@theme` 切り出し等は別タスク）

## ローカル検証

```bash
# 全テスト GREEN 維持
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

## 完了条件

- [ ] R8-1〜R8-4 が適用されている
- [ ] 全テストが GREEN を維持
- [ ] `git diff` でコメント / 並び替え以外の機能変更がないことを確認

## 成果物

- `outputs/phase-8/main.md`
- `outputs/phase-8/refactor-diff.md` — `git diff` の機能変更ゼロ確認
