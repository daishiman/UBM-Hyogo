# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. パス broken の根本原因

`apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts:5-8` の `evidenceDir`:

```ts
const evidenceDir = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots",
);
```

- `process.cwd()` = `apps/web`（実行時）
- 解決後パス: `<repo>/docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots`
- 実際のディレクトリは `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/...` に移動済み（completed-tasks-policy 適用）

## 2. 修正方針

`evidenceDir` を環境変数 `PARALLEL09_EVIDENCE_DIR` で上書き可能にし、default を `completed-tasks/` 配下に向ける。これにより:
- 将来 workflow が再度移動しても CLI 上書きで吸収可能
- CI / local 双方で同じ spec が使える

### After

```ts
const evidenceDir = path.resolve(
  process.env.PARALLEL09_EVIDENCE_DIR ??
    path.join(
      process.cwd(),
      "../../docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots",
    ),
);
```

## 3. PNG 取得フロー設計

```
[1] disk 空き確認 (df -h, ≥ 5Gi available)
[2] cache cleanup (任意): rm -rf apps/web/.next apps/web/.open-next
[3] dev server 起動: pnpm --dir apps/web dev (background)
[4] readiness wait: curl http://localhost:3000/visual-harness/formfield-error が 200 まで loop (max 60s)
[5] playwright 実行: mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line
[6] 12 PNG 生成確認: ls completed-tasks/.../screenshots/*.png | wc -l = 12
[7] サイズ確認: find ... -size +500k -print が空であること
[8] dev server 停止
[9] state 更新: completed-tasks/.../phase-11/main.md の runtime_pending → completed
```

## 4. evidence path 分離ポリシー

- **正本** evidence: `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/` （Playwright 出力先）
- **本 workflow root** の `outputs/phase-11/screenshots/`: README のみ配置し正本へポインタを示す（重複保存しない）
