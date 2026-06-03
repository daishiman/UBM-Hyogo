# Phase 1: 要件定義

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| issue_state | **OPEN**（ユーザー認識「クローズド」と GitHub 実状態が乖離 → §1.0 参照。本ワークフローは Issue 状態を変更しない） |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` |
| 兄弟 followup | `#1042`（dismiss optimistic update・別タスク・本タスク対象外） |

## 目的

`/admin/identity-conflicts` の merge optimistic hide（現状 `IdentityConflictRow.tsx:92` の即時 `return null`）を、短い fade / collapse による退場（exiting 相）→ DOM 除去（removed 相）へ置き換えるための要件を定義する。`prefers-reduced-motion: reduce` 抑制・server error 時の rollback・dismiss 不変を前提条件として固定する。

## 実行タスク

1. 事前調査（実装済みか / Issue 陳腐化判定）を確定する（§1.1）。
2. 実装区分・タスク分類を判定する（§1.2 / §1.3）。
3. スコープ（含む / 含まない）を CONST_007 観点で固定する（§1.4）。
4. 既存コードの命名規則・carry-over・P50 を分析する（§1.5〜§1.7）。
5. 受け入れ条件 AC-1〜AC-11 を明示列挙する（§1.8）。
6. artifact 命名 canonical 一覧と変更 surface inventory を確定する（§1.9 / §1.10）。

## 1.0 Issue 状態に関する注記（重要）

- **GitHub 上の Issue #1043 は Phase 1 調査時点（2026-06-02）で `OPEN` と記録していたが、close-out の read-only 再確認では `CLOSED`**。本ワークフローでは Issue mutation を実行しない。
- ユーザー指示「クローズドのままタスク仕様書を作成」に従い、**本ワークフローでは Issue 状態を一切変更しない**（reopen も close もしない）。現在値 `OPEN` をメタ情報へそのまま反映する。
- 実装・commit・push・PR・Issue mutation はすべて user-gated。

## 1.1 事前調査結論（実装済みか否か / Issue 陳腐化判定）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| optimistic row 消失の fade / collapse animation | **未実装** | `IdentityConflictRow.tsx:92` は `if (optimisticMerged) return null;` のまま即時 DOM 除去。fade / exiting / transition / animation 関連コードは 0 件 |
| 他タスクで解決済みか | **未解決** | 親 #988 は意図的に animation を scope 外として分離（`unassigned-task-detection.md` 候補2「本サイクルで formalize しない」）。兄弟 #1042（dismiss optimistic）は独立タスクで fade を巻き込まない |
| reduced-motion 基盤の有無 | **基盤あり（部分流用可）** | `apps/web/src/styles/globals.css:1998-2007` にグローバル `@media (prefers-reduced-motion: reduce)` が存在し、全要素の `transition-duration` を `0.001ms !important` に強制している。row 専用 fade utility は未定義 |
| row fade 専用の共通 utility / token | **不在** | `tokens.css` は色 token のみ。Tailwind config に keyframes / animation 定義なし。fade は Tailwind の汎用 transition utility で実装する |
| Issue 内容の陳腐化 | **陳腐化なし（参照先のみ更新要）** | issue body の `IdentityConflictRow.tsx` の `return null` 記述は現コードと完全一致。ただし参照先 `issue-988-...` は `completed-tasks/` 配下へ移動済み、苦戦箇所の worktree 絶対パス（`task-20260529-211028-wt-18`）は古い。本仕様書では最新パスへ是正する |

→ **Issue #1043 は実行が必要**。本ワークフローで Phase 1-13 の実装仕様書を作成する（実装は本サイクルで完了）。

## 1.2 実装区分の判定根拠（CONST_004）

`[実装区分: 実装仕様書]`。本タスクは `IdentityConflictRow.tsx` への state 機構追加（exiting 相）+ CSS transition utility 適用 + focused Vitest + Playwright を伴う。
issue ラベルは `type:improvement`（docs-only ではない）。目的「optimistic hide 時に短い fade / collapse で消える」はコード変更なしでは達成不可能であり、CONST_004 の判定により実装仕様書として作成する。

## 1.3 タスク分類（Feedback 1 / Feedback 3 対応）

- **UI task（VISUAL）**: merge 操作直後に row が fade out して消える視覚変化を伴う。Phase 11 は VISUAL（screenshot 取得）。`screenshot-plan.json` は `mode: "VISUAL"` をデフォルトとする。
- docs-only ではない。コード変更（component state 追加 + CSS transition + test）が目的達成に必須。

## 1.4 スコープ

### 含むもの

