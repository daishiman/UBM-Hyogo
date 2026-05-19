# Phase 7: カバレッジ

## 1. カバレッジ目標

| ファイル | Branch | Statement | Function |
|---------|--------|-----------|----------|
| VisibilityRequestDialog.tsx | 既存値以上 | 既存値以上 | 既存値以上 |
| DeleteRequestDialog.tsx | 既存値以上 | 既存値以上 | 既存値以上 |
| RequestActionPanel.tsx | 既存値以上 | 既存値以上 | 既存値以上 |

本タスクは小規模 (3 行追加 / 1 行削除レベル) のため、カバレッジ低下は想定されない。

## 2. 計測コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components --coverage
```

## 3. 確認ポイント

- 成功 path / 失敗 path / DUPLICATE_PENDING_REQUEST path の 3 分岐がすべてテストで踏まれていること
- `router.refresh()` 行が成功 path テストでカバーされていること

## 4. coverage-guard

CLAUDE.md の coverage-guard 仕様により push 範囲 changed-only モードで gate が走る。本変更はファイル変更を含むため、変更行が新規テスト (Phase 6) でカバーされていれば PASS する想定。

## 5. DoD

- [ ] 該当 3 ファイルのカバレッジが既存値以上を維持
- [ ] pre-push `coverage-guard` (--changed モード) が PASS
