# issue-778-schema-alias-rollback-undo - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: SchemaDiffPanel に rollback / undo UI を追加（コード変更）、admin/web API helper 追加（コード変更）、`apps/api/src/routes/admin/schema.ts` に rollback endpoint 追加（コード変更）、`apps/api/migrations/0019_schema_alias_soft_delete.sql` 新規作成（コード変更）、関連 spec MD 追記（コード変更）を伴う。コード変更なしには Issue #778 の根本問題（D1 直接修正の運用リスク）を解消できないため docs-only 不可。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-778-schema-alias-rollback-undo |
| タスク名 | SchemaDiffPanel alias resolve に rollback / undo 経路を追加し D1 直接修正を排除する |
| ディレクトリ | docs/30-workflows/issue-778-schema-alias-rollback-undo |
| 親 Issue | #778 (CLOSED, 2026-05-19T02:10:00Z) — CLOSED 維持。最新コードに最適化して再起動 |
| 親 workflow | docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/ |
| 原典 (unassigned-task) | docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md |
| GitHub Issue URL | https://github.com/daishiman/UBM-Hyogo/issues/778 |
| 作成日 | 2026-05-19 |
| 担当 | delivery |
| 状態 | runtime_pending |
| タスク種別 | implementation / VISUAL（admin UI screen diff あり） |
| 優先度 | 中（D1 直接修正の常態化リスク。集計汚染の発見遅延リスク） |

## 採用方針（現コードベース実態に最適化）

**「Issue #778 を最新コードに最適化し、followup-003 history view 未実装でも単独で完結できる縮退案で再起動する」**

| 項目 | 原典 #778 想定 | 現コードベース実態（2026-05-19） | 本タスクで採る方針 |
| --- | --- | --- | --- |
| rollback / undo 実装 | 未実装 | `SchemaDiffPanel.tsx` / `lib/admin/api.ts` / `routes/admin/schema.ts` のいずれにも実装なし。`schema_aliases.deleted_at` 列も無し | 本タスクで一式実装する |
| followup-003 (history view) | 推奨依存 | 既存 unassigned-task `serial-05-step-03-followup-003-schema-diff-history-view.md` として存在 | **強依存しない縮退案**を採用: rollback UI は SchemaDiffPanel 内に「resolved alias 一覧 + 取消ボタン」の最小 history pane を内蔵。完全な history view は既存 followup-003 へ正規に分離（CONST_007 例外条件 1 を満たす: history pane と history view は責務が異なる UI で、本タスクで両方を破綻なく完了させると scope が破綻するため。**ただし本タスクの rollback / undo 自体は今サイクル内で完結**） |
| D1 schema | `schema_aliases` に `deleted_at` 列なし | 0018 まで存在、`0019` が次番号 | `0019_schema_alias_soft_delete.sql` で `deleted_at` 追加し soft delete を採用 |
| audit | application `audit_log` 存在（0003） | schema alias assign は `schema_diff.alias_assigned` を application `audit_log` に記録。`cf_audit_log` は Cloudflare Audit Logs 取り込み専用 | `schema_alias.rollback` action を application `audit_log` に追加し、元 resolve audit id は `after_json.relatedAuditId` に保存 |
| 集計影響範囲 | 表示要件あり | 集計 view 仕様未確定 | rollback 確認 modal に「紐付け済み応答件数」「再集計要否警告」を表示。再集計実行は別 followup（明示分離） |

## 目的

`/admin/schema` SchemaDiffPanel から alias resolve を API + 監査ログ経由で取り消せる経路を追加し、誤 resolve 発生時の D1 直接修正運用を排除する。soft delete と監査ログ記録により「いつ誰が何を取り消したか」の追跡可能性を担保し、`11-admin-management.md` の操作原則（操作はすべて API + 監査ログを通る）を SchemaDiffPanel 領域でも成立させる。

## スコープ

### 含む

- D1 migration: `apps/api/migrations/0019_schema_alias_soft_delete.sql`
  - `schema_aliases.deleted_at TEXT NULL` 追加
  - `schema_aliases.deleted_by TEXT NULL` 追加
  - 既存 `idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique` を `WHERE deleted_at IS NULL` 追加で再作成
  - `idx_schema_aliases_deleted_at` index 追加
- API endpoint: `POST /admin/schema/aliases/:aliasId/rollback`
  - `apps/api/src/routes/admin/schema.ts` に追加
  - `apps/api/src/repository/schemaAliases.ts`（または既存 repo モジュール）に `softDeleteById()` 追加
  - workflow: `schemaAliasRollback.ts` 新規追加（`db.batch([softDelete, queueRestore, auditInsert])` を 1 transaction で実行）
  - response shape: `{ aliasId, rolledBackAt, relatedAuditId, newVersion, impact: { affectedResponseCount, recomputeRequired } }`
