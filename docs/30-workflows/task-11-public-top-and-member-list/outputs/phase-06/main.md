# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

`/` と `/(public)/members` の異常系（API 失敗 / 不正 query / 0 件 / 巨大件数 / Zod 不一致）を網羅する。

## 実行タスク

- [ ] AB-01〜10 のシナリオを単体テスト or E2E or 手動チェックリストに割り当てる
- [ ] error injection 経路が production deploy で安全であることを確認する

## 参照資料

- Phase 4（テスト ID）/ Phase 5（実装手順）
- 一次原典 §11（リスク） / §4.1（状態マトリクス）

## 成果物

- `outputs/phase-06/main.md`

## 統合テスト連携

- 異常系は Vitest fetch mock と Playwright smoke の URL fuzz ケースに割り当てる。
- staging で再現できない API 500 は Phase 11 手動 smoke log に user-gated として記録する。

## 異常系シナリオ

| ID | シナリオ | 期待挙動 | 検証方法 |
| --- | --- | --- | --- |
| AB-01 | `/public/stats` が 500 | route segment error boundary（task-05 `error.tsx`）が活性化、`role=alert` UI 表示 | Playwright で API mock 500、または staging で意図的 throw |
| AB-02 | `/public/members` が 500 | 同上 | 同上 |
| AB-03 | `/public/members` が 404 | `FetchPublicNotFoundError` → `error.tsx` boundary | unit test TC-U-A-05 |
| AB-04 | `/public/members?q=zzz_no_match_zzz` で items=[] | EmptyState 表示、絞り込みクリア link が動作 | TC-E-05 |
| AB-05 | `density=invalid` URL 直接アクセス | comfy fallback、200 で render | TC-E-04 |
| AB-06 | `page=-1` / `page=999999` URL 直接アクセス | `parseSearchParams` で fallback、API 側で normalize | TC-U-S-05 + Playwright 任意 |
| AB-07 | `tag` を 100 個指定 | URL に全 tag が乗る、API 側で truncate or accept、UI は overflow scroll | 手動チェック（Phase 11） |
| AB-08 | API レスポンスに extra key 混入 | `XxxZ.parse()`（strict 定義済み schema） が ZodError throw、error boundary が catch | TC-U-A-02 |
| AB-09 | `lastSync.responseSync = null` | Stats は「未同期」表示、crash しない | TC-U-ST-03 |
| AB-10 | `recentMeetings = []` | Timeline が EmptyState を表示 | unit test（Timeline.test.tsx 任意） |

## エラー injection fixture

本 task では fixture route を新設しない。AB-01/02 の検証は次のいずれかで行う:

- **local**: vitest で fetch mock を 500 / 404 で返す
- **staging**: API 側が一時的に 500 を返す状態を再現できないため、Playwright での E2E は scope 外。Phase 11 で手動チェックリストに記載

## state マトリクス

| 状態 | 検出条件 | UI |
| --- | --- | --- |
| loading | Server Component 初回取得中（`loading.tsx`） | Skeleton（task-05 既存） |
| empty | `list.items.length === 0` | EmptyState（「該当なし」+ クリア link） |
| error | `fetchPublic` throw | `error.tsx` boundary（task-05）+ Sentry capture |
| success | items >= 1 | MemberGrid / MemberTable + pagination meta |

## URL 不正値の扱い

`parseSearchParams` は **throw しない**。すべての不正値は zod default に fallback する。これにより:

- 古い share URL が壊れない
- bot crawl による URL fuzz が error boundary を発火させない
- F5 で常に成功する

## 完了条件

- [ ] AB-01〜10 のうち AB-03/05/06/08/09 は自動テスト（unit / E2E）に reify
- [ ] AB-01/02/04/07/10 は手動チェックリスト or Phase 11 evidence で検証
- [ ] error injection fixture を新設しないことが決定されている（fetch mock で代替）
