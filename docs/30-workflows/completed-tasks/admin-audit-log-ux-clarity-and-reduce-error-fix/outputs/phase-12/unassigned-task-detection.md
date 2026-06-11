# 未タスク検出レポート — admin-audit-log-ux-clarity-and-reduce-error-fix

workflow_state: `implemented_local_evidence_captured` / 生成日: 2026-06-10

検出件数（current 新規未タスク）: **0 件**。
baseline 未タスク候補: **4 件**（OOS-1..OOS-4。元タスク仕様書でスコープ外として明示済み。OOS-4 は Phase 8 判定依存）。

> current（本タスク内で新たに発生した未タスク）と baseline（元仕様で既にスコープ外と確定済み）を分離して記録する。

## 検出ソースと結果（current）

| ソース | 確認項目 | 結果（current 新規） |
| --- | --- | --- |
| 元タスク仕様書 | 「スコープ外」として明示された項目 | current 新規 0 件（スコープ外は baseline OOS-1..OOS-4 として既出。後述） |
| Phase 3/10 レビュー | MINOR 判定の指摘事項 | current 新規 0 件（Phase 3 は MINOR なし明示。Phase 10 MINOR 追跡は OOS-4 を baseline 参照に集約） |
| Phase 11 手動テスト | スコープ外の発見事項・改善提案 | current 新規 0 件（`implemented_local_evidence_captured` ゆえ実機未取得。screenshot は capture runtime_pending。新規未タスクなし） |
| コードコメント | TODO/FIXME/HACK/XXX | current 新規 0 件（実コード未着手。新規 TODO/FIXME は導入しない） |
| `describe.skip` ブロック | 旧 testid/要素名の残存参照 | current 新規 0 件（既存 `data-testid` 維持・不変条件8。skip 追加なし） |

## baseline 未タスク候補（4 件・元仕様でスコープ外確定）

| ID | 内容 | 今回やらない理由（破綻条件） | 実施場所 | 状態 |
| --- | --- | --- | --- | --- |
| OOS-1 | 監査ログ total 件数表示 | API が append-only cursor pagination 設計で total を返さない。total 表示には **API endpoint 変更**が必要 → 不変条件1（apps/api 非変更）に抵触 | 別 Issue（API 拡張を伴う） | baseline（未起票） |
| OOS-2 | CSV/JSON エクスポート | 新規 endpoint または client 側大規模機能。初回価値（読める化）と無関係な独立スコープ | 別 Issue | baseline（未起票） |
| OOS-3 | catalog→redirect 統合（TagCatalogPanel 廃止） | 別 WF `admin-tag-definition-unify-create-and-catalog-fix` の責務。本タスクは現行コードの防御に限定（重複実装回避） | 既存別 WF | baseline（別 WF） |
| OOS-4 | 旧 `.admin-audit-table*` CSS 削除 | 他画面参照の有無を全 grep 確認後に判断。未使用確定なら Phase 8 で削除、参照ありなら残置 | **本タスク Phase 8 で判定**。残置となれば未タスク化 | baseline（**Phase 8 判定依存**） |

### OOS-4 の Phase 8 判定依存について

OOS-4（旧 `.admin-audit-table*` CSS 削除）は、Phase 8（リファクタ）の **ゼロ参照 grep 判定**に依存する:

- カード型タイムライン化（Lane A）で 4 列テーブルが不要になるため、旧 `.admin-audit-table` / `.admin-audit-table-scroll` / `.admin-audit-filter`（`globals.css:1602-1618`）が未使用になりうる。
- Phase 8 で `grep -rn "admin-audit-table"` 等を全 `apps/web` に対して実行し、**ゼロ参照が確定すれば削除**、他画面（または残存箇所）からの参照ありなら**残置**する。
- 残置となった場合、当該 CSS 削除は本タスク完了後の未タスク（cleanup）として formalize する。current 新規未タスクには昇格させず、baseline 参照として本レポートに記録する。

## 苦戦箇所【記入必須】

- current 新規未タスクが 0 件であることは「0 件にしないためのこじつけ」ではなく、本タスクが `apps/web` 表現層の情報設計 + 防御ガードに完結し、
  スコープ外項目はすべて元仕様（shared-context §7）で **API 変更必要 / 別 WF 責務 / Phase 8 判定依存**として既に切り分け済みであることに起因する。
- baseline OOS-1..OOS-4 は分量・複雑さを理由に切ったのではなく、「今回サイクル内で完了させると破綻する／独立スコープ」の明確な理由（CONST_007）を持つ。

## リスクと対策

- リスク: OOS-4 を Phase 8 で削除した場合、他画面が旧 CSS を参照していると視覚崩れが起きる。
- 対策: 削除前に全 `apps/web` grep でゼロ参照を証跡化する（Phase 8 必須手順）。参照ありなら残置し未タスク化する。

## 検証方法

```bash
# baseline スコープ外が元仕様に記録されていること
grep -n "OOS-1\|OOS-2\|OOS-3\|OOS-4" docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/shared-context.md

# OOS-4 の Phase 8 ゼロ参照判定（本サイクル で実行）
grep -rn "admin-audit-table" apps/web/src apps/web/app | grep . && echo "[残置: 参照あり]" || echo "[削除可: ゼロ参照]"
```

## スコープ（含む/含まない）

- 含む: current 新規未タスク 0 件の検出記録 / baseline OOS-1..OOS-4 の参照記録 / OOS-4 の Phase 8 判定依存の明示。
- 含まない: baseline 各項目の実装・Issue 採番（後続 user-gated / 別 WF）。
