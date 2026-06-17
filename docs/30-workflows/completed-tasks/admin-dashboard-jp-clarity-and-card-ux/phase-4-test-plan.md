# Phase 4: テスト計画（TDD Red）

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 実装区分: 実装仕様書（CONST_004 = 実装仕様書）
- 前提: Phase 1（要件・AC-1..AC-10）/ Phase 2（glossary 完全コード・C1-C5 Before/After・トークン）/ Phase 3（設計レビュー PASS）

## 目的

ダッシュボード日本語化＋カード型 UI/UX 是正（C1-C5）を TDD で駆動するため、各コンポーネント／glossary のテストケースを「対象 AC・入力・期待値」まで確定する。
本 Phase は **TDD の Red フェーズの計画**であり、Phase 5（実装）と Phase 6（テスト実装）で green へ転じる。
全テストは jsdom 上の構造・文言・トークン・glossary fallback の機械検証であり、レイアウトの「はみ出し／横長」是正の最終確認は Phase 11 の staging スクリーンショット（user-gated）で行う。
`apps/api` / D1 schema / Google Form schema は一切変更しない（AC-8・不変条件 #1 #5）。

## 対象テストファイル一覧（新規 / 更新の別）

| # | テストファイル | 新規/更新 | 対象 | 主担当 AC |
| --- | --- | --- | --- | --- |
| T1 | `apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts` | 新規 | `dashboardGlossary.ts` 純関数（C5） | AC-6 |
| T2 | `apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx` | 更新 | `KpiGrid.tsx` / `KpiCard.tsx`（C1） | AC-1 |
| T3 | `apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx` | 新規 | `SchemaAlertCard.tsx`（C2） | AC-2 |
| T4 | `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` | 新規 | `ZoneDistribution.tsx`（C2） | AC-3 |
| T5 | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | 更新 | `StatusDistribution.tsx`（C4・横バーリスト構造へ） | AC-5 / AC-9 |
| T6 | `apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx` | 更新 | `RecentActionsTable.tsx`（C3・カードリスト構造へ） | AC-4 / AC-9 |

> 注: `ZoneDistribution.spec.tsx`（T4）は既存の同名 spec が `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` に存在する。本タスクでは「eyebrow 日本語化」の TC を **追加**する（既存 4 ケースは構造非破壊で維持）。表上は新規 TC 追加のため便宜上「新規」扱いとせず、既存 spec への TC 追記とする（Phase 6 で反映）。

## private method 等の有無

- 全対象は **純関数（dashboardGlossary）または stateless presentational コンポーネント**であり、private method・state machine・ロック変数は存在しない。
- したがって private method 単体テストは不要。glossary は export された純関数（`describeAuditAction` / `describeTargetType` / `describeTarget` + 定数 `DASHBOARD_KPI_LABELS` / `MEMBER_STATUS_LABELS`）を直接検証し、コンポーネントは render → DOM assert のみで検証する。

## テストケース表

### T1: dashboardGlossary.spec.ts（AC-6）

| TC-ID | 対象 AC | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-GLO-01 | AC-6 | `describeAuditAction("admin.member.status_updated")` | `"会員の公開状態を変更"` |
| TC-GLO-02 | AC-6 | `describeAuditAction("attendance.add")` | `"出席を記録"` |
| TC-GLO-03 | AC-6 | `describeAuditAction("admin.tag.queue_dlq_moved")` | `"タグ付けキューを保留へ移動"` |
| TC-GLO-04 | AC-6 | `describeAuditAction("some.unknown.code")`（未登録） | `"some.unknown.code"`（raw 返却・情報を握り潰さない） |
| TC-GLO-05 | AC-6 | `describeAuditAction("")`（空文字） | `""`（fallback で原入力保持・throw しない） |
| TC-GLO-06 | AC-6 | `describeTargetType("member")` | `"会員"` |
| TC-GLO-07 | AC-6 | `describeTargetType("schema")` | `"フォーム項目"` |
| TC-GLO-08 | AC-6 | `describeTargetType("unknown_type")`（未登録） | `"unknown_type"`（raw 返却） |
| TC-GLO-09 | AC-6 | `describeTarget("member", "MEM-001")` | `"会員 MEM-001"`（label + id） |
| TC-GLO-10 | AC-6 | `describeTarget("meeting", null)` | `"開催回"`（id null は label のみ） |
| TC-GLO-11 | AC-6 | `DASHBOARD_KPI_LABELS` の 4 キー | `totalMembers="会員総数"` / `publicMembers="サイト公開中"` / `untaggedMembers="タグ未設定"` / `unresolvedSchema="要対応のフォーム項目"` |
| TC-GLO-12 | AC-6 | `MEMBER_STATUS_LABELS` の 3 キー | `public="公開"` / `member_only="会員限定"` / `hidden="非公開"` |
| TC-GLO-13 | AC-6 | 全 accessor を未登録入力で連続呼び出し | いずれも throw しない（純関数・例外なし・[WEEKGRD-02]） |

