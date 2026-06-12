---
spec_classification: implementation_spec
state: spec_created
phase: 9
phase_name: 品質保証
task_id: public-member-common-ui-card-unification
---

# Phase 9: 品質保証

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 対象 | AC-3 / AC-4 / AC-5 / AC-7 / AC-8 / AC-9 / AC-10 の機械検証 |
| 方針 | 各 AC を grep / コマンドで機械判定し、PASS 基準を明示する |

---


## 目的

AC-3/4/5/8/9 を grep・コマンドで機械検証し、typecheck/lint/build/vitest を一括判定する。

## AC 別 機械検証 grep / コマンド一覧

> 全コマンドはリポジトリルートで実行する。`apps/web/app` は Next.js の app ルート、`apps/web/src` はコンポーネント/スタイル群。

### AC-3: ボタン直書き 0（`<a data-variant>` / `.ui-button-*` クラス直書きの撤去）

```bash
# (1) <a data-variant=...> 直書きが 0 件（ButtonLink/Button 実装ファイル自身は除外）
grep -rn 'data-variant=' apps/web/app apps/web/src/components/public apps/web/src/app \
  --include='*.tsx' \
  | grep -v 'components/ui/ButtonLink.tsx' \
  | grep -v 'components/ui/Button.tsx'
# → ヒット 0 行で PASS（ボタンの data-variant は ButtonLink/Button 経由のみ）

# (2) .ui-button-* クラス直書きが TSX/TS で 0 件（CSS 定義ファイルは対象外）
grep -rn 'ui-button-' apps/web/app apps/web/src \
  --include='*.tsx' --include='*.ts' \
  | grep -v 'components/ui/ButtonLink.tsx' \
  | grep -v 'components/ui/Button.tsx'
# → ヒット 0 行で PASS
```

- **PASS 基準**: (1)(2) ともにヒット 0 行。アンカー型ボタンは全て `ButtonLink`、button 要素は全て `Button` 経由。

### AC-4: ベタ書き div 情報グループ 0（全情報のカード化）

```bash
# (1) 旧 .page-head が TSX で 0 件（PageHeader へ移行済み・CSS 定義除外）
grep -rn 'page-head' apps/web/app apps/web/src --include='*.tsx'
# → ヒット 0 行で PASS

# (2) LegalProse の live import が 0 件（Prose 縮退済み）
grep -rn 'import.*LegalProse' apps/web/src apps/web/app --include='*.tsx'
# → ヒット 0 行で PASS（削除採用時。stub 化採用時は装飾 0 を別途確認）

# (3) MemberDetailSections の dl ベタ書きが SectionCard+KVList へ移行済み（目視 + spec）
grep -rn '<dl' apps/web/src/components/public/MemberDetailSections.tsx
# → ヒット 0（KVList 経由化）。残存時は Phase 10 のマッピング表 traced で個別判定
```

- **PASS 基準**: (1)(2) ヒット 0。(3) は dl ベタ書き撤去（KVList 経由化）。最終判定は Phase 10 のカード化マッピング表 全行 traced で行う。

### AC-5: 背景・最大幅・余白が PageShell に集約（各 page/layout の個別背景指定撤去）

```bash
# 各 page.tsx / layout.tsx の背景・最大幅の個別指定（feature class / Tailwind 任意値）が残っていないか
grep -rnE 'bg-\[|max-w-\[|min-h-screen|background:' \
  apps/web/app/\(public\) apps/web/app/\(member\) apps/web/app/\(auth\) \
  --include='*.tsx'
# → 背景/最大幅の直接指定がヒット 0（PageShell の data-bg / data-max-width 経由のみ）で PASS
```

- **PASS 基準**: 8画面の page/layout に背景・最大幅の直接指定（`bg-[...]` / `max-w-[...]` / inline `background:`）が 0。背景・枠は `PageShell` の `data-bg` / `data-max-width` に集約。

### AC-8: HEX 直書き 0 / inline style 0

```bash
# (1) トークン正本検査（OKLch・HEX 直書き fail 判定）
mise exec -- pnpm verify:tokens

# (2) 新規 CSS の HEX 直書きが 0 件（layout-primitives.css）
grep -rnE '#[0-9a-fA-F]{3,6}' apps/web/src/styles/layout-primitives.css
# → ヒット 0 行で PASS（全て var(--ubm-*) 参照）

# (3) inline style 禁止 gate
mise exec -- pnpm verify:no-inline-style
```

- **PASS 基準**: (1)(3) exit 0、(2) ヒット 0 行。新層 CSS は全て `var(--ubm-*)` トークン参照。

### AC-9: apps/api 変更 0

```bash
# dev からの差分で apps/api 配下の変更ファイル数が 0
test "$(git diff --name-only dev...HEAD | grep '^apps/api/' | wc -l | tr -d ' ')" = "0" \
  && echo "AC-9 PASS: apps/api 変更 0" \
  || { echo "AC-9 FAIL: apps/api に変更あり"; git diff --name-only dev...HEAD | grep '^apps/api/'; }
```

- **PASS 基準**: `apps/api/` 配下の変更ファイル数 == 0（I-1 / I-5）。

