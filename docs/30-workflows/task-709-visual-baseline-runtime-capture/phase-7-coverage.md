[実装区分: 実装仕様書]

# Phase 7: カバレッジ確認

## 目的

51 baseline PNG（17 routes × 3 viewport）が全件存在することを確認する。

## 1. カバレッジ計測対象

| 項目 | 期待値 |
|------|--------|
| baseline PNG ファイル数 | 51 |
| route 数 | 17 |
| viewport 数 | 3 |

## 2. 確認コマンド

```bash
SNAPSHOT_DIR=apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots

# 全件数
ls "$SNAPSHOT_DIR"/*.png 2>/dev/null | wc -l   # 期待: 51

# viewport ごと
for vp in desktop tablet mobile; do
  count=$(ls "$SNAPSHOT_DIR"/*-$vp-*.png 2>/dev/null | wc -l)
  echo "$vp: $count"   # 各 17
done

# route ごと（fixture と突合）
mise exec -- node -e "
const { VISUAL_ROUTES } = require('./apps/web/playwright/fixtures/visual-routes.ts');
const fs = require('fs');
const dir = 'apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots';
const files = fs.readdirSync(dir);
for (const r of VISUAL_ROUTES) {
  for (const vp of ['desktop', 'tablet', 'mobile']) {
    const hit = files.some(f => f.startsWith(\`full-visual-\${r.slug}-\${vp}-\`));
    if (!hit) console.error('MISSING:', r.slug, vp);
  }
}
console.log('coverage check done');
"
```

## 3. 受入条件

- 全 51 件が存在し、`MISSING:` 出力がない
- 各 viewport 17 件
- sha256 が `outputs/phase-11/evidence/baseline-list.md` に記録されている

## 4. 出力先

- 本タスクでは `pnpm coverage` 等のコード coverage は対象外（CI workflow / baseline 整備タスクのため）
- baseline coverage の evidence は `outputs/phase-7/coverage-report.md` に shell 出力を貼り付ける

## 5. 成果物

- 本ファイル `phase-7-coverage.md`
- `outputs/phase-7/coverage-report.md`（実行時生成）
