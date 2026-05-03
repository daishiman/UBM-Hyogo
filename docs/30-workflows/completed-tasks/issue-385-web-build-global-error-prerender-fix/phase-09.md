[実装区分: 実装仕様書]

# Phase 9: 品質保証 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 9 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler の `await getAuth()` 経由呼び出し + `oauth-client.ts` 動的 import 化）の実装完了後に実行する品質ゲート群を確定する。本 Phase ではコード変更を行わず、ゲート手順 / 期待出力 / 失敗時判定 / lefthook 連動 / CI gate 影響 / coverage 影響 / skill index 影響 / Phase 11 への smoke runbook 引き継ぎを文書として確定する。

## 品質ゲート一覧（5 ゲート + 補助 grep + lefthook + CI）

| # | ゲート | コマンド | 必須 | 対応 AC |
| --- | --- | --- | --- | --- |
| G-1 | 型検査 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 必須 | AC-4 |
| G-2 | リント | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 必須 | AC-5 |
| G-3 | テスト | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 必須 | AC-9 |
| G-4 | ビルド | `mise exec -- pnpm --filter @ubm-hyogo/web build` | 必須 | AC-1 / AC-3 |
| G-5 | Cloudflare ビルド | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | 必須 | AC-2 / AC-3 |

> 5 ゲートはこの順序で実走する。前段失敗時は後段を実行せず Phase 5 実装ランブックへ差し戻す。

## ゲート別詳細

### G-1: typecheck

| 項目 | 値 |
| --- | --- |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| 内容 | `tsc --noEmit` 相当（`apps/web/tsconfig.json`） |
| 期待出力 | エラー 0 件 / exit code 0 |
| 失敗時判定 | `getAuth()` の戻り型と route handler 側の分割代入の整合崩れ、または `import type` 漏れ。Phase 5 へ差し戻し |
| 失敗例 | `Property 'handlers' does not exist on type 'Awaited<ReturnType<typeof getAuth>>'` |
| 所要時間目安 | 30 秒〜2 分 |
| evidence | `outputs/phase-09/main.md` に exit code と末尾サマリを記録 |

### G-2: lint

| 項目 | 値 |
| --- | --- |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web lint` |
| 内容 | Next.js / ESLint config 適用 |
| 期待出力 | warning 0 / error 0 / exit code 0 |
| 失敗時判定 | unused import（旧 `import NextAuth` 等の削除漏れ）/ `import type` 表記の混入。Phase 5 で実装清書し再実行 |
| 所要時間目安 | 30 秒〜2 分 |
| evidence | `outputs/phase-09/main.md` に exit code を記録 |

### G-3: test

| 項目 | 値 |
| --- | --- |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web test` |
| 内容 | Vitest unit / route handler test |
| 期待出力 | 全 test PASS / exit code 0 |
| 影響範囲 | `apps/web/app/api/auth/callback/email/route.test.ts` / `apps/web/app/api/me/[...path]/route.test.ts` 等が `import { signIn } from "@/src/lib/auth"` 形式から `getAuth()` mock 形式へ修正必要 |
| mock 修正方針 | `vi.mock("@/src/lib/auth", () => ({ getAuth: vi.fn(async () => ({ auth: vi.fn(), signIn: vi.fn(), handlers: { GET: vi.fn(), POST: vi.fn() } })) }))` パターンに統一 |
| 失敗時判定 | mock 形式の不整合 / lazy factory 経路の test カバレッジ不足。Phase 5 で test 修正 |
| 所要時間目安 | 1〜3 分 |
| evidence | `outputs/phase-09/main.md` に PASS 件数と coverage サマリを記録 |

### G-4: build

