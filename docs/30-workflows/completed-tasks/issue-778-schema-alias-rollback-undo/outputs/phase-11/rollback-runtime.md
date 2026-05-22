# Phase 11 output: rollback runtime evidence

[実装区分: 実装仕様書]

## 状態

`PENDING_USER_GATE` — staging runtime 検証は user 明示承認後のみ実行。

## runtime scenario

1. staging `/admin/schema` に admin actor（`manjumoto.daishi@senpai-lab.com`）でログイン
2. test fixture から dummy unresolved diff を 1 件用意（必要なら手動 INSERT で `schema_diff_queue` に row 追加、test scope に限定）
3. UI から resolve（stableKey=`test_rollback_target` で `POST /admin/schema/aliases`）
4. resolve 直後の undo toast 表示確認 → screenshot `undo-toast.png`
5. UI から rollback ボタン click → 確認 modal の影響件数表示確認 → screenshot `confirm-modal.png`
6. confirm → success toast 表示確認 → screenshot `success-toast.png`
7. audit log 確認:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "
  SELECT action, target_type, target_id, actor_email, after_json, created_at
    FROM audit_log
   WHERE action IN ('schema_diff.alias_assigned', 'schema_alias.rollback')
   ORDER BY created_at DESC
   LIMIT 5;
"
```

期待: 2 行（`schema_diff.alias_assigned` / `schema_alias.rollback`）が timestamp 順で並び、`schema_alias.rollback` の `after_json.relatedAuditId` が元 resolve の `audit_id` を参照。

8. schema_aliases 状態確認:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "
  SELECT id, stable_key, version, deleted_at, deleted_by
    FROM schema_aliases
   WHERE stable_key = 'test_rollback_target';
"
```

期待: `deleted_at` 非 NULL / `version=2` / `deleted_by` = actor email

## evidence 配置

`outputs/phase-11/rollback-runtime/` 配下に保存:
- `confirm-modal.png` / `undo-toast.png` / `success-toast.png`
- `audit-query.json`（query 結果 JSON）
- `schema-aliases-query.json`

## cleanup

test に使用した dummy row は staging fixture cleanup script で削除:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "
  DELETE FROM schema_aliases WHERE stable_key = 'test_rollback_target';
  DELETE FROM audit_log WHERE target_id IN (SELECT id FROM schema_aliases WHERE stable_key = 'test_rollback_target');
  DELETE FROM schema_diff_queue WHERE question_id LIKE 'test_rollback_%';
"
```

## RAC mapping

| RAC | 検証内容 |
| --- | --- |
| RAC-1 | migration apply 完了（`migration-apply.md` 参照） |
| RAC-2 | audit 2 行 + 3 screenshots（本 MD） |
| RAC-3 | visual baseline 4 screens（`visual-baseline.md` 参照） |
