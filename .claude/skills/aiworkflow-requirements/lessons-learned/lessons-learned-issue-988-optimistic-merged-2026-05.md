---
name: lessons-learned-issue-988-optimistic-merged-2026-05
description: issue-988 identity-conflicts merge を component-local optimistic update + rollback 化した実装の苦戦箇所と再利用知見
metadata:
  type: reference
---

# lessons-learned — issue-988 identity-conflicts merge optimistic update (2026-05)

| 項目 | 値 |
| --- | --- |
| workflow | `issue-988-identity-conflicts-merge-optimistic-update` |
| source_issue | #988 (調査時点 OPEN → 移動時点 CLOSED) |
| status | implemented_local_evidence_captured / VISUAL_ON_EXECUTION |
| recorded_at | 2026-05-30 |

## 範囲

`/admin/identity-conflicts` の merge 二段階 confirm 後、server round-trip を待たず該当 row を optimistic に非表示化し、server error 時のみ rollback する実装で得た 6 件の教訓。API endpoint / D1 schema / `useAdminMutation` hook は不変で、`IdentityConflictRow.tsx` の component-local state のみで完結させた。

## L-I988-001 — optimistic 可視性は dialog stage union と別の独立 boolean に分離する

- **Rule**: dialog 表示制御（`stage: "idle" | "merge-confirm" | "merge-final" | "dismiss"` union）と row 可視性制御（`optimisticMerged: boolean`）は別 state として持つ。可視性を stage union の新値（例 `"merged"`）で表現しない。
- **Why**: row 非表示は「dialog がどの段階か」と直交する関心であり、stage union に混ぜると rollback 時にどの段階へ戻すかの分岐が爆発する。boolean を独立させれば `if (optimisticMerged) return null` の 1 行 guard で済み、rollback は `setOptimisticMerged(false)` のみで dialog stage は保持される。
- **How to apply**: 「即時 UI 反映 → server 確定 → 失敗時 rollback」型は、確定対象の可視性/有効性を専用 boolean に切り出す。dialog/フォームの段階管理 state とは交差させない。

## L-I988-002 — API error body の message を rollback inline alert に surface する helper を立てる

- **Rule**: rollback 時の inline error は generic な `error.message` ではなく API レスポンス body の文言を出す。`FetchAuthedError` の `bodyText` を `JSON.parse` し `body.message ?? body.error ?? error.message` を抽出、parse 失敗時は `bodyText` を fallback、`FetchAuthedError` 以外は `error.message` を返す純粋 helper（`errorMessage(error)`）を component 直前に定義する。
- **Why**: 初回 Playwright 実行で inline error 文言が API body（例「すでに統合済みです」）と乖離する drift を検出した（discovered-issues に記録、同サイクル修正）。`error.message` だけだと transport 層の汎用文言が出て 409 の業務メッセージが落ちる。
- **How to apply**: `@/lib/fetch/errors` の `FetchAuthedError`（`status` / `bodyText` を持つ）を import し、body JSON の `message`/`error` を優先抽出する。helper は副作用なしの pure function にして test しやすくする。

## L-I988-003 — rejected mutation は rollback、success は非表示維持（再表示しない）

- **Rule**: `onMerge` 先頭で `setOptimisticMerged(true)` → `trigger(...).catch(() => setOptimisticMerged(false))` で失敗時のみ rollback。catch 内で modal は閉じず reason を保持する。success path では onSuccess で idle に戻しても row は `return null` のまま維持し、再表示しない。
- **Why**: success 後に row を再表示すると「消えたものが一瞬戻る」flicker になり optimistic UX を損なう。一方 409 等の失敗では row を戻して再操作可能にする必要がある。success と failure で復帰挙動が非対称。
- **How to apply**: optimistic hide は失敗時のみ巻き戻す。成功時は server が同じ row を返さない前提（一覧から消える）なので hide を恒久化する。

## L-I988-004 — focused test は「server 応答前 hide / success 後も hide 維持 / 409 rollback で再表示」の 3 ケースに分ける

- **Rule**: optimistic mutation の focused test は (1) `trigger` が pending Promise（`new Promise(() => {})`）の間に row が消えること、(2) resolve 後も row が消えたままであること、(3) reject（`FetchAuthedError(409, ...)`）で row が再表示され reason/error が残ることの 3 ケースを別 it として持つ。既存の「success 後にボタン再表示」assertion は「row 消失維持」へ更新する。
- **Why**: optimistic と success と rollback は別タイミングの別契約。1 ケースに混ぜると pending 中の hide を検証できず、success 後の flicker 回避も担保されない。
- **How to apply**: pending は never-resolve Promise で固定。assertion は DOM 上の row 識別子（`conflict: <id>`）の有無で行い、内部 state を覗かない。

## L-I988-005 — Playwright の getByText は exact:true で conflict id の substring 一致を防ぐ

- **Rule**: `m_src_01` のような ID を locator に使うときは `getByText('m_src_01', { exact: true })` を付ける。conflict id（`m_src_01__m_dst_01`）が substring match して複数要素にヒットするのを防ぐ。
- **Why**: exact なしだと `m_src_01` が `conflict: m_src_01__m_dst_01` 行にも一致し、locator が strict-mode violation か誤要素を掴んで false positive/negative になる。
- **How to apply**: 部分文字列が他の長い識別子の prefix になり得る text locator は常に `{ exact: true }`。row 特定は `getByText('conflict: <id>').locator('xpath=ancestor::li[1]')` で scope を絞る。

## L-I988-006 — VISUAL_ON_EXECUTION の screenshot は env-gated capture にして通常 run へ影響させない

- **Rule**: Playwright spec 内の screenshot は環境変数（`PLAYWRIGHT_ISSUE988_SCREENSHOT_DIR`）が設定されたときだけ `mkdirSync(dir, { recursive: true })` + `page.screenshot` する helper にラップし、未設定時は早期 return で no-op にする。
- **Why**: VISUAL_ON_EXECUTION の local evidence 取得を、CI/通常の Playwright run（screenshot 不要）に副作用なく同居させるため。spec を分岐させずに 1 ファイルで evidence capture と通常 assertion を両立できる。
- **How to apply**: capture 先 dir を env で受け、未設定なら何もしない。screenshot ファイル名は Phase 1 spec で canonical 名（`identity-conflict-row-merge-final.png` 等）を先に固定し implementation-guide でも同名参照して name drift を防ぐ。

## 関連

- [[workflow-issue-988-identity-conflicts-merge-optimistic-update-artifact-inventory]]
- 発見元 unassigned spec: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/unassigned-task-specs/admin-identity-conflicts-followup-002-merge-confirm-optimistic-update.md`（consumed by 本ワークフロー）
