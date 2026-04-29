# Phase 9 — Leak Test Report

## 概要

不変条件 #2 / #3 / #11 (consent / responseEmail / admin-managed) の leak が無いことを、unit test と converter の二重防御で担保。

## 実施 leak test

| # | suite | 検証内容 | 結果 |
| --- | --- | --- | --- |
| L-1 | `public-filter.test.ts` | `isPublicStatus` が declined / unknown / member_only / hidden / deleted を全て reject | PASS (5 cases) |
| L-2 | `public-member-profile-view.test.ts` "returns profile with public visibility fields only" | input に `responseEmail / rulesConsent / adminNotes / phoneNumber(member_only)` を含めても response JSON に出ない | PASS |
| L-3 | 同 "throws UBM-1404 for declined consent" | declined consent で converter が `ApiError UBM-1404` を投げる | PASS |
| L-4 | 同 .each (4 cases) | hidden / member_only publish、deleted、unknown consent 全て例外 | PASS |
| L-5 | `public-member-list-view.test.ts` "strips forbidden keys at runtime" | repo 漏れを想定し input に leak key 注入 → response から除去 | PASS |

## 防御層

1. **SQL where**: `buildPublicWhereParams()` — `publicConsent='consented' AND publishState='public' AND is_deleted=0`。
2. **Repository EXISTS check**: `existsPublicMember` で 404 早期判定（fingerprint hiding）。
3. **Converter status 二重チェック**: `toPublicMemberProfile` 内で `isPublicStatus(src.status)` 再評価。
4. **Visibility filter**: `keepPublicFields` で `visibility != 'public'` の field を sectionMap に積まない。
5. **Runtime delete**: FORBIDDEN_KEYS (`responseEmail / rulesConsent / adminNotes`) を converter で `delete`。
6. **Zod `.strict()`**: 残った未知 key で parse fail → 500 fail close（漏らすより落とす）。

## 検索対象列の検査 (AC-10)

`apps/api/src/repository/publicMembers.ts` 内の `q LIKE` 対象は `member_responses.search_text` のみ。`responseEmail` 列は SELECT にも WHERE にも含まれない。

```bash
# 念のため検証用 grep
grep -n "responseEmail\|response_email" apps/api/src/repository/publicMembers.ts || echo "no match"
```

## 結論

- leak ゼロ — unit / converter / SQL の 6 層防御で押さえ込み済み。
- contract / integration の miniflare ベース leak test は Phase 10 / 11 の manual smoke で `curl` 確認に置換。
