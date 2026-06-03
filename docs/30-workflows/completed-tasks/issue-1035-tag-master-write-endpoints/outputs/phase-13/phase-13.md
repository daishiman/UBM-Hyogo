# Phase 13: commit-pr-release — tag master (tag_definitions) write endpoints

**[実装区分: 実装仕様書]**

> **重要: 本 Phase は user の明示承認後のみ実施する。本仕様書作成サイクルでは実行しない。**
> Phase 13 status = `pending`。`git commit` / `git push` / `gh pr create` はすべて user-gated。
> local 実装・focused tests・typecheck・lint・正本 spec 更新は完了済み。本 Phase の commit / push / PR だけが user-gated。

## 1. 本サイクルでの実行範囲

- 本サイクルでは **commit / push / PR を一切行わない**。
- local 成果物は `apps/api` 実装、focused tests、正本 API spec、workflow strict 7。
- PR 作成時は Gate-A/B/C passed の local evidence を本文に転記する。

## 2. 前提ゲート（実装サイクルで PR 作成前に全通過必須）

| ゲート | 内容 | 確認元 |
| --- | --- | --- |
| Gate-A | 要件・設計・テスト仕様確定（Phase 1-4） | passed |
| Gate-B | 実装 + リファクタリング + 品質保証（Phase 5-9）green | passed |
| Gate-C | 手動テスト（targeted vitest）+ 最終レビュー + ドキュメント（Phase 10-12） | passed |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` error 0 | passed |
| lint | `mise exec -- pnpm lint` exit 0 | passed |
| targeted vitest | 4 files / 32 tests | passed |

## 3. 想定 PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md「PR作成の完全自律フロー」既定。`main` は production リリース時のみ） |
| 作業ブランチ | `feat/issue-1035-tag-master-write-endpoints`（差分主題から自律命名） |
| タイトル案 | `feat(admin): tag master (tag_definitions) CRUD endpoints 新設 (#1035)` |
| Issue リンク方針 | **`Refs #1035`** を使用。**`Closes #1035` は使わない**（Issue #1035 は CLOSED 維持。reopen → 再 close の往復を起こさない） |

## 4. 想定 PR 本文骨子

```
## 概要
tag master (tag_definitions) への管理者 CRUD endpoint を新設（第3 write 経路）。
- GET /admin/tags（pagination + search、inactive 含む）
- POST /admin/tags（作成、code 衝突 → 409 tag_code_conflict）
- PATCH /admin/tags/:tagId（label/category 更新、code immutable）
- DELETE /admin/tags/:tagId（論理削除 active=0、member_tags 保持）
audit admin.tag.created/updated/deactivated（targetType tag）を state 変化時のみ記録。
NON_VISUAL（API only）。

## Issue #1035 を現状コードに最適化した点
- 既存不変条件 #13（member_tags write 2 経路）は tag master 自体の write 対象外だった。
  本 PR で tag master CRUD を第3経路として追加し、tagDefinitions.ts コメントと
  specs/01-api-schema.md の両方で不変条件 #13 を同期再定義。
- code は immutable に確定（PATCH は label/category のみ）。member_tags 参照整合維持 + 409 churn 回避。
- 論理削除は active=0。deactivated tag は available から消えるが assigned は保持（AC-3）。
  既存 GET /admin/members/:memberId/tags の surface は不変（AC-7 regression なし）。
- D1 migration 不要（active カラムは migration 0002 で既存）。

## 変更ファイル
- apps/api/src/repository/tagDefinitions.ts（write 3 + read 2 関数追加、不変条件 #13 コメント改訂）
- apps/api/src/repository/auditLog.ts（AuditTargetType に "tag" 追加）
- apps/api/src/routes/admin/tags.ts（新規: CRUD route）
- apps/api/src/index.ts（adminTagsRoute mount）
- docs/00-getting-started-manual/specs/01-api-schema.md（不変条件 #13 第3経路節）
- apps/api/src/routes/admin/tags.contract.spec.ts（新規）
- apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts（新規）

## テスト結果
- 新規 tags.contract.spec.ts / tagDefinitions.write.repository.spec.ts: green
- regression（members.tags.contract.spec.ts / auditLog.repository.spec.ts）: green
- typecheck / lint: green

## Issue 状態
Issue #1035 は CLOSED 維持。本 PR で reopen しない（Refs #1035 のみ使用）。

Refs #1035

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` にスクリーンショット画像は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションを作らない。

## 5. 想定コミット分割

| # | 範囲 | 内容 |
| --- | --- | --- |
| commit 1 | 実装コード（apps/api） | repository write/read 関数 + audit 型 + 新規 route + index.ts mount + 新規 spec test。実装サイクルで作成 |
| commit 2 | 正本 spec | `specs/01-api-schema.md` 不変条件 #13 第3経路節。実装サイクルで作成 |
| commit 3 | docs（workflow spec） | `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/**` |

> commit 分割は PR 作成時の案であり、本サイクルでは commit/push/PR を実行しない。

## 6. 実行手順（user 承認後・実装完了後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `feat/issue-1035-tag-master-write-endpoints` を作成し `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` で全差分コミット → `git push`。
5. `gh pr create --base dev` で作成（本文は §4）。

## 7. 完了条件（Phase 13）

- [ ] user の明示承認を取得（承認まで実行しない）
- [ ] （実装サイクル後）Gate-A/B/C 全通過 + typecheck / lint / targeted vitest green を確認
- [ ] base = `dev`、タイトル = §3 案、本文 = §4（`Refs #1035` のみ・`Closes #1035` 不使用）
- [ ] スクリーンショットセクションを作らない（NON_VISUAL）
- [ ] PR URL を最終レポートに記録
- [ ] Phase 13 status = `pending`（承認待ち / 実装サイクル待ち）
