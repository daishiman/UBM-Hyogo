# Phase 7: - カバレッジ確認

[実装区分: 実装仕様書 / Phase 07]

## 目的

aggregator script の line / branch カバレッジ ≥ 90% を gate として満たすことを確認する。対象範囲を `scripts/cf-audit-log/dashboard/**` に限定する。

## 対象範囲（明示）

- include: `scripts/cf-audit-log/dashboard/**/*.ts`
- exclude: `scripts/cf-audit-log/dashboard/**/__tests__/**`、`scripts/cf-audit-log/dashboard/**/*.spec.ts`
- 候補 A 採択時の `apps/web/src/app/(admin)/admin/audit/dashboard/page.tsx` は別 coverage 集計（既存 `apps/web` カバレッジルールに従う）

## Vitest config 一時 override

```bash
mise exec -- pnpm vitest run \
  --coverage \
  --coverage.include='scripts/cf-audit-log/dashboard/**' \
  --coverage.exclude='scripts/cf-audit-log/dashboard/**/__tests__/**' \
  --coverage.thresholds.lines=90 \
  --coverage.thresholds.branches=90 \
  scripts/cf-audit-log/dashboard/__tests__/
```

## Gate 判定

| 指標 | しきい値 | 失敗時の対処 |
| --- | --- | --- |
| Line coverage | ≥ 90% | 不足 line を Phase 06 ケース追加 or dead code 削除（Phase 08 で実施） |
| Branch coverage | ≥ 90% | if/else / try-catch / `??` の各 branch にケース追加 |

## 出力

- `outputs/phase-07/main.md` — coverage 実施記録
- `outputs/phase-07/coverage.json` — Vitest coverage summary 抜粋

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
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
