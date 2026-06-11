# Phase 6: テスト拡充（fail path / 回帰 guard / boundary・grep gate）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 本フェーズは spec ドキュメント。テストコード・lint 実行は実装者が後続で行う。

## 6.0 このフェーズの狙い

Phase 4（正常系・境界値 SP-01〜SP-12）と Phase 5（切替・回帰）に対し、Phase 6 は **drift を将来にわたって機械検知する guard** を整える。具体的には次の 3 系統。

| 系統 | 目的 | 対応 AC |
| --- | --- | --- |
| ① drift guard test（値集合一致 assert） | shared と app の値集合が一致し続けることを test で固定 | AC-7（補強） |
| ② boundary lint / depcruise | web→api 直接参照ゼロ・shared→app 循環なしを確認 | AC-5 |
| ③ grep gate | api/web から重複定義リテラルが消えたことを確認 | AC-7 |

> 本タスクは「動作不変リファクタ」のため、新規の fail path 振る舞いを増やすのではなく、**既存の fail path（安全側 default fallback）が shared 化後も同一であること**と、**重複定義が物理的に消えたこと**を guard する。

---

## 6.1 追加すべき drift guard / fail path テスト

### 6.1.1 SP-12（値集合 tuple の要素一致 assert）— shared 側 drift guard

- 位置: `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`（Phase 4 §4.2.2 で定義済み）。
- 内容: 4 値集合 tuple（zone / status / sort / density）の要素を `toEqual` で完全一致 assert。これが値集合の唯一の正本固定点。

```typescript
expect(PUBLIC_MEMBER_ZONE_VALUES).toEqual(["all", "0_to_1", "1_to_10", "10_to_100"]);
expect(PUBLIC_MEMBER_STATUS_VALUES).toEqual(["all", "member", "non_member", "academy"]);
expect(PUBLIC_MEMBER_SORT_VALUES).toEqual(["recent", "name"]);
expect(PUBLIC_MEMBER_DENSITY_VALUES).toEqual(["comfy", "dense", "list"]);
```

### 6.1.2 shared と app の値が一致することの保証（回帰 guard）

shared 化の本質的価値は「shared と app の値集合が常に一致する」こと。これは次の 2 段で保証する。

| 保証手段 | 仕組み |
| --- | --- |
| **構造的保証（第一義）** | app（api/web）が shared の同一 tuple / 定数を import するため、コンパイル時点で値が同一。app が独自リテラルを持たない（grep gate で担保）限り drift は構造的に起こりえない |
| **回帰保証（補助）** | 既存 api/web spec が、shared 由来の値で従来通りの I/O を返すことを確認（AC-2 / AC-6）。値が食い違えば U-02/U-03（不正値 fallback）や api の `AC-6` 系 test が即座に fail する |

> 追加で「app が import した値集合 = shared tuple」を assert する test は**不要**（型システムと grep gate で重複定義ゼロを保証するため、二重定義が存在しない＝比較対象が存在しない）。drift guard の唯一点は SP-12。

### 6.1.3 fail path（安全側 default fallback）の不変確認

本タスクで新規 fail path test は追加しないが、既存 spec が網羅する fail path が shared 化後も不変であることを確認する（回帰）。

| fail path | 既存 test（無変更で pass） | shared 由来関数 |
| --- | --- | --- |
| 不正 `sort` → `recent` | api `AC-6: invalid sort falls back to recent` / web `zod schema 直接呼び出し` | `PublicMemberSortZ`（`.catch("recent")` は app 側） |
| 不正 `zone`/`status` → `all` | api `AC-6: invalid zone/status fall back to all` / web `U-02` | `normalizePublicMemberZone/Status`（api）/ `z.enum(...).catch("all")`（web） |
| 不正 `density` → `comfy` | api `AC-6: invalid density` / web `U-03` | `PublicMemberDensityZ` / 値集合 |
| `limit>100` → 100, `limit<1` → 1 | api `AC-11: limit clamps at 100` | `clampPublicMemberLimit`（api のみ） |
| `tag>5` truncate / dedup / 空除外 | api `dedups...` / web `U-04`/`U-05` | `normalizePublicMemberTags` |
| `q>200` truncate / 空白正規化 | api `normalizes q...` / web `U-06`/`q 200 truncate` | `normalizePublicMemberQ` |

