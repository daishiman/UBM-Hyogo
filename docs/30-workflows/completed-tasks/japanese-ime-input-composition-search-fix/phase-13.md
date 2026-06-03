# Phase 13: PR 作成（blocked）

> 本プロンプト（タスク仕様書作成）ではコード実装・commit・push・PR 作成を行わない。
> 本 Phase は status=blocked（`user_approval_required`）であり、PR 作成は実装プロンプト完了後にユーザー明示承認を得て実施する。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 12 / 次 Phase: なし（最終）
- 作成日: 2026-06-02
- status: `blocked`（`user_approval_required` / CONST_002）

## 目的

実装完了後の PR 作成手順と PR 本文に含める内容を確定する。
commit / push / PR 作成は副作用を伴うため、ユーザーの明示承認後にのみ実行する（CONST_002）。
base ブランチは `dev`。

## 実行タスク

> 以下はいずれも「ユーザー明示承認後」かつ「実装プロンプト完了後」に実行する。本 Phase では実行しない。

1. 実装プロンプト（Gate-B）で Phase 5 手順に従い実コードを実装し、Phase 4 の全 TC を Green にする。
2. `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` を通過させる。
3. base `dev` で PR を作成する（`gh pr create --base dev`）。
4. Phase 11 の screenshot が user-gated で取得済みであれば PR 本文に参照を含める。未取得ならスクリーンショット節は作らない。

## PR 本文に含める内容（テンプレート）

- **根本原因**: 検索入力が IME 未確定文字を逐次反映していたこと（composition ガード欠如）と、× クリア導線が
  `Search.tsx` と `SelectedFiltersBar.client.tsx`（q チップ）で重複していたこと。
- **設計**: 新規共有フック `useImeSafeInput`（`compositionstart/end` ガード + debounce 250ms commit + `commitNow` 即時クリア）。
  `Search.tsx` をフック利用へ改修、`SelectedFiltersBar.client.tsx` の q チップ削除、`Input.tsx` に `imeSafe` opt-in。
- **AC**: AC-1（確定文字のみ反映）/ AC-2（compositionend + debounce で `?q=` 更新）/ AC-3（× 1 箇所）/
  AC-4（× 即時クリア）/ AC-5（共有フック集約）/ AC-6（後方互換）/ AC-7（OKLch 維持・D1/API/Form schema 不変）。
- **対象ファイル**: `apps/web/src/hooks/useImeSafeInput.ts`（新規）/ `Search.tsx` / `SelectedFiltersBar.client.tsx` /
  `MemberFilters.client.tsx`（配線確認）/ `Input.tsx`。
- **テスト**: Phase 4 の 5 spec（jsdom render unit + 純ロジック unit）。
- **スクリーンショット**: Phase 11 で取得済みの場合のみ参照（`member-search-ime-composing.png` /
  `member-search-ime-committed.png` / `member-search-cleared.png`）。未取得時は本節を省略。

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`（PR 本文 Phase 13 仕様）
- `phase-5.md`（実装手順）/ `phase-10.md`（最終レビュー）/ `phase-11.md`（証跡）

## 成果物

- `phase-13.md`（本ファイル）
- （実装プロンプト完了後・承認後）PR URL

## 完了条件

- [x] PR 作成手順と PR 本文テンプレートを確定
- [x] status=blocked（`user_approval_required`）であることを明記
- [x] base=dev / commit・push・PR はユーザー明示承認後のみ（CONST_002）であることを明記
- [ ] （承認後）実装プロンプト完了 → 品質検証通過 → PR 作成（本サイクル対象外）
