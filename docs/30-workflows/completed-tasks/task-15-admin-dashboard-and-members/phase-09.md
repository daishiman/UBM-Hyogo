# Phase 9: 品質保証

[実装区分: 実装仕様書]

> 目的: typecheck / lint / build / verify-design-tokens / line budget / link / 構造 parity を一括判定する。

---

## 1. 必須ゲート

| # | ゲート | コマンド | 期待 |
|---|--------|---------|------|
| Q-01 | typecheck | `mise exec -- pnpm -F @ubm-hyogo/web typecheck` | exit 0 |
| Q-02 | lint | `mise exec -- pnpm -F @ubm-hyogo/web lint` | exit 0 |
| Q-03 | unit test | `mise exec -- pnpm -F @ubm-hyogo/web test --run src/features/admin src/lib/admin` | 36+ PASS / 0 FAIL（Phase 6 の 36 ケース + admin mapper/helper focused tests） |
| Q-04 | OKLch tokens | `mise exec -- pnpm verify-design-tokens` | exit 0、HEX 0 件 |
| Q-05 | build (OpenNext Workers) | `mise exec -- pnpm -F @ubm-hyogo/web build` (next build --webpack) | exit 0 |
| Q-06 | `apps/api` 差分 0 | `git diff main -- apps/api \| wc -l` | 0 |
| Q-07 | D1 binding import 0 | `grep -rn '@cloudflare/workers-types' apps/web/src/features/admin apps/web/src/lib/admin apps/web/app/api/admin` | 0 件 |
| Q-08 | HEX 直書き 0 | `grep -rE 'bg-\[#\|text-\[#\|border-\[#' apps/web/src/features/admin apps/web/app/\(admin\)` | 0 件 |
| Q-09 | 旧 component 参照 0 | `grep -rn 'components/admin/MembersClient' apps/web/src` | 0 件 |
| Q-10 | node-only import 0 | `grep -rn 'from "node:' apps/web/src/features/admin` | 0 件 |

---

## 2. 補助確認

- **lighthouse a11y score**（Phase 11 で取得、本 Phase では skip）
- **Bundle size 増分**（参考値、blocker ではない）
  ```bash
  mise exec -- pnpm -F @ubm-hyogo/web build && du -sh apps/web/.open-next/server-functions/default/
  ```

---

## 3. CI green 確認

push 前にローカルで Q-01 〜 Q-08 が全て exit 0 であることを確認。Q-04 (verify-design-tokens) と Q-05 (build) は CI でも fail する可能性が高いため重点確認。

---

## 4. line budget 確認

各 phase 仕様書 / spec ファイルが極端に肥大化していないか目視:
```bash
wc -l docs/30-workflows/task-15-admin-dashboard-and-members/phase-*.md
```

phase ごとに 100-400 行を目安。

---

## 5. 完了条件（DoD）

- [ ] §1 Q-01〜Q-10 すべて exit 0 / 0 件
- [ ] CI 上で同等 gate が green
- [ ] `outputs/phase-09/qa-report.md` に各ゲートの結果を記録

## 成果物

- `outputs/phase-09/qa-report.md`
- 実行後に `artifacts.json` の `phase09.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
