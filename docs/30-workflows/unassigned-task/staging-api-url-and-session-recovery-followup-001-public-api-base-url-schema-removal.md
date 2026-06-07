# 旧 `PUBLIC_API_BASE_URL` env を schema/wrangler/アクセサから完全削除し `NEXT_PUBLIC_API_BASE_URL` 単一化 - タスク指示書

```yaml
issue_number: 1145
task_id: staging-api-url-and-session-recovery-followup-001-public-api-base-url-schema-removal
task_name: 旧 PUBLIC_API_BASE_URL env を schema/wrangler/アクセサから完全削除し NEXT_PUBLIC_API_BASE_URL 単一化
category: 改善 / リファクタリング（env schema cleanup）
target_feature: apps/web/src/lib/env.ts / apps/web/wrangler.toml
priority: 低
scale: 小規模
status: spec_created
source_phase: staging-api-url-and-session-recovery Phase 12 unassigned-task-detection §baseline B-1 / Phase 10 §MINOR M-1（2回検証一致）
created_date: 2026-06-03
dependencies: [staging-api-url-and-session-recovery]
```

## メタ情報

| 項目         | 内容                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| タスクID     | staging-api-url-and-session-recovery-followup-001-public-api-base-url-schema-removal                                                 |
| タスク名     | 旧 `PUBLIC_API_BASE_URL`（非 `NEXT_PUBLIC_` 接頭辞）を env schema / `wrangler.toml` / `getPublicFetchEnv` から完全削除し単一化         |
| 分類         | 改善 / リファクタリング（env schema cleanup）                                                                                         |
| 対象機能     | `apps/web/src/lib/env.ts`（schema / 型 / 正規化 / `getPublicFetchEnv` / `getApiBaseEnv`）/ `apps/web/wrangler.toml`（`[vars]` 6 行）  |
| 優先度       | 低                                                                                                                                   |
| 見積もり規模 | 小規模                                                                                                                               |
| ステータス   | spec_created（未着手・実装/commit/PR は user-gated）                                                                                  |
| 発見元       | staging-api-url-and-session-recovery Phase 12 unassigned-task-detection §baseline B-1 / Phase 10 §MINOR M-1（2回検証一致）            |
| 発見日       | 2026-06-03                                                                                                                           |
| GitHub Issue | [#1145](https://github.com/daishiman/UBM-Hyogo/issues/1145)                                                                          |

## 親 / 関連 workflow

- 起点 workflow: `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/`（実装完了済 `implemented_local_evidence_captured`）
- 起点 outputs:
  - `.../outputs/phase-12/unassigned-task-detection.md` §baseline B-1「`PUBLIC_API_BASE_URL` env schema の完全削除」
  - `.../outputs/phase-10/phase-10.md` §MINOR M-1「`PUBLIC_API_BASE_URL`（非 inline）を env schema / wrangler.toml から完全削除」
- 設計決定の根拠: 起点 workflow phase-3.md「即削除は consumer 全走査が必要で drift リスクが高い → 本サイクルは `NEXT_PUBLIC_API_BASE_URL` 優先 + 旧キー後方互換残置に留め、削除は別途・低リスク化してから」（task-b §4-4）。**本タスクはその「別途」=削除の 2 段目**。
- 関連実装:
  - `apps/web/src/lib/env.ts`（旧キーの schema / 型 / 正規化 / accessor。下記「核心事実」参照）
  - `apps/web/src/lib/fetch/public.ts`（`getBaseUrl()` L24・`getServiceBinding()` L46 が `?? env.PUBLIC_API_BASE_URL` で旧キーを fallback 参照する**唯一の live consumer**）
  - `apps/web/wrangler.toml`（`[vars]` L17 / `[env.staging.vars]` L33 / `[env.production.vars]` L61 で旧キー重複定義）
  - `apps/web/.dev.vars.example`（L5 で旧キー記載）
- 制約根拠: CLAUDE.md「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」/ 親不変条件 #1（既存 API surface のみ）/ #5（D1 直接アクセス禁止）

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

起点 workflow `staging-api-url-and-session-recovery` で、client / SSR の API base URL 参照を `NEXT_PUBLIC_API_BASE_URL`（`NEXT_PUBLIC_` 接頭辞）へ統一した。しかし旧 `PUBLIC_API_BASE_URL`（非接頭辞）は**即削除せず後方互換で残置**した。理由は、旧キーの consumer を全走査せずに削除すると実行時 `undefined` 解決（base URL 不在 → fetch throw）を招く drift リスクが高いためで、これは phase-3.md の設計決定として明記済み（Phase 10 M-1 / Phase 12 B-1 にも記録）。

結果として現在、`apps/web` には同義の env キーが 2 本（`NEXT_PUBLIC_API_BASE_URL` と `PUBLIC_API_BASE_URL`）併存している。実コードで確認した残置箇所は以下のとおり:

- `apps/web/src/lib/env.ts`
  - `EnvSchema` の `PUBLIC_API_BASE_URL: z.string().url()`（L7・`NEXT_PUBLIC_API_BASE_URL` は L6 に別途存在）
  - 型 `PublicFetchEnv.PUBLIC_API_BASE_URL?`（L64）/ `ApiBaseEnv.PUBLIC_API_BASE_URL?`（L78）
  - `getApiBaseEnv()` の旧キー正規化分岐（L173-174）
  - `getPublicFetchEnv()` の旧キー fallback 分岐（L188-197・`processEnv` → `rawEnv` の順で `PUBLIC_API_BASE_URL` を解決し戻り値に詰める）
- `apps/web/wrangler.toml`
  - `[vars]` L17 / `[env.staging.vars]` L33 / `[env.production.vars]` L61 で `NEXT_PUBLIC_API_BASE_URL` と**同値**の旧キーを二重定義
- `apps/web/.dev.vars.example` L5（旧キー）
- live consumer: `apps/web/src/lib/fetch/public.ts` の `getBaseUrl()`（L24 `env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL`）/ `getServiceBinding()`（L46 同パターン）
- spec 群: `env.spec.ts` / `public.spec.ts`（`lib/fetch` 配下・`lib/api` 配下）/ `build-time-env.spec.ts` / `instrumentation.runtime.spec.ts` / `server-fetch.*.spec.ts` / `authed.spec.ts` 等が旧キーを seed / assert している

### 1.2 問題点・課題

- **同義キー 2 本の併存は技術的負債**: どちらを正とするか実装者ごとにブレ、`?? env.PUBLIC_API_BASE_URL` の fallback が「いつ効くのか」が分かりづらい。実際には `NEXT_PUBLIC_API_BASE_URL` が常に同値で設定されているため、旧キー fallback は事実上 dead path（wrangler.toml で両者が常に同一値）。
- **wrangler.toml の二重定義**は、片方だけ将来更新したときに値が乖離し「環境ごとに base URL がズレる」事故の温床になる。
- `getApiBaseEnv()` は env.ts 内に閉じており（production consumer を grep で確認した結果 0 件）、`ApiBaseEnv.PUBLIC_API_BASE_URL` フィールドは実質未使用に近い。負債を残す合理性がない。

### 1.3 放置した場合の影響

- 後続で env を追加する実装者が「`PUBLIC_*` と `NEXT_PUBLIC_*` を両方書く」先例を踏襲し、二重定義が他キーにも波及する。
- wrangler.toml の旧キーだけ更新漏れ → staging / production で `NEXT_PUBLIC_API_BASE_URL` と `PUBLIC_API_BASE_URL` の値が乖離 → fallback 経路次第で意図しない base URL を引く回帰。
- env schema 監査 / レビュー時に「未使用の重複キー」が指摘事項として恒常的に残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

旧 `PUBLIC_API_BASE_URL`（非 `NEXT_PUBLIC_` 接頭辞）を **schema / 型 / 正規化 / accessor / wrangler.toml / .dev.vars.example から完全削除**し、API base URL の env を `NEXT_PUBLIC_API_BASE_URL` の単一キーへ収束させる。

### 2.2 最終ゴール

- `apps/web/src/lib/env.ts` に旧 `PUBLIC_API_BASE_URL` の schema 行・型フィールド・正規化分岐・fallback が**一切残らない**。
- `apps/web/wrangler.toml` の 3 セクション（`[vars]` / `[env.staging.vars]` / `[env.production.vars]`）から旧キー行が削除され、`NEXT_PUBLIC_API_BASE_URL` のみになる。
- `apps/web/.dev.vars.example` から旧キー行が削除される（`NEXT_PUBLIC_API_BASE_URL` のみ）。
- `apps/web/src/lib/fetch/public.ts` の `getBaseUrl()` / `getServiceBinding()` の `?? env.PUBLIC_API_BASE_URL` fallback が `NEXT_PUBLIC_API_BASE_URL` 単独参照に整理される。
- 削除後、`apps/web` 全体で `PUBLIC_API_BASE_URL`（`NEXT_PUBLIC_` を除く旧キー）への**残存参照が 0 件**（spec の seed / assert も含めて一掃 or `NEXT_PUBLIC_` へ移行）。
- `pnpm typecheck` / `pnpm lint`（lint-boundaries 含む）と対象 vitest が green。fetchPublic / SSR の base URL 解決挙動が回帰しない。

### 2.3 スコープ

#### 含むもの

- `apps/web/src/lib/env.ts` から旧キー関連を削除:
  - `EnvSchema` の `PUBLIC_API_BASE_URL: z.string().url()`（L7）
  - 型 `PublicFetchEnv.PUBLIC_API_BASE_URL?`（L64）/ `ApiBaseEnv.PUBLIC_API_BASE_URL?`（L78）
  - `getApiBaseEnv()` の旧キー正規化分岐（L173-174）。`getApiBaseEnv` 自体が他で未使用なら関数ごと整理してよい（production consumer 0 件を確認のうえ判断）。
  - `getPublicFetchEnv()` の旧キー fallback 分岐（L188-197）。`baseUrl`（旧キー由来）解決と戻り値詰め込みを削除し、`nextPublicBaseUrl` 単一解決にする。
- `apps/web/src/lib/fetch/public.ts` の `?? env.PUBLIC_API_BASE_URL` 2 箇所（L24 / L46）を `NEXT_PUBLIC_API_BASE_URL` 単独参照へ。コメント L9-13 / L45 / L49 の旧キー言及も `NEXT_PUBLIC_API_BASE_URL` 表記に更新。
- `apps/web/wrangler.toml` の旧キー 3 行（L17 / L33 / L61）を削除。
- `apps/web/.dev.vars.example` の旧キー行（L5）を削除。
- 旧キーを seed / assert している spec 群を `NEXT_PUBLIC_API_BASE_URL` へ移行（同義値の重複 seed なら旧キー seed 行を削除）。対象は「核心事実」の grep 一覧で特定したファイル群。
- 全走査ガード: `grep -rn 'PUBLIC_API_BASE_URL' apps/web | grep -v 'NEXT_PUBLIC_API_BASE_URL'` が **0 件** であることを最終確認。

#### 含まないもの

- `NEXT_PUBLIC_API_BASE_URL` の値・解決ロジック・優先順位の変更（単一化するだけで挙動は不変）。
- `INTERNAL_API_BASE_URL` / `AUTH_URL` 等、他 env キーの整理。
- service-binding 優先ロジック（`API_SERVICE`）/ transport 選択（`resolveApiFetch`）の挙動変更。
- API endpoint / D1 schema / Google Form 仕様変更（親不変条件 #1 / #5）。
- Cloudflare Secrets / GitHub Variables 側の運用変更（wrangler.toml `[vars]` は非機密の `*.workers.dev` URL のため本タスクで削除可。Secrets には旧キーは存在しない前提だが、`bash scripts/cf.sh` 経由で旧キー secret 不在を確認するに留める。secret 投入/削除は実施しない）。

### 2.4 成果物

- `apps/web/src/lib/env.ts` の旧キー削除差分。
- `apps/web/src/lib/fetch/public.ts` の fallback 整理差分。
- `apps/web/wrangler.toml` / `apps/web/.dev.vars.example` の旧キー行削除差分。
- 旧キーを参照していた spec 群の `NEXT_PUBLIC_API_BASE_URL` 移行差分。
- 全走査 0 件を示す grep 証跡（PR 本文 or 検証ログ）。
- 本 follow-up を consumed に更新する記録（起点 workflow 側）。

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 live consumer（`public.ts`）の fallback を取りこぼさない（最重要）

旧キーは「schema に残っているだけ」ではなく、`apps/web/src/lib/fetch/public.ts` の `getBaseUrl()`（L24）と `getServiceBinding()`（L46）で `env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL` として**実際に参照されている**。env.ts 側だけ削除して `public.ts` を放置すると、`getPublicFetchEnv()` の戻り値から `PUBLIC_API_BASE_URL` フィールドが消えて型エラー（`Property 'PUBLIC_API_BASE_URL' does not exist`）になるか、あるいは型を `any` で握っていると無言で `undefined` を引いて fallback が死ぬ。**env.ts と public.ts は同一 PR で同時に整理する**こと。`?? env.PUBLIC_API_BASE_URL` を外しても、`NEXT_PUBLIC_API_BASE_URL` が wrangler.toml / .dev.vars.example で常に設定されているため base URL 解決は不変（local fallback `http://localhost:8787` も無改修）。

### 3.2 env キー二重化の罠（2 段階削除の 2 段目である理由）

`NEXT_PUBLIC_` 接頭辞キーと非接頭辞キーの二重定義は、起点 workflow が「即削除すると consumer 全走査漏れで実行時 `undefined` を招く」と判断し、**「優先 + 後方互換残置 → 別タスクで全走査後に削除」**という 2 段階に分けた。本タスクはその 2 段目であり、削除の前提条件は**全走査で旧キー参照を 0 件にできること**。`grep -rn 'PUBLIC_API_BASE_URL' apps/web | grep -v 'NEXT_PUBLIC_API_BASE_URL'` を削除前に走らせ、ヒットした全箇所（schema / 型 / 正規化 / public.ts / wrangler / .dev.vars / spec 群）を漏れなく対象に含めてから削除する。1 箇所でも取りこぼすと typecheck / runtime のどちらかで露見する。

### 3.3 spec の seed / assert を `NEXT_PUBLIC_` へ移行

旧キーは多数の spec で seed されている（`env.spec.ts` / `lib/fetch/public.spec.ts` / `lib/api/public.spec.ts` / `build-time-env.spec.ts` / `instrumentation.runtime.spec.ts` / `server-fetch.binding|http-fallback|env.spec.ts` / `authed.spec.ts` 等）。これらの多くは `NEXT_PUBLIC_API_BASE_URL` と同義値を二重 seed しているだけなので、旧キー seed 行を削除すれば足りる。ただし `public.spec.ts` には `[AC-R-01..03]` のように「`PUBLIC_API_BASE_URL` 明示時の transport 選択」をテスト名・assert で参照しているケースがあるため、テスト**意図**（HTTP fallback vs service-binding の選択）を保ったまま seed キーと assert 文言を `NEXT_PUBLIC_API_BASE_URL` に置換する。テスト名だけ旧キーを残すと grep ガードが 0 件にならない。

### 3.4 `getApiBaseEnv` の扱い（dead-ish 関数）

`getApiBaseEnv()`（env.ts L168）は production consumer を grep で確認した結果 0 件（env.ts 内定義のみ）で、`ApiBaseEnv.PUBLIC_API_BASE_URL` フィールドも実質未使用。旧キー分岐を削除すると `getApiBaseEnv` は `INTERNAL_API_BASE_URL` 単一フィールドのみを返す関数になる。完全に未使用であれば関数ごと削除してよいが、削除する場合は再度 `grep -rn 'getApiBaseEnv' apps/web` で参照 0 件を確認すること（spec が呼んでいる可能性に注意）。過剰削除より「旧キー分岐のみ削除 + 未使用なら関数削除」の二択を grep 結果で機械判断する。

### 3.5 後続実装者向けの落とし穴メモ

- env.ts と public.ts は**同一 PR**で整理する（片方だけだと型エラー or fallback 消失）。
- 削除順は「全走査 grep → 全ヒット箇所修正 → 再 grep 0 件 → typecheck / lint / vitest」。grep 0 件を**削除完了の判定条件**にする。
- wrangler.toml の旧キーは `NEXT_PUBLIC_API_BASE_URL` と常に同値なので、削除しても各環境の base URL 値は不変（値の付け替えではなく重複行の除去）。
- `scripts/cf.sh` 経由でも `PUBLIC_API_BASE_URL` という名の Cloudflare Secret は投入していない（非機密 URL は `[vars]` 管理）ため、secret 側の削除作業は不要。念のため `bash scripts/cf.sh` で確認するに留め、secret put/delete は行わない（CLAUDE.md Cloudflare CLI ルール / user-gated）。

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/src/lib/env.ts` の `EnvSchema` から `PUBLIC_API_BASE_URL: z.string().url()`（旧 L7）が削除され、`NEXT_PUBLIC_API_BASE_URL` のみが API base URL の schema キーになる。
- **AC-2**: `PublicFetchEnv.PUBLIC_API_BASE_URL?`（旧 L64）/ `ApiBaseEnv.PUBLIC_API_BASE_URL?`（旧 L78）の型フィールドが削除される。
- **AC-3**: `getApiBaseEnv()` の旧キー正規化分岐（旧 L173-174）/ `getPublicFetchEnv()` の旧キー fallback 分岐（旧 L188-197 の `baseUrl` 解決と戻り値詰め込み）が削除され、`getPublicFetchEnv()` は `NEXT_PUBLIC_API_BASE_URL` 単一解決になる。`getApiBaseEnv` が grep で参照 0 件なら関数ごと削除してよい。
- **AC-4**: `apps/web/src/lib/fetch/public.ts` の `getBaseUrl()`（旧 L24）/ `getServiceBinding()`（旧 L46）の `?? env.PUBLIC_API_BASE_URL` が削除され、`NEXT_PUBLIC_API_BASE_URL` 単独参照になる。旧キー言及コメントも更新される。
- **AC-5**: `apps/web/wrangler.toml` の旧キー 3 行（`[vars]` / `[env.staging.vars]` / `[env.production.vars]`）と `apps/web/.dev.vars.example` の旧キー行が削除される。
- **AC-6**: 旧キーを seed / assert していた spec 群が `NEXT_PUBLIC_API_BASE_URL` へ移行され、テスト意図（transport 選択等）が保たれている。
- **AC-7**: `grep -rn 'PUBLIC_API_BASE_URL' apps/web | grep -v 'NEXT_PUBLIC_API_BASE_URL'` が **0 件**（残存参照ゼロ）。
- **AC-8**: `pnpm --filter @repo/web typecheck` / `pnpm --filter @repo/web lint`（lint-boundaries 含む）/ 対象 vitest（env / public fetch / instrumentation 等）が全 green。fetchPublic / SSR base URL 解決の挙動が回帰しない。
- **AC-9**: 親不変条件遵守（既存 API surface のみ・D1 直接アクセスなし・OKLch トークン不変・`process.env.*` 直接参照を `apps/web/src` に増やさない）。

---

## 5. テスト方針

### 単体検証

```bash
# 旧キー参照の全走査（削除前後で実行・最終 0 件を AC-7 として固定）
grep -rn 'PUBLIC_API_BASE_URL' apps/web | grep -v 'NEXT_PUBLIC_API_BASE_URL'

# 対象 vitest（env / public fetcher / instrumentation / server-fetch）
mise exec -- pnpm --filter @repo/web test:run apps/web/src/lib/__tests__/env.spec.ts
mise exec -- pnpm --filter @repo/web test:run apps/web/src/lib/fetch/public.spec.ts
mise exec -- pnpm --filter @repo/web test:run apps/web/src/lib/api/__tests__/public.spec.ts
mise exec -- pnpm --filter @repo/web test:run apps/web/src/lib/__tests__/build-time-env.spec.ts
```

期待: 旧キー grep が 0 件。`NEXT_PUBLIC_API_BASE_URL` 単一解決で fetchPublic の transport 選択（service-binding 優先 / test 時 HTTP fallback）が従来どおり。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web lint
# 削除後に getApiBaseEnv を関数ごと消した場合は参照 0 件を再確認
grep -rn 'getApiBaseEnv' apps/web
```

期待: typecheck / lint（lint-boundaries 含む）green。`apps/web/src` に `process.env.*` 直接参照が増えていない。

---

## 6. 参照資料

- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-12/unassigned-task-detection.md` §baseline B-1（本タスクの起点・削除を別タスク化した根拠）
- `docs/30-workflows/completed-tasks/staging-api-url-and-session-recovery/outputs/phase-10/phase-10.md` §MINOR M-1（同一指摘・2回検証一致）
- `apps/web/src/lib/env.ts` — schema / 型 / 正規化 / `getPublicFetchEnv` / `getApiBaseEnv`（本タスク改修対象）
- `apps/web/src/lib/fetch/public.ts` — `getBaseUrl()` / `getServiceBinding()` の旧キー fallback（live consumer）
- `apps/web/wrangler.toml` / `apps/web/.dev.vars.example` — 旧キー定義の削除対象
- CLAUDE.md「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」— `process.env` 直接参照禁止 / accessor 経由
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」— `scripts/cf.sh` 経由・secret 値は出力しない

---

## 苦戦箇所・将来の課題解決のための知見【記入必須】

### W-1（横断知見）: workers.dev 外向き fetch loopback と transport 集約

同一 Cloudflare account の `*.workers.dev` への外向き plain `fetch()` は **loopback 404** になる（同一アカウント内 Workers 間の HTTP 直叩きが自分自身へ折り返される）。起点 workflow 以前は `public.ts` だけを service-binding（`API_SERVICE.fetch()`）回避していたが、authed / proxy / auth route（task-05a 系）を取りこぼしており、staging で `/me` 200 が取れず `/profile` がエラーカードになる事故につながった構造的経緯がある。**恒久対策は transport 選択を 1 か所（`resolveApiFetch` 相当）に集約し、binding を最優先・HTTP fallback は local 限定（非 local では throw＝fail-closed）にすること**。本タスクで base URL env を `NEXT_PUBLIC_API_BASE_URL` 単一化しても、transport 選択ロジック（binding 優先）は不変であり、base URL は「binding 不在の local / test 時」だけ使われる点を崩さない。

### env キー二重化の罠（2 段階削除）

`NEXT_PUBLIC_` 接頭辞と非接頭辞の同義 env を**即削除すると、consumer 全走査漏れで実行時 `undefined`**（base URL 不在 → fetch throw / 空 URL）を招く。安全策は「**優先キーへ寄せる + 旧キーは後方互換で残置 → 別タスクで全走査後に削除**」という 2 段階で、起点 workflow が 1 段目（残置）、**本タスクが 2 段目（削除）**。2 段目の前提条件は「全走査で旧キー参照を 0 件にできること」であり、これを満たせない場合は削除を見送る（schema だけ消すと型/runtime のどちらかで露見する）。

### 削除時の検証手順の知見

1. **削除前**: `grep -rn 'PUBLIC_API_BASE_URL' apps/web | grep -v 'NEXT_PUBLIC_API_BASE_URL'` で旧キー参照を全列挙（schema / 型 / 正規化 / `public.ts` fallback / wrangler / `.dev.vars.example` / spec 群が出る）。
2. 列挙した全箇所を `NEXT_PUBLIC_API_BASE_URL` へ移行 or 重複行削除。`env.ts` と `public.ts` は**同一 PR**で同時に直す（片方だけだと型エラー or fallback 消失）。
3. **削除後**: 同 grep を再実行し **0 件**を確認（これを削除完了の判定条件にする）。`getApiBaseEnv` を関数ごと消す場合は `grep -rn 'getApiBaseEnv' apps/web` も 0 件確認。
4. `typecheck` / `lint` / 対象 vitest（env / public fetch / instrumentation / server-fetch）で回帰確認。grep 0 件 ＝ typecheck 緑が両立して初めて完了。

---

## 7. リスクと対策

| リスク                                                                       | 対策                                                                                                                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.ts` の `?? env.PUBLIC_API_BASE_URL` を取りこぼし、env.ts 側だけ削除して型エラー / fallback 消失 | env.ts と public.ts を同一 PR で同時整理。削除後に `grep -rn 'PUBLIC_API_BASE_URL' apps/web \| grep -v 'NEXT_PUBLIC_API_BASE_URL'` 0 件を必須にする |
| wrangler.toml の片側だけ削除し、環境間で base URL 値が乖離                     | 旧キーは `NEXT_PUBLIC_API_BASE_URL` と常に同値の重複行 → 3 セクションの旧キー行をまとめて削除（値の付け替えではなく重複除去）。削除後に staging/production の `NEXT_PUBLIC_API_BASE_URL` が残っていることを確認 |
| spec のテスト名だけ旧キーが残り grep ガードが 0 件にならない                  | seed / assert / テスト名のすべてを `NEXT_PUBLIC_API_BASE_URL` へ移行。テスト意図（transport 選択）は保つ                                          |
| `getApiBaseEnv` を過剰削除して別所の参照を壊す                                | 関数削除は `grep -rn 'getApiBaseEnv' apps/web` 0 件を確認してからのみ実施。不安なら旧キー分岐のみ削除に留める                                     |
| Cloudflare Secret 側に旧キーが残っていると思い込み余計な mutation をする      | 旧キーは非機密 URL で `[vars]` 管理＝Secret には存在しない。`scripts/cf.sh` で確認するに留め secret put/delete は行わない（user-gated）           |

---

## 8. 実施ステータス・ゲート

- **status**: spec_created（仕様書のみ。実装・コード変更は未着手）
- **実装 / commit / PR は user-gated**: 本仕様書はタスク定義であり、実際のコード変更・`git commit`・`gh pr create`・GitHub Issue 起票はユーザーの明示承認後にのみ行う。
- **GitHub Issue**: [#1145](https://github.com/daishiman/UBM-Hyogo/issues/1145)（起票済・OPEN・`priority:low` / `type:improvement` / `type:refactoring` / `area:web` / `scale:small`）。
- **依存**: 起点 workflow `staging-api-url-and-session-recovery` の実装着地（`implemented_local_evidence_captured`）を前提とする。
