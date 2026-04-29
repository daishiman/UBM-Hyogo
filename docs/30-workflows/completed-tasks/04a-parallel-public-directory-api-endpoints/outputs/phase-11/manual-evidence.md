# Phase 11 — Manual smoke evidence template

> 実行コマンドと出力を以下の枠に貼付すること。staging URL は Cloudflare Pages の deploy 完了時に確定する。

## 共通変数

```bash
export BASE_URL="https://api-staging.example.workers.dev"   # staging URL に置換
export ELIGIBLE_MEMBER_ID="m-eligible-001"
export INELIGIBLE_MEMBER_ID="m-declined-001"
```

## 1. `GET /public/stats`

```bash
curl -i "$BASE_URL/public/stats"
```

**期待**:
- HTTP 200
- `Cache-Control: public, max-age=60`
- body に `memberCount / publicMemberCount / zoneBreakdown / membershipBreakdown / meetingCountThisYear / recentMeetings / lastSync.{schemaSync,responseSync,...} / generatedAt` が揃う

**実行結果**: _未実施_

## 2. `GET /public/members`

```bash
curl -i "$BASE_URL/public/members?q=engineer&zone=0_to_1&tag=ai&page=1&limit=10"
```

**期待**: HTTP 200, `Cache-Control: no-store`, `items: [...]`, `pagination: {...}`, `appliedQuery` で query echo。

**実行結果**: _未実施_

## 3. `GET /public/members/:id` (適格)

```bash
curl -i "$BASE_URL/public/members/$ELIGIBLE_MEMBER_ID"
```

**期待**: HTTP 200, `Cache-Control: no-store`, `summary` + `publicSections` + `tags`, `responseEmail / rulesConsent / adminNotes` を **含まない**。

**実行結果**: _未実施_

## 4. `GET /public/members/:id` (不適格)

```bash
curl -i "$BASE_URL/public/members/$INELIGIBLE_MEMBER_ID"
```

**期待**: HTTP 404, body に member 情報を含まない (`{"error":{"code":"UBM-1404",...}}`)。

**実行結果**: _未実施_

## 5. `GET /public/form-preview`

```bash
curl -i "$BASE_URL/public/form-preview"
```

**期待**: HTTP 200, `Cache-Control: public, max-age=60`, `manifest`, `fields[]`, `sectionCount`, `fieldCount`, `responderUrl` が固定 URL or env override 値。

**実行結果**: _未実施_

## 6. 未認証アクセス確認 (AC-9)

```bash
# cookie 無しで全 4 endpoint を叩く
curl -i -H "Cookie:" "$BASE_URL/public/stats"
curl -i -H "Cookie:" "$BASE_URL/public/members"
curl -i -H "Cookie:" "$BASE_URL/public/members/$ELIGIBLE_MEMBER_ID"
curl -i -H "Cookie:" "$BASE_URL/public/form-preview"
```

**期待**: 全て 200 (or 不適格は 404)、cookie 有無で response 同一。

**実行結果**: _未実施_

## 7. leak grep

```bash
# 全 endpoint の response を集約し leak key を検査
for ep in stats "members?limit=100" "members/$ELIGIBLE_MEMBER_ID" "form-preview"; do
  curl -s "$BASE_URL/public/$ep" | grep -E "responseEmail|rulesConsent|adminNotes" && echo "LEAK in $ep" || echo "OK: $ep"
done
```

**期待**: 全 `OK: ...`。

**実行結果**: _未実施_
