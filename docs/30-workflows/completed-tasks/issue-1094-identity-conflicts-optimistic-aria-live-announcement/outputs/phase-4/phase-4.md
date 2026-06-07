# Phase 4: テスト作成（TDD RED 設計）

`[実装区分: 実装仕様書]` / `implementation_mode: new`

Issue #1094「optimistic 消失時の aria-live アナウンス最適化（FU-AIDC-008）」の TDD RED フェーズ。
**まだ実装は行わない**（本サイクルはコード実装を実行しない・user-gated）。Phase 5 で書く実装
（ページレベル単一 live region `IdentityConflictAnnouncer` + 文言単一導出 `identityConflictAnnouncements.ts`
+ `IdentityConflictRow.tsx` の focus-steal / row-local status node 撤去）が満たすべき focused Vitest ケースを
先に定義し、「失敗する状態（RED）」を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED 維持） |
| phase | 4（テスト作成 / TDD RED） |
| 新規 vitest | `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx`（新規） |
| 更新 vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集） |
| 実装対象（Phase 5 で着手） | `IdentityConflictAnnouncer.tsx` / `identityConflictAnnouncements.ts`（新規）・`IdentityConflictRow.tsx` / `page.tsx`（編集） |
| 参照のみ（変更しない） | `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `apps/web/src/styles/*` / `apps/api/**` |
| 構成 reference | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-4/phase-4.md` |

## 目的

現行 `IdentityConflictRow.tsx` の (1) row-local `role="status"` sr-only node（136-148）、
(2) `optimisticStatusRef.current?.focus()` による focus 奪取（81-84）、(3) merge/dismiss 文言のインライン三項
（74-79）を、Phase 5 で次の形へ置き換える。その public 挙動を internal state 名に依存せず DOM / role 経由で
観測可能にする RED を先に固定する。

- ページレベル単一 `aria-live="polite"` region 経由でアナウンスが読み上げられる（row-local status 不使用・AC-1）。
- 操作直後にカーソルが status node へ移動しない（focus stealing 撤去・AC-2）。
- 複数 row 連続処理でもアナウンスが競合・欠落しない（append-children・AC-3）。
- merge/dismiss 文言が単一導出ロジック（`announcementFor`）から生成される（AC-4）。
- rollback error（`role="alert"`）が非回帰で維持され、rollback 時はアナウンスされない（AC-5）。

## 実行タスク

### 4.1 RED の前提（Phase 1-3 確定設計の再掲・SSOT 整合）

`index.md`「設計方針（SSOT）」「主要シグネチャ（SSOT）」と矛盾しないこと。

| 項目 | 確定内容 |
| --- | --- |
| アーキテクチャ | ページレベル単一 live region + announce context。発火源 = row / 読み上げ先 = 親の単一 region |
| announce の正体 | `IdentityConflictAnnouncer` が `useState<{id,text}[]>` で messages を保持し、`announce()` で append。**context 注入された関数**（row からは context 経由でのみ呼ぶ） |
| TTL | `ANNOUNCE_TTL_MS = 1000`。append された child は TTL 経過後に当該 id を除去 |
| 文言導出 | `identityConflictAnnouncements.ts` の `IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string>` map + `announcementFor(action)`（pure） |
| row 側 | row-local status node（136-148）と focus useEffect（81-84）と `optimisticStatusRef`（35）を撤去。`optimisticMerged \|\| optimisticDismissed` で `return null`。除去確定時に `announce(announcementFor(action))` を 1 回だけ呼ぶ（`hasAnnouncedRef` で重複防止）。rollback 時は `hasAnnouncedRef` を reset |
| rollback error | `role="alert"`（merge/dismiss inline error）は一切変更しない（AC-5） |

### 4.2 テストで操作する対象が外部 props か内部 state か（VSCPKR-03 対策・必須明記）

private state を props として直接観測しない。各観測点を「外部注入 / 内部 state」で分類する。

| 観測対象 | 分類 | テストでの扱い |
| --- | --- | --- |
| `IdentityConflictAnnouncer` の `messages` 配列 | **内部 state**（`useState`） | 直接読まない。`role="status"` region 内の child node / textContent 経由で観測する |
| `IdentityConflictRow` の `optimisticMerged` / `optimisticDismissed` | **内部 state**（`useState`） | 直接読まない。`onDismiss`/`onMerge` を fireEvent で駆動し、row の DOM 消失（`queryByText("conflict: c_1")` が null）で観測する |
| `announce` 関数 | **context 注入**（provider から `useIdentityConflictAnnounce()` 経由） | row 単体テストでは `IdentityConflictAnnouncer` で **ラップして render**（`renderWithAnnouncer`）し、region の textContent で間接観測する。spy 注入はしない（context 実体の append-children を結合検証する） |
| `hasAnnouncedRef` | **内部 ref** | 直接読まない。rollback → 再実行で再度アナウンスが出る（region に再度メッセージ）ことで間接観測する |
| `announcementFor(action)` | **pure 関数**（外部 import） | 戻り値 string を直接 assert してよい（純関数・副作用なし） |

> 原則: announcer の messages / row の optimistic は **内部 state ゆえ DOM 経由でのみ観測**。announce は
> **context 注入**ゆえ `renderWithAnnouncer` でラップして region textContent を見る。`announcementFor` のみ
> pure 関数として戻り値直接 assert を許可する。

### 4.3 `renderWithAnnouncer` test helper の設計

row を `<IdentityConflictAnnouncer>` でラップして render する共通ヘルパを `IdentityConflictRow.spec.tsx` 上部に追加する。

```tsx
import { IdentityConflictAnnouncer } from "../IdentityConflictAnnouncer";

// row を単一 live region provider でラップして render する。
// 返り値の result から region(status) を getByRole("status") で取得し textContent を観測する。
const renderWithAnnouncer = (ui: React.ReactElement) =>
  render(<IdentityConflictAnnouncer>{ui}</IdentityConflictAnnouncer>);
```

- 既存の `vi.mock("../../../features/admin/hooks", ...)` / `setMutationState` / `item` / endpoint 定数は
  **そのまま流用**する（新規 mock 機構を追加しない）。
- announce を観測したいケースは `render(...)` を `renderWithAnnouncer(...)` へ置換する。
- region は provider 直下に 1 つだけ存在する想定なので `screen.getByRole("status")` で単一取得できる
  （複数なら `getAllByRole("status")` で件数 assert）。

### 4.4 jsdom/happy-dom 注意（VSCPKR-02）と fake timers

- `vi.stubGlobal("window", ...)` を **使わない**。`window` プロパティ差し替えが必要な場合は
  `Object.defineProperty(window, "...", { configurable: true, value: ... })` を使う
  （既存 spec の `vi.spyOn(window, "matchMedia")` パターンも踏襲可）。
- TTL 除去（TC-ANN-04）と非アナウンス（TC-ROW-04）の検証で `vi.useFakeTimers()` を使う。
  fake timer と `waitFor` / Promise 解決を混在させる場合は `await act(async () => { await vi.advanceTimersByTimeAsync(ANNOUNCE_TTL_MS); })`
  を用い、テスト末尾（または `afterEach`）で `vi.useRealTimers()` に戻す（既存 `afterEach` が `vi.useRealTimers()` を呼ぶ）。
- `document.activeElement` を観測する TC-ROW-01 は fake timer 不要（focus が **移らない**ことの検証なので
  timer 進行に依存しない）。

### 4.5 追加する focused Vitest ケース一覧

#### 4.5.1 新規ファイル `IdentityConflictAnnouncer.spec.tsx`

announcer / 文言 module を単体検証する。row には依存しない（純粋に provider + region + context fallback）。

| テストID | 対象 | 入力 | 期待 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-ANN-01 | region 単一性 | `<IdentityConflictAnnouncer><div /></IdentityConflictAnnouncer>` を render | `screen.getAllByRole("status")` が **長さ 1**。その node が `aria-live="polite"` 属性を持ち、`className` に `sr-only` を含む（visual 非露出） | AC-1 |
| TC-ANN-02 | announce で child 追加 | provider 内の consumer から `announce("テスト文言")` を click で 1 回呼ぶ | region の textContent に `"テスト文言"` が現れる（child node が 1 つ追加される） | AC-1 |
| TC-ANN-03 | 連続 announce 2 回 | consumer から `announce("A")` → `announce("B")` を順に呼ぶ | region 内に **2 つ**の child（メッセージ）が **順番に**存在（`"A"` と `"B"` 両方が textContent に含まれ、append 順で並ぶ）。上書きや collapse で 1 件に潰れない | AC-3 |
| TC-ANN-04 | TTL 除去 | `vi.useFakeTimers()` → `announce("X")` → `vi.advanceTimersByTimeAsync(ANNOUNCE_TTL_MS)` | TTL 経過後に当該 child が region から除去される（textContent に `"X"` を含まなくなる・region 自体は残存） | AC-3（DOM 肥大防止） |
| TC-ANN-05 | provider 外 fallback | provider で**ラップせず** consumer 単体を render し `useIdentityConflictAnnounce()` 由来の `announce("Y")` を呼ぶ | throw しない。no-op として安全に返る（例外も unhandled rejection も発生しない） | AC-1（堅牢化） |
| TC-ANN-06 | 文言単一導出 | `announcementFor("merge")` / `announcementFor("dismiss")` を直接呼ぶ | 各々 `IDENTITY_CONFLICT_ANNOUNCEMENTS.merge` / `.dismiss`（SSOT 文言）と厳密一致。map 1 本から導出される | AC-4 |

> TC-ANN-02/03/05 の consumer は spec 内に最小テスト component を定義する（例: `useIdentityConflictAnnounce()` を
> 呼んでボタン click で `announce(text)` を発火する `<Caller text=... />`）。これは announce が **context 注入**で
> あることを反映した結合検証であり、announce 関数を mock しない。

#### 4.5.2 既存ファイル `IdentityConflictRow.spec.tsx` 更新

row 側の挙動を `renderWithAnnouncer` でラップして検証する。

| テストID | 対象 | 入力 | 期待 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-ROW-01 | 非 focus-steal | dismiss optimistic 実行（pending mock）→ row 消失 | `screen.queryByText("conflict: c_1")` が null（row 除去）。**`document.activeElement` が region(status) node に**ならない（`expect(document.activeElement).not.toBe(screen.getByRole("status"))`。`body` など非 status のまま）。**既存 line 342-344 の `document.activeElement === status` assertion を置換する**（下表 4.6 参照） | AC-2 |
| TC-ROW-02 | ページレベル region へアナウンス | `renderWithAnnouncer(<IdentityConflictRow item={item} />)` で dismiss optimistic 実行 | row 消失後、**provider の単一 region**（`getByRole("status")`）の textContent に dismiss 文言（`announcementFor("dismiss")`）が現れる。row-local status node は存在しない（region は row の外＝provider 直下） | AC-1 |
| TC-ROW-03 | merge 確定でアナウンス | `renderWithAnnouncer` で merge を二段階確認 → exiting → `transitionEnd`/fallback で除去確定 | 除去確定時に region textContent に merge 文言（`announcementFor("merge")`）が現れる | AC-1/AC-4 |
| TC-ROW-04 | rollback で非アナウンス | `renderWithAnnouncer` で dismiss を reject mock（409）で実行 | row 復元（`getByText("conflict: c_1")` 再表示）かつ `role="alert"` にエラー文言表示。region の textContent に **dismiss 文言が現れない**（アナウンスされない）。`vi.useFakeTimers()` で TTL 進行しても region に文言が出ない | AC-5 |
| TC-ROW-05 | rollback 後の再実行で再アナウンス | dismiss reject（1 回目）→ row 復元 → 再度 dismiss を resolve mock（2 回目）で確定 | 2 回目の除去確定で region textContent に dismiss 文言が現れる（`hasAnnouncedRef` reset により再アナウンス可能） | AC-5/AC-3 |
| TC-ROW-06 | 連続 2 row が単一 region に競合せず | `renderWithAnnouncer` で **2 つの `IdentityConflictRow`**（`item` と異なる `conflictId` の `item2`）を描画し、両方を順に dismiss optimistic | 単一 region の textContent に **2 件**の dismiss 文言が append 順で存在（競合せず両方読み上げ可能）。region は 1 つのまま（`getAllByRole("status")` が長さ 1） | AC-3（統合） |

> TC-ROW-03 の「除去確定」は #1043 で導入済の exiting 相を経る（merge は `isExiting` → `transitionEnd` または
> fallback timer → `optimisticMerged=true`）。jsdom では `fireEvent.transitionEnd(rowRoot)` で明示発火するか
> fake timer で fallback を進める（既存 spec の merge ケース踏襲）。dismiss は exiting 相を経ず即 `return null`。

### 4.6 既存テストの更新方針（line 342-344 focus-steal assertion の置換）

| 既存テスト | 現状（line） | 更新方針 |
| --- | --- | --- |
| `dismiss 実行直後に server 応答前でも row を optimistic に非表示にする`（spec line 325-345） | line 342-344: `const status = screen.getByRole("status"); expect(status.textContent).toContain("候補を一覧から非表示にしました"); await waitFor(() => expect(document.activeElement).toBe(status));` | (1) `render(...)` を `renderWithAnnouncer(...)` へ置換。(2) **line 344 の `document.activeElement === status` を削除**し、`expect(document.activeElement).not.toBe(screen.getByRole("status"))`（= TC-ROW-01・非 focus-steal）へ置換。(3) アナウンス検証は「**provider の単一 region** textContent に dismiss 文言」（= TC-ROW-02）へ移す。row-local status node を前提とした assertion は撤去する |
| その他の dismiss/merge rollback ケース（line 364-418 等） | `getByRole("status")` を row-local 前提では使用していない（`getByRole("alert")` が主） | `role="alert"` 系は不変（AC-5）。ただし row を render する全ケースを `renderWithAnnouncer` でラップして provider が常駐する状態へ統一する（region が存在しても既存 alert 検証は非干渉。`getByRole("status")` を使う箇所がないことを確認） |

> 注意: `getByRole("status")` は **provider の単一 region** を指すように意味が変わる（従来は row-local node）。
> 既存 spec で `getByRole("status")` を使う箇所は line 342 のみ。ここを上記方針で置換すれば衝突しない。
> `renderWithAnnouncer` 導入後は region が常に 1 つ存在するため、row 未消失ケースで `getByRole("status")` を
> 呼ぶと region（空 or 直近文言）を取得する点に留意（誤検証回避のため row 消失後に textContent を見る）。

### 4.7 命名規則整合チェック（RED を書く前に必ず実施）

1. 新規 export 名が `IdentityConflictAnnouncer`（PascalCase component）/ `useIdentityConflictAnnounce`（camelCase hook・`use` prefix）/ `announcementFor`（camelCase 関数）/ `IDENTITY_CONFLICT_ANNOUNCEMENTS`（SCREAMING_SNAKE const）/ `ANNOUNCE_TTL_MS`（SCREAMING_SNAKE const）/ `IdentityConflictAction`（PascalCase 型）であること。
2. テストコード内で internal state 名（`messages` / `optimisticMerged` / `optimisticDismissed` / `hasAnnouncedRef`）を文字列・props として **直接参照しない**こと。検証はすべて public 挙動（region textContent / `getByRole("status")` 件数 / `document.activeElement` / `role="alert"` / `queryByText`）経由。
3. snake_case / kebab-case の identifier 混入がないこと。

### 4.8 RED 実行コマンド（targeted run / メモリ制約対策）

リポジトリルートから実行する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx
```

> 全 vitest を回さず対象 2 本に限定する。`@ubm-hyogo/web` は `apps/web/package.json` の `name`。

### 4.9 期待される失敗（RED 確認）

| ケース | Phase 5 実装前の挙動 | RED の意味 |
| --- | --- | --- |
| TC-ANN-01〜06 | `IdentityConflictAnnouncer` / `identityConflictAnnouncements.ts` が未作成 → import 解決失敗で suite が読み込めない / 関数未定義 | FAIL（期待通り・RED時点では新規モジュール未作成） |
| TC-ROW-01 | 現行は `optimisticStatusRef.current?.focus()` で status node に focus が移る → `document.activeElement === status` が成立 → 非 focus-steal 期待が FAIL | FAIL（期待通り） |
| TC-ROW-02 | 現行は row-local status node にのみ文言が出る。provider 単一 region は未導入 → region textContent に文言が出ない | FAIL（期待通り） |
| TC-ROW-03 | 同上（merge も row-local node 依存） | FAIL（期待通り） |
| TC-ROW-04 | 現行は rollback 時に announce 概念がない（row-local node は row 復元で消える）が、provider region 検証が未導入のため文脈不成立 | FAIL（期待通り） |
| TC-ROW-05 | `hasAnnouncedRef` reset 機構がRED時点で未作成 | FAIL（期待通り） |
| TC-ROW-06 | provider 単一 region append-children が未導入 | FAIL（期待通り） |

RED が想定どおり FAIL することを確認してから Phase 5 へ進む（RED設計後、automation-30改善で実装済み）。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| SSOT 設計正本 | `../../index.md` | 設計方針 / AC / inventory / 主要シグネチャ |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | focus-steal（81-84）/ row-local status（136-148）/ 文言三項（74-79） |
| 既存テスト | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | mock ヘルパ踏襲 / line 342-344 置換 |
| 構成 reference | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-4/phase-4.md` | RED テスト記法 / jsdom 系統 |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 不変条件 #10（参照のみ） |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-4/phase-4.md` | 追加/更新する focused Vitest ケース一覧（TC-ANN-01〜06 / TC-ROW-01〜06）、`renderWithAnnouncer` helper 設計、外部 props/内部 state の分類（VSCPKR-03）、happy-dom 注意（VSCPKR-02）と fake timers、line 342-344 focus-steal assertion 置換方針 |

## 統合テスト連携

- 本 Phase の focused Vitest は Phase 5 実装の受け入れ門（AC-6）。RED → GREEN を Phase 5 / Phase 6 で確認する。
- Phase 6 で fail path（rollback 非アナウンス・TTL 境界・複数 action 混在・provider 外 fallback・aria-live 属性非回帰）を拡充する。
- Playwright e2e（`admin-identity-conflicts.spec.ts`）は Phase 6 で「単一 `aria-live` region 存在 + row-local status node 非存在」の非回帰確認へ更新（任意・軽微）。本 Phase の vitest は jsdom 専用で e2e と独立。

## 完了条件（Phase 4）

- TC-ANN-01〜06 / TC-ROW-01〜06 を テストID・対象・入力・期待・対応 AC とともに表で確定した。
- テストで操作する対象が外部 props か内部 state かを明記した（announcer messages = 内部 state / row optimistic = 内部 state / announce = context 注入 / `announcementFor` = pure 関数）。
- `renderWithAnnouncer` helper の設計を確定した。
- happy-dom 注意（`vi.stubGlobal("window")` 禁止・`Object.defineProperty` 使用）と fake timers の使い方を明記した。
- 既存 line 342-344 の `document.activeElement === status` assertion の置換方針を明記した。
- RED 実行コマンド（リポジトリルートから 2 本限定）と期待される失敗を確定した。
