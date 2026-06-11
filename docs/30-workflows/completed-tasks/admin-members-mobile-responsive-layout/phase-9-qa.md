# Phase 9: QA / CI gate

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 9 / 13
- 前提: Phase 5（実装）/ Phase 6（テスト実装）/ Phase 7-8 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL

## 目的

実装サイクルで landed した F1〜F4 に対し、CI gate 相当の機械検証を実行し、AC-6 / AC-7 / AC-8 / AC-9 を客観的に充足判定する。本フェーズは品質ゲートであり、合否は機械的コマンド出力で確定する（主観判定禁止）。

## 実行タスク

### Step 1: design token gate（AC-6）

- 目的: `globals.css`（F2）の追加 CSS に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / 任意値カラーが新規混入していないことを確認する。
- コマンド（SSOT §7・`mise exec --` 経由）:
  ```bash
  mise exec -- pnpm verify:design-tokens
  ```
- 補助 grep（追加ブロック限定の混入チェック）:
  ```bash
  git diff dev...HEAD -- apps/web/src/styles/globals.css | grep -E '^\+' | grep -Ei '#[0-9a-f]{3,8}\b|\b(bg|text|border)-\[#'
  ```
  → 出力が空であること（HEX/任意値カラー新規混入ゼロ）。
- 合格基準: `verify:design-tokens` 相当が緑、かつ上記 grep が空 → AC-6 PASS。

### Step 2: targeted vitest（AC-7）

- 目的: 既存 `MembersTable.spec.tsx` TC-MT-01〜20 が全緑、追加 TC-MT-21〜24 が緑であることを確認する。
- コマンド:
  ```bash
  mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx
  ```
- 合格基準: 全 TC が passed。failed / skipped が 0 → AC-7 PASS。
- 確認観点: TC-MT-18〜20（axe a11y）が jsdom で `@media` 非適用のため緑維持していること（I-8 リグレッションガード）。

### Step 3: typecheck / lint（AC-9）

- コマンド:
  ```bash
  mise exec -- pnpm --filter @ubm-hyogo/web typecheck
  mise exec -- pnpm --filter @ubm-hyogo/web lint
  ```
- 合格基準: いずれも exit 0（エラー / 警告昇格なし）→ AC-9 PASS。
- lint 失敗時は `pnpm lint --fix` を先に試し、残る違反のみ手修正する（PR フロー方針に整合）。

### Step 4: API 非接触確認（AC-8）

- 目的: 本タスクが `apps/web` 表現層のみの変更で、`apps/api` / D1 migration / Google Form 関連へ差分ゼロであることを機械確認する（I-1 / I-7）。
- コマンド:
  ```bash
  git diff dev...HEAD --name-only -- apps/api 'packages/**/migrations/**'
  ```
- 合格基準: 出力が**空**であること → AC-8 PASS。

### Step 5: FB-UI-02-1（ファイル削除 PASS 基準の非該当明記）

- 本タスクは F1〜F3 が編集・F4 が新規であり、**ファイル削除は一切ない**。
- したがって「ファイル削除に伴う import 孤児チェック / 削除 PASS 基準」は**本タスクでは非該当**である。Phase 9 でこの観点を空振り PASS 扱いにせず、明示的に「非該当（削除なし）」と記録する。

### Step 6: MINOR TECH-M-01 解決確認（実トークン名の実在）

- Phase 3 で起票した MINOR TECH-M-01（実トークン名 `--ubm-space-*` / `--ubm-text-xs` / `--ubm-radius-md` / `--ubm-color-*` の実在は実装時確認に委ねる）を、Phase 9 で grep により解決確認する。
- コマンド（実装で実際に使用したトークン名を `tokens.css` / `globals.css` 正本に対し実在確認）:
  ```bash
  # 追加ブロックで参照した各 var(--ubm-...) が tokens.css / globals.css の :root 定義に存在するか
  git diff dev...HEAD -- apps/web/src/styles/globals.css | grep -oE 'var\(--ubm-[a-z0-9-]+\)' | sort -u
  grep -REn -- '--ubm-' apps/web/src/styles/tokens.css apps/web/src/styles/globals.css | grep -E '^\S+:\s*--ubm-' >/dev/null
  ```
