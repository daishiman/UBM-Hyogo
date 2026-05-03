# Phase 6: 異常系検証 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 6 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

各 public component の異常入力 (null / undefined / 空配列 / 巨大データ / 不正 prop) に対する想定挙動とテストケース設計を確定する。
対象は presentational component のため D1-fail / fetch-fail / auth-fail は対象外 (不変条件 #6 によりこれらは API 層で処理)。

## CONST_005 必須項目

### 変更対象ファイル一覧

| パス | 区分 | 異常系ケース数 |
| --- | --- | --- |
| apps/web/src/components/public/__tests__/Hero.test.tsx | 新規 (Phase 5 と同一ファイル) | +2 |
| apps/web/src/components/public/__tests__/MemberCard.test.tsx | 新規 | +2 |
| apps/web/src/components/public/__tests__/ProfileHero.test.tsx | 新規 | +2 |
| apps/web/src/components/public/__tests__/StatCard.test.tsx | 新規 | +2 |
| apps/web/src/components/public/__tests__/Timeline.test.tsx | 新規 | +2 |
| apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | 新規 | +2 |
| apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | 新規 | +2 |

### 主要な関数・型のシグネチャ

Phase 4 と同一。異常系では型上 nullable な field に対し `null` / `""` を渡す。

### 入力・出力・副作用

- 入力: 異常な props (`null`, `""`, 巨大配列など)。
- 出力: クラッシュせず、対応する DOM が省略されることを assertion する。
- 副作用: なし。

### テスト方針 (異常系マトリクス)

| Component | 異常入力 | 想定挙動 | テスト ID 案 |
| --- | --- | --- | --- |
| Hero | `subtitle=""` (空文字) | `subtitle ? <p>` 分岐で `<p>` 描画されない (空文字は falsy) | `T-Hero-EX-1` |
| Hero | 両 CTA 省略 | `[data-role="cta"]` 内が空でクラッシュなし | `T-Hero-EX-2` |
| MemberCard | `nickname=null && ubmZone=null && ubmMembershipType=null` | optional 表示 0 件、name/occupation/location は表示 | `T-Member-EX-1` |
| MemberCard | `density="list"` | occupation を表示しない (`data-role="occupation"` 0 件) | `T-Member-EX-2` |
| ProfileHero | `ubmZone=null && ubmMembershipType=null` | `[data-role="badges"]` の childElementCount === 0 | `T-Profile-EX-1` |
| ProfileHero | `nickname=""` | nickname `<p>` 非表示 | `T-Profile-EX-2` |
| StatCard | `zoneBreakdown=[]` | `dl[data-role="zone"]` 内 `<div>` 0 | `T-Stat-EX-1` |
| StatCard | `memberCount=0 / publicMemberCount=0 / meetingCountThisYear=0` | "0" を render (短絡評価で消えない) | `T-Stat-EX-2` |
| Timeline | `entries=[]` | `null` を返し component 描画なし | `T-Timeline-EX-1` |
| Timeline | 100 件の entries (巨大データ) | `<li>` が 100 件 render され key 重複 warning なし | `T-Timeline-EX-2` |
| FormPreviewSections | `fields=[]` | section list 空でクラッシュなし、概要 `<p>` のみ | `T-Form-EX-1` |
| FormPreviewSections | `visibility="unknown"` (label map miss) | 生文字列 "unknown" にフォールバック | `T-Form-EX-2` |
| EmptyState | `description / resetHref / children` 全て省略 | title のみ render、`role="status"` 維持 | `T-Empty-EX-1` |
| EmptyState | `resetHref` 指定 + `resetLabel` 未指定 | デフォルト "絞り込みをクリア" を使用 | `T-Empty-EX-2` |

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/feedback
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

### DoD

- 上記 14 異常系ケースすべて green。
- branch coverage が 80% 以上 (early-return / null 分岐含む)。
- `console.error` / `console.warn` を spy し、key warning が 0 件であることを Timeline / FormPreviewSections で検証。

## error message / redact 規約

- presentational のため i18n 文言はリテラル ("公開", "会員のみ", "管理者のみ", "絞り込みをクリア") をそのままアサート。
- redact 対象なし (PII を直接保持しない)。
- retryable / non-retryable 分類は本 component スコープ外 (API 層で処理)。

## 参照資料

- Phase 4 テスト戦略
- Phase 5 ランブック
- `apps/web/src/components/public/Timeline.tsx` early-return 分岐

## 統合テスト連携

- 上流: 04a-parallel-public-directory-api-endpoints
- 下流: 09a-A-staging-deploy-smoke-execution

## 多角的チェック観点

- #2 responseId/memberId separation: 異常系 fixture でも memberId のみを使用する。
- #5 public/member/admin boundary: 異常系で member/admin の type を借用しない。
- #6 apps/web D1 direct access forbidden: 異常系は presentational に閉じる。

## サブタスク管理

- [ ] refs を確認する
- [ ] 異常系マトリクスを Phase 5 のファイルに追記する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- 上記マトリクスの全ケースが green。
- branches ≥80%、early-return 分岐がカバーされている。
- 既存 test に regression なし。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、AC × component × test ID マトリクスを引き渡す。
