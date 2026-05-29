# Phase 7 — カバレッジ確認

> concern と dependency edge の coverage を可視化する。NON_VISUAL でないため Phase 6 統合は行わず独立 phase として扱う。

---

## 1. Coverage 対象

| 対象 | 方法 |
|------|------|
| `apps/api/src/routes/admin/requests.ts` | `pnpm --filter @repo/api test -- --coverage requests` |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | `pnpm --filter web test -- --coverage RequestQueue` |
| Playwright primitive DOM | structure assertions（TC-B-03） |

---

## 2. 期待閾値

| 領域 | line | branch |
|------|------|--------|
| admin/requests.ts | ≥ 80% | ≥ 70% |
| RequestQueuePanel.tsx | ≥ 60%（既存比同等） | — |

既存 codecov.yml の global threshold（issue-255 で 3 点同期済）に違反しないこと。

---

## 3. dependency edge 確認

| edge | 検証 |
|------|------|
| web `fetchAdmin` → api `/admin/requests` | TC-A-01（200 経路） |
| api `requireAdmin` → JWT verify | TC-A-02 / TC-A-03 |
| RequestQueuePanel → useAdminMutation | 既存 mutation test 経由（変更なし） |
| RequestQueuePanel → useConfirmDialog | 既存 hook test 経由（変更なし） |

---

## 4. DoD

- [ ] coverage 閾値クリア。
- [ ] dependency edge 全本数 test で touch。
