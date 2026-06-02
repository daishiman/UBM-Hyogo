# 参照リンク健全性チェック（Phase 11）

issue-1029 workflow 内の主要参照先がすべて実在することを確認するチェックリスト。

| 参照先 | 種別 | 実在 |
|--------|------|------|
| `index.md` | workflow root | ✅ |
| `phase-1.md` .. `phase-13.md` | phase spec | ✅（13 件） |
| `outputs/phase-1/spec-extraction-map.md` | anchor map | ✅ |
| `outputs/phase-11/manual-test-result.md` | 証跡メタ | ✅ |
| `outputs/phase-11/screenshot-plan.json` | screenshot 計画 | ✅ |
| `outputs/phase-12/`（strict 7） | close-out evidence | ✅ |
| `apps/api/src/lib/r2/member-photo-presign.ts`（#983 再利用） | code anchor | ✅ |
| `apps/web/src/components/ui/Avatar.tsx`（src/onError） | code anchor | ✅ |
| `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` | upstream | ✅ |

> screenshot PNG（`screenshots/*.png`）は `pending`（本実装サイクルで capture）。本チェックリストでは未存在を許容する。
