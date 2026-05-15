# apps/web fetch/public.ts HTTP fallback 優先化に対する production service binding regression テスト追加 - タスク指示書

## メタ情報

| 項目             | 内容                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| タスクID         | task-e2e-stage3b-fetch-public-service-binding-priority-regression-001                           |
| タスク名         | fetch/public.ts HTTP fallback 優先化の production service binding regression テスト追加         |
| 分類             | regression test / 環境別優先度ガード / production safety                                        |
| 対象機能         | `apps/web/src/lib/fetch/public.ts` の transport 選択ロジック / public API 経由の D1 間接アクセス |
| 優先度           | HIGH                                                                                            |
| 見積もり規模     | 小〜中規模                                                                                      |
| ステータス       | consumed by `docs/30-workflows/issue-666-fetch-public-service-binding-regression/` on 2026-05-14 |
| 親タスク         | e2e-quality-uplift-stage-3-impl / 3b-e2e-tests-hard-gate                                        |
| サブタスク識別子 | Stage 3b regression follow-up                                                                   |
| taskType         | regression-test                                                                                 |
| visualEvidence   | NON_VISUAL                                                                                      |
| 発見日           | 2026-05-10                                                                                      |
| 発見元           | 3b/outputs/phase-12/implementation-guide.md（HTTP fallback 優先化の副作用検討）                 |

---

> Canonical Status: consumed by Issue #666 workflow on 2026-05-14. This file remains as a historical pointer only; do not execute it as an open unassigned task.

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

3b (`task-e2e-stage3b-e2e-tests-hard-gate-001`) では Playwright CI 上で Server Component の server-side `fetch()` を deterministic mock 化するため、`apps/web/src/lib/fetch/public.ts` に以下の優先度変更を入れた（3b/outputs/phase-12/implementation-guide.md 該当行抜粋）。

> Historical source wording: `PUBLIC_API_BASE_URL` 明示時に HTTP fallback を優先し、local / Playwright E2E の mock API 差し替えを成立させる。Issue #666 実装ではこの優先を `NODE_ENV=test` / `PLAYWRIGHT_TEST=1` に限定し、production / staging は service binding 優先を維持する。

具体的には `getServiceBinding()` が `process.env.PUBLIC_API_BASE_URL` の存在を検出した時点で `undefined` を返し、`doFetch()` の経路を強制的に HTTP fallback（`fetch(${baseUrl}${path})`）に倒す。これにより Playwright CI で `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` / `PUBLIC_API_BASE_URL=http://127.0.0.1:8787` を設定するだけで Server Component の server-side fetch が `scripts/e2e-mock-api.mjs` を叩けるようになる。

### 1.2 問題点・課題

- production / staging の Cloudflare Workers では「同一 account workers.dev への外向き fetch loopback で 404 になる」事象を回避するため、本来 service binding (`API_SERVICE.fetch()`) を **必ず優先** する設計だった（`apps/web/src/lib/fetch/public.ts:5-8` のコメント参照）。
- 旧ロジック（`getServiceBinding()` の早期 return）は E2E mock のためにこの優先度を反転させていたため、**production の wrangler.toml に `PUBLIC_API_BASE_URL` が誤って `[vars]` で設定された瞬間に service binding が silent にスキップされ、外向き fetch 経路に倒れる**。Cloudflare の同一 account loopback 404 が再発し、production の公開ディレクトリが degraded する production-impact regression を生む。
- さらに悪いのは、この regression が「fetch が成功する別 endpoint（例: 自前 reverse proxy）」を `PUBLIC_API_BASE_URL` に設定した場合、HTTP 200 を返すが service binding を通っていないため CLAUDE.md 不変条件 #5（`apps/web` から D1 直接アクセス禁止 / D1 アクセスは `apps/api` に閉じる）の意図が形骸化する。service binding を通らないと「同一 Workers runtime 内で D1 binding 経由で完結する」前提が崩れ、外向きトラフィックが Cloudflare zero-trust 境界を越えて流出するリスクが残る。
- 既存テスト `apps/web/src/lib/fetch/public.test.ts` は HTTP fallback パスと service binding パスの両方を検証しているが、「`PUBLIC_API_BASE_URL` 明示 + service binding 同時存在」というまさに regression が起きうる状況下で「service binding が呼ばれないこと」を assert する production-context test が欠落している。

