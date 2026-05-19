# Phase 11: VISUAL evidence + runtime

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | runtime_pending |

## 目的

VISUAL タスクとして visual baseline を取得し、staging で migration apply + rollback runtime evidence を記録する（user-gated）。

## 成果物（placeholder）

- `outputs/phase-11/visual-baseline.md` — Playwright visual baseline 4 screens placeholder
- `outputs/phase-11/migration-apply.md` — staging migration apply log placeholder
- `outputs/phase-11/rollback-runtime.md` — staging で dummy alias resolve → rollback の SQL query 結果 + screenshot placeholder

## 手順（user-gated）

### Step 1: visual baseline 取得 (local)

```bash
mise exec -- pnpm --filter @ubm/web playwright test --grep "SchemaDiffPanel.*rollback" --update-snapshots
```

`apps/web/playwright/__screenshots__/` 配下に 4 screens (desktop-light / desktop-dark / mobile-light / mobile-dark) を新規追加。

### Step 2: staging migration apply（user 承認後のみ）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging
```

### Step 3: staging runtime evidence

1. staging `/admin/schema` で admin actor がログインし、test fixture から dummy alias を resolve
2. UI から rollback 実行
3. `bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "SELECT action, target_type, target_id, after_json, created_at FROM audit_log WHERE action IN ('schema_diff.alias_assigned', 'schema_alias.rollback') ORDER BY created_at DESC LIMIT 5"` で 2 行（resolve / rollback）確認し、rollback 行の `after_json.relatedAuditId` を確認
4. screenshot を `outputs/phase-11/rollback-runtime/*.png` に保存

## Runtime Acceptance

| AC | 状態 |
| --- | --- |
| RAC-1 (migration apply) | PENDING_USER_GATE |
| RAC-2 (audit 2 行 + screenshot) | PENDING_USER_GATE |
| RAC-3 (visual baseline 4 screens) | PENDING_USER_GATE |

## 完了条件

- [ ] visual baseline 4 screens 配置
- [ ] migration apply log evidence
- [ ] rollback runtime evidence（audit query + screenshot）

## 次 Phase

- 次: 12（正本同期）
