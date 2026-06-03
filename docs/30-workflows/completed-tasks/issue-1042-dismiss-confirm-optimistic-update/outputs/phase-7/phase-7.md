**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 7: カバレッジ確認

dismiss optimistic update の追加分岐（`onDismiss` の optimistic 発火 / `.catch` rollback /
`return null` の OR 条件 dismiss 枝）がテストで covered されていることを実測する。
**全ファイル一律ではなく、変更ファイルに限定**して測定する（BEFORE-QUIT-002 / Feedback 5）。

---

## 7.1 coverage 対象範囲（変更ファイルに限定）

| 区分 | パス |
|------|------|
| 唯一の measure 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx` |

> Phase 5 で修正したのはこの 1 ファイルのみ。他ファイル（hook / page / 他 component）は
> **対象外**とし、coverage の include を `IdentityConflictRow.tsx` に絞る。全ファイル一律指定はしない。

---

## 7.2 測定対象の分岐（line + branch）

`IdentityConflictRow.tsx` の dismiss optimistic 追加分岐を明示的に列挙し、各分岐が covered であることを確認する。

| 分岐 | 場所 | covered する Phase 6 / 4 ケース |
|------|------|--------------------------------|
| `setOptimisticDismissed(true)`（optimistic 発火） | `onDismiss` 先頭 | TC-DIS-1（row 即消失）/ E2E-DIS-1 |
| `.catch(() => setOptimisticDismissed(false))`（rollback） | `onDismiss` の trigger catch | TC-DIS-2（reject で row 復元）/ RG-1 / RG-3 / E2E-DIS-2 |
| `if (optimisticMerged || optimisticDismissed) return null;`（`optimisticDismissed` true 枝） | render 直前 | TC-DIS-1 / TC-DIS-3（success 後も消失）/ E2E-DIS-1 |
| `if (optimisticMerged || optimisticDismissed) return null;`（両 false 枝＝通常 render） | render 直前 | idle / merge-confirm / dismiss modal 系の既存全ケース |
| `errorMessage` の `FetchAuthedError` JSON 解釈枝（実コード L17-23） | top-level helper | TC-DIS-2（`FetchAuthedError` を error に与える場合） |

> branch coverage の観点では `optimisticDismissed` の **true / false 両枝**、dismiss `trigger` の
> **resolve / reject 両経路**がいずれも実行されることが必須。上表でいずれも 1 件以上のケースに対応している。
> 既存 merge 枝（`optimisticMerged` true）は既存 merge テストで covered 済（本タスクで退行させない / AC-4）。

---

## 7.3 測定コマンド例

vitest の coverage を対象ファイルに限定して実行する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
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
   - `onDismiss` 内 `setOptimisticDismissed(true)` 行が covered（緑）
   - `.catch` の `setOptimisticDismissed(false)` 行が covered（緑）→ rollback 枝
   - `if (optimisticMerged || optimisticDismissed) return null;` の `return null` 行が covered（緑）→ optimistic true 枝
   - OR 条件式の `optimisticDismissed` 評価枝（merge=false, dismiss=true）が branch として記録される
3. いずれかが uncovered（赤 / 黄）の場合、対応する Phase 4 / 6 ケースが分岐に到達していない。
   - rollback 未到達 → TC-DIS-2 の reject mock が `.catch` を発火しているか確認
   - `return null`（dismiss 枝）未到達 → TC-DIS-1 で pending Promise により row 消失を捕捉できているか確認
   - OR 条件 dismiss 枝未到達 → merge と dismiss を別ケースで分離発火しているか（RG-2）確認

---

## 7.5 完了条件

| 項目 | 基準 |
|------|------|
| 追加分岐 line coverage | `setOptimisticDismissed(true/false)` / `return null`（OR 条件含む）の追加行すべて covered |
| 追加分岐 branch coverage | `optimisticDismissed` true/false 両枝 + dismiss trigger resolve/reject 両経路が covered |
| 既存 coverage 退行なし | `IdentityConflictRow.tsx` 既存行（merge 系 optimistic / merge-confirm / merge-final / dismiss modal / cancel 系）の coverage が変更前より低下しないこと（特に `optimisticMerged` 枝を退行させない / AC-4） |

> ここで未 cover の追加分岐があれば Phase 6 に戻ってケースを補強する。
> coverage が満たされたら typecheck / lint の最終再確認を経て後続 Phase（評価 / PR）へ進む。
