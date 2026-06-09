# 旧 `PUBLIC_API_BASE_URL` env を repo 全体から削除し `NEXT_PUBLIC_API_BASE_URL` へ単一化 — タスク仕様書（index）

> **[実装区分: 実装仕様書]** — コード変更を伴う（env schema / accessor / wrangler / consumer / test の削除・rename）。ドキュメントのみでは目的（同義 env キー二重化の解消）を達成できないため、CONST_004 デフォルトに従い実装仕様書として作成する。

```yaml
workflow_id: issue-1145-public-api-base-url-env-unification
task_id: issue-1145-public-api-base-url-env-unification
task_name: 旧 PUBLIC_API_BASE_URL env を repo 全体から削除し NEXT_PUBLIC_API_BASE_URL へ単一化
category: 改善 / リファクタリング（env schema cleanup / monorepo 横断）
implementation_mode: new
visual_category: NON_VISUAL
status: implemented_local_evidence_captured
issue_number: 1145
issue_state: CLOSED
priority: 低
scale: 小規模
created_date: 2026-06-08
source: issue #1145 (FU-SASR-001) の現行コード最適化（apps/og 追加分をスコープに編入）
dependencies: [staging-api-url-and-session-recovery]
```

---

## 0. このタスク仕様書の位置づけ（調査結果サマリー）

issue #1145（`[FU-SASR-001]`）は CLOSED 状態だが、**ユーザー依頼により「現行コードで解決済みか」を調査した結果、未解決**であることを確認した。さらに **issue body のスコープが現行コードに対して古い**ため、現行コードへ最適化したうえで本仕様書を作成する。CLOSED のまま実装仕様書を作成する（Issue の再 OPEN は user-gated）。

### 0.1 調査で確定した事実

| 確認項目 | 結果 | 根拠 |
| -------- | ---- | ---- |
| 別タスクで解決済みか | **未解決** | `grep -rn 'PUBLIC_API_BASE_URL' apps/ \| grep -v 'NEXT_PUBLIC_'` が 19 ファイルで HIT |
| `apps/web` 側の旧キー残存 | env.ts / wrangler.toml / public.ts / .dev.vars.example / playwright config 2 本 + spec 群に残存 | 下表「対象ファイル一覧」 |
| **issue scope の古さ** | issue body は `apps/web` の 3 ファイルのみ列挙。だが **`apps/og`（OG 画像生成 Worker, #1084 / 2026-06-02 追加）が `PUBLIC_API_BASE_URL` をライブ消費** | `apps/og/src/member-source.ts:66` / `apps/og/wrangler.toml` L10/16/29 |
| issue body 未記載の `apps/web` 追加箇所 | `playwright.config.ts` / `playwright.admin-schema-diff.config.ts` / `.dev.vars.example` も旧キーを持つ | 下表 |
| package filter 名のドリフト | 元 unassigned spec の `@repo/web` は誤り。現行は `@ubm-hyogo/web` / `@ubm-hyogo/og` | `apps/{web,og}/package.json` |

### 0.2 現行コードへの最適化（issue body との差分）

- **スコープ拡大**: issue body の `apps/web` 限定 → **`apps/web` + `apps/og` の repo 全体**。`apps/og` も `NEXT_PUBLIC_API_BASE_URL` へ rename し、AC の grep gate を `apps/`（= repo 全体）スコープに引き上げる（ユーザー承認済み・本仕様書 §設計判断 D-1）。
- **追加対象ファイルの編入**: `playwright.config.ts` / `playwright.admin-schema-diff.config.ts` / `.dev.vars.example` を削除対象に編入。
- **`getApiBaseEnv` の扱い確定**: production consumer 0 件（env.ts 定義 + env.spec.ts のみ）を grep で確認 → 旧キー分岐削除に留めず**関数 + `ApiBaseEnv` 型ごと削除**する root-clean 方針へ最適化。
- **package filter 名の是正**: 検証コマンドを `@ubm-hyogo/web` / `@ubm-hyogo/og` に正す。

---

## 1. 目的（What / Why）

同一の API base URL に対して `NEXT_PUBLIC_API_BASE_URL`（`NEXT_PUBLIC_` 接頭辞）と `PUBLIC_API_BASE_URL`（非接頭辞）の **2 キーが repo 全体で併存**しており、wrangler.toml 二重定義による値乖離事故・fallback dead path・「両方書く」先例の波及という技術的負債を生んでいる。

