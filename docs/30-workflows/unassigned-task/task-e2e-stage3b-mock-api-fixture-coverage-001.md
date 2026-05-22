# scripts/e2e-mock-api.mjs deterministic mock API の endpoint 網羅 + 契約テスト整備 - タスク指示書

## メタ情報

| 項目             | 内容                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| タスクID         | task-e2e-stage3b-mock-api-fixture-coverage-001                                      |
| タスク名         | scripts/e2e-mock-api.mjs deterministic mock API の endpoint 網羅 + 契約テスト整備   |
| 分類             | E2E test infrastructure / deterministic mock / contract test                        |
| 対象機能         | `scripts/e2e-mock-api.mjs` / `apps/api/src/routes/**` zod schema / Phase 11 evidence |
| 優先度           | HIGH                                                                                |
| 見積もり規模     | 中規模                                                                              |
| ステータス       | 未実施 (proposed)                                                                   |
| 親タスク         | e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate                              |
| サブタスク識別子 | 3b 後続 / mock-api fixture 強化                                                      |
| taskType         | test-infrastructure                                                                  |
| visualEvidence   | NON_VISUAL                                                                          |
| 発見日           | 2026-05-10                                                                          |
| 発見元           | 3b implementation-guide.md / phase-11.md / skill-feedback-report.md                  |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

3b（`e2e-tests-coverage-gate` hard gate 化）の実装サイクルで、Next.js Server Component の `fetch()` は `page.route()` で intercept 不可であることが Phase 11 evidence 取得段階で判明した。Stage 3 cycle 内で応急処置として `scripts/e2e-mock-api.mjs`（最小実装の Node http server）を新設し、`.github/workflows/e2e-tests.yml` で Playwright run 前に常駐起動させ、`apps/web` の `INTERNAL_API_BASE_URL` を `http://127.0.0.1:8787` に差し替える形で server-side fetch を捕捉している。

ただし `scripts/e2e-mock-api.mjs` 現状の責務は**「3b PR-B が green になるための最小endpoint だけ」**であり、以下の構造的弱点を残している。

### 1.2 問題点・課題

- 対応 endpoint が「3b spec が green になる最小集合」止まり: `/me`, `/me/profile`, `/me/visibility-request`, `/me/delete-request`, `/public/stats`, `/public/members`, `/public/members/m-1`, `/public/form-preview`, `/admin/dashboard`, `/admin/members`, `/admin/tags/queue`, `/admin/schema/diff`, `/admin/meetings`, `POST /admin/requests/*/resolve` のみ。`apps/api/src/routes/` 配下に存在する admin / requests / identity-conflicts / audit / tags-detail などの endpoint は未対応。`POST/PATCH/DELETE` 全般が `{ ok: true }` 固定で fallthrough しており、shape 検証なしで silent pass する。
- mock のレスポンス shape が `apps/api` 側 zod schema と乖離しても CI が気付けない（contract test 未整備）。例: `publicProfile.publicSections[].fields[].kind` の enum 値、`pagination` の field 名、`statusSummary` の field 名は人手でコピーしているため drift しやすい。
- seed データが grep で「ヒットすればパス」する単一 member（`m-1` / 山田 太郎）のみ。pagination / 検索 facet / zoning / membership type の variation を持つ E2E（例: `search-density.spec.ts`, `public-top-and-list.spec.ts`）が将来増えると都度 mock を書き換えるしかなく、spec が増えるたびに mock の保守負債が雪だるま式に増える。
- `apps/api/src/routes/**` 側に zod schema 共有 export 経路がない。`apps/web/src/lib/fetch/public.ts` で response を parse している zod schema は web 側の private 定義であり、`apps/web` ↔ `apps/api` ↔ `scripts/e2e-mock-api.mjs` の 3 拠点で同じ shape を 3 重定義している。
- `e2e-tests.yml` は mock を起動するだけで health check / readiness wait / failure log capture を行わない。port 競合や mock crash が test failure として「endpoint 404」の形でしか観測されず、原因切り分けに時間がかかる。

### 1.3 放置した場合の影響

