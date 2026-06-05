# Phase 13: commit-pr-release — tag master reactivate + physical delete

**[実装区分: 実装仕様書 / NON_VISUAL / spec_created]**

> **重要: 本 Phase は user の明示承認後のみ実施する。本仕様書作成サイクルでは実行しない。**
> Phase 13 status = `pending_user_approval`。`git commit` / `git push` / `gh pr create` / **production tag 物理削除** はすべて user-gated。
> `governance_mutation_user_gate = true`。本 workflow は `spec_created`（実コード未適用）。実装・focused tests・正本 spec 同期も後続実装サイクルで user-gated に行う。

## 1. 本サイクルでの実行範囲

- 本サイクルでは **commit / push / PR / production mutation を一切行わない**。
- 本サイクルの local 成果物は workflow spec（Phase 1-13 outputs + strict 7 + runbook + artifacts）のみ。
- `apps/api` 実装・focused D1 Vitest・正本 API spec 書き込みは **後続実装サイクル**で作成・実行する。
- PR 作成時は Gate-A/B/C 通過の local evidence を本文に転記する（実装サイクル完了後）。

## 2. 前提ゲート（実装サイクルで PR 作成前に全通過必須）

| ゲート | 内容 | 現状 |
| --- | --- | --- |
| Gate-A | 要件・設計・設計レビュー確定（Phase 1-3） | **passed**（本サイクル） |
| Gate-B | 実装 + テスト拡充 + 品質保証（Phase 4-9）green | pending（実装サイクル・user-gated） |
| Gate-C | 手動テスト + 最終レビュー + ドキュメント同期（Phase 10-12） | pending（実装サイクル・user-gated） |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` error 0 | pending |
| lint | `mise exec -- pnpm lint` exit 0 | pending |
| focused D1 Vitest | lifecycle repository + contract + logical regression PASS | pending |

## 3. read_only_evidence_allowed_pre_gate（gate 前に取得可能・mutation なし）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts <local focused specs>
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
rg -n "member_tags|tag_has_references|admin\.tag\.(reactivated|physically_deleted)" apps/api
```

> これらは read-only で、production DB を変更しない。Phase 13 user gate の前でも実装サイクル中に evidence として取得可能。

## 4. mutation_commands（literal 一覧・すべて user-gated）

```bash
# production tag 物理削除（不可逆・runbook + user approval marker 必須）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "DELETE FROM tag_definitions WHERE tag_id = '<id>'"
# 通常は endpoint 経由を推奨: DELETE https://<admin-api>/admin/tags/<id>/physical

# commit / push / PR
git commit
git push
gh pr create --base dev
```

> production 物理削除の手順・参照0確認・backup・rollback は `outputs/phase-12/physical-delete-runbook.md` に従う。

## 5. user_approval_marker

- マーカーパス: `outputs/phase-13/user-approval-<timestamp>.md`
- commit / push / PR 実行前、および production 物理削除前に、user 明示承認をこのマーカーへ記録する。
- マーカーが無い状態で §4 の mutation_commands を実行してはならない。

## 6. 想定 PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md「PR作成の完全自律フロー」既定。`main` は production リリース時のみ） |
| 作業ブランチ | `feat/issue-1070-tag-reactivate-physical-delete`（差分主題から自律命名） |
| タイトル案 | `feat(admin): tag master reactivate + physical delete（参照ガード付き）(#1070)` |
| Issue リンク方針 | **`Refs #1070`** を使用。**`Closes #1070` は使わない**（Issue #1070 は CLOSED 維持。reopen → 再 close の往復を起こさない） |

## 7. 想定 PR 本文骨子

