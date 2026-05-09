# Phase 8: rotation script 実装（rotate-salt.sh / grep gate 拡張）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-8/phase-8.md` |
| 実装区分 | 実装仕様書（bash オーケストレーション + grep gate） |

## 目的

`scripts/audit-correlation/rotate-salt.sh` を新規作成し、`--dry-run` / `--apply` / `--rollback` / `--end-rotation` の 4 モードで salt rotation を半自動化する。1Password (`op`) と `scripts/cf.sh secret put` を組み合わせ、salt 実値はディスク・ログに残さない。`scripts/grep-gate/audit-correlation-secrets.sh` を新規（既存無し前提）作成し、`apps/api/dist` / `apps/api/.wrangler` 配下と log 出力に salt literal が混入していないかを検査する。

## 実行タスク

詳細は `outputs/phase-8/phase-8.md` を正本とする。`scripts/audit-correlation/lib/op-helpers.sh` は共通 wrapper の必要時のみ新規作成する。

## 統合テスト連携

- `shellcheck scripts/audit-correlation/rotate-salt.sh` を Phase 10 で実行し、warn 0 を確認する。
- `--dry-run` モードは副作用なしで stdout に予定アクションのみを出力する。Phase 10 で fixture 駆動の bats / shell test または Node から子プロセス起動して exit code / stdout を assert する。
- grep gate は Phase 10 のテストで正常系（literal 無し）と異常系（テスト fixture に literal 埋め込み）の双方を検証する。

## 参照資料

- `outputs/phase-8/phase-8.md`
- `scripts/cf.sh`（secret put wrapper）
- `scripts/audit-correlation/grep-gate.sh`（既存 grep gate）
- index.md「苦戦箇所・知見」項 2（grep gate 強化）/ 項 4（op CLI non-interactive 制約）/ 項 6（rotation 終了忘れ防止）
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール（Claude Code 必読）」

## 成果物

- `outputs/phase-8/phase-8.md`
- `scripts/audit-correlation/rotate-salt.sh` 新規仕様
- （必要時）`scripts/audit-correlation/lib/op-helpers.sh` 仕様
- `scripts/grep-gate/audit-correlation-secrets.sh` 仕様

## 完了条件

- 4 モード（`--dry-run` / `--apply` / `--rollback` / `--end-rotation`）の引数仕様確定。
- exit code 規約（0 成功 / 1 設定不備 / 2 op CLI 失敗 / 3 cf.sh 失敗）が明記。
- salt 実値がディスク / ログに残らない（環境変数経由のみ）不変条件が明記。
- grep gate のチェック対象 path / NG パターンが列挙されている。
