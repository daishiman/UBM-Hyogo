# Phase 7: カバレッジ

> **実装区分: 実装仕様書** — カバレッジ対象範囲を「新規 spec のシナリオ網羅」に限定して定義する。

## 7.0 カバレッジの対象範囲（局所明示）

> [Feedback BEFORE-QUIT-002] 局所明示: 本タスクの **変更ファイルは新規 Playwright spec 1 ファイルのみ**。
> したがってカバレッジ評価の対象も **その spec が踏むシナリオの網羅性** に限定する。

| 区分 | 対象 | カバレッジ評価 |
| --- | --- | --- |
| 新規 spec のシナリオ網羅 | `admin-members-bulk-tag-authenticated.spec.ts` | ✅ 本 Phase の対象 |
| `BulkActionBar.tsx` の line / branch | component 本体 | ❌ **対象外**（理由は §7.2） |
| `POST /admin/members/tags/bulk` ハンドラ | apps/api | ❌ 対象外（本タスク非変更・親で担保済み） |

## 7.1 新規 spec が網羅すべきシナリオ

Playwright E2E は line coverage を測る性質のものではないため、ここでは **シナリオ網羅（行動カバレッジ）** を網羅基準とする。

| シナリオ ID | 内容 | 充足手段 | AC 対応 |
| --- | --- | --- | --- |
| SC-AUTH | 認証付き admin storageState で `/admin/members` に到達 | storageState use + 行 visible assert（FP-01） | AC-1, AC-5 |
| SC-SELECT | 行 checkbox を 2 件チェックして bulk region を出現させる | `aria-label="{fullName} を選択"` を 2 件 check → region visible | AC-1 |
| SC-ASSIGN-CAP | assign-mode（既定）で picker baseline 取得 | mode group `付与` `aria-pressed=true` 確認 → 撮影 | AC-2 |
| SC-UNASSIGN-CAP | `解除` トグル後に unassign-mode baseline 取得 | `setTagMode("unassign")` 反映確認 → 撮影 | AC-3 |
| SC-NO-MUTATION | 全行程で mutation が発火していない | `bulk-tag-result` count 0 assert（§6.2） | AC-6 |

5 シナリオ全てが 1 つの test 内（または 1 describe）で順次踏まれることで、AC-1..3, 5, 6 を行動カバレッジとして満たす。
AC-4（canonical 名一致）は snapshot arg の文字列照合（phase-11 / implementation-guide / artifacts `canonical_screenshots` との一致）で別途担保し、AC-7（ソース非変更）は git diff スコープで担保する。

## 7.2 BulkActionBar component を対象外とする根拠

`BulkActionBar.tsx` の line / branch カバレッジは、本タスクの新 spec の責務ではない。理由:

1. **既に既存 component spec が担保済み**: `BulkActionBar.spec.tsx` の TC-BAB-TAG-01..05 が
   master load（line 63-75）/ assign trigger（119-132, `op:"assign"`）/ 部分失敗集計（`summarize` 31-47 全分岐）/
   unassign trigger（`op:"unassign"`）/ disabled gate（`tagDisabled` 135）を網羅し、a11y violations 0 も確認している。
2. **新 spec は read-only visual に限定**: apply mutation 経路（`runBulkTags` 119-132 の成功系・`bulk-tag-result` 描画 253-283）は
   本タスクで **意図的に踏まない**（AC-6）。よって新 spec で component の mutation 分岐をカバーしようとすること自体がスコープ違反。
3. **二重計測の回避**: 同じ分岐を component spec（jsdom）と staging E2E の双方で計測しても冗長で、staging D1 副作用を生む。

→ 結論: component の line/branch は **既存 spec で充足済みとして対象外** と明記する。

## 7.3 カバレッジ計測方法

| 対象 | 計測 | 実行タイミング |
| --- | --- | --- |
| 新 spec シナリオ網羅 | SC-AUTH..SC-NO-MUTATION の手動チェックリスト（行動カバレッジ） | Phase 11 runtime |
| BulkActionBar.spec.tsx 回帰 | focused vitest（緑維持＝既存カバレッジ不変） | local 検証 |

E2E に line-coverage instrumentation は導入しない（staging 実機 build に対する計測は本プロジェクトの既存 visual project でも非採用）。

## 7.4 完了条件（Phase 7）

- カバレッジ対象が「新 spec のシナリオ網羅」に限定明示されている
- SC-AUTH..SC-NO-MUTATION の 5 シナリオが AC にマップされている
- BulkActionBar component の line/branch を対象外とする根拠が局所明示されている