- `IdentityConflictRow.tsx` に **exiting 相**（DOM を残したまま fade / collapse する中間 state）を追加し、merge 成功時の row 消失を「即時 `return null`」から「fade out → DOM 除去」へ置き換える
- `prefers-reduced-motion: reduce` 環境では animation を抑制（即時 hide 相当）する。グローバル CSS の transition-duration 0 化を主機構とし、JS 側 fallback（timeout）で removed 遷移を保証する
- rollback（server error）時に exiting timer をキャンセルし row を復元、inline error（`role="alert"`）を表示する
- focused Vitest に exiting / reduced-motion / rollback-cancels-exiting ケースを追加
- Playwright e2e で animation 完了後の安定 DOM 状態を待ってから screenshot を取得（flaky 防止）
- Phase 11 capture metadata を `#1043` 自身の `outputs/phase-11/` に作成し、screenshot canonical 名と「fade 後の安定状態」という撮影意図を記録する（親 #988 の `identity-conflict-row-optimistic-removed.png` の意味 drift を注記で防止）

### 含まないもの（スコープ外）

| 項目 | 理由 | 実施時期/場所 |
| --- | --- | --- |
| dismiss 側の optimistic 化 / fade | Issue #1043 スコープ外（dismiss は別タスク #1042） | 別 followup `#1042`（本サイクルでは不要と判断） |
| `useAdminMutation` hook への optimistic / animation option 追加 | component-local state で要件を満たせる（後方互換リスク回避） | 不要（本サイクルで判断確定） |
| merge endpoint / API contract 変更 | 不変条件 #1（既存 API のみ） | 対象外 |
| D1 schema 変更 | 不変条件 #1 | 対象外 |
| 新規 design token / keyframes の追加 | Tailwind 汎用 transition utility で実装可能。OKLch token 体系を増やさない（不変条件 #2） | 対象外 |
| 親 #988 の `completed-tasks/` 配下成果物（screenshot / metadata）の直接編集 | 完了済みワークフローの成果物を越境編集しない。意味 drift は #1043 側 metadata の注記で解決 | 本タスクの Phase 11/12 で注記 |

> **CONST_007 確認**: 本タスクは単一コンポーネントの state 機構追加 + CSS transition + test であり、**1 サイクル内で完了可能**。外部依存・合意未済の仕様分岐はなく、先送り・分割は行わない。

## 1.5 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 観点 | 既存規則 | 本タスクでの適用 |
| --- | --- | --- |
| component 内 state | `useState` + camelCase（`stage`, `optimisticMerged`, `mergeReason`） | 新規 state は `isExiting: boolean`（camelCase 踏襲）。既存 `optimisticMerged` は「removed 相（DOM 除去確定）」として維持 |
| stage union | `"idle" \| "merge-confirm" \| "merge-final" \| "dismiss"`（kebab-case 値） | exiting は stage union に混ぜず **独立 boolean**（責務分離: stage = dialog 表示制御、optimisticMerged = 最終除去、isExiting = 退場アニメ中の可視 fade） |
| mutation hook | `useAdminMutation`（`../../features/admin/hooks` import） | 既存 import をそのまま使用。legacy `@/lib/useAdminMutation` は不使用（不変条件 #10） |
| timer ref | （現状なし） | `useRef<ReturnType<typeof setTimeout> \| null>` を `exitTimerRef` として追加。命名は `xxxRef` 慣例踏襲 |
| トークン | `var(--ubm-color-*)`（OKLch 正本、HEX 直書きなし）+ Tailwind utility | fade は Tailwind の `transition`, `duration-*`, `opacity-0`, `scale-*` 等の汎用 utility で実装。色 token / HEX は追加しない |

## 1.6 carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline -5`:

```
6cc9a4b62 feat(shell): sidebar collapse 状態を cookie で永続化し SSR seed でちらつき解消 (issue-1024) (#1067)
f2ecb73ea refactor(issue-229): pnpm indexes:rebuild を fail-fast / atomic write / decisive log へ堅牢化 + 回帰spec (#1066)
7f91b1494 docs(issue-235): sync_audit_logs / sync_audit_outbox 必要性判定を新設不要で確定 (#1062)
ba8bbff0c feat(issue-230): lefthook 正本逸脱検知ガード (pre-commit edit-guard + CI hook-integrity gate) (#1061)
52af4e488 feat(api): 公開 members list の tags 一括取得（expand=tags / N+1 防止） (#1060)
```

- 直近に identity-conflicts row fade animation を扱うコミットなし。
- 本タスクは親 #988 で整った `IdentityConflictRow.tsx`（merge optimistic update 済）の上に exiting fade を追加する差分。重複なし。

## 1.7 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の新規実装（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | No | 未マージ。新規実装として扱う |
| 前提タスク（依存タスク）完了済み | Yes（#988 で merge optimistic 済） | 依存解消タスク不要 |

