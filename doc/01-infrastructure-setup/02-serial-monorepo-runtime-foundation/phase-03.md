# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | pending |

## 目的

モノレポとランタイム基盤 における Phase 3 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-03/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 3 | pending | upstream を読む |
| 2 | 成果物更新 | 3 | pending | outputs/phase-03/main.md |
| 3 | 4条件確認 | 3 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 の主成果物 |
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

- 次: 4 (事前検証手順)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## レビューチェックリスト (4条件)
| 観点 | レビュー問い | 判定 |
| --- | --- | --- |
| 価値性 | この task は誰の迷いを減らすか | TBD |
| 実現性 | 初回無料運用で成立するか | TBD |
| 整合性 | branch / env / runtime / data / secret が一致するか | TBD |
| 運用性 | rollback / handoff / same-wave sync が可能か | TBD |

## より単純な代替案
- 代替案A: Google Sheets を正本DBにする
- 代替案B: OpenNext 単一構成にする
- 代替案C: 通知基盤まで同時に入れる

## PASS / MINOR / MAJOR 判定
| 項目 | ルール |
| --- | --- |
| PASS | 下流 blocker を残さない |
| MINOR | 同 wave で吸収できる |
| MAJOR | task 分割または前提再定義が必要 |

## MINOR 追跡表
| ID | 内容 | 対応 Phase |
| --- | --- | --- |
| M-01 | wording / naming drift | 8 or 12 |
