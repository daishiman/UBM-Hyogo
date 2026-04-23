# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-23 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

データ入力源と保存契約 における Phase 1 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Repository / D1 / API route |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 基本方針 |
| 必須 | User request on 2026-04-23 | Sheets と DB の最適解 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-01/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 1 | pending | upstream を読む |
| 2 | 成果物更新 | 1 | pending | outputs/phase-01/main.md |
| 3 | 4条件確認 | 1 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 の主成果物 |
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

- 次: 2 (設計)
- 引き継ぎ事項: データ入力源と保存契約 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## 真の論点
- 何を初回スコープに固定し、何を未タスクへ回すか。
- source-of-truth と branch/env を一意にできるか。

## 依存関係・責務境界
- upstream / downstream / parallel の関係を index と同一に保つ。
- web / api / db / input source / secret owner を混在させない。

## 価値とコスト
- 初回価値: 実装前に迷いを消す。
- 初回で払わないコスト: 通知基盤や過剰監視。

## 改善優先順位
- 1. branch/env
- 2. runtime split
- 3. source-of-truth
- 4. secret placement
- 5. handoff/unassigned

## 4条件評価
| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 誰のどのコストを下げるか定義されているか | TBD |
| 実現性 | 無料運用の初回スコープで成立するか | TBD |
| 整合性 | branch / env / runtime / data / secret が矛盾しないか | TBD |
| 運用性 | 運用・rollback・handoff が破綻しないか | TBD |

## スコープ
### 含む
- Sheets -> integration -> D1 flow
- D1 schema direction
- manual / scheduled / backfill sync
- audit / rollback / restore 方針

### 含まない
- sync 実装
- 本番データ投入
- Sheets 直接 read でアプリ成立させる設計

## 受入条件 (AC)
- AC-1: Sheets input / D1 canonical の source-of-truth が競合しない
- AC-2: sync の manual / scheduled / backfill が分かれている
- AC-3: D1 の backup / restore / preview 方針が runbook 化されている
- AC-4: 障害時の復旧基準が Sheets 基準か D1 基準か明確である
- AC-5: 純 Sheets 案を非採用とした理由が無料運用と整合している

## 既存資産インベントリ
| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| 正本仕様 | task-spec / aiworkflow skill と関連 reference | 要確認 |
| 変更分 | doc/01-infrastructure-setup | 要確認 |
| legacy drift | legacy snapshot との差分 | 要確認 |
| 外部サービス | Google Sheets / Cloudflare D1 | 要確認 |

## 正本仕様参照表
| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Repository / D1 / API route |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 基本方針 |
| 必須 | User request on 2026-04-23 | Sheets と DB の最適解 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |
