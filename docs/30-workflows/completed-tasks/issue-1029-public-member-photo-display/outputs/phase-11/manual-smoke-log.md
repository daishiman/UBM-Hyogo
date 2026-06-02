# 手動 smoke ログ（implemented_local_runtime_pending・local runtime captured）

issue-1029 は `implemented_local_runtime_pending`。本ファイルは local Playwright runtime smoke の実行結果と、staging/R2 実 URL 検証の user-gated 境界を記録する。

## 本実装サイクルで実行した smoke

Command:

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/issue-1029-public-member-photo-display/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/issue-1029-public-member-photo-display.spec.ts
```

Result: PASS（1 test / 3 screenshots）。

1. `/members` desktop で写真登録済み member の card avatar が `<img>` 表示されること。
2. `/members/sample-001` desktop で ProfileHero の写真 avatar が `<img>` 表示されること。
3. `/members` mobile で写真 avatar が visible かつ layout overlap なく表示されること。
4. `MemberCard.spec.tsx` で comfy / dense / list の各 density の `<Avatar src>` 配線を確認。
5. `MemberCard.spec.tsx` / `ProfileHero.component.spec.tsx` で photoUrl 無し時の hue placeholder fallback を確認。

## 環境ブロッカー（user-gated）

- R2 secret（`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`）未投入時は photoUrl が付かず placeholder のみ（fail-soft）。実 R2 presigned URL の staging smoke には staging の secret + deploy が必要で user-gated。
