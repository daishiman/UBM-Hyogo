# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Task ID | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV |
| Phase  | 7 / 13（カバレッジ確認）                    |
| 依存   | Phase 4（テスト作成） / Phase 5（実装） / Phase 6（テスト拡充） |
| 成果物 | outputs/phase-7/phase-7.md                  |
| 計測方針 | **変更範囲のみ局所計測**（全体一律閾値の再判定はしない） |

## 1. このPhaseの責務

本タスクは env 参照経路の整流化であり、新規ロジックの追加は最小（`getAuthEnv()` 1 関数 +
`AuthEnvSchema` の partial pick + `auth.ts` の `env()` 合成変更）にとどまる。したがってカバレッジ確認も
**変更した関数・分岐だけを計測対象**として明示し、無関係な既存コードの行カバレッジ変動は判定に含めない
（FB: 全体一律でなく変更関数 / ブロックを明示）。

## 2. カバレッジ計測対象（局所指定）

### 2.1 対象ファイルと対象シンボル

| ファイル                       | 対象シンボル（変更行のみ）                                 | 計測する分岐                                                            |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/web/src/lib/env.ts`      | `getAuthEnv()`（新規）                                      | ① safeParse **success** 分岐 / ② safeParse **fail**（`{}` 返却）分岐 / ③ binding **有** 分岐（`API_SERVICE` 同梱）/ ④ binding **無** 分岐 |
| `apps/web/src/lib/env.ts`      | `AuthEnvSchema`（新規 pick + partial）                     | EnvSchema の google 系 4 key 追加に伴う pick 解決（型レベル。実行時は getAuthEnv 経由で計測） |
| `apps/web/src/lib/auth.ts`     | `env()`（合成式を `{ ...getAuthEnv(), ...globalEnv() }` に変更） | getAuthEnv 経由の合成と globalEnv override の後勝ち |

> `auth.ts` から削除される `cloudflareEnv()` / `processEnv()` / `definedEnv()`（processEnv 用途分）は
> **削除されるため計測対象外**。削除後に dead code として残らないことは Phase 8 で grep 確認する。
> `requestEnv()` / `globalEnv()` は本タスクで挙動を変えないため、既存カバレッジを維持すれば足り、
> 新規行カバレッジ目標の対象外とする。

### 2.2 計測対象外（変更行以外は対象外）

- `fetchSessionResolve()` 本体（staging log 分岐・fetch 経路）: 引数 `e: AuthEnv = env()` の **default 値式**だけが
  間接的に getAuthEnv を踏むが、関数本体ロジックは無変更。Phase 5/6 の既存テストで担保済みのため、本 Phase の
  新規計測目標には含めない。
- `buildAuthConfig()` / callbacks / `getAuth()`: 無変更。既存 green を維持確認するのみ。
- `getEnv()` / `getPublicEnv()` / `readRawEnv()`（env.ts 既存）: optional key 追加のみで分岐は不変。再計測不要。

## 3. カバレッジ取得コマンド（対象ファイル指定）

ルート `vitest.config.ts` の coverage 設定（provider=v8 / include=`apps/**/src/**/*.{ts,tsx}`）を利用し、
**`--coverage.include` を変更ファイルに絞って局所計測**する。

```bash
# 変更2ファイルのみを対象にした局所カバレッジ計測（targeted）
mise exec -- pnpm exec vitest run --root=. \
  apps/web/src/lib/auth.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  --coverage \
  --coverage.include="apps/web/src/lib/auth.ts" \
  --coverage.include="apps/web/src/lib/env.ts" \
  --coverage.reporter=text
```

> `--coverage.include` を 2 ファイルに絞ることで、無関係ファイルの行カバレッジが summary を希釈しないようにする。
> `env.spec.ts` は Phase 4 で新規作成済みである前提（`getAuthEnv()` の success/fail/binding 分岐を固定）。
> 未作成なら本 Phase は **判定不能（BLOCKED）** とし Phase 4 へ差し戻す。

text reporter で以下を確認:

```text
File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------|---------|----------|---------|---------|------------------
env.ts       |  ...    |   ...    |   ...   |   ...   | (getAuthEnv 周辺に未カバー行が無いこと)
auth.ts      |  ...    |   ...    |   ...   |   ...   | (env() 行が covered であること)
```

## 4. カバレッジ目標（変更行ベース）

| 指標                          | 目標                                  | 根拠                                                              |
| ----------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `getAuthEnv()` line           | 100%                                  | 全行が success/fail/binding の 4 分岐テストで踏まれる             |
| `getAuthEnv()` branch         | 100%（4 分岐すべて）                  | ①success ②fail(`{}`) ③binding 有 ④binding 無 を Phase 4 で固定    |
| `auth.ts` `env()` line        | 100%                                  | `default env()` 系テスト（auth.spec.ts L186-190 / L596-599）が踏む |
| 変更行（追加 / 改変行）の line | 100%                                  | env 経路は単純な合成・safeParse のみで未到達分岐を作らない設計     |
| 変更行以外                    | **対象外**（判定に含めない）          | 局所計測方針。既存コードの行カバレッジ変動は本タスクの DoD ではない |

> 全体 coverage 閾値（`coverage-guard.sh` / CI shard）は本タスクの判定基準にしない。本タスクは「変更行が
> 完全にテストで踏まれていること」のみを Phase 7 の合格条件とする。全体閾値は CI（`pre-push coverage-guard`）が
> `--changed` モードで別途判定する。

## 5. 分岐ごとの到達テスト対応（トレーサビリティ）

| 分岐                                   | 到達させるテスト（Phase 4/6 で固定）                                       |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `getAuthEnv()` safeParse success       | `env.spec.ts`「正常 env で全 9 string key を返す」                          |
| `getAuthEnv()` safeParse fail → `{}`   | `env.spec.ts`「不正 ENVIRONMENT（enum 外）で `{}` を返し throw しない」     |
| `getAuthEnv()` binding 有              | `env.spec.ts`「rawEnv に API_SERVICE があれば同梱して返す」                 |
| `getAuthEnv()` binding 無              | `env.spec.ts`「rawEnv に API_SERVICE が無ければ binding を含めない」        |
| `auth.ts` `env()` 合成（getAuthEnv経由）| `auth.spec.ts`「default env() で fetchSessionResolve を呼ぶ」（L186-190）   |
| `auth.ts` `env()` globalEnv 後勝ち     | `auth.spec.ts`「`__UBM_AUTH_ENV__` override が getAuthEnv より優先」（Phase 6 で追加想定） |

## 6. 完了条件（このPhaseの DoD）

- [ ] §3 の局所カバレッジコマンドを実行し、`getAuthEnv()` の line / branch が 100%
- [ ] `auth.ts` `env()` 行が covered（uncovered に出ない）
- [ ] §5 の 4 分岐すべてに対応テストが存在し green
- [ ] 変更行以外の行カバレッジ変動を判定に含めていない（局所計測方針を明記）
- [ ] `env.spec.ts` が存在し対象 4 分岐を固定している（未存在なら Phase 4 へ差し戻し）
