# Phase 1: 要件定義

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008） |
| issue_state | **CLOSED**（closed 2026-06-04T22:10:15Z。本ワークフローは Issue 状態を変更しない → §1.0 参照） |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/`（#1042 dismiss optimistic）/ `completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/`（#988 merge optimistic） |
| 兄弟 followup | `#1043`（row fade animation・本タスクの構成 reference） |

## 目的

`/admin/identity-conflicts` の optimistic 消失（merge / dismiss 実行直後の row 非表示）における screen reader アナウンスを、(1) **focus stealing に依存しない**、(2) **複数 row 連続処理でも競合・欠落しない**、(3) **merge / dismiss 文言を単一導出ロジックで一貫させる**、形へ最適化するための要件を定義する。rollback error（`role="alert"`）の非回帰を前提条件として固定する。

## 実行タスク

1. 事前調査（実装済みか / Issue 陳腐化判定）を確定する（§1.1）。
2. 実装区分・タスク分類を判定する（§1.2 / §1.3）。
3. スコープ（含む / 含まない）を CONST_007 観点で固定する（§1.4）。
4. 既存コードの命名規則・carry-over・P50 を分析する（§1.5〜§1.7）。
5. 受け入れ条件 AC-1〜AC-8 を明示列挙する（§1.8）。
6. artifact 命名 canonical 一覧と変更 surface inventory を確定する（§1.9 / §1.10）。

## 1.0 Issue 状態に関する注記（重要）

- **GitHub 上 Issue #1094 は `CLOSED`**（closed 2026-06-04T22:10:15Z）。
- ユーザー指示に従い、**本ワークフローでは Issue 状態を一切変更しない**（reopen も close もしない）。`CLOSED` のままメタ情報へ反映する。
- 実装・commit・push・PR・Issue mutation はすべて user-gated。
- **automation-30 改善後の補正**: 本 Phase 作成時点ではタスク仕様書（Phase 1-13）の作成のみを前提に `spec_created` としていたが、今回の CONST_004 / CONST_005 準拠検証で local 実装・focused evidence まで同一サイクルで完了した。現 `workflow_state` は `implemented_local_evidence_captured`。

## 1.1 事前調査結論（実装済みか否か / Issue 陳腐化判定）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| optimistic 消失時の aria-live アナウンス最適化（focus steal 非依存・連続競合解消・文言単一導出） | **事前調査時は未対応 → automation-30 改善後に local 実装済み** | 事前調査では `IdentityConflictRow.tsx` に 3 課題が現存。今回の改善で row-local status / focus stealing / inline branch 文言を撤去し、page-level `IdentityConflictAnnouncer` + `announcementFor()` へ移行済み |
| 他タスクで解決済みか | **未解決** | `app/(admin)/admin/identity-conflicts/page.tsx` は Server Component で `<ul aria-label="Identity 重複候補一覧">`（line 76-82）を描画するのみで、集約 live region を持たない。`apps/web/src` に共通 LiveRegion / announcer utility は不在（`find` / `grep` 0 件）。直近の #1042（dismiss optimistic）/ #1043（row fade animation）は state 機構・退場アニメを整えたが、この a11y 課題（focus steal・row-local region・文言重複）は未対応のまま残存 |
| Issue 内容の陳腐化 | **陳腐化なし（参照先のみ更新要）** | issue body の `role="status"` + `aria-live="polite"` + focus handoff 記述は現コードと一致する。参照タスク仕様書（`unassigned-task/admin-identity-conflicts-followup-006-...md`）の苦戦箇所「発火源 = row・読み上げ先 = 親の単一 region」設計指針も現状に適用可能。本仕様書では #1042/#1043 反映後の最新コード構造（line 番号・state 構成）に最適化した |

→ **Issue #1094 は実行が必要**（別タスクで解決されていない）。本ワークフローで Phase 1-13 の実装仕様書を作成する（実装は後続サイクル・user-gated）。

> **line 番号に関する注記**: 上表の line 番号（35 / 74-84 / 136-148 / 248-257 / 296-305）は #1043 マージ後の現行 `IdentityConflictRow.tsx` に対応する。`optimisticStatus` 三項は line 74-79、focus `useEffect` は line 81-84、row-local status `<p>` ブロックは line 136-148、merge / dismiss の `role="alert"` inline error はそれぞれ line 248-257 / 296-305。後続実装者は実装前に最新行を再確認すること。

