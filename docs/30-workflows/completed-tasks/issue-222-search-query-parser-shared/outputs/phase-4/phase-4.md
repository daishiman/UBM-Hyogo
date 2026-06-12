# Phase 4: テスト作成（TDD: RED → GREEN）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。数値・識別子・パスは SSOT から逸脱しない。

## 4.0 このフェーズの狙い

公開検索 query 正規化プリミティブを `packages/shared` に SSOT 化するにあたり、**先にテストを書いて期待挙動を固定**する。本タスクは「動作不変リファクタ」なので、テスト戦略は次の 2 系統からなる。

| 系統 | 対象 | TDD サイクル |
| --- | --- | --- |
| ① shared 新規 spec | `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | **RED → GREEN**（純関数の境界値・drift guard を新規に固定） |
| ② 既存 contract 回帰 | api spec / web spec（無変更） | **回帰のみ**（一切編集しない。切替後も緑であることが contract 不変の証明） |

> 本タスクで「実装より先にテストを書く」のは ① のみ。② は既に存在する contract で、編集禁止。

---

## 4.1 TDD 方針（RED → GREEN）

### 4.1.1 shared 新規 spec（① RED → GREEN）

1. **RED**: `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` を先に作成する。この時点で本体（`search-query-primitives.ts`）が未作成なので import 解決に失敗し、テストは **RED（実行不能 / fail）**。
2. **GREEN**: Phase 5 task-01 で `search-query-primitives.ts` + `index.ts` + `package.json` exports を実装すると import が解決し、純関数が SP-01〜SP-12 を満たして **GREEN**。

> 純関数のため fixture / mock / DI は不要。`import { ... } from "@ubm-hyogo/shared/public-search"` で公開関数を直接呼び、戻り値を `expect().toEqual()` / `toBe()` で検証する（4.4 参照）。

### 4.1.2 既存 contract 回帰（② 無変更）

- `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`
- `apps/web/src/lib/url/__tests__/members-search.spec.ts`

この 2 ファイルは **本タスクで 1 行も変更しない**。Phase 5 で api/web を shared import へ切替えた後も、これらが無変更のまま pass し続けることが「`parsePublicMemberQuery` / `parseSearchParams` / `toApiQuery` の I/O contract が不変」であることの機械的な証明になる（SSOT §4 AC-2 / AC-6、§6 DoD 4 / 7）。

---

## 4.2 shared 新規テストケース表（SSOT §5.1 を逐語転記）

> 正本は SSOT §5.1。下表はその逐語転記。`狙い` 列のみ Phase 4 で補足。

| ID | ケース | 期待 | 狙い |
| --- | --- | --- | --- |
| SP-01 | `normalizePublicMemberQ("  a   b  ")` | `"a b"` | trim + `\s+`→単一空白の正規化 |
| SP-02 | `normalizePublicMemberQ("x".repeat(250))` | length 200 | `Q_LIMIT=200` 切詰 |
| SP-03 | `normalizePublicMemberTags(["a","a","b",""])` | `["a","b"]` | dedup + 空文字除外 |
| SP-04 | `normalizePublicMemberTags(7件)` | 5 件で truncate | `TAG_LIMIT=5` 上限 |
| SP-05 | `clampPublicMemberLimit(999)` | `100` | `LIMIT_MAX=100` clamp |
| SP-06 | `clampPublicMemberLimit(0)` | `1` | `LIMIT_MIN=1` clamp |
| SP-07 | `clampPublicMemberLimit(30.9)` | `30`（trunc） | 小数を `Math.trunc` で整数化 |
| SP-08 | `normalizePublicMemberZone("invalid")` | `"all"` | whitelist 外を `"all"` へ fallback |
| SP-09 | `normalizePublicMemberZone("0_to_1")` | `"0_to_1"` | 正当値は保持 |
| SP-10 | `normalizePublicMemberStatus("non_member")` | `"non_member"` | status 正当値は保持 |
| SP-11 | `PublicMemberSortZ.catch("recent").parse("bad")` | `"recent"` | zod enum + catch の fallback |
| SP-12 | 各値集合 tuple の要素が期待通り（drift guard） | 完全一致 assert | 値集合の SSOT 固定（zone/status/sort/density） |

### 4.2.1 各ケースの入力・期待値・狙い（補足）

- **SP-01 / SP-02（q 正規化）**: `normalizePublicMemberQ` は `trim → /\s+/g を " " に置換 → slice(0,200)` の純関数。SP-01 は前後・中間空白の正規化、SP-02 は 250 文字入力が 200 文字に切り詰められること。
- **SP-03 / SP-04（tag 正規化）**: `normalizePublicMemberTags` は `空文字除外 → Set で dedup → slice(0,5)`。SP-03 は重複 `"a"` の除去と空文字 `""` の除外、SP-04 は 7 件入力が 5 件に truncate されること（入力例: `["t1","t2","t3","t4","t5","t6","t7"]` → 先頭 5 件）。
- **SP-05〜SP-07（limit clamp）**: `clampPublicMemberLimit` は `Math.trunc → Math.max(_,1) → Math.min(_,100)`。SP-05 は上限、SP-06 は下限、SP-07 は小数の trunc（`30.9 → 30`）。
- **SP-08〜SP-10（enum-like 正規化）**: `normalizePublicMemberZone` / `normalizePublicMemberStatus` は whitelist 内ならそのまま、外なら `"all"`。SP-08 は不正→`"all"`、SP-09/SP-10 は正当値の保持。
- **SP-11（zod enum catch）**: `PublicMemberSortZ` は `z.enum(PUBLIC_MEMBER_SORT_VALUES)`。`.catch("recent")` を付けて `parse("bad")` すると `"recent"` に倒れる（api/web の `sort` フォールバック挙動の SSOT）。
- **SP-12（drift guard）**: 4 つの値集合 tuple が期待要素と完全一致することを assert する。これが値集合の唯一の正本であり、将来の意図しない drift を test で検知する（Phase 6 で重複定義消滅 grep と対になる）。

### 4.2.2 SP-12 の具体 assert 方針（drift guard の正本）

SP-12 は 4 つの値集合 tuple それぞれについて、要素の完全一致を `toEqual` で固定する。

```typescript
expect(PUBLIC_MEMBER_ZONE_VALUES).toEqual(["all", "0_to_1", "1_to_10", "10_to_100"]);
expect(PUBLIC_MEMBER_STATUS_VALUES).toEqual(["all", "member", "non_member", "academy"]);
expect(PUBLIC_MEMBER_SORT_VALUES).toEqual(["recent", "name"]);
expect(PUBLIC_MEMBER_DENSITY_VALUES).toEqual(["comfy", "dense", "list"]);
```

> 要素の順序まで含めて固定する（`toEqual` は配列の順序を含めて比較する）。zone は D1 クエリでの順序非依存だが、SSOT の値集合をそのまま正本として固定する。

---

## 4.3 命名規則整合の検証（Phase 1.5）

Phase 1.5（`phase-1.md` §1.5）で確定した命名規則に従い、shared 新規 spec は **必ず以下の `PublicMember*` prefix の識別子を import** する。test がこの prefix を import していること自体が、命名整合（admin/search との衝突回避）の検証になる。

| import すべき識別子 | 種別 |
| --- | --- |
| `PUBLIC_MEMBER_ZONE_VALUES` / `PUBLIC_MEMBER_STATUS_VALUES` / `PUBLIC_MEMBER_SORT_VALUES` / `PUBLIC_MEMBER_DENSITY_VALUES` | 値集合 tuple |
| `PublicMemberSortZ`（SP-11 で使用） | zod enum |
| `normalizePublicMemberQ` / `normalizePublicMemberTags` / `clampPublicMemberLimit` | 正規化純関数 |
| `normalizePublicMemberZone` / `normalizePublicMemberStatus` | enum-like 正規化 |

import 元は **`@ubm-hyogo/shared/public-search`（subpath）** に限定する（root barrel `@ubm-hyogo/shared` 経由で import してはならない。FB-W0-01）。

---

## 4.4 純関数テストの書き方（キャスト不要・すべて public 純関数）

本 spec が対象とする関数はすべて、副作用を持たない純関数 / 純データ（tuple）/ zod schema である。したがって:

- **モック / spy / fixture 不要**。`import` した関数を直接呼び、戻り値を `expect` で検証する。
- **型キャスト不要**。すべて公開 export（`export const`）で、test から見て public。`as` / `@ts-expect-error` を使わない。
- **vitest 標準 API のみ**: `describe` / `it` / `expect` を `from "vitest"` で import（既存 spec と同じ流儀）。
- 期待値の比較は、配列・オブジェクトは `toEqual`、プリミティブは `toBe`、長さは `toHaveLength` を使う（既存 spec の慣習に整合）。

スケルトン（実装は Phase 5 task-01 の本体完成後に GREEN になる）:

```typescript
import { describe, expect, it } from "vitest";

