---
phase: 5
title: 実装手順 — 13 workflow の before/after diff snippet
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 5: 実装手順

[実装区分: 実装仕様書]

## 1. 共通テンプレ（AFTER）

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-project
    with:
      setup-strategy: node-setup
      install: 'true'
  # 以降の workflow 固有 step はそのまま残す
```

> default 値で完結する場合、`with` を完全省略しても良いが、可読性のため `setup-strategy` / `install` の 2 input は明示する。

## 2. 各 workflow の前後 diff

### 2-1. `verify-gate-metadata.yml`

**BEFORE**:
```yaml
      - uses: actions/checkout@v4
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
      - name: Install actionlint
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Install actionlint
        ...
```

### 2-2. `verify-indexes.yml`

**BEFORE**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Rebuild indexes
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Rebuild indexes
        ...
```

### 2-3. `web-cd.yml`（2 job: staging / production）

**BEFORE (job: staging)**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm
      - name: Install dependencies
        run: mise exec -- pnpm install --frozen-lockfile
      # NOTE: build-time placeholder env ...
      - name: Build
        ...
```

**AFTER (job: staging)**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      # NOTE: build-time placeholder env ...
      - name: Build
        ...
```

> `mise exec --` prefix は不要となる。CI ランナー上では composite action が actions/setup-node で Node 24 を PATH 注入済み。
> job: production も同じ置換を行う。

### 2-4. `validate-build.yml`（conditional install）

**BEFORE**:
```yaml
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
      - name: Build
        ...
```

**AFTER**:
```yaml
      - uses: ./.github/actions/setup-project
        if: steps.ready.outputs.value == 'true'
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Build
        ...
```

> composite action 全体に `if:` を継承させ、3 step に分散していた条件分岐を 1 箇所に集約する。

### 2-5. `d1-migration-verify.yml`

**BEFORE**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Install bats
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Install bats
        ...
```

### 2-6. `verify-esbuild.yml`

**BEFORE**:
```yaml
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
      - name: verify:node-arch
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: verify:node-arch
        ...
```

### 2-7. `cloudflare-alerts-drift.yml`（2 job: validate / diff）

両 job ともに同じパターン。

**BEFORE (per job)**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: "24.15.0"
          cache: "pnpm"
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: ...
```

**AFTER (per job)**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: ...
```

### 2-8. `backend-ci.yml`（2 job: staging / production）

**BEFORE (per job)**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Preflight - verify Cloudflare secrets are injected
        ...
```

**AFTER (per job)**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Preflight - verify Cloudflare secrets are injected
        ...
```

### 2-9. `cloudflare-analytics-export.yml`

**BEFORE**:
```yaml
      - uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24.15.0"
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Compute target month (YYYYMM)
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Compute target month (YYYYMM)
        ...
```

### 2-10. `lighthouse.yml`

**BEFORE**:
```yaml
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
      - name: Build (Next.js production)
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Build (Next.js production)
        ...
```

### 2-11. `post-release-dashboard.yml`

**BEFORE**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm
      # install step なし（既存形）
      - name: ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: ...
```

### 2-12. `verify-phase12-compliance.yml`

**BEFORE**:
```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Verify phase-12 compliance
        ...
```

**AFTER**:
```yaml
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          setup-strategy: node-setup
          install: 'true'
      - name: Verify phase-12 compliance
        ...
```

## 3. 編集手順（実装時）

1. `git switch -c feat/cicd-composite-setup-rollout`
2. Batch A → B → C の順で 13 yaml を編集
3. `gh workflow view <name>` で syntax 確認（Phase 6 参照）
4. `git add .github/workflows/*.yml`
5. 1 commit に集約してコミット（commit message は Phase 13 参照）
6. `git push -u origin feat/cicd-composite-setup-rollout`
7. `gh pr create --base dev`

## 4. 変更対象ファイル一覧（CONST_005）

```
.github/workflows/verify-gate-metadata.yml
.github/workflows/verify-indexes.yml
.github/workflows/web-cd.yml
.github/workflows/validate-build.yml
.github/workflows/d1-migration-verify.yml
.github/workflows/verify-esbuild.yml
.github/workflows/cloudflare-alerts-drift.yml
.github/workflows/backend-ci.yml
.github/workflows/cloudflare-analytics-export.yml
.github/workflows/lighthouse.yml
.github/workflows/post-release-dashboard.yml
.github/workflows/verify-phase12-compliance.yml
```

## 5. 実行コマンド一覧（CONST_005）

```bash
# 編集中の確認
gh workflow view verify-gate-metadata.yml
gh workflow view web-cd.yml

# syntax チェック（actionlint がローカルにあれば）
actionlint .github/workflows/*.yml

# yaml lint（任意）
yamllint .github/workflows/

# grep 検証（rollout 完了確認）
grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l   # → 0
grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l    # → 0
```

## 6. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 5 | 13 yaml の前後 diff を §2 に集約 |
| 6 | gh workflow view で syntax 確認 |
| 7 | verify-composite-rollout gate 設計 |
| 11 | workflow-diff.patch を evidence 化 |

## 完了条件

- [ ] §1 共通テンプレ提示
- [ ] §2 で 13 yaml すべての before/after diff が示されている
- [ ] §4 で変更対象ファイル一覧が示されている
- [ ] §5 で実行コマンドが示されている
