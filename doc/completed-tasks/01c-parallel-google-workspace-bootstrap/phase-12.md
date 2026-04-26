# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-23 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | pending |

## 目的

Google Workspace / Sheets 連携基盤 における Phase 12 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 必須タスク一覧（6タスク - 全て完了必須）

| Task | 名称 | 必須 | 成果物パス |
|------|------|------|------------|
| 1 | 実装ガイド作成（2パート構成） | ✅ | outputs/phase-12/implementation-guide.md |
| 2 | システム仕様書更新（spec sync） | ✅ | outputs/phase-12/system-spec-update-summary.md |
| 3 | ドキュメント更新履歴 | ✅ | outputs/phase-12/documentation-changelog.md |
| 4 | 未タスク検出レポート | ✅ | outputs/phase-12/unassigned-task-detection.md |
| 5 | スキルフィードバックレポート | ✅ | outputs/phase-12/skill-feedback-report.md |
| 6 | task-spec 準拠確認 | ✅ | outputs/phase-12/phase12-task-spec-compliance-check.md |

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | integration package の責務 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret placement |
| 参考 | Google Cloud Console | Project / OAuth / service account |
| 参考 | User request on 2026-04-23 | Google スプレッドシート入力 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-12/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 12 | pending | upstream を読む |
| 2 | 成果物更新 | 12 | pending | outputs/phase-12/main.md |
| 3 | 4条件確認 | 12 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |
| メタ | outputs/artifacts.json | root artifacts.json の同期コピー |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成)
- 引き継ぎ事項: Google Workspace / Sheets 連携基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## Part 1 中学生レベル概念説明 (例え話)
Google Sheets は受付ノート、D1 は図書館の正本台帳、Cloudflare は窓口、GitHub は変更履歴、1Password は鍵の保管庫として扱う。

## Part 2 技術者レベル詳細
| 項目 | 詳細 |
| --- | --- |
| task root | doc/01c-parallel-google-workspace-bootstrap |
| key outputs | outputs/phase-02/google-contract-map.md, outputs/phase-05/google-bootstrap-runbook.md, outputs/phase-05/sheets-access-contract.md, outputs/phase-12/implementation-guide.md |
| upstream | ../00-serial-architecture-and-scope-baseline/ |
| downstream | 03-serial-data-source-and-storage-contract / 04-serial-cicd-secrets-and-environment-sync / 05b-parallel-smoke-readiness-and-handoff |
| validation focus | 4条件 + same-wave sync |

### Part 1 の必須要件
- 日常生活の例え話を必ず含める
- 専門用語は使う場合に即説明する
- 「なぜ必要か」を先に説明してから「何をするか」を説明する

### Part 2 の必須要件
- TypeScript の interface / type 定義を含める
- API signature と使用例を記載する
- エラーハンドリングと edge cases を説明する
- 設定可能なパラメータと constants を一覧化する
- ローカル開発は `1Password Environments`、実行環境は `Cloudflare Secrets` / `GitHub Variables` という置き場の差を明示する

## system spec 更新概要
- Step 1-A〜1-C を docs-only / spec_created 前提で閉じる。
- Step 2 domain sync の要否を理由付きで残す。

## LOGS.md 記録
- 変更要約
- 判定根拠
- 未解決事項

## Phase 12 必須成果物
| 成果物 | パス |
| --- | --- |
| Google Workspace 統合ガイド | outputs/phase-12/implementation-guide.md |
| system spec update | outputs/phase-12/system-spec-update-summary.md |
| changelog | outputs/phase-12/documentation-changelog.md |
| unassigned | outputs/phase-12/unassigned-task-detection.md |
| skill feedback | outputs/phase-12/skill-feedback-report.md |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md |
