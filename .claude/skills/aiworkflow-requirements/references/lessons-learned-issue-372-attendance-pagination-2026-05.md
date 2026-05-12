# Lessons Learned — Issue #372 Attendance Pagination (2026-05)

`/me/attendance` と `/admin/members/:memberId/attendance` に cursor pagination を導入し、`MemberProfile.attendanceMeta?` で hasMore / nextCursor を返す実装で得られた知見。根拠は `apps/api/src/repository/attendance.ts` / `apps/api/src/repository/_shared/builder.ts` / `apps/api/src/routes/me/index.ts` / `apps/api/src/routes/admin/members.ts` / `docs/30-workflows/issue-372-attendance-pagination/outputs/phase-12/implementation-guide.md`。

---

## L-ISSUE372-001: cursor は encoded string 境界と decoded 構造体境界を route / builder / repository で明確に分ける

### 現象
cursor を `{ heldOn, sessionId }` の構造体のまま route に通すと、HTTP 400（不正 cursor）の検知点が repository まで遅延し、route テストで境界が曖昧になる。

### 原因分析
HTTP 層は base64url の opaque string を扱い、SQL 層は decoded tuple を必要とする。型を 1 つに統一すると「decode に失敗する責務」と「SQL where に渡す責務」が混在する。

### 採用解決策
- `AttendanceCursor = { heldOn: string; sessionId: MeetingSessionId }`（decoded）と encoded `string` を別型として扱う。
- route / builder は encoded string を受け、`decodeAttendanceCursor` の失敗を HTTP 400 へ即時 map。
- repository は decoded `AttendanceCursor` のみ受け取り、SQL の `held_on < ? OR (held_on = ? AND session_id < ?)` 条件で tie-break する。

### 再利用ガイド
cursor pagination を実装する API では、HTTP 境界 / リクエスト整形層 / SQL 層の 3 段で型を明示分離する。`limit < 1` と decode 失敗は HTTP 400、`limit > 200` は 200 に clamp する固定ポリシーをスキーマと同期させる。

---

## L-ISSUE372-002: 既存 bulk API（`findByMemberIds`）には pagination を混ぜず個人特化 API を追加する

### 現象
member 単位 cursor を `findByMemberIds(ids[])` に拡張すると、複数 member ごとに cursor 配列を持たせる必要があり、契約と SQL が複雑化する。

### 原因分析
bulk API は admin リスト用の N members one-shot fetch が主用途。member ごと history を pagination する要求は per-member 詳細表示のみで、bulk と read pattern が異なる。

### 採用解決策
- 既存 `findByMemberIds(ids)` は scope-out として温存（変更しない）。
- 個人特化 `findByMemberId(id, opts: AttendancePageOptions?)` を新設し、`AttendancePageResult { records, hasMore, nextCursor }` を返す。
- ルートも `/me/attendance` と `/admin/members/:memberId/attendance` の dedicated endpoint に分離。

### 再利用ガイド
既存 bulk API に pagination を後付けする前に、利用パターン（list 用 vs detail 用）を切り分ける。read pattern が異なる場合は API を分離し、bulk は scope-out として `unassigned-task-detection.md` に明示記録する。

---

## L-ISSUE372-003: `MemberProfile.attendance` 配列は維持し、メタ情報は optional `attendanceMeta` に分離する

### 現象
pagination 導入で `attendance` を `{ records, hasMore, nextCursor }` に置換すると、未対応 caller が全件取得 contract で動かなくなり、既存 admin / public の view model 互換が崩れる。

### 原因分析
`MemberProfile` は admin detail / member self-service / 既存 bulk view で共有される。配列形を破壊変更すると downstream 全体に impact が広がる。

### 採用解決策
- `MemberProfile.attendance: ReadonlyArray<AttendanceRecord>` は配列のまま据え置き。
- `attendanceMeta?: { hasMore: boolean; nextCursor: string | null }` を optional field として追加し、shared zod も optional schema にする。
- builder は cursor を解釈する場合だけ `attendanceMeta` を注入する。

### 再利用ガイド
view model にメタ情報を足す際は、既存 field の型を破壊せず optional sibling として並置する。互換性維持と機能拡張は「optional 追加 + builder 注入境界」で両立できる。

---

## L-ISSUE372-004: miniflare 全体 vitest は EADDRNOTAVAIL でポート枯渇する。focused run を採用する

### 現象
`pnpm exec vitest run` で全テストを並列起動すると miniflare instance が大量同時 listen し、macOS で `EADDRNOTAVAIL` を起こして 18 ファイル / 127 ケースが環境的に fail する。

