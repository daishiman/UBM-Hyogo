# Phase 7: 実装（呼び出し側 workflow 置換）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md`（composite action 本体導入済み = C1） |
| 出力 | `.github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml` の置換差分 / 削減行数の実測 |
| implementation_mode | `edit` |

---

## 0. 実装サマリ

| ID | 影響ファイル | 変更種別 | 置換対象 job | コミット粒度 |
|----|--------------|---------|-------------|-------------|
| F-03 | `.github/workflows/lighthouse.yml` | edit | `lighthouse` | C2 |
| F-04 | `.github/workflows/e2e-tests.yml` | edit | `e2e` (matrix) / `e2e-tests-coverage-gate` | C2 |
| F-05 | `.github/workflows/ci.yml` | edit | `ci` / `coverage-gate` | C2 |
| F-06 | `.github/workflows/pr-build-test.yml` | edit | `build-test` | C2 |

合計 **7 job**（index.md §1.1 と一致: lighthouse / e2e(matrix=1 job 化として 1) / report-merge(=e2e-tests-coverage-gate) / typecheck(=ci) / lint(=ci 内) / test(=coverage-gate) / pr-build-test）。本 Phase は C2 単独コミットとして PR-A に積む。

> **C1 単独で merge しても挙動不変**だが、C2 で初めて呼出側が composite action に切替わるため、ここから先は `ci` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` の required check が composite 経由で走る。

---

## 1. 前提確認

| # | チェック | コマンド | 期待 |
|---|---------|---------|------|
| P-01 | C1 merge 済み（または同 PR 内 C1 commit 済み） | `git log --oneline --all -- .github/actions/setup-project/action.yml \| head -1` | hit 1 |
| P-02 | composite action 存在 | `test -f .github/actions/setup-project/action.yml && echo OK` | `OK` |
| P-03 | 既存 required context 名 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \| jq -r '.required_status_checks.contexts[]'` | `ci` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` を含む |

---

## 2. `lighthouse.yml` の置換（F-03）

### 2.1 Before（行 16-29）

```yaml
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - uses: actions/setup-node@v4
        with:
          node-version: 24.15.0
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

### 2.2 After

```yaml
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/setup-project
```

> 全 input が既定値（`node-setup` / `install=true` / Node `24.15.0` / pnpm `10.33.2`）と一致するため `with:` 不要。

### 2.3 Edit パターン

```diff
     steps:
       - uses: actions/checkout@v4

-      - uses: pnpm/action-setup@v4
-        with:
-          version: 10.33.2
-
-      - uses: actions/setup-node@v4
-        with:
-          node-version: 24.15.0
-          cache: pnpm
-
-      - name: Install dependencies
-        run: pnpm install --frozen-lockfile
+      - uses: ./.github/actions/setup-project
```

削減: 12 行 → 1 行（**11 行減**）

---

## 3. `e2e-tests.yml` の置換（F-04）

### 3.1 job: `e2e`（matrix）— Before（行 26-42）

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.15.0
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
```

### 3.2 After

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup project (Node + pnpm + install)
        uses: ./.github/actions/setup-project
```

### 3.3 Edit パターン（matrix job）

```diff
     steps:
       - name: Checkout
         uses: actions/checkout@v4

-      - name: Setup pnpm
-        uses: pnpm/action-setup@v4
-        with:
-          version: 10.33.2
-
-      - name: Setup Node.js
-        uses: actions/setup-node@v4
-        with:
-          node-version: 24.15.0
-          cache: pnpm
-
-      - name: Install dependencies
-        run: pnpm install --frozen-lockfile
+      - name: Setup project (Node + pnpm + install)
+        uses: ./.github/actions/setup-project
```

削減: 14 行 → 2 行（**12 行減**）

### 3.4 job: `e2e-tests-coverage-gate`（行 95-118）

同様に Checkout 直後の Setup pnpm / Setup Node.js / Install dependencies を `./.github/actions/setup-project` 1 step に置換する。

