# Phase 6 Output: 異常系検証

Status: completed

確認済み境界:

- PATCH unknown id: 404
- PATCH invalid body: 422 contract
- export unknown / deleted meeting: 404
- attendances alias duplicate / deleted member / unknown member / missing or soft-deleted session: attendance repository resultをHTTP境界へ変換
- unauthenticated admin route: 401
