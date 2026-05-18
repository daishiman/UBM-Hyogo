# Implementation Guide

## Part 1: 中学生レベル

料理で、全員が同じレシピを使う約束をしているのに、古いレシピを配ってしまうと、新しい材料の名前が読めずに料理が止まる。今回も同じで、Cloudflare に出すための道具は新しい合図を使っているのに、プロジェクト全体の約束が古い道具を使わせていた。

やることは、家の約束表を「古い道具」から「今の道具」に直すこと。これで Web 側と API 側のデプロイが同じ道具を使い、同じところで止まらないようにする。

| 用語 | 日常語の言い換え |
| --- | --- |
| pnpm overrides | 家中で使う道具をそろえる約束表 |
| esbuild | コードを動かしやすい形へ変える道具 |
| wrangler | Cloudflare へ荷物を届ける係 |
| OpenNext | Next.js の Web アプリを Cloudflare 用に包む係 |
| lockfile | 使った道具の型番メモ |

## Part 2: 技術者向け

### Change Contract

```json
{
  "pnpm": {
    "overrides": {
      "esbuild": "0.27.3"
    }
  }
}
```

### Changed Files

| Path | Contract |
| --- | --- |
| `package.json` | Exact override value is `0.27.3`. |
| `pnpm-lock.yaml` | Regenerated after the override change. |
| `scripts/cf.sh` | Comment explains shared wrangler/OpenNext esbuild convergence. |

### Verification Commands

```bash
mise exec -- pnpm install --force
pnpm exec esbuild --version
pnpm why esbuild
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

`build:cloudflare` currently reaches a separate local Miniflare/workerd SQLite readonly database startup blocker. That is tracked as runtime pending because the original esbuild `import-source` parser error does not recur.

### Runtime Boundary

GitHub Actions deploy evidence requires user-gated commit/push/PR. Until then the root state remains `implemented_local_evidence_captured` with `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`.

### TypeScript Interface / API Signature

N/A for this task. The implementation changes dependency metadata and a shell-wrapper comment only. No TypeScript interface, API route, schema, DTO, React component prop, or package export is added or changed.

### Usage Example

The operational usage remains the existing Cloudflare wrapper route:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

### Error Handling

| Error | Handling |
| --- | --- |
| `"import-source" is not a valid feature name` | Treat as esbuild override regression. Re-check `package.json#pnpm.overrides.esbuild`, rerun `mise exec -- pnpm install --force`, and verify `pnpm why esbuild` returns one `0.27.3` version. |
| `SENTRY_DO SQLite failed ... attempt to write a readonly database` | Separate Miniflare/workerd runtime blocker. Do not roll back the esbuild fix solely for this symptom. Keep `build:cloudflare` evidence as runtime pending until resolved in runtime verification. |
| GitHub Actions deploy failure after push | Compare CI logs against Phase 11 local evidence. If `import-source` recurs, return to dependency convergence; otherwise classify the new symptom separately. |

### Edge Cases

| Case | Decision |
| --- | --- |
| Historical `0.25.4` OpenNext fix is found in older docs | Historical only. Current SSOT is `0.27.3` from this workflow. |
| `wranglerVersion` remains `4.85.0` | Intended. This task changes esbuild convergence first and avoids workflow pin churn unless CI proves it necessary. |
| Multiple esbuild versions appear in `pnpm why esbuild` | Fail the dependency convergence gate and regenerate the lockfile before CI. |

### Configurable Parameters

| Parameter | Owner | Current Value |
| --- | --- | --- |
| `package.json#pnpm.overrides.esbuild` | root package metadata | `0.27.3` |
| `wranglerVersion` in GitHub Actions | workflow files | unchanged, `4.85.0` |
| `ESBUILD_BINARY_PATH` | `scripts/cf.sh` runtime environment | wrapper-managed fallback, not a new user-facing parameter |
