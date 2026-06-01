# Phase 12 実装ガイド — 公開 members list の tags 一括取得（N+1 防止）

## Part 1: 中学生にもわかる説明（専門用語なし）

### なぜ必要か

会員が増えるほど一覧の表示が遅くなる作りを避けるためです。タグを 1 人ずつ取りに行くと、
会員数に合わせて問い合わせ回数も増えます。今回の目的は、必要なときだけ全員ぶんのタグをまとめて取り、
今までタグを求めていない利用者には同じ応答を返し続けることです。

### 何をするか

会員一覧ページで、「この人にはどんなタグ（趣味や所属のラベル）が付いているか」を、
一覧に出せるようにしたい、というお話です。

### 「1 人ずつ取りに行く」とどうなる？

たとえばクラス 30 人ぶんの「持ち物リスト」を、職員室の棚から取ってくるとします。

- **悪いやり方**: 「1 番さんのリストください」と職員室まで行く → 戻る →
  「2 番さんのリストください」とまた行く → 戻る …… これを 30 回くり返す。
  歩く回数が人数ぶんに増えるので、人数が多いほどどんどん遅くなります。
  プログラムの世界では、これを **N+1 問題**（人数 N にプラス 1 回ぶん、
  むだに往復してしまう問題）と呼びます。

- **良いやり方**: 「1 番から 30 番まで、全員のリストを一度にください」と
  1 回だけ職員室に行く。これなら歩く回数は **たった 1 回**。
  人数が 30 人でも 100 人でも、行く回数は変わりません。

### なぜ「まとめて 1 回」が速いの？

職員室まで歩く時間（＝データベースに問い合わせる時間）が、いちばん時間のかかる部分だからです。
リストを棚から探すこと自体はすぐ終わります。だから「往復の回数」をへらすのがいちばん効きます。
今回のしくみは、まさにこの「全員ぶんを 1 回でまとめて取ってくる」やり方にしました。

### もう 1 つの工夫: 「ほしい人だけ」に渡す

タグはいつも必要なわけではありません。そこで、
「タグもほしいよ」と合図（`expand=tags` という指定）をしたときだけ、まとめて取ってきて渡します。
合図がなければ、これまで通りタグなしの一覧をそのまま返すので、今までの動きは何も変わりません。

### まとめ

- タグを 1 人ずつ取りに行く（N+1）と、人数が増えるほど遅い。
- 全員ぶんを 1 回でまとめて取れば、人数が増えても速いまま。
- 「タグもほしい」と合図したときだけまとめて取る。合図がなければ今まで通り。

### 今回作ったもの

- `expand=tags` という合図の仕様。
- その合図があるときだけ、全員ぶんのタグを 1 回で取る実装手順。
- タグを返す形（code / label / category）と、N+1 に戻らないことを確かめるテスト計画。

---

## Part 2: 技術者向け実装ガイド

> 識別子は実コード（2026-05-31 verbatim 確認）に一致。変更は **5 ファイル編集 + helper 無改変**。
> 新規 D1 query はゼロ（既存 batch helper を再利用）。

### 全体データフロー

```
route: apps/api/src/routes/public/members.ts  ※変更なし
  searchParams を全取り込み（expand も raw に入る）
  └─ parsePublicMemberQuery(raw) → query.expand: ("tags")[]（常に配列・default []）
       └─ listPublicMembersUseCase(query, { ctx })
            1. Promise.all([listPublicMembers, countPublicMembers, aggregateTopTags])（既存・visibility filter 適用）
            2. fields は member 毎取得（既存 N+1・別系統・本 issue 非対象）
            3. wantTags = query.expand.includes("tags")
                 wantTags のとき: listTagsByMemberIds(ctx, memberIds) を 1 回 → memberId で groupBy
                 未指定のとき:    tags query 発行なし
            4. item push: ...(wantTags ? { tags: byMember.get(m.member_id) ?? [] } : {})
       └─ toPublicMemberListView: stripForbidden（tags は forbidden でない＝素通し）
          → PublicMemberListResponseZ.parse（tags optional を通す）
```

### (1) expand パース — `apps/api/src/_shared/search-query-parser.ts`

設定値（whitelist）は `EXPAND_WHITELIST` 1 か所に集約する。未知値は throw せず黙って除外し、
結果は常に配列（default `[]`）。既存 parser の `.catch()` / `safeParse` 防御方針に整合。

