# Phase 13: commit-pr-release — tag physical delete force-migration（参照付き tag の強制移行）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

> **重要: 本 Phase は user の明示承認後のみ実施する。本仕様書作成サイクルでは実行しない。**
> Phase 13 status = `pending_user_approval`。`git commit` / `git push` / `gh pr create` / **production tag 強制移行・物理削除** はすべて user-gated。
> `governance_mutation_user_gate = true`。本 workflow は `implemented_local_evidence_captured`（local 実装・focused tests・正本 spec 同期済み）。commit / push / PR、staging runtime、production mutation、Issue 状態変更は user-gated。

## 1. 本サイクルでの実行範囲

- 本サイクルでは **commit / push / PR / production mutation を一切行わない**。
- 本サイクルの local 成果物は workflow spec（Phase 1-13 outputs + strict 7 + runbook + artifacts × 2）のみ。
- `apps/api` 実装（`tagDefinitions.ts` / `tags.ts`）・focused D1 Vitest・正本 API spec（`specs/01-api-schema.md`）書き込みは **本サイクルで完了済み**。Phase 13 は commit / push / PR と external runtime gate を扱う。
- PR 作成時は Gate-A/B/C 通過の local evidence を本文に転記する（実装サイクル完了後）。

## 2. 前提ゲート（PR 作成前に全通過必須）

| ゲート | 内容 | 現状 |
| --- | --- | --- |
| Gate-A | 要件・設計・設計レビュー確定（Phase 1-3） | **passed**（本サイクル） |
| Gate-B | 実装 + テスト拡充 + 品質保証（Phase 4-9）green | **passed**（local implementation + focused evidence） |
| Gate-C | 手動テスト + 最終レビュー + ドキュメント同期（Phase 10-12） | **pending_user_approval**（commit / push / PR / staging runtime / production mutation） |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` error 0 | **passed** |
| lint | `mise exec -- pnpm lint` exit 0 | **passed** |
| focused D1 Vitest | force-migration repository + endpoint contract + AC-7 regression PASS | **passed**（2 files / 25 tests） |

## 3. read_only_evidence_allowed_pre_gate（gate 前に取得可能・mutation なし）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
rg -n "migrateMemberTagReferences|forceMigrateAndPhysicalDeleteTagDefinition|admin\.tag\.references_migrated|migration_target_(not_found|inactive|same_as_source)" apps/api
```

> これらは read-only で、production DB を変更しない。Phase 13 user gate の前でも実装サイクル中に evidence として取得可能。

## 4. mutation_commands（literal 一覧・すべて user-gated）

```bash
# production tag 強制移行 + 物理削除（不可逆・runbook + user approval marker 必須）
# 推奨: endpoint 経由（参照ガードと COUNT=0 再検証が二重に効く）
#   DELETE https://<admin-api>/admin/tags/<SRC_ID>/physical?migrateTo=<DEST_ID>
# 緊急時のみ: 直接 SQL（runbook §の逆移行ロールバック手順と対をなす）

# commit / push / PR
git commit
git push
gh pr create --base dev
```

> production 強制移行 + 物理削除の手順・移行前 snapshot 保全・逆移行ロールバックは `outputs/phase-12/force-migration-runbook.md` に従う。

## 5. user_approval_marker

- マーカーパス: `outputs/phase-13/user-approval-<timestamp>.md`
- commit / push / PR 実行前、および production 強制移行・物理削除前に、user 明示承認をこのマーカーへ記録する。
- マーカーが無い状態で §4 の mutation_commands を実行してはならない。

## 6. 想定 PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md「PR作成の完全自律フロー」既定。`main` は production リリース時のみ） |
| 作業ブランチ | `feat/issue-1117-tag-physical-delete-force-migration`（差分主題から自律命名） |
| タイトル案 | `feat(admin): tag physical delete force-migration（参照付き tag の強制移行）(#1117)` |
| Issue リンク方針 | **`Refs #1117`** を使用。**`Closes #1117` は使わない**（Issue #1117 は CLOSED 維持。reopen → 再 close の往復を起こさない） |

## 7. 想定 PR 本文骨子

