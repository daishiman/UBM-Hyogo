# Lessons Learned: step-05 dashboard chart implementation (2026-05)

> Workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-05-dashboard-chart/`
> Date: 2026-05-18
> State: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`

## L-DASH-001: chart library 不採用 / SVG 直書きで OKLch token 整合を優先

`/admin` dashboard の status 分布表示で Recharts / chart.js 等の chart library 採用を検討したが、library 内部の色変換に OKLch CSS var (`var(--ubm-color-ok|info|warn)`) を直接渡せないことが判明した。HEX 直書きへ降格すると task-08 design-tokens 不変条件と `verify-design-tokens` CI gate に反するため、`apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` で **SVG `<rect>` 直書きの bar chart** を採用した。

- **状況:** chart 表示 UI を新規導入する際、library を入れると bundle size と color pipeline の二重管理が発生し、OKLch token 一本化に逆行する。
- **学び:** 単純な分布 (bar / chip list) であれば chart library を入れず、SVG 直書き + CSS var 参照で token 整合を保つ方が低コスト。
- **適用条件:** chart 表現が「単純な bar / pie / chip 程度」かつ「OKLch token を CSS var 経由で適用したい」ケース。複雑な軸 / tooltip / interaction が必要な場合はこの判断を再評価する。
- **関連 artifact:** `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`

## L-DASH-002: OKLch CSS var vs HEX 直書き / chart UI でも HEX 禁止を堅持

bar chart の色を `fill="#xxx"` で書きたくなるが、`apps/web/src/styles/tokens.css` 正本と `verify-design-tokens` gate が `bg-[#xxx]` / `fill="#xxx"` を含む HEX 直書きを禁止しており、chart UI もこの境界の中に置く必要がある。`fill="var(--ubm-color-ok)"` の形で CSS var を SVG 属性に渡して解決した。

- **状況:** SVG `<rect fill="...">` に直接色を書きたくなる場面で HEX を入れると design-tokens regression。
- **学び:** SVG 属性レベルでも `fill="var(--ubm-color-*)"` を使える。chart 専用の例外 token を生やさず、既存 status 系 token (`ok` / `info` / `warn`) を再利用する。
- **適用条件:** Web UI 内の chart / icon / illustration で色指定が必要な全箇所。
- **関連 artifact:** `apps/web/src/styles/tokens.css`、`apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`

## L-DASH-003: `byStatus` を optional discriminator にする後方互換戦略

`AdminDashboardView` shared schema に `byStatus` を新規追加するにあたり、既存 consumer (admin web の旧 viewmodel 利用箇所、`viewmodel.spec.ts`) を壊さないため `packages/shared/src/zod/viewmodel.ts` で `byStatus` を **optional** で追加し、`apps/api/src/routes/admin/dashboard.ts` 側が producer として常に返す形にした（新 endpoint は追加せず、既存 `/admin/dashboard` に field 追加のみ）。

- **状況:** shared zod schema に新 field を入れる場合、required にすると下流 parser が破綻し contract spec が一気に red になる。
- **学び:** producer-driven optional field で段階導入。consumer 側は `byStatus ?? undefined` で扱い、UI で populated 判定して legacy placeholder と切り替える。
- **適用条件:** shared viewmodel に新 distribution / aggregation field を追加する全ケース。新 endpoint を切る前にまず既存 endpoint への optional field 追加で吸収できないか検討する。
- **関連 artifact:** `packages/shared/src/zod/viewmodel.ts`、`packages/shared/src/zod/viewmodel.spec.ts`、`apps/api/src/routes/admin/dashboard.ts`、`apps/api/src/repository/dashboard.ts`

## L-DASH-004: legacy placeholder fallback / `slices` empty 時の既存 UI 維持

`byStatus` が `undefined` または `slices` が空配列のときに新 chart を描画すると「データなし」表示が二重になる / レイアウトが崩れる。`StatusDistribution.tsx` では **populated（slices.length > 0）時のみ SVG bar chart + chip list を描画**し、empty / legacy response 時は既存 placeholder UI をそのまま保持した。

- **状況:** 新 viewmodel field の rollout 期間中、producer がまだ field を返さない / 0 件の状態が共存する。
- **学び:** 新表示は「populated 時のみ optional に描画」する境界を component 内に閉じ込めることで、API 側 rollout と UI 側 rollout の wave 分離が安全になる。
- **適用条件:** 新 optional field を起点に UI を追加する全ケース。fallback は新規 placeholder を作らず既存 UI を活かす。
- **関連 artifact:** `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`、`apps/web/src/lib/admin/admin-dashboard-ui.ts`

## L-DASH-005: aria-label を component spec で test back する設計

SVG 直書き chart は role / accessible name が自動で付かないため、`aria-label` を bar / group に明示付与し、`StatusDistribution.spec.tsx` で **populated 状態の rendering + aria-label 存在** を component-level に固定した。これにより a11y regression を Phase 6 close-out に組み込み、staging 待ちなしで合格条件化できる。

- **状況:** SVG chart は screen reader に "graphic" としてしか露出しないので、a11y 検証が手薄になりがち。
- **学び:** `aria-label` を component 実装と spec の双方で固定し、ラベル文言を test に back させると後続 i18n / 表現変更でも regression を即検知できる。
- **適用条件:** SVG / canvas で自前描画する chart / icon / illustration 系 component の全ケース。`jest-axe` 併用も検討。
- **関連 artifact:** `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx`、`apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx`
