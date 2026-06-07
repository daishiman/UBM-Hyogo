---
workflow_id: issue-1094-identity-conflicts-optimistic-aria-live-announcement
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-05
owner: daishiman
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-1094-identity-conflicts-optimistic-aria-live-announcement-spec
issue: 1094
issue_state: CLOSED
---

# Issue #1094 — optimistic 消失時の aria-live アナウンス最適化 (FU-AIDC-008)

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（ページレベル単一 `aria-live` region コンポーネント新規作成 + `IdentityConflictRow.tsx` の row-local status node / focus stealing 撤去 + アナウンス文言の単一導出 map + focused Vitest 追加）を伴う。
issue ラベルは `type:improvement` / `area:web` / `area:admin-ui`（docs-only ではない）。目的「focus stealing 非依存で確実に読み上げ / 連続処理で競合しない / 文言を単一導出」はコード変更なしでは達成不可能であり、CONST_004 の判定により**実装仕様書**として作成した。

> **本ワークフローのスコープ更新（automation-30 改善後）**: 当初はタスク仕様書作成のみの `spec_created` として作成されたが、今回の CONST_004 / CONST_005 準拠検証により、コード変更なしで閉じることは不整合と判定した。`apps/web` の実コード・focused tests・Phase 11/12 証跡・aiworkflow 正本同期まで同一サイクルで反映済み。`workflow_state` は `implemented_local_evidence_captured`。

## Issue 状態に関する注記

- GitHub 上 **Issue #1094 は `CLOSED`**（closed 2026-06-04T22:10:15Z）。
- ユーザー指示に従い、本ワークフローでは **Issue 状態を変更しない**（reopen も close もしない）。`CLOSED` のままメタ情報へ反映する。
- 実装・commit・push・PR・Issue mutation はすべて user-gated。

## 事前調査結論（実装済みか否か / Issue 陳腐化判定）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| optimistic 消失時の aria-live アナウンス最適化（focus steal 非依存・連続競合解消・文言単一導出） | **事前調査時は未対応 → automation-30 改善後に local 実装済み** | 事前調査では `IdentityConflictRow.tsx` に row-local `role="status"` / `optimisticStatusRef.current?.focus()` / インライン三項文言が現存。今回の改善で `IdentityConflictAnnouncer` + `announcementFor()` + context announce へ置換済み |
| 他タスクで解決済みか | **未解決** | `page.tsx` は Server Component で集約 live region を持たない。`apps/web/src` に共通 LiveRegion / announcer utility は不在（`find` 0 件）。直近コミット #1042（dismiss optimistic）/ #1043（fade animation）でもこの a11y 課題は未対応 |
| Issue 内容の陳腐化 | **陳腐化なし（参照先のみ更新要）** | issue body の `role="status"` + `aria-live="polite"` + focus handoff 記述は現コードと完全一致。参照タスク仕様書（`unassigned-task/admin-identity-conflicts-followup-006-...md`）の苦戦箇所「発火源 = row・読み上げ先 = 親の単一 region」設計指針も現状に適用可能。本仕様書で最新コード（line 番号・#1042/#1043 反映後の構造）に最適化した |

→ **Issue #1094 は実行が必要**（別タスクで解決されていない）。本ワークフローで Phase 1-13 の実装仕様書を作成したうえで、今回の改善サイクルで local 実装と focused evidence 取得まで完了した。commit / push / PR / Issue mutation / staging 手動 SR 検証のみ user-gated。

## 目的

`/admin/identity-conflicts` の optimistic 消失（merge / dismiss 実行直後の row 非表示）における screen reader アナウンスを、(1) focus stealing に依存しない、(2) 複数 row 連続処理でも競合・欠落しない、(3) merge / dismiss 文言を単一導出ロジックで一貫させる、形へ最適化する。rollback error（`role="alert"`）の非回帰を維持する。

## 設計方針（SSOT・全 Phase 共通の正本）

> 本セクションは全 Phase 仕様書が参照する canonical 設計事実。各 Phase 仕様書は本表と矛盾してはならない。

