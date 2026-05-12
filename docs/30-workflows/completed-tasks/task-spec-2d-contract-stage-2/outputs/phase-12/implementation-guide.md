# Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要かというと、練習ではうまく動いた画面が、本番のサーバーにつないだ瞬間に止まる事故を防ぐためです。何をするかというと、画面が使う仮の返事とサーバーが受け取れる形を、同じ検査で比べます。

画面を作るとき、まだ本物のサーバーに繋がない状態で「この形の返事が返ってくるはず」という仮の返事を用意します。これは、学校の文化祭で本番前にリハーサルをして、受付係と会計係のやり取りを先に確かめるようなものです。

たとえば、リハーサルで使った紙の書き方と、本番の受付で必要な紙の書き方が違うと、本番当日に止まってしまいます。この task の contract test は、画面側の仮の返事とサーバー側の受け取りルールを同じ検査に通し、形が合っているかを確かめます。

ズレがあれば CI が赤くなります。つまり、本番で初めて「その形では受け取れません」と分かる事故を、作っている途中で見つけられます。

### 今回作ったもの

このサイクルでは、検査ファイル、検査で見る 7 つの受付口、検査結果を残す場所を作りました。ローカルでは 21 個の検査が通っており、残っているのは commit / push / PR / CI 実行のユーザー承認ゲートです。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
|----------|--------------------|
| fixture | リハーサル用の仮データ |
| zod schema | 受け取れる形を決めたルール表 |
| contract test | 約束どおりの形か確かめる検査 |
| endpoint | サーバーの受付口 |
| CI | 変更を自動で点検する仕組み |

## Part 2: 技術者向け

### 対象 endpoint

`GET /admin/requests`、`POST /admin/requests/:noteId/resolve`、`GET /admin/identity-conflicts`、`POST /admin/identity-conflicts/:id/merge`、`POST /admin/identity-conflicts/:id/dismiss`、`POST /admin/members/:memberId/delete`、`GET /admin/audit` の 7 endpoint を対象にする。

### TypeScript / API Contract

```ts
type ContractStage2Endpoint =
  | "GET /admin/requests"
  | "POST /admin/requests/:noteId/resolve"
  | "GET /admin/identity-conflicts"
  | "POST /admin/identity-conflicts/:id/merge"
  | "POST /admin/identity-conflicts/:id/dismiss"
  | "POST /admin/members/:memberId/delete"
  | "GET /admin/audit";

interface ContractStage2Fixture {
  endpoint: ContractStage2Endpoint;
  body: unknown;
}

import { ListRequestsQueryZ } from "../requests";
import { ListAuditQueryZ } from "../audit";
import { DeleteBodyZ } from "../member-delete";
import {
  MergeIdentityRequestZ,
  MergeIdentityResponseZ,
  DismissIdentityConflictRequestZ,
  DismissIdentityConflictResponseZ,
  IdentityConflictRowZ,
  ListIdentityConflictsResponseZ,
  adminRequestResolveBodySchema,
} from "@ubm-hyogo/shared";
```

### APIシグネチャ

```ts
function validateContractStage2Fixture(fixture: ContractStage2Fixture): void;
```

実装では専用関数を export せず、Vitest 内で `schema.parse(fixture.body)` を直接呼び出す。上記は検証責務のシグネチャを説明するための contract 表現である。

### 使用例

```ts
expect(() => DeleteBodyZ.parse({ reason: "退会希望" })).not.toThrow();
expect(() => DeleteBodyZ.parse({ reason: "" })).toThrow();
expect(() => MergeIdentityResponseZ.parse({
  mergedAt: "2026-05-11T00:00:00.000Z",
  targetMemberId: "m_001",
  archivedSourceMemberId: "m_002",
  auditId: "audit_001",
})).not.toThrow();
```

### エラーハンドリング

- `reason` empty / missing / 501 characters must throw.
- Invalid `resolution` must throw.
- Invalid `actorEmail` must throw.
- `MergeIdentityResponseZ` must include `archivedSourceMemberId` and `auditId`.

### エッジケース

- `DeleteBodyZ.parse({ reason: "" })` は min boundary として throw する。
- `DeleteBodyZ.parse({})` は required field 欠落として throw する。
- `DeleteBodyZ.parse({ reason: "a".repeat(501) })` は max boundary として throw する。
- 2b の handwritten merge response が `sourceMemberId` を使っていても、shared schema の `archivedSourceMemberId` を正とする。

### 設定項目と定数一覧

| parameter | value |
|-----------|-------|
| test file | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| line target | 200-260 |
| describe count | 7 |
| `z.object(` in test | 0 |
| skip count | 0 |

### 実 fixture drift 対策

`GET /admin/requests` と `GET /admin/audit` は手書き subset 型ではなく、route module から export した response schema（`AdminRequestsListResponseZ` / `AdminAuditListResponseZ`）で fixture 全体を parse する。これにより `status/type/createdAt` のような旧 shape ではなく、実 API / SSR fixture と同じ `noteType/requestStatus/requestedAt/memberSummary`、`actorEmail/targetType/maskedBefore/maskedAfter/parseError/appliedFilters` を検証対象にする。

### テスト構成

| describe | 主な検証 |
|----------|----------|
| `GET /admin/requests` | query parse + response type-level |
| `POST /admin/requests/:noteId/resolve` | approve / reject / invalid resolution |
| `GET /admin/identity-conflicts` | row schema + list response |
| `POST /admin/identity-conflicts/:id/merge` | request / response / reason empty |
| `POST /admin/identity-conflicts/:id/dismiss` | request / response / reason empty |
| `POST /admin/members/:memberId/delete` | reason min / missing / max |
| `GET /admin/audit` | query parse + actorEmail invalid |
