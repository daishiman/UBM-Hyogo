# 06c-C-admin-tags

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | serial-after-06c-B-and-07a |
| owner | - |
| 状態 | spec_created / implementation-spec / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

管理者向け /admin/tags を、正本仕様どおり未タグ会員の割当キューとして扱う follow-up 仕様書。旧案のタグ辞書 CRUD / alias 管理 / member_tags 直接編集は 12-search-tags.md と 11-admin-management.md に反するため破棄し、既存 07a queue resolve contract、06c admin UI、08b/09a runtime visual evidence handoff を一筆書きで固定する。

## scope in / out

### Scope In

- /admin/tags route の queue list / review panel / tag picker / member focus query
- API: GET /admin/tags/queue, POST /admin/tags/queue/:queueId/resolve
- shared schema: packages/shared/src/schemas/admin/tag-queue-resolve.ts
- audit actions: admin.tag.queue_resolved, admin.tag.queue_rejected
- Phase 11 runtime visual evidence の 08b/09a handoff

### Scope Out

- /admin/tags CRUD family の新設
- tag alias editor、tag rule editor、tag dictionary editor
- member_tags 直接編集 UI/API
- production secret 値の記録
- 未承認 commit/push/PR

## dependencies

### Depends On

- 06c-B-admin-members
- 07a-parallel-tag-assignment-queue-resolve-workflow
- 06b-A me API Auth.js session resolver
- 05a admin gate

### Blocks

- 08b-A-playwright-e2e-full-execution
- 09a-A-staging-deploy-smoke-execution

## refs

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- .claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md
- .claude/skills/aiworkflow-requirements/references/api-endpoints.md
- .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md

## AC

- 管理者は /admin/tags で未タグ会員キューを確認できる。
- /admin/members からの ?memberId= focus が対象 queue item を先頭に寄せる。
- confirmed / rejected は shared schema に準拠し、混在 body は 400、状態競合は 409、unknown tag/deleted member は 422。
- 同一 payload の再投入は 200 + idempotent で追加 audit を作らない。
- 非管理者は 403、未ログインは 401。
- member_tags への反映は queue resolve の guarded update 成功後だけ行われる。
- apps/web から D1 への直接アクセスはない。

## 13 phases

- [phase-01.md](phase-01.md) - 要件定義
- [phase-02.md](phase-02.md) - 設計
- [phase-03.md](phase-03.md) - 設計レビュー
- [phase-04.md](phase-04.md) - テスト戦略
- [phase-05.md](phase-05.md) - 実装ランブック
- [phase-06.md](phase-06.md) - 異常系検証
- [phase-07.md](phase-07.md) - AC マトリクス
- [phase-08.md](phase-08.md) - DRY 化
- [phase-09.md](phase-09.md) - 品質保証
- [phase-10.md](phase-10.md) - 最終レビュー
- [phase-11.md](phase-11.md) - 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) - ドキュメント更新
- [phase-13.md](phase-13.md) - PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-12/elegant-review-30-methods.md

## invariants touched

- #5 apps/web D1 direct access forbidden
- #11 admin profile本文・member_tags 直接編集禁止
- #13 audit log
- #15 Auth/admin session boundary

## completion definition

全 phase 仕様書、root/outputs artifacts parity、Phase 12 strict outputs、正本 index 同期が揃い、旧 CRUD 前提が残っていないこと。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
