# Phase 2: 設計（分割設計表）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（分割設計表） |
| 作成日 | 2026-04-28 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（分割設計表 docs を作成。`.claude/skills/` 本体は本 Phase では変更しない） |

## 目的

Phase 1 で確定した「Progressive Disclosure による責務境界の構造的固定」要件を、対象 SKILL.md ごとの分割設計表（entry 残置項目 / `references/<topic>.md` 一覧 / 行数見積もり）に分解する。Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力（base case = 固定セット案）を作成する。`.claude/skills/*/SKILL.md` の棚卸しコマンドと結果記録手順、entry 残置の固定 10 要素、topic 命名規則、references 同士の循環参照禁止規約を確定する。

## 真の論点（要約）

- entry に残す情報と `references/<topic>.md` へ移す情報の境界を skill ごとに固定し、Phase 5 実装が cut & paste のみで完了できる粒度の表を作る。
- 境界がブレると意味的書き換えが混入し、A-3 の「メカニカル分割のみ」原則が破綻する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | Phase 1 | 真の論点・4条件 PASS・AC-1〜AC-11 | 本 Phase で再定義しない |
| 上流 | A-1 / A-2 完了 | gitignore / fragment 規約が確立済み | 同規約に乗って references を配置 |
| 下流 | Phase 3 | 分割設計表（base case） | 代替案比較の base として渡す |
| 下流 | Phase 5 | per-skill PR 計画と cut & paste 範囲 | 実装ランブックの起点 |

## 設計判断

