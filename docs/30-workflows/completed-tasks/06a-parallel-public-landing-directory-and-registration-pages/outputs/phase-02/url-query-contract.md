# url-query-contract.md — `/members` URL query 正規化

## zod schema (apps/web/src/lib/url/members-search.ts)

```ts
import { z } from "zod";

export const membersSearchSchema = z.object({
  q: z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, " ").slice(0, 100))
    .catch(""),
  zone: z.enum(["all", "0_to_1", "1_to_10", "10_to_100"]).catch("all"),
  status: z.enum(["all", "member", "non_member", "academy"]).catch("all"),
  tag: z
    .array(z.string().min(1))
    .transform((arr) => arr.slice(0, 5))
    .catch([]),
  sort: z.enum(["recent", "name"]).catch("recent"),
  density: z.enum(["comfy", "dense", "list"]).catch("comfy"),
});

export type MembersSearch = z.infer<typeof membersSearchSchema>;
```

## helper

| 関数 | 役割 |
| --- | --- |
| `parseSearchParams(searchParams: Record<string,string\|string[]\|undefined>): MembersSearch` | App Router の `searchParams` を正規化 |
| `toApiQuery(search: MembersSearch): URLSearchParams` | API 呼び出し用 query を生成（tag は repeated） |

## 不正値の処理（catch fallback）

| 入力 | 結果 |
| --- | --- |
| `?zone=invalid` | `zone="all"` |
| `?density=compact` | `density="comfy"` |
| `?sort=foo` | `sort="recent"` |
| `?tag=` 6 件 | 5 件で truncate |
| `?q=  hello   world  ` | `q="hello world"` |
| `?q=<200 文字>` | `q=` 200 文字 truncate |

## API 連携（toApiQuery）

| 入力 search | 生成 URLSearchParams |
| --- | --- |
| `{q:"x",zone:"all",status:"all",tag:[],sort:"recent",density:"comfy"}` | `q=x&sort=recent&density=comfy`（zone/status/tag は all/empty 時に省略） |
| `{q:"",zone:"0_to_1",status:"member",tag:["ai","dx"],sort:"name",density:"dense"}` | `zone=0_to_1&status=member&tag=ai&tag=dx&sort=name&density=dense` |

## 不変条件への対応

- #1: enum 値は spec 由来の stableKey 互換のみ
- #6: localStorage / window.UBM 経由の状態退避なし
- #8: 全状態が URL query 正本

## test ID 紐付け

| ID | 入力 | 期待 | 不変条件 |
| --- | --- | --- | --- |
| U-01 | `?q=hello&zone=0_to_1` | `{q:"hello",zone:"0_to_1",...defaults}` | #8 |
| U-02 | `?zone=invalid` | `zone="all"` | #8 |
| U-03 | `?density=compact` | `density="comfy"`（不採用 enum 拒否） | #8 |
| U-04 | `?tag=ai&tag=dx` | `tag=["ai","dx"]` | - |
| U-05 | tag 6 件 | 5 件 truncate | - |
| U-06 | `?q="  hello   world  "` | `q="hello world"` | - |
