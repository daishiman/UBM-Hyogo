# Phase 9: - 品質保証

[実装区分: 実装仕様書 / Phase 09]

## 目的

CI 同等の品質チェックをローカルで実行し、すべて green であることを evidence として残す。

## 実行コマンド一覧

```bash
mise exec -- pnpm install --force
TASK_ROOT=docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash
mkdir -p "$TASK_ROOT/outputs/phase-09"
mise exec -- pnpm typecheck       2>&1 | tee "$TASK_ROOT/outputs/phase-09/typecheck.log"
mise exec -- pnpm lint            2>&1 | tee "$TASK_ROOT/outputs/phase-09/lint.log"
mise exec -- pnpm build           2>&1 | tee "$TASK_ROOT/outputs/phase-09/build.log"
mise exec -- pnpm vitest run      2>&1 | tee "$TASK_ROOT/outputs/phase-09/test.log"
# design-tokens gate（task-18）
mise exec -- pnpm verify:design-tokens 2>&1 | tee -a "$TASK_ROOT/outputs/phase-09/lint.log" || true
# line budget / link check（既存 CI 由来 script があれば実行）
mise exec -- pnpm exec markdown-link-check docs/30-workflows/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash/index.md || true
```

## Gate 一覧

| Gate | 期待 | 失敗時 |
| --- | --- | --- |
| `pnpm typecheck` | exit 0 / 新規エラー 0 件 | 該当ファイル修正 |
| `pnpm lint` | exit 0 / 新規エラー 0 件 | `pnpm lint --fix` → 残違反は手修正 |
| `pnpm build` | exit 0 | エラー解消（Cloudflare Workers 互換 build = `next build --webpack`） |
| `pnpm vitest run` | 全 spec pass | 失敗 spec 修正 |
| `verify-design-tokens` | violation 0 件（HEX 直書きなし） | OKLch tokens 経由に置換 |
| line budget | 1 ファイル 800 行未満（CLAUDE.md 既存運用） | 分割 |
| link check | 内部リンク 404 なし | 修正 |

## 出力

- `outputs/phase-09/main.md` — 品質保証実施サマリ
- `outputs/phase-09/typecheck.log`
- `outputs/phase-09/lint.log`
- `outputs/phase-09/build.log`
- `outputs/phase-09/test.log`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 状態 | spec_created |

## 実行タスク

- 本文の目的・手順・出力に従う。

## 参照資料

- `index.md`
- `artifacts.json`

## 成果物

- `outputs/phase-*` に定義された成果物。

## 完了条件

- [ ] 本 Phase の出力仕様が `artifacts.json` と一致している。

## 統合テスト連携

- 実装 Phase で指定された focused command と Phase 09 品質ゲートに接続する。
