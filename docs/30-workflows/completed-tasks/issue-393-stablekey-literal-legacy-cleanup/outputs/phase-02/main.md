# Phase 2 — 設計

## 中核設計判断
正本 module `packages/shared/src/zod/field.ts` に新規 export `STABLE_KEY` 定数を追加する。
これは `FieldByStableKeyZ` のキー集合（31 件）と一致する `Record<StableKeyName, StableKeyName>` の as-const オブジェクト。

既存の branded type `StableKey`（`packages/shared/src/branded/index.ts`）と name collision を避けるため、定数は `STABLE_KEY`（SCREAMING_SNAKE_CASE）で命名する。

```ts
// packages/shared/src/zod/field.ts
export const STABLE_KEY = {
  fullName: "fullName",
  // ... 31 entries
} as const satisfies { readonly [K in StableKeyName]: K };
```

field.ts は ALLOW_LIST に含まれるため、本 const 内の literal は lint で flag されない。

## 各 family の置換方針

| family | files | 置換パターン |
|---|---|---|
| A | sheets-to-members.ts, sync-sheets-to-d1.ts | DB_FIELD_MAP / UPSERT_COLUMNS / ROW_FIELD_ORDER の各 entry を `STABLE_KEY.<key>` に置換。`col.key === STABLE_KEY.publicConsent` 比較も同様。 |
| B | _shared/builder.ts, publicMembers.ts | `answers["fullName"]` → `answers[STABLE_KEY.fullName]`。SQL template の `'ubmZone'` → `'${STABLE_KEY.ubmZone}'`。`ZONE_STABLE_KEY` 定数の RHS も置換。 |
| C | admin/members.ts, admin/requests.ts | `p["fullName"]` 系の bracket access、`PII_KEYS` Set 内の `"fullName"` を STABLE_KEY 参照へ。 |
| D | use-cases/list-public-members, view-models/public-member-list-view, public-member-profile-view | SUMMARY_KEYS 配列、Map.get 引数、FORBIDDEN_KEYS 配列、FIELD_TO_SUMMARY map key/value を STABLE_KEY 参照へ。 |
| E | profile/_components/RequestActionPanel.tsx, StatusSummary.tsx | 型 indexed access `T["rulesConsent"]` → `T[typeof STABLE_KEY.rulesConsent]`。 |
| F | components/public/MemberCard.tsx, ProfileHero.tsx | JSX attribute `data-role="nickname"` → `data-role={STABLE_KEY.nickname}`（runtime 値同一・CSS selector 互換）。 |
| G | utils/consent.ts | PUBLIC_CONSENT_KEY / RULES_CONSENT_KEY 定義および LEGACY_KEYS 配列の先頭要素を `STABLE_KEY.<key>` に置換。 |

## 関数シグネチャ・公開 API
すべて不変。runtime 文字列値も同一。型のみ literal type が STABLE_KEY 経由になる。
