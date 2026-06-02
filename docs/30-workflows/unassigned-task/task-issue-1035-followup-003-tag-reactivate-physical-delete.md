# Issue #1035 follow-up: tag reactivate and physical delete

## メタ情報

```yaml
issue_number: 1070
task_id: task-issue-1035-followup-003-tag-reactivate-physical-delete
task_name: Tag reactivate and physical delete operational requirements
category: 要件
target_feature: tag master lifecycle operations
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1035 Phase 12 unassigned-task-detection U-3
created_date: 2026-06-01
dependencies: [issue-1035-tag-master-write-endpoints]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-1035-followup-003-tag-reactivate-physical-delete |
| タスク名 | Tag reactivate and physical delete operational requirements |
| 分類 | 要件 |
| 対象機能 | tag master lifecycle operations |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md` U-3 |
| 関連 Issue | #1035 |

---

## 1. なぜこのタスクが必要か

Issue #1035 の DELETE は `tag_definitions.active=0` にする論理削除であり、既存 `member_tags` row は保持する。これは誤って tag を棚から下げる操作を安全に実現するための最小 lifecycle である。

一方、誤削除からの復活（reactivate）や、誤作成 tag の完全削除（physical delete）は、参照整合・監査・復旧不能性の扱いが別物である。特に physical delete は不可逆 mutation になり得るため、Issue #1035 の通常 DELETE と混ぜずに要件定義する。

## 2. 何を達成するか

tag master の reactivate endpoint と physical delete 運用の必要性を整理し、実装する場合は user-gated な安全設計、audit、repository/API contract、runbook を用意する。physical delete は原則として高リスク操作として扱い、`member_tags` 参照が存在する場合の拒否/移行/孤児化禁止を明確化する。

### 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | reactivate と physical delete を同一 endpoint に混ぜず、操作ごとの contract が分離されている |
| AC-2 | reactivate は `active=0` の tag を `active=1` に戻し、code conflict と not_found を明確に扱う |
| AC-3 | physical delete は `member_tags` 参照ありの場合の扱い（拒否または明示移行）が仕様化されている |
| AC-4 | physical delete を実装する場合、user approval marker と runbook を持つ |
| AC-5 | audit log に reactivate / physical delete の before/after と actor が残る |
| AC-6 | Issue #1035 の logical delete regression が退化しない |

## 3. 実行方針

1. Phase 1 で current D1 schema、`member_tags` 参照、Issue #1035 の logical delete contract を確認する。
2. Phase 2 で reactivate と physical delete を別 ADR として設計し、physical delete の user gate を定義する。
3. 実装する場合は repository/API/audit/focused tests を追加し、不可逆操作は Phase 13 user approval に分離する。
4. 実装しない場合は運用 runbook と正本仕様を整備し、logical delete のみを継続する根拠を残す。
5. Phase 12 で aiworkflow-requirements と unassigned-task / issue trace を同期する。

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/tagDefinitions.ts`
- 症状: Issue #1035 の `deactivateTagDefinition` は `active=0` の idempotent logical delete として実装され、`member_tags` は触らない。reactivate/physical delete を追加すると idempotency、参照整合、audit 発火条件が別になる。
- 対象: `apps/api/src/routes/admin/tags.ts`
- 症状: `DELETE /admin/tags/:tagId` を physical delete に転用すると既存 contract と名前が衝突する。reactivate も `PATCH` の label/category 更新と混ぜると no-op/audit 条件が曖昧になる。
- 参照: `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| physical delete で `member_tags` が孤児 row になる | 高 | 参照ありは原則 409 で拒否し、移行が必要なら別の明示 migration/runbook を要求する |
| logical delete の既存 `DELETE` contract が破壊される | 高 | physical delete は別 endpoint または ops-only runbook に分離し、既存 DELETE regression test を維持する |
| reactivate が code conflict や UI available list と不整合になる | 中 | `tag_id` を正として戻し、`GET /admin/tags` と member available list の active filter を focused test で確認する |
| 不可逆操作を AI が自動実行してしまう | 高 | governance YAML / user approval marker を仕様化し、runtime mutation は Phase 13 user-gated にする |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts apps/api/src/routes/admin/tags.contract.spec.ts
```

期待: reactivate success/conflict/not_found、physical delete guard、logical delete regression、audit 発火条件が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
rg -n "admin\\.tag\\.(deactivated|reactivated|deleted)|member_tags|active=0|active = 0" apps/api docs/00-getting-started-manual/specs/01-api-schema.md
```

期待: action 名、logical delete invariant、member_tags 参照境界が仕様と一致する。

### Runtime evidence

physical delete の staging/production mutation は user approval 後のみ実行する。事前 Phase では local D1 focused tests と read-only schema inspection に限定する。

## スコープ

### 含む

- reactivate / physical delete の ADR
- reactivate endpoint または runbook
- physical delete を実装する場合の user-gated runbook、guard、audit、tests
- Issue #1035 logical delete regression の維持

### 含まない

- member drawer inline-create UI（別タスク `task-issue-1035-followup-001-admin-tag-inline-create-ui.md`）
- tag `code` rename（別タスク `task-issue-1035-followup-002-tag-code-rename-requirements.md`）
- production mutation、commit、push、PR 作成

## 参照

- Issue #1035: https://github.com/daishiman/UBM-Hyogo/issues/1035
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
