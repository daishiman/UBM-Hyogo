# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-23 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | pending |

## 目的

Google Workspace / Sheets 連携基盤 における Phase 4 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

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
- 本 Phase の主成果物を outputs/phase-04/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 4 | pending | upstream を読む |
| 2 | 成果物更新 | 4 | pending | outputs/phase-04/main.md |
| 3 | 4条件確認 | 4 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

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

- 次: 5 (セットアップ実行)
- 引き継ぎ事項: Google Workspace / Sheets 連携基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 検証コマンド一覧
| コマンド | 目的 | 期待 |
| --- | --- | --- |
| git diff --stat -- doc/01-infrastructure-setup | 変更範囲確認 | scope と一致 |
| rg -n "dev|main|D1|Sheets|1Password" doc/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap | 主要語の横断確認 | 必要箇所が見つかる |
| node .claude/skills/aiworkflow-requirements/scripts/search-spec.js "Cloudflare" -C 2 | 正本仕様検索 | 必要 reference が出る |

## 期待出力表
| 検証 | PASS 条件 |
| --- | --- |
| 正本仕様検索 | 必要 reference が揃う |
| 依存確認 | upstream / downstream が説明できる |
| 変更範囲確認 | scope 外 drift がない |

## verify suite (手動 or 自動)
- 手動: README と index / phase の整合確認
- 手動: source-of-truth と branch/env の説明確認
- 自動: rg / search-spec / git diff で最低限を確認
