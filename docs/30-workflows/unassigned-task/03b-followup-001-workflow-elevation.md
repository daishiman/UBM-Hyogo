# 03b-followup-001 (email-conflict identity merge) Phase 1-13 workflow root への昇格 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| タスクID     | 03b-followup-001-workflow-elevation                                                                 |
| タスク名     | 03b-followup-001 (email-conflict identity merge) Phase 1-13 workflow root への昇格                  |
| 分類         | ワークフロー整備 / 仕様書化                                                                         |
| 対象機能     | docs/30-workflows 配下の active workflow root 構築（aiworkflow-requirements 索引登録を含む）        |
| 優先度       | 高                                                                                                  |
| 見積もり規模 | 小〜中規模（ドキュメント整備のみ・実装は委譲）                                                      |
| ステータス   | 未実施                                                                                              |
| 親タスク     | 03b-parallel-forms-response-sync-and-current-response-resolver-followups                            |
| 発見元       | feat/03b-followup-001-email-conflict-identity-merge ブランチ spec 整備時点で workflow root 未作成判明 |
| 発見日       | 2026-05-02                                                                                          |
| 委譲先 wave  | 03b-followup（本タスク完了後、04c-followup-001 で実装着手）                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md` は 30 種思考法レビューを通過した single-md 指示書として完成済み。しかし、これは「指示書」レベルで止まっており、Phase 1-13 を実行可能な workflow root（`docs/30-workflows/03b-followup-001-email-conflict-identity-merge/` 配下）が**未作成**である。

task-specification-creator skill が要求する Phase 1-13 ゲートを通すには、index.md / artifacts.json / phase-01.md〜phase-13.md / outputs/phase-12 の 7 成果物枠が物理的に必要であり、これが揃っていないと実装着手の正規ゲートが開かない。

### 1.2 問題点・課題

- 指示書は完成しているが workflow root が無いため、実装担当者が phase-by-phase の進捗を記録する場所が無い
- aiworkflow-requirements の active workflow 索引 (`task-workflow-active.md`) に未登録のため、横断検索からも発見できない
- single-md が `completed-tasks/` 配下にあることで、まだ実装未着手の follow-up タスクが「完了済み」のように誤認されるリスク
- Phase 12 の 7 成果物（implementation-guide / runbook / risk-log / dependency-map / decision-log / lesson-learned / next-actions）の出力先が未確保

### 1.3 放置した場合の影響

- email-conflict identity merge の実装が始まっても、進捗が `outputs/phase-XX/main.md` 形式で記録されず、後続タスクの参照可能性が下がる
- aiworkflow-requirements 索引から漏れることで、03b 系列の依存関係グラフが破綻する
- 他の follow-up タスク（03b-followup-002 以降）でも同じ昇格作業を都度発生させてしまい、ワークフロー運用の一貫性が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`03b-followup-001-email-conflict-identity-merge` を single-md 指示書から Phase 1-13 active workflow root に昇格させ、実装着手ゲートを通せる状態にする。

### 2.2 最終ゴール

- `docs/30-workflows/03b-followup-001-email-conflict-identity-merge/` workflow root が存在する
- index.md / artifacts.json / phase-01.md〜phase-13.md スケルトンが揃っている
- outputs/phase-12 ディレクトリが作成され、7 成果物枠が確保されている
- aiworkflow-requirements の `task-workflow-active.md` に当 workflow が登録され、親 03b との相互参照が貼られている
- 親 spec（completed-tasks 配下）から workflow root への参照リンクが追加されている

### 2.3 スコープ

#### 含むもの

- `docs/30-workflows/03b-followup-001-email-conflict-identity-merge/` ディレクトリ作成
- index.md（メタ情報 / Phase ナビゲーション / 親 spec への back-reference）
- artifacts.json（taskType / visualEvidence / phase-12 7 成果物の規約を親 spec から転記）
- phase-01.md 〜 phase-13.md スケルトン（task-specification-creator フォーマット準拠）
- outputs/phase-12/ ディレクトリ（空でよい・実装フェーズで埋める）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` への登録
- `.claude/skills/aiworkflow-requirements/indexes/` 索引再生成（`pnpm indexes:rebuild`）
- 親 spec single-md から workflow root への相互リンク追加

#### 含まないもの

- email conflict 判定アルゴリズムの実装（→ `04c-followup-001-email-conflict-merge-api-and-ui` へ委譲）
- admin UI 実装（→ `04c-followup-001` 内で別 phase として管理）
- 親 03b spec の内容変更（既に 30 種思考法レビュー通過済みのため凍結）
- D1 schema 変更（実装フェーズで決定）

### 2.4 成果物

