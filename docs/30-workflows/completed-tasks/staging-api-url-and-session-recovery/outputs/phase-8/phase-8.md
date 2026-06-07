# Phase 8: リファクタリング

## 目的

Green を保ったまま、transport 選択の **重複排除**と localhost fallback 定数の**集約**を行う。
外部から見える挙動・シグネチャは不変（テストが緑のまま）。リファクタは本サイクル内で完結する（先送り禁止）。

## リファクタ対象テーブル（対象 / Before / After / 理由・RT-03）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| R1 | transport 選択ロジック | `public.ts` / `authed.ts` / 各 proxy / auth route が各々 `resolveApiBase()` + plain `fetch` の分岐を重複実装 | `transport.ts` の `resolveApiFetch` に**単一化**。各所はアクセサ + `resolveApiFetch` を呼ぶだけ | DRY。transport 選択を 1 箇所所有（Phase 1 §責務境界「混在禁止」） |
| R2 | localhost fallback リテラル | `authed.ts` / me route / admin route / auth route 3 本に `FALLBACK_INTERNAL_API="http://127.0.0.1:8787"` / `LOCAL_DEV_FALLBACK` が散在（5+ 箇所） | `transport.ts` の (d) 分岐 `http://localhost:8787` **1 箇所**に集約。public.ts は `LOCAL_FALLBACK_BASE_URL` 1 箇所 | 焼き込み箇所を最小化し grep gate allowlist を 2 箇所（transport.ts / public.ts / env.ts）に限定 |
| R3 | fallback ホスト表記 | `127.0.0.1:8787` と `localhost:8787` が混在 | **`localhost:8787` に統一** | Lane C grep gate / authed.spec の `127.0.0.1` 不在 grep と整合 |
| R4 | env runtime 判定 | `authed.ts` / admin route が `process.env["NODE_ENV"]` / `["ENVIRONMENT"]` を直接参照 | `getEnvironment()` / `getTransportRuntimeIsTest()` アクセサ経由 | 不変条件（`process.env.*` 直接禁止・env.ts 集約）。AC-5 |
| R5 | auth route 3 本の transport 選択 | 各 route に同型コードがコピペ | 各 route 内 local helper `selectTransport()`（共通モジュール化は任意） | 重複の局所化。Lane A スコープは「`resolveApiFetch` 経由」までで十分（task-a §3-4E） |
| R6 | service-binding URL 組み立て | 各所で host 文字列をハードコード | `SERVICE_BINDING_ORIGIN` 定数を transport.ts から export し共有 | URL parse 用ダミー host を 1 定義（public.ts:69 と同パターン） |

## リファクタ時の不変条件（Green 維持）

- `fetchAuthed` / 各 proxy / `verifyMagicLink` の**外部シグネチャは変更しない**（task-a §2-3）。内部 transport 選択のみ差替。
- `verify-magic-link.ts` の `input.apiBaseUrl` / `input.fetchImpl` override は既存 spec 互換のため**残す**（共通化で消さない）。
- `getAuthEnv` の戻り値型は壊さない（test runtime 判定は別ヘルパ `getTransportRuntimeIsTest`）。
- `PUBLIC_API_BASE_URL` は後方互換で残置（即削除しない＝drift 回避。削除は Phase 10 で未タスク候補として判定）。

## やらないリファクタ（スコープ外・明示）

- auth route 3 本の `selectTransport` を共通モジュール（例 `lib/fetch/select-server-transport.ts`）へ抽出: Lane A スコープ外。重複は 3 箇所で許容（task-a §3-4E 明記）。過剰抽象を避ける。
- `PublicFetchEnv` / `AuthEnv` の env schema 統合: drift リスクが高く本サイクルのコストを上げる（Phase 3 決定）。

## 検証

リファクタ後に Phase 4/6 の全対象 spec を再実行して Green を確認（Phase 9 で一括）。
挙動差分が出た場合はリファクタを巻き戻し、最小差分でやり直す。