### T2: KpiGrid.spec.tsx（AC-1）

| TC-ID | 対象 AC | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-KPI-01 | AC-1 | `totals = { totalMembers:120, publicMembers:80, untaggedMembers:5, unresolvedSchema:0 }` で render | テキスト「会員総数」「サイト公開中」「タグ未設定」「要対応のフォーム項目」が DOM に出る（日本語ラベル 4 種） |
| TC-KPI-02 | AC-1 | 同上で render | 英語ラベル `Total members` / `Public on site` / `Untagged` / `Schema issues` が DOM に **存在しない**（`queryByText` が null） |
| TC-KPI-03 | AC-1 | 同上で render | 各 KPI の label 要素（`admin-kpi-card-*` 内の `<span>`）の className に `uppercase` が **含まれない**（`className` 文字列に `/\buppercase\b/` が不一致） |
| TC-KPI-04 | AC-1 | 同上で render | testid `admin-kpi-card-total` / `-public` / `-untagged` / `-schema` が 4 枚揃う（既存 testid 契約維持） |
| TC-KPI-05 | AC-1 | `untaggedMembers:5`（>0）/ `unresolvedSchema:3`（>0） | tone 連動が維持（untagged は warning トーンクラス・schema は danger トーンクラス）。`value` は `toLocaleString("ja-JP")` で描画される |

### T3: SchemaAlertCard.spec.tsx（AC-2）

| TC-ID | 対象 AC | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-SAC-01 | AC-2 | `count={3}` で render | 「スキーマ」「alias」「schema」の語が `container.textContent` / innerHTML に **含まれない** |
| TC-SAC-02 | AC-2 | `count={3}` で render | 見出しに「要対応のフォーム項目: 3 件」が出る |
| TC-SAC-03 | AC-2 | `count={3}` で render | 説明文に「フォームの設問」「対応づけ」など平易語が出る（`/対応づけ/` にマッチ） |
| TC-SAC-04 | AC-2 | `count={3}` で render | リンク文言「フォーム項目の対応づけを開く →」、`href="/admin/schema"` 維持、`role="alert"` 維持 |
| TC-SAC-05 | AC-2 | `count={0}` で render | `null` を返し DOM に何も描画しない（`container.firstChild` が null） |
| TC-SAC-06 | AC-2 | `count={3}` で render | innerHTML に HEX 直書きなし（`not.toMatch(/#[0-9a-fA-F]{6}\b/)`）・トークン色（`--ubm-color-warn`）参照を維持 |

### T4: ZoneDistribution.spec.tsx（AC-3・既存 spec へ TC 追加）

| TC-ID | 対象 AC | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-ZD-EYEBROW-01 | AC-3 | 既存 `slices`（3 件）で render | eyebrow に「会員分布」が出る（`container.textContent` が `/会員分布/` にマッチ） |
| TC-ZD-EYEBROW-02 | AC-3 | 同上 | 「DISTRIBUTION」が DOM に **含まれない**（`not.toMatch(/DISTRIBUTION/)`） |
| TC-ZD-EYEBROW-03 | AC-3 | `slices={undefined}`（placeholder 分岐） | placeholder でも eyebrow が「会員分布」（:41 分岐も日本語化済み・`/DISTRIBUTION/` 不一致） |
| （既存維持） | AC-9 | 既存 4 ケース | `role="img"`（name `/zone 別人数/i`）・li 構造・`undefined` placeholder・HEX 禁止は **維持**（aria-label は不変） |

> 既存 spec の `name: /zone 別人数/i` assertion は aria-label（`zone 別人数 全 N 件`）に依存する。Phase 5 では aria-label を変更せず eyebrow テキストのみ日本語化するため、既存 4 ケースは破壊されない。

### T5: StatusDistribution.spec.tsx（AC-5 / AC-9・更新）

旧 spec は `status-distribution-chart`（svg）と縦棒 SVG の `rect height` 比較を前提にしている。横バーリスト再設計に伴い、構造系 assertion を更新する。**aria-label の文字列契約は維持**する。

