# serial-06-form-response-binding — Implementation Guide (Phase 12)

## 概要

Google Form 実回答（`PublicMemberProfile`）を `/(public)/members/[id]` の MemberDetail カードに描画する **データ束ね層** を実装した。serial-05 で配線済みの page skeleton に対して、API fetch → adapter → composing primitive の経路を追加し、UI 側 visibility filter（二重防御）と unknown kind silent skip を実装した。

新規 API endpoint / D1 schema / Google Form schema 変更は一切なし（不変条件 #5 / NFR-03 を厳守）。

## 変更点

### 新規

| Path | 役割 |
|------|------|
| `apps/web/src/lib/adapters/member-detail.ts` | `toMemberDetailProps` adapter（pure / visibility filter / unknown kind skip） |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | adapter unit spec（8 ケース / branch coverage 100%） |
| `apps/web/src/fixtures/public-member-profile.ts` | 6 セクション混在 fixture（public / member / admin の visibility 混在） |
| `apps/web/src/components/public/MemberDetail.tsx` | composing primitive（ProfileHero / MemberTags / MemberDetailSections / MemberActivity を組み立て） |
| `apps/web/playwright/tests/serial-06-member-detail.spec.ts` | API-backed public member detail の Playwright screenshot + DOM assertion |

### 編集

| Path | 変更 |
|------|------|
| `apps/web/app/(public)/members/[id]/page.tsx` | `PublicMemberProfileZ.parse` + `toMemberDetailProps` + `<MemberDetail />` 構成に refactor。`MemberLinks` / `MemberActivity` の直接利用を `MemberDetail` 内に統合 |

## adapter 設計

```ts
toMemberDetailProps(profile: PublicMemberProfile): MemberDetailProps
```

- visibility filter: `field.visibility !== "public"` を除外（UI 側二重防御 / 正本は API 側 `getPublicMemberProfileUseCase`）
- unknown kind: `FieldKindZ.safeParse` 失敗時は silent skip（production console 汚染なし）
- 空 section（filter 後 fields 0 件）は section 丸ごと除外
- 出力 field は `stableKey / label / value / kind` のみ（visibility / source は sanitize）
- pure function: 入力 mutate なし / I/O なし / logger 呼ばない

## composing primitive 設計

`MemberDetail` は adapter の `MemberDetailProps` を受けて以下を組み立てる:

1. `ProfileHero` — `memberId + summary` をフラット展開
2. `MemberTags` — `tags.length > 0` のときのみ描画
3. `MemberDetailSections` — sanitized section を legacy Section 型へ橋渡し（visibility="public" / source="forms" literal で復元）
4. `MemberActivity` — `attendance` を `key="activity"` の legacy Section へ橋渡しし、既存 primitive の section ベース API を維持

DOM contract:

- `[data-page="public-member-detail"]`
- `[data-member-id="..."]`
- `[data-section="..."]`（既存 `MemberDetailSections` 由来）
- `[data-stable-key="..."]`（同上）
- `[data-section="activity"]` / `[data-stable-key="attendance:{sessionId}"]`（既存 `MemberActivity` 由来）

既存 primitive の props を変更していない（NFR-04）。

## fixture

`samplePublicMemberProfile` は以下を含む:

| section | visibility 混在 | filter 後の期待 |
|---------|---------------|-----------------|
| basic | public | fullName / nickname が残る |
| contact | member | adapter で除外 |
| profile | public | location / occupation / 自己紹介 が残る |
| ubm | public | ubmZone / ubmMembershipType が残る |
| interests | public | hobbies が残る |
| consent | admin | section 丸ごと除外 |

stableKey は `STABLE_KEY` 定数経由（`scripts/lint-stablekey-literal.mjs` 不変条件）。

## テスト結果

```
$ pnpm vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts
 ✓ apps/web/src/lib/adapters/__tests__/member-detail.spec.ts (8 tests) 9ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

8 ケース全て green:

1. fixture は `PublicMemberProfileZ.parse` を通過する
2. happy path: summary / attendance / tags の伝播
3. visibility=member field 除外
4. visibility=admin section 丸ごと除外
5. unknown kind silent skip（他 field 保持）
6. 入力 mutate しない
7. publicSections 空 → sections === []
8. 出力 field に visibility / source キーが含まれない（sanitize）

## 品質ゲート

| ゲート | 結果 |
|--------|------|
| `pnpm --filter @ubm-hyogo/web typecheck` | ✅ exit 0 |
| `pnpm --filter @ubm-hyogo/web lint` | ✅ exit 0 |
| adapter unit spec（8 ケース） | ✅ 8 passed |
| Playwright serial-06 screenshot spec | ✅ 1 passed (`desktop-chromium`) |

## 仕様との差分・判断記録

### Phase 6 §3 Playwright visual spec の配置

Phase 6 で提示された `apps/web/tests/e2e/public-member-detail.spec.ts`（route mock 戦略）は、実リポジトリの Playwright topology に合わせて `apps/web/playwright/tests/serial-06-member-detail.spec.ts` として実装した。理由:

- 本プロジェクトの Playwright `testDir` は `apps/web/playwright/tests`（`apps/web/tests/e2e` ではない）
- Next.js Server Component で実行される `fetch` は Node ランタイム側で発生するため、Playwright の `page.route` は intercept できない（page.route はブラウザ初期化リクエストのみ対象）
- 既存 `apps/web/playwright/fixtures/auth.ts` の in-process mock API が SSR fetch に対応しているため、`mockApi` fixture 経由で `/public/members/sample-001` を返す形にした

取得済み evidence:

- `outputs/phase-11/screenshots/public-member-detail.png`
- `outputs/phase-11/dom-scrape-public-member-detail.txt`

production-equivalent runtime の 19-route visual regression は引き続き `serial-07-regression-evidence` の担当とするが、serial-06 自身の API-backed smoke screenshot は本サイクル内で取得済み。

### Phase 5 §0 precondition `apps/web/app/(public)/error.tsx` / `loading.tsx`

worktree 内に該当ファイルは未配置だが、Next.js は親階層 `apps/web/app/error.tsx` / `loading.tsx` を継承する。実害なし（既存 `(public)/members/[id]/page.tsx` も同条件で動作）。

### NormalizedField の sanitize と既存 primitive の型整合

adapter は `visibility` / `source` を出力から除外する（Phase 8 DoD-13 / 8 ケース表）。一方で既存 `MemberDetailSections` は strict zod Section 型を要求する（visibility / source 必須）。`MemberDetail` 内の `toLegacySections` で `visibility: "public" / source: "forms"` を literal で復元する形で橋渡しした。

これにより:

- adapter は spec 通り pure / sanitized
- 既存 primitive の props は変更なし（NFR-04 厳守）
- API 側の不変条件（visibility=public のみ public 返却）と整合

## 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-05-implementation-guide.md`
- `packages/shared/src/zod/viewmodel.ts` (`PublicMemberProfileZ`)
- `packages/shared/src/zod/primitives.ts` (`FieldKindZ`, `FieldVisibilityZ`)
- `apps/api/src/view-models/public/public-member-profile-view.ts`