```
## 概要
physical delete 対象 tag に member_tags 参照があるとき、参照を別 tag（移行先）へ全件付け替えてから
元 tag を物理削除する強制移行（force-migration）経路を apps/api に追加。
- DELETE /admin/tags/:tagId/physical?migrateTo=<dest>（migrateTo 指定時のみ強制移行 → COUNT=0 再検証 → physical delete の二段）
- migrateTo 未指定の DELETE /admin/tags/:tagId/physical は issue-1070 既存挙動を完全保持（参照あり → 409 tag_has_references・AC-7 退化防止）
repository: migrateMemberTagReferences / forceMigrateAndPhysicalDeleteTagDefinition + ForceMigrateAndPhysicalDeleteTagResult を追加。
SQL: INSERT OR IGNORE INTO member_tags SELECT ... + DELETE FROM member_tags WHERE tag_id=?src を c.db.batch で原子実行（孤児化禁止）。
audit admin.tag.references_migrated（移行）+ 既存 admin.tag.physically_deleted（削除）を記録。
NON_VISUAL（API only / apps/web 非接触）。新 migration 不要。

## Issue #1117 を現状コードに最適化した点
- 移行先 tag は実行時に運用者が選ぶ可変値ゆえ固定 DDL migration では表現不能 → 専用 endpoint 方式に確定（新 schema migration なし）。
- member_tags は PRIMARY KEY (member_id, tag_id) のみで DB-FK 不在ゆえ ON DELETE に頼れず、
  (member_id, dest) PK 衝突は INSERT OR IGNORE + DELETE で吸収し孤児化を禁止。
- 移行は issue-1070 の 409 拒否経路の前段に積み、migrateTo 未指定経路は不変（AC-7 regression を contract test で固定）。
- AuditAction は RepoBrand<string>（enum なし）ゆえ brand 型変更不要。route literal union のみ拡張。

## 変更ファイル
- apps/api/src/repository/tagDefinitions.ts（migrateMemberTagReferences / forceMigrateAndPhysicalDeleteTagDefinition + ForceMigrateAndPhysicalDeleteTagResult）
- apps/api/src/routes/admin/tags.ts（physical DELETE への ?migrateTo 分岐、ERROR_TO_STATUS に 3 error code、audit action references_migrated）
- docs/00-getting-started-manual/specs/01-api-schema.md（?migrateTo endpoint + error code 3 種 + audit action + 不変条件）
- apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts（force-migration cases）
- apps/api/src/routes/admin/tags.contract.spec.ts（force-migration contract + AC-7 regression 固定）

## テスト結果
- force-migration repository / contract spec: green
- regression（migrateTo 未指定 409 tag_has_references / 204 物理削除）: green
- typecheck / lint: green

## Issue 状態
Issue #1117 は CLOSED 維持。本 PR で reopen しない（Refs #1117 のみ使用）。

## 運用
production tag 強制移行・物理削除は不可逆。outputs/phase-12/force-migration-runbook.md の手順
（移行前 member_tags snapshot 保全 → 強制移行 → COUNT=0 確認 → 物理削除、誤指定時は逆移行 dest→src）に従い user 承認後のみ実行。

Refs #1117

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` にスクリーンショット画像は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションを作らない。

## 8. 想定コミット分割

| # | 範囲 | 内容 |
| --- | --- | --- |
| commit 1 | 実装コード（apps/api） | `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` + `ForceMigrateAndPhysicalDeleteTagResult` + route `?migrateTo` 分岐 + error code 3 種 + audit `references_migrated` + 新規/更新 spec test。実装サイクルで作成 |
| commit 2 | 正本 spec | `specs/01-api-schema.md` `?migrateTo` endpoint + error code + audit action + 不変条件。実装サイクルで作成 |
| commit 3 | docs（workflow spec） | `docs/30-workflows/completed-tasks/issue-1117-tag-physical-delete-force-migration/**`（本サイクル成果物 + runbook） |

> commit 分割は PR 作成時の案であり、本サイクルでは commit / push / PR を実行しない。

## 9. 実行手順（user 承認後・実装完了後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `feat/issue-1117-tag-physical-delete-force-migration` を作成し `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` で全差分コミット → `git push`。
5. `gh pr create --base dev` で作成（本文は §7）。

## 10. 完了条件（Phase 13）

- [ ] user の明示承認を取得（承認まで commit / push / PR / production 強制移行・物理削除を実行しない）
- [ ] user_approval_marker（`outputs/phase-13/user-approval-<timestamp>.md`）を記録
- [ ] （実装サイクル後）Gate-A/B/C 全通過 + typecheck / lint / focused D1 Vitest green を確認
- [ ] base = `dev`、タイトル = §6 案、本文 = §7（`Refs #1117` のみ・`Closes #1117` 不使用）
- [ ] スクリーンショットセクションを作らない（NON_VISUAL）
- [ ] production 強制移行・物理削除は `force-migration-runbook.md` の手順に従う（不可逆・user-gated・逆移行ロールバック手順あり）
- [ ] PR URL を最終レポートに記録
- [ ] Phase 13 status = `pending_user_approval`（承認待ち / 実装サイクル待ち）・Issue #1117 CLOSED 維持