### 1.3 放置した場合の影響

- production の `wrangler.toml` に `PUBLIC_API_BASE_URL` が誤って `[env.production.vars]` 経由で設定されると、service binding スキップが silent に発生する。観測経路がないため deploy 後に degraded 状態が長期間継続する可能性。
- 不変条件 #5（D1 直接アクセス禁止 / API surface は `apps/api` に閉じる）の安全性が deploy 時の env 変数設定に暗黙依存することになる。env 配置の単純なミスが production data plane の境界を破る。
- Cloudflare zero-trust 越境のセキュリティリスク（service binding は account 内 worker-to-worker 通信に閉じられているが、外向き fetch は `https` で出ていく）。
- 後続 task で `apps/web/wrangler.toml` の `[vars]` を編集した PR レビュー時に、この regression を検出する自動 gate が存在しないため、レビュー漏れが直接 production-impact になる。

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/src/lib/fetch/public.ts` の HTTP fallback 優先化を「環境別に明示ガードされたロジック」に書き直し、production / staging Cloudflare Workers では service binding が必ず最優先されるよう保証する。あわせて regression を検出する unit test を `apps/web/src/lib/fetch/public.test.ts` に追加し、`pnpm typecheck` / `pnpm test` が Playwright CI で gate するようにする。

### 2.2 最終ゴール（AC 引用）

本タスク独自 AC を以下に定義する（親 3b の AC とは独立）。

- **AC-R-01**: `process.env.NODE_ENV === 'test'` または `process.env.PLAYWRIGHT_TEST === '1'` のいずれかが真の場合のみ、`PUBLIC_API_BASE_URL` 明示時に HTTP fallback を service binding より優先する。それ以外（production / staging Cloudflare Workers runtime）では service binding を **必ず最優先** とし、`PUBLIC_API_BASE_URL` の存在は service binding を skip する条件にしない。
- **AC-R-02**: `apps/web/src/lib/fetch/public.test.ts` に「production context（上記 env いずれも未設定）+ service binding あり + `PUBLIC_API_BASE_URL` 明示」の状態で `binding.fetch` が呼ばれ、`global.fetch` が呼ばれないことを assert する regression test を追加する。
- **AC-R-03**: 同 test ファイルに「`CI=true` だが `PLAYWRIGHT_TEST` 未設定 + service binding あり + `PUBLIC_API_BASE_URL` 明示」の状態で `binding.fetch` が呼ばれ、`global.fetch` が呼ばれないことを assert する。GitHub Actions build/deploy で `CI=true` が立つことへの安全策。
- **AC-R-04**: 既存 3b CI E2E（`feat/e2e-coverage-gate` 上の `e2e-tests-coverage-gate` job）が引き続き green。HTTP fallback 経路が Playwright CI で機能していることを再確認する。
- **AC-R-05**: `apps/web/src/lib/env.ts` の `getEnv()` 経路と整合する形で実装する（`process.env.*` 直参照は最小限・既存パターンに揃える）。

### 2.3 検証エビデンス

- `apps/web/src/lib/fetch/public.test.ts` の追加 test が `pnpm --filter @ubm-hyogo/web test` で green。
- 追加 test を一時的に逆 assertion（`expect(binding.fetch).not.toHaveBeenCalled()`）に書き換えると red になることを `git diff` で示し、test が実際に挙動を検証していることを確認。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` が exit 0。
- 3b CI E2E run が green（`task-e2e-stage3b-runtime-pr-evidence-execution-001` の `pr-b-e2e-run.txt` に `conclusion: success`）。

### 2.4 スコープ

#### 含むもの

- `apps/web/src/lib/fetch/public.ts` の `getServiceBinding()` ロジックに環境ガード（`isTestOrPlaywright()` ヘルパ）を追加。
- `apps/web/src/lib/fetch/public.test.ts` に AC-R-02 / AC-R-03 の 2 ケース追加（合計 +2 テスト最小、関連 edge case を含めて +3〜5 テスト目安）。
- 内部コメント更新（`apps/web/src/lib/fetch/public.ts:5-8` の経路コメントに環境ガードを反映）。
- `docs/00-getting-started-manual/specs/` 内 fetch/public 該当箇所がある場合のみ env 優先度の記述を追加。

