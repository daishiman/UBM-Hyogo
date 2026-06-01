# Phase 7: カバレッジ確認（設計書）

実装着手後の検証コマンド（各タスク共通）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm lint
```

- 新規コンポーネント（A/B/C のパネル・note）と shell-config 拡張（D）は各 spec でカバー。
- 既存 coverage 閾値（リポジトリ既定）を下回らないこと。