| 項目 | 決定 |
| --- | --- |
| アーキテクチャ | **ページレベル単一 live region + announce context**。「発火源 = row / 読み上げ先 = 親の単一 region」へ責務分離（参照タスク仕様書 苦戦箇所の知見を踏襲） |
| 単一 region の所在 | 新規クライアント component `IdentityConflictAnnouncer`（`page.tsx` の Server Component が `<ul>` を本 component でラップ）。`role="status"` + `aria-live="polite"` の sr-only node を**1つだけ**永続描画 |
| 連続処理の競合回避 | **append-children パターン**: `announce()` ごとに新しい child node（`{id, text}`）を live region 内へ追加。各メッセージが個別 DOM mutation となり SR が順番に読み上げる。同一 tick 上書き / 文言 collapse を回避。child は `ANNOUNCE_TTL_MS`（1000ms）後に自動除去し DOM 肥大を防ぐ |
| focus stealing | **撤去**。`optimisticStatusRef.current?.focus()` を削除。操作直後にカーソルを別ノードへ飛ばさない（AC-1 / AC-2） |
| 文言の単一導出 | 新規 pure module `identityConflictAnnouncements.ts` の `IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string>` map + `announcementFor(action)`。merge / dismiss / 将来 action を単一 map から導出（現行の三項分岐を関数化） |
| row 側の責務 | row-local `role="status"` 置換ブロック（136-148）と focus `useEffect`（81-84）を撤去。row は optimistic に非表示化するが、成功文言は mutation resolve 後に `announceOnce(action)` で 1 回だけ発火する。rollback 時は成功文言を出さず、announce 済みフラグを reset し再試行成功時に再アナウンス可能にする |
| rollback error | `role="alert"`（merge/dismiss inline error・248-257 / 296-305）は**一切変更しない**（AC-5・非回帰） |
| 不変条件 | 既存 API のみ（#1）/ D1 直接アクセス禁止（#5）/ admin mutation は `@/features/admin/hooks` 経由（#10）/ OKLch token・HEX 直書き禁止（#2・sr-only のため新規 token 不要）/ admin primitive 範囲内（#9・新規 primitive を生やさない） |
| 視覚区分 | **NON_VISUAL**。変更は sr-only live region とアナウンス挙動のみで画面ピクセル変化なし。Phase 11 は NON_VISUAL evidence（focused Vitest + 手動 SR 検証ノート） |

## 受け入れ条件（AC）

- **AC-1**: optimistic 消失時に **ページレベル単一 `aria-live="polite"` region 経由**でアナウンスが読み上げられる（row-local status node 非使用）。
- **AC-2**: **focus stealing に依存しない**（操作直後にカーソルが sr-only node へ移動しない。`document.activeElement` が status node にならない）。
- **AC-3**: 複数 row を連続 dismiss / merge してもアナウンスが競合・欠落しない（append-children により各メッセージが順番に DOM へ追加され読み上げられる）。
- **AC-4**: merge / dismiss のアナウンス文言が **単一の導出ロジック（`announcementFor`）** から生成される。
- **AC-5**: 既存の rollback error（`role="alert"`）通知が非回帰で維持される（merge/dismiss 失敗時に inline error 表示・row 復元）。
- **AC-6**: focused Vitest に live region / 非 focus-steal / 連続処理非競合 / rollback 非アナウンス assertion を追加し PASS。
- **AC-7**: `pnpm typecheck` / `pnpm --filter web lint` green。
- **AC-8**: legacy `@/lib/useAdminMutation` 未参照（grep 0 件）。HEX 直書き / inline `style` 追加なし（`verify-design-tokens` gate green）。

