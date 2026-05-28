# Phase 8 — Refactor

[実装区分: 実装仕様書]

## 8.1 配置設計

- `apps/api/src/routes/admin/_shared/byZone.ts` を `_shared` に置くことで、将来 attendance route 等から再利用可能な形にしておく。ただし本 task では reuse を強制しない (YAGNI)。
- `ZoneSlice` 型は web 側 `apps/web/src/lib/admin/admin-dashboard-ui.ts` 内に閉じ、`zone-keys.ts` への切り出しは行わない (本 task の単一責務外。将来 i18n / 区画追加要件が発生したら別 task で検討)。

## 8.2 重複・dead code の排除

- 既存 `ZoneDistribution.tsx` の linear-gradient 塗り分けロジック・関連 helper は **本 task で削除**。後方互換目的の残置はしない。
- `admin-dashboard-ui.ts` の旧 `{zone:string, count:number}` 互換 parse 経路は削除し、新 shape のみ受け付ける (YAGNI / CONST_005 後方互換不要 — server / mapper は同 PR 内で同時改修)。

## 8.3 命名・スタイル整流化

- bucket 関数名は `buildByZoneSlices` で統一 (動詞 `build` + canonical key `ByZone` + 結果 `Slices`)。
- `ByZoneKey` / `ByZoneSlice` / `ZoneSlice` の語彙は **api と web で揃える**。差し替え時は server `ByZoneSlice` を shared zod の `infer` から派生させても可。

## 8.4 やらないこと (refactor scope creep 防止)

- `apps/api/src/routes/admin/dashboard.ts` の他 metric (KPI / byStatus) は変更しない。
- `safeServerFetch` の `normalizeError` 関数 signature は **変更しない**。H2 確定時も cookie 転送経路の修正に留める。
- tokens.css の広域 redesign は本 task で実施しない。ただし `ZoneDistribution` が直接参照する `--ubm-color-info` / `--ubm-color-accent` / `--ubm-color-ok` / `--ubm-color-bg` alias が未定義なら、本 task の実装差分として最小追加する。
- `Chip` primitive の新規作成は Task A の責務。本 task では既存 primitive を流用 / 不在時は `<span>` 代替で bridge。
