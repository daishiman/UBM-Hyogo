# Issue #1035 follow-up: tag code rename requirements

## メタ情報

```yaml
issue_number: 1069
task_id: task-issue-1035-followup-002-tag-code-rename-requirements
task_name: Tag code rename requirements and implementation
category: 要件
target_feature: tag master code rename
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1035 Phase 12 unassigned-task-detection U-2
created_date: 2026-06-01
dependencies: [issue-1035-tag-master-write-endpoints]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1035-followup-002-tag-code-rename-requirements |
| タスク名 | Tag code rename requirements and implementation |
| 分類 | 要件 |
| 対象機能 | tag master code rename |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md` U-2 |
| 関連 Issue | #1035 |

---

## 1. なぜこのタスクが必要か

Issue #1035 では tag `code` を immutable として確定し、PATCH は `label` / `category` のみを更新する設計にした。これは member_tags 参照整合、seed/UI drift、409 churn を避けるための現在の正本仕様である。

一方、運用で誤った code が大量作成された場合、表示名修正だけでは足りない可能性がある。rename を許可するか、別 code を作って旧 code を logical delete するかは、監査・参照整合・UI 表示への影響が大きいため、独立した要件定義と実装タスクとして扱う。

## 2. 何を達成するか

tag `code` rename の可否と方式を決め、必要なら admin API と repository に rename endpoint / function を追加する。実装する場合は、既存 member_tags row、audit log、seed/import contract、admin UI の code 表示が壊れないことを証明する。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | tag `code` rename を許可するか、禁止継続するかが ADR として記録されている |
| AC-2 | 許可する場合、rename API は code uniqueness と optimistic conflict を明確な error code で返す |
| AC-3 | 既存 `member_tags` row の参照整合が保たれる |
| AC-4 | rename 前後の audit log に old/new code が残る |
| AC-5 | seed / static manifest / admin UI 表示で stale code が残らないことを grep または focused test で確認する |
| AC-6 | 禁止継続する場合、代替運用（新 code 作成 + 旧 code logical delete）が runbook 化されている |

## 3. 実行方針

1. Phase 1 で current schema、`member_tags` 参照、Issue #1035 の immutable 判断を確認する。
2. Phase 2 で rename / no-rename の ADR を比較し、実装要否を決める。
3. 実装する場合は repository/API contract/audit/focused tests を追加する。
4. 実装しない場合は runbook と system spec を更新し、禁止継続を明確化する。
5. Phase 12 で aiworkflow-requirements の tag master invariant #13 と artifact inventory を同期する。

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/tagDefinitions.ts`
- 症状: Issue #1035 では `updateTagDefinition` を label/category のみに限定し、`code` は stable external/admin identifier として固定した。rename を後付けする場合、この前提を崩すため `member_tags` 参照、audit、UI cache、seed の全境界を再点検する必要がある。
- 対象: `docs/00-getting-started-manual/specs/01-api-schema.md`
- 症状: 不変条件 #13 は tag master write 第3経路を正本化している。rename を小さな PATCH 拡張として扱うと、正本仕様と実装が drift しやすい。
- 参照: `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/artifacts.json` の `issue_optimization_note`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| rename により existing member_tags と UI 表示が不整合になる | 高 | tag_id 参照を正とし、code は表示/外部識別子であることを Phase 1 で確認する。code を参照している箇所を `rg` で棚卸しする |
| UNIQUE(code) 衝突時の挙動が曖昧になる | 高 | `tag_code_conflict` とは別に rename 用 error code を定義し、409 contract test を追加する |
| 監査ログに old code が残らず追跡不能になる | 中 | `admin.tag.code_renamed` など専用 action を設け、before/after に old/new code を含める |
| 実運用 need が弱いのに機能を増やす | 中 | Phase 2 ADR で禁止継続を第一候補とし、具体 need がない場合は runbook のみで閉じる |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts apps/api/src/routes/admin/tags.contract.spec.ts
```

期待: rename を実装する場合は success/conflict/not_found/audit の focused tests が PASS。禁止継続の場合は code immutable regression が PASS。

### 統合検証

```bash
rg -n "tag\\.code|\\.code|tag_code|tagDefinitions|member_tags" apps/api apps/web packages docs/00-getting-started-manual/specs/01-api-schema.md
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

期待: code 参照境界が ADR と一致し、typecheck/lint が green。

### Runtime evidence

staging D1 mutation が必要な場合は user approval 後に実行する。事前 Phase では local D1 focused tests と read-only grep evidence に限定する。

## スコープ

### 含む

- tag `code` rename の ADR
- rename を許可する場合の API/repository/audit/test 実装
- rename を禁止継続する場合の runbook と正本仕様更新
- aiworkflow-requirements 同期

### 含まない

- member drawer inline-create UI（別タスク `task-issue-1035-followup-001-admin-tag-inline-create-ui.md`）
- tag 物理削除 / reactivate（別タスク `task-issue-1035-followup-003-tag-reactivate-physical-delete.md`）
- production D1 apply、commit、push、PR 作成

## 参照

- Issue #1035: https://github.com/daishiman/UBM-Hyogo/issues/1035
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
