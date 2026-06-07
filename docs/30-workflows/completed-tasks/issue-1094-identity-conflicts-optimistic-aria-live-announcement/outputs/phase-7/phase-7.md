# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED 維持） |
| phase | 7（カバレッジ確認） |
| measure 対象（変更ファイルに限定） | `IdentityConflictAnnouncer.tsx` / `identityConflictAnnouncements.ts` / `IdentityConflictRow.tsx`（変更ブロックのみ） |
| coverage 実行コマンド | §7.3 参照 |

## 目的

アナウンス最適化の追加分岐（announcer の `announce` append / TTL 除去 / provider 外 fallback / unmount cleanup、
文言 module の `announcementFor` 導出、row の mutation success action / announceOnce / `hasAnnouncedRef` ガード /
rollback reset / `return null` 化）が、focused Vitest で line + branch ともに covered であることを
**変更ファイル / 変更ブロックに限定して実測**する。全ファイル一律の coverage 測定は行わない
（Feedback BEFORE-QUIT-002）。

## 実行タスク

### 7.1 coverage 対象範囲（変更ファイルに限定）

| 区分 | パス | 測定範囲 |
| --- | --- | --- |
| 新規 | `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | ファイル全体（新規・全行が本タスク導入） |
| 新規 | `apps/web/src/components/admin/identityConflictAnnouncements.ts` | ファイル全体（pure module・`announcementFor` + map） |
| 編集 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | **変更ブロックのみ**（mutation success action / announceOnce / `hasAnnouncedRef` / rollback reset / `return null` 分岐）。既存の merge dialog / dismiss dialog / exiting 相は既存 coverage を維持するだけ |

> hook（`useAdminMutation`）/ `page.tsx` / test / playwright / 他 component は **対象外**。coverage の include を
> 上記 3 ファイルへ絞り、無関係ファイルの低 coverage をノイズとして混ぜない。全ファイル一律指定はしない。

### 7.2 測定対象の分岐（line + branch・変更ブロックに限定）

#### 7.2.1 `identityConflictAnnouncements.ts`

| 区分 | 場所 | 測定対象 | covered する Phase 4/6 ケース |
| --- | --- | --- | --- |
| 文言導出（line） | `announcementFor(action)` の `return IDENTITY_CONFLICT_ANNOUNCEMENTS[action]` | line | TC-ANN-06（merge / dismiss 双方） |
| map 双方キー（branch 相当） | `merge` / `dismiss` 両キーが lookup される | 両キー到達 | TC-ANN-06 + TC-ROW-02/03（row 経由） |

#### 7.2.2 `IdentityConflictAnnouncer.tsx`

| 区分 | 場所 | 測定対象 | covered する Phase 4/6 ケース |
| --- | --- | --- | --- |
| announce append（line） | `announce` の `setMessages((prev) => [...prev, { id, text }])` + `setTimeout(...)` 登録 | line | TC-ANN-02 / TC-ANN-03 |
| TTL 除去（line） | `setTimeout` callback の `setMessages(filter)` + `timersRef.delete(id)` | line | TC-ANN-04 / TC-ANN-TTL-EACH |
| provider fallback（branch） | `useIdentityConflictAnnounce` の `fn ?? (() => {})` の **null（fallback）/ non-null（provider 内）両枝** | branch | TC-ANN-05 / TC-ANN-FALLBACK-NOOP-SAFE（null 枝）+ TC-ANN-02 等（non-null 枝） |
| unmount cleanup（line） | `useEffect` return の `for (const t of timers.values()) clearTimeout(t)` + `timers.clear()` | line | TC-ANN-UNMOUNT-SAFE |
| region render（line） | `messages.map((m) => <p key={m.id}>{m.text}</p>)`（0 件 / 1 件以上の両状態） | line + branch | TC-ANN-01（0 件 = 空 region）/ TC-ANN-02・03（1 件以上） |

#### 7.2.3 `IdentityConflictRow.tsx`（変更ブロックのみ）

| 区分 | 場所 | 測定対象 | covered する Phase 4/6 ケース |
| --- | --- | --- | --- |
| mutation success action（branch） | merge `.then(() => announceOnce("merge"))` / dismiss `.then(() => announceOnce("dismiss"))` / reject の 3 系統 | branch | dismiss success（TC-ROW-06）/ merge success / reject rollback |
| announceOnce（branch） | `if (hasAnnouncedRef.current) return;` の **early-return 枝 / announce 実行枝** | branch | announce 実行 / duplicate guard |
| announce 呼び出し（line） | `hasAnnouncedRef.current = true; announce(announcementFor(action));` | line | merge / dismiss success |
| rollback reset（line + branch） | merge `.catch` / dismiss `.catch` 内 `hasAnnouncedRef.current = false` | line + branch（reject 経路） | TC-NO-ANN-ON-ROLLBACK / TC-ANN-AFTER-RETRY |
| 除去確定 render（branch） | `if (optimisticMerged \|\| optimisticDismissed) return null;` の true（除去）/ false（表示）両枝 | branch | dismiss/merge 確定（true）/ idle 全ケース（false） |

> branch coverage 観点では、mutation success action の merge/dismiss/reject・`hasAnnouncedRef` true/false・`fn ?? noop` の null/non-null・
> `optimisticMerged \|\| optimisticDismissed` の true/false・`trigger` resolve/reject が、いずれも 1 件以上のケースで
> 実行されることが必須。merge dialog / dismiss dialog / exiting 相は本タスクで分岐を増やさず既存 coverage を維持する。

### 7.3 測定コマンド（リポジトリルートから）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx
```