import {
  PUBLIC_MEMBER_ZONE_VALUES,
  PUBLIC_MEMBER_STATUS_VALUES,
  PUBLIC_MEMBER_SORT_VALUES,
  PUBLIC_MEMBER_DENSITY_VALUES,
  PublicMemberSortZ,
  normalizePublicMemberQ,
  normalizePublicMemberTags,
  clampPublicMemberLimit,
  normalizePublicMemberZone,
  normalizePublicMemberStatus,
} from "@ubm-hyogo/shared/public-search";

describe("public-search query primitives (SP-01〜SP-12)", () => {
  it("SP-01: normalizePublicMemberQ trims and collapses whitespace", () => {
    expect(normalizePublicMemberQ("  a   b  ")).toBe("a b");
  });

  it("SP-02: normalizePublicMemberQ truncates at 200 chars", () => {
    expect(normalizePublicMemberQ("x".repeat(250))).toHaveLength(200);
  });

  // SP-03 〜 SP-11 も同様に 1 it = 1 ケースで記述

  it("SP-12: value-set tuples are the single source of truth (drift guard)", () => {
    expect(PUBLIC_MEMBER_ZONE_VALUES).toEqual(["all", "0_to_1", "1_to_10", "10_to_100"]);
    expect(PUBLIC_MEMBER_STATUS_VALUES).toEqual(["all", "member", "non_member", "academy"]);
    expect(PUBLIC_MEMBER_SORT_VALUES).toEqual(["recent", "name"]);
    expect(PUBLIC_MEMBER_DENSITY_VALUES).toEqual(["comfy", "dense", "list"]);
  });
});
```

> 1 ケース = 1 `it` で 12 件記述すること（SP-01〜SP-12）。SP-04 の「7 件」は具体配列を test 内で構築する（例: `["t1","t2","t3","t4","t5","t6","t7"]`）。

---

## 4.5 既存 contract 回帰の観点（無変更で pass し続ける根拠）

### 4.5.1 api spec（`search-query-parser.spec.ts`）

| 既存ケース | shared 切替後も pass する根拠 |
| --- | --- |
| `returns defaults for empty input` | `DEFAULT_PUBLIC_MEMBER_QUERY` の値は不変（SSOT §3.4）。`limit: 24` 等そのまま |
| `preserves valid input` | `parsePublicMemberQuery` の I/O・返却 shape（`tags` key 名・`page`/`limit` 数値化）は完全不変 |
| `parses expand=tags` 系 / `defaults expand to []` | `expand` whitelist（`["tags"]`）は api 側に残す（shared に出さない。SSOT §3.4） |
| `AC-6: invalid sort/zone/status/density fallback` | shared の `normalizePublicMember*` / `PublicMemberSortZ.catch` が同一アルゴリズムを提供 |
| `AC-11: limit clamps at 100` | `clampPublicMemberLimit` が既存 `clampLimit` と同一（`trunc → max(1) → min(100)`） |
| `dedups/限定 tags` / `normalizes q` / `invalid page → 1` | shared 正規化関数が同一ロジック。`page` の `Math.max(1, trunc)` は api 側に残る |

### 4.5.2 web spec（U-01〜U-06 ほか）

| 既存ケース | shared 切替後も pass する根拠 |
| --- | --- |
| U-01（q+zone 保持・未指定は初期値） | `membersSearchSchema` の shape・`parseSearchParams` の挙動が不変 |
| U-02（不明 zone → all） | `z.enum(ZONE_VALUES).catch("all")` の `ZONE_VALUES` を shared tuple に差し替えても値集合が一致 |
| U-03（density=compact → comfy） | `DENSITY_VALUES` を shared tuple へ差し替え。値一致で挙動不変 |
| U-04 / U-05（tag dedup / 5 件 truncate） | `TagSchema.transform` が `normalizePublicMemberTags` 呼び出しに変わるが同一結果 |
| U-06 / `q 200 truncate` | `QSchema.transform` が `normalizePublicMemberQ` 呼び出しに変わるが同一結果 |
| `MEMBERS_SEARCH_LIMITS.TAG_LIMIT / Q_LIMIT` 参照 | `{ TAG_LIMIT, Q_LIMIT }` を shared `PUBLIC_MEMBER_SEARCH_LIMITS` から再構築し維持（SSOT §3.5） |
| `toApiQuery` 系（初期値省略・repeated tag） | `toApiQuery` は本タスク非接触。完全不変 |

> いずれも「値集合・制限・正規化アルゴリズムを shared の同値へ差し替えるだけ」で、test が観測する I/O は変わらない。これが回帰テストが緑であり続ける根拠。

---

## 4.6 実行コマンド（SSOT §5.3）

```bash
# shared 新規テスト（Phase 5 task-01 完成後に GREEN）
mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts
# api 既存回帰（無変更で pass）
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
# web 既存回帰（無変更で pass）
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts
```

---

## 4.7 完了条件（Phase 4 DoD）

- [ ] shared 新規 spec の RED→GREEN サイクルを定義した（本体未作成時は RED）。
- [ ] SP-01〜SP-12 を SSOT §5.1 逐語で固定し、各ケースの入力・期待・狙いを明記した。
- [ ] 新規 spec が `PublicMember*` / `normalizePublicMember*` 識別子を `@ubm-hyogo/shared/public-search` subpath から import する方針を明記した（Phase 1.5 整合）。
- [ ] 既存 2 spec は無変更・回帰のみで、緑維持の根拠を contract 単位で示した。
- [ ] 新規 test は `*.spec.ts`（不変条件 #8）であることを確認した。
