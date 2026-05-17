# Phase 4: 実装計画

[実装区分: 実装仕様書]

## 1. 実装ステップ（実行順）

### Step 1: spec パッチ

`apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` の `evidenceDir` を Phase 2 §2 の形に編集。

```bash
# 検証
mise exec -- pnpm --dir apps/web typecheck
mise exec -- pnpm --dir apps/web lint --filter-only "playwright/**/parallel-09-*.spec.ts" || true
```

### Step 2: disk / cache 状態確認

```bash
df -h /System/Volumes/Data | awk 'NR==2 { print $4 " available" }'
# 5Gi 未満なら phase-10 runbook §1-3 を適用
du -sh ~/Library/Caches/ms-playwright apps/web/.next apps/web/.open-next 2>/dev/null
```

### Step 3: chromium 確認・必要なら再取得

```bash
mise exec -- pnpm --dir apps/web exec playwright install --dry-run chromium
# Missing なら:
mise exec -- pnpm --dir apps/web exec playwright install chromium
```

### Step 4: dev server 起動（background）

```bash
mise exec -- pnpm --dir apps/web dev > /tmp/parallel09-dev.log 2>&1 &
echo $! > /tmp/parallel09-dev.pid
```

### Step 5: readiness wait

```bash
for i in {1..60}; do
  if curl -fsS http://localhost:3000/visual-harness/formfield-error > /dev/null 2>&1; then
    echo "ready"; break
  fi
  sleep 1
done
```

### Step 6: Playwright 実行

```bash
cd apps/web
mise exec -- pnpm exec playwright test \
  --config=playwright.parallel09.config.ts \
  --reporter=line
```

### Step 7: 成果物検証

```bash
EVID="../../docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots"
ls "$EVID"/*.png | wc -l   # 期待: 12
find "$EVID" -name "*.png" -size +500k    # 期待: 出力なし
```

### Step 8: dev server 停止

```bash
kill "$(cat /tmp/parallel09-dev.pid)" 2>/dev/null || true
rm -f /tmp/parallel09-dev.pid
```

### Step 9: state 更新

`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md` を編集:
- `implemented_local_runtime_pending / implementation_complete_visual_pending` → `implemented_local_evidence_captured / implementation_complete_visual_evidence_captured`
- `Screenshot output | runtime_pending due local ENOSPC` → `Screenshot output | completed (12 PNGs, see screenshots/)`
- ENOSPC 言及段落の末尾に `Resolved 2026-05-17 via issue-746 workflow. See docs/30-workflows/issue-746-.../`

### Step 10: README 配置

`docs/30-workflows/issue-746-.../outputs/phase-11/screenshots/README.md` を作成し、正本パス pointer を記述。

## 2. ロールバック

Step 9 までで失敗が確定した場合:
- 生成済み PNG を `git checkout -- $EVID` で破棄
- spec パッチを revert
- dev server プロセスが残っていれば kill

## 3. 完了条件 (DoD)

- Phase 1 §2 の AC-1〜AC-8 が全て green
- `git status` で意図したファイルのみ差分（spec / 12 PNG / main.md / README / phase-12 detection）
- typecheck / lint exit 0
