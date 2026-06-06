# Phase 6: テスト拡充

`[実装区分: 実装仕様書]` / `implementation_mode: new`

Issue #1094「optimistic 消失時の aria-live アナウンス最適化（FU-AIDC-008）」の Phase 5 GREEN を前提に、
fail path / 回帰 guard を追加し AC-3 / AC-4 / AC-5 / AC-8 を堅牢化する仕様。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED 維持） |
| phase | 6（テスト拡充） |
| 対象 vitest | `IdentityConflictRow.spec.tsx` / `IdentityConflictAnnouncer.spec.tsx`（編集） |
| 対象 e2e（任意・軽微） | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（編集） |
| 前提 | Phase 5 実装で Phase 4 RED が GREEN 化済み |

## 目的

Phase 4 の基本ケースに加えて、(1) rollback 非アナウンス、(2) TTL 境界、(3) 複数 action 混在（merge と
dismiss 連続）、(4) provider 外 fallback の堅牢化、(5) `aria-live` / `role="status"` 属性の非回帰、
(6) 既存 18 テストの非回帰、を追加し、アナウンス最適化導入による回帰を防ぐ。検証はすべて public 挙動
（region textContent / `getByRole("status")` 件数・属性 / `document.activeElement` / `role="alert"`）経由で行い、
internal state を直接読まない。

## 実行タスク

### 6.1 fail path / 回帰 guard（focused Vitest 追加）

#### 6.1.1 `IdentityConflictRow.spec.tsx` 追加

| テストID | 内容 | mock | 期待値 | jsdom 対応 | 対応 AC |
| --- | --- | --- | --- | --- | --- |
| TC-NO-ANN-ON-ROLLBACK | merge 409 rollback で**アナウンスされない** | `trigger = vi.fn().mockRejectedValue(new FetchAuthedError(409, ...))` + `setMutationState(mergeEndpoint, { trigger, error })` | `renderWithAnnouncer` で merge 実行 → `await waitFor(() => expect(trigger).toHaveBeenCalled())`。`getByText("conflict: c_1")` 再表示・`getByRole("alert")` にエラー。**region textContent に merge 文言が現れない**。`vi.useFakeTimers()` で `vi.advanceTimersByTimeAsync(ANNOUNCE_TTL_MS)` 進行しても region に文言が出ない | fake timer | AC-5 |
| TC-ANN-AFTER-RETRY | rollback 後の再実行で再アナウンス（`hasAnnouncedRef` reset） | dismiss を `mockRejectedValueOnce(...)` → `mockResolvedValueOnce(...)` | `renderWithAnnouncer` で 1 回目 dismiss → rollback（region に文言なし）→ 2 回目 dismiss 確定 → region textContent に dismiss 文言が現れる | 通常 + waitFor | AC-5/AC-3 |
| TC-MIXED-ACTIONS | 同一 region に merge と dismiss が混在して順番に出る | merge=pending→確定、dismiss は別 row（`item2`）で resolve | `renderWithAnnouncer` で row1 を merge 確定 → row2 を dismiss 確定 → 単一 region に **merge 文言と dismiss 文言の 2 件**が append 順で存在。region は 1 つ（`getAllByRole("status")` 長さ 1） | (a) transitionEnd or (b) fake timer | AC-3/AC-4 |
| TC-ANN-ONCE | 1 回の除去確定でアナウンスは 1 件のみ（重複防止） | dismiss pending mock | `renderWithAnnouncer` で dismiss 実行 → row 消失。region 内の dismiss 文言 `<p>` が **1 件のみ**（再 render で重複 append されない・`hasAnnouncedRef` ガード） | 通常 | AC-3 |
| TC-NO-FOCUS-STEAL-MERGE | merge 確定でも focus を奪わない（AC-2 補強・dismiss 側 TC-ROW-01 の merge 版） | merge pending → 確定 | `renderWithAnnouncer` で merge 確定 → row 除去後 `document.activeElement` が region(status) でない | (a) or (b) | AC-2 |

#### 6.1.2 `IdentityConflictAnnouncer.spec.tsx` 追加（TTL 境界 / fallback 堅牢化）