## 実装対象ファイル（inventory）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | **新規** | ページレベル単一 live region + `announce` context provider（client）/ append-children + TTL 自動除去 / `useIdentityConflictAnnounce()` hook |
| `apps/web/src/components/admin/identityConflictAnnouncements.ts` | **新規** | `IdentityConflictAction` 型 + `IDENTITY_CONFLICT_ANNOUNCEMENTS` map + `announcementFor()`（文言の単一導出・pure module） |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 | row-local status node（136-148）と focus `useEffect`（81-84）/ `optimisticStatusRef`（35）撤去。mutation resolve 後の `announceOnce(action)` + optimistic `return null` 化。`role="alert"` は不変 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編集 | `<ul aria-label="...">` を `<IdentityConflictAnnouncer>` でラップ（Server Component が client wrapper に children を渡す） |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 | focus-steal assertion（342-344）を非 focus-steal + 単一 region assertion へ更新。連続処理 / rollback 非アナウンス ケース追加。`renderWithAnnouncer` helper 導入 |
| `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | **新規** | live region 単一性 / append-children 連続非競合 / TTL 除去 / `announcementFor` 単一導出 / context fallback no-op の focused Vitest |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集（任意・軽微） | 単一 `aria-live` region の存在と row-local status node 非存在の非回帰確認（NON_VISUAL のため screenshot は撮らない） |

### 変更しないファイル（参照のみ）

| パス | 理由 |
| --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | component-local + context で要件充足（hook 変更不要） |
| `apps/web/src/styles/tokens.css` / `globals.css` | sr-only のため色 token / 視覚変更なし |
| `apps/api/**` | 不変条件 #1（API contract / D1 schema 不変） |

## 主要シグネチャ（SSOT）

```ts
// identityConflictAnnouncements.ts
export type IdentityConflictAction = "merge" | "dismiss";
export const IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string> = {
  merge: "merge を実行しました。候補を一覧から非表示にしました。",
  dismiss: "別人として確定しました。候補を一覧から非表示にしました。",
};
export function announcementFor(action: IdentityConflictAction): string {
  return IDENTITY_CONFLICT_ANNOUNCEMENTS[action];
}
```

```tsx
// IdentityConflictAnnouncer.tsx ("use client")
type AnnounceFn = (message: string) => void;
// context = AnnounceFn | null（provider 外では no-op fallback）
export function useIdentityConflictAnnounce(): AnnounceFn;
export function IdentityConflictAnnouncer(props: { children: React.ReactNode }): JSX.Element;
// 内部: messages: { id: number; text: string }[] を useState 管理、
//       announce() で push、ANNOUNCE_TTL_MS(=1000) 後に当該 id を除去、
//       unmount 時に全 timer clear、
//       <div role="status" aria-live="polite" className="sr-only">{messages.map(...)}</div> を children の後に描画
```

```ts
// IdentityConflictRow.tsx（差分の要点）
const announce = useIdentityConflictAnnounce();
const hasAnnouncedRef = useRef(false);
const announceOnce = useCallback((action: IdentityConflictAction) => {
  if (hasAnnouncedRef.current) return;
  hasAnnouncedRef.current = true;
  announce(announcementFor(action));
}, [announce]);
// onMerge/onDismiss:
// trigger(...).then(() => announceOnce("merge" | "dismiss")).catch(rollback)
// 除去確定: if (optimisticMerged || optimisticDismissed) return null;（status <p> ブロックを置換）
// rollback catch: 成功文言を出さず、hasAnnouncedRef.current = false; を併記（再アナウンス可能化）
```

## スコープ（CONST_007 確認）

本タスクは新規 2 ファイル + 既存 3 ファイル編集（+ 任意 Playwright 1 ファイル）で、**すべて `apps/web` 内・単一 PR・1 実装サイクルで完了可能**。外部依存・合意未済の仕様分岐・大規模スコープはなく、先送り・分割は行わない。Phase 3 / Phase 10 で MINOR が出た場合のみ Phase 12 で未タスク化判断する。

## Phase 構成

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | spec authored |
| 2 | 設計 | spec authored |
| 3 | 設計レビュー | spec authored |
| 4 | テスト作成（RED 設計） | spec authored |
| 5 | 実装 | implemented_local_evidence_captured |
| 6 | テスト拡充 | spec authored |
| 7 | カバレッジ確認 | spec authored |
| 8 | リファクタリング | spec authored |
| 9 | 品質保証 | spec authored |
| 10 | 最終レビュー | spec authored |
| 11 | 手動テスト（NON_VISUAL） | spec authored |
| 12 | ドキュメント更新 | spec authored |
| 13 | PR作成 | pending_user_approval（commit / push / PR / Issue mutation のみ） |

## Local Evidence（automation-30 改善後）

| ゲート | 結果 |
| --- | --- |
| focused Vitest | `pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` → 2 files / 26 tests PASS |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` → PASS |
| lint | `pnpm --filter @ubm-hyogo/web lint` → PASS |
| design token gate | `pnpm verify:tokens` → PASS（91 tracked） |
| 撤去 grep | `optimisticStatusRef` / `.focus()` / `@/lib/useAdminMutation` / HEX / inline style 追加なし（対象ファイル grep 0 件） |

## 関連リソース

- 参照タスク仕様書（消費元）: `docs/30-workflows/completed-tasks/admin-identity-conflicts-followup-006-optimistic-aria-live-announcement.md`
- 親 workflow: `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/`（#1042 dismiss optimistic）/ `completed-tasks/issue-988-...`（#988 merge optimistic）
- 兄弟 followup: `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/`（#1043 row fade animation・本タスクの構成 reference）
- 対象 component: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 起点 Issue: https://github.com/daishiman/UBM-Hyogo/issues/1094
