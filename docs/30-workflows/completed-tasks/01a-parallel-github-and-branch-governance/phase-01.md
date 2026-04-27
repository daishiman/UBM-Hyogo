# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-23 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

GitHub Repository と branch protection / environment / PR template / CODEOWNERS の現状を正本仕様と照合し、Phase 2 設計の入力を確定する。

## 真の論点

1. **何を初回スコープに固定するか**: branch protection・environments・PR template・CODEOWNERS の 4 領域を単一タスクで閉じる
2. **source-of-truth の一意化**: `deployment-branch-strategy.md` が branch/env の正本。`deployment-core.md` の `develop` 表記は legacy 扱いで、branch 名の判定には使わない
3. **why now**: Wave 1 タスク。後続タスク（02-monorepo, 04-cicd-secrets）が CODEOWNERS と environment を参照するため先行必須
4. **why this way**: GitHub UI での手動適用 + runbook 化。Terraform 等の IaC は初回スコープ外

## 依存関係・責務境界

- **上流**: `00-serial-architecture-and-scope-baseline/` の baseline が確定していること
- **下流**: `02-serial-monorepo-runtime-foundation` (branch protection を前提に PR フロー設計), `04-serial-cicd-secrets-and-environment-sync` (environment 名と secrets placement を参照)
- **並列**: `01b-parallel-cloudflare-base-bootstrap`, `01c-parallel-google-workspace-bootstrap` (独立実行)
- **境界**: このタスクは GitHub 設定のみ。Cloudflare deploy 実行・secret 実値投入は含まない。runtime secret placement は `02-auth.md` / `08-free-database.md` / `10-notification-auth.md` の正本に委ね、この task では変更しない

## 実行タスク

### ステップ 1: 正本仕様の読み込み

参照先を読み込み、要件を確定する。

| 参照先 | 確認内容 |
| --- | --- |
| `deployment-branch-strategy.md` | branch 3層構成・reviewer 数・force push 禁止 |
| `deployment-core.md` | CI/CD 品質ゲート・environment 構成 |
| `doc/00-getting-started-manual/specs/00-overview.md` | ブランチ戦略・secrets 管理方針 |

### ステップ 2: 現状インベントリ確認

GitHub Repository Settings で現在の設定状態を確認する。

| 設定カテゴリ | 確認項目 | 期待値 |
| --- | --- | --- |
| Branches > main | Require PR reviews | 2 名 |
| Branches > main | Require status checks | ci / Validate Build |
| Branches > main | Allow force pushes | OFF |
| Branches > dev | Require PR reviews | 1 名 |
| Branches > dev | Allow force pushes | OFF |
| Environments > production | Required reviewers | 2 名 |
| Environments > production | Deployment branches | main のみ |
| Environments > staging | Deployment branches | dev のみ |
| PR template | .github/pull_request_template.md | true issue / dependency / 4条件 欄あり |
| CODEOWNERS | .github/CODEOWNERS | task 責務と衝突なし |

### ステップ 3: 成果物作成

`outputs/phase-01/main.md` に要件定義書を出力する。

### ステップ 4: 4条件評価と handoff

下流 Phase に渡す blocker と open question を記録する。

## 受入条件 (AC) トレーサビリティ