### AC-7: 既存 機械可読 ID 保持（既存 spec GREEN）

```bash
# 既存 component spec が移行後も GREEN（data-testid/aria-label/role 保持）
mise exec -- pnpm --filter @ubm/web test
# → 既存 public/member/auth の component spec が全 PASS で AC-7 PASS
```

- **PASS 基準**: 移行対象8画面の既存 component spec が全て GREEN（移行で selector を壊していない）。

---

## typecheck / lint / build / vitest 一括判定（AC-10）

```bash
# 1. 依存整合
mise exec -- pnpm install

# 2. 型チェック（新プリミティブの props 型・index barrel の re-export 整合）
mise exec -- pnpm typecheck

# 3. lint（verify:no-inline-style / lint-boundaries を含む）
mise exec -- pnpm lint

# 4. トークン検査
mise exec -- pnpm verify:tokens

# 5. apps/web vitest（新プリミティブ spec + 既存 component spec）
mise exec -- pnpm --filter @ubm/web test

# 6. OpenNext Workers 互換 webpack build
mise exec -- pnpm build
```

| ステップ | PASS 基準 |
|---------|----------|
| typecheck | exit 0（型エラー 0） |
| lint | exit 0（no-inline-style / boundaries 含め違反 0。`pnpm lint --fix` で自動修復後の手修正可） |
| verify:tokens | exit 0（HEX 直書き 0 / OKLch 正本整合） |
| vitest（apps/web） | 全 spec GREEN（新プリミティブ spec + 既存 component spec / AC-7・AC-11） |
| build | exit 0（webpack build 成功・`[project]/...` 仮想 module 混入なし） |

> いずれか FAIL の場合は最大3回まで自動修復（unused import / 型注釈漏れ / lint --fix / inline style → CSS クラス化）を試み、修復差分を記録してから再実行する。

---

## ファイル削除 / mirror parity の扱い

- **mirror parity は対象外**: 本タスクは skill mirror（`.claude/skills` / `.agents/skills`）に該当しないため、mirror byte-identical 検証は実施しない。
- **ファイル削除の PASS 基準**（[FB-UI-02-1]）: `LegalProse.tsx` 等の廃止対象は次のいずれかで PASS とする。
  - **git delete**: ファイル削除 + `grep -rn 'import.*LegalProse' apps/web/src apps/web/app` がヒット 0。
  - **stub 化 + live import 0**: 中身を `Prose` の薄いラッパに置換し、装飾の重複が 0（live import は許容）。

```bash
# 削除採用時の最終確認
git diff --name-status dev...HEAD | grep '^D' | grep -i 'LegalProse'   # D（削除）として記録されている
grep -rn 'import.*LegalProse' apps/web/src apps/web/app --include='*.tsx'  # → 0 行
```

---

## QA サマリ判定表

| AC | 検証手段 | PASS 基準 |
|----|---------|----------|
| AC-3 | grep `data-variant=` / `ui-button-` | TSX/TS でヒット 0（実装ファイル除外） |
| AC-4 | grep `page-head` / `LegalProse` import / `<dl` | ヒット 0（+ Phase 10 マッピング traced） |
| AC-5 | grep `bg-[` / `max-w-[` / `background:` | 8画面 page/layout でヒット 0 |
| AC-7 | apps/web vitest | 既存 component spec 全 GREEN |
| AC-8 | verify:tokens / grep HEX / verify:no-inline-style | exit 0 / ヒット 0 |
| AC-9 | git diff `^apps/api/` count | 0 |
| AC-10 | typecheck/lint/build/vitest | 全 exit 0 / 全 GREEN |

---

## 実行タスク

1. AC-3/4/5/8/9 の grep・コマンドを順に実行し、各 PASS 基準を満たすことを確認する。
2. AC-10 の一括判定6コマンドを実行し、全 exit 0 / 全 GREEN を確認する。FAIL は最大3回自動修復。
3. ファイル削除（LegalProse 等）を「git delete OR stub化 + live import 0」の PASS 基準で確定する。
4. QA サマリ判定表を埋め、未達 AC を Phase 10 のブロッカー判定へ申し送る。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-3..AC-10 の定義 |
| リファクタ | `phase-8-refactor.md` | 廃止クラス・LegalProse 縮退の grep 方針 |
| 検証コマンド | `index.md` §7 | 検証コマンド正本 |
| gate | `scripts/verify-design-tokens.ts` / lint config | verify:tokens / no-inline-style / boundaries |

---


## 成果物

- `phase-9-qa.md`（機械検証 grep・コマンド一覧 / PASS 基準 / apps/api 変更0 検証）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] AC-3/AC-4/AC-5/AC-8/AC-9 が機械 grep/コマンドで PASS。
- [ ] AC-10 の typecheck/lint/build/vitest が全て exit 0 / 全 GREEN。
- [ ] AC-7（既存 spec GREEN）と AC-11（新プリミティブ spec GREEN）が確認済み。
- [ ] 廃止ファイルが「git delete OR stub化 + live import 0」で PASS。mirror parity は対象外と明記。