> coverage を変更 3 ファイルへ絞るため、必要に応じて
> `--coverage.include='src/components/admin/IdentityConflictAnnouncer.tsx'`
> `--coverage.include='src/components/admin/identityConflictAnnouncements.ts'`
> `--coverage.include='src/components/admin/IdentityConflictRow.tsx'`
> を併用する（provider 設定で include 指定方法が異なる場合は `vitest.config` の `coverage.include` を一時上書き）。

### 7.4 分岐別カバレッジ チェックリスト（変更ブロック）

coverage サマリ / HTML レポート（`coverage/index.html`）で以下を 1 件ずつ目視確認する。

- [ ] **文言導出**: `announcementFor` の `return ...` が covered。`merge` / `dismiss` 両キーが lookup される
- [ ] **announce append**: `setMessages([...prev, {id,text}])` + `setTimeout` 登録行が covered
- [ ] **TTL 除去**: `setTimeout` callback の `filter` + `delete(id)` が covered（fake timer 前進で到達）
- [ ] **provider fallback 両枝**: `fn ?? (() => {})` の null（provider 外）/ non-null（provider 内）両枝が covered
- [ ] **unmount cleanup**: `useEffect` return の `clearTimeout` ループ + `clear()` が covered（unmount ケース）
- [ ] **region 0件/N件 render**: `messages.map` が空（TC-ANN-01）と 1 件以上（TC-ANN-02/03）の両状態で covered
- [ ] **mutation success action 3 系統**: merge success / dismiss success / reject rollback が covered
- [ ] **announceOnce 両枝**: early-return（`hasAnnouncedRef.current`）/ announce 実行の両枝が covered
- [ ] **rollback reset**: merge `.catch` / dismiss `.catch` の `hasAnnouncedRef.current = false` が covered（reject mock 経由）
- [ ] **除去確定 render 両枝**: `optimisticMerged || optimisticDismissed` の true（return null）/ false（表示）両枝が covered

### 7.5 未 cover 時の戻し方

| 未 cover の分岐 | 切り分け | 対応 |
| --- | --- | --- |
| TTL 除去未到達 | fake timer の `vi.advanceTimersByTimeAsync(ANNOUNCE_TTL_MS)` 不足 | advance 量を TTL 以上へ調整（Phase 6 TC-ANN-04/TTL-EACH） |
| provider fallback null 枝未到達 | provider なし consumer のテストが無い | Phase 6 TC-ANN-FALLBACK-NOOP-SAFE を確認 / 追加 |
| unmount cleanup 未到達 | announce 直後の unmount ケースが無い | TC-ANN-UNMOUNT-SAFE を追加（timer 残存中に `cleanup()`） |
| rollback reset 未到達 | reject mock が `.catch` を発火していない | reject Promise を返す mock へ修正（TC-NO-ANN-ON-ROLLBACK） |
| announceOnce early-return 枝未到達 | `hasAnnouncedRef` true 状態 / idle 状態の検証が無い | TC-ANN-ONCE（重複防止）/ idle 既存ケースで両枝到達を確認 |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| SSOT 設計正本 | `../../index.md` | 主要シグネチャ / 設計方針 |
| 本WF Phase 4 テスト | `../phase-4/phase-4.md` | TC-ANN-* / TC-ROW-* 基本ケース |
| 本WF Phase 6 テスト | `../phase-6/phase-6.md` | TTL 境界 / rollback 非アナウンス / fallback / unmount safe |
| 構成 reference | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-7/phase-7.md` | 変更ファイル限定 coverage の書式 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 変更ブロックの挿入位置 |

## 成果物

- 変更 3 ファイル / 変更ブロックに限定した coverage 測定方針（§7.1〜§7.3）。
- 文言導出 / announce append / TTL 除去 / provider fallback / unmount cleanup / region render / mutation success action / announceOnce / rollback reset / 除去確定 render の分岐別チェックリスト（§7.4）。
- 未 cover 時の Phase 6 戻し手順（§7.5）。

## 統合テスト連携

- Phase 4/6 の focused Vitest（announce / TTL / fallback / rollback 非アナウンス / 複数 action 混在）が §7.4 の全分岐を踏むことを coverage で裏取りする。
- coverage が満たされたら Phase 8（リファクタリング）/ Phase 9（typecheck / lint / token gate）へ接続する。
- Playwright e2e は coverage 対象外（jsdom coverage と分離）。

## 完了条件（Phase 7）

| 項目 | 基準 |
| --- | --- |
| 対象範囲 | coverage を `IdentityConflictAnnouncer.tsx` / `identityConflictAnnouncements.ts` / `IdentityConflictRow.tsx`（変更ブロック）に限定したことを明記した |
| 追加分岐 line coverage | `announce` append / TTL 除去 / unmount cleanup / `announcementFor` / row の announce 呼び出し / rollback reset が全行 covered |
| 追加分岐 branch coverage | mutation success action 3 系統・`hasAnnouncedRef` true/false・provider fallback null/non-null・`optimisticMerged \|\| optimisticDismissed` true/false・`trigger` resolve/reject の各枝が covered |
| 実測を残す | announce / TTL 除去 / mutation success action 分岐の line/branch カバレッジ実測（coverage サマリ）を残す方針を確定した |
| 既存 coverage 退行なし | `IdentityConflictRow.tsx` の既存行（merge-confirm / merge-final / dismiss / cancel / exiting 系）の coverage が変更前より低下しないこと |