| AC | 内容 | この Phase での確認事項 |
| --- | --- | --- |
| AC-1 | main は reviewer 2 名、dev は reviewer 1 名 | deployment-branch-strategy.md で数値を確定 |
| AC-2 | production は main、staging は dev のみ受け付ける | deployment-branch-strategy.md の環境マッピングで確認 |
| AC-3 | PR template に true issue / dependency / 4条件の欄がある | 正本仕様に template 仕様が存在するか確認 |
| AC-4 | CODEOWNERS と task 責務が衝突しない | 並列タスク（01b, 01c）の担当ディレクトリ確認 |
| AC-5 | local-check-result.md と change-summary.md の close-out path がある | Phase 13 成果物 path の事前確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート（branch/env の命名は `deployment-branch-strategy.md` を正本とする） |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | PR は承認後のみ |
| 参考 | `doc/00-getting-started-manual/specs/00-overview.md` | ブランチ戦略・secrets 一覧 |
| 参考 | `doc/00-getting-started-manual/specs/02-auth.md` | Google 認証・runtime secret placement boundary |
| 参考 | `doc/00-getting-started-manual/specs/08-free-database.md` | D1 / runtime secret placement boundary |
| 参考 | `doc/00-getting-started-manual/specs/10-notification-auth.md` | 通知・認証の環境変数境界 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の要件定義を設計の入力として使用 |
| Phase 7 | AC トレースマトリクスに使用 |
| Phase 10 | 最終 gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点

- **価値性**: reviewer 不在・force push 許容によるリリース事故リスクを排除する
- **実現性**: GitHub UI 手動操作のみで完結。無料枠内で成立
- **整合性**: branch/env/reviewer 数が正本仕様と一致する
- **運用性**: rollback（branch protection 無効化）手順が runbook に存在する

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 正本仕様読み込み | 1 | pending | deployment-branch-strategy.md を読む |
| 2 | 現状インベントリ確認 | 1 | pending | GitHub Settings で現在値を記録 |
| 3 | 要件定義書作成 | 1 | pending | outputs/phase-01/main.md |
| 4 | AC トレーサビリティ確認 | 1 | pending | 全 AC が正本仕様に根拠あることを確認 |
| 5 | 4条件評価と handoff 記録 | 1 | pending | Phase 2 への blockers を明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-01/main.md` | 要件定義書（現状確認・AC・4条件） |
| メタ | `artifacts.json` | Phase 1 status を completed に更新 |

## 完了条件

- [ ] `outputs/phase-01/main.md` が作成済み
- [ ] 全 AC (AC-1〜5) に正本仕様への根拠リンクがある
- [ ] downstream Phase (2) への handoff items が記録済み
- [ ] 異常系（権限不足・設定 drift）の確認が記録済み

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック済み
- [ ] 異常系（権限・無料枠・drift）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase 1 を completed に更新済み

## 次Phase

- 次: 2 (設計)
- 引き継ぎ事項: 現状インベントリ（差分リスト）と全 AC のトレース根拠を Phase 2 に渡す
- ブロック条件: `outputs/phase-01/main.md` が未作成なら Phase 2 に進まない

## 改善優先順位

1. branch/env（reviewer 数・force push 禁止）
2. PR template（4条件の欄）
3. CODEOWNERS（task 責務境界の反映）
4. secret placement（名称と配置先の確定）
5. handoff 記録（downstream への情報渡し）

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | reviewer 不在・force push によるリリース事故リスクを排除できるか | PASS（branch protection で機械的に強制） |
| 実現性 | GitHub UI 手動操作のみで初回無料枠内に収まるか | PASS（追加費用なし） |
| 整合性 | branch / env / reviewer / secret placement が正本仕様と矛盾しないか | 要確認（現状 drift を Phase 2 で特定） |
| 運用性 | rollback（branch protection の一時解除）が runbook で可能か | PASS（管理者権限で即時対応可） |

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| 正本仕様 | `deployment-branch-strategy.md` | 確認済み（3層構成・reviewer数・force push禁止） |
| branch protection | GitHub Settings > Branches | 要確認（Phase 5 で適用） |
| environments | GitHub Settings > Environments | 要確認（production/staging の存在確認） |
| PR template | `.github/pull_request_template.md` | 要確認（4条件欄の有無） |
| CODEOWNERS | `.github/CODEOWNERS` | 要確認（task 責務との照合） |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch 3層構成・reviewer 数 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI 品質ゲート・environment 構成 |
| 参考 | `doc/00-getting-started-manual/specs/00-overview.md` | システム全体のブランチ戦略・secrets |