→ `implementation_mode: "new"`。Phase 4 は RED テスト設計、Phase 5 は新規実装。

## 1.8 受け入れ条件（AC）

### 機能要件

- **AC-1**: merge 二段階 confirm 完了（「merge 実行」click）直後、該当 row が fade out / collapse を開始する（exiting 相に入る。optimistic hide の視覚表現）
- **AC-2**: fade 完了後、該当 row が DOM から除去される（removed 相 = 既存 `optimisticMerged === true` の `return null`）
- **AC-3**: server がエラー（403/4xx/5xx/network）を返したとき、exiting 相を解除（fade をキャンセル）して row を復元し、inline error（`role="alert"`）が表示される（rollback）。exit timer は確実に clear される
- **AC-4**: server 成功時、row は exiting → removed と消えたまま（再表示されない）。既存 `router.refresh()` が server list を後追い整合する
- **AC-5**: `prefers-reduced-motion: reduce` 環境では animation が抑制され（transition-duration ≈ 0）、視覚上ほぼ即時に row が消える。removed 遷移は timeout fallback で保証される
- **AC-6**: dismiss 側の挙動は不変（exiting / fade を適用しない）

### 品質要件

- **AC-7**: focused Vitest（exiting 開始 / removed 遷移 / rollback で exiting キャンセル / reduced-motion 即時 / success-stays-removed）全 green
- **AC-8**: Playwright e2e（fade 後の安定状態で row 消失 / rollback で復元）全 green。animation 中ではなく stable locator state を待つ
- **AC-9**: `pnpm typecheck` / `pnpm --filter web lint` green
- **AC-10**: legacy `@/lib/useAdminMutation` 未参照（`grep` で 0 件）。HEX 直書き / inline `style={{}}` 追加なし（`verify-design-tokens` gate green）

### 視覚要件（VISUAL）

- **AC-11**: Phase 11 で `merge-final`→`exiting-fade`→`removed-stable`→`rollback-restored` の状態遷移 screenshot を取得する（screenshot は staging auth 必須のため user-gated。取得不能時は two-tier evidence: local jsdom render + 自動テストで代替記録）

## 1.9 artifact 命名 canonical 一覧（後回し禁止 / Feedback 1）

| artifact | canonical path |
| --- | --- |
| Phase 11 screenshot (1) | `outputs/phase-11/screenshots/identity-conflict-row-exiting-fade.png` |
| Phase 11 screenshot (2) | `outputs/phase-11/screenshots/identity-conflict-row-removed-stable.png` |
| Phase 11 screenshot (3) | `outputs/phase-11/screenshots/identity-conflict-row-rollback-restored.png` |
| Phase 11 metadata | `outputs/phase-11/phase11-capture-metadata.json` |
| Phase 11 capture plan | `outputs/phase-11/screenshot-plan.json` |

## 1.10 inventory（変更対象 surface）

| surface | 役割 | 変更種別 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | merge UI 本体 + exiting fade state | 編集 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | focused Vitest | 編集 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | e2e（animation 完了待ち） | 編集 |
| `apps/web/src/styles/globals.css` | グローバル reduced-motion 基盤 | **変更なし**（既存基盤を流用） |
| `apps/web/src/styles/tokens.css` | 色 token 正本 | **変更なし** |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | Server Component list | **変更なし**（参照のみ） |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | mutation hook | **変更なし**（参照のみ） |

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| UI/UX 設計 | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | admin UI primitive / accessibility / motion 方針 |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch token 正本（HEX 直書き禁止根拠） |

### プロジェクト不変条件

- 不変条件 #1（既存 API のみ）/ #2（OKLch token 正本・HEX 直書き禁止）/ #5（D1 直接アクセス禁止）/ #9（admin form は FormField/primitive 経由）/ #10（admin mutation は `@/features/admin/hooks` 経由）

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-1/phase-1.md` | 要件定義書（実装区分・タスク分類・スコープ・命名規則・P50・AC-1〜AC-11・artifact canonical・inventory） |

## 統合テスト連携

- 本 Phase は要件定義であり直接のテスト実行はない。AC-7（Phase 4/6 の focused Vitest）・AC-8（Phase 11 の Playwright e2e）・AC-11（Phase 11 screenshot）が統合テスト連携先。
- artifact canonical（§1.9）と inventory（§1.10）が Phase 4/5/11 のテスト・実装対象と 1:1 で対応する。

## 完了条件（Phase 1）

- 本 Phase の AC-1〜AC-11 を明示列挙した。
- 実装区分・タスク分類・スコープ・命名規則・P50・artifact canonical・inventory を確定した。
- Issue 状態 OPEN とユーザー認識の乖離を記録した。
