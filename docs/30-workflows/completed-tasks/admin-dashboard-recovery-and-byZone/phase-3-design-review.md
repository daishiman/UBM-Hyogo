# Phase 3 — Design Review

[実装区分: 実装仕様書]

## 3.1 不変条件チェック

| # | 不変条件 | 本設計での維持確認 |
|---|----------|--------------------|
| CLAUDE.md #5 | D1 access は `apps/api` に閉じる | 既存 endpoint の response field 追加のみ。新 endpoint も新 D1 query 経路も増えない → **維持** |
| 親 workflow #1 | 既存 API endpoint surface のみ | endpoint URL 不変・response shape の optional field 追加のみ → **維持** |
| 親 workflow #2 | OKLch token 正本 | `var(--ubm-color-info\|accent\|ok\|bg)` のみ使用・HEX 0 件 → **維持**。token 未定義時は本 task で最小 alias を追加し、広域 token redesign はしない |
| 親 workflow #3 | プロトタイプ正本順位 | `pages-admin.jsx` L70-107 と Phase 2.3 の DOM 仕様を 1:1 対応付け済 → **維持** |
| CLAUDE.md #8 | test file は `*.spec.{ts,tsx}` のみ | Phase 4/6 の全 test ファイルは `.spec.{ts,tsx}` で命名 → **維持** |
| CLAUDE.md #11 (web env) | `apps/web` env は `lib/env.ts` 経由のみ | `server-fetch.ts` の `resolveApiBase` は `getEnv()` 経由 (H1/H3 修正でも `process.env.*` 直参照を新規追加しない) → **維持** |

## 3.2 後方互換性レビュー

- `AdminDashboardViewZ` の `byZone` は `.optional()` で追加するため:
  - 既存 fixture / snapshot / consumer (`AdminDashboardView` import 箇所) への影響 0。
  - `parseZoneSlices` が `undefined` を返し UI placeholder に degrade する経路があるため、API が一時的に未提供でも UI が割れない。
- `ZoneSlice` 型の loose 互換 (`{zone:string, count:number}`) は破棄するが、当該 shape を生成しているのは本 task で同時に書き換える server / mapper のみのため外部影響なし。

## 3.3 リスクと未確認事項の取り扱い

| 項目 | リスク | 取り扱い |
|------|--------|----------|
| 401 → 404 マスク | `safeServerFetch` の `normalizeError` で 401 が 404 として表面化する可能性 | Phase 5.1 で wrangler tail と unit test (T-B-05) で確定。確定前のコード修正は H1 (環境変数のみ) に限定 |
| `aggregatePublicZones` の raw value 多様性 | "0→1" / "0-1" / "0to1" のどれが staging D1 に入っているか未確定 | Phase 5.2 着手前に `bash scripts/cf.sh d1 --env staging --command "SELECT DISTINCT value_json FROM response_fields WHERE stable_key='ubm_zone'"` で確定し `outputs/phase-10/root-cause.md` に記録 |
| `--ubm-color-info/accent/ok/bg` 未定義 | tokens.css に未定義の場合 ZoneDistribution が無色に degrade | 本 task で最小 alias を追加する。Task E へ送るのは広域 visual baseline 更新のみで、token alias 欠落を未タスク化しない |

## 3.4 Gate (Phase 4 への進行条件)

- 3.1 / 3.2 / 3.3 の全項目が「維持 / 計画済」であること
- Phase 2.1 切り分け手順 (H1/H2/H3) と Phase 2.2 server / shared / UI 改修方針が単一責務原則に沿って分離されていること
- 採用方針が「方針 A」であり「方針 B」は明示的な fallback として位置付けられていること
