# Phase 7: カバレッジ

## 1. 目標

- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`: line ≥ 90% / branch ≥ 80%
- 全体カバレッジは既存閾値（`coverage-guard.sh` の baseline）以下に下げない

## 2. 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage \
  "app/(public)/members/\\[id\\]/__tests__/opengraph-image.spec.tsx"
```

`coverage/coverage-summary.json` から該当ファイルの line / branch を抽出する。

## 3. 全体ガード

```bash
bash scripts/coverage-guard.sh --changed
```

`--changed` モードで現在 push 範囲のカバレッジ低下がないことを確認。merge commit を含む場合は自動 skip される（CLAUDE.md 個人開発ポリシー）。

## 4. 期待結果

| 観点 | 期待値 |
|---|---|
| `opengraph-image/route.tsx` line coverage | ≥ 90% |
| `opengraph-image/route.tsx` branch coverage | ≥ 80%（正常・404・throw の 3 分岐） |
| 全体 line coverage delta | ≥ 0 |

未達の場合は Phase 6 のテスト snippet を追加・再実行する。