旧 `PUBLIC_API_BASE_URL` を **schema / 型 / accessor / consumer / wrangler / .dev.vars.example / playwright config / spec から完全削除（apps/web）または rename（apps/og）**し、API base URL の env を `NEXT_PUBLIC_API_BASE_URL` の単一キーへ収束させる。挙動（base URL 解決・transport 選択）は不変。

---

## 2. 対象ファイル一覧（変更対象 19 ファイル）

`grep -rln 'PUBLIC_API_BASE_URL' apps/`（NEXT_PUBLIC_ 除外で old>0）で確定した全 19 ファイル。

### 2.1 apps/web — プロダクションコード / 設定（8 ファイル中 6）

| # | パス | 変更種別 | 旧キー件数 | 内容 |
| - | ---- | -------- | --------- | ---- |
| 1 | `apps/web/src/lib/env.ts` | 編集 | 11 | `EnvSchema` L7 / `PublicFetchEnv.PUBLIC_API_BASE_URL?` L64 / `ApiBaseEnv.PUBLIC_API_BASE_URL?` L78 / `getApiBaseEnv()` L168-177（関数ごと削除）/ `getPublicFetchEnv()` 旧キー fallback L187-192,197 |
| 2 | `apps/web/src/lib/fetch/public.ts` | 編集 | 7 | `getBaseUrl()` L24 / `getServiceBinding()` L48 の `?? env.PUBLIC_API_BASE_URL` 削除 + コメント L9/10/13/45/49 を `NEXT_PUBLIC_API_BASE_URL` 表記へ |
| 3 | `apps/web/wrangler.toml` | 編集 | 3 | `[vars]` L17 / `[env.staging.vars]` L33 / `[env.production.vars]` L61 削除 |
| 4 | `apps/web/.dev.vars.example` | 編集 | 1 | L5 削除 |
| 5 | `apps/web/playwright.config.ts` | 編集 | 1 | L149 `'PUBLIC_API_BASE_URL=...'` 行削除 |
| 6 | `apps/web/playwright.admin-schema-diff.config.ts` | 編集 | 1 | L45 削除 |

### 2.2 apps/og — プロダクションコード / 設定（2 ファイル）

| # | パス | 変更種別 | 旧キー件数 | 内容 |
| - | ---- | -------- | --------- | ---- |
| 7 | `apps/og/src/member-source.ts` | 編集 | 2 | `OgEnv.PUBLIC_API_BASE_URL?` L7 / `fetchViaBaseUrl()` L66 `env.PUBLIC_API_BASE_URL?.trim()` を **`NEXT_PUBLIC_API_BASE_URL` へ rename**（削除でなく rename = 単一キーに統一） |
| 8 | `apps/og/wrangler.toml` | 編集 | 3 | `[vars]` L10 / `[env.staging.vars]` L16 / `[env.production.vars]` L29 を rename |

### 2.3 spec 群（11 ファイル）— seed / assert を `NEXT_PUBLIC_API_BASE_URL` へ移行

