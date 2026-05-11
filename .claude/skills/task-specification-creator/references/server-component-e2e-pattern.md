# Server Component E2E パターン

Next.js App Router の Server Component / Server Action 系画面に対する Playwright E2E 仕様書を作成する際の正本パターン。
e2e-quality-uplift stage-3-impl 3b（e2e-tests-hard-gate）の Phase 12 skill-feedback で確立。

## 適用条件

- 対象画面が **Server Component** または `"use server"` で `fetch()` を server-side で発行する
- E2E でその `fetch()` 経路を mock したい / contract verify したい
- Phase 4 / 6 / 7 / 11 の test 設計と evidence に影響する

---

## 不変条件

### 1. `page.route()` を server-side fetch の evidence にしない

Playwright `page.route()` はブラウザの Network 層を hook するため、**Node.js プロセス（Worker / Next dev server）から発行される `fetch()` は捕捉できない**。Server Component から `fetch('https://api...')` した場合、`page.route()` で 200 / 404 を強制しても本物の上流が呼ばれ、テストは silent に false-PASS する。

**禁止**:

- Phase 2 / 4 のテスト設計で `page.route()` だけを mock 戦略として記載する
- Phase 11 evidence で `page.route()` 経由のレスポンス改変を server-side fetch の証拠に使う

### 2. 決定論的 mock API + seed + `INTERNAL_API_BASE_URL` 差し替えを Phase 2 / 4 / 11 に必須化

Server Component E2E では、以下 3 点をテスト設計 / evidence の必須要素とする:

| 要素 | 配置 | 役割 |
| --- | --- | --- |
| Deterministic mock API server | `scripts/e2e-mock-api.mjs` 等。Playwright `webServer` config で start | 上流 fetch を localhost に向ける |
| Seed data | `tests/e2e/fixtures/<domain>-seed.json` / `.sql` | mock API のレスポンス固定 |
| `INTERNAL_API_BASE_URL` 差し替え | `.env.test` / `playwright.config.ts` の `webServer.env` | Next dev server が mock API を上流とする |

仕様書記載例（Phase 2 / Phase 4）:

```markdown
## E2E mock 戦略

- Server Component 内 `fetch(env.INTERNAL_API_BASE_URL + '/members')` は `page.route()` で捕捉**不可**
- `scripts/e2e-mock-api.mjs` を Playwright `webServer` から起動し、`INTERNAL_API_BASE_URL=http://127.0.0.1:<port>` を webServer.env に注入
- Seed: `tests/e2e/fixtures/members-seed.json`
```

### 3. Phase 11 evidence は tracked file を canonical にする

`.gitignore` 対象の `*.log` を PASS 根拠にしない。canonical evidence は次のいずれか:

- `outputs/phase-11/evidence/e2e-run.txt`（tracked）
- `outputs/phase-11/evidence/e2e-summary.md`（tracked）
- `outputs/phase-11/evidence/playwright-report.json`（tracked）

`coverage/`, `test-results/`, `*.log` 等は補助 evidence。Phase 12 compliance check では tracked file の存在を root 判定に使う。

---

## Phase 別チェック

### Phase 2（要件 / scope）

- mock API 経路 / seed file path / `INTERNAL_API_BASE_URL` 差し替え方針を記載
- `page.route()` を server-side mock として使わないことを明記

### Phase 4（テスト設計）

- spec 一覧表に Server Component 経路 / Client Component 経路を区別
- Server Component spec は mock API + seed 経由で検証
- Client Component spec のみ `page.route()` を許可

### Phase 6 / 7（test 実装）

- `playwright.config.ts` の `webServer` に mock API server を追加
- env injection を `webServer.env` 経由で行う

### Phase 11（evidence）

- `e2e-run.txt`（tracked）に Playwright stdout を保存
- `coverage-summary.json` / lines coverage ≥ 80% を tracked file で保存
- `*.log` は補助のみ

### Phase 12（compliance）

- canonical evidence file が tracked か `git ls-files` で確認
- `page.route()` が server-side fetch evidence として使われていないことを `rg` で確認

```bash
# Server Component spec で page.route() が server fetch mock として誤用されていないか
rg -n "page\.route\(" tests/e2e/ | grep -i "server\|fetch" && echo "REVIEW" || echo "OK"
```

---

## 適用例（3b e2e-tests-hard-gate）

- `scripts/e2e-mock-api.mjs` を新設し、Playwright `webServer` で起動
- `.github/workflows/e2e-tests.yml` で mock API を Playwright 実行前に start
- `apps/web` の Server Component 由来 fetch を `INTERNAL_API_BASE_URL` で差し替え
- Phase 11 evidence は `e2e-run.txt` / `coverage-summary.json` を tracked で保存

## 関連 reference

- [quality-gates.md](quality-gates.md) — §7 テスト常時実行可能性 DoD / §7.5 E2E lines coverage ≥ 80%
- [phase-template-phase11.md](phase-template-phase11.md) — Phase 11 evidence canonical path
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) — tracked evidence rule
- [workflow-state-vocabulary.md](workflow-state-vocabulary.md) — runtime_pending / completed 区別
