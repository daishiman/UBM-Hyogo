# Phase 8: リファクタリング

> GREEN を維持したまま行う整理のみ（Feedback RT-03: 対象/Before/After/理由 のテーブル形式で記録）。
> 挙動・テスト期待値・公開 API surface を変える変更は本フェーズで行わない。
> **「実施しない」判断も理由付きで必ず記録する**（無言スキップ禁止）。

## 参照資料

| 種別 | パス | 用途 |
|------|------|------|
| 実装結果 | `outputs/phase-5/phase-5.md` §5.2 / §5.3 | リファクタ候補の母体コード |
| コロケーション前例 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（`NotificationOptOutToggle` / `MemberTagsEditor`） | ファイル内同居の妥当性基準 |
| 検証コマンド | `outputs/phase-5/phase-5.md` §5.6 | リファクタ後の GREEN 確認 |

## 8.1 リファクタリング候補（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 / 判断 |
|---|------|--------|-------|------------|
| R-1 | 復元系文言定数（`MemberDrawer.tsx`） | confirm / 409 / 汎用エラーの 3 文言が JSX・handler 内に直書きされている場合 | `RESTORE_CONFIRM_MESSAGE` / `RESTORE_ERROR_CONFLICT` / `RESTORE_ERROR_GENERIC` のモジュールスコープ定数へ集約（Phase 5 §5.3 はこの形を既に推奨。直書きで実装された場合のみ適用） | テスト（T-08〜T-11/E-01/E-04）と実装の文言 drift 防止。spec 側からの import はしない（DOM 文字列で検証し、定数 export を増やさない） |
| R-2 | `DeletedMemberSection` の切り出し最終判断 | `MemberDrawerBody` 内へインライン実装されている場合 | `MemberDrawer.tsx` 内ローカルコンポーネントとして分離（**別ファイル化はしない**） | error/isLoading の状態を `MemberDrawerBody` から隔離。`NotificationOptOutToggle` と同じ同居パターンで export 面を増やさない。**既に Phase 5 §5.3 どおり分離済みなら「実施しない（適用済み）」と記録** |
| R-3 | 未使用 import 除去 | C1/C2 編集の過程で残った未使用 import（例: 旧 410 分岐関連、テスト書き換えで不要化した helper） | 削除 | `pnpm lint` の unused 検出ゼロ維持。特に `MemberDrawer.tsx` へ追加した `FetchAuthedError` が R-1/R-2 の整理で不要化していないか確認 |
| R-4 | `session-error-display.ts` の title 重複 | 「セッション情報を取得できませんでした」が 404/5xx/FAILED の 3 分岐に重複（410 は別 title になり共通化の対称性が崩れた） | **実施しない** | 定数化すると分岐ごとの文言が読みにくくなり、61 行の小ファイルで DRY 化の便益が薄い。410 だけ title が異なる現状こそが仕様（退会済みの明示）であり、構造変更はテスト期待値に触れるリスクのみ |
| R-5 | `page.spec.tsx` / 既存 specs の整理 | 既存テストの記述スタイル混在 | **実施しない** | 本タスクのスコープ外ファイルの様式統一は diff ノイズ。回帰 guard の信頼性を優先 |

## 8.2 実施ルール

1. 各候補の適用は **1 候補 = 1 コミット粒度**で行い、適用ごとに §8.3 の検証を回す。
2. 「実施しない」候補（R-4/R-5、および状況により R-1/R-2 の「適用済み」）は上表の理由をもって完了とする。新たな候補を発見した場合は同じ 4 列形式で追記してから着手する。
3. リファクタ中にテスト期待値の変更が必要になったら、それはリファクタではなく挙動変更 → Phase 5 へ差し戻す。

## 8.3 リファクタ後の検証（各適用後・repo root）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx" \
  "apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx" \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tagInlineCreate.spec.tsx"
```

## 実行タスク

- [ ] R-1〜R-3 を実コードに照らして適用 or 「実施しない（適用済み/不要）」を理由付きで確定
- [ ] R-4/R-5 の「実施しない」判断を最終確認（状況変化があれば理由を更新）
- [ ] 適用した候補ごとに §8.3 の検証を実行し全 GREEN を確認
- [ ] 新規発見候補があれば 4 列形式で追記し、同ルールで処理

## 完了条件

- [ ] §8.1 の全候補に「適用済み」または「実施しない + 理由」が記録されている。
- [ ] §8.3 が全て exit 0（リファクタによる回帰ゼロ）。
- [ ] 変更ファイルが Phase 5 §5.1 の範囲から増えていない（別ファイル切り出し・新規 util 追加なし）。

## 成果物

- 本ファイル `outputs/phase-8/phase-8.md`（候補テーブル R-1〜R-5 + 実施/不実施の判断記録様式）
- 適用済みの最小 diff（`MemberDrawer.tsx` / `session-error-display.ts` 内に閉じる）