| 項目 | 値 |
| --- | --- |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web build` |
| 内容 | Next.js production build（`apps/web/.next/` 生成 + 静的 prerender） |
| 期待出力 | "Compiled successfully" 系 + `/_global-error` / `/_not-found` の prerender が緑 / exit code 0 |
| 失敗時判定 1 | ログに `Cannot read properties of null (reading 'useContext')` が出現 → Plan A 不十分（top-level value import の漏れ）。Phase 8 DC-2〜DC-6 grep を再実行し漏れ箇所を特定、Phase 5 へ差し戻し |
| 失敗時判定 2 | 上記以外の prerender エラー → Phase 5 へ差し戻し |
| 所要時間目安 | 1〜3 分 |
| evidence | `outputs/phase-11/build-smoke.md` に stdout 抜粋（route table と末尾サマリ） |
| 重要 grep | `rg "Cannot read properties of null" <build_log>` が 0 件 |

### G-5: build:cloudflare

| 項目 | 値 |
| --- | --- |
| コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` |
| 内容 | `@opennextjs/cloudflare` 経由で Workers worker bundle 生成（`apps/web/.open-next/worker.js`） |
| 期待出力 | exit code 0 / `apps/web/.open-next/worker.js` 生成確認 |
| 失敗時判定 | G-4 が緑で G-5 のみ失敗 → @opennextjs/cloudflare との互換問題（dynamic import が worker bundle 化で展開されないケース）。Phase 5 で `getAuth()` の `await import("next-auth")` を webpack 互換 `/* webpackChunkName */` コメント付きに調整 or `@opennextjs/cloudflare` patch upgrade を user 承認後に評価 |
| 所要時間目安 | 1〜3 分 |
| evidence | `outputs/phase-11/build-cloudflare-smoke.md` に stdout 抜粋 + `ls apps/web/.open-next/worker.js` 結果 |

## DRY 化崩れ / dead code 検出 grep（Phase 8 から引継ぎ）

Phase 5 実装完了後、5 ゲート実行前に以下 grep を実走し Plan A の構造不変条件を確認する。

```bash
# DC-1: 旧 named re-export の残存確認
rg -n 'export \{ GET, POST \} from' apps/web/app/api/
# 期待: 0 件

# DC-2〜DC-5: auth.ts の top-level value import 残存確認（type-only は許容）
rg -n '^import [^t]' apps/web/src/lib/auth.ts | rg 'from "next-auth'
# 期待: 0 件

# DC-6: oauth-client.ts の top-level signIn import 残存確認
rg -n '^import \{ signIn \} from "next-auth/react"' apps/web/src/lib/auth/oauth-client.ts
# 期待: 0 件

# DC-7: lazy factory 以外の value export 残存確認
rg -n '^export (const|async function|function) (handlers|GET|POST|signIn|signOut)\b' apps/web/src/lib/auth.ts
# 期待: 0 件（getAuth のみ export）

# DC-8: route handler の next-auth value import 残存確認
rg -n '^import [^t][^ ]*[^ ] from "next-auth' apps/web/app/api/
# 期待: 0 件

# AC-6 補強: middleware 不変確認
rg -n 'from "next-auth' apps/web/middleware.ts
# 期待: 0 件
```

## coverage 影響評価

| 観点 | 扱い | 理由 |
| --- | --- | --- |
| 既存 test の coverage 維持 | G-3 で確認 | mock を `getAuth()` 形式に修正後、route handler test が lazy factory 経路を実走することで coverage は維持される（呼び出し経路が増えるが test 側の呼び出し点は同じ） |
| lazy factory `getAuth()` の test | G-3 で間接確認 | `getAuth()` 自体の unit test は不要（next-auth 依存の薄い wrapper）。route handler test が `getAuth()` の戻り型を使うことで integration として検証 |
| coverage 閾値 (`scripts/coverage-guard.sh`) | 既存閾値を維持 | Plan A は機能追加ではなくモジュール解決経路の変更。実行カバレッジは変動しない想定 |
| 回帰 guard | G-4 build ログ内に `Cannot read properties of null (reading 'useContext')` が再出現しないこと | 真因再発の構造的検知 |
| build smoke 代替性 | G-4 / G-5 が `/_global-error` / `/_not-found` の prerender を実走するため、Plan A の prerender 隔離効果は build smoke で直接検知できる | unit test 追加なしで真因再発検知が可能 |

## lefthook hook 通過確認

`lefthook.yml` 正本に従い、commit / push 段階で以下が PASS することを Phase 5 完了後に確認する（commit / push は本タスクでは user 承認後）。

| hook | 段階 | 想定挙動 | 失敗時 |
| --- | --- | --- | --- |
| pre-commit `staged-task-dir-guard` | commit | 本タスクは spec のみ変更。task dir 整合 PASS | 仕様書 path が `docs/30-workflows/issue-385-...` 内に揃っていることを再確認 |
| pre-commit `lint-staged` 系 | commit | 変更ファイルに対し lint / format 実行 | 個別ファイルを `pnpm lint --fix` で修正 |
| pre-push `coverage-guard` | push | `--changed` モードで diff 範囲のみ coverage 検査 | route handler test 修正により coverage が下がっていないか G-3 結果で再確認 |
| pre-push `typecheck` 系（存在すれば） | push | G-1 と同等 | G-1 失敗時と同じ対応 |

