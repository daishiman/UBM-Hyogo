# 最終レビュー結果（Phase 10 正本）

> 本プロンプト（タスク仕様書作成）ではコード実装・PR 作成を行わず、仕様のみを確定する。
> 実装の実機合否判定は Gate-B（後続実装プロンプト）pending。

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- workflow_state: `spec_created`
- implementation_mode: `new`
- タスク種別: VISUAL
- 作成日: 2026-06-02

## 1. レビュー総括

公開会員ディレクトリ（`/(public)/members`）のキーワード検索における日本語 IME 変換崩れ
（例: 「ｔえｓうｔお」のように未確定文字が逐次反映される）と、検索キーワードの ×（クリア）アイコン重複を解消し、
IME-safe 入力ロジックを共有フック `useImeSafeInput` に集約する設計が、Phase 1〜9 を通じて確定した。

設計・テスト計画・実装手順の整合を確認した結果、**blocker は無し**。
仕様レベルで AC-1〜AC-7 はすべて充足見込みである。実コードの実装は本サイクル対象外（`spec_created`）であり、
実装合否は後続実装プロンプトの Gate-B にて targeted spec の全 Green と手動 IME 確認（Phase 11）で確定する。

## 2. AC 別判定テーブル

| AC | 内容 | 充足設計の所在 | 検証手段（Phase 4 TC） | 仕様レベル判定 |
| --- | --- | --- | --- | --- |
| AC-1 | IME 確定文字列のみを検索値へ反映（変換中は反映しない） | `useImeSafeInput` の `isComposingRef` ガード + `compositionstart` で `clearTimer()` | `useImeSafeInput.spec.tsx`（composition 中 commit されない） | 充足見込み |
| AC-2 | `compositionend` + debounce 250ms で `?q=` 更新 | `onCompositionEnd` → `scheduleCommit(v)`（既定 250ms） | `useImeSafeInput.spec.tsx` / `Search.spec.tsx` | 充足見込み |
| AC-3 | × アイコンは 1 箇所のみ（チップ側の重複削除） | `SelectedFiltersBar.client.tsx` の `q` チップ生成ブロック削除、× は `Search.tsx` 内のみ | `SelectedFiltersBar.client.spec.tsx`（q チップ非生成） | 充足見込み |
| AC-4 | × クリックで即時クリア（debounce を待たない） | `commitNow("")`（`clearTimer()` 即時 `onCommit`） | `Search.spec.tsx`（× → 即 `?q=` クリア） | 充足見込み |
| AC-5 | IME-safe 入力ロジックを共有フックへ集約 | 新規 `useImeSafeInput.ts` を `Search.tsx` / `Input.tsx`（opt-in）が共用 | `useImeSafeInput.spec.tsx` + 各 consumer spec | 充足見込み |
| AC-6 | 後方互換（既存呼び出し・既定経路を破壊しない） | `Input.tsx` は `imeSafe && onValueChange` のときのみフック経路、既定は素の `<input>` 不変 | `Input.spec.tsx`（既定経路不変） | 充足見込み |
| AC-7 | OKLch トークン維持 / D1・API・Form schema 不変 | HEX 直書き禁止継続、新 endpoint・schema 変更なし（UI 層のみ） | lint（token gate）+ レビュー（diff に api/migrations 不在） | 充足見込み |

## 3. blocker

- **無し。**
- 不変条件チェック: D1 直接アクセス追加なし / 新規 API endpoint なし / Google Form schema 変更なし / OKLch トークン正本逸脱なし。
- 不変条件 #9（admin の `FormField` 経由）は本タスク対象外（公開側 UI primitives）。`Input.tsx` の opt-in 拡張は既定経路非破壊で抵触しない。

## 4. MINOR 指摘（Phase 12 で未タスク化の候補）

| # | 指摘 | 重大度 | 対応方針 |
| --- | --- | --- | --- |
| MINOR-1 | `debounceMs` を `MemberFilters.client.tsx` から明示指定する将来余地（現状は既定 250 で十分） | MINOR | Phase 12 で記録のみ。即時対応不要。 |
| MINOR-2 | `Input.tsx` の `imeSafe` opt-in を admin 検索系へ横展開する可能性（本サイクルは公開側のみ） | MINOR | Phase 12 で記録のみ。別タスク候補。 |
| MINOR-3 | composition イベントの `currentTarget`/`target` 差異吸収はテスト/実 DOM の双方で要確認（実装時に回帰 guard 推奨） | MINOR | Phase 4/6 のテストで担保予定。実装時に再確認。 |

> 上記はいずれも blocker ではなく、本サイクルの AC 充足を妨げない。正式な未タスク化判定は Phase 12 で行う。

## 5. 実装フェーズ（Gate-B）への申し送り

- 実装は後続実装プロンプト（`03.実装.md` 相当）で Phase 5 手順に従って実施する。
- 完了基準: `pnpm typecheck` / `pnpm lint` 0 エラー、Phase 4 の全 TC Green、手動 IME 確認（Phase 11）。
- 本 Phase 10 のレビュー判定（blocker 無し）は実装着手の前提条件を満たす。
