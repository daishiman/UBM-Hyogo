# Phase 6 正本: テストカバレッジ取得

## 目的
Phase 5 で追加した retention purge job / retention policy のユニットテストカバレッジを vitest --coverage で取得し、Phase 7 の閾値判定に渡す。

## 対象ファイル
- `apps/api/src/jobs/retention-purge.ts`
- `apps/api/src/services/retention-policy.ts`

## 実行コマンド
```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --coverage
```

`apps/api/vitest.config.ts` の coverage 設定:
```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json-summary', 'html'],
  include: [
    'src/jobs/retention-purge.ts',
    'src/services/retention-policy.ts',
  ],
  thresholds: {
    lines: 80,
    branches: 75,
  },
}
```

> 既存 vitest.config に同 include 設定が既にある場合は、対象ファイルだけ追記する。テスト全体の閾値設定とは独立に扱う。

## 取得する成果物
- `apps/api/coverage/coverage-summary.json`
- `apps/api/coverage/index.html` (人間確認用)

## 記録項目（Phase 7 へ引き渡す情報）
- `retention-purge.ts`: lines% / branches% / statements% / functions%
- `retention-policy.ts`: lines% / branches% / statements% / functions%
- 未カバーの行番号リスト

## 注意事項
- 統合テスト (`*.int.test.ts`) は Phase 8 で扱う。Phase 6 のカバレッジ計測は **ユニットテストのみ** で行う。これは「ユニット単体で十分カバーされていること」を担保するためで、統合テストでカバレッジを底上げして閾値を取り繕う運用を避ける。
- 失敗テストがある場合は Phase 5 に戻り修正する。

## 完了基準
- `coverage-summary.json` が生成されている。
- 対象 2 ファイルの coverage 値が JSON に存在する。
