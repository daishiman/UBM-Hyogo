# Phase 1: 要件定義

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| key | value |
| --- | --- |
| workflow_id | `issue-1042-identity-conflicts-dismiss-optimistic-update` |
| issue | `#1042`（FU-AIDC-006 / 調査時点 `CLOSED`） |
| 親 workflow | `issue-988-identity-conflicts-merge-optimistic-update`（merge 側 / 実装済み） |
| 対象 component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |

## 1.1 タスク分類（Feedback 1 / Feedback 3 対応）

- **UI task**（VISUAL）: dismiss 操作直後に row が画面から消える視覚変化を伴う。Phase 11 は VISUAL（screenshot 取得・実装時 user-gated）。
- docs-only ではない。コード変更（dismiss 専用 component state 追加 + render guard 統合 + test）が目的達成に必須（CONST_004）。

## 1.2 目的

Issue #988 は merge 側だけを optimistic update 化し、dismiss（別人マーク）は「既存挙動不変」を受け入れ基準とした。本タスクはその意図的に残した非対称を解消し、dismiss 実行直後に該当 row を一覧から非表示にし、server error 時のみ rollback で再表示する。

## 1.3 スコープ

### 含むもの

- `IdentityConflictRow.tsx` に **dismiss 専用** optimistic 非表示 state（`optimisticDismissed: boolean`）を追加
- `onDismiss` を「trigger 直後に row を消す → error 時のみ復元（理由は保持）」へ差し替える
- render guard を `if (optimisticMerged || optimisticDismissed) return null;` に統合（**state 自体は分離**）
- focused vitest に dismiss optimistic hide / rollback（理由保持）/ success-stays-hidden ケースを追加。merge 既存ケースの非回帰確認
- Playwright e2e に「dismiss 後即座に row が消える」「server error で row 復元」シナリオを追加

### 含まないもの（スコープ外）

| 項目 | 理由 | 実施時期/場所 |
| --- | --- | --- |
| merge optimistic update の設計変更 | #988 で確立済み。本タスクは render guard 統合時の非回帰のみ | 対象外（本サイクルで判断確定） |
| dismiss 側と merge 側の state 共有 | rollback の責務が混線するため明示的に分離（issue 苦戦箇所の知見） | 対象外 |
| dismiss endpoint / API contract 変更 | 不変条件 #1（既存 API のみ） | 対象外 |
| D1 schema / shared schema 変更 | 不変条件 #1 | 対象外 |
| row fade animation 追加 | issue 本文が別 followup `admin-identity-conflicts-followup-005-row-fade-animation` に明示分離宣言 | 別 Issue（本サイクル不要） |
| `useAdminMutation` hook への optimistic option 追加 | component-local state で要件充足（後方互換リスク回避） | 不要（本サイクルで判断確定） |

> **CONST_007 確認**: 本タスクは単一コンポーネントの state 1 個追加 + ハンドラ差し替え + render guard 1 行統合 + test であり、本サイクルで完了済み。先送り・分割は行わない。fade animation は「issue が明示的に別 followup へ分離」しているため未タスク候補としてのみ Phase 12 で扱う。

## 1.4 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 観点 | 既存規則 | 本タスクでの適用 |
| --- | --- | --- |
| component 内 state | `useState` + camelCase（`stage`, `optimisticMerged`, `mergeReason`, `dismissReason`） | 新規 state は `optimisticDismissed: boolean`（camelCase 踏襲・merge 側 `optimisticMerged` と対称命名） |
| setter 命名 | `setOptimisticMerged`（camelCase） | `setOptimisticDismissed`（対称） |
| stage union | `"idle" \| "merge-confirm" \| "merge-final" \| "dismiss"`（kebab-case 値） | optimistic は stage union に混ぜず**独立 boolean**（責務分離: stage = dialog 表示制御、optimisticDismissed = row 可視性制御） |
| render guard | `if (optimisticMerged) return null;`（line 92） | `if (optimisticMerged \|\| optimisticDismissed) return null;` に統合。**state は分離**したまま render guard でのみ合流（issue 知見: 「render guard だけで合流させると rollback の責務が明確になる」） |
| mutation hook | `useAdminMutation`（`../../features/admin/hooks` import） | 既存 import をそのまま使用。legacy `@/lib/useAdminMutation` は不使用（#10） |
| dismiss error 変数 | `dismissError = errorMessage(dismissMutation.error)`（line 62） | 既存のまま流用（rollback 後の inline error 表示に再利用） |
| 理由 state | `dismissReason` / `setDismissReason`（line 31） | rollback 時に **clear しない**（保持）。`onSuccess` 時のみ既存どおり clear |
| トークン | `var(--ubm-color-*)`（OKLch 正本、HEX 直書きなし） | markup 追加は最小（render guard 1 行）でトークン新規追加なし |

