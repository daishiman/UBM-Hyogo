# Phase 11: 手動テスト

[実装区分: 実装仕様書]

> SSOT: `docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen/shared-context.md`
> 本サイクルは `implemented_local_evidence_captured`（local evidence 取得済み）。authenticated staging screenshot は未取得で、capture 計画（`staging_visual_pending_user_gate`）として記述する。focused test / 手動テスト手順は本サイクルで実行した。

---

## 目的

`/admin/tag-master`（タグ定義）と `/admin/tags`（タグ割当）の 2 画面に対し、(1) タグ定義フォームのコード自動生成、(2) 2 画面の役割・関係を説明するガイド UI と相互リンク、(3) サイドバー label 「タグキュー」→「タグ割当」の命名統一、(4) 非エンジニア向け文言平易化が、実装後に意図どおり描画・動作することを 3 層（Semantic / Visual / AI UX）で評価するための Phase 11 計画を定義する。

---

## 実行タスク

- 本サイクルで focused unit / component spec を実行し、`generateTagCode` / `getTagTerm` / `TagManagementGuide` / コード自動補完・手動上書きの挙動を検証する（SSOT §11 検証コマンド）。
- 本サイクルで canonical screenshot 2 点（`tag-definition-code-autogen.png` / `tag-assignment-guide-and-rename.png`）を取得する（user-gated）。
- 3 層評価（Semantic / Visual / AI UX）の観点で AC-1〜AC-12 を確認する。
- 実機テスト手順（user-gated）に従い staging 反映後の挙動を確認する。
- `git diff origin/dev...HEAD -- apps/api` が空（API/D1/Form 不変）であることを確認する。

---

## 参照資料

- SSOT: `shared-context.md` §6（関数シグネチャ）/ §8（AC）/ §10（capture 方針）/ §11（検証コマンド）
- `apps/web/src/components/admin/TagDefinitionCreateForm.tsx`（C1 編集対象）
- `apps/web/src/components/admin/TagManagementGuide.tsx`（C3 新規）
- `apps/web/src/lib/admin/tagCodeAutogen.ts` / `tagManagementGlossary.ts`（C1/C3 新規）
- `apps/web/src/components/shell/shell-config.ts`（C2 命名統一）

---

## 成果物

- `outputs/phase-11/manual-test-result.md`（spec-only root・Phase 11 evidence inventory = `n/a`）
- `outputs/phase-11/screenshot-plan.json`（mode VISUAL・capture 予定 2 点・`status: staging_visual_pending_user_gate`）
- `outputs/phase-11/phase11-capture-metadata.json`（`status: staging_visual_pending_user_gate`・canonical screenshot 名 + 各 state 説明）

---

## 統合テスト連携

- focused vitest（SSOT §11）= `tagCodeAutogen.spec.ts` / `tagManagementGlossary.spec.ts` / `TagManagementGuide.component.spec.tsx` / `TagDefinitionCreateForm.component.spec.tsx` を本サイクルで実行した。
- `verify:tokens`（HEX 直書き 0 件）/ `git diff -- apps/api` 空 を gate として連携する。
- 既存タグ管理 spec（`TagDefinitionPanel.component.spec.tsx` 等）の DOM contract（testid / role / aria）を破壊しない回帰確認を含める。

---

## 3 層評価（本サイクルで判定する観点）

### Semantic 評価（機能・データ整合）

- AC-1: 表示名入力で `code` 欄が `generateTagCode(label)` の値で自動補完される。
- AC-2: コード欄を手動編集後（`codeDirty=true`）は表示名変更で自動上書きされない。
- AC-3: `generateTagCode` の返り値が常に `TAG_CODE_PATTERN` に一致する（空 / 日本語 / 記号のみ / 長文の全分岐）。
- AC-8: `TAG_MANAGEMENT_GLOSSARY` に必須キーが揃い `getTagTerm` が lookup できる。
- AC-10: `apps/api` に差分がない。

### Visual 評価（レイアウト・トークン）

- AC-4: コード欄に「表示名から自動生成（編集可）」ヒントと自動生成中の状態表示がある。
- AC-6/AC-7: 各画面冒頭に `TagManagementGuide`（variant 別）と相互リンクが圧迫感なく表示される。
- AC-11: HEX 直書き 0 件（OKLch token のみ）。

### AI UX 評価（情報設計・用途明確化）

- AC-5: サイドバー label が「タグ割当」になり、ページ内タイトル「タグ割当」と一致する。
- AC-9: 技術文言（"tag master API" 等）が非エンジニア向け平易文に置換される。
- 2 画面の責務（定義 = 語彙を決める / 割当 = メンバーに付与）が非エンジニアに伝わる。

---

## screenshot（canonical 名・staging visual user-gated）

| canonical 名 | 内容 | 対応 AC | status |
|------|------|---------|--------|
| `tag-definition-code-autogen.png` | タグ定義画面: 表示名入力でコード自動補完 + 自動生成ヒント + `TagManagementGuide variant="definition"` | AC-1 / AC-4 / AC-6 | staging_visual_pending_user_gate |
| `tag-assignment-guide-and-rename.png` | タグ割当画面: `TagManagementGuide variant="assignment"` + サイドバー「タグ割当」表示 + 相互リンク | AC-5 / AC-7 | staging_visual_pending_user_gate |

### Local auth-gate screenshot（対象 UI ではない）

| file | 内容 | 判定 |
|------|------|------|
| `outputs/phase-11/screenshots/local-auth-gate-tag-master.png` | local dev `/admin/tag-master` は管理者ログイン画面へ遷移 | canonical UI screenshot ではない |
| `outputs/phase-11/screenshots/local-auth-gate-tags.png` | local dev `/admin/tags` は管理者ログイン画面へ遷移 | canonical UI screenshot ではない |

---

## 実機テスト手順（user-gated）

1. staging へ deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）= user-gated。
2. `/admin/tag-master` を認証越しで開き、表示名を入力するとコード欄が自動補完されること、コード手動編集後は自動上書きされないこと、ガイドと `/admin/tags` への相互リンクが表示されることを確認する。`tag-definition-code-autogen.png` を取得 = user-gated。
3. `/admin/tags` を開き、サイドバー label が「タグ割当」でページ内タイトルと一致すること、ガイド（variant="assignment"）と `/admin/tag-master` への相互リンクが表示されることを確認する。`tag-assignment-guide-and-rename.png` を取得 = user-gated。
4. DevTools console / 画面で技術文言が平易日本語に置換されていることを確認する。

---

## 完了条件

- [x] focused unit / component spec がPASS する（AC-1〜AC-4 / AC-8）。
- [ ] canonical screenshot 2 点（`tag-definition-code-autogen.png` / `tag-assignment-guide-and-rename.png`）は staging deploy/auth user-gated として取得待ち。
- [x] 3 層評価（Semantic / Visual / AI UX）の観点で AC-1〜AC-12 を local deterministic evidence で確認する。
- [x] `verify:tokens` PASS（HEX 直書き 0 件）/ `git diff -- apps/api` 空 を確認する。
- [x] 既存タグ管理 spec の DOM contract を破壊しない回帰を確認する。