> sync-merge コミット時は CLAUDE.md § sync-merge 方針に従い hook が自動スキップされる。本タスクの実装コミットは通常コミットのため hook を skip しない。

## CI gate 影響評価

| ゲート | 対応する CI workflow | job 名 | 影響 |
| --- | --- | --- | --- |
| G-1 typecheck | `.github/workflows/ci.yml` 等 | `typecheck` / `web-typecheck` | Plan A 移行で型整合が取れていれば緑化 |
| G-2 lint | 同上 | `lint` / `web-lint` | unused import 残存ゼロで緑化 |
| G-3 test | 同上 | `test` / `web-test` | mock 修正の漏れがあると CI で fail。実走前にローカル G-3 で確認必須 |
| G-4 build | 同上 | `build` / `web-build` | Plan A の prerender 隔離効果が CI 上で再現することを確認 |
| G-5 build:cloudflare | `.github/workflows/deploy-*.yml` | `build-cloudflare` / `deploy-staging` 前段 | deploy job の前段 build が緑化される |
| verify-indexes | `.github/workflows/verify-indexes.yml` | `verify-indexes-up-to-date` | 本タスクで `.claude/skills/aiworkflow-requirements/indexes` に変更が入る場合は Phase 12 で `pnpm indexes:rebuild` 実行必須。drift があると CI fail |
| coverage gate | 既存 coverage workflow（存在する場合） | `coverage` 等 | 既存閾値維持。Plan A は実行経路の追加なし |

> 実 CI workflow 名・job 名は `.github/workflows/` 配下の現行 yaml を Phase 5 実装着手時に確認し、必要なら本表を更新する。

## skill index 影響

| 観点 | 影響 | 対応 |
| --- | --- | --- |
| 本タスク追加で `aiworkflow-requirements/indexes` が drift するか | task spec 追加（issue-385-...）により `quick-reference.md` / `resource-map.md` の rebuild が必要 | Phase 12 で `mise exec -- pnpm indexes:rebuild` を実行し、drift を解消 |
| `verify-indexes-up-to-date` CI gate | rebuild 漏れで CI fail | Phase 12 完了時にローカルで `pnpm indexes:rebuild` → `git diff` 確認 → 必要差分を含めてコミット |
| `lessons-learned-*.md` への追加 | Plan A の lazy factory パターンが他タスクで再利用される可能性。Phase 12 で lessons-learned 追加可否を判定 | 追加する場合は Phase 12 ドキュメント更新で対応 |

## ローカル実行コマンド（手順全体）

```bash
# 0. 事前: ワークツリーで pnpm install を確認
mise exec -- pnpm install

# 1. dead code 検出 grep（Phase 8 引き継ぎ）
rg -n 'export \{ GET, POST \} from' apps/web/app/api/
rg -n '^import [^t]' apps/web/src/lib/auth.ts | rg 'from "next-auth'
rg -n '^import \{ signIn \} from "next-auth/react"' apps/web/src/lib/auth/oauth-client.ts
rg -n '^export (const|async function|function) (handlers|GET|POST|signIn|signOut)\b' apps/web/src/lib/auth.ts
rg -n '^import [^t][^ ]*[^ ] from "next-auth' apps/web/app/api/
rg -n 'from "next-auth' apps/web/middleware.ts

# 2. G-1 typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# 3. G-2 lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4. G-3 test
mise exec -- pnpm --filter @ubm-hyogo/web test

# 5. G-4 build
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/web-build.log
rg -n "Cannot read properties of null \(reading 'useContext'\)" /tmp/web-build.log
# 期待: 0 件

# 6. G-5 build:cloudflare
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/web-build-cf.log
ls -la apps/web/.open-next/worker.js
```

## 失敗時の差し戻し / fallback 判定フロー

```
G-1 fail → Phase 5 差し戻し（型修正 / import type 漏れ確認）
  ↓ pass
G-2 fail → Phase 5 差し戻し（lint 修正 / unused import 削除）
  ↓ pass
G-3 fail
  ├─ mock 形式不整合（getAuth が undefined） → test mock を `vi.mock("@/src/lib/auth", ...)` 形式へ修正
  └─ 上記以外 → Phase 5 差し戻し
  ↓ pass
G-4 fail
  ├─ "Cannot read properties of null (reading 'useContext')" 検出
  │   → Plan A 不十分。DC-2〜DC-6 grep を再実行し top-level value import 漏れを特定
  │   → 漏れ修正後に G-1 から再実行
  └─ 上記以外 → Phase 5 差し戻し
  ↓ pass
G-5 fail
  ├─ G-4 緑 / G-5 のみ失敗
  │   → @opennextjs/cloudflare 互換性。dynamic import 形式調整 or patch upgrade 評価（user 承認後）
  └─ 上記以外 → Phase 5 差し戻し
  ↓ all pass
Phase 10 へ
```