- entry 残置の固定セット（10 要素）を全 skill 共通テンプレとして決め打ちする。skill ごとに揺れる責務境界判断を構造的に消す。
- topic 命名は単一責務原則（1 ファイル 1 責務）に従う。例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`。
- references 同士の循環参照は禁止。SKILL.md（entry）→ references の片方向のみ。references から entry への戻り参照（`../SKILL.md` リンク）も禁止。
- 行数見積もりは「現行 SKILL.md の章単位行数」を基にし、entry が 200 行未満に収まる組み合わせを設計表で検証する。
- 1 PR = 1 skill 分割を厳守。`task-specification-creator` を最優先・単独 PR で先行する。

## 棚卸し手順

### コマンド

```bash
for f in .claude/skills/*/SKILL.md; do
  printf '%5d  %s\n' "$(wc -l < "$f")" "$f"
done | sort -nr
```

### 出力規約

- 結果を `outputs/phase-02/inventory.md` に貼り付け、200 行以上の SKILL.md を「対象」、未満を「対象外」、既に `references/` を持つ skill（例: `aiworkflow-requirements`）を「スコープ外（分割済み）」と分類する。
- 表のカラム: `skill 名 / 現行行数 / 分類（対象 / 対象外 / 分割済み）/ 備考`。
- `task-specification-creator` は分類「対象（最優先）」とし表の先頭に固定する。

## entry 残置の固定セット（全 skill 共通）

| # | 要素 | 必須 | 行数目安 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | front matter（YAML） | 必須 | 5〜15 | name / description / trigger / allowed-tools 等 |
| 2 | 概要 | 必須 | 5〜10 | skill の役割を 1 段落で要約 |
| 3 | trigger | 必須 | 3〜10 | loader 解決対象 |
| 4 | allowed-tools | 必須 | 1〜5 | loader 解決対象 |
| 5 | Anchors | 必須 | 5〜20 | 既存 Anchors を保持。「200 行を超えたら分割」「fragment で書け」を AC-10 として追記 |
| 6 | クイックスタート | 必須 | 10〜30 | 最小利用導線 |
| 7 | モード一覧 | 必須 | 5〜20 | collaborative / orchestrate 等のモード列挙 |
| 8 | agent 導線 | 必須 | 5〜15 | trigger / allowed-tools の補足説明 |
| 9 | references リンク表 | 必須 | 5〜15 | `\| topic \| path \|` 形式で `references/<topic>.md` を列挙 |
| 10 | 最小 workflow | 必須 | 10〜30 | skill の最小実行手順。詳細は references へ送る |

合計上限: 200 行未満（推奨 150〜180 行）。これに収まらない場合、概要・モード一覧・最小 workflow を圧縮するか、追加の references を切り出す。

## references 設計規約

| 規約 | 内容 |
| --- | --- |
| 命名 | 単一責務（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`）。複数責務を 1 ファイルに混ぜない |
| ディレクトリ | `.claude/skills/<skill>/references/<topic>.md` |
| 戻り参照禁止 | references から entry（`../SKILL.md`）への戻り参照リンクを書かない |
| 循環参照禁止 | references 同士の相互参照は禁止。共通参照は entry 経由 |
| 内部リンク | references 内のリンクは references 内で完結させる |
| front matter | 各 reference 冒頭にタイトル・責務を記述（親 SKILL.md への戻り参照は禁止） |
| 機械的切り出し | セクション単位の cut & paste のみ。文言修正・項目追加は別タスクへ分離 |

## 分割設計表テンプレート

各対象 skill について以下のテンプレを `outputs/phase-02/split-design.md` に記述する。

### テンプレ（skill ごとに 1 ブロック）

```markdown
### <skill-name>

| 項目 | 値 |
| --- | --- |
| 現行行数 | <N> |
| 分割優先度 | high / medium / low |
| 分割後 entry 行数見積もり | <M>（200 未満） |

#### entry 残置項目（固定 10 要素から欠落不可）

| # | 要素 | 行数見積もり | 元 SKILL.md の該当範囲 |
| --- | --- | --- | --- |
| 1 | front matter | ... | L1〜L? |
| ... | ... | ... | ... |
| 10 | 最小 workflow | ... | L?〜L? |

#### references 切り出し一覧

| # | topic ファイル | 責務 | 行数見積もり | 元 SKILL.md の該当範囲 |
| --- | --- | --- | --- | --- |
| 1 | references/phase-templates.md | Phase テンプレ集約 | <N> | L?〜L? |
| 2 | references/asset-conventions.md | アセット規約 | <N> | L?〜L? |
| 3 | references/quality-gates.md | 品質ゲート | <N> | L?〜L? |
| 4 | references/orchestration.md | オーケストレーション | <N> | L?〜L? |

#### 依存グラフ（循環参照禁止）

- entry → references/phase-templates.md
- entry → references/asset-conventions.md
- entry → references/quality-gates.md
- entry → references/orchestration.md
- references/* → entry: 禁止
- references/* → references/*: 禁止

#### PR 単位

- 1 PR = 1 skill 分割。本 skill は単独 PR `feat/skill-ledger-a3-<skill-name>` で実施。
```

### `task-specification-creator` の暫定設計（最優先・先頭ブロック）

| 項目 | 値 |
| --- | --- |
| 分割優先度 | **highest（最優先・単独 PR）** |
| 想定 references | `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md` の 4 件（Phase 5 で確定） |
| Anchor 追記 | 「fragment で書け」「200 行を超えたら分割」を Anchors に追加（AC-10、別小 PR） |

## 実行タスク

1. 棚卸しコマンドを実行し `outputs/phase-02/inventory.md` を作成する（完了条件: 全 SKILL.md が「対象 / 対象外 / 分割済み」の 3 分類で列挙されている）。
2. entry 残置の固定 10 要素を `outputs/phase-02/split-design.md` の冒頭に明記する（完了条件: 10 要素が表化されている）。
3. references 設計規約（命名 / 戻り参照禁止 / 循環参照禁止 / 機械的切り出し）を `outputs/phase-02/split-design.md` に記述する（完了条件: 7 規約が表化）。
4. 対象 skill ごとに分割設計表テンプレを埋める（完了条件: 全対象 skill で entry が 200 行未満に収まる行数見積もりが取れている）。
5. `task-specification-creator` を表の先頭に固定し最優先・単独 PR とする（完了条件: 分類が「highest」で記述されている）。
6. references 同士の依存グラフが循環しないことを各 skill で検証する（完了条件: 全 skill の依存グラフが片方向のみ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-01.md | 真の論点・4条件・AC |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | 棚卸し手順・entry 残置仕様の出典 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 機械的手順 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/file-layout.md | references レイアウト規約 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | 分割対象代表例（最優先） |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既に分割済みの参考例（references レイアウトのお手本） |

## 実行手順

### ステップ 1: 棚卸しと分類

- `for f in .claude/skills/*/SKILL.md; do printf '%5d  %s\n' "$(wc -l < "$f")" "$f"; done | sort -nr` を実行する。
- 結果を `outputs/phase-02/inventory.md` に記録し「対象 / 対象外 / 分割済み」で分類する。
- 200 行以上の SKILL.md を対象リストに追加する。
- `aiworkflow-requirements` のように `references/` を既に持つ skill は「分割済み」としてスコープ外に明示する。

### ステップ 2: entry 残置の固定セットを表化

- 10 要素を `outputs/phase-02/split-design.md` の冒頭に表化する。
- 各要素に行数目安と必須/任意フラグを記述する（本 Phase の規約は全要素「必須」）。

### ステップ 3: skill ごとの分割設計表

- `task-specification-creator` を先頭に置き、最優先・単独 PR と明記する。
- 各 skill について：SKILL.md を読み章単位で「entry 残置」または「references 切り出し」のラベルを付与し、テンプレに記入する。
- topic 命名は単一責務原則を厳守する。

### ステップ 4: 依存グラフ検証

- 全 skill で entry → references の片方向リンクのみとなるか確認する。
- references から entry への戻り参照、references 同士の相互参照が無いことを確認する。

### ステップ 5: 行数見積もりの妥当性確認

- 各 skill で entry 行数見積もりが 200 行未満に収まるか確認する。
- 収まらない場合、追加の references topic を切り出すか entry セクションを圧縮する設計に修正する。

## entry 残置 / references 設計（要約）

| 観点 | 設計 |
| --- | --- |
| entry 残置要素数 | 10（固定） |
| entry 行数上限 | 200 未満（推奨 150〜180） |
| references 命名 | 単一責務（topic 単位） |
| references 戻り参照 | 禁止 |
| references 循環参照 | 禁止 |
| 切り出し方式 | セクション単位の cut & paste のみ（意味的書き換え禁止） |
| PR 粒度 | 1 PR = 1 skill 分割 |
| 最優先 skill | `task-specification-creator`（ドッグフーディング矛盾解消） |

## 多角的チェック観点

- entry 残置 10 要素のうち欠落しているものがないか（AC-3）。
- topic 命名が単一責務原則に違反していないか（複数責務を混ぜていないか）。
- references 同士で循環参照や相互参照が発生していないか（AC-4）。
- 行数見積もりが 200 行未満を満たしているか（AC-1 / AC-6）。
- `task-specification-creator` が最優先・単独 PR で表の先頭に固定されているか（AC-9）。
- Anchor 追記（「fragment で書け」「200 行を超えたら分割」）が別小 PR として計画されているか（AC-10）。
- canonical / mirror 双方への反映計画が PR 単位で記述されているか（AC-5）。
- 切り出しが「機械的 cut & paste」に限定され、意味的書き換えが混入していないか（skill-ledger 内不変条件）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 棚卸し inventory.md 作成 | 2 | spec_created | 全 SKILL.md を 3 分類 |
| 2 | entry 残置 10 要素の固定セット表化 | 2 | spec_created | split-design.md 冒頭 |
| 3 | references 設計規約 7 件の表化 | 2 | spec_created | 命名 / 循環禁止 / 機械的切り出し |
| 4 | skill ごとの分割設計表記入 | 2 | spec_created | 行数見積もり < 200 |
| 5 | task-specification-creator を最優先で先頭固定 | 2 | spec_created | highest / 単独 PR |
| 6 | 依存グラフ循環参照チェック | 2 | spec_created | 全 skill で片方向のみ |

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは実行しない。分割設計表は Phase 4 の検証カテゴリと Phase 11 の NON_VISUAL smoke に接続する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/inventory.md | 200 行超 SKILL.md 棚卸し結果（対象 / 対象外 / 分割済み） |
| 設計 | outputs/phase-02/split-design.md | skill ごとの分割設計表（entry 残置 10 要素 / references topic / 行数見積もり / 依存グラフ / PR 単位） |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] inventory.md に全 SKILL.md が「対象 / 対象外 / 分割済み」の 3 分類で記載されている
- [ ] entry 残置の固定 10 要素が split-design.md 冒頭に表化されている
- [ ] references 設計規約 7 件（命名 / ディレクトリ / 戻り参照禁止 / 循環参照禁止 / 内部リンク / front matter / 機械的切り出し）が記載されている
- [ ] 全対象 skill の分割設計表が完成し、entry 行数見積もりが 200 行未満
- [ ] `task-specification-creator` が表の先頭で「highest / 単独 PR」と固定されている
- [ ] references 同士に循環参照・相互参照が無いことが依存グラフで確認されている
- [ ] 成果物が 2 ファイル（inventory.md / split-design.md）に分離されている

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 実行時成果物が `outputs/phase-02/` 配下に配置される設計になっている
- 異常系（責務境界判断ミス / 循環参照 / 行数超過 / 最優先 skill の漏れ）の対応が設計に含まれる
- artifacts.json の `phases[1].status` が `spec_created`
- artifacts.json の `phases[1].outputs` に 2 ファイルが列挙されている
- `.claude/skills/` 配下のファイルを本 Phase で変更していない（docs のみ）

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - base case = 「entry 固定 10 要素 + references 単一責務 topic 群」案を Phase 3 の評価対象として渡す
  - 代替案候補: (1) 200 行制約のみで references なし、(2) 全セクションを references に逃がし entry を front matter のみ、(3) 推奨案 = Progressive Disclosure 固定セット
  - inventory.md / split-design.md を Phase 3 / 5 / 7 の入力として渡す
  - `task-specification-creator` の最優先・単独 PR 計画を Phase 5 / 13 の起点として渡す
- ブロック条件:
  - 棚卸し未実施（inventory.md 不在）
  - entry 残置 10 要素のいずれかが欠落している skill がある
  - 行数見積もりが 200 行を超える skill が残っている
  - 依存グラフに循環参照が残っている
