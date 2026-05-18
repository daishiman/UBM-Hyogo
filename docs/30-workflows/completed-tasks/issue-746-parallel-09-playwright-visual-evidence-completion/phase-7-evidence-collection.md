# Phase 7: Evidence 収集

[実装区分: 実装仕様書]

## 1. Evidence 配置

| 種別 | パス |
|------|------|
| 12 PNG（正本） | `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` |
| Playwright run log | 本 workflow `outputs/phase-11/playwright-run.txt`（tracked canonical evidence） |
| disk space before/after | 本 workflow `outputs/phase-11/disk-space.txt` |
| README pointer | 本 workflow `outputs/phase-11/screenshots/README.md` |

## 2. Evidence 収集コマンド

```bash
WF=docs/30-workflows/issue-746-parallel-09-playwright-visual-evidence-completion
EVID=docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots

# disk space snapshot
{
  echo "[before]"
  df -h /System/Volumes/Data
  echo "[after]"
  df -h /System/Volumes/Data
} > "$WF/outputs/phase-11/disk-space.txt"

# playwright run log（Phase 4 Step 6 でリダイレクト済）
cp /tmp/parallel09-run1.log "$WF/outputs/phase-11/playwright-run.txt"

# PNG inventory
ls -l "$EVID"/*.png > "$WF/outputs/phase-11/png-inventory.txt"
```

## 3. README テンプレート

`$WF/outputs/phase-11/screenshots/README.md`:

```markdown
# Visual evidence pointer

正本 12 PNG は親 workflow 配下に格納:

`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`

本ディレクトリは重複保存を避けるため pointer のみ。
本 workflow の Phase 11 完了状態は `phase-11-visual-evidence.md` を参照。
```

## 4. evidence integrity 検証

```bash
# 各 PNG が valid PNG であること（先頭 8 byte = 89 50 4E 47 0D 0A 1A 0A）
for f in "$EVID"/*.png; do
  head -c 8 "$f" | xxd | grep -q "8950 4e47 0d0a 1a0a" || echo "INVALID: $f"
done
```
