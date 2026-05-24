# Phase 11 — Evidence Inventory

実行サイクル: serial-06-form-response-binding 実装完了時点

## E-01: adapter unit spec 結果

```
$ pnpm vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts
 ✓ apps/web/src/lib/adapters/__tests__/member-detail.spec.ts (8 tests) 9ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

8 ケース全て pass:

1. fixture は `PublicMemberProfileZ.parse` を通過する
2. happy path: summary / attendance / tags の伝播
3. visibility=member field 除外
4. visibility=admin section 丸ごと除外
5. unknown kind silent skip
6. immutability（入力 mutate しない）
7. publicSections 空 → sections === []
8. sanitize（visibility / source 出力に含まれない）

## E-02: typecheck

```
$ pnpm --filter @ubm-hyogo/web typecheck
> tsc -p tsconfig.json --noEmit
(exit 0)
```

## E-03: lint

```
$ pnpm --filter @ubm-hyogo/web lint
> tsc -p tsconfig.json --noEmit && eslint 'src/**/*.{ts,tsx}'
(exit 0)
```

## E-04: 実コード変更 (git diff --stat 抜粋)

```
 apps/web/app/(public)/members/[id]/page.tsx                            | +44 / -49
 apps/web/src/components/public/MemberDetail.tsx                        | new (+85)
 apps/web/src/fixtures/public-member-profile.ts                         | new (+150)
 apps/web/src/lib/adapters/member-detail.ts                             | new (+70)
 apps/web/src/lib/adapters/__tests__/member-detail.spec.ts              | new (+76)
```

## E-05: visibility filter DOM contract

`MemberDetail` composing primitive により、以下の DOM contract が成立する:

- `[data-page="public-member-detail"]`
- `[data-member-id]`
- 既存 `MemberDetailSections` 由来の `[data-section]` / `[data-stable-key]`

API 側の `getPublicMemberProfileUseCase` が visibility filter 正本のため、production runtime で member/admin visibility の field が DOM に現れることはない。UI 側 adapter は二重防御として動作する。

## E-06: Playwright visual snapshot

本サイクル内で取得済み。

```
$ pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/serial-06-member-detail.spec.ts --project=desktop-chromium
  ✓  1 [desktop-chromium] › playwright/tests/serial-06-member-detail.spec.ts › serial-06 public member detail binding › renders API-backed public fields and captures Phase 11 screenshot
  1 passed
```

生成ファイル:

- `outputs/phase-11/screenshots/public-member-detail.png`
- `outputs/phase-11/dom-scrape-public-member-detail.txt`

production-equivalent 19-route visual regression は `serial-07-regression-evidence` の担当として継続。

## E-07: unknown kind silent skip 検証

adapter unit spec ケース 5 で確認済み。`structuredClone(fixture)` の `fullName` field の `kind` を `"unknown_kind_xyz"` に書き換えた状態で `toMemberDetailProps` を実行し:

- `fullName` field は出力 sections から消える
- 同セクション内の `nickname` field（kind 正常）は保持される
- console.error / console.warn 出力なし
- throw なし
