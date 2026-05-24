---
実装区分: 実装仕様書
状態: completed
Phase: 9
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-8-refactor.md](./phase-8-refactor.md)
次: [phase-10-final-review.md](./phase-10-final-review.md)
---

# Phase 9: QA (品質保証)

## 1. 目的

PR 提出前の機械チェックを一通り通し、CI gate 通過に必要な前提条件をローカルで満たす。

## 2. 必須チェック

| # | コマンド | 期待 |
| ---- | ---- | ---- |
| Q-01 | `mise exec -- pnpm install --force` | exit 0 / lockfile drift なし |
| Q-02 | `mise exec -- pnpm typecheck` | exit 0 |
| Q-03 | `mise exec -- pnpm lint` | exit 0 (warnings 許容、errors 0) |
| Q-04 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 / OpenNext bundle 生成 |
| Q-05 | Phase 4 §10 の vitest コマンド群 | 全 PASS |
| Q-06 | Phase 4 §10 の Playwright smoke | 全 PASS (chromium) |
| Q-07 | `bash scripts/verify-pr-ready.sh` | exit 0 |
| Q-08 | `bash .github/workflows/scripts/verify-design-tokens.sh` (該当 CI gate スクリプト) | exit 0 / HEX 0 件 |

## 3. Design token CI gate (`verify-design-tokens`)

- 対象 path: `apps/web/app/(admin)`, `apps/web/src/components/admin`, `apps/web/src/features/admin`
- 検出パターン: `bg-\[#`, `text-\[#`, `border-\[#`, 7/4/3-digit raw HEX
- 期待: **0 件**
- ローカル即時チェック:

```bash
grep -rEn "bg-\[#|text-\[#|border-\[#|#[0-9a-fA-F]{3,8}" \
  apps/web/app/\(admin\) apps/web/src/components/admin apps/web/src/features/admin \
  | grep -v -E '\.spec\.tsx?:|tokens\.css' || true
```

## 4. Build artefact 健全性

- `apps/web/.open-next/` 内に `[project]/...` 仮想 specifier が残存していないか
  ```bash
  grep -rEn '"\[project\]' apps/web/.open-next || true   # 0 件期待
  ```
- `apps/web/.next/standalone` への直接 deploy ではなく OpenNext bundle 経由であること

## 5. Line budget

| ファイル種別 | 目標 |
| ---- | ---- |
| `app/(admin)/admin/**/page.tsx` | **< 300 行** |
| `_shared/*.tsx` | **< 200 行** |
| `_shared/index.ts` | **< 50 行** |
| `safeServerFetch.ts` | **< 120 行** |

超過の場合は Phase 8 へ差し戻して内部分割。

## 6. Link / mirror parity

本タスクは admin UI 単一サイクル。

- mirror 対象 (例: `aiworkflow-requirements/indexes`): **該当なし**
- 外部 link (`docs/...`): 本ワークフロー index.md と各 phase の相対 link が全て解決すること
  ```bash
  # broken relative link 検出
  grep -rEn '\]\(\./phase-[0-9]+' docs/30-workflows/admin-ui-prototype-alignment | \
    awk -F'(' '{print $2}' | awk -F')' '{print $1}' | sort -u | \
    while read f; do test -f "docs/30-workflows/admin-ui-prototype-alignment/$f" || echo "MISSING: $f"; done
  ```

## 7. 副作用なし宣言

- 本 Phase の検証は read-only / build-only。
- `wrangler` / `scripts/cf.sh` / D1 / Secrets への書き込みは **一切発生しない**。
- staging deploy は **Phase 11 で別途確認**。

## 8. DoD (Phase 9)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 9
- workflow_state: `implemented_local_runtime_pending`

## 目的

typecheck / lint / build / token gate / link parity を通し、Phase 10 review へ進める状態にする。

## 実行タスク

- `pnpm typecheck` / `pnpm lint` / `pnpm build` を実行する
- `verify-design-tokens` で HEX 直書き 0 件を確認する
- line budget と workflow link parity を確認する

## 参照資料

- `phase-5-implementation.md`
- `phase-8-refactor.md`

## 成果物/実行手順

- QA 実行結果を Phase 10 / 11 の前提 evidence にする

## 統合テスト連携

- Unit / helper / Playwright smoke の結果を QA evidence として集約する

## 完了条件

- 必須 QA コマンドが PASS し、token / link / side effect の検査が完了している

- [ ] Q-01〜Q-08 全 PASS
- [ ] §3 HEX 検出 0 件
- [ ] §4 OpenNext bundle 健全
- [ ] §5 line budget 満たす
- [ ] §6 broken link なし
- [ ] §7 副作用なし
