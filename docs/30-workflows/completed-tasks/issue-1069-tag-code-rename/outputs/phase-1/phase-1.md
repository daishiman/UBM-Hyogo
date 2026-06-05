# Phase 1: 要件定義（issue-1069 tag code rename）

## 1.1 タスク identity

| key | value |
| --- | --- |
| workflow_id | `issue-1069-tag-code-rename` |
| taskId | `TASK-ISSUE-1069-TAG-CODE-RENAME` |
| canonical_root | `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename` |
| issue | https://github.com/daishiman/UBM-Hyogo/issues/1069 （**CLOSED**・2026-06-03 外部クローズ・状態変更しない） |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| implementation_mode | `new` |
| workflow_state | `implemented_local_evidence_captured` |
| 実装区分 | **[実装区分: 実装仕様書]** |

## 1.2 タスク分類（docs-only でない理由）

本タスクは **implementation / NON_VISUAL / implementation_mode=new** に分類する。理由を1段落で示す。
変更の本体は `apps/api/src/repository/tagDefinitions.ts` の `updateTagDefinition` を atomic compare-and-swap 型の **新規 rename パス**へ拡張し、`apps/api/src/routes/admin/tags.ts` の PATCH ハンドラに code rename と optimistic concurrency（CAS）と専用 audit 発火を追加する**実コードの変更**である。docs（`docs/00-getting-started-manual/specs/01-api-schema.md` の不変条件 #13）改訂も伴うが、それは API の振る舞い変更（immutable → audit 付き rename 可）を正本仕様へ反映する従属作業であり、主成果はあくまで apps/api の実装。よって docs-only ではない。一方で UI（`apps/web`）には一切接触せず、画面・スクリーンショット証跡を生まないため `NON_VISUAL`。rename 経路はこれまで存在しないため `implementation_mode=new`。

## 1.3 P50 前提確認チェック

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| current branch に実装が存在するか | **No（未実装）** | `apps/api/src/repository/tagDefinitions.ts:59-62` の `UpdateTagDefinitionInput` は `label?` / `category?` のみで `code?` / `expectedCode?` を持たない。`updateTagDefinition`（:110-137）の戻り値は `TagDefinitionRow \| null` で discriminated union 化されていない。route（`tags.ts:29-36`）の `UpdateTagBodyZ` に `code` / `expectedCode` がなく、`ERROR_TO_STATUS`（:44-51）に `tag_stale_conflict` がない。`appendTagAudit`（:89-96）の action union に `admin.tag.code_renamed` がない。よって本仕様の rename パスは未着手。 |
| upstream マージ要否 | **N/A** | 本プロンプトは仕様書のみ作成。git 操作・upstream マージは行わない（user-gated）。 |
| 依存タスク | **issue-1035 completed** | 親タスク `issue-1035-tag-master-write-endpoints` は `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/` 配下に完了済。本タスクはその write endpoint surface（PATCH `/tags/:tagId`・`appendTagAudit`・`getTagDefinitionByIdRaw`・`isUniqueError`）を再利用・拡張する。 |

## 1.4 既存コードの命名規則分析（新規識別子の整合）

実コードから抽出した既存命名規則と、本タスクで追加する新規識別子の整合を示す。

| 種別 | 既存例（実在） | 規則 | 新規追加 | 整合 |
| --- | --- | --- | --- | --- |
| repository 関数 | `updateTagDefinition` / `createTagDefinition` / `getTagDefinitionByIdRaw`（`tagDefinitions.ts`） | camelCase 動詞始まり | （既存 `updateTagDefinition` を拡張・新関数追加なし） | ✅ camelCase 維持 |
| repository 入力 IF | `UpdateTagDefinitionInput` / `CreateTagDefinitionInput` | PascalCase + `...Input` | `UpdateTagDefinitionInput`（`code?` / `expectedCode?` フィールド追加） | ✅ |
| repository 結果型 | `CreateTagDefinitionResult`（discriminated union） | PascalCase + `...Result` | `UpdateTagDefinitionResult`（新規 union） | ✅ `Create...Result` の先例に整合 |
| error code | `tag_code_conflict` / `tag_not_found` / `no_update_fields`（`tags.ts:44-51`） | snake_case | `tag_stale_conflict` | ✅ snake_case |
| repository reason | `code_conflict`（`CreateTagDefinitionResult`） | snake_case | `stale` / `code_conflict` / `not_found` | ✅ snake_case |
| audit action | `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated`（`tags.ts:92`） | `admin.<target>.<verb>` dot 区切り | `admin.tag.code_renamed` | ✅ dot 区切り（verb 部のみ snake_case 内包） |

