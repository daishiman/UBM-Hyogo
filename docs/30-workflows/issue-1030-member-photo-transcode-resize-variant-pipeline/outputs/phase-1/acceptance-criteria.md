# 受け入れ基準 — issue-1030

| # | 受入条件 | 検証手段 |
|---|----------|----------|
| AC-1 | display/thumb 保存方針が ADR 化されている | [../phase-2/adr-1030-image-processing.md](../phase-2/adr-1030-image-processing.md) |
| AC-2 | 処理方式のコスト/無料枠/失敗時 fallback が比較されている | ADR 比較表 + Phase 2 §8 fallback |
| AC-3 | `member_photos` に variant 識別メタ（thumb key / hash / status）が追加されている | migration 0023 + repo test |
| AC-4 | admin avatar(sm/md) が thumb を、lg が display を使う | `MemberAvatar` component test |
| AC-5 | 失敗時に display または hue placeholder へ安全 fallback | image-resize util test（original_fallback）+ component test（onError） |

## DoD（Definition of Done・実装サイクルで満たす）

- `mise exec -- pnpm typecheck` / `lint` green。
- API contract / repo / image-resize util / component test が PASS。
- migration 0023 が `member_photos` を非破壊拡張（既存行 SELECT 200）。
- 旧 client（`file` 単一）upload が 503/破壊なく受理される回帰テスト PASS。