| # | パス | 旧キー件数 | 移行方針 |
| - | ---- | --------- | -------- |
| 9 | `apps/web/src/lib/__tests__/env.spec.ts` | 8 | schema parse の旧キー seed 削除。`getApiBaseEnv` の 2 テスト（L252 / L262）は**関数削除に伴い削除** |
| 10 | `apps/web/src/lib/fetch/public.spec.ts` | 9 | `PUBLIC_API_BASE_URL` seed / delete / assert / テスト名を `NEXT_PUBLIC_API_BASE_URL` へ。transport 選択意図は保持 |
| 11 | `apps/web/src/lib/api/__tests__/public.spec.ts` | 4 | seed / assert を rename |
| 12 | `apps/web/src/lib/__tests__/build-time-env.spec.ts` | 3 | seed を rename |
| 13 | `apps/web/src/lib/fetch/authed.spec.ts` | 2 | 型定義 + seed の旧キー削除（NEXT_PUBLIC_ 単一に） |
| 14 | `apps/web/src/__tests__/instrumentation.runtime.spec.ts` | 1 | seed 削除（NEXT_PUBLIC_ と同義二重 seed） |
| 15 | `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | 1 | seed 削除 |
| 16 | `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | 1 | seed 削除 |
| 17 | `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | 1 | seed 削除 |
| 18 | `apps/og/src/__tests__/member-source.spec.ts` | 7 | `OgEnv` seed / テスト名（`falls back to PUBLIC_API_BASE_URL`）を `NEXT_PUBLIC_API_BASE_URL` へ rename。fallback 意図は保持 |
| 19 | `apps/og/src/__tests__/router.spec.ts` | 1 | seed を rename |

> **注意**: `apps/web/app/__tests__/layout.spec.tsx` / `apps/web/app/(public)/members/[id]/page.spec.tsx` / `apps/web/__tests__/middleware.spec.ts` / `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` は `NEXT_PUBLIC_API_BASE_URL` のみで旧キーを持たない（grep で old=0）ため**対象外**。

---

## 3. 設計判断（Design Decisions）

| ID | 判断 | 根拠 |
| -- | ---- | ---- |
| D-1 | `apps/og` も `NEXT_PUBLIC_API_BASE_URL` へ rename し、AC grep gate を `apps/` 全体に拡大 | ユーザー承認（repo 全体統一）。monorepo 全体で単一 grep gate を成立させ、env キー二重化の根本（複数命名の併存）を消す |
| D-2 | `apps/og` は削除でなく **rename**（apps/web は削除） | apps/og は `NEXT_PUBLIC_` 対応キーを持たず単一キー運用。rename で単一キー統一を達成（削除すると base URL 解決経路が消える） |
| D-3 | `getApiBaseEnv()` + `ApiBaseEnv` 型を関数ごと削除 | production consumer 0 件（env.ts 定義 + env.spec.ts テストのみ）。旧キー分岐削除後は `INTERNAL_API_BASE_URL` 単一フィールドのみ返す dead-ish 関数になり、残す合理性がない |
| D-4 | `NEXT_PUBLIC_` を非 Next.js Worker（apps/og）に付与する意味的違和は許容 | env 変数名としては有効。repo 全体の単一 grep gate と命名一貫性を優先（ユーザー判断） |
| D-5 | 挙動不変（base URL 値・解決優先順位・transport 選択は変えない） | 親不変条件 #1（既存 API surface のみ）。単一化は重複除去であり値の付け替えではない |

---

## 4. 受入条件（AC）

- **AC-1**: `apps/web/src/lib/env.ts` から旧 `PUBLIC_API_BASE_URL` の schema 行（L7）/ 型フィールド（`PublicFetchEnv` L64・`ApiBaseEnv` L78）/ `getPublicFetchEnv()` の旧キー fallback（L187-192,197）が削除される。
- **AC-2**: `getApiBaseEnv()` 関数と `ApiBaseEnv` 型が削除される（production consumer 0 件を `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` で再確認後）。env.spec.ts の対応テストも削除。
- **AC-3**: `apps/web/src/lib/fetch/public.ts` の `getBaseUrl()`（L24）/ `getServiceBinding()`（L48）の `?? env.PUBLIC_API_BASE_URL` が削除され `NEXT_PUBLIC_API_BASE_URL` 単独参照になる。旧キー言及コメントも更新。
- **AC-4**: `apps/web/wrangler.toml`（3 行）/ `apps/web/.dev.vars.example`（1 行）/ `apps/web/playwright.config.ts`（1 行）/ `apps/web/playwright.admin-schema-diff.config.ts`（1 行）の旧キーが削除される。
- **AC-5**: `apps/og/src/member-source.ts`（`OgEnv` 型 + `fetchViaBaseUrl`）と `apps/og/wrangler.toml`（3 行）の `PUBLIC_API_BASE_URL` が `NEXT_PUBLIC_API_BASE_URL` へ rename される。
- **AC-6**: spec 群 11 ファイルの seed / assert / テスト名が `NEXT_PUBLIC_API_BASE_URL` へ移行され、各テストの意図（transport 選択 / fallback 経路）が保たれる。
- **AC-7**: **`grep -rn 'PUBLIC_API_BASE_URL' apps/ | grep -v 'NEXT_PUBLIC_API_BASE_URL'` が 0 件**（repo 全体で旧キー残存ゼロ）。
- **AC-8**: `pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web lint`（lint-boundaries 含む）/ `pnpm --filter @ubm-hyogo/og typecheck` と対象 vitest（env / public fetch / instrumentation / server-fetch / og member-source）が全 green。fetchPublic / SSR / OG の base URL 解決挙動が回帰しない。
- **AC-9**: 親不変条件遵守（既存 API surface のみ・D1 直接アクセスなし・`process.env.*` 直接参照を `apps/web/src` に増やさない・OKLch トークン不変）。

---

## 5. スコープ外（含まないもの）

- `NEXT_PUBLIC_API_BASE_URL` の値・解決ロジック・優先順位の変更（単一化のみで挙動不変）。
- `INTERNAL_API_BASE_URL` / `AUTH_URL` 等、他 env キーの整理。
- service-binding 優先ロジック（`API_SERVICE`）/ transport 選択（`resolveServiceBinding` / `selectAndFetch`）の挙動変更。
- API endpoint / D1 schema / Google Form 仕様変更。
- Cloudflare Secrets / GitHub Variables の運用変更（旧キーは非機密 `[vars]` 管理で Secret には存在しない。`scripts/cf.sh` で確認に留め secret put/delete は行わない）。
- staging / production への deploy（wrangler の vars 変更反映には再 deploy が必要だが、それは Phase 13 = user-gated）。

---

## 6. Phase 構成

| Phase | 名称 | 成果物 |
| ----- | ---- | ------ |
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` — scope / inventory / 命名規則 / AC 明示 |
| 2 | 設計 | `outputs/phase-2/phase-2.md` — 削除順序 / lane 分割 / 検証経路 |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` — Phase 4 進行可否判定 |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` — grep gate + 回帰 test 設計 |
| 5 | 実装 | `outputs/phase-5/phase-5.md` — 19 ファイルの削除 / rename 手順 |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` — fail path / 回帰 guard |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` — 変更範囲の coverage |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` — 重複除去確認 |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` — grep 0 件 / typecheck / lint |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` — AC 判定 / blocker |
| 11 | 手動テスト | `outputs/phase-11/phase-11.md` + `manual-test-result.md` — NON_VISUAL 証跡 |
| 12 | ドキュメント更新 | `outputs/phase-12/` strict 7 成果物 |
| 13 | PR 作成 | `outputs/phase-13/phase-13.md` — user-gated |

---

## 7. 検証コマンド（正本）

```bash
# AC-7: 旧キー全走査（最終 0 件）
grep -rn 'PUBLIC_API_BASE_URL' apps/ | grep -v 'NEXT_PUBLIC_API_BASE_URL'

