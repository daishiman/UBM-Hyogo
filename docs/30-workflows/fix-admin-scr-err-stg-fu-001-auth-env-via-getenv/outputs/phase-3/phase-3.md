# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

| 項目   | 値                                          |
| ------ | ------------------------------------------- |
| Phase  | 3 / 13（設計レビュー）                      |
| 依存   | Phase 2                                     |
| 成果物 | outputs/phase-3/phase-3.md                  |
| 判定   | **PASS（Phase 4 へ進行可）**                |

## 1. レビュー観点と判定

| 観点               | 判定 | 根拠                                                                                              |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------- |
| 責務境界           | PASS | env 読み取りロジックが `env.ts` に単一所有される。auth.ts は「読む」だけになる                     |
| 依存関係           | PASS | `auth.ts → env.ts` の単方向依存。循環なし。`session.ts → auth.ts` の公開 surface は不変            |
| 状態所有権         | PASS | state machine なし。memo（authRuntimePromise）不変                                                 |
| invariant #5（D1） | PASS | auth.ts は引き続き fetch 経由のみ。D1 直接アクセスなし                                             |
| invariant #11      | PASS | safeParse partial により env 不在時も throw せず `unregistered` を返す（fail-closed 維持）         |
| env アクセス不変条件 | PASS | `getCloudflareContext` / `process.env` 直接参照が auth.ts から消える（AC-1/AC-2）                |
| 既存テスト互換     | PASS | §3 で詳細確認                                                                                      |
| 1 cycle 完了性     | PASS | 変更は 3 ファイル。先送り要素なし（CONST_007 充足）                                                |

## 2. issue #862 字義からの deviation 記録（重要）

| issue 記述                                         | 本設計の対応                                                                 | 根拠                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 「全 env 参照が `getEnv()` 戻り値経由」（AC-3）     | `getEnv()` ではなく env.ts の `getAuthEnv()` 経由へ再解釈                     | `getEnv()` は throw 設計で auth の fail-closed と非互換。env モジュール経由という不変条件の本質は満たす |
| 「zod parse 失敗時の throw を error boundary に伝播させる設計を維持」（issue 2.1 / 5節） | auth 境界は safeParse（throw しない）。throw は data-fetch 境界（server-fetch.ts, getEnv）に閉じる | invariant #11（fail-closed）が認証境界では優先。全ユーザーを unregistered 扱いにする方が、認証境界での crash より安全 |
| 対象パス `apps/web/src/auth.ts`                    | `apps/web/src/lib/auth.ts`                                                    | 実体パス。issue 作成後のディレクトリ構成に追従                       |

> この deviation は「issue が古い／字義どおりだと現行設計と衝突する」ことへの最適化であり、ユーザー指示
> （「最新のコードを確認したうえで issue を現在のコードに最適化して根本的な問題を解決」）に合致する。
> Phase 12 の system-spec-update-summary にも記録する。

## 3. 既存テスト互換性の事前検証（auth.spec.ts）

| テスト                                               | 現状の前提                                  | 設計変更後の挙動                                                            | 判定 |
| ---------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| `fetchSessionResolve` に明示 `AuthEnv` を渡す全ケース | `env()` を経由しない                        | 影響なし（引数優先）                                                        | PASS |
| `default env() で fetchSessionResolve を呼ぶ`（186-190） | mock cloudflareEnv = `{}` → env() = `{}` → unregistered | `getAuthEnv()` → `readRawEnv()`（mock の `{env:{}}`）→ safeParse(`{}`) = `{}` → unregistered | PASS |
| `env / fetchImpl 全部 default で呼ぶ`（596-599）       | env() helper 経由で provider factory throw  | `getAuthEnv()` 経由でも `{}` 返却 → provider factory が throw（変更なし）   | PASS |
| `buildAuthConfig` callbacks 各種                      | 明示 env 引数                               | 影響なし                                                                   | PASS |

> mock は `vi.mock("@opennextjs/cloudflare", ...)` で `getCloudflareContext` を差し替える。env.ts が
> `getCloudflareContext` を import するため、mock は引き続き有効。auth.ts が import しなくなっても、
> 実際の解決経路（env.ts）に mock が効くため `default env()` 系テストは green を維持する。
> **要対応**: `readRawEnv()` は cloudflare context が `undefined` を投げず object（`{env:{}}`）を返す mock 形なので
> `readCloudflareEnv()` は `{}` を返す。これは Phase 4 で env mock を明示確認する。

## 4. リスクと緩和策

| リスク                                                          | 緩和策                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `AuthEnvSchema.pick` 対象 key の typo で取りこぼし                | Phase 4 で `getAuthEnv()` が全 9 string key を返すことを test で固定          |
| `API_SERVICE` binding が safeParse で落ちる                      | binding は schema 外。`getAuthEnv()` が rawEnv から別途同梱（§2.2 設計）      |
| `ENVIRONMENT` enum 不一致で safeParse 全体 fail → 他 key も欠落  | `.partial()` でも enum 値検証は残る。fail 時 `{}` 返却で fail-closed（許容）。Phase 4 で「不正 ENVIRONMENT → 空」test を追加 |
| 既存 `getEnv()` 呼び出し側（server-fetch 等）への波及            | EnvSchema は optional 追加のみ。既存 required 項目不変 → 波及なし             |

## 5. 完了条件（このPhaseの DoD）

- [x] 責務境界・依存・invariant の整合を確認し PASS 判定
- [x] issue 字義からの deviation を根拠付きで記録
- [x] 既存 auth.spec.ts 全 4 系統の互換性を事前検証
- [x] リスクと緩和策を Phase 4 へ申し送り