| TC-ID | 対象 AC | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-SD-01 | AC-9 | `slices={undefined}` | `role="status"` に「分布データは現在集計対象外です」、`queryByTestId("status-distribution-list")` が null（placeholder 維持） |
| TC-SD-02 | AC-9 | `slices={[]}` | 同上（empty placeholder） |
| TC-SD-03 | AC-5 / AC-9 | `slices=[{public,12},{member_only,8},{hidden,3}]` | `status-distribution-list` 要素が `role="img"`、`aria-label="公開ステータス分布: 公開 12, 会員限定 8, 非公開 3"`（**aria-label 契約維持**・付与先は `<ul>`） |
| TC-SD-04 | AC-5 | 同上 | `data-testid="status-bar"` が 3 件、`data-status` が `["public","member_only","hidden"]`（横バーリスト構造） |
| TC-SD-05 | AC-5 | 同上 | `<svg viewBox="0 0 600 200">` のような **600px 固定 SVG が存在しない**（innerHTML が `/viewBox="0 0 600/` 不一致）。バーは `viewBox="0 0 100 8"` の横バー |
| TC-SD-06 | AC-5 | 同上 | 各 status の count が「N名」表記で出る（「12名」「8名」「3名」が DOM に出る） |
| TC-SD-07 | AC-5 | 同上 | バー幅がカウント比例（`public` rect の `width` 属性 > `hidden` rect の `width`）。`maxCount` 基準で `public`(12) は width=100、`hidden`(3) は小さい値 |
| TC-SD-08 | AC-9 | 同上 | バー fill が `var(--ubm-color-ok|info|warn)`、innerHTML に HEX 直書きなし（`not.toMatch(/#[0-9a-fA-F]{6}\b/)`） |
| TC-SD-09 | AC-5 | `slices=[{public,0},{member_only,0},{hidden,0}]`（全 0） | throw せず描画。各バー width=0、`aria-label="公開ステータス分布: 公開 0, 会員限定 0, 非公開 0"` |
| TC-SD-10 | AC-9 | `slices=[{public,5}]`（部分） | `status-bar` 1 件、`aria-label="公開ステータス分布: 公開 5"`（buildAriaLabel 契約維持） |

> ラベル正本は `MEMBER_STATUS_LABELS`（glossary）に統一する（旧 `LABEL` 定数の二重定義を解消）。aria-label の語順・区切り（`, `）・接頭辞「公開ステータス分布: 」は `buildAriaLabel` をそのまま維持するため変わらない（AC-9）。

### T6: RecentActionsTable.spec.tsx（AC-4 / AC-9・更新）

旧 spec は `tbody tr` 行数を前提にしている。カード型リストへの再設計に伴い構造系 assertion を更新する。**`/admin/audit` リンク・empty `role="status"`・axe 0 違反は維持**する。

| TC-ID | 対象 AC | 入力 | 期待値 |
| --- | --- | --- | --- |
| TC-RAT-01 | AC-9 | `items={[]}` | empty メッセージ「直近 7 日のアクションはありません」が `role="status"` で出る（文言・role 維持） |
| TC-RAT-02 | AC-4 | items 5 件（action=`admin.member.status_updated` / targetType=`member` / targetId=`m{i}`） | `<table>` / `tbody tr` が **存在しない**（`querySelector("table")` が null）。`recent-actions-list`（`<ul>`）が存在し、`recent-action-item`（`<li>`）が 5 件 |
| TC-RAT-03 | AC-9 | `items={[]}` | 「監査ログを開く →」リンクの `href="/admin/audit"` 維持 |
| TC-RAT-04 | AC-4 | items 1 件（action=`admin.member.status_updated`） | アクション名が日本語「会員の公開状態を変更」で出る（`describeAuditAction` 適用） |
| TC-RAT-05 | AC-4 | items 1 件（targetType=`member` / targetId=`MEM-12345`） | 対象が「対象: 会員 MEM-12345」で出る（`describeTarget` 適用・日本語ラベル化） |
| TC-RAT-06 | AC-4 | items 1 件（targetId が長い文字列） | 対象を含む `<p>` の className に `truncate` が含まれる（カード内に収まる） |
| TC-RAT-07 | AC-4 | items 1 件（action=`some.unknown.action`） | 未登録アクションは raw コードがそのまま出る（`describeAuditAction` fallback・情報を握り潰さない） |
| TC-RAT-08 | AC-4 | items 1 件（createdAt=`2026-05-10T00:00:00.000Z`） | `formatJstDateTime` による JST 表示が出る（meta 行） |
| TC-RAT-09 | AC-9 | `items={[]}` | axe violations 0（`expect(results.violations).toHaveLength(0)`） |
| TC-RAT-10 | AC-9 | items 3 件 | axe violations 0（リスト化後も a11y 維持） |

## 既存テスト契約の維持方針と更新が必要な assertion

