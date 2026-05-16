# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| 前 Phase | 12 (正本同期) |
| 次 Phase | なし |
| 状態 | blocked_pending_user_approval |

## 目的

local 実装と Phase 1-12 完了を踏まえ、commit / push / PR を作成する。**ユーザー承認後のみ実行**する。

## 事前チェック

- [x] Phase 1-12 全て completed
- [x] AC-1〜AC-9 PASS
- [x] `pnpm typecheck` / `pnpm lint` / unit / smoke すべて PASS
- [x] OKLch tokens 遵守

## PR 作成手順（ユーザー承認後）

CLAUDE.md の「PR作成の完全自律フロー」に従う。

```bash
git fetch origin dev
git checkout dev && git merge --ff-only origin/dev
git checkout feat/attendance-paging-ui
git merge dev
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
git push -u origin feat/attendance-paging-ui
gh pr create --base dev --title "feat(profile): AttendanceList cursor paging UI (G4-1)" --body "$(cat <<'EOF'
## Summary
- profile ページに参加履歴の「もっと見る」ボタンを追加
- 初回 default 50 件は Server Component で fetch、追加読込は Client Component で実施
- cursor は opaque として扱い、`encodeURIComponent` のみ適用

## Test plan
- [ ] `pnpm --filter @ubm-hyogo/web test -- AttendanceList` PASS
- [ ] `pnpm --filter @ubm-hyogo/web test -- profile` PASS
- [ ] profile ページで「もっと見る」を click → 次ページが append
- [ ] nextCursor=null で button が消える
- [ ] fetch 失敗時に role="alert" 表示

Refs #372
EOF
)"
```

## 振り返り

| 項目 | 内容 |
| --- | --- |
| 良かった点 | API 側の cursor 仕様（opaque）を尊重し、UI 側 adapter で完結 |
| 課題 | 視覚 regression を playwright snapshot のみに依存（手動確認ログがない） |
| 次のサイクルへの提案 | retry button 抽出を実需が出てから検討 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/pr-summary.md | PR 要約 / 振り返り |

## 完了条件

- [ ] PR URL が記録（ユーザー承認後）
- [ ] 振り返り 3 項目が記録済

## 次 Phase

- なし（本タスクサイクル終了）
