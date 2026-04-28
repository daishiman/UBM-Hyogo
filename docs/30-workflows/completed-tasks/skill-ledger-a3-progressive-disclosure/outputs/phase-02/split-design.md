# Phase 2 成果物 — 分割設計表 split-design.md

タスク: skill-ledger-a3-progressive-disclosure
Phase: 2 / 13（設計：分割設計表）
作成日: 2026-04-28
状態: spec_created（docs-only / NON_VISUAL）

本書は Phase 5 実装が「機械的 cut & paste のみ」で完了できる粒度の設計表を提示する。各対象 skill ごとに entry 残置範囲・references 切り出し topic・行数見積もりを明示する。

---

## 1. entry 残置の固定セット（全 skill 共通テンプレ）

| # | 要素 | 必須 | 行数目安 | 備考 |
| --- | --- | --- | ---: | --- |
| 1 | front matter（YAML） | 必須 | 5〜15 | name / description / trigger / allowed-tools |
| 2 | 概要 | 必須 | 5〜10 | skill 役割を 1 段落で要約 |
| 3 | trigger | 必須 | 3〜10 | loader 解決対象 |
| 4 | allowed-tools | 必須 | 1〜5 | loader 解決対象 |
| 5 | Anchors | 必須 | 5〜20 | 既存 Anchors 保持 + 「200 行を超えたら分割」「fragment で書け」追記（AC-10） |
| 6 | クイックスタート | 必須 | 10〜30 | 最小利用導線 |
| 7 | モード一覧 | 必須 | 5〜20 | 実行モード列挙 |
| 8 | agent 導線 | 必須 | 5〜15 | trigger / allowed-tools 補足 |
| 9 | references リンク表 | 必須 | 5〜15 | `\| topic \| path \|` 形式 |
| 10 | 最小 workflow | 必須 | 10〜30 | 最小実行手順。詳細は references へ |

合計上限: **200 行未満**（推奨 150〜180）

---

## 2. references 設計規約（全 skill 共通）

| 規約 | 内容 |
| --- | --- |
| 命名 | 単一責務（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`） |
| ディレクトリ | `.claude/skills/<skill>/references/<topic>.md` |
| 戻り参照禁止 | references → entry（`../SKILL.md`）リンク禁止 |
| 循環参照禁止 | references 同士の相互参照禁止。共通参照は entry 経由 |
| 内部リンク | references 内のリンクは references 内で完結 |
| front matter | 各 reference 冒頭にタイトル・責務記述（親 SKILL.md 戻り参照禁止） |
| 機械的切り出し | セクション単位の cut & paste のみ。文言修正・項目追加は別タスクへ分離 |

---

## 3. skill 別分割設計

### 3.1 task-specification-creator（最優先・単独 PR）

| 項目 | 値 |
| --- | --- |
| 現行行数 | 517 |
| 分割優先度 | **highest（最優先・単独 PR）** |
| 分割後 entry 行数見積もり | 約 165（200 未満） |
| PR ブランチ | `feat/skill-ledger-a3-task-specification-creator` |

#### entry 残置項目

| # | 要素 | 行数見積もり | 元 SKILL.md の該当範囲 |
| --- | --- | ---: | --- |
| 1 | front matter | 約 20 | L1〜L20 |
| 2 | 概要 (`# Task Specification Creator`) | 約 4 | L21〜L24 |
| 3 | 設計原則 | 約 10 | L25〜L34 |
| 4 | クイックスタート | 約 13 | L102〜L114 |
| 5 | 実行フロー（create / execute サマリ） | 約 20 | L115〜L143 圧縮版（詳細は references へ） |
| 6 | Task 仕様ナビ | 約 18 | L144〜L161 |
| 7 | agent 導線 | 約 12 | L386〜L397 |
| 8 | Phase 12 と Phase 13 の境界 | 約 13 | L398〜L412 |
| 9 | references リンク表（Anchors 含む） | 約 25 | 新規（10 要素中 Anchors と同箇所） |
| 10 | 最小 workflow（重要ルールの抜粋） | 約 30 | L371〜L385 |
| **合計** | | **約 165** | |

#### references 切り出し一覧

| # | topic ファイル | 責務 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | --- | ---: | --- |
| 1 | `references/requirements-review.md` | 要件レビュー思考法（真の論点 / 因果と境界 / 価値とコスト / 4条件） | 約 40 | L35〜L79 |
| 2 | `references/task-type-decision.md` | タスクタイプ判定フロー（docs-only / NON_VISUAL） | 約 22 | L80〜L101 |
| 3 | `references/phase-12-deepdive.md` | Phase 12 重要仕様（必須タスク 5 件・Task 1〜5 詳細・苦戦防止 Tips） | 約 210 | L162〜L370 |
| 4 | `references/resource-map.md` | リソース導線（core workflow / phase templates / Phase 11/12 guides / spec update / pattern family / logs and archives） | 約 60 | L413〜L470 |
| 5 | `references/system-checks.md` | システム観点チェック・検証コマンド・ベストプラクティス | 約 40 | L471〜L517 |

