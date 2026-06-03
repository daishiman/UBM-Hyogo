# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 内容 |
|------|------|
| Issue | #1042（FU-AIDC-006） |
| 主題 | dismiss optimistic 追加分岐の coverage 実測（変更ファイル限定） |
| Phase | 7 / 13（カバレッジ確認） |
| measure 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx`（**このファイルのみ**） |

## 目的

dismiss optimistic update の追加分岐（`onDismiss` の optimistic 発火 / `.catch` rollback / render guard の
`optimisticDismissed` 枝）がテストで covered されていることを実測する。**全ファイル一律ではなく、変更ファイルに限定**して
測定する（FB Feedback BEFORE-QUIT-002 / Feedback 5）。

---

## 7.1 coverage 対象範囲（変更ファイルに限定）

| 区分 | パス |
|------|------|
| 唯一の measure 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx` |

> Phase 5 で修正したのはこの 1 ファイルのみ。他ファイル（hook / page / 他 component）は**対象外**とし、
> coverage の include を `IdentityConflictRow.tsx` に絞る。全ファイル一律指定はしない。

---

## 7.2 測定対象の分岐（line + branch）

dismiss optimistic で追加した分岐を明示的に列挙し、各分岐が covered であることを確認する。
merge 側の `optimisticMerged` 分岐は既存テストで covered 済（本タスクで退行させないことを 7.5 で確認）。

| 分岐 | 場所 | covered する Phase 4 / 6 ケース |
|------|------|--------------------------------|
| `setOptimisticDismissed(true)`（optimistic 発火） | `onDismiss` 先頭 | TC-DOPT-1（row 即消失） |
| `.catch(() => setOptimisticDismissed(false))`（rollback） | `onDismiss` の trigger catch | TC-DOPT-2（reject で row 復元）/ RG-D1 / network error variant |
| `optimisticDismissed` true 枝（guard 右項が true で `return null`） | render 直前 `if (optimisticMerged \|\| optimisticDismissed)` | TC-DOPT-1 / TC-DOPT-3（success 後も消失） |
| `optimisticDismissed` false 枝（guard 右項が false ＝ 通常 render） | render 直前 | idle / dismiss dialog / merge 系の既存全ケース |
| `optimisticMerged` true 枝（guard 左項） | render 直前 | merge 既存ケース（退行確認のみ） |

> branch coverage の観点では `optimisticDismissed` の **true / false 両枝**、`dismissMutation.trigger` の
> **resolve / reject 両経路**がいずれも実行されることが必須。上表でいずれも 1 件以上のケースに対応している。
> guard は短絡論理 OR のため、`optimisticMerged=false && optimisticDismissed=true` の組合せ（dismiss 単独消失）を
> 通すケース（TC-DOPT-1/3）で右項の true 枝が確実に評価される。

---

## 7.3 測定コマンド例

vitest の coverage を対象ファイルに限定して実行する。

```bash
pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  --root=../.. \
  --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/components/admin/IdentityConflictRow.tsx'
```

> `--coverage.include` で計測対象を変更ファイル 1 本に絞る。これにより無関係ファイルの低 coverage が
> ノイズとして混ざらず、本タスクの追加分岐に集中して評価できる。
> （プロジェクトの vitest coverage provider 設定に合わせて include の指定方法が異なる場合は
> `vitest.config` の `coverage.include` を一時上書きする方針で同等の限定を行う。）

---

## 7.4 optimistic / rollback 両分岐が covered であることの確認方法

1. 上記コマンドの coverage サマリで `IdentityConflictRow.tsx` の **Branch %** を確認する。
2. テキスト or HTML レポート（`coverage/index.html` 等）で以下を目視確認する。
   - `onDismiss` 内 `setOptimisticDismissed(true)` 行が covered（緑）
   - `.catch` の `setOptimisticDismissed(false)` 行が covered（緑）→ rollback 枝
   - `if (optimisticMerged || optimisticDismissed) return null;` の `return null` 行が covered（緑）→ optimisticDismissed true 枝
3. いずれかが uncovered（赤 / 黄）の場合、対応する Phase 4 / 6 ケースが分岐に到達していない。
   - rollback 未到達 → TC-DOPT-2 / RG-D1 の reject mock が `.catch` を発火しているか確認
   - `return null`（dismiss 枝）未到達 → TC-DOPT-1 で pending Promise により row 消失を捕捉できているか確認
   - `optimisticDismissed=false` 通常 render 未到達 → idle / dismiss dialog 既存ケースが残っているか確認

---

## 7.5 全ファイル一律カバレッジは対象外（明記）

本タスクは `IdentityConflictRow.tsx` の `onDismiss` / render guard / `optimisticDismissed` state の変更のみが対象である。
プロジェクト全体や他コンポーネント・hook の一律カバレッジ閾値達成は**本フェーズの対象外**とする（FB BEFORE-QUIT-002 / Feedback 5）。
証跡として残すのは「変更した関数 / ブロックの line・branch カバレッジ実測」であり、具体的には:

- `onDismiss` の success 分岐（trigger resolve → onSuccess）と reject 分岐（`.catch` rollback）の**両方**
- render guard の `optimisticDismissed=true`（`return null`）と `=false`（通常 render）の**両枝**

これらが covered であることだけを確認する。

---

## 完了条件

| 項目 | 基準 |
|------|------|
| 追加分岐 line coverage | `setOptimisticDismissed(true)` / `setOptimisticDismissed(false)` / 統合 guard の `return null` の各行が covered |
| 追加分岐 branch coverage | `optimisticDismissed` true/false 両枝 + `dismissMutation.trigger` resolve/reject 両経路が covered |
| merge 退行なし | `IdentityConflictRow.tsx` の merge 既存行（`optimisticMerged` / `onMerge` / merge-confirm / merge-final 系）の coverage が変更前より低下しないこと（AC-5 補完） |
| 範囲限定 | coverage include を当該 1 ファイルに限定し、全ファイル一律閾値は対象外であることを証跡に明記 |

> ここで未 cover の追加分岐があれば Phase 6 に戻ってケースを補強する。
> coverage が満たされたら typecheck / lint（AC-8）の最終再確認を経て後続 Phase（評価 / Playwright / screenshot / PR）へ進む。

## 統合テスト連携（Phase 1-11）

本フェーズの coverage 実測で Phase 4-6 のテストが追加分岐を漏れなく covered していることを確認する。
これにより AC-1〜AC-5（即時消失 / rollback + 理由保持 / success 維持 / state 分離 / merge 非回帰）が
テストで担保されたことの定量証跡となり、Phase 11 の screenshot 証跡・Phase 12 の compliance 検証へ接続する。
