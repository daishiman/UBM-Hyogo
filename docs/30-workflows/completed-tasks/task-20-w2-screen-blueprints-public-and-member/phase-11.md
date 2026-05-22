# Phase 11 — 実装 smoke / 代替 evidence 取得（NON_VISUAL 縮約版）

実装区分: ドキュメントのみ実装（コード変更なし、09e / 09f 実体作成済）

> 元タスク: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-20-w2-par-screen-blueprints-public-and-member.md`
> Phase 11 種別判定: **NON_VISUAL（docs-only）**
> 出力先ベース: `docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-11/`

## 0. タスク種別判定

| 判定軸 | 値 | 根拠 |
|--------|----|----|
| `taskType` | `docs-only` | markdown 2 件の新規作成のみ。コード変更なし |
| `visualEvidence` | `NON_VISUAL` | UI 描画なし。spec 文書化のみ |
| `ui_routes` | `[]` | renderer / route の追加・変更なし |
| 採用テンプレ | docs-only NON_VISUAL 縮約テンプレ | `phase-template-phase11.md §docs-only / NON_VISUAL 縮約テンプレ` |

> **screenshot は生成禁止**（false green 防止）。代替 evidence として 5 種類の grep / lint / wc ログを取得する。

## 1. screenshot N/A 理由表

| screenshot 不要理由 | 詳細 |
|---------------------|------|
| UI コンポーネント追加・変更なし | `apps/web/src/app/**/page.tsx` を一切変更しない |
| renderer 描画パスへの影響なし | spec markdown のみ |
| Tailwind / OKLch token 非関連 | token 値は 09b owner（task-08）、本タスクは §番号 link のみ |
| ユーザ可視振る舞いの変更なし | 09e / 09f は実装根拠 spec、ランタイム挙動を変えない |

## 2. 必須 outputs（NON_VISUAL 縮約テンプレ準拠）

| ファイル | 役割 | 必須最小内容 |
|---------|------|-------------|
| `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL）/ 状態語彙 / 必須 outputs 一覧 / 状態語彙適用根拠 |
| `outputs/phase-11/manual-smoke-log.md` | smoke 実行記録 | 実行コマンド / 期待 / 実測 / PASS or FAIL を表形式で |
| `outputs/phase-11/link-checklist.md` | 仕様書 → 実装 / 後続 task 参照リンクの整合性 | 参照元 → 参照先 / 状態（OK / Broken）の表 |

## 3. 状態語彙

`main.md` 冒頭に次のいずれかを明記する:

- **`PASS_DOCS_ONLY_ARTIFACTS_SYNCED`**: 09e / 09f が新規作成済 + Phase 9/11 evidence 全 PASS + Phase 12 same-wave sync 完了
- **`FAIL_DOCS_ONLY_ARTIFACTS_DRIFT`**: 09e / 09f 実体、Phase 9/11 evidence、Phase 12 same-wave sync のいずれかが欠落または drift

`PASS` 単独表記は禁止。placeholder を許す PASS 語彙は使わず、`§TBD` が残る場合は `FAIL_DOCS_ONLY_ARTIFACTS_DRIFT` とする。

## 4. 代替 evidence（取得手順）

### 4.1 `outputs/phase-11/evidence/grep-visual-values.log`

```bash
F1=docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md
F2=docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md
EV=docs/30-workflows/task-20-w2-screen-blueprints-public-and-member/outputs/phase-11/evidence
mkdir -p "$EV"

{
  grep -nE '#[0-9a-fA-F]{3,8}\b' "$F1" "$F2" || true
  grep -nE 'oklch\(' "$F1" "$F2" || true
  grep -nE '\b[0-9]+px\b' "$F1" "$F2" || true
  grep -nE '\bbg-\[' "$F1" "$F2" || true
} > "$EV/grep-visual-values.log" 2>&1

if [ ! -s "$EV/grep-visual-values.log" ]; then
  echo "GREP_ZERO_HITS" > "$EV/grep-visual-values.log"
fi
```

期待: fenced JSX prototype 転記ブロックを除く仕様本文で `GREP_ZERO_HITS` が記録される（AC-9）。prototype 一字一句転記に含まれる既存 visual literal はこの gate の対象外。

### 4.2 `outputs/phase-11/evidence/grep-api-trace.log`

```bash
grep -hE '^\| (GET|POST|PATCH|DELETE) \|' "$F1" "$F2" \
  | sort -u > "$EV/grep-api-trace.log"
```

