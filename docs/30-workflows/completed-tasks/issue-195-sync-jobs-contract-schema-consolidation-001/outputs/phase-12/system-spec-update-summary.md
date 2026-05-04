# system-spec-update-summary

## aiworkflow-requirements Step 1-A/B/C
- Step 1-A (resource-map): `Issue #435 sync_jobs runtime contract consolidation` 行を追加し、workflow / logical spec / owner table / runtime SSOT 導線を登録
- Step 1-B (topic-map): line-number shift（database-schema.md 追記分） → indexes:rebuild で自動反映
- Step 1-C (quick-reference): Forms Response Sync 早見に `sync_jobs` runtime contract SSOT 行を追加

## database-schema.md 更新内容
- `sync_jobs` 節 L57-59 に追記:
  - `pageToken` は単一実行内のページングに限定
  - `metrics_json` は PII 系キーと email 形式値を runtime schema で拒否
  - 値追加時は `_design/sync-jobs-spec.md` と runtime SSOT を同一 wave で更新
  - owner / co-owner 境界は `_design/sync-shared-modules-owner.md` に従う

## Step 2 同期
`mise exec -- pnpm indexes:rebuild` 実行 → topic-map.md / keywords.json 再生成。生成差分は同 PR 範囲に含める。`outputs/phase-11/indexes-rebuild.log` / `indexes-drift.log` に実測ログを保存済み。