#### 含まないもの

- `apps/api` endpoint surface 変更。
- `apps/web/wrangler.toml` の `[vars]` / `[env.production.vars]` 編集（本 regression test の目的は「誤って設定された場合に production が壊れないこと」を保証することであり、現状の wrangler.toml に手を入れる必要はない）。
- `getEnv()` / `getPublicEnv()` の zod schema 変更（既存 schema を維持）。
- 3b workflow / CI gate の変更（本タスクは unit test 追加のみで、e2e workflow は触らない）。
- D1 schema / Google Form schema の変更。

### 2.5 成果物

- `apps/web/src/lib/fetch/public.ts`（minor edit / 環境ガード追加）
- `apps/web/src/lib/fetch/public.test.ts`（+2..5 テスト追加）
- 必要に応じて `docs/00-getting-started-manual/specs/` 内の関連仕様（`01-api-schema.md` 等）に env 優先度を追記
- Phase 11 evidence: 新規 test の `pnpm test` 実行ログを `outputs/phase-11/evidence/` に保存（canonical 4 点に追加せず、本 spec の outputs/ 配下に独立配置）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 3b 実装（`apps/web/src/lib/fetch/public.ts` の HTTP fallback 優先化）が `feat/e2e-coverage-gate` または dev に merge 済み。
- `mise exec -- pnpm install` 完了。
- `pnpm typecheck` / `pnpm lint` がローカル green。

### 3.2 依存関係

- **depends-on**: `task-e2e-stage3b-e2e-tests-hard-gate-001`（HTTP fallback 優先化の実装）
- **soft-related**: `task-e2e-stage3b-runtime-pr-evidence-execution-001`（同 PR 上で CI green を再確認）
- **history**: `task-05a-fetchpublic-service-binding-001`（service binding 不在時の fallback 設計 / 本タスクは逆方向の production-impact regression に対する追加ガード）

### 3.3 実装手順

#### 3.3.1 環境判定ヘルパの追加

`apps/web/src/lib/fetch/public.ts` に以下を追加する想定。

```ts
function isTestOrPlaywright(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "1"
  );
}

function getServiceBinding(): ServiceBinding | undefined {
  // test / Playwright 時は PUBLIC_API_BASE_URL を明示できる場合に HTTP fallback を優先（mock API 差し替えのため）
  if (isTestOrPlaywright() && process.env.PUBLIC_API_BASE_URL) return undefined;
  // production / staging では PUBLIC_API_BASE_URL の有無に関わらず service binding を最優先
  return readEnv().API_SERVICE;
}
```

> `isTestOrPlaywright()` の env 判定 3 種は CI ランナー / Playwright runner / vitest の代表値。GitHub Actions は `PLAYWRIGHT_TEST=1` / Playwright は `PLAYWRIGHT_TEST=1`（`apps/web/playwright.config.ts` で設定可）/ vitest は `NODE_ENV=test`。

#### 3.3.2 unit test 追加

`apps/web/src/lib/fetch/public.test.ts` に以下シナリオを追加。

| ケース | env 設定 | service binding | `PUBLIC_API_BASE_URL` | 期待 transport |
|--------|----------|-----------------|-----------------------|----------------|
| AC-R-02 production | NODE_ENV=production, CI=未設定, PLAYWRIGHT_TEST=未設定 | あり | `https://wrong-fallback.example.com` | service-binding |
| AC-R-03 CI | PLAYWRIGHT_TEST=1 | あり | `http://127.0.0.1:8787` | http-fallback |
| edge-1 staging | NODE_ENV=production, CI=未設定 | あり | 未設定 | service-binding |
| edge-2 local dev | NODE_ENV=development | なし | `http://localhost:8787` | http-fallback |

