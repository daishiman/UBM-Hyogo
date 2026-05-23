# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `.github/workflows/cf-audit-log-monitor.yml` のコード差分（L39 削除）を伴うため、実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-720 cf-audit-monitor environment protection fix (案B' 採用) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

`cf-audit-log-monitor.yml` の hourly 連続 failure を解消するため、採用方針（案B': environment なし + repo-level mirror）の必要性・スコープ・受入条件を確定し Phase 2 設計に渡す入力を固定する。

## 真の論点

採用方針は user 承認済み・固定（案B'）。本 Phase では「案B' を選んだ場合に解像度を持って解くべき設計論点」を 4 点明文化する。

### 論点 1: 既存 secrets / vars の repo-level 複製範囲

production environment にぶら下がっている secrets / variables のうち、`cf-audit-log-monitor.yml` が実際に参照しているものだけを抽出する必要がある。過剰複製は repo-level の secret surface を不必要に拡大させる。

参照されている secrets (workflow yaml L69, L70, L79, L82, L111, L113, L114, L140 から確認):
- `secrets.CF_AUDIT_D1_TOKEN_PROD`
- `secrets.CF_AUDIT_TOKEN_PROD`
- `secrets.CF_AUDIT_WORKERS_AI_TOKEN`
- `secrets.SLACK_WEBHOOK_INCIDENT`
- `secrets.EMAIL_WEBHOOK_URL`
- `secrets.GITHUB_TOKEN` (auto, 複製不要)

参照されている vars:
- `vars.CF_AUDIT_CLASSIFIER`
- `vars.ML_MODEL_PATH`
- `vars.CF_AUDIT_IF_MODEL`
- `vars.CF_AUDIT_XGB_MODEL`
- `vars.CF_AUDIT_WORKERS_AI_URL`
- `vars.CLOUDFLARE_ACCOUNT_ID`
- `vars.CF_AUDIT_CLASSIFIER_VERSION`
- `vars.EMAIL_FROM`
- `vars.EMAIL_TO`

→ Phase 2 で `gh secret list` / `gh variable list` (repo-level vs production env) の diff を取り、複製が必要な差分のみを `secret-migration-plan.md` に列挙する。

### 論点 2: 参照名の変更可否

repo-level secret 名を新規につける（例: `MONITOR_CF_AUDIT_D1_TOKEN`）か、同名で複製するかの選択。

選択肢:
- **(A) 同名複製**: workflow yaml の `secrets.CF_AUDIT_D1_TOKEN_PROD` 参照を変更しない → コード差分が完全に L39 削除 1 行のみで済む。**第一推奨**。
- **(B) 新名前**: 監視系であることを表現できるが workflow yaml 全体に diff が広がる。最小差分原則に反する。**不採用**。

→ Phase 1 では **(A) 同名複製** を採用として確定。

### 論点 3: production env 側 secret の取り扱い

repo-level に複製後、production env 側 secret を残すか削除するか。

選択肢:
- **(A) 当面維持**: 移行期間中は両側に存在。万一 workflow が production env 経路に戻った場合の安全弁。本タスクスコープ外で削除する。**第一推奨**。
- **(B) 即時削除**: 単一正本化できるが、移行直後の rollback パスを失う。**準推奨だが本サイクル不採用**。

→ Phase 1 では **(A) 当面維持** を採用。削除は別 followup（Phase 12 で unassigned-task 記録）。

### 論点 4: ADR / runbook 追記の粒度

監視系 (read-only) と deploy 系 (mutation) で environment 分離する原則をどこまで強く文書化するか。

選択肢:
- **(A) `15-infrastructure-runbook.md` への operation note 追加のみ**: 軽量・即日反映可能。**第一推奨**。
- **(B) 別 ADR ファイル新設**: 重量級・将来同種判断時の参照源になるが、初動の管理コストが大きい。**Phase 2 で検討**。

→ Phase 1 では **(A)** を基本とし、Phase 2 設計内で ADR 化要否を再判断する。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | `.github/workflows/cf-audit-log-monitor.yml` | L39 を 1 行削除する以外は不変 |
| 上流 | production environment | branch policy / required reviewers / wait timer はすべて不変 |
| 上流 | repository-level secrets / variables | 監視系 secret の追加のみ。既存 deploy 系 secret は repo に複製しない |
| 連携 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | ADR / operation note 追記対象 |
| 連携 | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/` | runtime 復旧の前提条件として依存される側 |
| 対象外 | `cf-audit-log-7day-summary.yml` | 別 workflow、本タスクで触れない |
| 対象外 | D1 schema | 不要 |
| 対象外 | `apps/api` / `apps/web` 配下 | 不要 |
| 対象外 | recovery D'+0 起算 | 本タスク完了後に user が別途実施 |

## 価値とコスト評価

- **初回提供価値**: hourly snapshot 復旧 → issue-655 D'+7 recovery 2nd cycle 起動前提が回復。`actualSnapshots = 168` を満たせる状態に戻る。
- **初回に払わないコスト**: 新 environment 新設 (`monitor-readonly` 等)、production env 側 deploy 系 secret の構成変更、新 secret 値の生成。
- **設計コスト**: Phase 02 成果物 3 件 + Phase 03 レビュー 1 件 = 4 ドキュメント。
- **実装コスト**:
  - `.github/workflows/cf-audit-log-monitor.yml` 1 行削除（実工数: 5 分）
  - 必要 secrets / vars の repo 複製（user 操作・5 secrets × 1Password から op read + `gh secret set`、5〜10 分）
  - dry_run 起動 + 6h 連続観察（runtime 評価 6 時間以上の wallclock）
- **運用コスト**: repo-level secret の年次ローテーション、monitor 系 secret surface の monitoring。

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | hourly snapshot 連続 failure が解消され 168h 集約前提が回復するか | PASS | — |
| 実現性 | production env 保護を維持したまま `dev` ブランチから実行可能か | PASS | `environment: production` 行削除 + 同名 repo secret 複製で達成 |
| 整合性 | CLAUDE.md secret 管理ルール（1Password 正本 / 平文 commit 禁止）と整合するか | PASS | `op read op://...` 経由で `gh secret set --body` に動的注入する手順を Phase 06 で明示 |
| 運用性 | repo-level secret に複製することで security boundary が広がる影響が許容範囲か | CONDITIONAL | ADR で「監視系 read-only secret に限定」原則を明文化し、deploy 系 secret を repo に複製しない方針を Phase 02/08 で固定 |

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | `environment: production` (L39) が hourly fail の根本原因 | `.github/workflows/cf-audit-log-monitor.yml:39` |
| production environment | `{"protected_branches":false,"custom_branch_policies":true}` + branch policy = `main` のみ | 事前 evidence 取得済 |
| 利用可能 environments | `dev` / `main` / `production` / `staging` / `staging-runtime-smoke` / `visual-baseline-approval` | 事前確認済 |
| 原典 unassigned-task | `docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` | 案 A/B/C の選択肢提示済。本仕様書は案B' を採用 |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/` | runtime 起動条件として本タスクに依存 |
| `scripts/cf.sh` | secret は 1Password 経由で `op run --env-file=.env` ラップ。本タスクでは `gh secret set` に応用 | CLAUDE.md |