- E2E spec が増えるたび `scripts/e2e-mock-api.mjs` を場当たり的に拡張することになり、API 側の正本 schema との drift が累積する。drift は coverage 上は 80% を満たしても「shape が違うのに pass する」silent failure となり、本番 staging で初めて発見される。
- Stage 3c 以降で hard gate を branch protection に組み込んでも、mock 側のごまかしで通過する PR を弾けず、hard gate の意味が形骸化する。
- mock 側で zod parse を行わない限り、`apps/api` に新 endpoint を追加した日から「API は実装済みなのに UI E2E は古い shape のまま green」という状態が無期限に続く。

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/e2e-mock-api.mjs` を「3b 用の最小実装」から「`apps/api` の zod schema を正本として `apps/web` E2E が必要とする全 endpoint を網羅し、shape drift を contract test で検出できる deterministic mock」に昇格させる。

### 2.2 最終ゴール（AC）

- **AC-MOCK-01**: `apps/api/src/routes/**` で実装されている全 endpoint のうち `apps/web` E2E が叩く全パスに対し、mock がレスポンスを返す。`/v1/public/members`, `/v1/public/members/[id]`, `/v1/me`, `/v1/me/profile`, `/v1/me/visibility-request`, `/v1/me/delete-request`, `/v1/admin/dashboard`, `/v1/admin/members`, `/v1/admin/tags/queue`, `/v1/admin/schema/diff`, `/v1/admin/meetings`, `/v1/admin/requests/*`, `/v1/admin/identity-conflicts`, `/v1/admin/audit`, `/v1/public/stats`, `/v1/public/form-preview` を最低限カバーする。
- **AC-MOCK-02**: 各 endpoint のレスポンスは `apps/api` 側 zod schema を `packages/contracts/`（または `apps/api/src/contracts/`）から共有 export し、mock 側で `schema.parse(payload)` を必ず通してから `res.end()` する。parse 失敗時は HTTP 500 + body に zod issue を返す。
- **AC-MOCK-03**: `scripts/__tests__/e2e-mock-api.contract.test.ts`（Vitest）を新設し、各 endpoint に対し `node scripts/e2e-mock-api.mjs` を起動 → fetch → web 側 zod schema で parse することを契約として assert する。CI（既存 `unit-tests` workflow）から実行する。
- **AC-MOCK-04**: seed データに最低限 member 3 件（pagination 検証用）/ zone facet 2 種類 / membership type 2 種類 / 検索 negative case（`zzz_no_match_zzz`）/ tag facet 2 種類を含める。spec が拡張されても mock 側 seed の shape を変えずに済む構造にする。
- **AC-MOCK-05**: `e2e-tests.yml` で mock 起動後に `curl --retry 5 http://127.0.0.1:8787/health` で readiness wait し、Playwright 起動前に必ず健康状態を確認する。`/tmp/e2e-mock-api.log` を CI artifact として `actions/upload-artifact@v4` で取得可能にする（retention 7 日）。

### 2.3 検証エビデンス

- `scripts/__tests__/e2e-mock-api.contract.test.ts` が CI で green
- `apps/api` の zod schema を意図的に 1 field rename した dummy PR で contract test が fail することを観測
- mock readiness wait の `curl` が `connection refused` でリトライした後 200 を返すログ
- E2E run 中に mock が捕捉した request 一覧（`/tmp/e2e-mock-api.log`）が artifact として download 可能

### 2.4 スコープ

#### 含むもの

- `scripts/e2e-mock-api.mjs` の endpoint 網羅 + zod parse 必須化
- `apps/api` の zod schema を共有可能な形に export（`apps/api/src/contracts/` or `packages/contracts/` を新設）
- `scripts/__tests__/e2e-mock-api.contract.test.ts` 新規（Vitest）
- `.github/workflows/e2e-tests.yml` mock 起動 step の readiness wait + log artifact 化
- seed データの variation 拡充（`scripts/e2e-mock-api.fixtures.ts` に分離可）

#### 含まないもの

- `apps/api` の endpoint 追加・schema 変更（既存 endpoint surface 不変）
- D1 migration / Cloudflare Workers staging への依存追加
- `apps/web` の adapter 層変更（既存 `apps/web/src/lib/fetch/public.ts` の API は維持）
- 3a Lighthouse CI / 3c branch protection への影響

### 2.5 成果物

- `scripts/e2e-mock-api.mjs`（major edit / endpoint 網羅 + zod parse）
- `scripts/e2e-mock-api.fixtures.ts`（新規 / seed データ集約）
- `apps/api/src/contracts/index.ts`（新規 / 共有 zod schema export）または `packages/contracts/`
- `scripts/__tests__/e2e-mock-api.contract.test.ts`（新規 / Vitest contract test）
- `.github/workflows/e2e-tests.yml`（edit / readiness wait + mock log artifact step 追加）
- `pnpm-lock.yaml` 更新（必要に応じ）
- Phase 11 evidence: `outputs/phase-11/evidence/{mock-endpoint-coverage.txt, mock-contract-test.txt, mock-readiness-log.txt}`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 3b（`e2e-tests-coverage-gate` hard gate 化）が dev に merge 済み
- `mise exec -- pnpm install` / `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が green
- `apps/api/src/routes/**` の現行 endpoint surface を変更しないこと（不変条件）

### 3.2 依存関係

- **depends-on**: `task-e2e-stage3b-e2e-tests-hard-gate-001`（3b 完了後に着手）
- **blocks**: なし（独立だが、後続 spec 拡張時の前提インフラとなる）
- **関連**: `task-task-spec-creator-e2e-template-hardening-001`（task-specification-creator skill の e2e template hardening / Phase 2/4 で mock 計画を必須化）/ `task-e2e-stage3b-rb-followup-composite-actions-001`（CI workflow refactor との順序整合）

### 3.3 zod schema 共有方針

`apps/api` 側で zod schema を持っていることが前提。共有経路は次の 2 案からプロジェクトポリシーに合致する方を Phase 7 で確定する。

| 案 | 配置 | 利点 | 欠点 |
|----|------|------|------|
| A: `apps/api/src/contracts/index.ts` re-export | apps/api 配下 | 移動コスト最小 | `scripts/` から `apps/api` への import 経路が monorepo 設定に依存 |
| B: `packages/contracts/` 新設 | workspace package | `apps/web` / `apps/api` / `scripts/` から等距離 | 新パッケージ追加コスト |

> 既存 `packages/integrations/` の構成と整合性を取り、案 B（`packages/contracts/`）を第一候補とする。Phase 2 で `pnpm-workspace.yaml` 影響を確認すること。

### 3.4 contract test の構造

```ts
// scripts/__tests__/e2e-mock-api.contract.test.ts（抜粋）
import { spawn } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@ubm-hyogo/contracts";

const PORT = 18787;
let proc: ReturnType<typeof spawn>;

beforeAll(async () => {
  proc = spawn("node", ["scripts/e2e-mock-api.mjs"], {
    env: { ...process.env, E2E_MOCK_API_PORT: String(PORT) },
    stdio: "pipe",
  });
  await waitForHealth(`http://127.0.0.1:${PORT}/health`);
});

afterAll(() => proc?.kill());

describe("mock API contract", () => {
  it("GET /v1/public/members matches PublicMembersResponse", async () => {
    const r = await fetch(`http://127.0.0.1:${PORT}/v1/public/members`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(() => schema.PublicMembersResponse.parse(body)).not.toThrow();
  });
  // ... 各 endpoint
});
```

### 3.5 mock readiness wait（`e2e-tests.yml`）

```yaml
- name: Start deterministic mock API
  run: node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api.log 2>&1 &

- name: Wait for mock API readiness
  run: |
    for i in $(seq 1 20); do
      if curl -fs http://127.0.0.1:8787/health > /dev/null; then
        echo "[mock] ready after ${i} attempt(s)"; exit 0
      fi
      sleep 1
    done
    echo "[mock] not ready after 20s"; cat /tmp/e2e-mock-api.log; exit 1

- name: Upload mock API log (always)
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: e2e-mock-api-log-${{ github.sha }}
    path: /tmp/e2e-mock-api.log
    retention-days: 7
```

### 3.6 ローカル検証手順

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/contracts build  # packages/contracts 採用時
mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.test.ts
mise exec -- node scripts/e2e-mock-api.mjs &
mise exec -- pnpm --filter @ubm-hyogo/web e2e
```

---

## 4. 受入基準

| # | 基準 | 確認方法 |
|---|------|---------|
| AC-MOCK-01 | `apps/web` E2E が叩く全 endpoint に mock 実装あり | `grep -rn 'INTERNAL_API_BASE_URL\|/v1/' apps/web/src` と mock の handler 突き合わせ |
| AC-MOCK-02 | 全レスポンスが zod parse を通る | contract test green |
| AC-MOCK-03 | contract test が CI で実行され、schema drift で fail する | dummy PR で 1 field rename → fail 観測 |
| AC-MOCK-04 | seed データに pagination / facet variation あり | `scripts/e2e-mock-api.fixtures.ts` の export を grep |
| AC-MOCK-05 | mock readiness wait + log artifact 取得可 | CI run の artifact ダウンロード |

---

## 5. 苦戦箇所と将来の解決指針【記入必須】

### 5.1 Server Component E2E が `page.route()` で捕捉できない構造的問題

- Next.js App Router の Server Component の `fetch()` は Node ランタイム側で実行されるため、Playwright の `page.route()`（ブラウザ側 intercept）では一切捕捉できない。3b cycle の Phase 11 evidence 取得時にこの構造を初めて発見し、`scripts/e2e-mock-api.mjs` を急遽追加する事態となった。
- 今後は **Phase 2（要件定義）/ Phase 4（設計）の段階で「server fetch を含むか」を判定し、含むならば mock API 計画を必須セクションとして書き起こす**運用に揃える。task-specification-creator skill の e2e template hardening（`task-task-spec-creator-e2e-template-hardening-001`）と連動する必要がある。
- 将来的には `apps/web/src/lib/fetch/server.ts` を導入し、`process.env.INTERNAL_API_BASE_URL` を必ず経由する設計に揃え、E2E 時のみ mock に流す構造を恒久化する。

### 5.2 zod schema 3 重定義の解消順序

- 現状 `apps/web/src/lib/fetch/public.ts` 側の zod schema と `apps/api` 側 schema は手動コピー。さらに mock 側で 3 重目を持つと drift が拡大するため、**最初に packages/contracts を新設し、`apps/api` を移行 → `apps/web` を移行 → mock を移行**の順序が安全。逆順は web 側が古い schema を import し続け type error の山になる。
- workspace package 追加は `pnpm-workspace.yaml` / `tsconfig.base.json` paths / Cloudflare Workers bundling（`@opennextjs/cloudflare`）の解決順を全部触るため、Phase 7 で必ず `mise exec -- pnpm --filter @ubm-hyogo/web build` を流して webpack（Next.js 16 production build は Turbopack 不可、`next build --webpack` 正本）で virtual module specifier が壊れないかを確認する。

### 5.3 mock の seed データを「ヒットさせる側」と「外す側」両方で deterministic にする

- 現状 mock は `q === "zzz_no_match_zzz"` を hard-coded で空配列扱いしている。seed variation を増やすと「特定 keyword は何件返すべきか」を spec ごとに把握する負荷が増える。
- 対策として seed を `Member[]` の配列で持ち、handler 側で `q.toLowerCase().includes(...)` の素朴な filter を行う。spec 側は「`q="taro"` で 1 件、`q="zzz"` で 0 件」のような契約を README に明記する。`scripts/e2e-mock-api.fixtures.ts` 冒頭にコメントで契約を残す。

### 5.4 `INTERNAL_API_BASE_URL` の境界

- `apps/web/wrangler.toml` の `[vars]` に焼き付けると production まで mock 経由になる事故が起きる。**`apps/web/src/lib/env.ts:getEnv()` 経由の zod 検証**で「localhost / 127.0.0.1 を許容するのは E2E 環境のみ」というガードを書く。task-18 の grep gate（`apps/web/src` 配下に `127.0.0.1:8888` のような localhost を焼き込まない）と整合。
- mock port は `E2E_MOCK_API_PORT` env で override 可能にし、CI の port 衝突時に逃げ道を残す。

### 5.5 contract test の起動コスト

- contract test は mock を spawn する都合で unit test より遅い。`scripts/__tests__/` 配下に置くことで Vitest の `include` から外し、`pnpm vitest run scripts/__tests__/e2e-mock-api.contract.test.ts` を `e2e-tests.yml` の Playwright 実行**前**に走らせ、mock 自体が壊れている場合は E2E 開始前に fail させる。これにより「30 分の Playwright run の終盤で mock の shape ミスが原因で fail」の不毛な切り分けを排除できる。

---

## 6. 影響範囲

| パス | 変更内容 |
|------|---------|
| `scripts/e2e-mock-api.mjs` | major edit（endpoint 網羅 + zod parse 必須化） |
| `scripts/e2e-mock-api.fixtures.ts` | 新規（seed データ集約） |
| `scripts/__tests__/e2e-mock-api.contract.test.ts` | 新規（Vitest contract test） |
| `apps/api/src/contracts/index.ts` または `packages/contracts/` | 新規（共有 zod schema export） |
| `pnpm-workspace.yaml` | edit（packages/contracts 採用時） |
| `.github/workflows/e2e-tests.yml` | edit（readiness wait + log artifact step 追加） |
| `pnpm-lock.yaml` | 自動更新 |

---

## 7. 不変条件

1. **`apps/api` 既存 endpoint surface 不変**: 本タスクは mock + contract test のみで、API endpoint 追加・schema 変更を含まない。
2. **D1 直接アクセス禁止**: mock 化に伴い `apps/web` から D1 を叩く差分を生まない。
3. **`apps/web` env アクセスは `getEnv()` 経由**: `INTERNAL_API_BASE_URL` の追加も `apps/web/src/lib/env.ts` 経由で行い、`process.env.*` 直接参照禁止（CLAUDE.md `apps/web` env アクセス不変条件遵守）。
4. **`wrangler` 直叩き禁止**: 本タスクは Cloudflare CLI 不要だが、副次的に必要となった場合は `bash scripts/cf.sh` 経由のみ。
5. **Node 24 / pnpm 10 固定**: 全コマンドは `mise exec -- pnpm` 経由。`.mise.toml` 値を改変しない。
6. **OKLch トークン正本化**: 本タスクは UI を編集しない（NON_VISUAL）。
7. **CONST_007 single cycle**: Phase 11 evidence は canonical path 1 セットのみ。

---

## 8. 参照情報

- 仕様根拠: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-12/implementation-guide.md`
- 構造発見根拠: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/outputs/phase-12/skill-feedback-report.md` §「Server Component E2E specs must not treat `page.route()` as proof for server-side `fetch()` paths」
- 現状 mock 実装: `scripts/e2e-mock-api.mjs`
- 現状 CI workflow: `.github/workflows/e2e-tests.yml`
- 関連: `task-task-spec-creator-e2e-template-hardening-001`（skill 側 template の Phase 2/4 強化）
- フォーマット参照: `docs/30-workflows/unassigned-task/task-e2e-stage3b-e2e-tests-hard-gate-001.md`
- 関連スキル: `task-specification-creator` / `aiworkflow-requirements`

---

## 9. 備考

- 3b 完了直後の最優先 follow-up。3a / 3c とは独立で実施可能だが、3c の `e2e-tests-coverage-gate` required check が機械的に green になり続ける限り表面化しない silent failure を取り除く役割を担う。
- mock crash や port 競合による「endpoint 404」誤検知は `mock-readiness-log.txt` artifact で 1 次切り分けできるようにする。
- 将来 Cloudflare Workers staging で E2E を流す段階に進んだ際、本タスクの contract test は staging 側 endpoint に対しても再利用可能（mock を staging URL に差し替えるだけ）。投資の二重化にならない構造を Phase 4 で意識する。
