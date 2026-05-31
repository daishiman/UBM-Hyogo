# Phase 13: PR作成 — AdminFetchError typed class

**[実装区分: 実装仕様書]**

> **重要: 本 Phase は user の明示承認後のみ実施する。本仕様書作成サイクルでは実行しない。**
> Phase 13 status = `pending`。`gh pr create` / `git commit` / `git push` はすべて user-gated。

## 1. 前提ゲート（PR 作成前に全通過必須）

| ゲート | 内容 | 確認元 |
| --- | --- | --- |
| Gate-A | 要件・設計・テスト仕様確定（Phase 1-4） | `artifacts.json` Gate-A passed |
| Gate-B | 実装 + リファクタリング + 品質保証（Phase 5-9）green | `artifacts.json` Gate-B passed |
| Gate-C | 手動テスト（focused vitest）+ 最終レビュー + ドキュメント（Phase 10-12） | `artifacts.json` Gate-C passed |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` error 0 | Phase 9 |
| lint | `mise exec -- pnpm lint` violation 0 | Phase 9 |
| focused vitest | 新規 `admin-fetch-error.spec.ts` + regression 5 spec green | Phase 11 manual-test-result.md |

## 2. PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md「PR作成の完全自律フロー」既定。`main` は production リリース時のみ） |
| 作業ブランチ | `feat/admin-fetch-error-typed-class`（差分主題から自律命名） |
| タイトル案 | `feat(admin): AdminFetchError typed class で 404/500 切り分け強化 (#991)` |
| Issue リンク方針 | **`Refs #991`** を使用。**`Closes #991` は使わない**（Issue #991 は CLOSED 維持。PR マージで reopen → 再 close の往復を起こさない） |

## 3. PR 本文に含める要素

```
## 概要
admin API 呼び出し失敗を untyped `Error` から `AdminFetchError extends Error` に置換し、
`status` / `path` / `responseBodySnippet`（≤500）を構造化フィールドで提供。
共通正規化レイヤー（safe-fetch.ts）は構造化 status を優先利用し、未提供時は既存正規表現 fallback を維持。
404 / 500 を message 正規表現 parse なしで構造的に区別できるようにする observability 改善（NON_VISUAL）。

## Issue #991 を現状コードに最適化した点
- **message byte-identical 維持**: Issue 記述の「body なし format」ではなく、現状の実 message
  （`admin api ${path} failed: ${status} body=${body.slice(0,256)}`）を正本と再定義。
  `server-fetch.binding.spec.ts:89/101` の既存 assertion を壊さない。
- **二重 read 回避**: body は error path で既に 1 回だけ read 済みのため `Response.clone()` 不要。
  read 済み text を再利用（read 回数不変）。
- message suffix は後方互換で 256 文字、`responseBodySnippet` フィールドは AC 通り ≤500 文字の独立スライス。

## 変更ファイル
- `apps/web/src/lib/admin/server-fetch.ts`（修正: AdminFetchError + isAdminFetchError export、error path throw 置換）
- `apps/web/src/lib/server-fetch/safe-fetch.ts`（修正: statusFromError 抽出、構造化優先 + 正規表現 fallback）
- `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts`（新規）
- `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（修正: TC-SF-STATUS）
- consumer `apps/web/src/lib/admin/safe-server-fetch.ts` は不変 / `apps/api` 変更なし

## テスト結果
- 新規 admin-fetch-error.spec.ts: green（typed throw / fields / message byte-identical / 256 vs 500 / type guard）
- regression 5 spec（binding / safe-server-fetch / 404-vs-401 / env / safe-fetch）: green
- typecheck / lint: green

## Issue 状態
Issue #991 は CLOSED 維持。本 PR で reopen しない（`Refs #991` のみ使用）。

Refs #991

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` にスクリーンショット画像は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションを作らない。

## 4. 実行手順（user 承認後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `feat/admin-fetch-error-typed-class` を作成し `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` で全差分コミット → `git push`。
5. `gh pr create --base dev` で作成（本文は §3）。

## 5. 完了条件（Phase 13）

- [ ] user の明示承認を取得（承認まで実行しない）
- [ ] Gate-A/B/C 全通過 + typecheck / lint / focused vitest green を確認
- [ ] base = `dev`、タイトル = §2 案、本文 = §3（`Refs #991` のみ・`Closes #991` 不使用）
- [ ] スクリーンショットセクションを作らない（NON_VISUAL）
- [ ] PR URL を最終レポートに記録
- [ ] Phase 13 status = `pending`（承認待ち）
