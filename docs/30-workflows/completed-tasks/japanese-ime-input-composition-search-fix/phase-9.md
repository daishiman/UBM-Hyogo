# Phase 9: 品質保証

> 本プロンプト（タスク仕様書作成）ではコードを実装しない。本 Phase は後続実装プロンプトが着手できる
> **品質保証（QA）仕様**を記述する（CONST_006）。

## メタ情報

- taskId: `TASK-IME-INPUT-COMPOSITION-SEARCH-FIX`
- 前 Phase: 8 / 次 Phase: 10
- 作成日: 2026-06-02

## 目的

実装・テスト・リファクタを経た成果物が、AC-1〜AC-7 とプロジェクト不変条件（OKLch トークン正本・D1/API/Form schema 不変・
後方互換・URL 正本設計非破壊）を満たすことを機械的に判定する QA ゲートを確定する。

## 実行タスク

1. 静的品質（typecheck / lint / line budget）の判定項目を確定する。
2. デザイントークン QA（HEX 直書きゼロ grep gate / `verify-design-tokens`）を確定する。
3. 後方互換・URL 正本設計・schema 不変の判定項目を確定する。
4. カバレッジ gate（`coverage-guard.sh` exit 0）を最終ゲートに含める。

## 9.1 静的品質ゲート

| 判定項目 | 基準 | コマンド / 手段 |
| --- | --- | --- |
| 型チェック | エラー 0 | `mise exec -- pnpm typecheck` |
| Lint | エラー 0（`--fix` 後の残違反 0） | `mise exec -- pnpm lint` |
| line budget | 変更ファイルが妥当な行数に収まる（過大肥大なし） | 目視 / diff レビュー |
| `no-restricted-globals` 準拠 | `apps/web/src` で `globalThis.setTimeout` 等経由 | lint 内包 |

## 9.2 デザイントークン QA（OKLch 正本 / AC-7）

HEX 直書き・`bg-[#...]` / `text-[#...]` の混入を許容しない。以下 grep が **0 件**であること:

```bash
# 変更 UI コンポーネントに HEX 直書きがないこと（0 件期待）
grep -rn "#[0-9a-fA-F]\{3,6\}" apps/web/src/components/ui/Search.tsx
grep -rn "#[0-9a-fA-F]\{3,6\}" apps/web/src/components/ui/Input.tsx
grep -rn "#[0-9a-fA-F]\{3,6\}" apps/web/src/components/public/SelectedFiltersBar.client.tsx
grep -rn "#[0-9a-fA-F]\{3,6\}" apps/web/src/hooks/useImeSafeInput.ts

# 任意色クラスの混入がないこと（0 件期待）
grep -rn "bg-\[#" apps/web/src/components/ui apps/web/src/components/public
grep -rn "text-\[#" apps/web/src/components/ui apps/web/src/components/public
```

加えて CI gate を通すこと:

```bash
# デザイントークン検証（task-18 由来の CI gate と整合）
mise exec -- pnpm verify:design-tokens   # もしくは該当 npm script / CI job verify-design-tokens
```

## 9.3 後方互換・不変条件ゲート（AC-6 / AC-7）

| 判定項目 | 基準 | 手段 |
| --- | --- | --- |
| AC-6 後方互換 | `Search` 既存呼び出し（`MemberFilters.client.tsx`）が無改修で動作 / `Input` の `imeSafe` 未指定経路が従来挙動 | TC-S5 / TC-S3 / TC-I3 で担保 |
| URL 正本設計非破壊 | `?q=` への確定値反映 / `router.replace` 経路が不変 | TC-M3 / 設計レビュー |
| D1 不変 | migration 追加なし / D1 schema 変更なし | diff 確認（`apps/api` / migrations 非接触） |
| API 不変 | endpoint surface 変更なし | diff 確認（`apps/api/src/routes` 非接触） |
| Google Form schema 不変 | フォーム項目・consent キー不変 | diff 確認 |
| × アイコン単一化（AC-3） | キーワードの × は Search 内 1 箇所のみ | TC-B3 / TC-S2 で担保 |

## 9.4 カバレッジゲート（最終）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage \
  apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx \
  apps/web/src/components/ui/__tests__/Search.spec.tsx \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/ui/__tests__/Input.spec.tsx
bash scripts/coverage-guard.sh   # exit 0 期待
```

## 9.5 QA 判定サマリ（全項目 Pass で完了）

- [ ] `pnpm typecheck` 0 エラー
- [ ] `pnpm lint` 0 エラー
- [ ] HEX 直書き grep 0 件（Search / Input / SelectedFiltersBar / useImeSafeInput）
- [ ] `bg-[#` / `text-[#` 0 件
- [ ] `verify-design-tokens` Pass
- [ ] AC-6 後方互換維持
- [ ] URL 正本設計非破壊（`?q=` / `router.replace` 不変）
- [ ] D1 / API / Google Form schema 不変
- [ ] × アイコン単一化（AC-3）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## 参照資料

- `phase-5.md`（実装手順）/ `phase-6.md`（テスト拡充）/ `phase-7.md`（カバレッジ）/ `phase-8.md`（リファクタ）
- `docs/00-getting-started-manual/specs/design-tokens.md`（OKLch トークン正本）
- CLAUDE.md 不変条件（D1 直接アクセス禁止 / Form schema 固定回避 / トークン正本化）

## 成果物

- `phase-9.md`（品質保証ゲート仕様）

## 統合テスト連携

- Phase 4/6 の全 TC が Green であることを前提に、本 Phase で静的品質 / トークン / 後方互換 / schema 不変 / カバレッジを横断判定する。
- いずれかの判定が Fail した場合は該当 Phase（6: テスト、7: カバレッジ、8: リファクタ）へ戻す。
- 全 Pass 後に Phase 10（最終レビュー）/ Phase 11（手動・視覚確認）へ進む。

## 完了条件

- [ ] 静的品質ゲート（typecheck/lint/line budget/no-restricted-globals）を判定項目化した
- [ ] HEX 直書き 0 件 grep gate と `verify-design-tokens` を判定項目化した
- [ ] 後方互換（AC-6）・URL 正本設計非破壊・D1/API/Form schema 不変を判定項目化した
- [ ] × アイコン単一化（AC-3）を判定項目化した
- [ ] `bash scripts/coverage-guard.sh` exit 0 を最終ゲートに含めた
- [ ] QA 判定サマリをチェックリスト化した
