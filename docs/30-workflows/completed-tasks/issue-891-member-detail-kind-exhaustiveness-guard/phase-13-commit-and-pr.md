# Phase 13: コミットと PR

## ブランチ

```bash
# 既存 feature branch を継続使用、もしくは新規作成
git checkout -b refactor/issue-891-member-detail-kind-exhaustiveness
```

## コミット粒度

1 PR 1 機能変更の方針に従い、原則 1 〜 2 コミットに収める。

- commit 1: adapter 改修 + spec 追加
- `apps/web/src/lib/adapters/member-detail.ts`
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`
- `apps/web/src/components/public/MemberDetail.tsx`
- 必要なら `apps/web/src/fixtures/public-member-profile.ts`
- commit 2（必要なら）: visual snapshot baseline 更新
  - `apps/web/playwright/visual/**` の baseline 画像
  - `outputs/phase-11/visual-diff-rationale.md`

## コミットメッセージ例

```
refactor(issue-891): member-detail adapter に KIND_ROUTE exhaustive guard を導入

- FieldKindZ 全 kind を satisfies Record で網羅的に分類
- DETAIL_KINDS を KIND_ROUTE から導出し allowlist 二重管理を解消
- normalizeField を route-aware にし、url は linkSections、consent/system/unknown は除外
- MemberDetail で linkSections を既存 MemberLinks へ接続
- adapter spec に網羅性 assert と分類除外ケース 6 件追加
- enum 拡張時のコンパイル fail / runtime fail 装置として機能

refs: #891 #827
```

## PR テンプレ

- base: `dev`
- title: `refactor(issue-891): member-detail kind 分類網羅性ガード`
- body:
  - Summary: 上記コミット概要
  - 影響: 公開会員 detail の `url` KV row はリンクセクションへ移動し、`consent` / `system` / `unknown` KV row は消える（意図的）
  - スクリーンショット: `outputs/phase-11/visual-diff-rationale.md` を参照
  - リスク: Phase 9 表
  - チェックリスト: Phase 8 DoD を貼り付け

## 実行禁止事項

- ユーザー指示前の `git commit` / `git push` / `gh pr create` は禁止
- visual baseline 更新コミットも user-gated
- `--no-verify` 使用禁止

## post-merge

- `docs/30-workflows/issue-891-member-detail-kind-exhaustiveness-guard/` を `docs/30-workflows/completed-tasks/` 配下へ移動
- 旧 followup spec (`docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md`) は本ワークフローで吸収済みのため削除
- stale 参照を全 docs/.claude 横断で grep し補修
- `mise exec -- pnpm indexes:rebuild` 実行
- `gate-metadata:validate` / `verify:phase12-compliance` 実行