- web helper: `apps/web/src/lib/admin/api.ts` に `rollbackSchemaAlias(aliasId)` 追加
- web UI: `apps/web/src/components/admin/SchemaDiffPanel.tsx`
  - 内蔵 history pane: resolved alias 一覧（直近 N 件、N=10 既定）
  - 各 entry の rollback ボタン → 確認 modal（影響件数 / 再集計要否表示） → API 呼出
  - undo トースト: 直近 resolve 後 5 分以内に「取消」リンク表示
  - rollback / undo 経路は同一 helper を共有
- spec 更新:
  - `docs/00-getting-started-manual/specs/11-admin-management.md` に rollback / undo 操作仕様追記
  - `docs/00-getting-started-manual/specs/01-api-schema.md` に新 endpoint 追記
- test:
  - `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` に rollback / undo の happy / collision / 5min 経過のケース追加
  - `apps/web/src/lib/admin/__tests__/api.spec.ts` に `rollbackSchemaAlias` ケース追加
  - `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` 新規（batch transaction / audit insertion / queue restore の検証）

### 含まない

- followup-003 schema diff history view（完全独立 UI）。本タスクは SchemaDiffPanel 内蔵の最小 history pane に限定
  - **未タスク化**: 既存 `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md` で別 followup として残置。重複する history-view task は新規作成しない
- 集計バッチの再実行ロジック（影響範囲表示のみ実装、再集計実行は別 followup）
  - **未タスク化**: `serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` を新規追加
- bulk rollback（複数 alias 一括取消）
  - **未タスク化**: `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` を新規追加
- admin notification（rollback 発生時の通知）
  - **未タスク化**: `serial-05-step-03-followup-007-schema-alias-rollback-notification.md` を新規追加
- admin role 分離（resolve vs rollback）
  - 同一 admin role で両方可。将来 `admin:senior` 等を導入する際の拡張余地のみ spec に記述

### CONST_007 例外宣言

未タスク化した followup-003 / 005 / 006 / 007 は、本タスクの rollback / undo 経路の**前提条件ではない**（縮退 UI で本タスク単独完了可）。これらを今サイクルに含めると以下が破綻する:
- followup-003: 独立 UI screen 開発が必要（route 追加・nav 追加）でスコープが 2 倍以上に肥大化
- followup-005: 集計バッチ仕様の合意未済（集計 view が複数候補あり）
- followup-006: bulk 操作の race condition 設計が rollback 単体の倍以上の検討量
- followup-007: 通知チャネル仕様（Slack / email）の合意未済

→ いずれも CONST_007 例外条件 1（技術的・整合性的に今サイクル内完了が破綻する明確な理由）に該当。各 unassigned-task に理由・実施時期目安（next sprint）・実施場所（unassigned-task md）を明記する。

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md | 原典 unassigned-task |
| 必須 | docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/implementation-guide.md | 親タスクの実装ガイド |
| 必須 | apps/web/src/components/admin/SchemaDiffPanel.tsx | rollback / undo UI 追加対象 |
| 必須 | apps/web/src/lib/admin/api.ts | helper 追加対象 |
| 必須 | apps/api/src/routes/admin/schema.ts | endpoint 追加対象 |
| 必須 | apps/api/migrations/0008_create_schema_aliases.sql | 既存 schema |
| 必須 | apps/api/migrations/0008_schema_alias_hardening.sql | `schema_diff_queue` 既存列 |
| 必須 | apps/api/migrations/0003_auth_support.sql | application `audit_log` schema |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | 操作仕様追記対象 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | endpoint 仕様追記対象 |
| 必須 | CLAUDE.md | D1 直接アクセス禁止 / `*.spec.{ts,tsx}` 命名 / OKLch token 不変条件 |

## 受入条件 (AC)

### Local Acceptance

