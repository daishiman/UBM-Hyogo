# Phase 13 — commit / PR / release

## 目的

実装完了後の PR 作成・staging seed 適用までの手順とドラフトを固定する。本タスクは **implemented_local_evidence_captured**。**commit / push / PR 作成 / staging seed 適用は全てユーザー承認後**にのみ実行する（user-gated）。本 Phase ではコードを変更せず、PR 本文ドラフトと検証コマンドを用意するに留める。

## 成果物

- 本ファイル（PR ドラフト + user-gated boundary 明記）。
- 実装済みのため `outputs/phase-13/pr-creation-result.md`（PR URL・採用ブランチ・実行した検証）を追加（Gate-C evidence）。

## user-gated boundary（必読）

以下は **すべてユーザー明示承認後** にのみ実行する。Claude Code は本 Phase で勝手に実行しない:

| 操作 | コマンド（参考） | gate |
| --- | --- | --- |
| commit | `git commit` | user 承認 |
| push | `git push -u origin feat/admin-identity-conflicts-clarity-and-meetings-rename` | user 承認 |
| PR 作成 | `gh pr create --base dev` | user 承認 |
| staging seed 適用 | `bash scripts/seed-identity-conflicts.sh --env staging --action apply` | user 承認 |
| screenshot 撮影（visual baseline） | visual pipeline 実行 | user 承認 |
| staging cleanup | `bash scripts/seed-identity-conflicts.sh --env staging --action cleanup` | user 承認 |

> production への seed 投入はラッパー内ガードで到達不可（local/staging 限定）。

## PR 本文ドラフト

### タイトル（案）

```
feat(admin): 会員の重複確認を非エンジニア向けに平易化 + サイドバー命名整理 + 重複候補 staging seed 5組
```

### 本文

#### 概要（4 concern）

1. **サイドバー命名整理**: `開催日`→`開催・出席管理`、`Identity重複`→`会員の重複確認`（id/href/icon 不変）。
2. **`/admin/identity-conflicts` の UI/UX 直感化**: 何ができる画面かをガイドで明示、操作（統合 / 別人として確定）を平易な文で説明。
3. **専門用語の非エンジニア向け平易化**: merge/source/target/email/matched/name/affiliation/canonical/PII/redaction を日本語化。`matchedFields` は glossary 経由で `氏名`/`職業` 表示。
4. **重複候補 staging seed（5 組）**: 専用 dataset を新設し、完全一致 / NFKC / trim / 別ゾーン / 同姓同名の 5 パターンを demonstrate。local/staging 限定・scoped cleanup。

#### 不変条件

- API 非変更（`apps/api/src/routes/admin/identity-conflicts.ts` / `packages/shared` 型 / レスポンス shape 不変）。日本語化は UI 表現層の adapter で吸収。
- D1 schema 非変更（seed は既存テーブルへ INSERT OR REPLACE のみ）。
- 色は `var(--ubm-color-*)` のみ（`verify:tokens` 緑）。

#### 検証コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
  apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts
node scripts/gen-identity-conflict-seed.mjs
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts
pnpm verify:phase12-compliance
```

#### スクリーンショット

> 実装済みのため撮影。canonical 名は [phase11-capture-metadata.json](./outputs/phase-11/phase11-capture-metadata.json) を参照。

- `sidebar-meetings-label-renamed.png`（プレースホルダ）
- `identity-conflicts-empty-jp.png`（プレースホルダ）
- `identity-conflicts-list-jp.png`（プレースホルダ）
- `identity-conflicts-merge-confirm-jp.png`（プレースホルダ）
- `identity-conflicts-dismiss-jp.png`（プレースホルダ）

#### 未タスク（baseline・Issue 化は user 判断）

- M-1: 内部 member_id の完全隠蔽
- M-2: `/admin/meetings` ページ本体 UX 改善
- 第二段階検出（電話・住所一致）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## 完了条件

- [ ] PR 本文ドラフト（4 concern サマリ / 検証コマンド / screenshot プレースホルダ）を用意した。
- [ ] commit / push / PR / staging seed 適用が user-gated である旨を明記した。
- [ ] base ブランチは `dev` である旨を記録した。
