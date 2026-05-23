# Implementation Guide

## Part 1: 中学生にも分かる説明

なぜこの変更が必要かというと、GitHub Actions の準備手順がワークフローごとに分かれていると、Node や pnpm のバージョンを変えるたびに直し忘れが起きるからです。何が変わるかは単純で、13 個の workflow に残っていた個別の準備手順を、共通の `.github/actions/setup-project` 呼び出しへ置き換えます。

たとえば教室で毎朝「机を並べる、出席表を出す、道具を準備する」という同じ作業を係ごとに別々の紙へ書いていると、道具の置き場所が変わった時に全部の紙を直す必要があります。今回の変更は「朝の準備セット」という 1 枚の紙を作り、各係の紙には「朝の準備セットを使う」と書くイメージです。

### 今回作ったもの

- 13 workflow の raw `actions/setup-node@v4` / `pnpm/action-setup@v4` setup block を `.github/actions/setup-project` に置換した実装差分
- Phase 11 の grep before/after、workflow diff、local verification log、remote CI boundary file
- Phase 12 の strict 7 成果物と、PR 本文の元になるこの implementation guide

`web-cd.yml` は後続手順が `mise exec` を使うため、共通セットの中でも `setup-strategy: mise` を選びます。`post-release-dashboard.yml` は元々 dependency install をしていなかったため、共通セットでも `install: 'false'` と `cache: ''` を指定して同じ挙動を保ちます。

## Part 2: Technical Details

The rollout replaces direct `pnpm/action-setup@v4` and `actions/setup-node@v4` workflow steps with the existing checkout-less composite action. The composite action itself is intentionally unchanged.

```yaml
- uses: ./.github/actions/setup-project
```

```typescript
type SetupStrategy = "node-setup" | "mise";

interface SetupProjectInputs {
  setupStrategy?: SetupStrategy;
  install?: "true" | "false";
  nodeVersion?: string;
  pnpmVersion?: string;
  cache?: "pnpm" | "";
  workingDirectory?: string;
}
```

### CLIシグネチャ

```bash
pnpm test:phase12-compliance
pnpm verify:phase12-compliance
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/ut-cicd-composite-setup-rollout --json
rg -n 'uses: actions/setup-node@v4|uses: pnpm/action-setup@v4' .github/workflows/*.yml
grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml | wc -l
```

### 使用例

Default callers rely on the composite defaults: `setup-strategy: node-setup`, `install: 'true'`, Node `24.15.0`, pnpm `10.33.2`, and pnpm cache.

```bash
rg -n 'uses: ./.github/actions/setup-project' .github/workflows/backend-ci.yml
```

```yaml
- uses: ./.github/actions/setup-project
```

`web-cd.yml` preserves the previous `mise exec -- pnpm install --frozen-lockfile` behavior by choosing the mise strategy:

```yaml
- uses: ./.github/actions/setup-project
  with:
    setup-strategy: mise
```

`post-release-dashboard.yml` preserves the no-install behavior:

```yaml
- uses: ./.github/actions/setup-project
  with:
    install: 'false'
    cache: ''
```

### エラーハンドリング

The composite action validates `setup-strategy` and fails fast for unsupported values. This rollout does not add new workflow-level fallback behavior; failures remain visible as GitHub Actions job failures.

The local evidence also treats raw setup drift as an error: after rollout, `rg -n 'uses: actions/setup-node@v4|uses: pnpm/action-setup@v4' .github/workflows/*.yml` must return no matches. `verify-phase12-compliance` additionally verifies that Phase 11 evidence files marked `present` physically exist.

### エッジケース

- `ci.yml` already had some composite callers, but the coverage shard still had a raw setup block; this residual shard is included in the 13 workflow rollout scope.
- `web-cd.yml` needs `setup-strategy: mise` because later build steps call `mise exec`.
- `post-release-dashboard.yml` must not run dependency install because the original workflow only needed pnpm/node availability for token and script checks.
- Remote GitHub Actions green evidence and Issue #284 mutation remain Phase 13 user-gated because commit, push, and PR creation are outside this execution scope.

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| Composite action | `.github/actions/setup-project` |
| Default setup strategy | `node-setup` |
| Default Node | `24.15.0` |
| Default pnpm | `10.33.2` |
| Default install | `'true'` |
| Default cache | `pnpm` |
| Visual evidence | `NOT_APPLICABLE` |

### テスト構成

| Check | Command | Expected |
| --- | --- | --- |
| Raw setup drift | `rg -n 'uses: actions/setup-node@v4|uses: pnpm/action-setup@v4' .github/workflows/*.yml` | no matches |
| Composite caller count | `grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml \| wc -l` | `18` |
| Phase 12 compliance unit test | `pnpm test:phase12-compliance` | 19 tests pass |
| Phase 12 compliance gate | `pnpm verify:phase12-compliance` | `status: pass` |
| Implementation guide validator | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/ut-cicd-composite-setup-rollout --json` | `ok: true` |
