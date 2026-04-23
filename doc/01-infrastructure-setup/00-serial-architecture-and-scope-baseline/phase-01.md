# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-23 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

アーキテクチャ基準線とスコープ固定 における Phase 1 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1-13 と品質基準 |
| 必須 | .claude/skills/aiworkflow-requirements/SKILL.md | 仕様参照の入口 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Pages / Workers / D1 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | apps/web / apps/api / integrations 分離 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | feature -> dev -> main |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare / GitHub / 1Password 分離 |
| 参考 | User request on 2026-04-23 | Sheets 入力・無料運用・インフラ先行 |

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
- 引き継ぎ事項: アーキテクチャ基準線とスコープ固定 の判断を次 Phase で再利用する。
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
- feature -> dev -> main の branch / environment を固定する
- apps/web と apps/api の責務境界を固定する
- Google Sheets input / D1 canonical の判断を formalize する
- 初回スコープ外項目を明示する

### 含まない
- 実コード実装
- 本番デプロイ
- 通知基盤の先行導入

## 受入条件 (AC)
- AC-1: web / api / db / input source の責務境界が一意に説明できる
- AC-2: feature -> dev -> main と local / staging / production の対応表が確定している
- AC-3: Google Sheets input / D1 canonical の判断根拠が残っている
- AC-4: scope 外項目と未タスク候補が分離されている
- AC-5: 価値性 / 実現性 / 整合性 / 運用性の4条件を PASS と判定できる

## 既存資産インベントリ
| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| 正本仕様 | task-spec / aiworkflow skill と関連 reference | 要確認 |
| 変更分 | doc/01-infrastructure-setup | 要確認 |
| legacy drift | legacy snapshot との差分 | 要確認 |
| 外部サービス | Cloudflare Pages / Cloudflare Workers / Cloudflare D1 / Google Sheets / GitHub | 要確認 |

## 正本仕様参照表
| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1-13 と品質基準 |
| 必須 | .claude/skills/aiworkflow-requirements/SKILL.md | 仕様参照の入口 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Pages / Workers / D1 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | apps/web / apps/api / integrations 分離 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | feature -> dev -> main |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare / GitHub / 1Password 分離 |
| 参考 | User request on 2026-04-23 | Sheets 入力・無料運用・インフラ先行 |
