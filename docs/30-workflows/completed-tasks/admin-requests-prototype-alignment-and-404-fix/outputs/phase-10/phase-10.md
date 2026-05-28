# Phase 10 — 最終レビュー

> AC / blocker / 不変条件 / CONST_007 を最終判定する。

---

## 1. AC 達成判定

| AC | 検証 | 判定基準 |
|----|------|----------|
| AC-1 — API 404 復旧 | staging `curl /admin/requests?...` | 200 |
| AC-2 — UI 整合 | TC-B-03 selector + DOM 目視 | primitive 全 hit |
| AC-3 — Visual regression | TC-B-01/02 baseline | 0 diff |
| AC-4 — Regression vitest | TC-A-01〜06 | 全 green |
| AC-5 — DoD | typecheck / lint / build / vitest / playwright | 全 green |

---

## 2. blocker 棚卸し

| 候補 | 状態 |
|------|------|
| staging redeploy 未実施 | user 明示承認後に解消 |
| baseline 未取得 | user 明示承認後の `--update-snapshots` 経路 |
| その他 | なし |

---

## 3. 不変条件 final check

Phase 1 §8 のチェックリストを Phase 10 で再評価:

- [ ] #1 新 endpoint 0 件
- [ ] #2 tokens.css 改変 0 / HEX 直書き 0
- [ ] #3 新 primitive 0
- [ ] #5 D1 直接アクセス apps/web に 0
- [ ] #8 新 test は `*.spec.{ts,tsx}` のみ
- [ ] #10 admin mutation は features/admin/hooks/useAdminMutation 経由

---

## 4. CONST_007 — 先送り 0 件確認

| Phase で出た「後回し」案件 | 解消方針 |
|---------------------------|----------|
| (Phase 5 で発生し次第列挙) | 全件 Phase 12 で formalize（未タスク化）or 同サイクル完結 |

---

## 5. 判定

`AC 1〜5 達成 + blocker user 承認待ち以外 0` で **PASS → Phase 11 へ**。
