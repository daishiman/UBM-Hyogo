# Phase 12 artifacts.json status schema validator 追加 - タスク指示書

## メタ情報

```yaml
issue_number: 729
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-27-followup-001-phase12-artifacts-status-schema-validator                |
| タスク名     | Phase 12 artifacts.json status schema validator 追加                          |
| 分類         | スキル改善 / Validator                                                        |
| 対象機能     | `task-specification-creator` skill の Phase 12 verification                   |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | task-27 Phase 12 skill-feedback-report                                        |
| 発見日       | 2026-05-15                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-specification-creator` skill の Phase 12 verification は、ワークフロー root の `artifacts.json` および各 Phase output 配下の `artifacts.json` の生成・整合性を検査する責務を持つ。しかし現状の Phase 12 verifier は `artifacts.json` の `status` フィールドが `.claude/skills/task-specification-creator/schemas/artifact-definition.json` の enum と一致しているかを schema validation で検証していない。

`artifact-definition.json` では `status` を enum (例: `pending` / `in_progress` / `completed` / `blocked` など) として定義しており、加えて詳細な実行状態 (例: `implemented_local_evidence_captured`、`docs_only_spec_created` など) は `metadata.workflow_state` に分離する設計になっている。task-27 ではこの分離方針が validator にも執筆者にも明文化されておらず、root `status` に詳細状態を直書きしてしまうケースが頻発した。

### 1.2 問題点・課題

- root `status` (schema enum) と `workflow_state` (詳細実行状態) の責務分離が validator で強制されていない
- 詳細状態を root `status` に書いた場合に Phase 12 verification が即時 fail せず、後工程の PR レビュー時点まで露見しない
- 同じ matrix 型 docs-only タスク (task-27 と同形) では確実に再発する構造的問題

### 1.3 放置した場合の影響

- 後続タスクで root `status` に schema 外の文字列が混入し、CI / 集計スクリプトが silent fail する
- `workflow_state` の概念が明文化されないまま属人化し、validator の意味が形骸化する
- skill 出力品質が劣化し、Phase 12 gate の信頼性が落ちる

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-specification-creator` の Phase 12 verification に、root および各 Phase の `artifacts.json` の `status` が `artifact-definition.json` schema の enum に合致することを早期 fail で保証する validator を追加する。同時に詳細状態は `metadata.workflow_state` に分離する設計を skill 仕様 / Phase 12 reference に明文化する。

### 2.2 最終ゴール

- Phase 12 verifier が `artifacts.json` 全件に対し schema validation を行い、`status` enum 違反を fail として検出する
- 詳細実行状態は `metadata.workflow_state` に格納する規約が skill references に明記される
- task-27 と同形の matrix 型 docs-only タスクで、執筆者が root `status` を誤って詳細状態にできない
- validator の fail メッセージから違反箇所と修正方法が一意に特定できる

### 2.3 スコープ

#### 含むもの

- `.claude/skills/task-specification-creator/schemas/artifact-definition.json` を用いた `artifacts.json` validation script の追加
- Phase 12 verification 既存 script への組み込み
- `metadata.workflow_state` 規約の references 追記
- validator の fail メッセージ整備

#### 含まないもの

- `artifact-definition.json` schema 自体の構造変更 (必要時は別タスク)
- 既存 artifacts.json の status 書き換え一括移行 (再発防止後に必要なら別タスク)
- 他 skill の Phase 12 logic 変更

### 2.4 成果物

- `.claude/skills/task-specification-creator/scripts/verify-artifacts-status.<sh|js>` (新規 or 既存統合)
- Phase 12 verification への組み込み diff
- references 内 (`.claude/skills/task-specification-creator/references/`) の `workflow_state` 規約セクション追加

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `.claude/skills/task-specification-creator/schemas/artifact-definition.json` が正本として存在し enum が定義されている
- ajv / jsonschema 等の validator が pnpm workspace で利用できる
- task-27 Phase 12 skill-feedback-report の gap 記述に齟齬がない

### 3.2 依存タスク

- task-27 (UI MVP W9 SOLO MVP 3-Layer Task Mapping) — 発見元、Phase 12 完了済みであること

### 3.3 必要な知識

- JSON Schema (draft-07 以降) と ajv の使い方
- `task-specification-creator` skill の Phase 12 verification フロー
- root `artifacts.json` と Phase output `artifacts.json` の階層構造

### 3.4 推奨アプローチ

`artifact-definition.json` を ajv でコンパイルし、Phase 12 verification 時に root + 各 Phase output の `artifacts.json` を再帰的に validate する。enum 違反は fail、`metadata.workflow_state` に値があれば warn せず通過させる。fail メッセージには違反 path、検出値、許容 enum、`metadata.workflow_state` への移行例を含める。

---

## 4. 実行手順

### Phase構成

1. schema 適用と validator script の追加
2. Phase 12 verification への組み込み
3. references / 規約への明文化

### Phase 1: schema 適用と validator script の追加

#### 目的

`artifact-definition.json` を読み込み `artifacts.json` 全件を validate する script を追加する。

#### 手順

1. ajv で schema をコンパイル
2. ワークフロー root と `outputs/phase-*/` 配下の `artifacts.json` を列挙
3. 各ファイルに対し `status` の enum 検証を実施
4. 違反時に path / 検出値 / 期待 enum を出力して非ゼロ exit

#### 成果物

`scripts/verify-artifacts-status.*` と単体動作確認ログ

#### 完了条件

サンプル違反データで fail、正常データで pass することを確認

### Phase 2: Phase 12 verification への組み込み

#### 目的

既存 Phase 12 verification 経路から新 validator を呼び出し、gate の一部として機能させる。

#### 手順

1. Phase 12 verification の orchestrator script を特定
2. 新 validator の呼び出しを追加 (fail 時 short-circuit)
3. CI / pre-commit 経路で同じ validator が走るか確認

#### 成果物

Phase 12 verification orchestrator への組み込み diff

#### 完了条件

Phase 12 を走らせた際に `status` enum 違反が fail として可視化される

### Phase 3: references / 規約への明文化

#### 目的

root `status` (schema enum) と `metadata.workflow_state` (詳細実行状態) の分離方針を skill references に明文化する。

#### 手順

1. `.claude/skills/task-specification-creator/references/` に `workflow_state` の規約セクションを追加
2. 詳細状態 (例: `implemented_local_evidence_captured`、`docs_only_spec_created`) の例を列挙
3. Phase 12 verification の README にも参照リンクを追加

#### 成果物

references 追記 diff

#### 完了条件

執筆者が root `status` と `workflow_state` の使い分けを references のみで判断できる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `artifacts.json` の `status` enum 違反が Phase 12 verification で fail する
- [ ] root + 各 Phase output の両方が検証対象に含まれている
- [ ] fail メッセージから違反 path / 検出値 / 修正方法が判別できる
- [ ] `metadata.workflow_state` が許容され enum 違反扱いにならない

### 品質要件

- [ ] validator が CI / pre-commit / ローカル全経路で同一挙動
- [ ] sample 違反データでの fail と正常データの pass を回帰テスト化

### ドキュメント要件

- [ ] references に `workflow_state` 規約が記載されている
- [ ] Phase 12 verification README に validator の説明とリンクがある

---

## 6. 検証方法

### テストケース

- root `artifacts.json` の `status` を `implemented_local_evidence_captured` にすると fail
- root `status` を schema enum (例: `completed`) にし `metadata.workflow_state` に `implemented_local_evidence_captured` を入れると pass
- `outputs/phase-12/artifacts.json` の `status` を schema enum 外にしても fail

### 検証手順

```bash
node .claude/skills/task-specification-creator/scripts/verify-artifacts-status.js \
  --workflow docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping
