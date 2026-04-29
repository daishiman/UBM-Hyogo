# Phase 11 outputs / main — 手動 smoke test walkthrough（NON_VISUAL）

> **本タスクは UI / Renderer / 画面遷移を一切伴わない NON_VISUAL タスクである。スクリーンショットは作成しない（`screenshots/` ディレクトリ自体を作らない）。**
> **本 Phase 11 は spec walkthrough のみ。実 secret 配置・実 dev push・実 CD trigger は Phase 13 ユーザー明示承認後の別オペレーションで実行する。**

## 位置付け

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |
| 実地操作 | **不可**（Phase 13 ユーザー承認後に実走） |

## NON_VISUAL 代替 evidence の 4 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 型** | `gh secret set` / `gh variable set` / `gh api repos/.../environments/...` の CLI 引数型・値域（`--env` = `staging` / `production`、Secret/Variable 名 = UPPER_SNAKE_CASE）を仕様レベル検証 | コマンド型整合 | 実 PUT 応答の意味的整合（401/403/404/422） |
| **L2: lint / boundary** | Secret = マスクされる / Variable = マスクされない、repository-scoped vs environment-scoped 同名併存禁止、1Password 正本 / GitHub 派生 の 3 境界を spec で固定 | 二重正本事故 / マスク事故 / 同名併存事故 の境界 | 人為ミス（誤スコープ指定）→ Phase 13 apply-runbook で別途緩和 |
| **L3: in-memory test** | dev push smoke 4 ステップの NOT EXECUTED コマンド系列を `manual-smoke-log.md` で固定 | 「再現する手順」の網羅性 | GitHub Actions eventual consistency / Discord Webhook 到達遅延 / `gh api` rate limit |
| **L4: 意図的 violation snippet** | (a) `CLOUDFLARE_PAGES_PROJECT` を Secret に置く赤、(b) repository/environment 同名併存の上書き混線、(c) `DISCORD_WEBHOOK_URL` 未設定での `if: secrets.X != ''` 無音失敗 を red 確認 | 「赤がちゃんと赤になる」 | green 保証ではない |

## 成果物リンク

- `manual-smoke-log.md` — dev push smoke 4 ステップ（NOT EXECUTED）
- `manual-test-result.md` — NON_VISUAL 宣言と代替証跡の出所
- `link-checklist.md` — 仕様書間リンク健全性

## 保証できない範囲（Phase 12 unassigned-task-detection 申し送り候補）

| # | 項目 | 申し送り先 |
| --- | --- | --- |
| 1 | GitHub Actions の eventual consistency（secret 配置直後の run で反映遅延） | Phase 13 apply-runbook §retry 規約 |
| 2 | Discord Webhook 到達遅延（push 〜 通知まで数秒〜数十秒） | Phase 13 verification-log.md §通知到達確認の wait 規約 |
| 3 | `if: secrets.X != ''` の評価不能再現実験（実走でしか再現不可） | Phase 12 unassigned-task-detection（UT-05 へのフィードバック候補） |
| 4 | `gh api` rate limit / network race | Phase 13 apply-runbook §rate limit 規約 |
| 5 | 1Password Last-Updated メモ drift（手動更新に依存） | Phase 12 op-sync 運用ドキュメント追記方針 / 将来 op SA 化 |

## 上流 3 件完了 NO-GO の 4 重明記（4 箇所目）

> UT-05 / UT-28 / 01b の 3 件 completed が本タスクの必須前提。1 件でも未完了なら NO-GO。
> Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §着手可否ゲート に続き、本 Phase 11 では `manual-smoke-log.md` STEP 0 に再掲する。
