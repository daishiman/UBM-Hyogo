# Phase 11: 手動テストレポート（implemented local / screenshot pending）

- task_id: `public-member-common-ui-card-unification`
- 種別: VISUAL / 状態: implemented_local_visual_pending（ローカル screenshot 実測へ更新予定）

## サマリー

| 項目 | 計画 | 実測 |
|------|------|------|
| component spec（新プリミティブ6種＋ButtonLink） | PageShell/PageHeader/SectionCard/ContentCard/Prose/ButtonLink | pending |
| 既存8画面 spec 回帰（AC-7） | selector 不変で GREEN 維持 | pending |
| screenshot（8画面 × 2VP = 16枚） | `screenshot-plan.json` 参照 | pending |
| トークン gate（verify:tokens / verify:no-inline-style） | PASS 期待 | pending |

## 検証境界

- **jsdom で確認できる**: data 属性（data-component/data-tone/data-padding 等）、要素構造、role/heading/aria、className 一致。
- **jsdom で確認できない（staging 実機）**: @media レスポンシブ、hover/interactive、gradient 背景、serif フォント実レンダリング。`screenshot-plan.json#boundary` に記載。

## 実行予定コマンド（実装後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm/web test
mise exec -- pnpm build
```
