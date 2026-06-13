# workflow-home-dashboard-japanese-localization Artifact Inventory

## Summary

`home-dashboard-japanese-localization` is `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate`.

The workflow localizes public home `/` English UI copy for non-engineer users:

- Stats labels: `Members` / `Zones` / `Meetings / yr` / `Last sync` -> `公開メンバー` / `事業フェーズ` / `年間の支部会` / `最終データ更新`.
- Sync badge: `Forms 同期中` -> `自動で最新化`.
- Removes redundant English overline/eyebrow copy from the home sections while keeping Japanese headings.
- Adds an apps/web boundary fallback for legacy/partial `/public/members` responses missing `topTags`, preventing the featured members error panel while keeping the shared/API contract unchanged.

## Workflow Artifacts

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/index.md` |
| root ledger | `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/artifacts.json` |
| mirror ledger | `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/outputs/phase-11/manual-test-result.md` |
| local screenshots | `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/outputs/phase-11/screenshots/{home-localized-full,home-localized-stats,home-localized-about}.png` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Targets

| Area | Files |
| --- | --- |
| public home | `apps/web/app/(public)/page.tsx` |
| public components | `apps/web/src/components/public/{Stats,AboutUbm,Timeline,CallToActionCTA}.tsx` |
| public CSS | `apps/web/src/styles/legacy-public.css` |
| public API wrapper | `apps/web/src/lib/api/public.ts` |
| tests | `apps/web/src/components/public/__tests__/{Stats,AboutUbm,Timeline,CallToActionCTA,Hero}.component.spec.tsx`, `apps/web/src/lib/api/__tests__/public.spec.ts`, `apps/web/app/(public)/page.spec.tsx` |

## Evidence

- focused Vitest: 7 files / 44 tests PASS.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm verify:tokens`: PASS.
- residual English grep for home/public components: 0 hits.
- local Playwright screenshots 3 PNG + DOM verification: localized labels present, `main [data-role="eyebrow"]` empty, legacy English terms empty.
- featured members error panel: absent after `topTags` fallback.
- apps/api / packages/shared diff: empty.

## Invariants

- New endpoint: none.
- D1 schema / migration: none.
- Google Form schema: none.
- shared package contract: unchanged.
- `Hero` remains generic and still supports an optional `eyebrow` prop; home page simply no longer passes the English eyebrow.
- Commit, push, PR, and staging visual baseline remain user-gated.

## Lessons Learned

- L-HDJL-001: 元要求は「ホーム `/` の英語表記日本語化」という表現層の文字列置換だったが、Phase 11 の実 screenshot レビューが scope 外の潜在 runtime バグ（featured members error panel）を検出した。VISUAL タスクでは local screenshot を「日本語化の確認」だけでなく「他セクションの runtime 破綻検査」としても読むと、文字列変更に紛れた既存不具合を同サイクルで拾える。
- L-HDJL-002: featured members error panel の真因は `/public/members` の旧/部分レスポンスが `topTags` を欠き、`PublicMemberListViewZ.parse` が throw していたこと。修正は shared/API 契約（`topTags` は必須のまま）を変えず、apps/web fetch 境界の `normalizePublicMemberList` で `topTags: []` を補完する adapter に閉じた。UI prototype alignment 不変条件 #1（既存 API のみ・apps/api / packages/shared 非接触）を守るため、web 側 adapter で旧 shape を吸収するのが正解で、shared schema を optional 化する誘惑に乗らない。
- L-HDJL-003: 英語 overline / eyebrow の削除は home 専用コンポーネント（Hero/AboutUbm/Timeline/CallToActionCTA）に限定する。`Hero` の `eyebrow` prop は汎用 primitive の契約なので prop 自体は残し、home page 側で「英語 eyebrow を渡さない」だけにする。prop を消すと他 surface へ波及するため、削除と「呼び出し側で不使用」を区別する。
- L-HDJL-004: DOM verification は `main [data-role="eyebrow"]` が空であること・旧英語語句の grep 0 を assert する形にすると、文字列削除の取りこぼしを screenshot 目視に頼らず機械検証できる。
- L-HDJL-005: skill 同期 wave で artifact-inventory の `## Lessons Learned` セクションは最も欠落しやすい（本件も初回作成時に欠落・後続検証で補完）。表現層のみ・公開 surface 不変の VISUAL タスクは Phase 12 Step 2（ドメイン正本反映）を N/A 判定とし、`docs/00-getting-started-manual/specs/*.md` への新規追記はしない（SSOT インフレ回避）。同期検証では「Lessons 補完」と「重複追記回避」を両立させる。