```typescript
const EXPAND_WHITELIST = ["tags"] as const;
type ExpandKey = (typeof EXPAND_WHITELIST)[number];

// RawZ.shape に追加: expand: z.array(z.enum(EXPAND_WHITELIST)).default([])
// ParsedPublicMemberQuery type に追加: expand: ExpandKey[];
// DEFAULT_PUBLIC_MEMBER_QUERY に追加: expand: []

// parsePublicMemberQuery 内（string | string[] | undefined を正規化）:
const expandRaw = raw.expand;
const expandList = (Array.isArray(expandRaw) ? expandRaw : expandRaw ? [expandRaw] : [])
  .flatMap((e) => e.split(","))
  .map((e) => e.trim())
  .filter((e): e is ExpandKey => (EXPAND_WHITELIST as readonly string[]).includes(e));
// 返却に: expand: Array.from(new Set(expandList)),
```

> **設定値 EXPAND_WHITELIST**: 受理する expand 値の唯一の正本。将来 `expand=fields` 等を足すときはここに追加する。

### APIシグネチャ

```typescript
// route は searchParams を raw object にして既存 parser へ渡す。route file は変更不要。
parsePublicMemberQuery(raw: Record<string, string | string[] | undefined>): ParsedPublicMemberQuery;

type ParsedPublicMemberQuery = {
  q: string;
  zone: string;
  status: string;
  tags: string[];
  sort: string;
  density: string;
  page: number;
  limit: number;
  expand: ("tags")[];
};

listPublicMembersUseCase(
  query: ParsedPublicMemberQuery,
  deps: { ctx: DbCtx },
): Promise<PublicMemberListResponse>;
```

### 使用例

```bash
# tags を含める
curl -s "http://127.0.0.1:8787/public/members?expand=tags" | jq '.items[0].tags'

# 後方互換: expand 未指定では tags key を出さない
curl -s "http://127.0.0.1:8787/public/members" | jq '.items[0] | has("tags")'
```

### (2) shared zod 契約 — `packages/shared/src/zod/viewmodel.ts`

```typescript
export const PublicMemberTagZ = z.object({
  code: z.string(),
  label: z.string(),
  category: z.string(),
});

export const PublicMemberListItemZ = z.object({
  memberId: z.string().min(1),
  fullName: z.string(),
  nickname: z.string(),
  occupation: z.string(),
  location: z.string(),
  ubmZone: z.string().nullable(),
  ubmMembershipType: z.string().nullable(),
  tags: z.array(PublicMemberTagZ).optional(), // ← 追加（未指定時 undefined＝キー無し）
});

export type PublicMemberTag = z.infer<typeof PublicMemberTagZ>;
```

> `PublicMemberListItemZ` は非 strict のため tags 追加で既存 strict test に影響しない。
> **`appliedQuery` は `.strict()` のため expand を含めない**（含めると既存 contract test が落ちる）。

### (3) shared 型 — `packages/shared/src/types/viewmodel/index.ts`

```typescript
export interface PublicMemberListItem {
  memberId: MemberId;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  tags?: ReadonlyArray<{ code: string; label: string; category: string }>; // ← 追加
}
```

### (4) view-model — `apps/api/src/view-models/public/public-member-list-view.ts`

```typescript
export interface PublicMemberListItemSource {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  tags?: ReadonlyArray<{ code: string; label: string; category: string }>; // ← 追加
  // responseEmail / rulesConsent / adminNotes は引き続き含めない（forbidden）
}
```

> `stripForbidden` は `FORBIDDEN_KEYS`（responseEmail / rulesConsent / adminNotes）のみ削除するため tags は素通し。

### (5) use-case 配線 — `apps/api/src/use-cases/public/list-public-members.ts`

**重要: helper `listTagsByMemberIds` はフラット配列を返す**（Map ではない）。
use-case 側で memberId キーの Map に groupBy してから引き当てる。

```typescript
import { listTagsByMemberIds } from "../../repository/memberTags";
import { asMemberId } from "@ubm-hyogo/shared"; // import 経路は既存 brand 利用箇所に合わせる

// memberRows 取得後（fields ループは既存のまま）:
const wantTags = query.expand.includes("tags");
let tagsByMember: Map<string, { code: string; label: string; category: string }[]> | undefined;
if (wantTags) {
  const memberIds = memberRows.map((m) => asMemberId(m.member_id));
  const tagRows = await listTagsByMemberIds(ctx, memberIds); // ← 1 query のみ（フラット配列）
  tagsByMember = new Map();
  for (const r of tagRows) {
    const arr = tagsByMember.get(r.member_id) ?? [];
    arr.push({ code: r.code, label: r.label, category: r.category });
    tagsByMember.set(r.member_id, arr);
  }
}

// items.push 時:
items.push({
  memberId: m.member_id,
  // ...既存 fields...
  ...(wantTags ? { tags: tagsByMember!.get(m.member_id) ?? [] } : {}),
});
```

> **引き当てキーの取り違え注意**: tags は `member_id`、fields は `current_response_id`。

