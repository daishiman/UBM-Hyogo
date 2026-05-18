# Phase 10: 運用 Runbook（ENOSPC リカバリ）

[実装区分: 実装仕様書]

## 1. ENOSPC 解消手順（実施順）

### 1.1 Playwright cache クリア

```bash
rm -rf ~/Library/Caches/ms-playwright/
mise exec -- pnpm --dir apps/web exec playwright install chromium
```

### 1.2 Next build cache 削除

```bash
rm -rf apps/web/.next apps/web/.open-next
```

### 1.3 pnpm store prune

```bash
mise exec -- pnpm store prune
```

### 1.4 Docker volumes prune（Docker 未使用環境でも残骸の可能性）

```bash
docker system prune -a --volumes 2>/dev/null || echo "docker not installed"
```

### 1.5 TMPDIR / PLAYWRIGHT_BROWSERS_PATH 退避（最終手段）

```bash
export PLAYWRIGHT_BROWSERS_PATH=/Volumes/External/ms-playwright
export TMPDIR=/Volumes/External/tmp
mise exec -- pnpm --dir apps/web exec playwright install chromium
```

### 1.6 snapshot のみ取得（HTML report 抑止）

```bash
# 本 spec は --reporter=line がデフォルトなので追加対処不要
mise exec -- pnpm --dir apps/web exec playwright test \
  --config=playwright.parallel09.config.ts --reporter=line
```

## 2. 横展開メモ

- macOS では `~/Library/Caches/ms-playwright/` が hidden で容量見落とされやすい（528MB 検出例あり）
- Next 16 + Turbopack + OpenNext webpack 三重 cache が `.next` 配下に積層
- PR 単位の `.next` クリアは task-22 regression smoke で恒久化候補

## 3. 再発防止チェックリスト

| 項目 | 頻度 |
|------|------|
| `du -sh ~/Library/Caches/ms-playwright` | 月1 |
| `du -sh apps/web/.next apps/web/.open-next` | PR 前 |
| `df -h /System/Volumes/Data` 空き ≥ 10Gi | 作業開始時 |

## 4. エスカレーション

上記 1.1〜1.6 を全て試しても ENOSPC が解消しない場合:
- ユーザーに OS 全体の disk 使用状況を報告し、外付け / クラウド退避を相談
- 本タスクは保留し、disk 確保後に再開
