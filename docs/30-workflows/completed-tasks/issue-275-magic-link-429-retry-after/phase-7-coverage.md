# Phase 7: カバレッジ

> 実装区分: **実装仕様書**

## 1. 目標

- `apps/web/src/lib/auth/magic-link-client.ts`: line ≥ 90% / branch ≥ 85%
- `apps/web/app/login/_components/MagicLinkForm.client.tsx`: line ≥ 85% / branch ≥ 80%
- 全体 line coverage delta ≥ 0（`coverage-guard.sh` baseline を下げない）

## 2. 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage \
  -- src/lib/auth/magic-link-client.spec.ts \
     app/login/_components/MagicLinkForm.component.spec.tsx
```

`apps/web/coverage/coverage-summary.json` から該当ファイル 2 件の line / branch を抽出する。

## 3. 全体ガード

```bash
bash scripts/coverage-guard.sh --changed
```

`--changed` モードで現在 push 範囲のカバレッジ低下がないことを確認。merge commit を含む場合は自動 skip される（CLAUDE.md 個人開発ポリシー）。

## 4. 期待結果

| 観点 | 期待値 |
|---|---|
| `magic-link-client.ts` line coverage | ≥ 90% |
| `magic-link-client.ts` branch coverage | ≥ 85%（既存 + 429 header / body / default / invalid の 4 新規分岐） |
| `MagicLinkForm.client.tsx` line coverage | ≥ 85% |
| `MagicLinkForm.client.tsx` branch coverage | ≥ 80%（catch 内 typed error 判別を含む） |
| 全体 line coverage delta | ≥ 0 |

未達の場合は Phase 6 のテスト snippet を追加・再実行する。
