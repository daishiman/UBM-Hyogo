# japanese-ime-input-composition-search-fix

## 概要

メンバー一覧（会員ディレクトリ `/(public)/members`）の「キーワード検索」入力で、日本語 IME 変換中の
文字列が「ｔえｓうｔお」のように崩れ、検索が機能しない不具合を修正する。あわせて ×（クリア）アイコンが
検索入力欄とサマリーチップで二重に表示される問題を解消し、IME-safe な入力ロジックを**共有フック化**して
他の日本語入力箇所へ横展開できる基盤を整える。

- workflow_state: `implemented_local_evidence_captured`
- implementation_mode: `implemented_local`
- taskType: `implementation`
- visualEvidence: `VISUAL`（local screenshot 2 枚取得済み。実機 IME/staging screenshot は user-gated・local jsdom render unit を主証跡とする）
- Phase 12 strict 7: `outputs/phase-12/` に配置
- Local evidence: focused Vitest 5 files / 26 tests PASS、`@ubm-hyogo/web` typecheck PASS、`@ubm-hyogo/web` lint PASS、local `/members` screenshot 2 枚 PASS
- Phase 13: staging real-IME screenshots、commit / push / PR は user-gated

## 実装区分の判定根拠（CONST_004）

**実装区分: 実装仕様書**。

本 workflow は `apps/web` の UI コンポーネント（`Search` / `SelectedFiltersBar` / `MemberFilters` / `Input`）と
新規共有フック（`useImeSafeInput`）を**コード変更**して達成する。「日本語入力を機能させる」「IME 破綻を直す」
「×重複を解消する」はいずれもコード変更なしで達成不可能なため、docs-only ではなく実装仕様書とする。
本サイクルでコード・テスト・aiworkflow same-wave sync まで実施済み。browser/staging IME screenshot、commit、push、PR のみ user-gated とする（CONST_005）。

## 真の論点（要件レビュー一次結論）

| 観点 | 結論 |
| --- | --- |
| 価値性 | 公開会員検索が日本語で実用できない致命的 UX 障害を解消。誰の（来訪者・会員）どのコスト（検索不能）を下げるかが明確 |
| 実現性 | 初回スコープは「共有フック新設 + Search 改修 + ×重複解消 + 配線確認 + Input opt-in」で 1 サイクル内に収まる |
| 整合性 | URL 正本設計（不変条件）を壊さず、IME 確定までローカル draft をバッファし debounce 後に URL 反映するため責務境界が閉じる |
| 運用性 | IME-safe ロジックを 1 フックに集約し、Search/Input から再利用。回帰は spec で固定し CI で担保 |

**主問題（1 文）**: 「URL 正本即時反映」設計の検索入力が、IME 変換中の各 `onChange` で `router.replace()` を発火し
Server Component 再取得 → `value` 再設定で composition を中断するため、日本語が確定できない。

## 根本原因（実コード anchor・verbatim 確認済み）

| # | 症状 | 原因コード | ファイル:行 |
| --- | --- | --- | --- |
| RC-1 | 日本語 IME 変換が崩れる（「ｔえｓうｔお」） | controlled input が composition 中も `onChange` 発火→即 `update({q})`→`router.replace()`→再描画で `value` 再設定。`onCompositionStart/End` も debounce も無い | `apps/web/src/components/ui/Search.tsx:27` / `apps/web/src/components/public/MemberFilters.client.tsx:147` / 同 `69-96`（`update`→`router.replace`） |
| RC-2 | ×アイコンが重複表示 | 入力欄内の×（`Search`）と、サマリーバーの「検索: … ×」チップ（`SelectedFiltersBar`）が同一キーワードに対し二重表示 | `apps/web/src/components/ui/Search.tsx:32-36` / `apps/web/src/components/public/SelectedFiltersBar.client.tsx:47-54`（`q` chip 生成）/ 同 `119-121`（× 描画） |
| RC-3 | 検索が機能しない | RC-1 による崩れた文字列が query 化 + 即時 `router.replace` による focus 喪失で意図したキーワードが入らない | RC-1 と同一経路 |

> 参考: admin 側 `apps/web/src/features/admin/components/_members/MembersFilters.tsx:43-59` は `qLocal` ローカル state +
> `onBlur` / `onKeyDown(Enter)` の遅延確定で実質 IME-safe。public `Search` 経路だけがこの保護を欠く**実装不整合**が背景にある。

## 採用設計（ユーザー確定事項）

| 論点 | 確定 |
| --- | --- |
| ×重複の解消 | **入力欄の×を正**とし、`SelectedFiltersBar` から `q`（キーワード）チップを除去。zone/status/tag チップは維持 |
| 反映タイミング | **IME 確定（compositionend）+ debounce 自動反映**。「入力すると即反映されます」の体験を維持しつつ IME-safe 化 |
| 共通化の粒度 | **共有フック `useImeSafeInput` を新設**し、`Search`（公開検索）と `Input`/`Textarea`（汎用・opt-in）双方から再利用できる形にする |

## 受け入れ条件（AC）

