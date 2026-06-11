# 未タスク検出（unassigned task detection）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 結論: **current 未タスク 0 件**。本タスクは Lane A（shared SSOT）/ Lane B（api 切替）/ Lane C（web 切替）すべてを 1 サイクル / 1 PR で完了する設計のため、pending implementation の未タスクは発生しない。`current` と `baseline` を分離記録する。

## current 確認

| ソース | 確認結果 |
|--------|----------|
| 実装 pending | 0 件。Lane A/B/C を同一サイクルで完了（CONST_007・SSOT §2.3 先送り 0 件） |
| Phase 11 発見事項 | 自動テスト計画（SP-01〜SP-12 + 既存 2 spec 回帰）で証跡が閉じる。追加課題なし |
| コードコメント TODO | 追加なし（spec のみ） |
| `describe.skip` / `it.skip` | 追加なし |
| スコープ外項目 | baseline 参考（下記）へ分離。current 未タスクではない |

### current 結論

- 新規 spec 起票: **0 件**
- 新規 Issue 起票: **0 件**（issue #222 は CLOSED のまま・再オープンしない）
- backlog 送り: **0 件**

## baseline 参考（スコープ外・将来タスク・本サイクルでは起票しない）

| ID | 内容 | 判定根拠 |
|----|------|----------|
| B-1 | `apps/web` ページング実装（`clampPublicMemberLimit` の web 配線・`page`/`limit` を web で実使用） | 06 系の別タスク領域。本タスクは shared に定数（`LIMIT_MIN`/`LIMIT_MAX`/`clampPublicMemberLimit`）を SSOT として置くのみで web 配線はしない（SSOT §2.2）。将来 web がページングする際の SSOT は本タスクで用意済み |
| B-2 | 検索 spec の機能拡張（タグ OR 検索・検索演算子） | 別タスク領域・本タスク非接触（SSOT §2.2） |
| B-3 | `packages/shared/src/admin/search.ts`（admin 検索）の SSOT 化 | 別ドメイン・本タスク非接触。public-search subpath に閉じる方針 |

> baseline は「分量・複雑さ」を理由に切り出したものではなく、**本質的にスコープ外**（別ドメイン / 別系タスク）。CONST_007 例外には当たらない。

## 関連タスク差分確認（FB-CANCEL-004-2）

| 確認 | 結果 |
|------|------|
| issue #222 との重複 | 重複なし。本タスクは issue #222 の **現コード最適化解決**そのもの（parser 全体移設ではなく共通プリミティブ抽出・AC-3 の「400」を silent fallback へ是正）。issue は CLOSED のまま再オープンしない |
| 他ブランチでの先行対応 | なし（Phase 1 調査: `grep ZONE_VALUES packages/shared` ヒット 0・他ブランチ対応なし） |
| 既存 admin/search 領域との衝突 | なし（subpath export に閉じ root barrel を汚さないため `SortZ` 等の衝突 risk を回避） |
