# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 7 / 13 |
| 前提 | Phase 5（実装 GREEN）・Phase 6（テスト拡充）完了 |
| 対象範囲 | 本タスクで変更した 7 ファイルの**変更ブロックのみ**（全ファイル一律指定は禁止） |

## 目的

本タスクで変更した 7 ファイルのうち、**実際に変更したコードブロックに限定**して line / branch カバレッジを実測し、変更行が既存テスト（Phase 4-6）で到達されていることを証跡として残す。とくに `publicMembers.ts` の ORDER BY 4 分岐が T7（D1 contract）で全分岐到達することを確認する。全ファイル一律 80% 指定は行わない（Feedback BEFORE-QUIT-002: カバレッジ対象は変更ブロックに絞る）。

## 実行タスク

### T7-1 カバレッジ計測対象ブロックの確定

変更ブロックのみを計測対象とする。以下 7 ブロックを「到達必須」とする。

| # | ファイル | 変更ブロック（行・象徴） | 到達手段 | 必要分岐 |
|---|---------|------------------------|----------|----------|
| 1 | `apps/web/src/components/ui/Search.tsx` | input への `className="ui-search__input"` 付与（`Search.tsx:35`）と独自×描画分岐（`Search.tsx:43-51` 値あり時 render） | `Search.spec.tsx` | 値空=×非表示 / 値あり=×表示 の 2 分岐 |
| 2 | `apps/web/src/styles/globals.css` | `.ui-search__input::-webkit-search-cancel-button, .ui-search__input::-webkit-search-decoration` ルール追加 | jsdom 非評価のため line/branch カバレッジ対象外。Phase 9 で grep 存在確認 + Phase 11 VISUAL で実描画担保 | n/a（CSS） |
| 3 | `apps/web/src/lib/url/members-search.ts` | `SORT_VALUES` 配列拡張（`members-search.ts:9`）と `toApiQuery` の `if (search.sort !== "recent")` 分岐（`members-search.ts:66-76`） | `members-search.spec.ts` | sort=recent（URL省略）/ sort=oldest / sort=name / sort=name_desc / 不正値→recent フォールバックの 5 経路 |
| 4 | `apps/web/src/components/public/MemberFilters.client.tsx` | `SORT_OPTIONS` 配列（`MemberFilters.client.tsx:39-42`）の 4 値定義と Select への引き渡し | `MemberFilters.client.spec.tsx` | 4 option が render される 1 経路（option 数=4 のアサーション） |
| 5 | `apps/api/src/_shared/search-query-parser.ts` | `SortZ = z.enum([...])` 拡張（`search-query-parser.ts:7`）と DEFAULT フォールバック（`search-query-parser.ts:14-24`） | `search-query-parser.spec.ts` | recent / oldest / name / name_desc の 4 受理 + 不正値→DEFAULT(recent) の 5 分岐 |
| 6 | `apps/api/src/repository/publicMembers.ts` | ORDER BY 4 分岐（`publicMembers.ts:103-106` を switch 化した範囲） | `list-public-members.spec.ts`（unit）+ `publicMembers.repository.spec.ts`（D1 contract） | switch の case recent / oldest / name / name_desc / default の 4 case + default 到達 |
| 7 | `packages/shared/src/zod/viewmodel.ts` | `appliedQuery.sort` enum 拡張（`viewmodel.ts:158`） | `viewmodel.spec.ts`（新規） | 4 値受理 + 不正値 reject の 5 分岐 |

### T7-2 ORDER BY 4 分岐の全到達証跡（最重点）

`publicMembers.ts` の ORDER BY switch は、SQL 文字列を組み立てる純ロジックだが、実 ORDER BY の効果（順序）は D1 contract でのみ検証できる。以下を必須とする。

- `publicMembers.repository.spec.ts`（既存・root `vitest.d1.config.ts`）が `sort: "recent" | "oldest" | "name" | "name_desc"` の 4 ケースを実行し、各ケースで返却順序が ORDER BY 仕様（index.md「ソート値マッピング」）どおりであることをアサートする。
- 4 ケース実行により switch の 4 case（`name` / `name_desc` / `oldest` / `recent`(=default)）が全到達することを branch カバレッジで確認する。
- タイブレーク `mi.member_id ASC` の効果は、`last_submitted_at` または `fullName` が同値の seed を 2 件以上含めて member_id 昇順で並ぶことを 1 ケースで確認する（`oldest` ケースで last_submitted_at 同値ペアを用意）。