```diff
     steps:
       - name: Checkout
         uses: actions/checkout@v4
 
       - name: Verify all e2e shards succeeded
         run: |
           ...

-      - name: Setup pnpm
-        uses: pnpm/action-setup@v4
-        with:
-          version: 10.33.2
-
-      - name: Setup Node.js
-        uses: actions/setup-node@v4
-        with:
-          node-version: 24.15.0
-          cache: pnpm
-
-      - name: Install dependencies
-        run: pnpm install --frozen-lockfile
+      - name: Setup project (Node + pnpm + install)
+        uses: ./.github/actions/setup-project
```

削減: 14 行 → 2 行（**12 行減**）

---

## 4. `ci.yml` の置換（F-05）

### 4.1 job: `ci`（typecheck + lint 統合 job）

`ci.yml` は `steps.ready.outputs.value == 'true'` で各 step を gate しているため、composite action 化しても **gate 条件を温存**する必要がある。

#### Before（行 67-95 抜粋）

```yaml
      - uses: actions/checkout@v4

      - name: Check implementation readiness
        id: ready
        run: |
          if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ]; then
            echo "value=true" >> "$GITHUB_OUTPUT"
          else
            echo "value=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Skip — monorepo not yet bootstrapped
        if: steps.ready.outputs.value == 'false'
        run: echo "::notice::package.json / pnpm-workspace.yaml not found — typecheck and lint skipped"

      - uses: pnpm/action-setup@v4
        if: steps.ready.outputs.value == 'true'
        with:
          version: 10.33.2

      - uses: actions/setup-node@v4
        if: steps.ready.outputs.value == 'true'
        with:
          node-version: '24'
          cache: pnpm

      - name: Install dependencies
        if: steps.ready.outputs.value == 'true'
        run: pnpm install --frozen-lockfile
```

#### After

```yaml
      - uses: actions/checkout@v4

      - name: Check implementation readiness
        id: ready
        run: |
          if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ]; then
            echo "value=true" >> "$GITHUB_OUTPUT"
          else
            echo "value=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Skip — monorepo not yet bootstrapped
        if: steps.ready.outputs.value == 'false'
        run: echo "::notice::package.json / pnpm-workspace.yaml not found — typecheck and lint skipped"

      - name: Setup project
        if: steps.ready.outputs.value == 'true'
        uses: ./.github/actions/setup-project
```

> Node version 表記 `'24'` → composite 内既定値 `24.15.0` への正規化。GitHub Actions の semver 解決で Node 24 系列の最新が選ばれるため挙動同値。required context 名 `ci` 不変。

#### Edit パターン

```diff
-      - uses: pnpm/action-setup@v4
-        if: steps.ready.outputs.value == 'true'
-        with:
-          version: 10.33.2
-
-      - uses: actions/setup-node@v4
-        if: steps.ready.outputs.value == 'true'
-        with:
-          node-version: '24'
-          cache: pnpm
-
-      - name: Install dependencies
-        if: steps.ready.outputs.value == 'true'
-        run: pnpm install --frozen-lockfile
+      - name: Setup project
+        if: steps.ready.outputs.value == 'true'
+        uses: ./.github/actions/setup-project
```

削減: 12 行 → 3 行（**9 行減**）

### 4.2 job: `coverage-gate`（行 122-167 抜粋）

`ci` job と同じ readiness gate + setup 3 ステップが繰り返されているため同一パターンで置換する。

```diff
-      - uses: pnpm/action-setup@v4
-        if: steps.ready.outputs.value == 'true'
-        with:
-          version: 10.33.2
-
-      - uses: actions/setup-node@v4
-        if: steps.ready.outputs.value == 'true'
-        with:
-          node-version: '24'
-          cache: pnpm
-
-      - name: Install dependencies
-        if: steps.ready.outputs.value == 'true'
-        run: pnpm install --frozen-lockfile
+      - name: Setup project
+        if: steps.ready.outputs.value == 'true'
+        uses: ./.github/actions/setup-project
```

削減: 12 行 → 3 行（**9 行減**）

