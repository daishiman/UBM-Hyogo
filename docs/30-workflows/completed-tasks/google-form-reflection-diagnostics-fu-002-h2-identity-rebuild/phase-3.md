# Phase 3: データ設計

## 3.1 既存 schema 参照

### `member_responses`（履歴行・UNIQUE なし）

```
response_id            TEXT PRIMARY KEY
response_email         TEXT            -- nullable
submitted_at           TEXT NOT NULL
edit_response_url      TEXT
...
INDEX idx_member_responses_email_submitted (response_email, submitted_at)
```

### `member_identities`（正本 / UNIQUE 保証）

```
member_id            TEXT PRIMARY KEY
response_email       TEXT NOT NULL UNIQUE
current_response_id  TEXT NOT NULL
first_response_id    TEXT NOT NULL
last_submitted_at    TEXT NOT NULL
created_at           TEXT NOT NULL DEFAULT (datetime('now'))
updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
```

### `members` VIEW

```sql
FROM member_identities mi JOIN member_responses mr ON mr.response_id = mi.current_response_id
```

### `tag_assignment_queue`（既存 member_id bridge）

```
queue_id    TEXT PRIMARY KEY
member_id   TEXT NOT NULL
response_id TEXT NOT NULL
```

`member_responses` には `member_id` が無い。既存 admin-managed data の `member_id` を復元できる唯一の現行 bridge は `tag_assignment_queue(response_id, member_id)` である。bridge が無い response は migration では既存 member_id へ安全に復元できないため、`session-resolve` の verified email auto-link で新規 identity として救済する。

## 3.2 Backfill 対象クエリ（read-only でも検証可能）

```sql
-- backfill 対象集合: tag_assignment_queue bridge で member_id を復元できる email
SELECT
  MIN(taq.member_id) AS member_id,
  LOWER(TRIM(mr.response_email)) AS response_email,
  MIN(mr.submitted_at) OVER (PARTITION BY LOWER(TRIM(mr.response_email))) AS first_submitted_at,
  MAX(mr.submitted_at) OVER (PARTITION BY LOWER(TRIM(mr.response_email))) AS last_submitted_at
FROM member_responses mr
JOIN tag_assignment_queue taq ON taq.response_id = mr.response_id
WHERE mr.response_email IS NOT NULL
  AND TRIM(mr.response_email) != ''
  AND NOT EXISTS (
    SELECT 1 FROM member_identities mi
    WHERE LOWER(mi.response_email) = LOWER(TRIM(mr.response_email))
  )
GROUP BY LOWER(TRIM(mr.response_email));
```

## 3.3 Backfill SQL（migration 0021）

```sql
-- 0021_backfill_member_identities.sql
-- google-form-reflection-diagnostics-fu-002-h2-identity-rebuild
-- tag_assignment_queue bridge で member_id を復元できる email を救済する。
-- 不変条件: 冪等 (再実行で差分 0)、既存 member_identities row を上書きしない。

WITH normalized AS (
  SELECT
    mr.response_id,
    LOWER(TRIM(mr.response_email)) AS response_email,
    mr.submitted_at,
    taq.member_id
  FROM member_responses mr
  JOIN tag_assignment_queue taq ON taq.response_id = mr.response_id
  WHERE mr.response_email IS NOT NULL
    AND TRIM(mr.response_email) != ''
),
grouped AS (
  SELECT
    MIN(member_id) AS member_id,
    response_email,
    (SELECT n2.response_id FROM normalized n2
      WHERE n2.response_email = normalized.response_email
      ORDER BY n2.submitted_at DESC, n2.response_id DESC LIMIT 1) AS current_response_id,
    (SELECT n3.response_id FROM normalized n3
      WHERE n3.response_email = normalized.response_email
      ORDER BY n3.submitted_at ASC, n3.response_id ASC LIMIT 1) AS first_response_id,
    MAX(submitted_at) AS last_submitted_at
  FROM normalized
  GROUP BY response_email
)
INSERT OR IGNORE INTO member_identities (
  member_id,
  response_email,
  current_response_id,
  first_response_id,
  last_submitted_at,
  created_at,
  updated_at
)
SELECT
  grouped.member_id,
  grouped.response_email,
  grouped.current_response_id,
  grouped.first_response_id,
  grouped.last_submitted_at,
  datetime('now'),
  datetime('now')
FROM grouped
WHERE NOT EXISTS (
  SELECT 1 FROM member_identities mi
  WHERE mi.member_id = grouped.member_id
     OR LOWER(mi.response_email) = grouped.response_email
);
```

> 補足: `INSERT OR IGNORE` で `member_id` PK と `response_email` UNIQUE の双方の衝突を吸収する。`WHERE NOT EXISTS` を併用するのは plan の早期 pruning と test 可読性のため。

## 3.4 Auto-link 用 read query（identities.ts）

```sql
SELECT
  COALESCE(MIN(taq.member_id), :generated_autolink_member_id) AS member_id,
  (SELECT response_id FROM member_responses
    WHERE LOWER(TRIM(response_email)) = ?1
    ORDER BY submitted_at DESC, response_id DESC LIMIT 1) AS current_response_id,
  (SELECT response_id FROM member_responses
    WHERE LOWER(TRIM(response_email)) = ?1
    ORDER BY submitted_at ASC, response_id ASC LIMIT 1) AS first_response_id,
  MAX(submitted_at) AS last_submitted_at
FROM member_responses
LEFT JOIN tag_assignment_queue taq ON taq.response_id = member_responses.response_id
WHERE LOWER(TRIM(response_email)) = ?1
  AND response_email IS NOT NULL
  AND TRIM(response_email) != '';
```

## 3.5 衝突 policy（明示）

| ケース                                                      | 採用                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| email 同一 / 複数 bridge member_id                         | MIN(member_id) を採用。残りは identity-merge workflow（migration 0010）に委譲する                 |
| email 一致 / bridge member_id なし                         | migration は対象外。session-resolve auto-link で `autolink:<uuid>` identity を作る                |
| email 同一 / 全 response の response_email が空文字 or NULL | backfill 対象外（除外）                                                                           |
| email casing 違い                                           | LOWER(TRIM) で正規化して比較                                                                      |
| 既存 member_identities row あり / response_id が古い        | 上書きしない（C5）                                                                                |