```

---

## 7. リスクと対策

| リスク                                                       | 影響度 | 発生確率 | 対策                                                                       |
| ------------------------------------------------------------ | ------ | -------- | -------------------------------------------------------------------------- |
| 既存 `artifacts.json` に schema 外 `status` が混入している   | 中     | 高       | 初回導入時に warn-only モードを設け、修正 PR を先行で出してから fail 化    |
| `metadata.workflow_state` の値が無秩序に増える               | 中     | 中       | references に列挙する enum を別途定義し、後続タスクで追加 validator 化     |
| schema 変更時に validator が壊れる                           | 中     | 低       | schema パス変更時の参照を 1 箇所に集約し、CI に schema 健全性 check を追加 |

---

## 8. 参照情報

### 関連ドキュメント

- `.claude/skills/task-specification-creator/schemas/artifact-definition.json`
- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-12/phase12-task-spec-compliance-check.md`

### 参考資料

- JSON Schema draft-07 公式仕様
- ajv ドキュメント

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-27 Phase 12 実行時に実際に発生した混乱点を記録する。

| 項目     | 内容                                                                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | root `artifacts.json` の `status` が `artifact-definition.json` の enum (例: `completed`) を期待しているのに、詳細実行状態 `implemented_local_evidence_captured` を直接 root `status` に書こうとして混乱した                   |
| 原因     | `metadata.workflow_state` への分離方針が skill references にも validator にも明文化されておらず、執筆者は root `status` が schema enum 化されている事実に Phase 12 verification 失敗まで気づけなかった                        |
| 対応     | task-27 では root `status` を schema enum 値に修正し、詳細実行状態は `metadata.workflow_state` に格納する暫定対応で通した。ただし validator は schema validation を行っていなかったため、誤った値でも素通りするリスクが残った |
| 再発防止 | 本タスクで Phase 12 verifier に schema 適用 validator を追加し、`workflow_state` 規約を references に明文化する。将来同じ matrix 型 docs-only タスクで同じ落とし穴を踏まないよう、validator が早期 fail することを保証する     |

### レビュー指摘の原文（該当する場合）

```
Phase 12 verification must validate root and output `artifacts.json.status` against `.claude/skills/task-specification-creator/schemas/artifact-definition.json`
```

### 補足事項

task-27 と同形の matrix 型 docs-only タスク (3-Layer Task Mapping 系) では同じ落とし穴が高確率で再発する。本タスクは validator 強化と references 明文化を必ずセットで行うこと。validator 単体導入で既存ファイルが大量に fail する場合は、Phase 1 で warn-only モードを挟み、移行 PR を先行で出してから fail 化に切り替える運用を推奨する。
