[実装区分: 実装仕様書]

# Phase 9: QA

## 1. 機能 QA チェックリスト

- [x] `mise exec -- pnpm verify:tokens` がローカルで exit 0
- [x] `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` の HEX literal (`#1e3a8a` / `#3b82f6` / `#ffffff`) が drift として検出されない
- [ ] PR push 後、GitHub Actions の `verify-design-tokens` job が green
- [x] 既存 root convention exclude（`opengraph-image.tsx` / `twitter-image.tsx` / `icon.tsx` / `apple-icon.tsx`）の exclude 効力は維持

## 2. 非機能 QA

- [x] `pnpm typecheck` PASS（`scripts/verify-design-tokens.ts` の型整合）
- [x] `pnpm lint` PASS
- [ ] `bash scripts/verify-pr-ready.sh` PASS（gate-metadata zod / phase12-compliance / indexes drift 全 pass）

## 3. drift 検出能力の維持（regression 観点）

- [x] `apps/web/src/` 配下のソースファイルに HEX literal を一時挿入した場合、`pnpm verify:tokens` が exit 1 で fail する（exclude 拡張により広域 bypass が発生していないことの確認）
- [x] `apps/web/app/` の通常 route.tsx に HEX literal を一時挿入した場合も同様に fail
- [x] exclude された 8 件以外のファイル名が（誤った正規表現で）bypass されない

確認方法（手動・push 前のみ）:

```bash
# 一時的に apps/web/src/lib/_drift_canary.ts に const x = "#ff0000"; を挿入
mise exec -- pnpm verify:tokens   # exit 1 を期待
# 削除して元に戻す
```

## 4. 周辺 workflow への影響なし

| workflow | 影響 | 根拠 |
|---|---|---|
| `verify-indexes-up-to-date` | なし | `.claude/skills/aiworkflow-requirements/indexes` 配下を対象。`scripts/verify-design-tokens.ts` の変更は無関係 |
| `verify-gate-metadata` | なし | `artifacts.json` zod 検証対象。本 PR では新規 `artifacts.json` 追加のみ（schema 準拠） |
| `verify-phase12-compliance` | なし | Phase 12 canonical 9 headings 検査。新 workflow の `phase-12-documentation.md` は SSOT 準拠 |
| `playwright-smoke` / `verify-test-suffix` | なし | テストファイル変更なし |

## 5. レビュー観点

- [x] 追加した 4 件の正規表現が `\/<name>\/route\.tsx$` の形で揃っている（path separator + 末尾 `$` anchor で誤マッチ防止）
- [x] `colorLiteralExcludes` 配列内で root convention 4 件 → route convention 4 件の順序が揃っている（読み取り順序の予測性）
- [x] HEX 直書きが必要な理由（satori が CSS variable を解決できない）が `scripts/verify-design-tokens.ts` の comment と関連 docs に追記されている