### T7-3 計測コマンド（変更ブロック限定）

リポジトリルート（`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260610-235907-wt-8`）から実行する。

```bash
# apps/web 変更3ファイル（Search.tsx / members-search.ts / MemberFilters.client.tsx）の line/branch
mise exec -- pnpm vitest run --config=vitest.config.ts \
  --coverage \
  --coverage.include="apps/web/src/components/ui/Search.tsx" \
  --coverage.include="apps/web/src/lib/url/members-search.ts" \
  --coverage.include="apps/web/src/components/public/MemberFilters.client.tsx" \
  apps/web/src/components/ui/Search.spec.tsx \
  apps/web/src/lib/url/members-search.spec.ts \
  apps/web/src/components/public/MemberFilters.client.spec.tsx

# apps/api パーサ（search-query-parser.ts）の line/branch（unit）
mise exec -- pnpm vitest run --config=vitest.config.ts \
  --coverage \
  --coverage.include="apps/api/src/_shared/search-query-parser.ts" \
  --coverage.include="apps/api/src/repository/publicMembers.ts" \
  apps/api/src/_shared/search-query-parser.spec.ts \
  apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts

# packages/shared viewmodel enum
mise exec -- pnpm vitest run --config=vitest.config.ts \
  --coverage \
  --coverage.include="packages/shared/src/zod/viewmodel.ts" \
  packages/shared/src/zod/viewmodel.spec.ts

# ORDER BY 4 分岐の D1 contract（root vitest.d1.config.ts）
mise exec -- pnpm vitest run --config=vitest.d1.config.ts \
  --coverage \
  --coverage.include="apps/api/src/repository/publicMembers.ts" \
  apps/api/src/repository/publicMembers.repository.spec.ts
```

### T7-4 証跡記録

- 各コマンドの coverage summary を `outputs/phase-11/`（VISUAL 補助証跡ディレクトリ）配下ではなく、Phase 7 では実測ログとしてターミナル出力を確認するに留める（実行は本ウェーブで user-gated）。
- 変更行（T7-1 の各ブロック）の Lines / Branches が `100%` または「未到達行が変更ブロック外であること」を確認する。
- ORDER BY switch の 4 case が全 covered（branch 4/4）であることを `publicMembers.repository.spec.ts` の coverage で確認する。

## 参照資料

- [phase-1-requirements.md](phase-1-requirements.md)（変更 7 ファイル / テスト 7 ファイル inventory）
- [phase-2-design.md](phase-2-design.md)（T2-3 ORDER BY 4 分岐 switch 設計 / T2-2 sort 3 層）
- [phase-5-implementation.md](phase-5-implementation.md)（GREEN 実装範囲）
- [phase-6-test-expansion.md](phase-6-test-expansion.md)（fail path / 回帰テスト）
- `apps/api/src/repository/publicMembers.ts:97-120`（listPublicMembers / ORDER BY）
- root `vitest.d1.config.ts`（D1 contract 実行設定。`--root=../..` 前提で apps/api から参照）
- Feedback BEFORE-QUIT-002（カバレッジ対象を変更ブロックに限定する方針）

## 成果物

- 変更ブロック限定カバレッジ計測対象表（T7-1）
- ORDER BY 4 分岐の全到達証跡方針（T7-2）
- 計測コマンド列挙（T7-3）

## 統合テスト連携

カバレッジ計測は変更ブロック限定で統合実行する。ORDER BY 4 分岐（recent/oldest/name/name_desc）は D1 contract（T7）が全分岐へ到達することで branch カバレッジを担保する。`members-search.ts` の `toApiQuery` sort 分岐は T2 が結合到達する。

## 完了条件

- [ ] 計測対象が変更 7 ブロックに限定され、全ファイル一律指定でないことが明記されている
- [ ] `publicMembers.ts` の ORDER BY switch 4 case（recent/oldest/name/name_desc）が D1 contract で全分岐到達する計画になっている
- [ ] `members-search.ts` の `toApiQuery` 分岐と `SORT_VALUES` の 5 経路がカバレッジ対象に含まれている
- [ ] `search-query-parser.ts` SortZ と DEFAULT フォールバックの 5 分岐がカバレッジ対象に含まれている
- [ ] `globals.css` 追加ルールが jsdom 非評価のためカバレッジ対象外であり Phase 9 grep + Phase 11 VISUAL で担保されることが明記されている
- [ ] 計測コマンドが file:line 単位の `--coverage.include` で記述されている
