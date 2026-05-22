# Phase 11: 手動テスト検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 11 |
| status | runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 11 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-11/main.md

## 完了条件

- [x] Phase 11 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- staging runtime smoke は user/operator gated。local shell test と Phase 11 evidence path を連携する。

---

# Phase 11 — 手動 smoke（staging 実行）

[実装区分: 実装仕様書]

## 前提

- staging API base URL（例: `https://api-staging.ubm-hyogo.example`）が解決できる
- staging 管理者 session cookie が 1Password に保管されている（`op://Vault/Staging/admin_cookie`）
- staging D1 (`ubm-hyogo-db-staging`) に test 用 member が存在（test account: `manju.manju.03.28@gmail.com` 系）
- `scripts/cf.sh` 経由で staging D1 を操作できる

## 手順

### 1. fixture queue 作成

```bash
TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
QUEUE_ID="qf_race_${TS}"
MEMBER_ID="<test-member-id>"

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
INSERT INTO tag_assignment_queue
  (queue_id, member_id, response_id, status, suggested_tags_json, reason, created_at, updated_at)
VALUES
  ('${QUEUE_ID}', '${MEMBER_ID}', 'smoke-response-${TS}', 'queued',
   '[\"<existing-tag-code>\"]', 'issue-295 race smoke fixture', datetime('now'), datetime('now'));
"
```

> `<existing-tag-code>` は `tag_definitions.code` に存在する値を使う（07a AC-6 違反回避）

### 2. before 状態 SQL 取得

```bash
OUT_DIR="docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/outputs/phase-11/sql"
mkdir -p "$OUT_DIR"

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
SELECT 'member_tags' AS t, COUNT(*) AS c FROM member_tags WHERE member_id='${MEMBER_ID}'
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log WHERE target_type='tag_queue' AND target_id='${QUEUE_ID}'
UNION ALL
SELECT 'queue', status FROM tag_assignment_queue WHERE queue_id='${QUEUE_ID}';
" > "${OUT_DIR}/before.txt"
```

### 3. 並行 smoke 実行

```bash
COOKIE="$(op read 'op://Vault/Staging/admin_cookie')"
OUT="docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/outputs/phase-11/${TS}/result.json"
SIDE_EFFECT_SUMMARY="docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/outputs/phase-11/${TS}/side-effects.json"

node scripts/smoke/tag-queue-race.mjs \
  --env staging \
  --queue-id "${QUEUE_ID}" \
  --concurrency 5 \
  --base-url "https://api-staging.ubm-hyogo.example" \
  --session-cookie "${COOKIE}" \
  --action confirmed \
  --tag-codes "<existing-tag-code>" \
  --out "${OUT}"
```

期待:
- stdout に `{"verdict":"pass","out":"...","analysis":{"successes":1,"raceLosts":4,"others":0,...}}`
- exit 0

### 4. after 状態 SQL 取得

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "
SELECT 'member_tags' AS t, COUNT(*) AS c FROM member_tags WHERE member_id='${MEMBER_ID}'
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log WHERE target_type='tag_queue' AND target_id='${QUEUE_ID}'
UNION ALL
SELECT 'queue', status FROM tag_assignment_queue WHERE queue_id='${QUEUE_ID}';
" > "${OUT_DIR}/after.txt"
```

### 5. 副作用 summary 判定

`before.txt` / `after.txt` から差分を確認し、AC-4 を runner exit code に反映する summary を保存する。

```bash
cat > "${SIDE_EFFECT_SUMMARY}" <<JSON
{
  "expected": { "memberTagsDelta": 1, "auditLogDelta": 1, "queueStatus": "resolved" },
  "actual": { "memberTagsDelta": 1, "auditLogDelta": 1, "queueStatus": "resolved" }
}
JSON

node scripts/smoke/tag-queue-race.mjs \
  --analyze-only \
  --input "${OUT}" \
  --side-effect-input "${SIDE_EFFECT_SUMMARY}"
```

期待差分:
- `member_tags` 増分 = `--tag-codes` の行数（confirmed 1 tag → +1）
- `audit_log` 増分 = 1（成功した resolve 1 件）
- `queue.status` = `resolved`

## evidence 一覧

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/<ISO-ts>/result.json` | script 出力（並行 fetch 結果 + analysis） |
| `outputs/phase-11/<ISO-ts>/side-effects.json` | before/after SQL から作った AC-4 summary |
| `outputs/phase-11/sql/before.txt` | before SELECT 結果 |
| `outputs/phase-11/sql/after.txt` | after SELECT 結果 |
| `outputs/phase-11/main.md` | 手順実行ログ + 差分判定の文章記録 |

## 後始末

- fixture queue は `resolved` 状態のため re-run 不可。次回検証は新規 fixture を作成する（destructive cleanup は不要）。
- test member に付いた tag は smoke 用なので残しても良いが、運用上気になる場合は manual に `DELETE FROM member_tags WHERE member_id=...` で除去（要 evidence への注記）。

## DoD

- 並行 smoke の verdict が `pass`
- before/after SQL 差分が期待値どおり
- `--side-effect-input` 付き analyze-only が exit 0
- evidence 4 ファイルが `outputs/phase-11/` 配下に存在

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/<ISO-ts>/result.json`
- `outputs/phase-11/<ISO-ts>/side-effects.json`
- `outputs/phase-11/sql/before.txt`
- `outputs/phase-11/sql/after.txt`

## 次 Phase

- [phase-12.md](./phase-12.md): ドキュメント更新