```
## 概要
tag master (tag_definitions) lifecycle に reactivate + physical delete（参照ガード付き）を追加。
- POST /admin/tags/:tagId/reactivate（active=0 → active=1、idempotent no-op、404 tag_not_found）
- DELETE /admin/tags/:tagId/physical（参照0でのみ行削除・code 解放。member_tags 参照あり → 409 tag_has_references + referenceCount）
audit admin.tag.reactivated / admin.tag.physically_deleted を state 変化時のみ記録（targetType tag）。
既存 logical DELETE /admin/tags/:tagId（active=0）は不変（AC-6 regression）。
NON_VISUAL（API only / apps/web 非接触）。

## Issue #1070 を現状コードに最適化した点
- member_tags に tag_definitions への DB-FK が無い（PRIMARY KEY (member_id, tag_id) のみ）ため、
  physical delete の参照整合は ON DELETE に頼れず application-level COUNT(*) ガードを正本化。参照>0 は 409 で拒否し孤児化禁止。
- reactivate は deactivateTagDefinition の対称形。UNIQUE code 列に触れないため code conflict は構造的に発生しない（spurious 409 path を作らない）。
- physical（row 削除 / code 解放）と logical（active=0 / code 占有継続）の運用差を spec に明記。
- AuditAction は RepoBrand<string>（enum なし）のため brand 型変更不要。route literal union のみ拡張。
- D1 migration 不要。

## 変更ファイル
- apps/api/src/repository/tagDefinitions.ts（reactivateTagDefinition / countMemberTagReferences / physicalDeleteTagDefinition + PhysicalDeleteTagDefinitionResult）
- apps/api/src/routes/admin/tags.ts（reactivate POST / physical DELETE、audit union、tag_has_references:409）
- docs/00-getting-started-manual/specs/01-api-schema.md（reactivate / physical delete + 参照ガード不変条件 + code 占有差）
- apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts（新規）
- apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts（新規）
- apps/api/src/routes/admin/tags.contract.spec.ts（logical DELETE regression 固定）

## テスト結果
- lifecycle repository / contract spec: green
- regression（logical DELETE / available filter）: green
- typecheck / lint: green

## Issue 状態
Issue #1070 は CLOSED 維持。本 PR で reopen しない（Refs #1070 のみ使用）。

## 運用
production tag 物理削除は不可逆。outputs/phase-12/physical-delete-runbook.md の手順（参照0確認 → backup → 実行 → audit 確認）に従い user 承認後のみ実行。

Refs #1070

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` にスクリーンショット画像は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションを作らない。

## 8. 想定コミット分割

| # | 範囲 | 内容 |
| --- | --- | --- |
| commit 1 | 実装コード（apps/api） | repository lifecycle 関数 + 判別共用体 + reactivate/physical route + audit union + 新規 spec test。実装サイクルで作成 |
| commit 2 | 正本 spec | `specs/01-api-schema.md` reactivate / physical delete + 参照ガード不変条件 + code 占有差。実装サイクルで作成 |
| commit 3 | docs（workflow spec） | `docs/30-workflows/completed-tasks/issue-1070-tag-reactivate-physical-delete/**`（本サイクル成果物 + runbook） |

> commit 分割は PR 作成時の案であり、本サイクルでは commit / push / PR を実行しない。

## 9. 実行手順（user 承認後・実装完了後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `feat/issue-1070-tag-reactivate-physical-delete` を作成し `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` で全差分コミット → `git push`。
5. `gh pr create --base dev` で作成（本文は §7）。

## 10. 完了条件（Phase 13）

- [ ] user の明示承認を取得（承認まで commit / push / PR / production 物理削除を実行しない）
- [ ] user_approval_marker（`outputs/phase-13/user-approval-<timestamp>.md`）を記録
- [ ] （実装サイクル後）Gate-A/B/C 全通過 + typecheck / lint / focused D1 Vitest green を確認
- [ ] base = `dev`、タイトル = §6 案、本文 = §7（`Refs #1070` のみ・`Closes #1070` 不使用）
- [ ] スクリーンショットセクションを作らない（NON_VISUAL）
- [ ] production 物理削除は `physical-delete-runbook.md` の手順に従う（不可逆・user-gated）
- [ ] PR URL を最終レポートに記録
- [ ] Phase 13 status = `pending_user_approval`（承認待ち / 実装サイクル待ち）・Issue #1070 CLOSED 維持