- workflow root ディレクトリと配下ファイル一式
- aiworkflow-requirements 索引更新差分
- 親 spec への相互リンク追加差分
- `pnpm indexes:rebuild` 実行ログ（drift なし確認）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親 spec `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md` が存在し、30 種思考法レビューを通過している
- task-specification-creator skill のフォーマット規約（Phase 1-13 / Phase 12 7 成果物 / visualEvidence 規約）を把握している
- aiworkflow-requirements skill の `task-workflow-active.md` 登録手順を把握している

### 3.2 実行手順

1. 親 spec を読み、taskType / visualEvidence 要否 / Phase 12 で必要な 7 成果物の具体内容を抽出する
2. `docs/30-workflows/03b-followup-001-email-conflict-identity-merge/` を作成
3. index.md を作成（メタ情報テーブル + Phase 01-13 ナビゲーション + 親 spec back-reference）
4. artifacts.json を作成（taskType / visualEvidence / phase-12 outputs 規約を JSON で記述）
5. phase-01.md 〜 phase-13.md のスケルトンを生成（各 phase の目的・受入条件のみ記載・本文は実装時に埋める）
6. `outputs/phase-12/` ディレクトリを作成（中身は空 README.md でも可）
7. `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に当 workflow を登録（親 03b への back-link / 委譲先 04c-followup-001 への forward-link を含める）
8. 親 spec single-md の冒頭または末尾に「workflow root: `docs/30-workflows/03b-followup-001-email-conflict-identity-merge/`」リンクを追記
9. `mise exec -- pnpm indexes:rebuild` を実行し索引 drift を解消
10. `git status --porcelain` で全変更を確認し、commit 単位を整えて push

### 3.3 受入条件 (AC)

- AC-1: `docs/30-workflows/03b-followup-001-email-conflict-identity-merge/index.md` が存在し、メタ情報テーブルと Phase 01-13 リンクが揃っている
- AC-2: 同ディレクトリ配下に `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-12/` が揃っている
- AC-3: artifacts.json の taskType / visualEvidence / phase-12 7 成果物規約が親 spec の記述と一致している
- AC-4: `task-workflow-active.md` に当 workflow が登録され、親 03b と委譲先 04c-followup-001 への相互リンクが張られている
- AC-5: 親 spec single-md から workflow root への back-reference リンクが追加されている
- AC-6: `pnpm indexes:rebuild` 実行後、`.claude/skills/aiworkflow-requirements/indexes/` に drift が無い（`verify-indexes-up-to-date` CI gate が通る状態）

---

## 4. 苦戦箇所 / 学んだこと

### 4.1 指示書完成 ≠ 実装着手可能

30 種思考法レビューで single-md spec を完成させても、それだけでは task-specification-creator skill が要求する Phase 1-13 ゲートを通せない。指示書（What/Why の合意）と workflow root（How の実行記録枠）は別成果物として運用上分離する必要がある。本タスクはこの構造的 gap を埋める専用タスクとして切り出している。

### 4.2 completed-tasks/ 配下 single-md と active workflow root の二重管理

親タスク 03b 本体は `completed-tasks/` に移動済みだが、その follow-up 子タスクが single-md として親ディレクトリ配下に残ったままだと、「完了済みディレクトリの中に未実装タスクがある」という探索性低下を招く。これを避けるため、aiworkflow-requirements の active 索引から完成済み single-md と active workflow root の両方に相互参照を貼り、検索動線を一本化することで対処する。将来同パターンが頻発する場合は索引側で「completed-parent / active-child」関係を明示する schema 拡張を検討する。

### 4.3 昇格時のメタ情報引継ぎ

single-md spec 内の「仕様分類（task-specification-creator 準拠）」セクションで定義した taskType / visualEvidence / Phase 12 7 成果物の規約は、workflow root 作成時に index.md と artifacts.json と phase-12 ディレクトリ構造へ忠実に転記する必要がある。手作業転記は drift の温床になるため、本タスクの実行手順 1-6 では「親 spec の該当セクションをコピー → 構造化 JSON / Markdown へ展開」という明示的な手順を踏む。将来は task-specification-creator skill 側に「single-md → workflow root 自動展開」コマンドを追加すれば再発防止になる。

---

## 5. 関連リソース

- 親 spec: `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md`
- フォーマット参考: `docs/30-workflows/unassigned-task/04b-followup-008-me-profile-ui-consumption.md`
- skill: `.claude/skills/task-specification-creator/`
- system spec: `.claude/skills/aiworkflow-requirements/`
- active workflow 索引: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 索引再生成: `mise exec -- pnpm indexes:rebuild`
- 委譲先（実装フェーズ）: `04c-followup-001-email-conflict-merge-api-and-ui`（本タスク完了後に着手）