## 自走禁止操作 (approval gate)

- 5 ゲートの実走自体は本タスク範囲内（spec_revised → ready）だが、本 Phase の仕様書作成では実行しない
- `apps/web/package.json` の `next` / `react` / `next-auth` バージョン変更は本タスク Scope Out（user 承認があっても本タスクでは実施しない）
- `@opennextjs/cloudflare` patch upgrade は user 承認後にのみ評価
- staging / production deploy は実行しない（本タスクは build 緑化までで完了）
- commit / push / PR は user 承認後の別経路で実施

## Phase 11 への smoke runbook 引き渡し

Phase 11（手動 smoke / 実測 evidence）へ次の runbook を引き渡す。

| evidence file | 取得方法 | 内容 |
| --- | --- | --- |
| `outputs/phase-11/build-smoke.md` | G-4 stdout を `tee` で保存し抜粋転記 | route table / 末尾サマリ / `useContext` null grep 結果（0 件） |
| `outputs/phase-11/build-cloudflare-smoke.md` | G-5 stdout を `tee` で保存し抜粋転記 + `ls -la apps/web/.open-next/worker.js` | worker bundle サイズ / 生成確認 |
| `outputs/phase-11/prerender-output-check.md` | `apps/web/.next/server/app/_global-error.html` 等の prerender 成果物存在確認 | prerender が完走した evidence |
| `outputs/phase-11/main.md` | 5 ゲート結果サマリ + dead code grep 結果 + manual smoke（dev サーバー / sign-in 動作確認）の有無を集約 | Phase 12 close-out への引き継ぎ |

## 変更対象ファイル一覧

| ファイル | 本 Phase での変更 | 備考 |
| --- | --- | --- |
| 仕様書 | `outputs/phase-09/main.md` のみ追加 | 5 ゲート手順 / lefthook / CI / coverage / skill index 影響の文書化 |
| 実装ファイル | なし | 本 Phase ではコード変更なし |
| `package.json` | なし | 本タスク Scope Out |

## 関数 / コンポーネントシグネチャ

本 Phase では新規関数を定義しない。Phase 2 / Phase 8 で確定済の `getAuth()` シグネチャを変更しない。

| 対象 | シグネチャ | 入出力 | 副作用 |
| --- | --- | --- | --- |
| `getAuth` | `() => Promise<{ handlers, auth, signIn, signOut }>` | 入力なし / next-auth 関数群を Promise で返却 | 初回のみ next-auth 動的 import |
| route handler 4 箇所 | `async (req, ctx) => Response` | NextRequest / dynamic segment / Response | `await getAuth()` 経由で next-auth API |

## 実行タスク

1. 5 ゲート（G-1〜G-5）のコマンド・期待出力・失敗判定を確定する。完了条件: 各ゲートに 6 項目（コマンド / 内容 / 期待 / 失敗判定 / 所要時間 / evidence）が記載される。
2. dead code 検出 grep（Phase 8 引き継ぎ）を 5 ゲート前段で実走する手順を確定する。完了条件: 6 件の grep がコピペ実行可能な形で揃う。
3. coverage 影響を評価する。完了条件: 既存 mock 修正後も coverage 維持される根拠が明記される。
4. lefthook hook 通過確認手順を記述する。完了条件: 4 hook の段階・想定挙動・失敗時対応が表で揃う。
5. CI gate 影響評価を記述する。完了条件: 5 ゲート + verify-indexes + coverage gate に CI workflow と影響が紐付く。
6. skill index 影響と Phase 12 での `pnpm indexes:rebuild` 実行を確定する。完了条件: drift 検知と rebuild 手順が明記される。
7. Phase 11 への smoke runbook 引き渡しを記述する。完了条件: evidence file 4 件に取得方法・内容が記載される。
8. 失敗時の差し戻し / fallback 判定フローを記述する。完了条件: G-3 / G-4 / G-5 失敗時の分岐が明確化される。

## 参照資料

