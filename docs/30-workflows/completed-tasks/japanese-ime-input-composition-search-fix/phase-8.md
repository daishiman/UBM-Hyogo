# Phase 8: リファクタリング

> 本プロンプト（タスク仕様書作成）ではコードを実装しない。本 Phase は後続実装プロンプトが着手できる
> **リファクタリング仕様**を記述する（CONST_006）。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 7 / 次 Phase: 9
- 作成日: 2026-06-02

## 目的

テスト Green を保ったまま、IME-safe 入力ロジックの重複・命名・責務を整理する。
重複ロジックを共有フック `useImeSafeInput` に集約し（AC-5）、`Search.tsx` 内の旧 controlled ロジックを除去する。
本サイクルでは振る舞い変更・配線変更を行わず（AC-6/AC-7 維持）、将来の横展開候補は記録に留める（[Feedback RT-03]）。

## 実行タスク

1. リファクタ対象を Before / After / 理由のテーブル形式で確定する（[Feedback RT-03]）。
2. 本サイクルで実施する整理と、将来統一候補として記録のみ行う項目を分離する。
3. navigation / URL 正本設計に drift を起こさないことを明記する。
4. リファクタ後も Phase 4/6 の全 TC が Green であることを完了条件とする。

## 8.1 リファクタリング項目（Before / After / 理由）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| R1 | `Search.tsx` の入力ロジック | controlled `value`/`onChange` を直結（IME・debounce なし） | `useImeSafeInput` の `inputProps` / `commitNow` を利用 | 重複ロジック除去・IME-safe 集約（AC-5） |
| R2 | ×クリア処理 | `onChange("")` 直接呼び（debounce 経路を素通り） | `commitNow("")` で clearTimer + 即時 commit | クリア即時性とロジック一元化（AC-4） |
| R3 | composition / debounce ロジック | 各コンポーネントに散在しうる | `useImeSafeInput.ts` 1 箇所に集約 | DRY・横展開基盤（AC-5） |
| R4 | 命名整合 | `onChange`（値か event か曖昧） | フックは `onCommit`、Input opt-in は `onValueChange` で統一 | 「確定値を渡す」意図を命名で明示 |
| R5 | `SelectedFiltersBar.client.tsx` の `q` チップ生成ブロック | q チップ生成コードが残存 | 削除（×は Search 内 1 箇所へ集約） | ×重複解消（AC-3）・死コード除去 |

## 8.2 将来統一候補（本サイクルは記録のみ・配線変更しない）

| 項目 | 現状 | 将来統一案 | 本サイクル方針 |
| --- | --- | --- | --- |
| admin `_members/MembersFilters.tsx` の遅延確定 | 独自の遅延/確定ロジックを持つ可能性 | `useImeSafeInput` への統一 | **配線変更せず記録のみ**（[Feedback RT-03]）。公開ディレクトリ検索とスコープが異なるため別タスク候補 |
| `Input.tsx` imeSafe opt-in の他フォーム横展開 | 公開検索のみで利用 | admin / register など各フォームへ展開 | 基盤のみ追加し横展開は別サイクル |

> 上記は未タスク候補として Phase 10/12 で起票判断する（本サイクルではコード変更しない）。

## 8.3 不変条件（リファクタで壊さない）

- 公開 props の後方互換を維持（AC-6）。`Search` の既存呼び出し（`MemberFilters.client.tsx`）は無改修で動作。
- URL 正本設計（`?q=` への確定値反映 / `router.replace`）に drift を起こさない。navigation 経路は不変。
- D1 / API endpoint / Google Form schema は不変（AC-7）。
- OKLch トークン維持・HEX 直書きゼロ（Phase 9 で grep gate）。
- リファクタ前後で Phase 4/6 の全 TC が Green を維持。

## 8.4 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx \
  apps/web/src/components/ui/__tests__/Search.spec.tsx \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/ui/__tests__/Input.spec.tsx
```

## 参照資料

- `phase-2.md`（設計）/ `phase-5.md`（実装手順）/ `phase-6.md`（回帰 guard）
- [Feedback RT-03]（Before/After/理由テーブル・将来統一候補は記録のみ）

## 成果物

- `phase-8.md`（リファクタリング仕様）

## 統合テスト連携

- リファクタ後に Phase 4/6 の全 TC を再実行し Green を確認する。
- 将来統一候補（admin 遅延確定との統合）は本サイクルで配線変更せず、Phase 10/12 の未タスク候補へ送る。
- Phase 9 品質保証でトークン / 後方互換 / schema 不変を最終判定する。

## 完了条件

- [ ] リファクタ項目 R1〜R5 を Before/After/理由テーブルで確定した（[RT-03]）
- [ ] 将来統一候補（admin MembersFilters / Input 横展開）を記録のみとし配線変更しない方針を明記した
- [ ] navigation / URL 正本設計に drift を起こさないことを明記した
- [ ] 後方互換（AC-6）・D1/API/Form schema 不変（AC-7）を不変条件に含めた
- [ ] リファクタ後も Phase 4/6 全 TC が Green を維持することを完了条件にした
