[実装区分: docs-only / canonical alias / non-canonical historical draft]

# Unmerge Identity Runbook

> Canonical status: non-canonical historical draft.
>
> This file is kept only as trace material from the pre-alias 04c workflow draft. Runtime unmerge / rollback procedures for identity conflict merge are governed by `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/`. Do not execute this draft as an operational runbook unless it has first been reconciled into the Issue #194 canonical workflow.

## 概要

admin が誤って 2 つの `member_identities` を merge してしまった場合に、監査ログに保存された `before_payload_json` から **24 時間以内**に復元する手順。merge transaction の atomic 性に対応する atomic な逆操作として設計する。

## SLA

- **24 時間以内**に復元完了すること（誤マージ発覚から数えて）。
- 24h を超過した場合は、その間に走った Google Form 再回答 / admin 操作の影響でデータ整合性が壊れる可能性があるため、**手動データ突合タスク**へエスカレーション（後述）。
- runbook の dry-run は **常に staging throwaway DB** で実施し、production には事前検証なしで適用しない。

## 前提条件

- 監査ログテーブル（`identity_merge_audit` 相当）に `before_payload_json` / `after_payload_json` / `merge_transaction_id` が保存されている。
- 該当 merge_transaction_id が unmerge 対象として特定済み。
- production への apply 前に staging で dry-run 実施済み。

## 入力情報

| 項目 | 例 | 取得元 |
| --- | --- | --- |
| `merge_transaction_id` | `mtx_2026-05-04T12:00:00Z_abc123` | admin UI 監査ログ画面 / `identity_merge_audit` SELECT |
| 勝者 `member_id` (winner) | `mem_winner` | merge 時の after_payload |
| 敗者 `member_id` (loser) | `mem_loser` | merge 時の before_payload（消えた側） |
| 影響範囲確認時刻 | UTC ISO8601 | 操作開始時刻 |

## 手順

### ステップ 0: lock 取得（merge と同じ調停）

merge / sync が同時に走らないように、unmerge 開始時に対象 identity 双方の lock_token を取得する。

```sql
-- staging で先に dry-run、本番は確認後
UPDATE sync_jobs
SET lock_token = '<unmerge-token-uuid>',
    locked_at = strftime('%s','now')
WHERE job_type = 'identity_merge'
  AND target_member_id IN ('mem_winner', 'mem_loser')
  AND (lock_token IS NULL OR locked_at < strftime('%s','now') - 600);
```

lock 取得失敗時は 30 秒スリープ後に最大 3 回まで再試行。3 回失敗なら abort して **エスカレーション**へ。

### ステップ 1: before_payload 取得

```sql
SELECT
  merge_transaction_id,
  before_payload_json,
  after_payload_json,
  merged_at
FROM identity_merge_audit
WHERE merge_transaction_id = '<merge_transaction_id>'
LIMIT 1;
```

期待: 1 row。before_payload_json には敗者側の `member_identities` row + `member_status` row + 紐付く `responses` の最低限の identity reference（merge 直前 snapshot）が JSON で入っている。0 row の場合は **エスカレーション**へ。

### ステップ 2: dry-run（staging throwaway DB）

production に対して apply する前に、必ず staging throwaway DB（`ubm-hyogo-db-staging-rollback-sandbox` 等）で SELECT-only の dry-run を実施。

```bash
# wrangler 直叩き禁止。CLAUDE.md ルールに従い scripts/cf.sh 経由で実行
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging-rollback-sandbox \
  --command "SELECT json_extract(before_payload_json, '$.loser.member_id'),
                    json_extract(before_payload_json, '$.loser.response_email'),
                    json_extract(before_payload_json, '$.loser.current_response_id')
             FROM identity_merge_audit
             WHERE merge_transaction_id = '<merge_transaction_id>'"
```

期待: 敗者側の `member_id` / `response_email` / `current_response_id` が 3 列で取得できる。NULL や欠損があれば payload schema 不整合 → **エスカレーション**へ。

### ステップ 3: 復元 SQL の組み立て

`before_payload_json` から以下を組み立てる。