期待: 現行 API 正本の全 endpoint × method × route が出現（AC-10）。集合一致は `outputs/phase-11/evidence/grep-api-trace.log` で検証済。

### 4.3 `outputs/phase-11/evidence/grep-copy-text.log`

```bash
{
  echo "=== login 5 states ==="
  for S in input sent unregistered deleted error; do
    grep -nE "$S" "$F2" | head -3
  done
  echo "=== profile 4 areas ==="
  for R in banner summary request delete; do
    grep -nE "$R" "$F2" | head -3
  done
} > "$EV/grep-copy-text.log"
```

期待: login 5+1 状態 / profile 4 領域すべて hit（AC-6 / AC-7）。

### 4.4 `outputs/phase-11/evidence/markdown-lint.log`

```bash
mise exec -- pnpm lint:md "$F1" "$F2" \
  > "$EV/markdown-lint.log" 2>&1 || true
```

期待: error 0（warning は許容、AC-12）。

### 4.5 `outputs/phase-11/evidence/wc-lines.log`

```bash
wc -l "$F1" "$F2" > "$EV/wc-lines.log"
```

期待: 09e / 09f の実体が存在し、各対象画面と §99 が揃う（AC-1 / AC-2）。

## 5. `manual-smoke-log.md` 必須メタ

実行表テンプレ:

| # | 確認項目 | 実行コマンド | 期待 | 実測 | PASS/FAIL | evidence path |
|---|----------|--------------|------|------|-----------|---------------|
| 1 | 視覚値混入 0 件 | §4.1 grep | `GREP_ZERO_HITS` | （実値） | PASS | `evidence/grep-visual-values.log` |
| 2 | API trace 一致 | §4.2 grep | 現行 API 正本と集合一致 | （実値） | PASS | `evidence/grep-api-trace.log` |
| 3 | login 5+1 状態 / profile 4 領域 | §4.3 grep | 全 hit | （実値） | PASS | `evidence/grep-copy-text.log` |
| 4 | markdown validation | §4.4 | lint script 未定義時は代替証跡 | （実値） | PASS_WITH_SUBSTITUTION | `evidence/markdown-lint.log` |
| 5 | 実体 / 行数 | §4.5 | 09e / 09f 実体あり、行数記録済 | （実値） | PASS | `evidence/wc-lines.log` |

その他必須メタ:

- 証跡の主ソース: §4.1 視覚値 0 件（AC-9）
- screenshot 不在理由: `NON_VISUAL`（docs-only）
- 実行日時 / 実行者（worktree branch 名）
- 各 evidence ファイルへの相対 path

## 6. `link-checklist.md` 必須項目

| 参照元 | 参照先 | 状態 |
|--------|--------|------|
| 元タスク §3 変更対象ファイル表 | `09e-screen-blueprints-public.md` 実体 | OK / Broken |
| 元タスク §3 変更対象ファイル表 | `09f-screen-blueprints-member.md` 実体 | OK / Broken |
| 09e §X.1 prototype 行範囲 | `pages-public.jsx` L4-L154 / L208-L338 / L339-L472 | OK / Broken |
| 09f §X.1 prototype 行範囲 | `pages-member.jsx` L4-L67 / L220-L373 | OK / Broken |
| 09e / 09f §X.4 API 表 | 現行 API 正本 endpoint 集合 | OK / Broken |
| 09e / 09f §X.7 link | 09a / 09b / 09c / 09d §番号 | OK / Broken / Placeholder |
| 後続 task-11..14 | 09e / 09f §X 参照 | OK / Broken |

## 7. 完了条件（Phase 11 close 条件）

- [ ] `outputs/phase-11/main.md` 作成済（状態語彙明記）
- [ ] `outputs/phase-11/manual-smoke-log.md` 作成済（5 行 PASS）
- [ ] `outputs/phase-11/link-checklist.md` 作成済（全行 OK）
- [ ] `outputs/phase-11/evidence/` 配下に主要 evidence ファイル存在（`grep-visual-values.log` / `grep-api-trace.log` / `grep-copy-text.log` / `grep-section-count.log` / `grep-invariants.log` / `placeholder.log` / `markdown-lint.log` / `wc-lines.log`）
- [ ] screenshot 系ファイル（`screenshot-plan.json` / `*.png`）を **生成していない**

> Phase 11 は Phase 12 ドキュメント更新の前段。本 phase 完了後に Phase 12 へ進む。
