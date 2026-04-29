# Phase 2 主成果物 — 設計

採用案: **Alternative A**（router → use-case → repository → view、leak 二重チェック）+ 部分 E（stats / form-preview のみ 60s cache）。

## 1. module 配置

```
apps/api/src/
├── routes/public/
│   ├── index.ts                # publicRouter (4 endpoint 集約)
│   ├── stats.ts                # GET /public/stats
│   ├── members.ts              # GET /public/members
│   ├── member-profile.ts       # GET /public/members/:memberId
│   └── form-preview.ts         # GET /public/form-preview
├── use-cases/public/
│   ├── get-public-stats.ts
│   ├── list-public-members.ts
│   ├── get-public-member-profile.ts
│   └── get-form-preview.ts
├── view-models/public/
│   ├── public-stats-view.ts
│   ├── public-member-list-view.ts
│   ├── public-member-profile-view.ts
│   └── form-preview-view.ts
└── _shared/
    ├── public-filter.ts
    ├── search-query-parser.ts
    ├── pagination.ts
    └── visibility-filter.ts
```

## 2. SQL where 雛形

### GET /public/members（pagination + tag AND）
```sql
SELECT m.member_id, m.response_email, m.current_response_id, m.last_submitted_at
FROM members m
JOIN member_status s ON s.member_id = m.member_id
WHERE s.public_consent = 'consented'
  AND s.publish_state = 'public'
  AND s.is_deleted = 0
  -- tag AND filter (subquery)
  AND (:tag_count = 0 OR m.member_id IN (
       SELECT mt.member_id FROM member_tags mt
       JOIN tag_definitions td ON td.tag_id = mt.tag_id
       WHERE td.code IN (:tag_codes)
       GROUP BY mt.member_id
       HAVING COUNT(DISTINCT td.code) = :tag_count
  ))
  AND (:q IS NULL OR m.search_text LIKE '%' || :q || '%')
ORDER BY CASE :sort WHEN 'recent' THEN m.last_submitted_at END DESC,
         CASE :sort WHEN 'name' THEN m.member_id END ASC
LIMIT :limit OFFSET :offset;
```

検索対象は `member_responses.search_text`（`fullName/nickname/occupation/location/businessOverview/skills/canProvide/selfIntroduction/tags` を 03b sync 時に concat 済み）。zone / status は member view から JSON 解釈、または response_fields の特定 stable_key で絞る（実装は use-case で repository 関数を組み合わせ）。

### GET /public/members/:memberId（公開フィルタ EXISTS）
```sql
SELECT 1 FROM member_status s
WHERE s.member_id = :memberId
  AND s.public_consent = 'consented'
  AND s.publish_state = 'public'
  AND s.is_deleted = 0;
-- 0 件なら 404
```

### GET /public/stats
```sql
SELECT COUNT(*) FROM member_status
 WHERE public_consent='consented' AND publish_state='public' AND is_deleted=0;
SELECT COUNT(*) FROM meeting_sessions WHERE held_on >= date('now','start of year');
SELECT * FROM meeting_sessions ORDER BY held_on DESC LIMIT 5;
SELECT job_type, status, started_at, finished_at FROM sync_jobs
 WHERE job_type IN ('schema_sync','response_sync')
 ORDER BY started_at DESC LIMIT 1;
```

### GET /public/form-preview
```sql
SELECT * FROM schema_questions
 WHERE revision_id = (SELECT revision_id FROM schema_versions WHERE state='active' LIMIT 1)
 ORDER BY position;
```

## 3. view converter（leak 二重チェック）

```ts
export const toPublicMemberProfile = (src: ProfileSource): PublicMemberProfile => {
  if (
    src.status.publicConsent !== 'consented' ||
    src.status.publishState !== 'public' ||
    src.status.isDeleted
  ) throw new ApiError({ code: 'UBM-1404' });

  const safe = {
    memberId: src.member.memberId,
    summary: src.summary,
    publicSections: src.sections.map(sec => ({
      ...sec,
      fields: sec.fields.filter(f => f.visibility === 'public'), // AC-3
    })),
    tags: src.tags.map(t => ({ code: t.code, label: t.label, category: t.category })),
  };
  // runtime delete forbidden keys（型レベルでは Omit、二重防御）
  delete (safe as Record<string, unknown>).responseEmail;
  delete (safe as Record<string, unknown>).rulesConsent;
  delete (safe as Record<string, unknown>).adminNotes;
  return PublicMemberProfileZ.parse(safe); // fail close
};
```

## 4. dependency matrix

| 用途 | 関数 | 提供元 module |
| --- | --- | --- |
| public member 一覧 + 公開フィルタ + tag AND | use-case 内で `members + member_status + member_tags` を組合せ | 02a / 02b 関数を合成 |
| current_response | `findCurrentResponse(ctx, memberId)` | 02a |
| response_fields | `listFieldsByResponseId(ctx, responseId)` | 02a |
| sections | `listSectionsByResponseId(ctx, responseId)` | 02a |
| status snapshot | `getStatus(ctx, memberId)` | 02a |
| meetings | `listRecentMeetings(ctx, n)` / `listMeetings(ctx, ...)` | 02b |
| tag definitions | `listAllTagDefinitions(ctx)` | 02b |
| member tags | `listTagsByMemberId(ctx, memberId)` | 02b |
| schema questions | `listFieldsByVersion(ctx, revisionId)` | 02b |
| sync_jobs | `findLatestPerKind(ctx, ['schema_sync','response_sync'])` | 共通 |
| zod schema | `Public*ViewZ` / `FormPreviewViewZ` | 01b (`@ubm-hyogo/shared`) |

## 5. Cache-Control 方針

| endpoint | Cache-Control |
| --- | --- |
| `/public/stats` | `public, max-age=60` |
| `/public/form-preview` | `public, max-age=60` |
| `/public/members` | `no-store`（admin 操作の即時反映） |
| `/public/members/:memberId` | `no-store` |

## 6. router マウント

`apps/api/src/index.ts` 末尾で `app.route('/public', publicRouter)`。
`/public/*` には session middleware を適用しない（AC-9 / 不変条件 #5 公開境界）。
