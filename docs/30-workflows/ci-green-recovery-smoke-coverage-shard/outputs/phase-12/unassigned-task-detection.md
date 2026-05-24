# Phase 12 — Unassigned Task Detection

> task: `ci-green-recovery-smoke-coverage-shard` / status: `implemented_local_evidence_captured`
> 本ファイルは **0 件でも出力必須**。スコープ外項目を未タスク候補として列挙するか 0 件宣言する。

## 検出方針

本仕様は 3 lane を 1 実装サイクルで閉じる（CONST_007）。`index.md` の「スコープ外」に明記した項目のうち、**将来別タスク化が妥当なもの**を未タスク候補として列挙する。各候補は「本タスクでは実装しない理由」を併記する。

## 未タスク候補（backlog 候補）

| # | 候補 | 区分 | 本タスクで実装しない理由 | 推奨対応 |
|---|---|---|---|---|
| U-1 | staging secret 5 種（`STAGING_AUTH_SECRET` ほか）の **実投入** | 運用操作（user-gated） | secret 実投入はユーザー gated。手順は runbook に記述するが本仕様では実行しない | ユーザーが 1Password → `gh secret set --env staging-runtime-smoke` を承認・実行（runbook 参照） |
| U-2 | 即時運用の **静的 bearer 再発行**（mint 導入前に今すぐ緑にしたい場合） | 運用操作（user-gated） | mint 化が恒久解決。即時復旧は暫定経路で、実行はユーザー判断 | runbook の即時再発行手順に従いユーザーが実行 |
| U-3 | coverage threshold 値（80%）の変更 | スコープ外（正本維持） | issue-617 / coverage-80-enforcement の正本を維持する方針。本タスクは threshold に触れない | 変更が必要なら別タスクで issue-617 正本を更新 |
| U-4 | `/me` 系 endpoint のロジック変更 | スコープ外（不変条件） | Lane A は bearer 供給方法のみ変更し endpoint は変えない | 不要（endpoint 変更の要求が出た時点で別タスク） |
| U-5 | Lane C checkout 失敗の transient 再現確認（re-run） | 運用観測 | hardening は防御的に実装済みだが、transient か恒常かの判定は CI re-run というユーザー運用側の観測が必要 | 実装後の最初の CI run で MT-C1 を観測（phase-11 結果に記録） |

> U-1 / U-2 / U-5 は「未割当のコードタスク」ではなく **user-gated 運用操作 / 観測**。新規バックログ issue としては起票せず、runbook と phase-11 結果欄で追跡する。
> U-3 / U-4 は明示的スコープ外で、現時点で起票すべき要求は無い（0 件宣言相当）。

## 結論

- 新規に **コード実装の未割当タスクは 0 件**（3 lane のコード・CI config・runbook 実装スコープは閉じている）。
- スコープ外項目は U-1〜U-5 として記録。いずれも user-gated 運用 / 正本維持 / 観測であり、別 issue 起票は不要。