実装上は `vi.stubEnv()` / `vi.unstubAllEnvs()` または既存 test の env mock 経路に揃える。`getCloudflareContext()` は既に `vi.mock('@opennextjs/cloudflare', ...)` 系で mock されているはずなので踏襲。

#### 3.3.3 検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web build   # OpenNext Workers build で副作用ないことを確認
```

#### 3.3.4 逆 assertion による test 妥当性確認

`AC-R-02` の test を一時的に `expect(binding.fetch).not.toHaveBeenCalled()` に逆書きし、`pnpm test` が **fail** することを確認。元に戻して green に復帰させる。この差分は commit しない（`git diff` の手元観測のみで evidence とする）。

### 3.4 既存仕様との整合確認

- `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` を経由しない `process.env.*` 直参照は本タスクで増やさず、`isTestOrPlaywright()` ヘルパに閉じる。CLAUDE.md「`apps/web` env アクセス不変条件」に整合。
- `getBaseUrl()` の `process.env.PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL` 順序は変更しない（fallback 値の優先度は本タスクのスコープ外）。
- `logTransport()` の `transport: 'service-binding' | 'http-fallback'` ラベルは保持し、production の Workers ログから transport が観測可能な状態を維持。

---

## 4. 苦戦箇所【記入必須】

### 4.1 `apps/web` env 不変条件と Playwright E2E mock 要件の衝突

- CLAUDE.md の `apps/web` env 不変条件は「env 参照は `getEnv()` / `getPublicEnv()` 経由のみ」「`process.env.*` 直参照禁止」を求める。一方、本タスクの `isTestOrPlaywright()` は厳密にはこの不変条件のグレーゾーン。
- 解決方針: `isTestOrPlaywright()` は env を読む唯一のヘルパとし、`getEnv()` schema に `NODE_ENV` / `PLAYWRIGHT_TEST` を追加するのではなく、「test runtime 判定は zod schema の対象外」と明示的に位置づける。コメントで「test runtime 判定は env 不変条件の例外」と明記する。
- 過剰に `getEnv()` schema へ test 判定を入れると、production runtime で `getEnv()` が test env を要求する誤シグナルになる。

### 4.2 production Cloudflare Workers 上での test env 混入

- Cloudflare Workers runtime では `process.env` は wrangler.toml の `[vars]` から自動 expose される。production deploy で誤って `PLAYWRIGHT_TEST=1` が `[vars]` に入っていると、本タスクのガードが production でも HTTP fallback を選ぶ。
- 解決方針: `wrangler.toml` の `[env.production.vars]` / `[env.staging.vars]` に `NODE_ENV=test` / `PLAYWRIGHT_TEST` のいずれかが含まれていないことを grep gate で確認する。`CI=true` は GitHub Actions build/deploy で立つため transport 判定には使わない。

### 4.3 service binding と HTTP fallback の同時 mock が困難

- vitest で `binding.fetch` と `global.fetch` の両方を spy する必要がある。`global.fetch` は既存 test で `vi.fn()` 化されているはずだが、`binding.fetch` は `getCloudflareContext()` mock 経由で注入する必要がある。
- 解決方針: 既存 `public.test.ts` の `vi.mock('@opennextjs/cloudflare', ...)` パターンを踏襲し、`API_SERVICE: { fetch: vi.fn() }` を返す mock を test ごとに setup する。`afterEach` で `vi.clearAllMocks()` を確実に。

### 4.4 既存 task-05a との設計方向の差

- `task-05a-fetchpublic-service-binding-001` は「service binding 不在時に外向き fetch にフォールバックする」設計を確立した。本タスクは「service binding 存在時に外向き fetch を優先する CI 経路」が production に侵食する regression を防ぐ追加ガードであり、設計方向は逆。コードコメントで両者の関係を明記し、将来 reader が混乱しないようにする。

### 4.5 OpenNext build / Cloudflare Workers での `process.env.NODE_ENV` 既定値

- OpenNext (`@opennextjs/cloudflare`) の build 時に `process.env.NODE_ENV` が `production` で固定される挙動と、Cloudflare Workers runtime での値が常に `production` になる挙動の差を確認する必要がある。`isTestOrPlaywright()` が常に false を返すことを期待するが、Edge runtime での `process.env` polyfill 仕様に依存。
- 解決方針: `apps/web/build` 後の Workers bundle で `isTestOrPlaywright()` が常に false を返すことを bundle 静的解析（grep）で確認するスモーク test を追加で検討。本タスクのスコープには含めず、別 spec で扱う場合の hand-off 候補として記録。

---

## 5. 影響範囲

| パス | 変更内容 |
|------|---------|
| `apps/web/src/lib/fetch/public.ts` | minor edit（`isTestOrPlaywright()` 追加 / `getServiceBinding()` の早期 return 条件を環境ガード化 / コメント更新） |
| `apps/web/src/lib/fetch/public.test.ts` | テスト追加（AC-R-02 / AC-R-03 + edge cases、+2..5 ケース） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 必要時に env 優先度を補足（任意） |

> `apps/web/wrangler.toml` / `.github/workflows/e2e-tests.yml` / `scripts/e2e-mock-api.mjs` / `apps/web/playwright.config.ts` には触らない。

---

## 6. 推奨タスクタイプ

regression-test / NON_VISUAL（unit test 追加 + 小規模ロジック edit のみで UI 描画変更を含まない）

---

## 7. 不変条件

1. **D1 直接アクセス禁止**: `apps/web` から D1 binding を直接呼ぶ差分を生まない。
2. **`apps/web` env 不変条件**: env 参照は基本的に `getEnv()` / `getPublicEnv()` 経由とし、test runtime 判定 (`isTestOrPlaywright()`) はその例外として 1 箇所に閉じる。
3. **service binding 最優先（production / staging）**: `process.env.PUBLIC_API_BASE_URL` の有無に関わらず production runtime では service binding を skip しない。
4. **既存 API endpoint surface 不変**: `apps/api` の endpoint 追加・schema 変更は伴わない。
5. **OKLch トークン正本化**: 本タスクは UI を編集しない（NON_VISUAL）。
6. **`wrangler` 直叩き禁止**: 本タスクは Cloudflare CLI を呼ばない。
7. **secrets を test fixture に書かない**: API token / OAuth token を test code に転記しない。mock URL は `http://127.0.0.1:8787` / `https://wrong-fallback.example.com` などプレースホルダのみ。
8. **既定 PR base は `dev`**: 本タスクの PR は `--base dev` で作成。