- **AC-1**: `SchemaDiffPanel` に rollback UI（resolved alias 一覧 + 確認 modal）と undo UI（直近 5 分以内のクイック取消トースト）が実装され、`SchemaDiffPanel.component.spec.tsx` で両経路の happy / failure / 5min-elapsed パスを検証する
- **AC-2**: `POST /admin/schema/aliases/:aliasId/rollback` が `db.batch([softDelete, queueRestore, auditInsert])` で同一 transaction として実行される。`schema.rollback.spec.ts` で batch atomicity（途中 fail で 0 行 commit）を検証
- **AC-3**: rollback 成功時 application `audit_log` に `schema_alias.rollback` action が記録され、元 resolve の `auditId` を `after_json.relatedAuditId` で参照する
- **AC-4**: rollback 確認 modal に「影響応答件数」「再集計要否警告」が表示される。再集計実行は本タスク外であることを modal 内に明示
- **AC-5**: migration `0019_schema_alias_soft_delete.sql` が `schema_aliases.deleted_at` / `deleted_by` 列を追加し、既存 unique index を `WHERE deleted_at IS NULL` 付きで再作成。`stable_key_aliases` 等の join 側 query に `WHERE deleted_at IS NULL` を追加
- **AC-6**: `11-admin-management.md` に rollback / undo 操作仕様（権限・confirm modal 仕様・audit 記録項目・5min undo 期限）追記済み
- **AC-7**: `01-api-schema.md` に rollback endpoint（path / request body / response shape / error 体系）追記済み
- **AC-8**: design token は OKLch 系既存 token のみ。`bg-[#xxx]` 等の HEX 直書きなし（`verify-design-tokens` CI gate pass）
- **AC-9**: 新規 test file は `*.spec.{ts,tsx}` 命名のみ（lefthook `block-test-suffix` pass）
- **AC-10**: 並列 resolve / rollback の競合シナリオに対し、楽観ロック（`schema_aliases.version INTEGER NOT NULL DEFAULT 1`）を採用。同一 alias に対する rollback リクエストは `If-Match: version=N` ヘッダで version 一致を要求し、不一致時は 409 Conflict
- **AC-11**: D1 直接アクセス禁止不変条件（CLAUDE.md #5）遵守: `apps/web` から D1 binding を直接呼ばない。すべて `lib/admin/api.ts` 経由

### Runtime Acceptance (Phase 13)

- **RAC-1**: staging で `wrangler d1 migrations apply` 実行後 `PRAGMA table_info(schema_aliases)` に `deleted_at` 列が存在する evidence MD
- **RAC-2**: staging `/admin/schema` で実 admin actor が dummy alias の resolve → rollback を実行し、`audit_log` に 2 行（resolve / rollback）が記録される runtime evidence（screenshot + SQL query 結果）
- **RAC-3**: VISUAL タスクとして Playwright visual baseline に SchemaDiffPanel rollback modal の screenshot を追加（task-18 visual-full required check に整合）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | phase-01.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/{api-contract,d1-schema-migration,ui-state-machine}.md |
| 3 | 設計レビュー | phase-03.md | spec_created | phase-03.md |
| 4 | タスク分解 | phase-04.md | spec_created | phase-04.md |
| 5 | 実装計画 | phase-05.md | spec_created | phase-05.md |
| 6 | 実装手順 | phase-06.md | spec_created | phase-06.md |
| 7 | テスト計画 | phase-07.md | spec_created | phase-07.md |
| 8 | ドキュメント更新 | phase-08.md | spec_created | phase-08.md |
| 9 | local 受入確認 | phase-09.md | spec_created | phase-09.md |
| 10 | リファクタ | phase-10.md | spec_created | phase-10.md |
| 11 | VISUAL evidence + runtime | phase-11.md | runtime_pending | outputs/phase-11/{visual-baseline,migration-apply,rollback-runtime}.md |
| 12 | 正本同期 | phase-12.md | spec_created | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked | outputs/phase-13/pr-summary.md |

## 不変条件

1. **CLOSED Issue を reopen しない**: Phase 12 fold-state sync で原典 unassigned-task に `consumed_via_issue_778_rollback_undo_spec` を記述
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を直接呼ばない（CLAUDE.md #5）
3. **既存 endpoint 互換**: `POST /admin/schema/aliases` の resolve 経路は touch しない。新 rollback endpoint を別 path で追加（path-namespace 分離）
4. **transaction atomicity**: rollback は `db.batch()` 1 つで `[soft_delete, queue_restore, audit_insert]` を実行。途中 fail で 0 行 commit を保証
5. **soft delete 一貫性**: `schema_aliases` を join する全 query に `WHERE deleted_at IS NULL` を追加。grep gate で漏れ検出
6. **OKLch token のみ**: HEX 直書き / `bg-[#xxx]` 禁止（CLAUDE.md UI prototype alignment 不変条件）
7. **`*.spec.{ts,tsx}` 命名**: 新規 test は spec suffix のみ（CLAUDE.md #8）
8. **secret 実値非記載**: evidence MD / artifacts.json に Cloudflare token / D1 binding 実値を残さない
9. **CONST_007 遵守**: rollback / undo 本体は本サイクルで完了。history view / recompute / bulk / notification は明示分離 unassigned-task に残置
10. **admin mutation 標準経路**: web 側の rollback API 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md #10）

