# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |

## 目的

全 quality gate を通し、N+1 計測 / 02a regression / 無料枠境界 / secret hygiene を確認する。

## Quality Gate

| Gate | コマンド | 期待 | AC |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | 0 error | AC-6 |
| lint | `mise exec -- pnpm lint` | 0 error | AC-6 |
| build | `mise exec -- pnpm build` | success | AC-6 |
| 単体 test | `mise exec -- pnpm test --filter @apps/api` | U-1〜U-9 全 PASS | AC-4 |
| 統合 test | `mise exec -- pnpm test:integration` 等 | I-1〜I-4 全 PASS | AC-1, AC-5 |
| 02a regression | 02a 既存 test 全実行 | 全 PASS | AC-5 |
| coverage | task の repository / builder 修正範囲 | 既存 baseline 以上 | — |
| import drift | `git diff` で `MemberId` / `ResponseId` import 不変 | 改変 0 件 | AC-7 |

## N+1 計測

- spy で `D1Database.prepare` 呼び出し回数を測定
- 単一 member 構築: **1 回**（chunk 数 = 1）
- 100 member 構築: **2 回**（chunk(80) で 2 回）
- 250 member 構築: **4 回**（chunk(80) で 4 回）
- 結果は `n-plus-1-metric.md` に保存

## 無料枠 / 性能境界

- D1 row reads: 1 chunk あたり最大 80 row scan 想定。100 member でも 2 chunk = 160 read 程度
- Cloudflare Workers CPU time: chunk 並列の Promise.all で worker timeout (default 30s) を超えないことを確認
- N+1 が発生しないため D1 read cost が member 数に比例（線形）

## Secret hygiene

- `.env` を `Read` / `cat` していない
- API token / OAuth token / session 値が evidence ファイルに混入していない
- curl evidence 保存時に `Authorization: Bearer ***` のマスクを runbook に明記

## 完了条件

- [ ] 全 gate PASS
- [ ] N+1 metric が baseline と一致
- [ ] 02a 既存 test 全 PASS
- [ ] secret hygiene check 完了

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | Phase 9 主成果物 |
| Metric | outputs/phase-09/n-plus-1-metric.md | spy 結果 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ: gate 結果を最終 GO / NO-GO 判定の入力に

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