## 1.2 実装区分の判定根拠（CONST_004）

`[実装区分: 実装仕様書]`。本タスクは以下のコード変更を伴う:

- ページレベル単一 `aria-live` region コンポーネントの新規作成（`IdentityConflictAnnouncer.tsx`）
- アナウンス文言の単一導出 pure module 新規作成（`identityConflictAnnouncements.ts`）
- `IdentityConflictRow.tsx` の row-local status node / focus stealing 撤去 + announce context 呼び出しへの置換
- `page.tsx` の `<ul>` を client wrapper でラップ
- focused Vitest 追加

issue ラベルは `type:improvement` / `area:web` / `area:admin-ui`（docs-only ではない）。目的「focus stealing 非依存で確実に読み上げ / 連続処理で競合しない / 文言を単一導出」はコード変更なしでは達成不可能であり、CONST_004 の判定により **実装仕様書**として作成する。

## 1.3 タスク分類

- **NON_VISUAL**。変更は **sr-only live region とアナウンス挙動のみ**で、画面ピクセル（視覚レイアウト・色・余白）の変化がない。`role="status"` / `aria-live` ノードは `sr-only`（視覚的に非表示）であり、screen reader の読み上げ順序という非ビジュアル属性のみが変わる。Phase 11 は NON_VISUAL evidence（focused Vitest 結果 + 手動 SR 検証ノート）で構成し、screenshot は取得しない。
- **docs-only ではない**。コード変更（新規 2 component + 既存 3 ファイル編集 + test）が目的達成に必須であり、ドキュメントのみでは AC を満たせない。

## 1.4 スコープ

### 含むもの

- 新規 client component `IdentityConflictAnnouncer.tsx`: ページレベル単一 live region（`role="status"` + `aria-live="polite"` の sr-only ノードを **1 つだけ**永続描画）+ `announce` context provider + `useIdentityConflictAnnounce()` hook。append-children + TTL 自動除去。
- 新規 pure module `identityConflictAnnouncements.ts`: `IdentityConflictAction` 型 + `IDENTITY_CONFLICT_ANNOUNCEMENTS` map + `announcementFor()`（文言の単一導出）。
- `IdentityConflictRow.tsx` の編集: row-local status node（line 136-148）と focus `useEffect`（line 81-84）/ `optimisticStatusRef`（line 35）を撤去。optimistic hide で `return null` し、mutation resolve 後に context の `announceOnce(action)` を 1 回だけ呼ぶ。rollback 時に announce 済みフラグを reset。
- `page.tsx` の編集: `<ul aria-label="...">` を `<IdentityConflictAnnouncer>` でラップ（Server Component が client wrapper に children を渡す）。
- focused Vitest: live region 単一性 / 非 focus-steal / 連続処理非競合 / TTL 除去 / `announcementFor` 単一導出 / rollback 非アナウンス / context fallback no-op。
- 既存テスト（`IdentityConflictRow.spec.tsx` line 325-345 の focus-steal assertion）の更新。

### 含まないもの（スコープ外）

| 項目 | 理由 | 実施時期/場所 |
| --- | --- | --- |
| `useAdminMutation` hook への announce option 追加 | component-local state + context で要件を満たせる（後方互換リスク回避） | 不要（本サイクルで判断確定） |
| merge / dismiss endpoint / API contract 変更 | 不変条件 #1（既存 API のみ） | 対象外 |
| D1 schema 変更 | 不変条件 #1 / #5 | 対象外 |
| 新規 design token / 色 utility の追加 | sr-only のため視覚変更なし。OKLch token 体系を増やさない（不変条件 #2） | 対象外 |
| rollback error（`role="alert"`・line 248-257 / 296-305）の変更 | AC-5（非回帰）。既存 a11y 通知を一切いじらない | 対象外 |
| 親 #1042 / #988 の `completed-tasks/` 配下成果物の直接編集 | 完了済みワークフロー成果物を越境編集しない | 対象外 |
| dismiss / merge 以外の将来 action 文言の追加 | 現行 endpoint surface は merge / dismiss のみ。map は将来拡張可能な構造にするが値は追加しない | 対象外 |

> **CONST_007 確認**: 本タスクは新規 2 ファイル + 既存 3 ファイル編集（+ 任意 Playwright 1 ファイル）で、**すべて `apps/web` 内・単一 PR・1 実装サイクルで完了可能**。外部依存・合意未済の仕様分岐・大規模スコープはなく、先送り・分割は行わない。Phase 3 / Phase 10 で MINOR が出た場合のみ Phase 12 で未タスク化判断する。

