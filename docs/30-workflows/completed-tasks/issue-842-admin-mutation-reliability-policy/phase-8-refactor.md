# Phase 8: リファクタリング

> GREEN 達成後の内部品質改善。外部シグネチャ（Phase 2 §2 / §3）・テスト期待値を変えない範囲で行う。
> 過剰抽出は避ける（CONST_007）。callsite が増えるまで helper 化しない方針を明記する。

## 1. 適用するリファクタ

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `trigger` の success 処理（`useAdminMutation.ts`）| Phase 2 §4 の通り、success 処理（`onSuccess` 呼出 → `refreshOnSuccess !== false` で `router.refresh()` → `successMessage` 解決 → `toast`）が **mutationFn 経路（§4 `if options.mutationFn`）** と **fetch 経路（§4 `res.json()` 後）** で重複している（現コード L80-89 と L104-111 が同一構造）| 共通 helper `applySuccess(data: T): Promise<void>` に抽出し両経路から呼ぶ。404 success-relaxation 経路（Phase 2 §4 `treat404AsSuccess`）も `applySuccess(undefined as T)` を再利用 | DRY。success 処理は **3 callsite**（mutationFn / fetch / 404-relaxation）に増えるため抽出 benefit が abstraction cost を上回る。toast / refresh / successMessage 解決のロジック分岐を 1 か所に集約し、片側だけ修正される drift を防ぐ |
| 補助関数の配置（`useAdminMutation.ts`）| Phase 2 §4 で定義した `isIdempotent` / `shouldRetry` / `backoffMs` / `resolveIdempotencyKey` と定数 `DEFAULT_TIMEOUT_MS` / `DEFAULT_BASE_DELAY_MS` / `DEFAULT_MAX_DELAY_MS` | これらを **ファイル先頭の module-level 定数・純関数**として配置（既存の `extractErrorMessage` / `resolveCurrentPath` / `defaultRedirector` と同じ層）。hook 本体の外に置き再生成を防ぐ | hook 内クロージャに閉じる必要がない純関数のため、毎レンダーの再生成を避ける。既存の同ファイル helper（L28-47）と配置を揃え一貫性を保つ |
| JSDoc 整備（`useAdminMutation.ts` / `useConfirmDialog.ts`）| 新規 option（`timeoutMs` / `idempotencyKey` / `treat404AsSuccess` / `retry` / `onCancelMutation`）の意味・既定値・非適用条件がコードから自明でない | Phase 2 §2 / §5 / §8 の決め打ち（既定 10000ms、mutationFn 経路は timeout/retry 非適用、404 silent 戻り値 `undefined as T`、AbortError は silent）を JSDoc で各 option / 型に付与（AC-1）| AC-1 が「型定義 + JSDoc を揃える」を要求。Phase 3 §4 リスク表「mutationFn 経路で timeout 期待が裏切られる」の対処として JSDoc 明記が設計上の合意 |

## 2. 抽出しない（過剰抽出回避）

| 候補 | 見送り理由 |
|---|---|
| retry loop 全体の独立 hook / util への切り出し（`useRetryableFetch` 等） | callsite は `useAdminMutation` の `trigger` 内 1 か所のみ。fetch / timeout / abort / 404 policy と密結合しており、切り出すと引数が肥大して可読性が下がる。再利用先が現れるまで `trigger` 内に保持 |
| error 分岐（AuthRequired / FetchAuthed / その他）の helper 化 | 既存コード（L116-128）のままで Phase 2 §4 catch 節と整合。本サイクルで挙動変更がなく、リファクタ範囲を最小に保つ |
| `Treat404AsSuccess` の解釈分岐を独立関数化 | 404 success-relaxation は `trigger` 内 1 箇所のみ。`applySuccess` 再利用で重複は既に解消されるため、追加抽出は callsite が増えるまで保留 |
| `useConfirmDialog` の `closeConfirm` ロジックの汎用化 | submit 中 close / 非 submit close の 2 分岐は 1 関数内で完結。抽出する単位がない |

> 方針: いずれも「現時点で抽出する benefit がない」判断であり CONST_007 の単なる先送りではない。callsite が 3 以上に増えた時点で再検討する。

## 3. リファクタ後の不変条件確認

- 外部シグネチャ（Phase 2 §2 型 / §3 overload）は不変。`applySuccess` は private（export しない）
- Phase 7 §2 の branch 踏破表（#1〜#16）に影響なし。リファクタ後も同テストが GREEN
- 後方互換（Phase 2 §7）維持。既存 caller の挙動は timeout=10s 新規適用以外変わらない

## 4. DoD（Phase 8 完了条件）

- [ ] `applySuccess` 抽出で mutationFn / fetch / 404-relaxation の 3 経路の success 処理重複を解消
- [ ] 補助関数（`isIdempotent` / `shouldRetry` / `backoffMs` / `resolveIdempotencyKey`）と定数を module-level に配置
- [ ] 新規 option / 型に JSDoc を付与（AC-1：型定義 + JSDoc を揃える）
- [ ] 過剰抽出を回避した項目を §2 に理由付きで記録
- [ ] リファクタ後も Phase 6 / Phase 7 のテストが GREEN（外部シグネチャ・期待値不変）