> `workflow-shell-lint` job は shellcheck / actionlint 用途で **setup の依存が異なる**（apt-get で shellcheck 導入）ため、本タスクの置換対象外（index.md §1.1 の 7 job カウントにも含まない）。

---

## 5. `pr-build-test.yml` の置換（F-06）

### 5.1 Before（行 29-46）

```yaml
      - name: Checkout PR head
        uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false

      - name: Setup mise (Node 24 + pnpm 10)
        uses: jdx/mise-action@5083fe46898c414b2475087cc79da59e7da859e8 # v2
        with:
          cache: true

      - name: Install dependencies
        run: mise exec -- pnpm install --frozen-lockfile
```

### 5.2 After

```yaml
      - name: Checkout PR head
        uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false

      - name: Setup project (mise strategy)
        uses: ./.github/actions/setup-project
        with:
          setup-strategy: mise
```

### 5.3 Edit パターン

```diff
       - name: Checkout PR head
         uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
         with:
           ref: ${{ github.event.pull_request.head.sha }}
           persist-credentials: false

-      - name: Setup mise (Node 24 + pnpm 10)
-        uses: jdx/mise-action@5083fe46898c414b2475087cc79da59e7da859e8 # v2
-        with:
-          cache: true
-
-      - name: Install dependencies
-        run: mise exec -- pnpm install --frozen-lockfile
+      - name: Setup project (mise strategy)
+        uses: ./.github/actions/setup-project
+        with:
+          setup-strategy: mise
```

削減: 9 行 → 4 行（**5 行減**）

### 5.4 SHA pin に関する注意

`actions/checkout` の SHA pin（`b4ffde65...`）は呼出側に残す（UT-GOV-007 trusted/untrusted contract）。composite 内の `jdx/mise-action@v2` タグ参照は trusted な composite 内部スコープに閉じる。Phase 9 の draft PR で `pr-build-test` job の build / typecheck / lint が green であることを確認する。

---

## 6. 削減行数の実測

| ファイル | 削減行数 | 累計 |
|---------|---------|------|
| `lighthouse.yml` | 11 | 11 |
| `e2e-tests.yml` (e2e job) | 12 | 23 |
| `e2e-tests.yml` (e2e-tests-coverage-gate) | 12 | 35 |
| `ci.yml` (ci job) | 9 | 44 |
| `ci.yml` (coverage-gate job) | 9 | 53 |
| `pr-build-test.yml` (build-test) | 5 | 58 |
| **合計** | | **58 行減** |

setup 周辺の元行数（重複している 7 setup ブロックの合計）は約 76 行。削減率 **76%**（index.md の「70% 以上削減」DoD を達成）。

実測コマンド:

```bash
git diff --stat dev...HEAD -- .github/workflows/ \
  | tee outputs/phase-11/evidence/setup-lines-delta.md

# 詳細差分
git diff dev...HEAD -- .github/workflows/ \
  > outputs/phase-11/evidence/workflows-delta.diff
```

---

## 7. 検証コマンド

```bash
# 7.1 actionlint（呼出側 4 ファイル）
./.tmp/actionlint/actionlint \
  .github/workflows/lighthouse.yml \
  .github/workflows/e2e-tests.yml \
  .github/workflows/ci.yml \
  .github/workflows/pr-build-test.yml

# 7.2 setup 重複の残存
grep -RInE 'pnpm install --frozen-lockfile' .github/workflows/
# 期待: hit 0（composite 外で完全消滅）

grep -RInE 'pnpm/action-setup@v4' .github/workflows/
# 期待: hit 0

grep -RInE 'actions/setup-node@v4' .github/workflows/
# 期待: hit 0

grep -RInE 'jdx/mise-action' .github/workflows/
# 期待: hit 0（composite 内のみ）

# 7.3 composite 呼び出しの hit
grep -RInE 'uses: \./\.github/actions/setup-project' .github/workflows/
# 期待: hit 6（ci=1 / coverage-gate=1 / e2e=1 / e2e-tests-coverage-gate=1 / lighthouse=1 / pr-build-test=1 = 計 6 = matrix 含む実 step 数）

# 7.4 required context 名の不変
grep -E '^name:\s*(ci|lighthouse-ci|e2e-tests-coverage-gate|PR Build Test)' .github/workflows/*.yml

# 7.5 branch protection contexts 不変
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq -r '.required_status_checks.contexts[]' \
  > outputs/phase-11/evidence/dev-required-contexts-after.txt
diff outputs/phase-11/evidence/dev-required-contexts-before.txt \
     outputs/phase-11/evidence/dev-required-contexts-after.txt
# 期待: diff 0
```