## 1.5 carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline -5`:

```
ba8bbff0c feat(issue-230): lefthook 正本逸脱検知ガード (#1061)
52af4e488 feat(api): 公開 members list の tags 一括取得（expand=tags / N+1 防止） (#1060)
6e227f06f docs(issue-264): cron schedule free-tier guard 仕様化 + zero-dep 回帰ガードテスト (#1057)
745c95115 feat(member-publish-recovery): Google Form 反映運用 + Admin Link 導線を dev へ統合 (#1064)
6522a0dc2 docs(shell): issue-1016 モバイルドロワー workflow 成果物 + skill 同期 (#1053)
```

- 直近に identity-conflicts dismiss optimistic を扱うコミットなし。merge optimistic（#988）は別サイクルで実装済み（`IdentityConflictRow.tsx` に `optimisticMerged` が既存）。
- 本タスクは #988 で整った component の上に **dismiss 経路の optimistic 挙動を対称追加**する差分。重複なし。

## 1.6 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に dismiss optimistic 実装が存在する | No（`grep "optimisticDismiss" apps/web/src` = 0 件） | 通常の新規実装（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | No | 未マージ。新規実装として扱う |
| 前提タスク（merge optimistic #988）完了済み | Yes（`optimisticMerged` + `onMerge` rollback が既存） | 依存解消タスク不要。merge pattern を対称適用 |

→ `implementation_mode: "new"`。Phase 4 は RED テスト設計、Phase 5 は新規実装（dismiss 経路）。

## 1.7 受け入れ条件（AC）— issue 受け入れ基準を現行コードへ写像

### 機能要件

- AC-1: dismiss confirm 完了（「別人として確定」click）直後、server 応答前に該当 row が一覧から消える（optimistic hide）
- AC-2: server がエラー（403/409/5xx/network）を返したとき、row が復元し inline error（`role="alert"`）が表示される（rollback）。**dismiss 理由入力値（`dismissReason`）は保持される**
- AC-3: server 成功時、row は消えたまま（再表示されない）。既存 `onSuccess`（`setStage("idle")` / `setDismissReason("")`）と server list 後追い整合が機能
- AC-4: `IdentityConflictRow.tsx` に dismiss 専用 optimistic state（`optimisticDismissed`）が追加され、merge state（`optimisticMerged`）と**共有されていない**
- AC-5: merge 側 optimistic update の成功 / rollback テストが引き続き PASS（非回帰）

### 品質要件

- AC-6: focused vitest（dismiss optimistic hide / rollback+理由保持 / success-stays-hidden + merge 非回帰）全 green
- AC-7: Playwright e2e（dismiss optimistic hide + rollback）全 green
- AC-8: `pnpm typecheck` / `pnpm --filter @ubm-hyogo/web lint` green
- AC-9: legacy `@/lib/useAdminMutation` 未参照（`grep` で 0 件）

### 視覚要件（VISUAL）

- AC-10: Phase 11 で `dismiss-confirm`→`optimistic-removed`→`rollback-error` の状態遷移 screenshot を取得（実装時 user-gated）

> issue 受け入れ基準対応表: issue の 5 チェックボックスは AC-4（state 分離）/ AC-1（即時消失）/ AC-2（復元+理由保持）/ AC-5（merge 非回帰）/ AC-7（Playwright dismiss focused）に 1:1 写像済み。

## 1.8 artifact 命名 canonical 一覧（後回し禁止 / Feedback 1）

| artifact | canonical path |
| --- | --- |
| Phase 11 screenshot (1) | `outputs/phase-11/screenshots/identity-conflict-row-dismiss-confirm.png` |
| Phase 11 screenshot (2) | `outputs/phase-11/screenshots/identity-conflict-row-dismiss-optimistic-removed.png` |
| Phase 11 screenshot (3) | `outputs/phase-11/screenshots/identity-conflict-row-dismiss-rollback-error.png` |
| Phase 11 metadata | `outputs/phase-11/phase11-capture-metadata.json` |

> `implemented_local_evidence_captured` として screenshot は取得済み（status `captured`）。

## 1.9 inventory（変更対象 surface）

| surface | 役割 | 変更種別 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | dismiss UI 本体 + optimistic state | 編集 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | focused vitest | 編集 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | e2e | 編集 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | Server Component list | **変更なし**（参照のみ） |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | mutation hook | **変更なし**（参照のみ） |

## 1.10 完了条件

- 本 Phase の成果物（`phase-1.md`）が、タスク分類・スコープ・命名規則・P50・AC・artifact 命名・inventory をすべて含むこと。
- 後続 Phase が参照する受け入れ条件（AC-1..10）と変更対象 surface が確定していること。
