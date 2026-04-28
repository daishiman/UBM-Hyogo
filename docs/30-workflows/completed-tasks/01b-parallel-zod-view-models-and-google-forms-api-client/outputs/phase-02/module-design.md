# Phase 2: module 分割設計

> Phase 2 サブ成果物。`packages/shared` と `packages/integrations/google` のファイル単位構成を定義する。

## 1. packages/shared

| ファイル | 内容 | 実装状況 |
| --- | --- | --- |
| `src/branded/index.ts` | 7 branded type（MemberId / ResponseId / ResponseEmail / StableKey / SessionId / TagId / AdminId） + `as*` ヘルパ | done |
| `src/types/schema/index.ts` | FormSchema / FormSection / FormQuestion | done |
| `src/types/response/index.ts` | FormResponse / FormResponseAnswer | done |
| `src/types/identity/index.ts` | MemberIdentity / MemberStatus | done |
| `src/types/viewmodel/index.ts` | viewmodel 10 種 | done |
| `src/zod/primitives/` | email / id / datetime 等の基本 zod | done |
| `src/zod/field/` | 31 項目 zod field schema | done |
| `src/zod/schema/` | FormSchemaZ | done |
| `src/zod/response/` | FormResponseZ / FormResponseAnswerZ | done |
| `src/zod/identity/` | MemberIdentityZ / MemberStatusZ | done |
| `src/zod/viewmodel/` | viewmodel 10 種 zod parser | done |
| `src/utils/consent.ts` | consent normalizer（旧キー → 新キー） | done |
| `src/index.ts` | barrel export | done |

## 2. packages/integrations/google

| ファイル | 内容 | 実装状況 |
| --- | --- | --- |
| `src/forms/auth.ts` | service account JWT → access token | done |
| `src/forms/backoff.ts` | 429 / 5xx exponential backoff | done |
| `src/forms/mapper.ts` | Google API response → FormSchema / FormResponse 変換 | done |
| `src/forms/client.ts` | getForm / listResponses 実装 | done |
| `src/index.ts` | barrel export | done |

## 3. パッケージ名

| 仕様書表記 | 実装 |
| --- | --- |
| `@ubm/shared` | `@ubm-hyogo/shared` |
| `@ubm/integrations/google` | `@ubm-hyogo/integrations-google` |

> Wave 2 以降の import は `@ubm-hyogo/*` を使用すること。

## 4. import barrel ルール

- `packages/shared/src/index.ts` から `types` / `branded` / `zod` / `utils` のすべてを再エクスポート。
- `packages/integrations/google/src/index.ts` から `forms` 配下のクライアント factory のみ公開（`auth` / `backoff` は内部実装）。
- 各サブモジュールは `index.ts` を持ち、深い path import は避ける。

## 5. 4 層 ↔ ファイル対応図

```
schema 層    → packages/shared/src/types/schema/
response 層  → packages/shared/src/types/response/
identity 層  → packages/shared/src/types/identity/
viewmodel 層 → packages/shared/src/types/viewmodel/
              ↑ それぞれ packages/shared/src/zod/{schema,response,identity,viewmodel} で zod 化
```
