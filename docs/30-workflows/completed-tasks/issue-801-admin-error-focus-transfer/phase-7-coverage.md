# Phase 7: Coverage — issue-801 admin error focus transfer

## 範囲

`apps/web/app/(admin)/admin/error.tsx` および新規テストの coverage 確認。

## 期待 coverage

| 観点 | 期待 |
|---|---|
| Statements | 100% |
| Branches | 100%（dev/prod 分岐、digest 有無、`headingRef.current?.` optional chain） |
| Functions | 100% |
| Lines | 100% |

## 検証コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run admin/__tests__/error.component --coverage
```

## カバー漏れの可能性

- `headingRef.current` が null になるケース: jsdom 環境では mount 直後に ref は解決されるため、optional chain の null 側は実行されない。これは React の動作仕様であり、強制カバー目的のテスト追加は **不要**（Branch coverage が `headingRef.current?.` を 99% にしても妥協する）
- production env での `<pre>` 非表示は TC-AE-02 でカバー

## coverage exclude 妥当性

`vitest.config.ts` の `coverage.exclude` に `apps/web/app/(admin)/admin/error.tsx` を追加しない。本ファイルはユーザー導線に乗る production 経路 (Next.js error boundary) のため exclude 不可。

## DoD

- 該当ファイルが coverage 集計に含まれる
- coverage-exclude-ratio gate (CLAUDE.md) を悪化させない