## リスクと緩和策

| リスク | 影響度 | 発生確率 | 緩和策 |
| --- | --- | --- | --- |
| `db.batch()` の atomicity 仕様が想定と異なり中間状態が発生 | 高 | 低 | Phase 02 で D1 batch 仕様 (Cloudflare docs) を引用、Phase 07 で fault-injection spec を必須化 |
| 既存 query への `WHERE deleted_at IS NULL` 追加漏れ | 高 | 中 | Phase 06 で `rg 'FROM schema_aliases'` 全件 grep gate、Phase 09 で snapshot diff |
| 並列 resolve/rollback で `version` 競合発生 | 中 | 中 | 楽観ロック採用、`If-Match` ヘッダ 409 で UI 側 retry 提示 |
| undo 5min 期限の境界条件で誤動作 | 中 | 中 | Phase 07 で 4:59 / 5:00 / 5:01 の 3 ケース必須 |
| 影響件数算出が重 query で UI 遅延 | 中 | 低 | response アグリゲートは indexed scalar `COUNT(*) FROM responses WHERE stable_key = ?` に限定。N+1 禁止 |
| audit relation の保存先が Cloudflare `cf_audit_log` と混同される | 中 | 中 | Phase 02 で application `audit_log.after_json.relatedAuditId` に固定。Cloudflare 取り込み用 `cf_audit_log` は変更しない |
| Playwright visual baseline 追加忘れで `visual-full` CI fail | 中 | 中 | Phase 11 で baseline 取得手順を明文化、task-18 visual-full のスコープと整合 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | apps/api/migrations/0019_schema_alias_soft_delete.sql | soft delete migration（AC-5） |
| コード | apps/api/src/routes/admin/schema.ts | rollback endpoint 追加（AC-2） |
| コード | apps/api/src/workflows/schemaAliasRollback.ts | rollback workflow（AC-2） |
| コード | apps/web/src/components/admin/SchemaDiffPanel.tsx | rollback / undo UI（AC-1, AC-4） |
| コード | apps/web/src/lib/admin/api.ts | `rollbackSchemaAlias` helper |
| ドキュメント | outputs/phase-02/api-contract.md | endpoint 設計 |
| ドキュメント | outputs/phase-02/d1-schema-migration.md | migration 設計 |
| ドキュメント | outputs/phase-02/ui-state-machine.md | UI 状態遷移設計 |
| ドキュメント | outputs/phase-12/*（7 files） | Phase 12 mandatory outputs |
| ドキュメント | outputs/phase-13/pr-summary.md | PR ドラフト |
| 管理 | artifacts.json | workflow state |

## Phase マップ

```
phase-01 (要件定義: Issue #778 現状調査 + 縮退判定)
  └─ phase-01.md
       │
       ▼
phase-02 (設計: D1 migration / API / UI 状態機械)
  ├─ outputs/phase-02/api-contract.md
  ├─ outputs/phase-02/d1-schema-migration.md
  └─ outputs/phase-02/ui-state-machine.md
       │
       ▼
phase-03 (設計レビュー: AC-1〜AC-11 マッピング)
       │
       ▼
phase-04 (タスク分解: T-01 〜 T-12)
       │
       ▼
phase-05〜10 (実装計画〜リファクタ)
       │
       ▼
phase-11 (VISUAL evidence + migration apply)
  ├─ outputs/phase-11/visual-baseline.md
  ├─ outputs/phase-11/migration-apply.md
  └─ outputs/phase-11/rollback-runtime.md
       │
       ▼
phase-12 (正本同期 / 7 必須 output + fold-state sync)
       │
       ▼
phase-13 (PR base=dev / user-gated push)
  └─ outputs/phase-13/pr-summary.md
```

## 注意点

- GitHub Issue #778 は CLOSED 済（2026-05-19T02:10:00Z）。reopen はせず本仕様書で local implementation + 正本同期まで完了する
- closure 時に linked PR・comment なしのため closure 経緯は不明。コード実態（rollback 未実装）が判断根拠
- followup-003 history view が後行する場合、本タスクの SchemaDiffPanel 内蔵 history pane は後で history view へ吸収できるよう、`<SchemaDiffPanel.HistoryPane>` のような分離可能な内部 component で実装する
- recovery D'+0 起算は runbook 正本どおり別経路で user が宣言する
