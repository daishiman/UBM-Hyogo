# Phase 4: テスト戦略 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 4 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

apps/web 配下 7 component の Vitest unit test を新規追加し、AC を test ID にマッピングし、coverage 目標 (Stmts/Lines/Funcs ≥85%, Branches ≥80%) を達成するためのテスト戦略を確定する。

## テストフレームワーク / ツール

| 項目 | 採用 |
| --- | --- |
| ランナー | Vitest (root `vitest.config.ts` を `--root=../..` で利用) |
| DOM | jsdom (既存 admin test と同様) |
| Render | @testing-library/react (`render`, `screen`, `fireEvent`, `cleanup`) |
| Coverage | `vitest --coverage` (v8 provider, `apps/web/coverage/` 出力) |
| 共有 schema | `@ubm-hyogo/shared` の Zod 型を fixture builder に利用 |

## CONST_005 必須項目

### 変更対象ファイル一覧

| パス | 区分 |
| --- | --- |
| apps/web/src/components/public/__tests__/Hero.test.tsx | 新規 |
| apps/web/src/components/public/__tests__/MemberCard.test.tsx | 新規 |
| apps/web/src/components/public/__tests__/ProfileHero.test.tsx | 新規 |
| apps/web/src/components/public/__tests__/StatCard.test.tsx | 新規 |
| apps/web/src/components/public/__tests__/Timeline.test.tsx | 新規 |
| apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | 新規 |
| apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | 新規 |
| apps/web/src/test-utils/render.tsx | 新規 (Phase 8 の DRY 化で導入) |
| apps/web/src/test-utils/fixtures/public.ts | 新規 (Phase 8 fixture factory) |

### 主要な関数・型のシグネチャ (テスト対象 export)

| Component | export | 主要 props |
| --- | --- | --- |
| Hero | `function Hero(props: HeroProps)` | `title`, `subtitle?`, `primaryCta?`, `secondaryCta?` |
| MemberCard | `function MemberCard(props: MemberCardProps)` | `member: PublicMemberListItem`, `density?: "comfy"\|"dense"\|"list"` |
| ProfileHero | `function ProfileHero(props: ProfileHeroProps)` | `memberId`, `fullName`, `nickname`, `occupation`, `location`, `ubmZone\|null`, `ubmMembershipType\|null` |
| StatCard | `function StatCard(props: StatCardProps)` | `stats: PublicStatsView` |
| Timeline | `function Timeline(props: TimelineProps)` | `entries: TimelineEntry[]` |
| FormPreviewSections | `function FormPreviewSections(props)` | `preview: FormPreviewView` |
| EmptyState | `function EmptyState(props: EmptyStateProps)` | `title`, `description?`, `resetHref?`, `resetLabel?`, `children?` |

### 入力・出力・副作用

- 全 component は presentational pure function。副作用なし、API fetch なし。
- 入力: props のみ。出力: JSX。副作用: なし (D1 / fetch 触らないため不変条件 #6 を遵守)。
- MemberCard / ProfileHero は子の `Avatar` を内部で render するため、Avatar は実装そのままで render させ、`data-component`/`data-role` で assertion する (mock 不要)。

### テスト方針 (テストケースマトリクス)

| Component | happy | empty-or-null-data | interaction-or-prop-variant |
| --- | --- | --- | --- |
| Hero | title+subtitle+primary/secondary CTA を render | `subtitle` 省略 / 両 CTA なしで `data-role="cta"` 内が空 | primary のみ / secondary のみで `data-variant` の差を検証 |
| MemberCard | 全 prop 揃った会員を render し `/members/:memberId` href を検証 | `nickname`/`ubmZone`/`ubmMembershipType` null を全て省略 | `density="dense"` / `density="list"` で occupation の出し分けと avatar size を検証 |
| ProfileHero | 全 badge ありで render | `ubmZone=null && ubmMembershipType=null` で `[data-role="badges"]` が空 | `nickname=""` で nickname 行を出さないことを検証 |
| StatCard | counts と zoneBreakdown 配列を全件 render | `zoneBreakdown=[]` で `dl` 内が空 | counts が 0 でも `data-key="member-count"` が `0` を render することを検証 |
| Timeline | entries 配列を `<li>` で出力 | `entries=[]` で `null` を返し section が描画されないことを検証 | 複数 entries の表示順 / `time[dateTime]` 属性検証 |
| FormPreviewSections | 複数 sectionKey に grouping され各 field が `stableKey` で li になる | `preview.fields=[]` で `<ul>` が空 | `visibility` の label 変換 (`public`→公開) と `required` バッジ表示の有無 |
| EmptyState | title+description+resetHref を render | `description`/`resetHref`/`children` 全て省略で title のみ | `resetLabel` カスタム / `children` slot 描画 |

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/feedback
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

> 参考: package 名は `@ubm-hyogo/web`。`pnpm --filter` の引数はこの名前を使う。

### Coverage 計測方針

- `apps/web/package.json` の `test:coverage` script (v8) を使用。
- 計測対象 include: `apps/web/src/**/*.{ts,tsx}`。
- 閾値判定 (Stmts/Lines/Funcs ≥85% / Branches ≥80%) は対象 7 file に対して file-level で評価する。
- `coverage-summary.json` 出力 path: `apps/web/coverage/coverage-summary.json` (Phase 11 evidence)。

### 除外境界 (decision log)

- `apps/web/src/components/public/index.ts` (barrel) — 型 re-export のみ、coverage 対象外として記録。
- `Avatar` は本タスクスコープ外 (UT-WEB-COV-04 委譲) のため transitive coverage のみで OK、独立検証はしない。

### DoD

- 7 ファイルすべての coverage が Stmts/Lines/Funcs ≥85% / Branches ≥80%。
- 全 component に happy/empty-or-null-data/interaction-or-prop-variant 各 1 以上。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `lint` / `test` が PASS。
- 既存 admin/ui/lib テストに regression なし。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/00-overview.md
- docs/00-getting-started-manual/claude-design-prototype/

## 統合テスト連携

- 上流: 04a-parallel-public-directory-api-endpoints
- 下流: 09a-A-staging-deploy-smoke-execution

## 多角的チェック観点

- #2 responseId/memberId separation: MemberCard / ProfileHero は `memberId` のみを参照し responseId に依存しない。
- #5 public/member/admin boundary: 対象は public/feedback のみ。member/admin component を import しない。
- #6 apps/web D1 direct access forbidden: テスト中 fetch / D1 mock 不要 (presentational のため)。
- 未実装/未実測を PASS 扱いしない。
- placeholder と実測 evidence (Phase 11) を分離する。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース
- snapshot 依存ではなく明示 assertion
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、AC、blocker、evidence path、approval gate、テストケースマトリクスを渡す。
