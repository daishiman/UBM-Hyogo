# Phase 8 — リファクタリング

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> landed 実装（commit `745c95115` / PR #1064）は既に責務分離・重複排除が完了している。
> 本 Phase は「リファクタリング余地の点検」が主作業であり、**新規リファクタは不要**であることを点検結果として記述する。
> 重複 / navigation drift / 注入の散在 / contract 二重定義の 3 観点を点検し、いずれも問題なしを確認する。

---

## 1. 点検結果（[Feedback RT-03] 対象 / Before / After / 理由テーブル）

| 対象 | Before（landed の現状） | After（あるべき姿） | 理由・判定 |
|------|--------------------------|----------------------|------------|
| `ManualFormResyncPanel` と `BackfillPublishStatePanel` の重複 | 別ファイル（`_sync/ManualFormResyncPanel.client.tsx` / `_sync/BackfillPublishStatePanel.client.tsx`）。別 `data-testid`（`manual-sync-*` / backfill-publish 系）で分離 | 同左（変更不要） | 責務が「フォーム回答再取込」と「publish_state backfill」で異なり、testid も衝突しない。共通化は早期抽象化（over-abstraction）となるため **不要** |
| proxy への Bearer 注入の散在 | `route.ts` の `proxy()` 内 1 箇所（`needsSyncAdminBearer` 判定 → `syncAdminToken()` 注入）に集約 | 同左（変更不要） | 注入ロジックは単一関数 / 単一分岐に集約済み。複数箇所への分散がないため **不要** |
| zod contract の二重定義 | `SyncResultSchema` / `SyncRunResponseSchema` を `manual-sync.ts` に単一ソース定義し、UI が import | 同左（変更不要） | contract が 1 ファイルに単一ソース化済み。`apps/api` を import せず（不変条件 #5）、再宣言の重複もないため **不要** |
| パス定数の重複 | 単一 `SYNC_RESPONSES_PATH` ＋ query suffix（`?fullSync=false/true`）切替 | 同左（変更不要） | drift D1 のとおり 2 重定義は既に解消済み。単一定数のため **不要** |
| navigation drift（マウント箇所） | `sync-status/page.tsx` の `SyncStatusView` 末尾に 2 パネルを並置マウント。導線の重複・孤立リンクなし | 同左（変更不要） | マウントは 1 箇所のみ。重複導線 / dead route なし。**navigation drift なし** |
| mutation インスタンスの重複 | run / backfill の 2 インスタンスを独立 `useAdminMutation` で保持し `busy` で統合 disabled | 同左（変更不要） | 操作が 2 種（差分 / 全件）で意味的に独立。共通 busy 配線済みで状態整合済み。**不要** |

---

## 2. リファクタ不要の根拠（総括）

1. **責務分離が完了**: UI（パネル）/ contract（zod）/ mutation（hook）/ proxy（認証注入）/ backend（凍結）の 5 層が混在なく分離している。
2. **重複なし**: contract・パス定数・注入ロジックはいずれも単一ソース。`BackfillPublishStatePanel` とは別ファイル・別 testid で分離済み。
3. **navigation drift なし**: パネルのマウントは `sync-status/page.tsx` の 1 箇所のみで、孤立リンク・重複導線がない。
4. **不変条件適合**: 不変条件 #5（`apps/web` → `apps/api` 非 import）/ #9（新規 `<input>` を生やさず `FormField` 系を使用）/ #10（`@/features/admin/hooks/useAdminMutation` 経由）に既に整合しており、リファクタで触る対象がない。
5. **early-abstraction 回避**: 2 パネルの共通化は責務が異なるため抽象化コストが価値を上回る。YAGNI に従い現状維持が最適。

> 結論: **本タスクのスコープにおけるリファクタリングは不要**。点検により重複・navigation drift・注入散在・contract 二重定義のいずれも検出されないことを確認した。

---

## 3. 点検コマンド（差分が生じていないことの裏付け）

```bash
# 2 パネルが別 testid で分離していること
grep -rn 'data-testid' \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx \
  apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx

# Bearer 注入が 1 箇所のみであること
grep -n 'syncAdminToken\|needsSyncAdminBearer\|Bearer' 'apps/web/app/api/admin/[...path]/route.ts'

# contract が単一ソースで定義され、UI が import していること
grep -rn 'SyncResultSchema\|SyncRunResponseSchema' apps/web/src apps/web/app
```

期待: testid は 2 パネルで衝突なし / Bearer 注入は `route.ts` の `proxy()` 内 1 箇所 / contract 定義は `manual-sync.ts` のみ・他は import 参照。

---

## 完了条件

- [x] 対象 / Before / After / 理由テーブルで 6 観点を点検した
- [x] `BackfillPublishStatePanel` との重複が別ファイル・別 testid で分離済みであることを確認した
- [x] proxy Bearer 注入が 1 箇所に集約されていることを確認した
- [x] zod contract が単一ソース化されていることを確認した
- [x] navigation drift（重複導線 / 孤立リンク）が無いことを確認した
- [x] リファクタ不要の根拠（責務分離・重複なし・不変条件適合・YAGNI）を明記した