> これらが**無変更のまま緑**であることが、fail path 挙動が shared 化前後で同一であることの証明。

---

## 6.2 boundary lint / depcruise 確認手順（AC-5）

`apps/web` が `apps/api` を直接 import せず shared 経由のみであること、shared→app の循環がないことを確認する。

```bash
# root lint（boundary + depcruise を含む。package.json:21 の lint チェーン）
mise exec -- pnpm lint

# 個別に boundary だけ確認したい場合
mise exec -- node scripts/lint-boundaries.mjs
# depcruise（dependency-cruiser）だけ確認したい場合
mise exec -- pnpm run lint:deps
```

| 確認観点 | 期待 |
| --- | --- |
| `apps/web` → `apps/api` 直接 import | **ゼロ**（boundary lint が違反検知しない） |
| `apps/web` / `apps/api` → `@ubm-hyogo/shared/public-search` | OK（許可された workspace 依存） |
| `packages/shared` → `apps/*` の import | **ゼロ**（shared は app を一切 import しない＝一方向・循環なし） |

> `packages/shared/src/public-search/search-query-primitives.ts` は `zod` のみ import し、`apps/*` を参照しない（task-01 §3 副作用なし・一方向）。depcruise が循環依存を検知しないことを確認する。

---

## 6.3 grep gate（重複定義消滅確認・AC-7）

api / web から、shared に移した重複定義リテラルが消えたことを grep で確認する（SSOT §5.3）。

```bash
# api parser から zone リテラル / Set 定義が消えたか
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts
# web schema から zone リテラルが消えたか
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/web/src/lib/url/members-search.ts
# 一括（SSOT §5.3 正本コマンド）
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts apps/web/src/lib/url/members-search.ts
```

| ファイル | grep 期待結果 | 補足 |
| --- | --- | --- |
| `apps/api/.../search-query-parser.ts` | `VALID_ZONES` / `ZONE_VALUES` / `0_to_1` リテラル **0 ヒット** | `EXPAND_WHITELIST = ["tags"]` は残るが zone リテラルではない |
| `apps/web/.../members-search.ts` | `ZONE_VALUES` 定義 / `0_to_1` リテラル **0 ヒット** | shared import に置換済み |

> `0_to_1` 値そのものは `packages/shared/src/public-search/search-query-primitives.ts`（SSOT 一本）と SP-12 spec の assert にのみ存在する状態が正。重複定義（api/web の独自リテラル）がゼロであることが AC-7 の合格基準。

---

## 6.4 Phase 6 検証コマンド一括（SSOT §5.3）

```bash
# 1. drift guard を含む shared 新規 spec
mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts
# 2. api / web 回帰（fail path 不変の証明）
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts
# 3. boundary / depcruise（AC-5）
mise exec -- pnpm lint
# 4. grep gate（AC-7）
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts apps/web/src/lib/url/members-search.ts
```

---

## 6.5 完了条件（Phase 6 DoD）

- [ ] SP-12 drift guard が shared 新規 spec に存在し、4 値集合 tuple の要素一致を assert している。
- [ ] fail path（不正値 → 安全側 default）が api/web 既存 spec の無変更回帰で緑であることを確認した（fail path 挙動不変の証明）。
- [ ] `pnpm lint`（boundary + depcruise）が緑で、web→api 直接参照ゼロ・shared→app 循環なしを確認した（AC-5）。
- [ ] grep gate で api/web から `ZONE_VALUES` / `VALID_ZONES` / `0_to_1` の重複定義が 0 ヒットであることを確認した（AC-7）。
- [ ] `0_to_1` 等の値リテラルが SSOT（`search-query-primitives.ts`）+ SP-12 spec のみに存在する状態であることを確認した。