---

## 8. 参照情報

- 仕様根拠: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-12/implementation-guide.md`（HTTP fallback 優先化の記述）
- 親 spec: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 実コード現状: `apps/web/src/lib/fetch/public.ts:1-115`
- 既存 test: `apps/web/src/lib/fetch/public.test.ts`
- 関連先行タスク: `task-05a-fetchpublic-service-binding-001`（service binding 不在時の fallback 設計 / 逆方向）
- CLAUDE.md `apps/web env アクセス不変条件`（task-02 wrangler-env-injection）
- CLAUDE.md 不変条件 #5（D1 直接アクセス禁止）
- フォーマット参照: `docs/30-workflows/unassigned-task/task-e2e-stage3b-e2e-tests-hard-gate-001.md`
- 関連スキル: `task-specification-creator` / `aiworkflow-requirements`

---

## 9. 備考

- 本タスクの本質は「3b で CI 都合のために設計された fallback 優先化を、production safety net で隔離する」regression engineering。3b 実装の正当性を否定するものではなく、production 侵食を防ぐ追加ガード。
- `wrangler.toml` の `[vars]` 検査（`CI` / `NODE_ENV=test` 等が production env に混入していないことの grep gate）は task-18 regression smoke 系列に hand-off 候補として記録するが、本タスクには含めない（責務分離）。
- `isTestOrPlaywright()` の env 判定キーセットは将来 vitest / Playwright / GitHub Actions 以外の test runtime（例: Cypress / WebdriverIO）を導入する際に拡張する想定。現状 3 種で必要十分。
- 本タスクは `task-e2e-stage3b-runtime-pr-evidence-execution-001` と同時に進めても良いが、独立してマージ可能（`feat/e2e-coverage-gate` 直下 commit / 別 feature branch どちらでも可）。