### helper（無改変・再利用）— `apps/api/src/repository/memberTags.ts`

```
listTagsByMemberIds(c: DbCtx, mids: MemberId[]): Promise<MemberTagWithDefinition[]>
  WHERE mt.member_id IN (${placeholders}) AND td.active = 1
  返り値はフラット配列（要素: { member_id, tag_id, code, label, category, ... active }）
  mids.length === 0 で [] を早期 return
```

> このフラット配列を use-case 側で groupBy するのが本タスクの肝。helper は一切変更しない。

### エラーハンドリング方針

- **expand パース**: 未知値・空は throw せず黙って除外（既存 parser の防御的 `.catch()` / `safeParse` に整合）。常に配列を返す。
- **空集合**: `memberIds` が空なら helper が `[]` を早期 return するため、tags batch query 自体が発行されない（追加の分岐不要）。
- **応答整合**: `toPublicMemberListView` の `PublicMemberListResponseZ.parse` が fail-close。tags optional を通すため expand 未指定時はキー自体が出ない。

### エッジケース

| ケース | 期待動作 |
| --- | --- |
| `expand=unknown` | `expand=[]` として扱い、tags query を発行しない |
| `expand=tags,unknown` | `expand=["tags"]` として扱う |
| `expand=tags&expand=tags` | dedupe して `["tags"]` にする |
| member 0 件 | helper の早期 return により tags batch query 0 回 |
| tag 0 件の member | `expand=tags` 時は `tags: []` を返す |

### 設定項目と定数一覧

| 名称 | 値 | 所有ファイル |
| --- | --- | --- |
| `EXPAND_WHITELIST` | `["tags"] as const` | `apps/api/src/_shared/search-query-parser.ts` |
| `PublicMemberTagZ` | `{ code, label, category }` | `packages/shared/src/zod/viewmodel.ts` |
| `FORBIDDEN_KEYS` | `responseEmail / rulesConsent / adminNotes` | `apps/api/src/view-models/public/public-member-list-view.ts` |

### visibility 整合（leak 防御 / AC-4）

- `memberIds` は `listPublicMembers`（`buildBaseFromWhere` の visibility filter 適用済み）結果から構築する。
- 非公開 member は `memberRows` に存在しないため、その memberId で tags を引くことはない。leak 経路なし。

### query 回数（AC-2 / AC-3）

| ケース        | list | count | topTags | fields              | tags batch        |
| ------------- | ---- | ----- | ------- | ------------------- | ----------------- |
| expand 未指定 | 1    | 1     | 1       | N（既存 N+1・別 issue） | **0**             |
| expand=tags   | 1    | 1     | 1       | N（既存 N+1・別 issue） | **1**（IN batch・件数非依存） |

## 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショット不要。** 本タスクは API 層（型 / zod 契約 / use-case 配線）に閉じ、
`apps/web` の描画に影響しない（NON_VISUAL）。主証跡は自動テスト（contract spec + use-case unit test）であり、
詳細は `outputs/phase-11/main.md` を参照。手動 smoke 手順は `outputs/phase-11/manual-smoke-log.md`。

## テスト方針（要点）

- contract / use-case test は **tags batch query（`member_tags ... member_id IN`）のみ** を計数し、
  「member 件数を増やしても tags batch query が 1 のまま」を assert する（AC-5）。
- fields N+1（別 issue・スコープ外）は assert に巻き込まない。

### テスト構成

| テスト | ファイル | 目的 |
| --- | --- | --- |
| use-case unit | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | helper spy で `listTagsByMemberIds` が最大 1 回であることを確認 |
| contract spec | `apps/api/src/routes/public/index.contract.spec.ts` | `expand=tags` 応答、未知 expand 除外、`appliedQuery` strict 維持を確認 |
| shared parse | `packages/shared/src/zod/viewmodel.ts` 周辺 | `PublicMemberListItemZ.tags` optional と tag item shape を確認 |

## 実装完了状態（2026-05-31）

実コードへ実装済み（`git diff --stat apps/ packages/` で 9 ファイル変更）。検証コマンドは全て green。

| 検証 | 結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/api test --run`（全 suite） | Test Files 75 passed / Tests 473 passed（0 failed） |
| `pnpm --filter @ubm-hyogo/shared test --run` | Test Files 20 passed / Tests 235 passed |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |

本 issue 追加テスト: use-case 5 件 + contract 2 件 + parser 3 件（既存 `preserves valid input` の `expand: []` 追従含む）。
実 TC 名と AC マッピングは `outputs/phase-11/main.md`「実テスト実行結果」を参照。

> commit / push / PR は user-gated（CONST_002）。本サイクルでは実行しない。
