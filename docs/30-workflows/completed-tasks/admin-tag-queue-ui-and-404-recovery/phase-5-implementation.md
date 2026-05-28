# Phase 5: Implementation

実装エージェントは tasks/ 配下を **task-A → task-B → task-C** の順に直列実行する。設計段階では並列化可能だが、実装は依存関係により以下の順を守る:

1. **task-A**（エラー細分化）— 先に `AdminSectionErrorClient` の表示分岐を入れ、開発中に 404 / 401 / 403 を見分けられる状態を作る
2. **task-B**（UI 整合）— page.tsx / TagQueuePanel.tsx の DOM 構造刷新
3. **task-C**（visual evidence）— task-A / B 完了後の最新ビルドで staging に対し撮影

## 着手前 grep / 確認

```bash
mise exec -- pnpm install
ls apps/web/src/components/ui/{Chip,Avatar,EmptyState,Icon,Card}.tsx 2>&1
grep -rln "AdminSectionErrorClient" apps/web/src apps/web/app | head
grep -rln "PageHead" apps/web/src/components/admin | head
```

不足する primitive は、新規ファイルを作らず **TagQueuePanel.tsx 内に inline 実装**する。

## 実装順序とコミット粒度（推奨）

| commit | 範囲 |
|--------|------|
| `feat(admin-tags): error code-based recovery hints in AdminSectionErrorClient` | task-A の UI 部分 |
| `chore(admin/server-fetch): dev-only 404 debug log` | task-A の server-fetch 部分 |
| `feat(admin-tags): align /admin/tags with prototype (page-head + grid-2 + sticky)` | task-B |
| `test(admin-tags): TagQueuePanel coverage for avatar/chip/sticky/resolved-subsection` | task-B のテスト |
| `test(admin-tags): staging visual smoke for /admin/tags` | task-C |

> ユーザー指示があるまで commit / push / PR は行わない（プロンプト方針）。
