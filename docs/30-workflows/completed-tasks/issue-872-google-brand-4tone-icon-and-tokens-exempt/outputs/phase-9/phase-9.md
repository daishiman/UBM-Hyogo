**[実装区分: 実装仕様書]**

# Phase 9: 品質保証 / Gate-B 判定根拠

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 5-8 実装 + リファクタリング |
| 出力 | 本ファイル（Gate-B 判定の evidence） |
| Gate | Gate-B（implementation_review） |

## 1. 検証コマンド一覧（順次実行）

| # | コマンド | 期待 |
|---|---|---|
| 1 | `mise exec -- pnpm install` | 依存整合 PASS |
| 2 | `mise exec -- pnpm typecheck` | エラー 0 件 |
| 3 | `mise exec -- pnpm lint` | エラー 0 件 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS |
| 5 | `mise exec -- pnpm tsx scripts/verify-design-tokens.ts` | drift 0 件、exit 0 |
| 6 | `mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts` | TC-EXEMPT-01〜07 すべて Green |
| 7 | `mise exec -- pnpm --filter @ubm-hyogo/web playwright test visual/login` | PASS（baseline 更新済み） |

## 2. 各検証コマンドの判定基準

### 2.1 typecheck（コマンド 2）

- `IconName` union から `"google"` を削除した影響で typecheck が壊れていないことを確認
- `Icon.tsx` の switch が exhaustive 化（`Switch is not exhaustive` が出ないこと）

### 2.2 lint（コマンド 3）

- 不要 import 削除を確認
- `GoogleBrandIcon.tsx` の prop 型注釈が unused-vars に該当しないことを確認

### 2.3 build（コマンド 4）

- OpenNext Cloudflare Workers bundle で `GoogleBrandIcon` の SVG asset wrapper が問題なく bundle されることを確認

### 2.4 verify-design-tokens（コマンド 5）

- `brand-icons/google.svg` 内の HEX が drift にカウントされず、`brand-icons/GoogleBrandIcon.tsx` 内の HEX は drift として検出されることを確認
- 他配下の HEX 直書きが引き続き fail 判定されることを確認

### 2.5 verify-design-tokens.spec.ts（コマンド 6）

- TC-EXEMPT-01 / 02 → PASS（exempt 有効）
- TC-EXEMPT-03 / 04 / 05 / 06 / 07 → 期待挙動通り（exempt 対象外で FAIL 判定）

### 2.6 Playwright visual（コマンド 7）

- baseline 更新後 `login-visual-chromium-linux.png` 等で diff 0 件
- ボタン左の Google "G" が 4-tone で描画されていることを目視確認

## 3. Acceptance Criteria との対応

| AC | 検証コマンド | 判定 |
|---|---|---|
| AC-1（SVG + Icon 存在） | コマンド 4（build PASS で import 解決確認） | – |
| AC-2（4-tone 表示） | コマンド 7（visual PASS） | – |
| AC-3（drift 0 件 exit 0） | コマンド 5 | – |
| AC-4（spec PASS） | コマンド 6 | – |
| AC-5（IconName から google 削除） | コマンド 2（typecheck）+ `grep` 0 件 | – |
| AC-6（09b spec 追記） | 手動目視（diff 確認） | – |
| AC-7（親 workflow consumed 化） | 手動目視（diff 確認） | – |
| AC-8（typecheck/lint/build） | コマンド 2/3/4 | – |
| AC-9（visual baseline 更新 + PASS） | コマンド 7 | – |

## 4. Gate-B 判定基準

すべての検証コマンド（1-7）が PASS した時点で Gate-B = `passed`。1 つでも fail があれば Gate-B = `failed` として該当 Phase に戻る。

## 5. Phase 9 完了条件

- [x] 検証コマンド 7 件を順次実行手順として確定
- [x] 各コマンドの判定基準を明示
- [x] Acceptance Criteria との対応表を提示
- [x] Gate-B 判定基準を確定

## 6. 次 Phase への引き継ぎ

Phase 10（最終レビュー）→ Phase 11（visual evidence）→ Phase 12（ドキュメント更新）→ Phase 13（PR、user-gated）と進む。Phase 12 では `outputs/phase-12/` 配下に 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を生成し、`artifacts.json` / `outputs/artifacts.json` parity を確認する。
