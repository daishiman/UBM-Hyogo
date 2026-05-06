# Phase 7 正本: カバレッジ閾値判定

## 目的
Phase 6 の coverage 結果を読み、対象 2 ファイルが lines 80% / branches 75% を満たすかを判定する。未達時は追加テストケースを提示する。

## 閾値
| ファイル | lines | branches |
|----------|-------|----------|
| `apps/api/src/jobs/retention-purge.ts` | >= 80% | >= 75% |
| `apps/api/src/services/retention-policy.ts` | >= 80% | >= 75% |

## 判定手順
1. `apps/api/coverage/coverage-summary.json` を読み込む。
2. 対象 2 ファイルのキーを抽出（絶対パスでマッチ）。
3. `lines.pct` / `branches.pct` を閾値と比較。
4. 全て満たせば PASS。1 つでも未達なら FAIL とし、未達ファイルと未カバー行を記録。

判定スクリプト例（手動運用想定）:
```bash
mise exec -- node -e "
const j = require('./apps/api/coverage/coverage-summary.json');
const targets = [
  'src/jobs/retention-purge.ts',
  'src/services/retention-policy.ts',
];
for (const t of targets) {
  const k = Object.keys(j).find(k => k.endsWith(t));
  const v = j[k];
  console.log(t, 'lines', v.lines.pct, 'branches', v.branches.pct);
}
"
```

## 未達時の追加テスト案

### `retention-purge.ts` が未達の場合
- 例外パスのカバー: `db.transaction` で throw した場合に他 member 処理が続行することを確認するテストを追加。
- `affectedRows` 集計の境界: 0 件 / 1 件 / 複数 member 複数テーブル混在のケース。
- dry-run と apply の両モードで同じ SELECT 結果になることを契約テスト化。
- `now` 境界条件: `datetime(deleted_at, '+180 days') === datetime('now')` のケース（`<=` 比較の包含確認）。

### `retention-policy.ts` が未達の場合
- `getActivePolicies()` が `mode: null` を除外することを assertion。
- 既定 `RETENTION_POLICIES` の各エントリに対する snapshot test（policy の構造変化を検出）。
- 不正な policy（columns 未指定で mode='anonymize'）に対する type-level / runtime ガード。

## 完了基準
- 判定結果が PASS であること。
- FAIL の場合は本ドキュメントに未達ファイルと追加テスト案を記録のうえ Phase 5 にループバックする。
