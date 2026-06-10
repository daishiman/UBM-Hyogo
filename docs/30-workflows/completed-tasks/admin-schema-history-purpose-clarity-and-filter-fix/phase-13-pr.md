# Phase 13: PR作成

[実装区分: 実装仕様書]

> 本フェーズは **user の明示承認後のみ実施**。本タスクは `implemented_local_evidence_captured` であり、apps/web 実装と local deterministic evidence は完了済み。commit / push / PR 作成、staging deploy、認証越し screenshot 取得は user 承認後に行う。Claude Code は本セクションを案として提示するに留め、無断で commit / push / PR 作成を行わない。

---

## 0. 前提

| 項目 | 値 |
|------|-----|
| slug | `admin-schema-history-purpose-clarity-and-filter-fix` |
| branch | `feat/admin-schema-history-purpose-and-filter-fix` |
| base | `dev`（`origin/dev` tip `21b64ef2a` に整合済み） |
| workflow_state | `implemented_local_evidence_captured` |

---

## 1. commit message 案

```
fix(web): /admin/schema/history の batchId フィルタ500を根治し用途明確化UI+カード表示へ整合

- Lane A: AppliedFiltersZ に batchId: z.string().nullable() を追加し
  unrecognized_keys ZodError を根治（apps/web 表現層のみ・API 無罪）
- Lane B: formatSchemaHistoryError 純関数で raw JSON を日本語メッセージへ変換、
  .schema-history-error クラス（OKLch token）でalert整形
- Lane C: SchemaHistoryPurposeExplainer + schemaHistoryGlossary で目的説明UI追加、
  page title/description を平易化
- Lane D: 履歴を <table> からプロトタイプ ALIAS HISTORY カード形式へ整合
- Lane E: batchId parse 回帰 / human-readable error / card / explainer / glossary 回帰 spec

apps/api / D1 / Google Form 非接触（git diff origin/dev...HEAD -- apps/api 空）

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## 2. PR title 案（base dev）

```
fix(web): /admin/schema/history batchId フィルタ500根治 + 用途明確化UI + カード表示整合
```

---

## 3. push / PR 手順（user 承認後のみ）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. `feat/admin-schema-history-purpose-and-filter-fix` に戻り `git merge dev`（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証 4 コマンド:
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
4. `git add -A && git commit`（上記 commit message 案）。
5. `git push -u origin feat/admin-schema-history-purpose-and-filter-fix`。
6. `gh pr create --base dev`（本文に implementation-guide.md の主要見出しと Phase 11 screenshot 参照を反映）。

---

## 4. PR 本文に含める内容

- 概要（SSOT §1 ユーザー報告 + §2 真因 RC-1〜RC-4）
- Lane A〜E の変更ファイル一覧（`outputs/phase-12/implementation-guide.md` 準拠）
- AC-1〜AC-10 のチェック結果
- スクリーンショット参照（`outputs/phase-11/screenshots/admin-schema-history-purpose-and-card.png` / `admin-schema-history-error-message.png`・実装後取得）

---

## 5. user-gated 明記

- commit・push・PR 作成・staging deploy・screenshot 取得は **すべて user の明示承認後のみ**。
- apps/web 実装と local deterministic evidence は完了済み。staging screenshot 2 件は Phase 11 の user-gated 証跡として残す。
