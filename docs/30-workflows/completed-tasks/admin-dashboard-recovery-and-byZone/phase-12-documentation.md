# Phase 12 — Documentation

[実装区分: 実装仕様書]

## Goal

`/admin` の ADMIN_FETCH_404 を staging で根本原因切り分けの上で復旧し、プロトタイプ準拠の `byZone` (区画 0→1 / 1→10 / 10→100) 分布を既存 `GET /admin/dashboard` endpoint の response に optional 拡張として供給する。

## Scope

- 404 切り分け (H1 環境変数 / H2 cookie 転送 / H3 prefix 解釈) と該当 1 系統の修正
- `apps/api/src/routes/admin/dashboard.ts` の `byZone` 拡張 (既存 `aggregatePublicZones` 流用)
- `packages/shared/src/zod/viewmodel.ts` の `AdminDashboardViewZ` に `byZone` optional 追加
- `apps/web/src/lib/admin/admin-dashboard-ui.ts` の `ZoneSlice` / `parseZoneSlices` 改修
- `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` のプロトタイプ準拠 DOM 書き換え
- vitest / playwright spec 追加 (T-B-01..T-B-08)

## Non-Goals

- 新 API endpoint 追加 / D1 schema 変更 (CLAUDE.md #5・親 workflow 不変条件 #1)
- Task A (shell) / Task C (page header) / Task D (attendance) / Task E (visual baseline) のスコープ
- 広域 tokens.css redesign / visual baseline 更新 (Task E user-gated)。ただし `ZoneDistribution` が直接参照する token alias 欠落は本 task 内で最小修正する
- 認証ロジック自体の変更 (cookie 転送経路の修正のみ scope 内)

## Inputs

- `requireAdmin` middleware 通過後の `c.env.DB`
- admin session cookie (`server-fetch.ts` 経由で worker-to-worker 転送)
- `aggregatePublicZones(dbCtx)` の raw 集計結果

## Outputs

- `GET /admin/dashboard` response に `byZone: ByZoneSlice[]` (length=3) を同梱
- staging `/admin` が 200 + DashboardSections 表示
- `<ZoneDistribution>` がプロトタイプ準拠 3 行 (`Chip + label + hint + count + 8px bar`) を描画

## Acceptance Criteria

AC-B1..B7 (Phase 1 参照)。要約:

1. staging `/admin` が 200 (`ADMIN_FETCH_404` 文字列を含まない)
2. `/admin/dashboard` response の `byZone` length=3 / key=`0to1`/`1to10`/`10to100`
3. `AdminDashboardViewZ.safeParse` が成功 (byZone 拡張は optional・後方互換)
4. playwright で `zone 別人数` / `KPI` region visible
5. プロトタイプ pages-admin.jsx L80-93 と DOM 一致
6. `verify-design-tokens` pass
7. `pnpm typecheck` / `lint` / `test` 全 green

## Risks

- 401 → 404 マスクの未確認: Phase 5.1 wrangler tail で確定するまで H1 以外のコード修正を行わない
- `aggregatePublicZones` の raw value 多様性: Phase 5.2 前に staging D1 で実値確認
- `--ubm-color-info/accent/ok/bg` 未定義: 本 task で最小 alias を追加する。広域 visual baseline 更新だけを Task E に残す

## Rollback

- shared zod / api dashboard / web mapper / ZoneDistribution の改修は同一 PR でまとめてマージ。問題発生時は PR revert で全戻し可能
- 環境変数 (H1 該当時) は `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging` で前 version へ戻す
- `byZone` は optional のため、API 側だけ revert しても UI 側は placeholder へ degrade し画面停止しない

## References

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- ソース task: `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-B-dashboard-recovery-and-byZone.md`
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L3-159 (特に L70-107)
- システム仕様: `docs/00-getting-started-manual/specs/00-overview.md`
- 親 workflow Phase 2 design: `docs/30-workflows/admin-ui-prototype-alignment/phase-2-design.md`

---

## 中学生レベル説明 (Phase 12 必須項目)

**区画 (zone) ってなに？**
UBM 兵庫のメンバーは、活動の進み具合で 3 つのフェーズに分けられます。

- **0 → 1 (立ち上げ)**: 始めたばかりで、まだ最初の成果を出す前の人たち
- **1 → 10 (拡大)**: 最初の成果を出して、それを 10 倍に育てている人たち
- **10 → 100 (組織化)**: 成果が出ているチームを組織として伸ばしているフェーズの人たち

管理画面のダッシュボードはこの 3 段階で「今それぞれ何人いるか」を **棒グラフ** で表示します。今回の修正で、

1. 管理画面が真っ赤なエラーで止まらず、ちゃんと表示されるようにする
2. 棒グラフが、デザイナーが用意した見本どおりに「色付きの丸ラベル + 何人 + 棒」の形で描画される

の 2 つを実現します。

**なぜ「404 切り分け」が必要？**
管理画面が止まる原因として考えられる 3 つの可能性 (環境変数 / cookie / URL の組み立て間違い) のうち、どれが本当の原因かを実際の log で確認してから修正します。憶測で全部直すと「本当は何が悪かったか」が分からなくなるからです。

## skill-feedback / 苦戦箇所メモ

- 401→404 マスクの可能性は仕様書時点では未確認。wrangler tail での切り分けが必須となる。同種の「server fetch のエラーマスク」は今後別 endpoint でも発生しうるので、`safe-server-fetch-404-vs-401.spec.ts` のような **status code 弁別 spec** を恒久ガードとして配置する価値がある。
