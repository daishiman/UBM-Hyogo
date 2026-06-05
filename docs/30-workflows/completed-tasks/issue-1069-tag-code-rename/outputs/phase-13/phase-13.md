# Phase 13: commit-pr-release — tag code rename（issue-1069）

**[実装区分: 実装仕様書]**

> **重要: 本 Phase は user の明示承認後のみ実施する。本仕様書作成サイクルでは実行しない。**
> Phase 13 status = `pending`。`git commit` / `git push` / `gh pr create` / staging deploy / Issue 状態変更はすべて **user-gated**。
> 本 workflow は `implemented_local_evidence_captured`。実装・focused tests・typecheck・lint・正本 spec 改訂は完了済み。commit / push / PR / staging runtime / Issue mutation は user-gated。

## 1. 本サイクルでの実行範囲

- 本サイクルでは **commit / push / PR / staging deploy / Issue 状態変更を一切行わない**。
- 成果物は workflow 仕様書（Phase 1-13 + strict 7）のみ。`apps/` 配下は非接触。
- PR 作成時は Gate-A/B/C passed の local evidence を本文に転記する（実装サイクル完了後）。

## 2. 前提ゲート（実装サイクルで PR 作成前に全通過必須）

| ゲート | 内容 | 確認元 |
| --- | --- | --- |
| Gate-A | 要件・設計・テスト仕様確定（Phase 1-4 / DESIGN-BRIEF §2 supersede 根拠） | spec 上 passed |
| Gate-B | 実装 + リファクタリング + 品質保証（Phase 5-9）green | pending（実装サイクル） |
| Gate-C | 手動テスト（focused D1 vitest）+ 最終レビュー + ドキュメント（Phase 10-12） | spec 上 passed |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` error 0 | pending |
| lint | `mise exec -- pnpm lint` exit 0 | pending |
| focused D1 vitest | 4 files（R-1..R-6 + C-1..C-6 + Reg-1..Reg-2） | pending |
| static manifest | `mise exec -- pnpm verify:static-manifest` PASS | pending |

## 3. 想定 PR 設定

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md「PR作成の完全自律フロー」既定。`main` は production リリース時のみ） |
| 作業ブランチ | `feat/issue-1069-tag-code-rename`（差分主題から自律命名） |
| タイトル案 | `feat(admin): tag master code rename (CAS + 409 分離 + audit) を許可 (#1069)` |
| Issue リンク方針 | **`Refs #1069`** を使用。**`Closes #1069` は使わない**（Issue #1069 は既に 2026-06-03 外部 CLOSED。本 PR で再 close しない） |

## 4. 想定 PR 本文骨子

```
## 概要
admin tag master の `code` rename を許可する（不変条件 #13 を immutable → mutable へ改訂）。
- PATCH /admin/tags/:tagId の body に code? / expectedCode? を後方互換追加。
- code uniqueness 衝突は 409 tag_code_conflict、optimistic(CAS) 衝突は 409 tag_stale_conflict に分離。
- rename 時に専用 audit admin.tag.code_renamed（before {code: old} / after {code: new}）を記録。
- member_tags は tag_id 参照のため rename 後も参照整合維持（D1 schema 変更なし）。
NON_VISUAL（apps/api only）。apps/web 非接触。

## Issue #1069 を現状コードに最適化した点
- 親タスク issue-1035 の issue_optimization_note（code is IMMUTABLE / rename out of scope）を
  supersede。supersede 根拠: member_tags は tag_id 参照で無傷 / 0004_seed_tags.sql は OR IGNORE で
  seed drift 無害 / 専用 audit で ambiguity 解消 / UNIQUE と CAS の error code 分離で 409 churn 対策。
- updateTagDefinition の戻り値を TagDefinitionRow|null から discriminated union
  (ok / not_found / code_conflict / stale) へ変更（AC-2 の 409 分離の前提）。
- expectedCode は `UPDATE ... WHERE tag_id AND code` の atomic CAS（D1 schema 変更不要）。

## 変更ファイル
- apps/api/src/repository/tagDefinitions.ts（UpdateTagDefinitionInput に code?/expectedCode?、戻り値 union 化）
- apps/api/src/routes/admin/tags.ts（UpdateTagBodyZ 拡張 / ERROR_TO_STATUS に tag_stale_conflict:409 /
  result map / admin.tag.code_renamed audit / action union 拡張）
- docs/00-getting-started-manual/specs/01-api-schema.md（不変条件 #13 を rename 可へ改訂 + seed drift 運用注意）
- apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts（R-1..R-6）
- apps/api/src/routes/admin/tags.contract.spec.ts（C-1..C-6）
- apps/api/src/routes/admin/members.tags.contract.spec.ts（Reg-1・任意）
- apps/api/src/repository/_shared/generated/static-manifest.json（drift 時のみ regen）

## AC マッピング
- AC-1 ADR（immutable→mutable）: spec 改訂 + Phase 2 ADR
- AC-2 409 分離: ERROR_TO_STATUS / result map / C-2 / C-3 / R-2 / R-3
- AC-3 member_tags 参照整合: tag_id 参照（R-5 / Reg-1）
- AC-4 audit old/new code: admin.tag.code_renamed（C-5 / Reg-2）
- AC-5 stale code 残存なし: seed OR IGNORE / verify:static-manifest（Phase 9 §5）
- AC-6 seed drift 運用注意: 不変条件 #13 注記

## 検証コマンド
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:static-manifest

## テスト結果
- tagDefinitions.write.repository.spec.ts / tags.contract.spec.ts: green
- regression（members.tags.contract.spec.ts / auditLog.repository.spec.ts）: green
- typecheck / lint / verify:static-manifest: green

## Issue 状態
Issue #1069 は既に 2026-06-03 外部 CLOSED。本 PR で再 close しない（Refs #1069 のみ使用）。

Refs #1069

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> `outputs/phase-11/` にスクリーンショット画像は存在しない（NON_VISUAL）。PR 本文にスクリーンショット専用セクションを作らない。

## 5. 想定コミット分割

| # | 範囲 | 内容 |
| --- | --- | --- |
| commit 1 | 実装コード（apps/api） | `tagDefinitions.ts` 拡張 + `tags.ts` 拡張 + spec test 更新（R/C/Reg）。実装サイクルで作成 |
| commit 2 | 正本 spec | `specs/01-api-schema.md` 不変条件 #13 改訂 + seed drift 注記。実装サイクルで作成 |
| commit 3 | docs（workflow spec） | `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/**` |

> commit 分割は PR 作成時の案であり、本サイクルでは commit/push/PR を実行しない。

## 6. 実行手順（user 承認後・実装完了後）

1. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
2. 作業ブランチ `feat/issue-1069-tag-code-rename` を作成し `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針で自律解消）。
3. 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` で全差分コミット → `git push`。
5. `gh pr create --base dev` で作成（本文は §4）。

## 7. 完了条件（Phase 13）

- [ ] user の明示承認を取得（承認まで実行しない）
- [ ] （実装サイクル後）Gate-A/B/C 全通過 + typecheck / lint / focused D1 vitest / verify:static-manifest green を確認
- [ ] base = `dev`、タイトル = §3 案、本文 = §4（`Refs #1069` のみ・`Closes #1069` 不使用）
- [ ] スクリーンショットセクションを作らない（NON_VISUAL）
- [ ] PR URL を最終レポートに記録
- [ ] Issue #1069 は外部 CLOSED 済（本ワークフローは状態変更しない）
- [ ] Phase 13 status = `pending`（承認待ち / 実装サイクル待ち）