## 1.5 既存コードの命名規則分析

| 観点 | 既存規則 | 本タスクでの適用 |
| --- | --- | --- |
| component 内 state | `useState` + camelCase（`stage`, `optimisticMerged`, `optimisticDismissed`, `isExiting`, `mergeReason`） | 新規追加は最小。announce は context 経由で発火、row 側 state 追加なし（`hasAnnouncedRef` のみ） |
| ref 命名 | `xxxRef`（`optimisticStatusRef`, `exitTimerRef`） | announce 済みフラグは `hasAnnouncedRef`（`useRef<boolean>`）。`xxxRef` 慣例踏襲。`optimisticStatusRef` は撤去 |
| mutation hook | `useAdminMutation`（`../../features/admin/hooks` から import） | 既存 import をそのまま使用。legacy `@/lib/useAdminMutation` は不使用（不変条件 #10） |
| context / hook naming | （現状 component-local のみ・既存 admin に LiveRegion context なし） | 新規 hook は `useIdentityConflictAnnounce()`（`useXxx` 慣例）。provider は `IdentityConflictAnnouncer`（既存 `IdentityConflictRow` と同 prefix で関心ドメインを一致） |
| pure module 命名 | （`apps/web/src/components/admin/` 配下は PascalCase component が中心） | 文言 map は `identityConflictAnnouncements.ts`（lowerCamel ファイル名 = pure module・非 component）。export 定数は `SCREAMING_SNAKE_CASE`（`IDENTITY_CONFLICT_ANNOUNCEMENTS`）、関数は `announcementFor`（lowerCamel） |
| トークン | `var(--ubm-color-*)`（OKLch 正本、HEX 直書きなし）+ Tailwind utility | live region は `sr-only` のみ。色 token / HEX は追加しない |

## 1.6 carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline -5`:

```
b216d9381 docs(shell): shell-collapse-cookie 命名 SSOT を code-primary へ整合 (issue-1065) (#1120)
2a56eb5d9 fix(admin): 開催日追加の404を修正し出席管理UI/UXを改善 (#1115)
8a0db76f0 fix(web): shell collapse cookie に HTTPS 時のみ Secure 属性を付与 (issue-1063) (#1114)
2d76f7c4a fix(admin): 会員詳細・ステータスの404を耐性化（status行欠落会員の救済+backfill） (#1109)
6611a92a7 fix(public): 会員検索の日本語IME変換崩れと×重複を useImeSafeInput で解消 (#1107)
```

- 直近に identity-conflicts の aria-live アナウンスを扱うコミットなし。
- 本タスクは #1042（dismiss optimistic）/ #1043（row fade animation）で整った `IdentityConflictRow.tsx` の上に、row-local status node 撤去 + ページレベル単一 region 追加の差分を載せる。重複なし。

## 1.7 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の新規実装（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | No | 未マージ。新規実装として扱う |
| 前提タスク（依存タスク）完了済み | Yes（#1042 dismiss optimistic / #988 merge optimistic が完了済。`optimisticMerged` / `optimisticDismissed` state は現行コードに存在） | 依存解消タスク不要 |

→ `implementation_mode: "new"`。Phase 4 は RED テスト設計、Phase 5 は新規実装。

## 1.8 受け入れ条件（AC）

### 機能要件

- **AC-1**: optimistic 消失時に **ページレベル単一 `aria-live="polite"` region 経由**でアナウンスが読み上げられる（row-local status node 非使用）。
- **AC-2**: **focus stealing に依存しない**（操作直後にカーソルが sr-only node へ移動しない。`document.activeElement` が status node にならない）。
- **AC-3**: 複数 row を連続 dismiss / merge してもアナウンスが競合・欠落しない（append-children により各メッセージが順番に DOM へ追加され読み上げられる）。
- **AC-4**: merge / dismiss のアナウンス文言が **単一の導出ロジック（`announcementFor`）** から生成される。

### 品質要件

- **AC-5**: 既存の rollback error（`role="alert"`）通知が非回帰で維持される（merge / dismiss 失敗時に inline error 表示・row 復元）。
- **AC-6**: focused Vitest に live region 単一性 / 非 focus-steal / 連続処理非競合 / TTL 除去 / rollback 非アナウンス / `announcementFor` 単一導出 / context fallback no-op assertion を追加し PASS。
- **AC-7**: `pnpm typecheck` / `pnpm --filter web lint` green。
- **AC-8**: legacy `@/lib/useAdminMutation` 未参照（grep 0 件）。HEX 直書き / inline `style` 追加なし（`verify-design-tokens` gate green）。

