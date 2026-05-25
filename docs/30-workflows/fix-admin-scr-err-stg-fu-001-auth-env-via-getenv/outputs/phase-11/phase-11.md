# Phase 11: 手動テスト（NON_VISUAL）

[実装区分: 実装仕様書]

| 項目           | 値                                                                        |
| -------------- | ------------------------------------------------------------------------- |
| Task ID        | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV                                |
| Phase          | 11 / 13（手動テスト）                                                     |
| 依存           | Phase 10                                                                   |
| 成果物         | outputs/phase-11/phase-11.md                                              |
| 評価モード     | **NON_VISUAL**                                                            |
| 証跡の主ソース | 自動テスト（auth.spec.ts 40 ケース + env.spec.ts 17 ケース + public.spec.ts 18 ケース）+ AC grep gate + AC-7 runtime smoke（user-gated） |

## NON_VISUAL 宣言

| 項目             | 内容                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **タスク種別**   | NON_VISUAL implementation task（runtime / 設定境界の整流化）                                                                  |
| **非視覚的理由** | 本タスクの変更は `apps/web/src/lib/auth.ts` / `apps/web/src/lib/fetch/public.ts` の env 参照経路を `env.ts` の公開アクセサ経由へ統一し、`EnvSchema` に google 系 4 key を追加するもの。**UI コンポーネント・スタイル・レイアウト・文言・導線のいずれも変更しない**。レンダリング結果（DOM / 視覚表示）は変更前後で完全に同一であり、スクリーンショット差分での検証対象が存在しない。 |
| **代替証跡**     | ① 自動テスト（`auth.spec.ts` 40 ケース + `__tests__/env.spec.ts` 17 ケース + `fetch/public.spec.ts` 18 ケース）の green、② AC-1 / AC-2 / AC-5 grep gate（直接参照 0 件）の出力、③ AC-7 runtime smoke（staging `/login` → OAuth/Magic Link → `/admin`・user-gated）。 |

> **スクリーンショット不要の明記**: 本タスクは UI/UX 変更がないため **Phase 11 スクリーンショットは不要**。
> `screenshots/` ディレクトリは使用しない（`screenshots/.gitkeep` が存在する場合は削除対象）。
> 視覚証跡の代わりに、上記「代替証跡」を本 Phase の正本証跡とする。

## 1. 代替証跡 A: 自動テスト

以下を実行済み。結果は `outputs/phase-11/manual-test-result.md` にも記録する。

### 1.1 対象テストファイルと現状件数

| テストファイル                      | 現状件数                | 役割                                                                 |
| ----------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| `apps/web/src/lib/auth.spec.ts`     | 40 ケース（PASS）       | auth 境界の挙動回帰（fail-closed / provider / callbacks / getAuth）  |
| `apps/web/src/lib/__tests__/env.spec.ts` | 17 ケース（PASS）  | `getAuthEnv()` / `getPublicFetchEnv()` の env.ts 集約挙動 |
| `apps/web/src/lib/fetch/public.spec.ts` | 18 ケース（PASS） | public fetch の service-binding / HTTP fallback 回帰 |

### 1.2 実行コマンドと期待結果

```bash
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/auth.spec.ts apps/web/src/lib/__tests__/env.spec.ts apps/web/src/lib/fetch/public.spec.ts
```

| 検証観点                                                       | 対応テスト（auth.spec.ts 行）                  | 期待                            | 結果 |
| -------------------------------------------------------------- | ---------------------------------------------- | ------------------------------- | -------------------- |
| AC-9 fail-closed: baseUrl/secret 未設定で unregistered          | auth.spec.ts                                    | green（unregistered 返却）      | PASS |
| AC-9 graceful: `default env()` 経由（mock cloudflare `{}`）     | auth.spec.ts                                    | green（throw せず unregistered / provider throw） | PASS |
| non-ok / fetch throw fallback                                   | auth.spec.ts                                    | green                           | PASS |
| API_SERVICE binding 優先（getAuthEnv 同梱経路）                 | auth.spec.ts / public.spec.ts                   | green（binding.fetch 採用）     | PASS |
| google creds 優先順（GOOGLE_* → AUTH_GOOGLE_*）                 | auth.spec.ts                                    | green                           | PASS |
| getAuthEnv safeParse partial                                    | __tests__/env.spec.ts                           | green（全 auth key 返却 / 不正 enum で `{}`） | PASS |
| getPublicFetchEnv 経由の public fetch 挙動                       | fetch/public.spec.ts                            | green（service-binding / fallback regression） | PASS |

