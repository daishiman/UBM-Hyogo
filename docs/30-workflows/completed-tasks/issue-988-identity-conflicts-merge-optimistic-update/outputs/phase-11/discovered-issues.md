# Phase 11: 発見事項記録（spec）— VISUAL

> 2026-05-30 の local focused Vitest / Playwright 実行では HIGH/MEDIUM の未解決課題は 0 件。Playwright 初回実行で検出した inline error 文言 drift は同サイクル内で修正済み。

- **タスク種別**: VISUAL
- **Issue**: #988（identity-conflicts merge optimistic update）
- **route**: `/admin/identity-conflicts`
- **対象 component**: `apps/web/src/components/admin/IdentityConflictRow.tsx`

## 発見事項サマリ

| 重大度 | 件数 |
| --- | --- |
| HIGH | 0（実装前） |
| MEDIUM | 0（実装前） |
| LOW | 0（実装前） |
| 合計 | **0（実装前）** |

## 発見時の記録フォーマット

手動テストで事項を発見した場合、1 件につき以下の項目を埋めて追記する。

```
### [ID] <短い要約>

- 重大度: HIGH / MEDIUM / LOW
- 対象: <component / route / state>（例: IdentityConflictRow / optimistic hide）
- 関連 AC / TC: <AC-x / TC-VIS-xx>
- 再現手順:
  1. ...
  2. ...
- 期待挙動: ...
- 実際の挙動: ...
- screenshot / log: <参照パス（取得時のみ）>
- 一次切り分け: <component-local state / API contract / トークン / レイアウト 等>
```

## 重大度の基準

| 重大度 | 基準（本タスク文脈） |
| --- | --- |
| HIGH | optimistic hide が機能しない / rollback で row が復元しない / error が出ず操作不能になる / dismiss に回帰が出る |
| MEDIUM | 状態遷移は成立するが体感遅延・配色不整合・文言不明瞭がある |
| LOW | 軽微な視覚揺れ・改善余地（機能上の影響なし） |

## 昇格ルール

- **HIGH** 事項は Phase 12 の unassigned-task へ昇格し、`unassigned-task-detection` で formalize（必要に応じ follow-up Issue 起票）する。
- MEDIUM / LOW は本レポートに記録し、必要に応じて Phase 12 で follow-up 候補として評価する。
