# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

`outputs/phase-05/runbook.md` と `devtools-snippets.md` で session 確立 → screenshot 取得 → DevTools 観測 → 命名保存 → secret hygiene check を再現可能な手順化する。

## runbook 構成（`outputs/phase-05/runbook.md`）

### Part A: local fixture（M-08〜M-10）

```bash
# 0. 依存
mise install
mise exec -- pnpm install

# 1. apps/api / apps/web の起動
mise exec -- pnpm --filter @ubm-hyogo/api dev   # :8787
mise exec -- pnpm --filter @ubm-hyogo/web dev   # :3000

# 2. magic link mock で session 確立
#    （local fixture 経路: 05b の dev-only magic link 受信）
#    ブラウザで http://localhost:3000/login → メール mock 経由で session cookie 取得

# 3. /profile 観測（M-08）
#    Chromium で http://localhost:3000/profile を開き、
#    DevTools "Capture full size screenshot" → M-08-profile.png として保存

# 4. DOM 観測（M-09）
#    DevTools console で snippet-no-form.js を実行 → 出力をコピー
#    M-09-no-form.devtools.txt に保存
#    同じ画面で screenshot → M-09-no-form.png

# 5. ?edit=true 観測（M-10）
#    URL を /profile?edit=true に変更（reload）
#    snippet-no-form.js 実行 → M-10-edit-query-ignored.devtools.txt
#    screenshot → M-10-edit-query-ignored.png
```

### Part B: staging（M-14〜M-16）

```bash
# 1. staging URL（Phase 10 GO 時点で確認）
#    例: https://web-staging.ubm-hyogo.workers.dev

# 2. staging magic link 実発行で session 確立
#    /login → メール受信 → cookie 取得

# 3. /profile, /profile?edit=true で M-14, M-15, M-16 を上記同手順で取得
```

### Part C: secret hygiene check

```bash
cd docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/outputs/phase-11/evidence

# devtools.txt に token/cookie/authorization が含まれないことを確認
grep -iE '(token|cookie|authorization|bearer|set-cookie)' screenshot/*.devtools.txt && echo 'FAIL' || echo 'PASS'

# diff にも同様
grep -iE '(token|cookie|authorization|bearer)' manual-smoke-evidence-update.diff && echo 'FAIL' || echo 'PASS'
```

### Part D: manual-smoke-evidence.md 更新

```bash
# 親 06b workflow の manual-smoke-evidence.md の M-08〜M-10、M-14〜M-16 行を
#  pending → captured に書き換え
# diff を outputs/phase-11/evidence/manual-smoke-evidence-update.diff に保存
git diff -- docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/manual-smoke-evidence.md \
  > docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/outputs/phase-11/evidence/manual-smoke-evidence-update.diff
```

## DevTools snippets（`outputs/phase-05/devtools-snippets.md`）

```js
// snippet-no-form.js
const sel = 'form, input, textarea, button[type=submit]';
const list = document.querySelectorAll(sel);
console.log(JSON.stringify({
  url: location.pathname + location.search,  // host を含めない
  selector: sel,
  count: list.length,
  outerHTML_first: list[0]?.outerHTML ?? null,
  timestamp: new Date().toISOString()
}, null, 2));
```

注意:
- `location.href` ではなく `location.pathname + location.search` を採用（host を evidence に残さない）
- Cookie / localStorage / sessionStorage は **出力しない**
- `outerHTML_first` は count > 0 の異常系で snippet が役立つようデバッグ補助として残す（通常は `null`）

## OAuth client / runbook 整合性

session 経路は 05a/05b の既存 runbook を継承し、本タスクで新規 client / token は **追加しない**。

## 実行タスク

- [ ] `outputs/phase-05/main.md` 配置（runbook 概要）
- [ ] `runbook.md` 配置（Part A〜D）
- [ ] `devtools-snippets.md` 配置
- [ ] secret hygiene grep を runbook に明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | session |
| 必須 | outputs/phase-02/session-flow.mmd | フロー図 |
| 必須 | outputs/phase-04/evidence-checklist.md | 11 件チェック |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 異常系の対応 |
| Phase 9 | secret hygiene gate |
| Phase 11 | runbook 実行 |

## 完了条件

- [ ] runbook.md 配置（Part A〜D）
- [ ] devtools-snippets.md 配置
- [ ] secret hygiene grep を明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: runbook 実行で起き得る failure case の列挙