---

## 8. コミット

```bash
git add .github/workflows/lighthouse.yml \
        .github/workflows/e2e-tests.yml \
        .github/workflows/ci.yml \
        .github/workflows/pr-build-test.yml

git commit -m "refactor(ci): replace 7 duplicated Node+pnpm setup blocks with setup-project composite action (RB-02, #627)"
```

---

## 9. DoD（Phase 7 完了条件）

| # | 条件 |
|---|------|
| D-01 | 4 ファイル / 7 job 相当の setup ブロックが `./.github/actions/setup-project` 呼び出しに置換 |
| D-02 | actionlint で violation 0 |
| D-03 | §7.2 の `pnpm install --frozen-lockfile` / `pnpm/action-setup@v4` / `actions/setup-node@v4` / `jdx/mise-action` hit 0 |
| D-04 | required context 名（`ci` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test`）が不変 |
| D-05 | 削減行数が `outputs/phase-11/evidence/setup-lines-delta.md` に保存され合計 70% 以上 |
| D-06 | pr-build-test の checkout SHA pin (`b4ffde65...`) が呼出側に温存 |

---

## 10. 引き継ぎ（Phase 8 へ）

| 項目 | 内容 |
|------|------|
| 単体テスト | composite action の inputs validate / 既定値 / strategy 切替の grep gate |
| 統合テスト | Phase 9 draft PR で 4 required check が green |
| evidence 保存 | `outputs/phase-11/evidence/setup-lines-delta.md` / `workflows-delta.diff` / `dev-required-contexts-{before,after}.txt` |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 7
- task classification: implementation / NON_VISUAL (CI infra)
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

`.github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml` の 7 setup ブロックを `./.github/actions/setup-project` 呼び出しに置換し、index.md DoD-1 / DoD-2 を達成する。required context 名 / SHA pin / readiness gate を温存する。

## 実行タスク

- §2..§5 で 4 ファイルの before/after / Edit パターンを確定。
- §6 で削減行数（合計 58 行 / 76%）を実測仕様化。
- §7 で grep gate / actionlint / branch protection 不変検証コマンドを集約。
- §8 で C2 コミット内容を確定。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/phase-4.md §5（呼出 contract）
- docs/30-workflows/issue-627-composite-setup-action/phase-6.md §2（composite 本体）
- .github/workflows/{lighthouse,e2e-tests,ci,pr-build-test}.yml（現行）

## 実行手順

1. P-01..P-03 着手前提確認（特に composite action C1 存在）。
2. §2..§5 のとおり 4 ファイルを Edit。
3. §7 検証コマンドで grep gate / actionlint / branch protection contexts 不変を確認。
4. §6 で削減行数を `outputs/phase-11/evidence/setup-lines-delta.md` に保存。
5. §8 で C2 を commit。

## 統合テスト連携

- 実 GHA run（Phase 9 draft PR）で `ci` / `lighthouse-ci` / `e2e-tests-coverage-gate` / `build-test` が全 green であること、artifact 名（`lhci-report-${{ github.sha }}` 等）が不変であることを確認する。

## 成果物

- 4 workflow ファイルの edit 差分
- `outputs/phase-11/evidence/setup-lines-delta.md` / `workflows-delta.diff`
- 本 phase markdown

## 完了条件

- [x] 仕様記述済: 必須セクションが存在する。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
