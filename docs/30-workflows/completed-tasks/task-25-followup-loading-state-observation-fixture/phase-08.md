# Phase 8: リファクタリング

`[実装区分: 実装仕様書]`

## 目的

Phase 5 完了時点で `smokeFixtureEnabled()` が `__smoke__/error-boundary/page.tsx` / `__smoke__/members-list/page.tsx` / `__smoke__/loading-state/page.tsx` の 3 箇所に複製される可能性がある。共通化の要否を判定し、必要なら 1 箇所に集約する。

## リファクタ判断基準

| 条件 | 判定 |
|------|------|
| 3 箇所で完全に同一実装か | YES → 集約候補 |
| 共通化に伴うインポート経路の変更で他テスト/build に影響しないか | YES の場合に集約実施 |
| 既存ファイルの責務（page.tsx）に共通 util の export が混ざる | 避けるため別ファイル化 |

## 変更対象ファイル

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/__smoke__/_lib/fixture-guard.ts` | 新規 | `export function smokeFixtureEnabled(): boolean` を集約 |
| `apps/web/app/__smoke__/error-boundary/page.tsx` | 編集 | 既存ローカル関数を削除し import に置換 |
| `apps/web/app/__smoke__/members-list/page.tsx` | 編集 | 同上 |
| `apps/web/app/__smoke__/loading-state/page.tsx` | 編集 | Phase 5 で追加したローカル関数を削除し import に置換 |

注: Next.js App Router において `_lib` prefix は route として認識されないため、ディレクトリ命名規約上安全。代替として `apps/web/src/lib/staging-smoke.ts` への配置も可能。Phase 5 実装者の判断で決めるが、`__smoke__` 配下でクローズすることを推奨。

## 集約後の signature

```ts
// apps/web/app/__smoke__/_lib/fixture-guard.ts
import { readRawEnv } from "../../../src/lib/env";

export function smokeFixtureEnabled(): boolean {
  const env = readRawEnv();
  return env["ENABLE_STAGING_SMOKE_FIXTURE"] === "1" && env["ENVIRONMENT"] !== "production";
}
```

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts
```

## リファクタを行わない選択肢

3 箇所複製のまま残してよい条件:
- 集約が build / typecheck で予期せぬ影響を出す
- レビュー時間と diff 量のトレードオフで集約コストが見合わない

その場合は本 Phase の DoD を「複製を許容する旨を Phase 12 implementation-guide に追記」に置換する。

## DoD（Phase 8）

- 集約実施の場合: 3 箇所の `smokeFixtureEnabled` ローカル定義が削除され、import 経由になる。全テスト pass。
- 集約見送りの場合: implementation-guide に複製許容の根拠が記録される。