#### 依存グラフ

- entry → references/requirements-review.md
- entry → references/task-type-decision.md
- entry → references/phase-12-deepdive.md
- entry → references/resource-map.md
- entry → references/system-checks.md
- references/* → entry: 禁止
- references/* → references/*: 禁止

#### Anchor 追記（AC-10 / 別小 PR）

- 「fragment で書け」「200 行を超えたら分割」を Anchors セクションに追加。本体分割 PR とは別の小 PR で出し、独立 revert 可能を担保。

---

### 3.2 automation-30（high）

| 項目 | 値 |
| --- | --- |
| 現行行数 | 432 |
| 分割優先度 | high |
| 分割後 entry 行数見積もり | 約 170（200 未満） |
| PR ブランチ | `feat/skill-ledger-a3-automation-30` |
| 特記 | L5〜174 と L200〜382 でほぼ同一の Layer 1〜7 ブロックが二重存在。分割時に重複ブロックの統合（重複 cut の除去）を行うが、内容は一切書き換えない |

#### entry 残置項目

| # | 要素 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | ---: | --- |
| 1 | front matter | 約 4 | L1〜L4 |
| 2 | 概要（`## 概要` 含む見出し圧縮） | 約 10 | L200〜L207 |
| 3 | Layer 1 メタ情報・プロジェクト概要 | 約 25 | L208〜L221 |
| 4 | ワークフロー | 約 6 | L384〜L389 |
| 5 | Task 一覧（LLM Tasks / Script Tasks） | 約 14 | L390〜L403 |
| 6 | ベストプラクティス（すべきこと / 避けるべきこと） | 約 18 | L404〜L420 |
| 7 | リソース参照（references リンク表） | 約 10 | L421〜L427（再構成） |
| 8 | 変更履歴 | 約 5 | L428〜L432 |
| 9 | Anchors（新規追加：「200 行を超えたら分割」「fragment で書け」） | 約 10 | 新規 |
| 10 | クイックスタート + agent 導線 | 約 25 | 新規再構成 |
| **合計** | | **約 127** | |

#### references 切り出し一覧

| # | topic ファイル | 責務 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | --- | ---: | --- |
| 1 | `references/domain-definitions.md` | Layer 2: 用語集 / 思考法一覧（30種）/ 検証 4 条件 / ビジネスルール | 約 35 | L222〜L253 |
| 2 | `references/infrastructure.md` | Layer 3: ツール群 + Layer 4: 共通ポリシー（品質基準 / エスカレーション） | 約 25 | L254〜L275 |
| 3 | `references/agents.md` | Layer 5: エージェント 1〜5 定義 | 約 75 | L276〜L346 |
| 4 | `references/orchestration.md` | Layer 6: 実行原則 / 実行フロー / 制約 + Layer 7: ユーザーインタラクション | 約 35 | L347〜L383 |

注: 本 skill は L5〜174 と L200〜382 で内容が重複している。Phase 5 実装時には L200〜L382 ブロックを正本として cut する（後者の方が「概要」セクションを含む完成版）。L5〜L174 の重複ブロックは entry / references の最終配置から除去する。これは「重複の削除」のみであり意味的書き換えには該当しない（skill-ledger 内不変条件遵守）。

#### 依存グラフ

- entry → references/domain-definitions.md / infrastructure.md / agents.md / orchestration.md
- references/* → entry: 禁止
- references/* → references/*: 禁止

---

### 3.3 skill-creator（high）

| 項目 | 値 |
| --- | --- |
| 現行行数 | 402 |
| 分割優先度 | high |
| 分割後 entry 行数見積もり | 約 175（200 未満） |
| PR ブランチ | `feat/skill-ledger-a3-skill-creator` |

#### entry 残置項目

| # | 要素 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | ---: | --- |
| 1 | front matter | 約 35 | L1〜L35 |
| 2 | 概要 (`# Skill Creator`) | 約 4 | L36〜L39 |
| 3 | 必須：最初の実行ステップ | 約 8 | L40〜L47 |
| 4 | 設計原則 | 約 11 | L48〜L58 |
| 5 | クイックスタート | 約 13 | L59〜L70 |
| 6 | ワークフロー概要（モード列挙のみ） | 約 15 | L71〜L72 + L73〜L105/L254〜L261 のモード見出し圧縮 |
| 7 | リソース一覧 + 主要エントリポイント（references リンク表化） | 約 35 | L262〜L294 |
| 8 | 機能別ガイド（references リンク表） | 約 25 | L295〜L326 |
| 9 | フィードバック（必須） | 約 11 | L327〜L337 |
| 10 | ベストプラクティス + Anchors（新規）+ agent 導線 | 約 18 | L385〜L402 + 新規 |
| **合計** | | **約 175** | |

#### references 切り出し一覧

| # | topic ファイル | 責務 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | --- | ---: | --- |
| 1 | `references/mode-collaborative.md` | Collaborative モード詳細 | 約 35 | L73〜L105 |
| 2 | `references/runtime-state-machine.md` | Runtime ワークフロー状態遷移 | 約 150 | L106〜L253 |
| 3 | `references/mode-orchestrate.md` | Orchestrate モード詳細 | 約 9 | L254〜L261 |
| 4 | `references/design-orchestration.md` | 設計タスク向けオーケストレーション（フェーズ戦略 / 並列エージェント / Phase 12 再監査 / P43 SubAgent ファイル分割基準） | 約 45 | L338〜L384 |

#### 依存グラフ

- entry → references/mode-collaborative.md / runtime-state-machine.md / mode-orchestrate.md / design-orchestration.md
- references/* → entry: 禁止
- references/* → references/*: 禁止

---

### 3.4 github-issue-manager（medium）

| 項目 | 値 |
| --- | --- |
| 現行行数 | 363 |
| 分割優先度 | medium |
| 分割後 entry 行数見積もり | 約 130（200 未満） |
| PR ブランチ | `feat/skill-ledger-a3-github-issue-manager` |
| 特記 | Part 1〜4 が既に明示的構造で機械的分割が容易 |

#### entry 残置項目

| # | 要素 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | ---: | --- |
| 1 | front matter | 約 28 | L1〜L28 |
| 2 | 概要 + 見出し | 約 6 | L29〜L34 |
| 3 | モード一覧 | 約 16 | L35〜L51 |
| 4 | 初期セットアップ（Part 1 冒頭・最小） | 約 12 | L54〜L63 |
| 5 | 基本ワークフロー（Part 1 抜粋・最小） | 約 22 | L64〜L81 |
| 6 | 双方向同期（概要のみ） | 約 18 | L82〜L102 |
| 7 | 自動 Issue 同期 / クローズ（要約のみ） | 約 12 | L103〜L125 |
| 8 | references リンク表 | 約 12 | 新規 |
| 9 | Anchors（既存 + 「200 行を超えたら分割」「fragment で書け」追記）+ agent 導線 | 約 12 | L29 周辺 Anchors + 新規 |
| 10 | メタ情報構造（YAML 形式・要約） | 約 20 | L340〜L363 |
| **合計** | | **約 158** | |

注: 上記合計が 158 で 200 未満を満たすが、Part 1 の手順詳細を references に逃がせばさらに 20〜30 行圧縮可能。Phase 5 で実測しながら最終調整。

#### references 切り出し一覧

| # | topic ファイル | 責務 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | --- | ---: | --- |
| 1 | `references/command-reference.md` | Part 2: コマンドリファレンス（sync / sync-new / create / select / list / update / close / relink / cleanup / label） | 約 110 | L126〜L226 |
| 2 | `references/spec-created-flow.md` | spec_created: CLOSED Issue → 仕様書化フロー / 下流タスクからの upstream 参照 | 約 55 | L227〜L283 |
| 3 | `references/scoring-labels.md` | Part 3: スコアリング＆ラベル | 約 22 | L284〜L305 |
| 4 | `references/resource-map.md` | Part 4: リソースマップ（scripts / agents / assets） | 約 35 | L306〜L339 |

#### 依存グラフ

- entry → references/command-reference.md / spec-created-flow.md / scoring-labels.md / resource-map.md
- references/* → entry: 禁止
- references/* → references/*: 禁止

---

### 3.5 claude-agent-sdk（medium）

| 項目 | 値 |
| --- | --- |
| 現行行数 | 324 |
| 分割優先度 | medium |
| 分割後 entry 行数見積もり | 約 165（200 未満） |
| PR ブランチ | `feat/skill-ledger-a3-claude-agent-sdk` |

#### entry 残置項目

| # | 要素 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | ---: | --- |
| 1 | front matter | 約 25 | L1〜L25 |
| 2 | 概要 (`# Claude Agent SDK` + `## 概要`) | 約 10 | L26〜L35 |
| 3 | 最新情報取得 | 約 13 | L36〜L48 |
| 4 | ワークフロー（Phase 1〜3 見出しと最小手順のみ） | 約 32 | L50〜L82 |
| 5 | Task 仕様ナビ | 約 15 | L83〜L97 |
| 6 | パターン選択ガイド（claude-agent-sdk vs 直接 SDK の比較表のみ） | 約 15 | L98〜L114 |
| 7 | ベストプラクティス | 約 18 | L214〜L232 |
| 8 | クイックリファレンス（パッケージインストール + 基本使用例の最小） | 約 30 | L233〜L260 |
| 9 | references リンク表 + Anchors（新規）+ agent 導線 | 約 15 | L279〜L318 を表化 + 新規 |
| 10 | 関連ドキュメント | 約 10 | L319〜L324 |
| **合計** | | **約 183** | |

#### references 切り出し一覧

| # | topic ファイル | 責務 | 行数見積もり | 元 SKILL.md 該当範囲 |
| --- | --- | --- | ---: | --- |
| 1 | `references/patterns-direct-sdk.md` | Direct Anthropic SDK Pattern（Next.js API Route） | 約 45 | L115〜L158 |
| 2 | `references/patterns-skill-executor.md` | SkillExecutor Pattern | 約 25 | L159〜L182 |
| 3 | `references/patterns-authkey.md` | AuthKeyService 統合パターン（Web アプリ） | 約 32 | L183〜L213 |
| 4 | `references/hooks-examples.md` | Hook 実装例（基本使用例から逸脱した実装サンプル） | 約 20 | L261〜L278 |
| 5 | `references/responsibility-docs.md` | 責務別ドキュメント / テンプレート参照 | 約 40 | L279〜L318 詳細リンク群 |

#### 依存グラフ

- entry → references/patterns-direct-sdk.md / patterns-skill-executor.md / patterns-authkey.md / hooks-examples.md / responsibility-docs.md
- references/* → entry: 禁止
- references/* → references/*: 禁止

---

## 4. 全 skill 行数見積もりサマリー

| skill | 現行 | 分割後 entry 見積もり | references 数 | 200 未満適合 |
| --- | ---: | ---: | ---: | --- |
| task-specification-creator | 517 | 165 | 5 | OK |
| automation-30 | 432 | 127 | 4 | OK |
| skill-creator | 402 | 175 | 4 | OK |
| github-issue-manager | 363 | 158 | 4 | OK |
| claude-agent-sdk | 324 | 183 | 5 | OK |

全 5 skill で entry 行数見積もりが 200 行未満を満たす（AC-1 / AC-6 充足見込み）。

---

## 5. PR 単位と実行順序

| 順 | PR ブランチ | skill | 種別 |
| ---: | --- | --- | --- |
| 1 | `feat/skill-ledger-a3-task-specification-creator` | task-specification-creator | 本体分割 |
| 2 | `feat/skill-ledger-a3-task-specification-creator-anchors` | task-specification-creator | Anchor 追記（小 PR）|
| 3 | `feat/skill-ledger-a3-automation-30` | automation-30 | 本体分割（重複ブロック除去含む）|
| 4 | `feat/skill-ledger-a3-skill-creator` | skill-creator | 本体分割 |
| 5 | `feat/skill-ledger-a3-github-issue-manager` | github-issue-manager | 本体分割 |
| 6 | `feat/skill-ledger-a3-claude-agent-sdk` | claude-agent-sdk | 本体分割 |
| 7 | `feat/skill-ledger-a3-anchors-rest` | 残 4 skill | Anchor 一括追記（小 PR） |

各 PR は canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) を同コミット内で同期し `diff -r` = 0 を完了条件とする。

---

## 6. 多角的チェック観点（再掲）

- entry 残置 10 要素のうち欠落しているものがないか（AC-3）
- topic 命名が単一責務原則に違反していないか
- references 同士で循環参照や相互参照が発生していないか（AC-4）
- 行数見積もりが 200 行未満を満たしているか（AC-1 / AC-6）
- `task-specification-creator` が最優先・単独 PR で先頭固定されているか（AC-9）
- Anchor 追記が別小 PR として計画されているか（AC-10）
- canonical / mirror 双方への反映計画が PR 単位で記述されているか（AC-5）
- 切り出しが「機械的 cut & paste」に限定されているか（skill-ledger 内不変条件）

---

## 7. 完了条件チェック

- [x] inventory.md と本書で全 SKILL.md が「対象 / 対象外 / 分割済み」分類済み
- [x] entry 残置の固定 10 要素が冒頭に表化されている
- [x] references 設計規約 7 件が表化されている
- [x] 全対象 skill（5 件）の分割設計表が完成し entry 行数見積もりが 200 未満
- [x] `task-specification-creator` が表の先頭で highest / 単独 PR と固定されている
- [x] references 同士に循環参照・相互参照が無いことが依存グラフで確認されている
