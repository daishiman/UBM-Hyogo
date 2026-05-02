# 08a Implementation Guide — PR メッセージ素体

## Part 1: 初学者・中学生レベル

### 困りごと（Before）

会員管理サイトの API は 30 個近くあり、それぞれ「誰が叩いてよいか」「返ってくる JSON の形は何か」「壊れた入力が来たらどう振る舞うか」がコードとドキュメントの両方に散らばっていた。手で全部確認するのは現実的でない。

### 解決後の状態（After）

API の挙動を **5 種類のテスト suite**（contract / authz / repository / type / lint）に整理し、自動で 442 件の検証が回るようにした。ただし coverage は AC-6 に 0.82pt 届いていないため、完了ではなく補強待ちの状態として扱う。例え話で言えば、

- **contract test** = 契約書（API レスポンスの形）どおりの形で答えが返るかチェックする
- **authz test** = 鍵付きの扉を、間違った人が開けようとしたら断るかチェックする
- **type test** = 設計図段階で部品の食い違いを止める
- **lint test** = 禁止された部品（profile 編集 endpoint など）が混入していないかチェックする
- **coverage** = テストでコードの何 % を実際に通したかの合格点

### 専門用語ミニ解説

| 用語 | 一言で |
| --- | --- |
| invariant（不変条件） | 「この約束だけは絶対に破られちゃダメ」というルール |
| brand 型 | 同じ `string` でも `responseId` と `email` を別物として TypeScript に区別させる印 |
| msw | テスト中に外部 API 呼び出しを偽の返答で乗っ取る道具 |
| coverage | テストがソースコード何行をなぞったかのパーセント |

## Part 2: 開発者・技術者レベル

### 1. コード変更点（apps/api/src/__tests__/）

| ファイル | 行数 | 役割 |
| --- | --- | --- |
| `__tests__/authz-matrix.test.ts` | 79 | public / admin の代表 authz matrix。個別 endpoint は既存 route tests に委譲し、全 endpoint 生成 matrix は UT-08A-01/後続補強対象 |
| `__tests__/brand-type.test.ts` | 38 | `asResponseId` / `asResponseEmail` 等 brand コンストラクタの健全性 |
| `__tests__/invariants.test.ts` | 132 | 不変条件 #1/#2/#3/#6/#11 の集約 assert（grep + ランタイム両軸） |

`packages/shared` 側 view-model schema や既存 `routes/**/*.test.ts` の zod parse 強化も runbook で対象だが、本 PR では `apps/api/src/__tests__/` 配下の 3 ファイルが新規追加分。

### 2. テスト suite signature（5 種）

```ts
// contract: 1 endpoint = 1 ファイル, 6〜7 ケース最低保証
describe("GET /public/members [contract]", () => {
  it("schema: zod parse passes", async () => { /* ... */ });
  it("status: 200", async () => { /* ... */ });
  it("headers: Cache-Control set", async () => { /* ... */ });
});

// authz: matrix 形式で role × endpoint
describe("authz matrix", () => {
  it.each(MATRIX)("$role -> $endpoint -> $expectedStatus", async (row) => { /* ... */ });
});

// repository: D1 binding 経由の永続層
// type:       packages/shared の compile-time 検証（@ts-expect-error）
// lint:       ESLint custom rule で profile 編集 endpoint 追加を禁止
```

### 3. テスト追加 — 数量

- **Test Files**: 74 passed
- **Tests**: **442 passed / 0 failed** （Phase 11 evidence: `outputs/phase-11/evidence/test-run.log`）
- **Duration**: 61.09s
- 既存 route / repository / workflow tests に、authz representative matrix / brand proxy / invariant 集約を加えて合計 442。30 endpoint × 6〜7 ケースの完全な生成 inventory は未完で、後続補強対象。

### 4. outputs ドキュメント（Phase 1〜12）

| Phase | 主成果物 |
| --- | --- |
| 1  | requirements / AC-1〜7 |
| 2  | design / test-architecture.mmd / test-directory-layout.md |
| 3  | review (3 案比較, 採用 C) |
| 4  | strategy / verify-suite-matrix.md |
| 5  | runbook.md / test-signatures.md |
| 6  | failure-cases (12 カテゴリ) |
| 7  | ac-matrix.md (5 軸 trace) |
| 8  | DRY 化 (packages/shared 集約) |
| 9  | QA (無料枠 / secret hygiene / eslint rule) |
| 10 | GO 判定 |
| 11 | smoke + coverage evidence |
| 12 | 本ガイド + 5 関連 doc |

### 5. coverage 実測値

| 指標 | 実測 | AC 閾値 | 判定 |
| --- | --- | --- | --- |
| Statements | **84.18%** | ≥ 85% (AC-6) | **未達 (-0.82pt)** |
| Branches   | **84.13%** | ≥ 80%        | pass |
| Functions  | **83.37%** | ≥ 85%        | **未達 (-1.63pt)** |
| Lines      | **84.18%** | ≥ 85%        | **未達 (-0.82pt)** |

evidence: `outputs/phase-11/evidence/coverage-report.txt`

未達原因は `src/use-cases/public/*` 4 本（5〜14% Stmts）と一部 route ハンドラ。view-model 層に責務委譲済みのため設計上は妥当だが、coverage 計測対象から除外していないため数値上未達。**`unassigned-task-detection.md` に補強タスクを明記**。

### 6. 既知の残課題

1. **AC-6 未達 (-0.82pt)**: `unassigned-task-detection.md` UT-08A-01 と `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` として formalize。`use-cases/public/*` への直接 unit test 追加 or vitest config の `coverage.exclude` 設定で解消。
2. **CI workflow 本番反映**: `outputs/phase-11/evidence/ci-workflow.yml` は placeholder。`.github/workflows/api-tests.yml` への配置は 09b 担当。
3. **type test (sharedパッケージ)**: apps/api 側 brand proxy は `brand-type.test.ts` で観測済み。packages/shared 側 `@ts-expect-error` 検証は UT-08A-05 として範囲外。
4. **既存 `*.test.ts` → `*.contract.spec.ts` rename**: 段階移行のため別 PR で実施。

### 7. 検証コマンド一覧

```bash
# 全 suite 実行
mise exec -- pnpm --filter @ubm-hyogo/api test

# coverage
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage

# 型チェック / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

### 8. スクリーンショット

本タスクは **API テスト整備のみで UI/UX 実装を伴わない**ため、スクリーンショット参照は不要。視覚的差分は無く、確認は上記コマンドの出力（test-run.log / coverage-report.txt）で代替する。

### 9. 不変条件カバレッジ

| 不変条件 | テスト | 観測点 |
| --- | --- | --- |
| #1 schema を固定しすぎない | `invariants.test.ts` | unknown が別経路で保持される |
| #2 consent キーは publicConsent / rulesConsent のみ | `invariants.test.ts` + extract-consent test | normalizeResponse 経由 |
| #5 D1 直接アクセスは apps/api に閉じる | `invariants.test.ts` (grep) | apps/web/{src,app} に D1 import なし |
| #6 apps/web から D1 直接アクセス禁止 | `invariants.test.ts` (grep) | 同上 |
| #7 MVP では Form 再回答が本人更新の正式経路 | `authz-matrix.test.ts` + 404 test | `/me/profile` 編集 endpoint 不在 |
| #11 /me 配下に PUT/PATCH /me/profile を mount しない | `invariants.test.ts` (grep) + 404 contract | route 定義の static check |