| ID | 条件 | 検証 Phase |
| --- | --- | --- |
| AC-1 | キーワード検索に「テスト」等の日本語を IME 入力すると、変換確定後に正しい確定文字列が入力欄へ反映される（途中の未確定文字列が URL/検索へ漏れない） | `phase-4.md` / `phase-11.md` |
| AC-2 | IME 確定後 debounce（既定 250ms）経過で URL（`?q=`）と検索結果が更新される。確定前は URL 更新が発火しない | `phase-4.md` |
| AC-3 | ×（クリア）アイコンはキーワードに対し 1 箇所のみ表示される（入力欄内の×を正、サマリーバーの `q` チップは非表示） | `phase-4.md` / `phase-11.md` |
| AC-4 | 入力欄の×クリックで draft と URL の `q` が即時クリアされる（debounce 待ちなし） | `phase-4.md` |
| AC-5 | IME-safe ロジックが共有フック `useImeSafeInput` に集約され、`Search` がこれを利用する。`Input` も opt-in（`imeSafe`）で同フックを利用できる | `phase-2.md` / `phase-4.md` |
| AC-6 | 既存の `Search` / `Input` 利用箇所の公開 props（`value` / `onChange` 等）が後方互換であり、非 IME 入力・英数字入力の挙動が回帰しない | `phase-6.md` / `phase-9.md` |
| AC-7 | OKLch トークン正本化を維持（HEX 直書き / `bg-[#xxx]` 禁止）。既存 API のみ接続（D1 / API / Form schema 不変） | `phase-9.md` |

## 対象ファイル

| 区分 | パス | 状態 |
| --- | --- | --- |
| 新規 hook | `apps/web/src/hooks/useImeSafeInput.ts` | 新規 |
| hook spec | `apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx` | 新規 |
| 検索改修 | `apps/web/src/components/ui/Search.tsx` | 編集 |
| 検索 spec | `apps/web/src/components/ui/__tests__/Search.spec.tsx` | 新規 |
| ×重複解消 | `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | 編集（`q` chip 除去） |
| サマリー spec | `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | 新規/編集 |
| 配線確認 | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集（最小） |
| フィルタ spec | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 新規/編集 |
| 汎用 opt-in | `apps/web/src/components/ui/Input.tsx` | 編集（後方互換 opt-in 追加） |
| Input spec | `apps/web/src/components/ui/__tests__/Input.spec.tsx` | 新規/編集 |

## スコープ（CONST_007: 1 サイクル完結）

**含む（1 サイクルで実装）**:
1. 共有フック `useImeSafeInput` 新設（IME composition + debounce-commit + 外部 value 同期）
2. `Search.tsx` を IME-safe 化（フック利用・×は即 commit）
3. `SelectedFiltersBar.client.tsx` の `q` チップ除去（×重複解消）
4. `MemberFilters.client.tsx` の配線確認（Search 内部で吸収・変更は最小）
5. `Input.tsx` に `imeSafe` opt-in（後方互換・横展開基盤）

**スコープ外（先送りではなく「問題が存在しない/別関心」のため対象外）**:
- admin の理由記述 textarea 群（`IdentityConflictRow` / `RequestConfirmDialog` / `TagsQueueResolveDrawer` / `RequestConfirmDialog`）は
  **submit 型**（onChange は親再描画/URL更新を起こさず input 再 mount もしない）ため IME 破綻が発生しない。共有フックは将来適用できる形で提供するが、
  本サイクルで配線変更しない理由を Phase 12 `unassigned-task-detection.md` に「現状実害なし・横展開候補」として明記する。
- `SchemaDiffHistoryPanel` の `questionTextLike` も form submit 型でクライアントフィルタのため同様に実害なし（横展開候補）。

## Phase 構成

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/requirements.md` / `phase-1.md` | completed |
| 2 | `phase-2.md` | completed |
| 3 | `phase-3.md` | completed |
| 4 | `phase-4.md` | completed |
| 5 | `phase-5.md` | completed |
| 6 | `phase-6.md` | completed |
| 7 | `phase-7.md` | completed |
| 8 | `phase-8.md` | completed |
| 9 | `phase-9.md` | completed |
| 10 | `phase-10.md` / `outputs/phase-10/final-review-result.md` | completed |
| 11 | `phase-11.md` / `outputs/phase-11/main.md` | completed_local_evidence |
| 12 | `phase-12-compliance.md` / `outputs/phase-12/*` | completed_synced |
| 13 | `phase-13.md` | blocked: user approval required |

## 依存関係

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 の直列。

## VISUAL 境界

検索入力の日本語入力挙動・×の単一表示・focus 維持が視覚対象。local `/members` screenshot は
`outputs/phase-11/screenshots/` に 2 枚取得済み。実機 IME 操作を伴う staging screenshot は user-gated。
主証跡は `apps/web` の jsdom render unit（`Search.spec.tsx` / `SelectedFiltersBar.client.spec.tsx` /
`MemberFilters.client.spec.tsx`）と純粋ロジック unit（`useImeSafeInput.spec.tsx`）。D1 / API / Google Form schema は不変。