新規 `admin.tag.code_renamed`（dot 区切り）と `tag_stale_conflict`（snake_case error code）はいずれも既存規則に整合する。

## 1.5 スコープ

### 含む

- `tag_definitions.code` の rename を許可する ADR 確定（Phase 2）と不変条件 #13 改訂。
- repository `updateTagDefinition` の `code?` / `expectedCode?` 対応・discriminated union 返却化（rename + CAS + UNIQUE 捕捉）。
- route PATCH `/tags/:tagId` の body 拡張（`code` / `expectedCode`）・`ERROR_TO_STATUS` 追加・result map・audit 2 種（`admin.tag.code_renamed` / `admin.tag.updated`）独立発火。
- focused D1 vitest（repository / contract / regression / auditLog）と `verify:static-manifest`。

### 含まない

- 新 endpoint 追加・D1 schema 変更（列追加なし）・Google Form 仕様変更。
- `apps/web` 変更（admin tag master 専用 CRUD UI 導線は未整備でスコープ外。Phase 12 未タスク候補）。
- `apps/api/src/repository/auditLog.ts` の変更（後述の根本問題分析参照）。
- commit / push / PR / staging deploy / Issue 状態変更（全て user-gated）。

## 1.6 受け入れ基準（AC-1..AC-6）

| ID | 受け入れ基準 | 現行コード最適化メモ |
| --- | --- | --- |
| AC-1 | tag `code` rename を許可する ADR が記録されている（immutable → mutable へ改訂） | Phase 2 で ADR を確定。issue-1035 supersede を明記 |
| AC-2 | rename API は code uniqueness（`tag_code_conflict` 409）と optimistic conflict（`tag_stale_conflict` 409）を**別々の** error code で返す | optimistic は `expectedCode` による compare-and-swap（schema 変更不要） |
| AC-3 | 既存 `member_tags` row の参照整合が rename 後も保たれる | tag_id 参照のため設計上無傷。regression test で証明 |
| AC-4 | rename 前後の audit log に old/new code が残る | 専用 action `admin.tag.code_renamed`、before `{code: old}` / after `{code: new}` |
| AC-5 | seed / static manifest / admin UI 表示で stale code が残らないことを grep または focused test で確認 | `0004_seed_tags.sql` は OR IGNORE で無害。`verify:static-manifest` PASS + grep evidence |
| AC-6 | rename を許可した結果の運用注意（seed と code がずれ得る点）を spec に明記 | runbook ではなく spec の不変条件 #13 注記で閉じる |

## 1.7 inventory（変更対象ファイル一覧 = DESIGN-BRIEF §4）

| 種別 | パス | 変更 | 内容 |
| --- | --- | --- | --- |
| API repository | `apps/api/src/repository/tagDefinitions.ts` | edit | `UpdateTagDefinitionInput` に `code?` / `expectedCode?` 追加、`updateTagDefinition` を discriminated union 返却へ変更（rename + CAS + UNIQUE 捕捉） |
| API route | `apps/api/src/routes/admin/tags.ts` | edit | `UpdateTagBodyZ` に `code?` / `expectedCode?`、`ERROR_TO_STATUS` に `tag_stale_conflict:409`、PATCH ハンドラで result map、`admin.tag.code_renamed` audit、`appendTagAudit` action union 拡張 |
| system spec | `docs/00-getting-started-manual/specs/01-api-schema.md` | edit | 不変条件 #13 を「code rename 可（audit 付き）」へ改訂 |
| API repository test | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | edit | rename success / code_conflict / stale / not_found / member_tags 保持 |
| API contract test | `apps/api/src/routes/admin/tags.contract.spec.ts` | edit | PATCH code 200 / 409 tag_code_conflict / 409 tag_stale_conflict / 404 / audit code_renamed |
| regression test | `apps/api/src/routes/admin/members.tags.contract.spec.ts` | edit（任意） | rename 後も member タグ解決が code でなく tag_id 経由で成立 |
| static manifest | `apps/api/src/repository/_shared/generated/static-manifest.json` | regen（必要時） | `verify:static-manifest` が drift 検出した場合のみ再生成 |