| テストID | 内容 | 期待値 | jsdom 対応 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-ANN-TTL-EACH | 連続 2 announce が各々独立 TTL で除去される | `vi.useFakeTimers()` → `announce("A")` → 半 TTL 進める → `announce("B")` → 残り進めると "A" 除去・"B" 残存 → さらに進めると "B" も除去。各メッセージが独立 timer で消える | fake timer | AC-3 |
| TC-ANN-TTL-NO-REGION-REMOVE | TTL で child は消えても region 自体は残存 | 全 child 除去後も `getByRole("status")` が存在し `aria-live="polite"` を保持（空 region 常駐） | fake timer | AC-1 |
| TC-ANN-FALLBACK-NOOP-SAFE | provider 外 `announce` を**複数回**呼んでも throw / unhandled rejection なし | provider なし consumer で `announce("a")`→`announce("b")` を click 連打 → 例外なし・DOM 変化なし | 通常 | AC-1 |
| TC-ANN-UNMOUNT-SAFE | announce 直後の unmount で timer leak / act 警告なし | `vi.useFakeTimers()` → `announce("x")` → `cleanup()`（unmount）→ `vi.advanceTimersByTimeAsync(ANNOUNCE_TTL_MS)` 進めても unmount 後 setState 警告が出ない（`useEffect` cleanup で全 timer clear） | fake timer | AC-3 補強 |

> happy-dom 注意（VSCPKR-02）: `vi.stubGlobal("window")` を使わない。属性差し替えが要る場合のみ
> `Object.defineProperty(window, ...)` を使う。fake timer は `await act(async () => { await vi.advanceTimersByTimeAsync(...); })`
> でラップし、テスト末尾 / `afterEach` で `vi.useRealTimers()` に戻す。

### 6.2 aria-live 属性の非回帰 guard（focused Vitest）

| テストID | 内容 | 期待値 | 対応 AC |
| --- | --- | --- | --- |
| TC-ARIA-LIVE-NONREG | 単一 region の属性が固定 | `IdentityConflictAnnouncer` render 後、唯一の `role="status"` node が `aria-live="polite"` かつ `className` に `sr-only` を含む。`assertive` でない・visual 露出しない | AC-1 |
| TC-NO-ROW-LOCAL-STATUS | row-local status node が消えていること | `renderWithAnnouncer(<IdentityConflictRow item={item} />)` で **row を消す前**は `getAllByRole("status")` が長さ 1（= provider region のみ。row 内に追加 status がない）。dismiss して row 消失後も長さ 1 | AC-1/AC-2 |

### 6.3 既存 18 テストの非回帰（必須確認）

Phase 4 / Phase 5 で `render(...)` を `renderWithAnnouncer(...)` へ置換した既存ケースが**意味を保ったまま PASS**
することを確認する。`IdentityConflictRow.spec.tsx` の現行ケース（idle 表示 / merge 二段階 / exiting / merge rollback /
dismiss / dismiss rollback / dismiss retry / cancel 等）について以下を保証する。

| 観点 | 非回帰条件 |
| --- | --- |
| `role="alert"` 系 | merge/dismiss 失敗時の inline error 表示（`getByRole("alert").textContent`）が従来どおり PASS（AC-5・provider ラップは alert を干渉しない） |
| exiting 相（#1043 由来） | merge の `data-state="exiting"` / `opacity-0` / `transitionEnd` / fallback timer 系ケースが従来どおり PASS（本タスクは exiting 相に触れない） |
| dismiss optimistic hide | row 消失（`queryByText("conflict: c_1") === null`）が従来どおり PASS。ただし line 342-344 の **focus assertion は Phase 4 §4.6 で置換済**（`document.activeElement !== status`） |
| `getByRole("status")` 衝突回避 | `renderWithAnnouncer` 導入で region が常駐するため、row 未消失ケースで誤って region を拾わないこと。`getByRole("status")` を使うのは置換後の TC-ROW-01/02 のみで、他ケースは `getByRole("alert")` / `queryByText` を使う |

> 既存 18 テスト中、**変更が必要なのは line 342-344 を含む `dismiss 実行直後...` ケース 1 件のみ**（Phase 4 §4.6）。
> それ以外は `render` → `renderWithAnnouncer` への機械的置換で挙動不変（provider 常駐は alert/exiting/list に非干渉）。
> 置換後に既存全ケースが green であることを 6.5 のコマンドで確認する。

### 6.4 静的回帰 guard（design token / legacy hook）

リポジトリルートから実行し、いずれも **0 件**であること。

```bash
# HEX 直書き / inline style の混入が無いこと（新規 2 ファイル + 編集 row・0 件期待）
rg -n "#[0-9a-fA-F]{3,8}|style=\{\{" \
  apps/web/src/components/admin/IdentityConflictAnnouncer.tsx \
  apps/web/src/components/admin/identityConflictAnnouncements.ts \
  apps/web/src/components/admin/IdentityConflictRow.tsx

# legacy mutation hook 参照が無いこと（0 件期待・不変条件 #10）
grep -rn "@/lib/useAdminMutation" \
  apps/web/src/components/admin/IdentityConflictRow.tsx \
  apps/web/src/components/admin/IdentityConflictAnnouncer.tsx
```

