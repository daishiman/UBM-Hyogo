[実装区分: 実装仕様書]

# prerender-output-check.md（PASS）

| 項目 | 値 |
| --- | --- |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |
| evidence status | PASS |

## 目的

Phase 11 実測 9 段手順の段 7 として `apps/web/.open-next/worker.js` の生成確認と、参考として `apps/web/.next/server/app/` 配下の prerender 成果物を記録する。AC-2 の evidence。

## 段 7: worker.js 生成確認

```bash
ls -la apps/web/.open-next/worker.js
find apps/web/.next/server/app -name "_global-error*" -o -name "_not-found*" 2>/dev/null
ls -la apps/web/.next/server/app/ | head -40
```

## 期待結果

- `apps/web/.open-next/worker.js` が存在し size > 0
- `_global-error.html` / `_global-error.rsc` 等の prerender 出力が `.next/server/app/` 配下に存在
- `_not-found.html` 等の prerender 出力が同配下に存在

## 実測

- evidence: PASS
- 実行日時: 2026-05-03
- `apps/web/.open-next/worker.js`: exists / size > 0
- `/_not-found`: Next route table で static prerender `○ /_not-found`
- `/_global-error`: prerender error なし（route table には表示されない Next internal route）

## 判定

- AC-2 (worker.js 生成): PASS
- 不変条件 #14（free-tier worker サイズ）: PASS（生成確認。deploy 時サイズ監査は継続）