> **`apps/api/src/repository/auditLog.ts` は変更しない**: `AuditTargetType` に `tag` は既存（`auditLog.ts:8-15`）、`AuditAction` は `RepoBrand<string>`（`_shared/brand`・enum なし）なので新 action 文字列 `admin.tag.code_renamed` に型変更不要。

## 1.8 根本問題と「issue を現行コードに最適化」した点

### 根本問題

admin が tag を誤った `code` で作成しても、現状の PATCH `/tags/:tagId` は label/category のみ更新可能（`tags.ts:29-36`・`UpdateTagBodyZ` に code なし）で `code` を修正できない。唯一の回復策は「新 code 作成 + 旧 code logical delete（`deactivateTagDefinition` で active=0）」だが、これは `member_tags` が無効化タグ（tag_id）を指し続け、むしろデータ衛生が悪化する。よって audit 付きの clean rename パスが必要。

### issue を現行コードに最適化した点

- **AC-3 は杞憂**: `member_tags` は `PRIMARY KEY (member_id, tag_id)` で **tag_id 参照**であり、`code` を参照していない（`0002_admin_managed.sql:43-51`）。rename は tag_id を変えないため `member_tags` の参照整合は設計上無傷。issue が懸念した「参照破壊」は現行スキーマでは起こらない。
- **seed drift は無害**: `0004_seed_tags.sql` は全 INSERT が `INSERT OR IGNORE INTO tag_definitions (tag_id, ...)`（PK=tag_id の idempotent insert-only・`0004_seed_tags.sql:7-63`）。renamed code があっても seed 再実行は revert も conflict も起こさない。
- **issue-1035 supersede**: 親タスクの `issue_optimization_note`（「code is IMMUTABLE, rename is out of scope to avoid seed/UI drift, audit ambiguity, and 409 churn」）を本タスクが上書きする。supersede の正当性は Phase 2 ADR で 4 根拠（参照整合 / seed 無害 / audit 専用 action / 409 error code 分離）として確定する。
- **auditLog.ts 非変更**: 新 action `admin.tag.code_renamed` は `AuditAction = RepoBrand<string>`（enum でない）に弾かれず、`AuditTargetType` の `tag` も既存（`auditLog.ts:8-15`）。よって auditLog repository は再利用のみ。

## 1.9 targeted run ファイルリスト（DESIGN-BRIEF §6・D1 config 必須）

focused test は **`vitest.d1.config.ts` 必須**（unit config では repository.spec / contract.spec が exclude される）。事前列挙する 4 ファイル:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
```

1. `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`（R-1..R-6）
2. `apps/api/src/routes/admin/tags.contract.spec.ts`（C-1..C-6）
3. `apps/api/src/routes/admin/members.tags.contract.spec.ts`（Reg-1）
4. `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`（Reg-2）

## 1.10 DoD（Definition of Done・参照）

- [ ] focused D1 vitest（上記 4 file）全 PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm verify:static-manifest` PASS（drift あれば regen）
- [ ] `docs/00-getting-started-manual/specs/01-api-schema.md` 不変条件 #13 を rename 可へ改訂
- [ ] HEX 直書き 0（apps/web 非接触のため自明）
- [ ] commit / push / PR / staging deploy / Issue 状態変更は **user-gated**（実施しない）
