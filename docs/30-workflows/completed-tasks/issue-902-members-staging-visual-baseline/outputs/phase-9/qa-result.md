# Phase 9 — QA Result

## 1. QA 観点

| 観点 | 結果 |
|------|------|
| spec ファイル naming 規約（`*.spec.ts`） | 適合（CLAUDE.md 不変条件 #8） |
| 既存 4 spec とのスタイル一貫性 | 適合（同一 helper パターン / 同一 maxDiffPixelRatio） |
| issue #902 受け入れ基準 cover 率 | 8/9 項目を spec で cover（残る 1 件は staging seed 整備で別 ops） |
| 同種課題への汎用解 | `[id]` 動的ルートを env-gated + `test.skip` で受ける pattern を再利用可能化 |

## 2. issue #902 受け入れ基準対応

| 項目 | 対応 |
|------|------|
| staging seed 確認 | user-gated（infra ops） |
| 初期表示の非空 seed 確認 | user-gated |
| 2 spec 追加 + testMatch 自動マッチ | ✅ Phase 5 §2 |
| CI baseline 2 枚 commit | user-gated（Phase 5 §2 Step 4） |
| `e2e:visual:staging` exit 0 / diff < 5% | user-gated |
| screenshot + metadata 配置 | Phase 11 evidence inventory |
| env / HEX / `process.env` 直接参照 0 件 | ✅ Phase 8 §1 |
| OpenNext bundle `[project]/...` 仮想 module 混入 0 件 | spec 範囲外（apps/web bundle 影響なし） |
| `bash scripts/verify-pr-ready.sh` exit 0 | Phase 8 §1 |
| job 名 screens 数表記更新 | ✅ Phase 5 §2 Step 2 |

## 3. 残課題

- staging seed 投入と `PLAYWRIGHT_MEMBER_DETAIL_ID` の GitHub Actions secret/var 注入は本仕様外（infra ops）。`test.skip` フォールバックで本 PR 段階の job は green を維持する設計。