## 2. 代替証跡 B: AC grep gate

```bash
# AC-1: process.env 直接参照 0 件
grep -n "process\.env" apps/web/src/lib/auth.ts || echo "AC-1 PASS: no process.env"
# AC-2: getCloudflareContext 直接参照 0 件
grep -n "getCloudflareContext" apps/web/src/lib/auth.ts || echo "AC-2 PASS: no getCloudflareContext"
# AC-5: public fetch env 直接参照 0 件
grep -nE "process\.env|getCloudflareContext" apps/web/src/lib/fetch/public.ts || echo "AC-5 PASS: public fetch env access via env.ts"
```

| gate | 期待結果                         | 結果 |
| ---- | -------------------------------- | -------------------- |
| AC-1 | `auth.ts` の `process.env` grep 0 件      | PASS |
| AC-2 | `auth.ts` の `getCloudflareContext` grep 0 件 | PASS |
| AC-5 | `fetch/public.ts` の `process.env|getCloudflareContext` grep 0 件 | PASS |

## 3. 代替証跡 C: AC-7 runtime smoke（user-gated）

> **重要**: 本手順は **staging への deploy と実地ブラウザ操作**を伴う。skill ルールおよび本タスクの
> `runtime_boundary` 定義により、**user の明示承認後にのみ実施**する。仕様書作成フェーズおよび
> ローカル実装フェーズでは実行しない。

| 手順 | 操作                                                                 | 期待結果                                                       |
| ---- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1    | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | deploy 成功（user 承認後）                                  |
| 2    | staging の `/login` にアクセス                                       | login 画面が描画される（Server Components render error 非再発）|
| 3    | Google OAuth でログイン（テスト admin アカウント）                   | OAuth 完了後に `/admin` へ到達                                 |
| 4    | （別経路）Magic Link でログイン                                      | verify 完了後に `/profile` または `/admin` へ到達              |
| 5    | `/admin` の Server Components が正常描画されること                   | digest=167275886 系の render error が再発しないこと            |

> AC-7 は env 経路統一によって「env parse 失敗時の silent fail / undefined 起点 crash」が再発しないことを
> 実地で確認する。結果は user 承認後の実施時に本テーブルへ記入する。

## 4. 既知の制限・環境ブロッカー（source-level PASS と分離して記録）

| 区分                | 内容                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| source-level        | 自動テスト（証跡 A）と grep gate（証跡 B）はローカルで完結し、user 承認不要で実行できる        |
| 環境ブロッカー      | AC-7 runtime smoke は staging deploy + 実地操作が必須のため user-gated。ローカルでは代替不可    |
| worktree 環境前提   | vitest 実行前に `mise exec -- pnpm install` でバイナリ整合（esbuild）を確保する（CLAUDE.md 準拠） |

## 5. 完了条件（このPhaseの DoD）

- [x] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を記載した
- [x] UI/UX 変更なしのため Phase 11 スクリーンショット不要、`screenshots/` 不使用（`.gitkeep` 削除対象）を明記した
- [x] 代替証跡の主ソース（自動テスト名・件数 + AC grep gate + AC-7 runtime smoke）をメタに明記した
- [x] AC-7 runtime smoke は user 承認後のみ実施することを明記した
- [x] source-level PASS と環境ブロッカーを別カテゴリで分離記録した