### 原因分析
miniflare はテストファイルごとに ephemeral worker を立てるため、並列度が高いと OS の port 確保を超えて失敗する。コード起因ではなく test runner concurrency の限界。

### 採用解決策
- issue-372 で追加・改修した範囲は対象ファイルを個別実行で pass 確認:
  `apps/api/src/repository/__tests__/attendance-pagination.test.ts`、`builder.test.ts`、`apps/api/src/routes/me/index.test.ts`、`apps/api/src/routes/admin/members.test.ts`、`apps/web/src/components/admin/__tests__/MemberDrawer.component.spec.tsx`。
- 全体 vitest の EADDRNOTAVAIL は env-issue として `outputs/phase-12/implementation-guide.md` に分離記録し、PR ブロッカーにしない。

### 再利用ガイド
miniflare 利用テストは focused 実行を default とし、CI ではファイル単位 shard / `--pool=forks --poolOptions.forks.singleFork=true` などで並列度を抑える。`vitest run` 全体実行が落ちても scope 範囲の個別 pass を evidence にする運用に倒す。

---

## L-ISSUE372-005: 1Password CLI authorization timeout でフルビルドが落ちても、コード起因と環境起因を切り分けて記録する

### 現象
`pnpm build`（`scripts/with-env.sh` 経由 = `op run --env-file=.env`）実行中に 1Password CLI 認可セッションが timeout し、Cloudflare 系シークレット注入前にフルビルドが中断する。

### 原因分析
local review cycle では op session が短命で、複数パッケージの直列ビルド時間中に session expiration が起こる。コード由来の失敗ではない。

### 採用解決策
- shared / integrations 単位の個別 `tsc` build は green を確認（`pnpm --filter @ubm-hyogo/shared build` 等）。
- フルビルド未完了は `outputs/phase-12/implementation-guide.md` 検証表で `⚠ 1Password CLI authorization timeout により未完了（環境要因）。コード起因ではない` と明示分離。
- staging deploy / Phase 11 visual evidence は user approval 後の runtime cycle で再実行する。

### 再利用ガイド
`with-env.sh` を介す long-running 操作で op timeout が起きたら、1) 個別パッケージ build で型整合だけ green を確認、2) 環境要因として task spec compliance check に明記、3) runtime gate（user approval）で fresh op session を取り直してリトライ、の 3 点セットで処理する。コード修正に逃げない。

---

## L-ISSUE372-006: Phase 11 staging visual evidence は runtime session 必要なので Phase 12 spec sync の blocker にしない

### 現象
Phase 11 の screenshots / curl JSON は staging deploy + authenticated browser session が必要で、ローカル review cycle では取得不可能。Phase 12 の system spec sync を pending にすると skill / API doc 更新が永続的に遅延する。

### 原因分析
visual evidence と仕様正本同期は責務が違う。前者は runtime 環境ゲート、後者は実装が local 確認できれば即同期できる。両者を直列依存にすると progress が止まる。

### 採用解決策
- 状態を `implemented-local / Phase 11 visual evidence pending` の 2 軸で表現し、`outputs/phase-12/system-spec-update-summary.md` 判定を `PASS_IMPLEMENTED_LOCAL_PHASE11_VISUAL_PENDING` に固定。
- API doc (`docs/00-getting-started-manual/specs/01-api-schema.md`) と aiworkflow `references/api-endpoints.md` は code 実体に合わせて先行更新。
- staging deploy / browser screenshot / curl evidence は Phase 13 PR 前の user-approved runtime cycle で取得する。

### 再利用ガイド
runtime 依存の evidence は Phase 12 の同期 wave から外し、専用 pending 状態で track する。仕様正本の同期 blocker を「実装が local 整合しているか」に絞り、runtime 取得は別ゲートで管理する。

---

## 参照元

- `apps/api/src/repository/attendance.ts`（cursor encode/decode、`findByMemberId(id, opts?)`、LIMIT N+1）
- `apps/api/src/repository/_shared/builder.ts`（encoded cursor → `attendanceMeta` 注入）
- `apps/api/src/routes/me/index.ts`、`apps/api/src/routes/admin/members.ts`（HTTP 境界の cursor / limit handling）
- `packages/shared/src/types/viewmodel/index.ts`、`packages/shared/src/zod/viewmodel.ts`（optional `attendanceMeta`）
- `apps/web/app/profile/_components/AttendanceList.tsx`、`apps/web/src/components/admin/MemberDrawer.tsx`（load-more UI）
- `docs/30-workflows/issue-372-attendance-pagination/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-372-attendance-pagination/outputs/phase-12/system-spec-update-summary.md`
