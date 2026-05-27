# Phase 8: リファクタ

> 実装区分: **実装仕様書**

## 1. 本タスクでのリファクタ範囲

**なし**。

理由: 既存 `MagicLinkRequestError` 階層を継承して `MagicLinkRateLimitedError` を 1 つ追加するだけの最小追加。既存 cooldown timer (`useEffect` + `setInterval`) はそのまま再利用するため、共通化や抽出も不要。

## 2. 検討したが見送った項目

| 項目 | 見送り理由 |
|---|---|
| `Retry-After` ヘッダー解析の共通 util 化（`apps/web/src/lib/http/retry-after.ts` への抽出） | 現状 callsite 1 件（magic-link-client.ts）。`CONST_007` の意味では「先送り」ではなく「現時点で抽出する benefit がない」判断。callsite が 2 以上に増えた時点で再評価 |
| `MagicLinkRateLimitedError` を全 fetch helper の共通 typed error に昇格 | scope 過大。本タスクは magic-link 経路だけに閉じる。429 を意味のある typed error にしたい他 endpoint は別タスクで扱う |
| cooldown 状態を Context / Reducer に外出し | 現状 1 component の local state で十分。並行リクエスト発生時のみ要検討 |
| reload を跨いだ cooldown 永続化（localStorage / cookie） | AC 明記の scope 外（session 内のみ） |

## 3. リファクタを将来扱う場合の入口

- Retry-After util 共通化: `apps/web/src/lib/http/retry-after.ts` への抽出。signature `parseRetryAfterSec(headers: Headers, body?: unknown, defaultSec?: number): number`
- 永続化対応: cooldown 残時間と起点 timestamp を `sessionStorage` に保存し、mount 時に復元。Tab close で消えるため privacy 影響なし
