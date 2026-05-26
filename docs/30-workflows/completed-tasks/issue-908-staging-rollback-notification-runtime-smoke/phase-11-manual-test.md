---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 11: 手動テスト — タスク仕様書

| Phase | 11 | Phase名 | 手動テスト（NON_VISUAL / staging runtime smoke） |
| --- | --- | --- | --- |
| ステータス | runtime_pending |
| 実装区分 | 実装仕様書 |

---

## NON_VISUAL 宣言

本タスクは NON_VISUAL。`outputs/phase-11/screenshots/` は作成しない。primary evidence は helper 実行ログ（redact 済）と audit_log query 結果。

---

## 実行タスク

### タスク0: Phase 10 完了確認

`outputs/phase-10/final-review-result.md` の総合判定が `PASS_LOCAL_SPEC / RUNTIME_PENDING` であることを確認する。

### タスク1: 自動検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash -n scripts/runtime-smoke/schema-alias-rollback.sh
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy --dry-run
```

### タスク2: staging deploy 最新性確認（user-gated）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

deploy 完了の `version_id` を `outputs/phase-11/manual-test-execution-plan.md` に記録（実値）。

### タスク3: S-sent 実行（user-gated）

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh \
  --env staging --alias <TEST_ALIAS_ID> --scenario sent
```

確認:
- HTTP 200
- Slack 通知着信目視
- audit_log: `status=sent, channel=slack or mail`
- 結果を staging-smoke.md `Scenario S-sent` に転記（redact 済）

### タスク4: S-skipped 実行（user-gated）

staging secret を一時的に外す or 別 alias で skip 動作を再現:

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh \
  --env staging --alias <TEST_ALIAS_ID> --scenario skipped
```

確認: `status=skipped, channel=none, attempts=0`

> staging secret 操作が困難な場合は親 issue-838 unit test 代替を staging-smoke.md `Scenario S-skipped` に明記して可とする。

### タスク5: S-failed 実行（user-gated）

意図的に無効 webhook を一時投入 or 通信失敗を注入:

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh \
  --env staging --alias <TEST_ALIAS_ID> --scenario failed
```

確認: rollback HTTP 200 が返ること、audit `status=failed`、`errorClass` が sanitized token のみ。

### タスク6: evidence MD 更新 + 親 mutation

1. `outputs/phase-11/evidence/staging-smoke.md` の placeholder を実値で埋める（secret redact 必須）
2. 親 `outputs/phase-11/manual-test-result.md` の Status 行更新 + staging-smoke.md 相互リンク追加
3. 親 `artifacts.json` の Phase 11 status / Gate-C status / evidence_path を更新（phase-2 §親 mutation 仕様 diff）

### タスク7: AC 達成確認

| AC | 結果 |
| --- | --- |
| AC-1 | 記録 |
| AC-2 | 記録 |
| AC-3 | 記録 |
| AC-4 | 記録 |
| AC-5 | 記録 |
| AC-6 | 記録 |
| AC-7 | 記録 |

---

## 成果物

| 成果物 | パス |
| --- | --- |
| 実行プラン | `outputs/phase-11/manual-test-execution-plan.md` |
| 親 evidence MD | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` |
| 親 manual-test-result.md | 同上 root `outputs/phase-11/manual-test-result.md`（Status 更新） |

---

## 完了条件

- [ ] Phase 10 PASS 確認
- [ ] 自動検証全 PASS
- [ ] staging deploy 完了
- [ ] S-sent / S-skipped / S-failed 全実行（unit 代替可）
- [ ] evidence MD 転記完了（redact 済）
- [ ] 親 manual-test-result.md / artifacts.json 更新
- [ ] AC-1〜AC-7 記録

---

## 次Phase

`phase-12-documentation.md`