| 契約 | 維持/更新 | 詳細 |
| --- | --- | --- |
| StatusDistribution `aria-label="公開ステータス分布: …"` | **維持** | `buildAriaLabel` のロジック・語順・区切りを変えない。付与先のみ `<svg>` → `<ul role="img">` に移すが、文字列は不変（AC-9） |
| StatusDistribution `data-testid="status-distribution-chart"` | **更新** | `status-distribution-list` に変更。旧 testid を参照する TC-CHART-01..14 を新 testid・横バー構造へ書き換える |
| StatusDistribution `rect height` 比較（縦棒前提） | **更新** | 横バーの `rect width` 比較へ変更（TC-SD-07）。600px 固定 SVG 不在の assertion を追加（TC-SD-05） |
| HEX 禁止 `not.toMatch(/#[0-9a-fA-F]{6}\b/)` | **維持** | StatusDistribution・SchemaAlertCard・ZoneDistribution で継続 |
| RecentActionsTable `/admin/audit` リンク | **維持** | href 契約を変えない（TC-RAT-03） |
| RecentActionsTable empty `role="status"` | **維持** | empty 文言「直近 7 日のアクションはありません」と role を変えない（TC-RAT-01） |
| RecentActionsTable `tbody tr` 行数 | **更新** | テーブル廃止のため `recent-action-item`（`<li>`）件数 assert へ変更（TC-RAT-02） |
| RecentActionsTable axe 0 違反 | **維持** | empty / 件数あり双方で 0 違反（TC-RAT-09 / 10） |
| ZoneDistribution `role="img"`（name `/zone 別人数/i`）・li 構造 | **維持** | aria-label を触らず eyebrow のみ日本語化（既存 4 ケース不変） |

## vitest 実行コマンド（focused）

worktree 直後は事前に `mise exec -- pnpm install` / `mise exec -- pnpm verify:vitest-runtime` を 1 回実施する。focused 実行はルート `vitest.config.ts` を `--config` に指定する（本リポジトリは vitest 設定をルートに集約）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx
```

> `apps/web/src/features/admin/components/_dashboard` を渡すと、`StatusDistribution.spec.tsx`（直下）と `__tests__/`（KpiGrid / SchemaAlertCard / ZoneDistribution）の両方が include glob（`apps/**/__tests__/**/*.spec.{ts,tsx}` および直下 `*.spec.tsx`）で収集される。RecentActionsTable spec は `components/__tests__/` 配下のためパスを明示する。

## 統合テスト連携

- 当初計画の dashboard 6 spec に RES-1 の `AuditLogPanel.component.spec.tsx` を加えた 7 spec で「日本語化（C1/C2/C5）・カード/横バー再設計の DOM 構造（C3/C4）・glossary fallback（C5）・トークン（HEX 禁止）・a11y（axe/aria/role）・audit 画面の glossary 共有適用」を機械検証する。
- Phase 5（実装）は本計画のケースを green にする実コードを Before/After で確定する。Phase 6 で本 7 spec を実テストとして追加・更新し、Phase 7/automation-30 で focused vitest 全 PASS を確認する。
- jsdom は CSS を評価しないため、レイアウトの「はみ出し／横長」是正の最終確認は Phase 11 の staging スクリーンショット（実装後・user-gated）で行う。
- Phase 9 で `verify:tokens`（HEX 直書き検出）と `git diff --name-only -- apps/api` が空（AC-8）を gate として再実行する。

## 成果物

- 本ファイル（テスト計画）: 対象テスト 6 本（新規 4 / 更新 2）、TC-ID × AC × 入力 × 期待値のケース表、既存テスト契約の維持/更新方針、focused vitest 実行コマンド。

## 完了条件

- [ ] 対象テストファイル 6 本（新規 4 / 更新 2）と新規/更新の別を確定した。
- [ ] 各 spec の TC-ID / 対象 AC / 入力 / 期待値を表で確定した（T1=13 / T2=5 / T3=6 / T4=3+既存維持 / T5=10 / T6=10）。
- [ ] 既存テスト契約（aria-label / HEX 禁止 / audit リンク / empty role / axe / ZoneDistribution aria）の維持と、構造変更で更新が必要な assertion を明示した。
- [ ] private method 等が無く（全て純関数/presentational）、単体テストは export 関数・DOM assert のみで足ることを明記した。
- [ ] focused vitest 実行コマンド（ルート `vitest.config.ts` 指定）を確定した。
- [ ] AC-1（KPI 日本語/uppercase 撤廃）/ AC-2（schema 語排除）/ AC-3（eyebrow）/ AC-4（カードリスト）/ AC-5（横バー）/ AC-6（glossary）/ AC-9（既存契約維持）を各 TC に trace した。
