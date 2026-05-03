# Lessons Learned — 06c-D admin schema follow-up

## L-06CD-001: `/admin/schema` は 07b schema alias workflow の UI gate として扱う

`/admin/schema` の責務は schema diff の確認と stableKey alias assignment の admin UI gate である。06c 親タスクを復活させたり、07b と別の storage / endpoint contract を作ったりしない。正本 endpoint は `GET /admin/schema/diff`、`POST /admin/schema/aliases`、`POST /admin/sync/schema`、storage は `schema_aliases` と `audit_log`。

## L-06CD-002: 4 pane contract は component / POM / spec を同一 wave で更新する

`SchemaDiffPanel` の canonical pane は `added | changed | removed | unresolved` の 4 種。component に `data-testid="admin-schema-section"` を追加しても、Playwright spec が `assertSectionCount(6)` を明示したままだと skip 解除時に失敗する。POM default、spec call site、Phase 12 compliance の 3 点を同時に更新する。

## L-06CD-003: screenshot は 06c-D 単独 PASS にしない

`/admin/schema` の runtime screenshot は authenticated admin session と D1 schema-diff fixture が必要。06c-D は spec_created / VISUAL_ON_EXECUTION なので、Phase 11 は handoff として残し、実 screenshot は 08b admin Playwright E2E または 09a staging smoke の `admin-schema.png` へ委譲する。placeholder screenshot を 06c-D の PASS evidence として置かない。

## L-06CD-004: legacy path move は artifact inventory と register で閉じる

旧 `docs/30-workflows/02-application-implementation/06c-D-admin-schema/` から current `docs/30-workflows/completed-tasks/06c-D-admin-schema/` へ移した場合、resource-map / task-workflow-active だけでは旧 citation の引き直しが弱い。artifact inventory と legacy ordinal family register へ current root を登録し、Phase 12 guide から screenshot handoff path も辿れるようにする。

## L-06CD-005: protected stableKey は UI だけでなく API workflow で拒否する

`publicConsent`、`rulesConsent`、`responseEmail` は consent / system field の不変条件を支えるため、alias workflow の割当対象にしない。UI の入力 guard は操作ミスを早く止めるための補助であり、最終防御は `schemaAliasAssign` の `protected_stable_key` 422 contract に置く。

## L-06CD-006: remaining-only spec は canonical 正本値を引いて作成する

- 観察: 06c-D 範囲外の残仕様レビュー時に旧 endpoint（`/api/admin/schema/*`）や旧 table（`schema_alias` / `schema_alias_audit`）を再採用してしまうリスクがあった。
- 対策: 残仕様文書の作成・更新時は、必ず `references/api-endpoints.md` / `references/database-schema.md` / `references/ui-ux-admin-dashboard.md` の現行 canonical 契約値を引用し、旧表記を新規採用しない。
- Why: API/DB スキーマの drift を防ぎ、admin schema 機能の単一正本性を保つため。
- How to apply: aiworkflow-requirements skill 利用時、残仕様 review 段階で canonical 3 文書を必ず開く運用に統一。
