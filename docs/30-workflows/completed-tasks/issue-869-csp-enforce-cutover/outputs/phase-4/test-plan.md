# Phase 4: テスト計画

## テストケース一覧

### unit テスト（`apps/web/src/lib/env.spec.ts`）

| TC | 対象関数 | 種別 | 入力（rawEnv） | 期待結果 |
|----|---------|------|----------------|---------|
| TC-01 | `getSecurityHeaderEnv` | unit | `CSP_MODE` 未設定（`{}` またはキーなし） | `cspMode === "report-only"`（デフォルト動作） |
| TC-02 | `getSecurityHeaderEnv` | unit | `{ CSP_MODE: "enforce", NEXT_PUBLIC_API_BASE_URL: "https://api.example.com" }` | `cspMode === "enforce"` |
| TC-03 | `getSecurityHeaderEnv` | unit | `{ CSP_MODE: "report-only", NEXT_PUBLIC_API_BASE_URL: "https://api.example.com" }` | `apiBaseUrl === "https://api.example.com"` |
| TC-04 | `getSecurityHeaderEnv` | unit | `{ CSP_MODE: "block", NEXT_PUBLIC_API_BASE_URL: "https://api.example.com" }` | zod `ZodError` が throw される |

### smoke テスト（`apps/web/playwright/tests/security-headers.spec.ts`）

| TC | 操作 | 種別 | 入力（env） | 期待結果 |
|----|------|------|------------|---------|
| TC-05 | `GET /`（または任意 route） | smoke | `CSP_MODE=enforce` を注入 | `content-security-policy` ヘッダが定義済み |
| TC-06 | `GET /`（または任意 route） | smoke | `CSP_MODE` 未設定（ローカル CI デフォルト） | `content-security-policy-report-only` ヘッダが定義済み |
| TC-07 | `GET /`（または任意 route） | smoke | `CSP_MODE=enforce` を注入 | `content-security-policy-report-only` ヘッダが **absent**（`toBeUndefined()`） |
| TC-08 | `GET /`（または任意 route） | smoke | `CSP_MODE=enforce` を注入 | `content-security-policy` ヘッダの値に `NEXT_PUBLIC_API_BASE_URL` の値が含まれる（connect-src 確認） |

> TC-06 の逆パターン（enforce が absent）はローカル CI で `content-security-policy` が absent であることを確認済みの設計だが、明示的に assert を追加することを推奨する。

## テスト配置先

| TC | ファイル | 備考 |
|----|---------|------|
| TC-01〜TC-04 | `apps/web/src/lib/env.spec.ts` | 既存ファイルがあれば追記、なければ新規作成 |
| TC-05〜TC-08 | `apps/web/playwright/tests/security-headers.spec.ts` | 既存 smoke テストを mode-dynamic に改修 |

## 既存テストの回帰ガード

| ファイル | テストケース | 役割 |
|---------|-------------|------|
| `apps/web/src/lib/security-headers.spec.ts` | `builds enforce CSP when requested` | lib API 不変の回帰ガード。本タスクで変更しない |
| `apps/web/src/lib/security-headers.spec.ts` | report-only 系 TC-01〜TC-08（既存） | lib の出力仕様が変わっていないことを継続確認 |

> 上記テストは本タスクのコード変更後も引き続き PASS することを確認する（lib API 変更禁止の担保）。

## RED → GREEN 方針

1. **RED 確認**: `getSecurityHeaderEnv` が未実装の状態で TC-01〜TC-04 が fail することを確認する
2. **env.ts 実装**: `CSP_MODE` schema 追加 + `getSecurityHeaderEnv()` 実装 → TC-01〜TC-04 GREEN
3. **middleware 配線**: `buildSecurityHeaderConfig()` を `getSecurityHeaderEnv()` 経由に差し替え → 既存 smoke テストが PASS し続けることを確認（TC-06 相当）
4. **wrangler.toml 設定**: 3 環境に `CSP_MODE` を追加
5. **smoke テスト改修**: ヘッダ名動的解決 + absent assert 追加 → `CSP_MODE=enforce` 注入で TC-05/TC-07/TC-08 GREEN
6. **全テスト GREEN**: `pnpm --filter web test` + playwright smoke（ローカル）が全件 PASS

## 実行コマンド

```bash
# unit テスト（env.spec.ts + security-headers.spec.ts）
mise exec -- pnpm --filter web test

# Playwright smoke（report-only モード、デフォルト）
mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# Playwright smoke（enforce モード）
CSP_MODE=enforce mise exec -- pnpm --filter web exec playwright test playwright/tests/security-headers.spec.ts

# 型チェック
mise exec -- pnpm typecheck

# リント
mise exec -- pnpm lint

# ビルド
mise exec -- pnpm build
```

## 備考

- 全テストは **公開関数**（`getSecurityHeaderEnv`、`buildSecurityHeaders`、`applySecurityHeaders`）のみを対象とする。private / internal 関数の直接テストは行わない
- `rawEnv` 引数注入パターンにより、テスト環境への `process.env` モンキーパッチは不要
- Playwright テストの `process.env.CSP_MODE` は playwright 実行プロセスの環境変数を参照する（edge runtime の env とは別）。ローカル CI では未注入 → report-only が既存挙動として維持される