## スコープ確定

### 含む

- `.github/workflows/cf-audit-log-monitor.yml` L39 削除
- repo-level secret / variable 複製計画（実投入は user-gated）
- ADR / runbook 追記
- workflow_dispatch dry_run 検証
- hourly 6 連続 success 確認
- production env 側 secret 削除手順記述（実施は別 followup）

### 含まない

- production environment 自体の変更
- 新規 environment の作成
- 他 workflow への波及修正
- D1 schema 変更
- recovery D'+0 起算

## 受入条件 (AC) 確認

index.md で定義した AC-1〜AC-8 を Phase 1 で正式承認する。
- AC-1, AC-2 → Phase 2 成果物に対応
- AC-3, AC-4 → Phase 11 runtime evidence に対応
- AC-5 → Phase 8 runbook 追記に対応
- AC-6, AC-8 → Phase 12 unassigned-task-detection に対応
- AC-7 → Phase 12 compliance check に対応

## 用語集

| 用語 | 意味 |
| --- | --- |
| environment gate | GitHub Actions の `environment:` 指定により branch policy / required reviewers / wait timer 等の保護を適用する仕組み |
| branch policy | environment の deployment branch policy。`production` env では `main` のみが許可されている |
| 案B' | 本仕様書採用方針。workflow から `environment: production` 指定を外し、必要 secrets を repo-level に複製する案 |
| repo-level secret | GitHub repository 単位で管理される secret。private repo の全 workflow からアクセス可能 |
| environment-level secret | GitHub environment 単位で管理される secret。当該 environment 配下の job からのみアクセス可能 |
| 同名複製 | repo-level に environment-level と同じ key 名で複製すること。workflow yaml の参照名を変更しなくて済む |
| 監視系 workflow | resource を read するのみで mutation を伴わない workflow（本ケースの hourly snapshot 取得） |
| deploy 系 workflow | resource に対し mutation（deploy / rollback / schema apply 等）を伴う workflow |
| 6 連続 success | hourly schedule の 6 サイクル（6 時間）連続で run が success すること。本タスク完了条件 |

## 実行タスク

- [ ] 原典 `docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md` を再読し、案B' 採用に伴う影響面を整理
- [ ] `.github/workflows/cf-audit-log-monitor.yml` の secrets / vars 参照を全数列挙
- [ ] 4 つの真の論点を明文化
- [ ] 4 条件評価の CONDITIONAL 解消条件を Phase 2 へ申し送り
- [ ] 既存資産インベントリを記録
- [x] 本 `phase-01.md` を要件定義主成果物として確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-issue-655-cf-audit-log-monitor-production-env-protection-001.md | 原典 |
| 必須 | .github/workflows/cf-audit-log-monitor.yml | 対象 workflow |
| 必須 | docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/ | 親 workflow |
| 必須 | CLAUDE.md | secret 管理ルール |
| 参考 | https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions | secret 仕様 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | phase-01.md | 要件定義主成果物（4 論点 / スコープ / AC / 4 条件評価 / 既存資産 / 用語集） |

## 完了条件

- [ ] 4 つの真の論点が文書化されている
- [ ] 4 条件評価が PASS / CONDITIONAL で記録され、CONDITIONAL の解消条件が Phase 2 へ申し送られている
- [ ] AC-1〜AC-8 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが行番号付きで記録されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [x] `phase-01.md` が要件定義主成果物として作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（repo secret 投入漏れ / 同名衝突 / dry_run 401 / 6h 途中 fail）を Phase 2 申し送りに含む
- 次 Phase への引き継ぎ事項を明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜4 の採用案 ((A)-(A)-(A)-(A)) を Phase 2 設計の前提として固定
  - CONDITIONAL 解消条件 1 件（監視系 secret 限定原則の ADR 化）を Phase 2 で具体化
  - secrets / vars 全数列挙結果を Phase 2 secret-migration-plan に転記
- ブロック条件: `phase-01.md` 未作成 / CONDITIONAL 解消条件未記録 の場合は Phase 2 に進まない
