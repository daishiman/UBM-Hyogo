# Phase 7: カバレッジ確認

optimistic update の追加分岐（`onMerge` の optimistic 発火 / `.catch` rollback / `return null`）が
テストで covered されていることを実測する。**全ファイル一律ではなく、変更ファイルに限定**して測定する
（FB Feedback BEFORE-QUIT-002 / Feedback 5）。

---

## 7.1 coverage 対象範囲（変更ファイルに限定）

| 区分 | パス |
|------|------|
| 唯一の measure 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx` |

> Phase 5 で修正したのはこの 1 ファイルのみ。他ファイル（hook / page / 他 component）は
> **対象外**とし、coverage の include を `IdentityConflictRow.tsx` に絞る。全ファイル一律指定はしない。

---

## 7.2 測定対象の分岐（line + branch）

`IdentityConflictRow.tsx` の追加分岐を明示的に列挙し、各分岐が covered であることを確認する。

| 分岐 | 場所 | covered する Phase 6 / 4 ケース |
|------|------|--------------------------------|
| `setOptimisticMerged(true)`（optimistic 発火） | `onMerge` 先頭 | TC-OPT-1（row 即消失） |
| `.catch(() => setOptimisticMerged(false))`（rollback） | `onMerge` の trigger catch | TC-OPT-2（reject で row 復元）/ RG-1 |
| `if (optimisticMerged) return null;`（true 枝） | render 直前 | TC-OPT-1 / TC-OPT-3（success 後も消失）/ 既存 happy 更新後 |
| `if (optimisticMerged) return null;`（false 枝＝通常 render） | render 直前 | idle / merge-confirm / dismiss 系の既存全ケース |

> branch coverage の観点では `optimisticMerged` の **true / false 両枝**、`trigger` の
> **resolve / reject 両経路**がいずれも実行されることが必須。上表でいずれも 1 件以上のケースに対応している。

---

## 7.3 測定コマンド例

vitest の coverage を対象ファイルに限定して実行する。

```bash
pnpm --filter web exec vitest run \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  --coverage \
  --coverage.include='src/components/admin/IdentityConflictRow.tsx'
```

> `--coverage.include` で計測対象を変更ファイル 1 本に絞る。これにより無関係ファイルの
> 低 coverage がノイズとして混ざらず、本タスクの追加分岐に集中して評価できる。
> （プロジェクトの vitest coverage provider 設定に合わせて include の指定方法が異なる場合は
> `vitest.config` の `coverage.include` を一時上書きする方針で同等の限定を行う。）

---

## 7.4 optimistic / rollback 両分岐が covered であることの確認方法

1. 上記コマンドの coverage サマリで `IdentityConflictRow.tsx` の **Branch %** を確認する。
2. テキスト or HTML レポート（`coverage/index.html` 等）で以下を目視確認する。
   - `onMerge` 内 `setOptimisticMerged(true)` 行が covered（緑）
   - `.catch` の `setOptimisticMerged(false)` 行が covered（緑）→ rollback 枝
   - `if (optimisticMerged) return null;` の `return null` 行が covered（緑）→ optimistic true 枝
3. いずれかが uncovered（赤 / 黄）の場合、対応する Phase 4 / 6 ケースが分岐に到達していない。
   - rollback 未到達 → TC-OPT-2 の reject mock が `.catch` を発火しているか確認
   - `return null` 未到達 → TC-OPT-1 で pending Promise により row 消失を捕捉できているか確認

---

## 7.5 完了条件

| 項目 | 基準 |
|------|------|
| 追加分岐 line coverage | `setOptimisticMerged(true/false)` / `return null` の 3 行すべて covered |
| 追加分岐 branch coverage | `optimisticMerged` true/false 両枝 + trigger resolve/reject 両経路が covered |
| 既存 coverage 退行 | `IdentityConflictRow.tsx` 既存行（merge-confirm / merge-final / dismiss / cancel 系）の coverage が変更前より低下しないこと |

> ここで未 cover の追加分岐があれば Phase 6 に戻ってケースを補強する。
> coverage が満たされたら typecheck / lint（AC-7）の最終再確認を経て後続 Phase（評価 / PR）へ進む。
