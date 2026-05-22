# Phase 9: ロールバック

[実装区分: 実装仕様書]

## 1. ロールバック判断基準

| 状況 | 判断 |
|------|------|
| Playwright 3 回連続失敗（同一エラー） | rollback |
| ENOSPC が phase-10 runbook 適用後も再発 | rollback + ユーザーエスカレーション |
| harness route が 500 / hydration error 継続 | rollback（primitive 実装側の別 issue） |
| PNG 視覚的に primitive と乖離 | rollback ではなく primitive 修正 issue を別途起票 |

## 2. ロールバック手順

```bash
EVID=docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots

# Step 1: 生成 PNG 削除
rm -f "$EVID"/*.png

# Step 2: spec パッチ revert
git checkout HEAD -- apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts

# Step 3: state 更新を revert
git checkout HEAD -- docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md
git checkout HEAD -- docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md

# Step 4: dev server / cache cleanup
kill "$(cat /tmp/parallel09-dev.pid 2>/dev/null)" 2>/dev/null || true
rm -rf apps/web/.next apps/web/.open-next /tmp/parallel09-*.log /tmp/parallel09-dev.pid

# Step 5: 本 workflow root は残す（recovery 履歴として保持）
# 削除しない理由: 後続 retry で再利用可能
```

## 3. 部分ロールバック

12 PNG のうち一部のみ失敗した場合:
- 失敗 test のみ `--grep` で再実行
- 全 PNG 整合確認 (Phase 7 §4) を再走

## 4. ロールバック後の状態

- Issue #746 は closed のまま（再 open しない）
- unassigned-task entry は `pending` 状態に復帰
- 本 workflow root は残置し、`artifacts.json.metadata.last_attempt_failed_at` を追記
