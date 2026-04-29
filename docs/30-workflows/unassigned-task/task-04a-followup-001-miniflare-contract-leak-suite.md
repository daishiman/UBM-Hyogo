## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | task-04a-followup-001-miniflare-contract-leak-suite |
| タスク名     | miniflare ベース contract / integration / leak suite の整備 |
| 分類         | テスト基盤 |
| 対象機能     | `apps/api` の `/public/*` 4 endpoint contract / integration / leak suite |
| 優先度       | 中 |
| 見積もり規模 | 中規模 |
| ステータス   | 未実施 |
| 発見元       | 04a Phase 12 |
| 発見日       | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04a では unit + converter test で leak リグレッションを担保したが、miniflare で D1 を立てて `/public/*` の 4 endpoint を E2E で叩く contract / integration suite は範囲外として 06a または専用タスクに移送した。`apps/web` 公開時の方が ROI が高いという判断による。

### 1.2 問題点・課題

- `routes/public/index.ts` 〜 `repository/publicMembers.ts` までを一気通貫で叩く E2E test が無く、route mount + middleware bypass + visibility filter + Cache-Control header の組み合わせ regression を E2E では検出できない。
- skill-feedback-report S-4 で「miniflare で D1 を立てて 4 endpoint を叩く雛形」を毎回再発明している指摘があり、共有テスト基盤の整備が望まれる。

### 1.3 放置した場合の影響

- Cache-Control の設定漏れや middleware 配線変更時に、unit test では落ちないが production では leak / cache poisoning する事故を見逃す可能性がある。

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api` の `/public/*` 4 endpoint について、miniflare + in-memory D1 で 1 回だけ起動し、4 endpoint を contract / integration / leak suite として実行できる test fixture を整備する。

### 2.2 最終ゴール

- miniflare D1 fixture が `apps/api/src/__tests__/_setup/` 配下に正本として置かれている
- `GET /public/stats` / `GET /public/members` / `GET /public/members/:id` / `GET /public/form-preview` の 4 endpoint について contract（status code / Cache-Control / response shape）と leak（FORBIDDEN_KEYS が response に含まれない）を検証する suite が用意されている

### 2.3 スコープ

- 含む: miniflare D1 setup、4 endpoint contract test、leak assert helper
- 含まない: KV cache 検証（U-2 別タスク）、Cloudflare cache rules 検証（U-4 別タスク）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 06a 着手時に `apps/web` 側からも公開 API を叩く必要が出ること
- miniflare バージョンと wrangler 4.x の整合性確認

### 3.2 推奨アプローチ

`02c` で確立した `_shared/__tests__/_setup.ts` の miniflare D1 パターンを `apps/api` 全体の test setup に昇格させる。

---

## 4. 完了条件チェックリスト

- [ ] miniflare D1 fixture が共通 setup として置かれている
- [ ] 4 endpoint contract test が green
- [ ] FORBIDDEN_KEYS leak assert helper が用意され、各 endpoint で適用されている
- [ ] `mise exec -- pnpm --filter @repo/api test` 緑

---

## 5. 参照情報

- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/unassigned-task-detection.md`（U-1）
- `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/outputs/phase-12/skill-feedback-report.md`（S-4）
- `apps/api/src/_shared/`、`apps/api/src/routes/public/`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-04a-public-api-security-layers.md`