- 期待: いずれもマッチ 0 件。1 件でもヒットすれば Phase 5 へ差し戻す。
- 新規 token / keyframes の追加が無いこと（`tokens.css` に diff なし）も併せて確認する。

### 6.5 Playwright e2e の非回帰整合（任意・軽微）

`admin-identity-conflicts.spec.ts` に、単一 `aria-live` region の存在と row-local status node 非存在の
非回帰確認を追加する（NON_VISUAL のため screenshot は撮らない）。

| 確認 | 方針 |
| --- | --- |
| 単一 live region 存在 | `page.getByRole("status")`（または `[aria-live="polite"]`）が 1 つ存在することを assert |
| row-local status 非存在 | optimistic 消失後も `status` role が増殖しない（単一のまま）ことを auto-retry で確認 |
| 既存 optimistic / rollback 系 | 変更不要（`toHaveCount(0)` / `toBeVisible()` の auto-retry に委ねる・中間フレーム非 assert） |

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-identity-conflicts.spec.ts
```

> e2e は CI / 専用環境で実行する想定。ローカル browser 未導入時は CI green で担保（AC-8）。新 fixture は追加しない。

### 6.6 拡充後の検証コマンド（リポジトリルートから）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx
rg -n "#[0-9a-fA-F]{3,8}|style=\{\{" apps/web/src/components/admin/IdentityConflictAnnouncer.tsx apps/web/src/components/admin/identityConflictAnnouncements.ts apps/web/src/components/admin/IdentityConflictRow.tsx   # 0 件
grep -rn "@/lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx apps/web/src/components/admin/IdentityConflictAnnouncer.tsx   # 0 件
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| SSOT 設計正本 | `../../index.md` | AC / 設計方針 |
| Phase 4 テスト | `../phase-4/phase-4.md` | 基本ケース / `renderWithAnnouncer` / line 342-344 置換 |
| Phase 5 実装 | `../phase-5/phase-5.md` | GREEN 化済み実装方針 |
| 既存テスト | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 既存 18 ケース非回帰 |
| 既存 e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 単一 region 非回帰 |
| 不変条件 | `CLAUDE.md`（#2 token / #10 legacy hook） | 静的 guard 根拠 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-6/phase-6.md` | 追加 fail-path / 回帰 guard（rollback 非アナウンス / TTL 境界 / 複数 action 混在 / provider 外 fallback / unmount safe / aria-live 非回帰）、既存 18 テスト非回帰確認方針、静的 guard（token grep / legacy hook grep）、Playwright 単一 region 非回帰整合 |

## 統合テスト連携

- 6.1 の fail path / 複数 action 混在 / TTL 境界 / provider 外 fallback が GREEN（AC-3 / AC-4 / AC-5 補強）。
- 6.2 の aria-live 非回帰 / row-local status 非存在が GREEN（AC-1）。
- 6.3 の既存 18 テストが非回帰で PASS。
- 6.4 の静的 guard が 0 件（AC-8）。
- 6.5 の Playwright e2e が単一 region 非回帰で green（AC-8）。
- typecheck / lint green（AC-7）。
- Phase 11 で NON_VISUAL evidence（focused Vitest + 手動 SR 検証ノート・user-gated）、Phase 12 で四条件判定・未タスク化判断。

## 完了条件（Phase 6）

- TC-NO-ANN-ON-ROLLBACK / TC-ANN-AFTER-RETRY / TC-MIXED-ACTIONS / TC-ANN-ONCE / TC-NO-FOCUS-STEAL-MERGE（row 側）と TC-ANN-TTL-EACH / TC-ANN-TTL-NO-REGION-REMOVE / TC-ANN-FALLBACK-NOOP-SAFE / TC-ANN-UNMOUNT-SAFE（announcer 側）の fail path・回帰 guard を確定した。
- aria-live 属性 / row-local status 非存在の非回帰 guard（TC-ARIA-LIVE-NONREG / TC-NO-ROW-LOCAL-STATUS）を確定した。
- 既存 18 テストが非回帰で通る確認方針（変更は line 342-344 の 1 件のみ・他は `render`→`renderWithAnnouncer` 機械置換）を確定した。
- design token guard（`rg` で `#hex` / `style={{` 0 件）と legacy hook guard（`grep` で `@/lib/useAdminMutation` 0 件）を確定した。
- Playwright e2e の単一 region 非回帰整合方針を確定した。
- 拡充後の検証コマンド一式を確定した。
