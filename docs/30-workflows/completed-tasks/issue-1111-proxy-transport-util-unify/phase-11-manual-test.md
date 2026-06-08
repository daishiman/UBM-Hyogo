# Phase 11 — 手動テスト

## NON_VISUAL 宣言（WEEKGRD-03）

| 項目 | 内容 |
| --- | --- |
| タスク種別 | refactoring（pure refactor・内部抽出） |
| 視覚区分 | **NON_VISUAL** |
| 非視覚的理由 | UI/UX 変更がゼロ。transport 選択（binding 優先 → HTTP fallback）の制御構造を共通 util へ抽出する内部リファクタのみで、レンダリング結果・画面遷移・スタイル・文言に一切影響しない |
| 代替証跡 | focused vitest（util spec `transport-select.spec.ts` + 回帰 5 spec）+ `pnpm --filter @ubm-hyogo/web typecheck` + `pnpm --filter @ubm-hyogo/web lint` + 焼き込み grep |
| スクリーンショット | **作成しない**（下記 §3） |

## 1. スクリーンショットを作らない理由（Feedback 4）

- 描画される UI コンポーネント・画面・スタイルの差分が存在しない（transport 層の内部関数抽出のみ）。
- 外部観測挙動（API 応答・ログ・エラー境界）は phase-10 §2 で不変が確定しており、画面で確認すべき視覚差分が無い。
- 証跡は自動テストの PASS/FAIL（決定的）で十分に担保され、スクリーンショットは情報を追加しない。
- したがって `screenshots/.gitkeep` も作成しない（NON_VISUAL の証跡規約）。

## 2. 証跡の主ソース（自動テスト名 / 件数）

| 証跡 | テスト / コマンド | 役割 |
| --- | --- | --- |
| util 単体 | `apps/web/src/lib/fetch/transport-select.spec.ts`（新規） | `resolveServiceBinding`（disable true/false）/ `selectAndFetch`（binding 経路・http-fallback 経路・base-unavailable 経路・log opt-in 有無）/ `stripTrailingSlash` を分岐網羅（AC-6） |
| 回帰: route | `apps/web/app/api/admin/[...path]/route.spec.ts` | admin proxy の binding/fallback/500 base-unavailable 不変 |
| 回帰: server-fetch binding | `apps/web/src/lib/admin/server-fetch.binding.spec.ts` | binding 経路 + fixture 無効化不変 |
| 回帰: server-fetch http-fallback | `apps/web/src/lib/admin/server-fetch.http-fallback.spec.ts` | HTTP fallback + 404/エラー後処理不変 |
| 回帰: server-fetch env | `apps/web/src/lib/admin/server-fetch.env.spec.ts` | env アクセサ経由の base 解決不変 |
| 回帰: public | `apps/web/src/lib/fetch/public.spec.ts` | public read の binding/fallback + PLAYWRIGHT cache bypass 不変 |
| 静的 | `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web lint` / 焼き込み grep（phase-09 §1 #9-11） | 型・lint・127.0.0.1 焼き込み 0 / process.env 直参照 0 |

→ 主証跡 = util spec + 回帰 5 spec の全 PASS（phase-09 §1 で機械判定）。

## 3. 手動 runtime（staging proxy 疎通）の扱い

- staging proxy 疎通（admin/public ルートの実 transport 経路確認）は **user-gated**。本ローカル実装フェーズでは**実施しない**。
- 実施タイミング: user 明示承認後（deploy 後）。承認なしに staging deploy・runtime 疎通は行わない。
- pure refactor で外部観測挙動が不変（phase-10 §2）のため、緑の自動テスト群が staging 疎通の事前担保として機能する。
