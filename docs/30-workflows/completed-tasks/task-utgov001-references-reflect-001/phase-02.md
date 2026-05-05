# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 |
| 次 Phase | 3 |
| 状態 | spec_created |

## 目的

Phase 1 で定義した入力正本ゲートを、GitHub applied GET evidence 検証、aiworkflow-requirements 反映先選定、index 再生成、mirror 差分確認の実行設計へ落とす。

## 実行タスク

1. evidence validation flow を設計する。
2. 反映先 topology を references / indexes / workflow台帳 / mirror に分割する。
3. 仕様語と実装語の対応表を作成する。
4. validation matrix のコマンドを Phase 4 へ渡す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | phase-01.md | ACとゲート |
| 正本 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch protection current/final state |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | UT-GOV 早見表 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow登録 |
| 台帳 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 上流 handoff |

## 実行手順

### ステップ 1: topology

| concern | 入力 | 出力 | owner |
| --- | --- | --- | --- |
| Evidence gate | `branch-protection-applied-{dev,main}.json` | `outputs/phase-02/evidence-gate.md` | 本タスク |
| 正本反映 | deployment branch strategy reference | `outputs/phase-02/reflection-design.md` | 本タスク |
| Index同期 | quick-reference / resource-map | `outputs/phase-02/index-sync-plan.md` | 本タスク |
| Workflow台帳 | task-workflow-active | `outputs/phase-02/workflow-ledger-plan.md` | 本タスク |
| Mirror確認 | `.claude` / `.agents` | `outputs/phase-02/mirror-check-plan.md` | 本タスク |

### ステップ 2: 仕様語と実装語

| 仕様語 | 実装・証跡語 | 注意 |
| --- | --- | --- |
| final applied state | `branch-protection-applied-{dev,main}.json` の fresh GET | placeholder は不可 |
| required status checks contexts | `required_status_checks.contexts` | null / missing / empty の扱いを分ける |
| six-value governance check | branch protection の6軸状態 | evidenceから読める値だけ反映 |
| closed issue reference | `Refs #303` | `Closes #303` 禁止 |

### ステップ 3: dependency matrix

| 依存 | 必須性 | GO条件 | NO-GO条件 |
| --- | --- | --- | --- |
| UT-GOV-001 Phase 13 fresh GET | 必須 | contexts と6軸が取得済み | `blocked_until_user_approval` placeholder |
| aiworkflow-requirements正本 | 必須 | 反映先が特定済み | 反映先不明 |
| index generator | 必須 | 実行可能 | script不在または失敗 |

## 統合テスト連携

Phase 4 は本Phaseの topology を使い、`jq`、`rg`、`node .../generate-index.js`、`diff -qr` の検証ケースを作る。

## 多角的チェック観点

- current facts と draft proposal を混同しない。
- expected contexts を final applied state として使わない。
- `.claude` 正本更新後に mirror 方針を確認する。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | topology設計 | pending |
| 2 | 用語対応表作成 | pending |
| 3 | dependency matrix作成 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/reflection-design.md | 反映設計 |

## 完了条件

- [ ] 反映先と検証責務が表で固定されている
- [ ] placeholder evidence の NO-GO 条件がPhase 2にも記載されている
- [ ] Phase 4へ渡す検証コマンド候補が揃っている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-02/reflection-design.md` を作成
- [ ] `artifacts.json` の Phase 2 状態を更新

## 次Phase

Phase 3: 設計レビュー