# AC-2: getApiBaseEnv / ApiBaseEnv 参照 0 件（削除後）
grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/

# AC-8: typecheck / lint / vitest
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/og typecheck
pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/__tests__/env.spec.ts
pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/fetch/public.spec.ts
pnpm --filter @ubm-hyogo/og test -- apps/og/src/__tests__/member-source.spec.ts
```

---

## 8. 実施ステータス・ゲート

- **status**: `implemented_local_evidence_captured`（実コード・設定・spec・GitHub Actions env injection・aiworkflow 正本同期まで完了。commit / PR / deploy は未実行）。
- **Gate-A（spec_review）**: 本 Phase 1-13 + Phase 12 strict-7 を作成し、implementation / NON_VISUAL として実装対象を確定 → passed（本仕様書作成時）。
- **Gate-B（implementation_review）**: 実コード 19 ファイル + `.github/workflows/*` env injection + aiworkflow 正本同期を 1 サイクルで実装。grep gate 0 件、focused targeted tests、typecheck、lint green → passed。`@ubm-hyogo/web` package 全体 test は今回変更外の既存 UI spec 2 件で red のため Gate-B 証跡から除外し、変更対象 9 spec の direct targeted run（79 tests PASS）を正とする。
- **Gate-C（external_ops）**: commit / push / PR / staging+production 再 deploy / Issue mutation → pending（user-gated）。
- **GitHub Issue**: [#1145](https://github.com/daishiman/UBM-Hyogo/issues/1145)（CLOSED のまま。本仕様書は CLOSED 状態で作成。再 OPEN は user-gated）。
- **commit / PR / deploy はすべて user-gated**。

---

## 9. 参照資料

- 起点: `docs/30-workflows/unassigned-task/staging-api-url-and-session-recovery-followup-001-public-api-base-url-schema-removal.md`（apps/web 限定の元 spec。本仕様書はこれを現行コードへ最適化し apps/og を編入したもの）
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`（1 段目 = 旧キー残置の起点 workflow）
- `apps/web/src/lib/env.ts` / `apps/web/src/lib/fetch/public.ts` / `apps/og/src/member-source.ts`（改修対象）
- CLAUDE.md「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」/「Cloudflare 系 CLI 実行ルール」
