# Phase 12 Main

Status: `implemented_local_runtime_pending` (Lane A-E コード変更完了 / authenticated Phase 11 視覚検証は user-gated)

## 本サイクルの完了範囲

- Phase 1〜4: 仕様書一式 (要件 / 設計 / 設計レビュー / テスト計画) は仕様書として完了
- Phase 5: 実装手順 → 実コード変更完了 (`apps/web/` 配下 11 ファイル新規 + 10 ファイル修正)
- Phase 6: テスト拡充 → 33 spec 追加 (`_shared/` 6 component + safeServerFetch helper)
- Phase 7: カバレッジ → 全 export が spec から呼ばれる構造的網羅
- Phase 8: リファクタ → page.tsx の重複 try/catch を safeServerFetch に統一
- Phase 9: QA → typecheck / lint / test (897 PASS) / verify-design-tokens (9 PASS) 全 PASS
- Phase 10: 最終レビュー → 不変条件 #1〜#8 充足
- Phase 12: 本ドキュメント群更新

## User-gated boundary

- Phase 11 (manual visual test / 20 screenshot): authenticated admin runtime が必要なため pending inventory で追跡
- Phase 13 (PR 作成): user 承認後に実施
- staging / production deploy: user 承認後の operations

## 検証コマンド (再現)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

すべて exit 0。