- Phase 1（要件 / AC ↔ evidence path）
- Phase 2（採用方針 Plan A / lazy factory）
- Phase 5（実装ランブック）
- Phase 7（AC マトリクス）
- Phase 8（DRY 化判定 / dead code 検出計画 DC-1〜DC-8）
- CLAUDE.md § よく使うコマンド / lefthook 方針 / sync-merge 方針
- `.github/workflows/`（実 CI workflow 名は Phase 5 実装着手時に確認）
- `.github/workflows/verify-indexes.yml`

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本仕様書作成では 5 ゲートを実走しない（実走は Phase 5 完了後）
- アプリケーションコード、deploy、commit、push、PR、dependency 更新を本 Phase で実行しない
- secret 文字列を本 Phase で扱わない

## 統合テスト連携

- 上流: Phase 5（実装完了後に 5 ゲート実走）/ Phase 8（DRY 化崩れ + dead code grep）
- 下流: Phase 10（ゲート結果を最終レビュー）/ Phase 11（build smoke / cloudflare smoke / prerender check の実測 evidence を `outputs/phase-11/` へ収集）/ Phase 12（`pnpm indexes:rebuild` 実走）

## 多角的チェック観点

- 不変条件 #5: `apps/api` / D1 への変更ゼロを 5 ゲートで間接確認（typecheck / lint / test で boundary 検知）
- 不変条件 #14: build 成果物 `.open-next/worker.js` のサイズが Cloudflare 無料枠を逸脱しないこと（Phase 11 で `ls -la` 確認）
- 不変条件 #16: build / test ログから secret 文字列を evidence に転記しない
- CONST_004: 本タスクは実装区分=実装仕様書。本 Phase は文書化のみ
- CONST_005: 5 ゲート評価は単一サイクル内で完結（追加サイクル不要）
- CONST_007: 本タスク内で品質保証手順 → smoke runbook 引き継ぎまで完結
- 未実装 / 未実測を PASS と扱わない: 5 ゲートは実走必須。spec 化のみで PASS 扱いしない
- pre-existing バグの恒久解消が責務: G-4 ログ内 `useContext` null 再出現を構造的に検知

## DoD（Definition of Done）

- 5 ゲート（G-1〜G-5）の手順・期待出力・失敗判定が表で揃っている
- dead code 検出 grep が 5 ゲート前段でコピペ実行可能な形で揃っている
- coverage 影響評価（既存閾値維持の根拠）が明記されている
- lefthook hook 通過確認手順が表で揃っている
- CI gate 影響評価（5 ゲート + verify-indexes + coverage）が記述されている
- skill index 影響と Phase 12 `pnpm indexes:rebuild` 実行が明記されている
- Phase 11 への smoke runbook 引き渡し（evidence 4 件）が表で揃っている
- 失敗時の差し戻し / fallback 判定フローが記述されている
- ローカル実行コマンドがコピペ実行可能な順序で揃っている
- 本 Phase でコード変更 / 5 ゲート実走を行っていない
- `outputs/phase-09/main.md` が作成されている

## サブタスク管理

- [ ] 5 ゲートの詳細表を確定した
- [ ] dead code 検出 grep を確定した
- [ ] coverage 影響評価を記述した
- [ ] lefthook hook 通過確認手順を記述した
- [ ] CI gate 影響評価を記述した
- [ ] skill index 影響と rebuild 手順を記述した
- [ ] Phase 11 smoke runbook 引き渡しを記述した
- [ ] 失敗時 fallback 判定フローを記述した
- [ ] ローカル実行コマンドを記述した
- [ ] outputs/phase-09/main.md を作成した

## 完了条件

- 5 ゲートの実走順序・期待出力・失敗時の差し戻し先が一意に決まっている
- G-4 ログから `Cannot read properties of null (reading 'useContext')` が再出現しないことを構造的に検知できる
- coverage / lefthook / CI / skill index 影響が網羅的に評価されている
- Phase 11 へ引き渡す smoke runbook が evidence file 単位で確定している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、5 ゲート実走、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 値を記録していない

## 次 Phase への引き渡し

Phase 10（最終レビュー）へ次を渡す:

- 5 ゲートの手順と期待出力（G-1 typecheck / G-2 lint / G-3 test / G-4 build / G-5 build:cloudflare）
- dead code 検出 grep（Phase 8 DC-1〜DC-8 の実走形）
- coverage 影響評価（既存閾値維持）
- lefthook hook 通過確認手順
- CI gate 影響評価（verify-indexes / coverage 含む）
- skill index 影響と Phase 12 `pnpm indexes:rebuild` 計画
- Phase 11 への smoke runbook 引き渡し（build-smoke / build-cloudflare-smoke / prerender-output-check / main）
- 失敗時の差し戻し / fallback 判定フロー
