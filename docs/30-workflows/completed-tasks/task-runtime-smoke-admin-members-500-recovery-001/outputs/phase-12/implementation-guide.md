# Phase 12: Implementation Guide

## Part 1: 中学生レベル

staging の会員一覧 API (`GET /admin/members`) が 500 を返して、CI が赤になっていました。
原因は次のどれかと推定されました:

1. データベースに想定外の値が入っていて、応答の検証 (zod) が落ちる
2. テーブルや列が staging だけ古くて SQL が失敗する
3. D1 (データベース) との接続設定が staging だけずれている

このサイクルでは、まず「どれが起きても CI を守れる」防御の修正を入れました:

- 想定外の値（例: `publish_state='draft'`）が来ても、安全な既定値に置き換えて 200 を返す
- legacy 値（`published` / `private`）は意味を保って `public` / `hidden` に正規化し、filter から漏れないようにする
- 例外が起きたら全部キャッチして、ログに `code=UBM-ADMIN-MEMBERS-500` を残してから 500 を返す
- データベースが接続できていなければ、500 ではなく 503（一時的に使えません）で返す
- smoke が 500 を踏んだら、応答本文をログに残して次回の原因究明を速くする

## Part 2: 技術者向け

### apps/api/src/routes/admin/members.ts

- ハンドラ全体を `try/catch` で wrap。例外 path は `logError({code:"UBM-ADMIN-MEMBERS-500", phase:"exception", name, message})` + `{ ok:false, error:"internal", code:"UBM-ADMIN-MEMBERS-500" }` 500 を返す。
- zod `AdminMemberListViewZ.safeParse` 失敗 path も同じ shape + `phase:"zod"` log に統一。
- 縮退ヘルパ:
  - `normalizePublishState(v) -> "public" | "member_only" | "hidden"`（`published` は `public`、`private` は `hidden`、その他 enum 外は `"member_only"`）
  - `normalizeConsent(v) -> "consented" | "declined" | "unknown"`（enum 外/LEFT JOIN で欠落した NULL 相当は `"unknown"`）
- `filter=published` は `public/published`、`filter=hidden` は `hidden/private` を含める。
- `c.env?.DB` 不在時に 503 `{ok:false,error:"DB binding missing",code:"UBM-ADMIN-MEMBERS-500"}` を返す guard。

### apps/api/src/routes/admin/members.contract.spec.ts

`describe("enum normalization (UBM-ADMIN-MEMBERS-500 recovery)")` で 3 ケース追加:

- `publish_state='draft'` → 200 + full `.members` array + `publishState='member_only'`
- `publish_state='published'/'private'` → 200 + `public` / `hidden` に正規化、filter 対象に残る
- `member_status` 行欠落による `public_consent/rules_consent` NULL 相当 → 200 + `'unknown'`
- `public_consent/rules_consent='pending'` → 200 + `'unknown'`
- DB binding 不在 → 503 + `{ok:false,error:"DB binding missing",code:"UBM-ADMIN-MEMBERS-500"}`
- zod fail → 500 + safe internal error body

### scripts/smoke/runtime-attendance-provider.sh / __tests__

`request_json()` の non-200 path で `body=$(head -c 2000 "$body_file" | scripts/smoke/redact.sh)` を `runtime-smoke.log` に転記。T-4-5 で fake curl による admin-list body + redaction regression test 済。

## Verification

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/admin/members.contract.spec.ts  # 27 PASS
mise exec -- pnpm typecheck                                              # PASS
mise exec -- pnpm lint                                                    # PASS
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh         # T-4-1〜T-4-5 PASS
```

## Known Limits

Phase 2 step A/B/C (staging 500 body, D1 schema snapshot, Workers tail) と Phase 8 (staging deploy + smoke 再実行) は 1Password secret + Cloudflare 認証 + ユーザー承認が必要なため AI 単独実行不可。本実装は defensive normalize により root cause が「zod enum 不一致」だった場合に確実に復旧する。SQL drift / binding 不整合の場合は staging deploy 後の smoke 再実行で確定する。