- 合格基準: 追加 CSS が参照する全 `var(--ubm-*)` が `tokens.css` または `globals.css` の `:root` で定義済み（未定義トークン参照ゼロ）→ TECH-M-01 解決。
- 未定義トークンが見つかった場合は実装へ差し戻し（実トークン名へ置換）。

### Step 7: @layer ネスト整合の確認（回帰防止）

- 追加 CSS ブロックが既存 issue-276（`globals.css:2576` 付近）と**同一 `@layer` ネスト深さ**に配置されていることを目視確認する（I-4 / SSOT §3.3）。
- ネスト逸脱はカード化 CSS の適用漏れ・desktop への漏れを招くため、diff レビューで確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| SSOT | `outputs/shared-context.md` | AC-6〜AC-9・検証コマンド §7 |
| 設計レビュー | `phase-3-design-review.md` | MINOR TECH-M-01/02 起票 |
| デザイントークン | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本 |

## 実行手順

1. Step 1（design token gate / AC-6）を実行。
2. Step 2（targeted vitest / AC-7）を実行。
3. Step 3（typecheck / lint / AC-9）を実行。
4. Step 4（API 非接触 / AC-8）を実行。
5. Step 5（削除 PASS 基準 非該当）を明記。
6. Step 6（MINOR TECH-M-01 解決確認）を実行。
7. Step 7（@layer ネスト整合）を確認。
8. 結果を `outputs/phase-9/quality-report.md` に記録。

## 統合テスト連携

- AC-7 の vitest は Phase 4/6 で設計した TC-MT-21〜24 + 既存 TC-MT-01〜20 を対象とする。
- Playwright（F4）は Phase 11（VISUAL Evidence）で扱う。本 Phase では unit / lint / token / diff を機械ゲートとして締める。
- local implementation 段階では各コマンドは未実行（pending）であり、実装済み。追加 runtime 確認時に結果を quality-report に確定する。

## 多角的チェック観点（AIが判断）

- 品質系: 機械ゲート（token / vitest / typecheck / lint / diff）で false green を排除。主観評価に依存しない。
- リスク系: 削除なしのため import 孤児リスクなし。最大リスクは「desktop への CSS 漏れ」だが `@media (max-width:640px)` 内限定と Step 7 で抑止。
- 整合性系: AC-6（token）/ AC-7（test）/ AC-8（API非接触）/ AC-9（typecheck/lint）を 1 対 1 でコマンドに対応させ、抜けゼロ。

## サブタスク管理

| ID | 内容 | 対応AC | status（spec段階） |
| -- | ---- | ------ | ------------------ |
| QA-1 | design token gate | AC-6 | pending |
| QA-2 | targeted vitest | AC-7 | pending |
| QA-3 | typecheck / lint | AC-9 | pending |
| QA-4 | API 非接触 diff | AC-8 | pending |
| QA-5 | 削除 PASS 基準 非該当明記 | FB-UI-02-1 | n/a（削除なし） |
| QA-6 | MINOR TECH-M-01 解決確認 | TECH-M-01 | pending |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| 品質レポート | `outputs/phase-9/quality-report.md` |

## 完了条件

- [ ] AC-6（design token gate 緑・HEX/任意値混入ゼロ）確認。
- [ ] AC-7（既存 TC-MT-01〜20 + 追加 TC-MT-21〜24 緑）確認。
- [ ] AC-9（typecheck / lint 緑）確認。
- [ ] AC-8（`apps/api` / migration diff 空）確認。
- [ ] FB-UI-02-1（削除 PASS 基準 非該当）明記。
- [ ] MINOR TECH-M-01（実トークン名実在）grep 解決確認。
- [ ] @layer ネスト整合 確認。

## タスク100%実行確認【必須】

- [x] AC-6 検証手順を定義
- [x] AC-7 検証手順を定義
- [x] AC-8 検証手順を定義
- [x] AC-9 検証手順を定義
- [x] 削除 PASS 基準 非該当を明記
- [x] MINOR TECH-M-01 解決確認手順を定義

## 次Phase

[phase-10-final-review.md](phase-10-final-review.md) — AC/I 充足の最終判定。