## 1.9 artifact 命名 canonical 一覧（後回し禁止）

> 本タスクは **NON_VISUAL** のため screenshot は無し。代わりに Phase 11 manual-test-result.md（focused Vitest 結果 + 手動 SR 検証ノート）と Phase 12 strict-7 を canonical とする。

| artifact | canonical path |
| --- | --- |
| Phase 11 手動テスト結果（NON_VISUAL evidence） | `outputs/phase-11/manual-test-result.md` |
| Phase 11 NON_VISUAL 検証メタ | `outputs/phase-11/non-visual-evidence.json` |
| Phase 12 strict-7 main 文書 | `outputs/phase-12/implementation-guide.md` |
| Phase 12 strict-7 mirror | `outputs/phase-12/main.md`（implementation-guide.md と byte parity） |

## 1.10 inventory（変更対象 surface）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | **新規** | ページレベル単一 live region + `announce` context provider（client）/ append-children + TTL 自動除去 / `useIdentityConflictAnnounce()` hook |
| `apps/web/src/components/admin/identityConflictAnnouncements.ts` | **新規** | `IdentityConflictAction` 型 + `IDENTITY_CONFLICT_ANNOUNCEMENTS` map + `announcementFor()`（文言の単一導出・pure module） |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 | row-local status node（136-148）と focus `useEffect`（81-84）/ `optimisticStatusRef`（35）撤去。announce context 呼び出し + `return null` 化。`role="alert"`（248-257 / 296-305）は不変 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編集 | `<ul aria-label="...">`（76-82）を `<IdentityConflictAnnouncer>` でラップ（Server Component が client wrapper に children を渡す） |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 | focus-steal assertion（325-345）を非 focus-steal + 単一 region assertion へ更新。連続処理 / rollback 非アナウンス ケース追加。`renderWithAnnouncer` helper 導入 |
| `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | **新規** | live region 単一性 / append-children 連続非競合 / TTL 除去 / `announcementFor` 単一導出 / context fallback no-op の focused Vitest |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集（任意・軽微） | 単一 `aria-live` region の存在と row-local status node 非存在の非回帰確認（NON_VISUAL のため screenshot は撮らない） |

### 変更しないファイル（参照のみ）

| パス | 理由 |
| --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | component-local + context で要件充足（hook 変更不要） |
| `apps/web/src/styles/tokens.css` / `globals.css` | sr-only のため色 token / 視覚変更なし |
| `apps/api/**` | 不変条件 #1（API contract / D1 schema 不変） |

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| UI/UX 設計 | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | admin UI primitive / accessibility / live region 方針 |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch token 正本（HEX 直書き禁止根拠） |
| SSOT 設計正本 | `../../index.md` | 設計方針・AC・inventory・主要シグネチャの正本 |

### プロジェクト不変条件

- 不変条件 #1（既存 API のみ）/ #2（OKLch token 正本・HEX 直書き禁止）/ #5（D1 直接アクセス禁止）/ #9（admin primitive 範囲内・新規 primitive を生やさない）/ #10（admin mutation は `@/features/admin/hooks` 経由）

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-1/phase-1.md` | 要件定義書（実装区分・タスク分類・スコープ・命名規則・P50・AC-1〜AC-8・artifact canonical・inventory） |

## 統合テスト連携

- 本 Phase は要件定義であり直接のテスト実行はない。AC-6（Phase 4/6 の focused Vitest）・AC-7（typecheck / lint gate）・AC-8（grep / `verify-design-tokens` gate）が統合テスト連携先。
- artifact canonical（§1.9）と inventory（§1.10）が Phase 4/5/11 のテスト・実装対象と 1:1 で対応する。

## 完了条件（Phase 1）

- 本 Phase の AC-1〜AC-8 を明示列挙した。
- 実装区分・タスク分類（NON_VISUAL）・スコープ・命名規則・P50・artifact canonical・inventory を確定した。
- Issue 状態 CLOSED と「本ワークフローでは状態変更しない・実装は本サイクルで行わない」方針を記録した。
- index.md の SSOT（ファイルパス・シグネチャ・AC 番号・NON_VISUAL 区分）と矛盾しないことを確認した。