```sql
-- 1) 敗者 identity を復元
INSERT INTO member_identities (
  member_id, response_email, current_response_id, last_submitted_at, created_at, updated_at
)
SELECT
  json_extract(before_payload_json, '$.loser.member_id'),
  json_extract(before_payload_json, '$.loser.response_email'),
  json_extract(before_payload_json, '$.loser.current_response_id'),
  json_extract(before_payload_json, '$.loser.last_submitted_at'),
  json_extract(before_payload_json, '$.loser.created_at'),
  strftime('%s','now')
FROM identity_merge_audit
WHERE merge_transaction_id = '<merge_transaction_id>';

-- 2) 敗者 member_status を復元
INSERT INTO member_status (
  member_id, public_consent, rules_consent, publish_state, is_deleted, updated_at
)
SELECT
  json_extract(before_payload_json, '$.loser.member_id'),
  json_extract(before_payload_json, '$.loser_status.public_consent'),
  json_extract(before_payload_json, '$.loser_status.rules_consent'),
  json_extract(before_payload_json, '$.loser_status.publish_state'),
  json_extract(before_payload_json, '$.loser_status.is_deleted'),
  strftime('%s','now')
FROM identity_merge_audit
WHERE merge_transaction_id = '<merge_transaction_id>';

-- 3) 敗者に紐付くべき responses の identity reference を loser 側に戻す
UPDATE responses
SET member_id = json_extract(
  (SELECT before_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
  '$.loser.member_id'
)
WHERE response_id IN (
  SELECT value FROM json_each(
    (SELECT json_extract(before_payload_json, '$.loser_response_ids')
     FROM identity_merge_audit
     WHERE merge_transaction_id = '<merge_transaction_id>')
  )
);

-- 4) 勝者 member_status の集約を before_payload に戻す（merge で上書きされた consent / publish_state）
UPDATE member_status
SET public_consent = json_extract(
      (SELECT before_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
      '$.winner_status.public_consent'
    ),
    rules_consent = json_extract(
      (SELECT before_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
      '$.winner_status.rules_consent'
    ),
    publish_state = json_extract(
      (SELECT before_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
      '$.winner_status.publish_state'
    ),
    updated_at = strftime('%s','now')
WHERE member_id = json_extract(
  (SELECT before_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
  '$.winner.member_id'
);

-- 5) 監査ログに unmerge 操作を追記
INSERT INTO identity_merge_audit (
  merge_transaction_id, action, before_payload_json, after_payload_json, performed_by, performed_at
)
VALUES (
  'umtx_' || lower(hex(randomblob(8))),
  'unmerge',
  (SELECT after_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
  (SELECT before_payload_json FROM identity_merge_audit WHERE merge_transaction_id = '<merge_transaction_id>'),
  '<admin_user_id>',
  strftime('%s','now')
);
```

### ステップ 4: dry-run 実行（staging）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging-rollback-sandbox \
  --file unmerge-<merge_transaction_id>.sql
```

dry-run 結果を `outputs/phase-11/api-evidence/unmerge-dry-run.md` に保存。整合性チェック：

- 敗者 `member_id` row が 1 件復活している
- 敗者 `member_status` row が 1 件復活している
- responses の `member_id` が敗者側に戻っている件数が `before_payload.loser_response_ids` と一致
- 勝者 `member_status` が before snapshot と一致

### ステップ 5: production 適用（dry-run 成功後のみ）

```bash
# user / admin 二重承認を取得してから実行
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --env production \
  --file unmerge-<merge_transaction_id>.sql
```

### ステップ 6: lock 解除

```sql
UPDATE sync_jobs
SET lock_token = NULL, locked_at = NULL
WHERE lock_token = '<unmerge-token-uuid>';
```

### ステップ 7: post-check

- admin UI 候補リストを再読み込みし、敗者 identity が再表示されている確認
- `GET /admin/identity-conflicts/:id` でもう一度 same pair が候補化されているか確認（必要なら即 dismiss を取り直す判断を admin 側で実施）
- `outputs/phase-11/api-evidence/unmerge-postcheck.md` に結果を記録

## エスカレーション

以下のいずれかに該当した場合、本 runbook では復旧を試みず即時エスカレーション：

| 条件 | 連絡先 / 対応 |
| --- | --- |
| `before_payload_json` が欠損または schema 不整合 | プロジェクトオーナー（@daishiman）に Slack 即時連絡 + GitHub Issue 起票 |
| 24h SLA を超過している | 手動データ突合タスクを別 followup として切り出し、production 適用は保留 |
| lock 取得が 3 回失敗 | sync ジョブの状態を確認、必要なら sync を一時停止してから再試行 |
| dry-run で整合性チェック NG | 復元 SQL を再点検、payload schema が想定と異なる可能性 → 個別調査 |
| 関連する `responses` row が他の merge 操作で再マージされている | チェーン unmerge を別タスクで設計、本 runbook では適用禁止 |

## 履歴

| 日付 | 操作者 | merge_transaction_id | 結果 |
| --- | --- | --- | --- |
| - | - | - | - |

（本 runbook は実 unmerge 発動の都度、本テーブルへ追記する）

## 参考

- 親 spec: `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md`
- merge transaction 仕様: 本 task の `outputs/phase-12/implementation-guide.md` Part 2
- D1 構成: `docs/00-getting-started-manual/specs/08-free-database.md`
- Cloudflare CLI ラッパー: `scripts/cf.sh`（CLAUDE.md ルール、`wrangler` 直叩き禁止）
