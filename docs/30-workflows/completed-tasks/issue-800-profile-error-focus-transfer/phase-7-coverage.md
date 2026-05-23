# Phase 7: カバレッジ確認

**[実装区分: 実装仕様書]**

## 1. 対象範囲

`apps/web/src/lib/a11y/useAutoFocusOnMount.ts` と root/profile/login/admin error boundary の lines / branches を Phase 6 の focused 31 ケースでカバーする。

## 2. 期待値

| 指標 | 期待値 | 理由 |
|---|---|---|
| Lines | 95%+ | dev stack pre 表示行は production NODE_ENV 既定で未到達。1〜2 行の許容 |
| Branches | 80%+ | `error.digest` 有無 2 軸 / `isDev` 2 軸の計 4 組合せのうち digest 2 軸を 2 ケースでカバー |
| Functions | 100% | `ProfileError` のみ |

## 3. 実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run \
  --coverage \
  app/profile/__tests__/error.component.spec.tsx
```

## 4. 既存 coverage gate との整合

- `coverage-exclude-ratio` CI gate（issue-256）: error boundary は exclude 対象に該当する route ではなく、本タスクで coverage 比率を悪化させない方向（カバレッジ追加）。
- `coverage-guard.sh` pre-push: feature ブランチ push 時に既存 baseline 維持を確認。本タスクは局所カバレッジ向上のため pass する見込み。

## 5. 未カバー許容範囲

- `isDev && <pre>` 分岐の production 側未到達: 既存 root error.tsx も同様の状態のため許容。dev 観測性テストが必要になった場合は別 followup でカバー。
