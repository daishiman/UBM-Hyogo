# husky 不採用 / lefthook 採用判断の ADR 化 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-husky-rejection-adr |
| タスク名 | husky 不採用 / lefthook 採用判断の ADR 化 |
| 分類 | Documentation / ADR |
| 対象機能 | Git hook ツール選定の意思決定記録 |
| 優先度 | Low |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | task-git-hooks-lefthook-and-post-merge Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

「husky 不採用 / lefthook 採用」の判断は `task-git-hooks-lefthook-and-post-merge` の Phase 2 design (ADR-01) と Phase 3 review 第5節に記述されているが、リポジトリ全体の ADR 集約場所には転記されていない。

### 1.2 問題点・課題

- workflow outputs に分散した設計判断は、workflow ディレクトリが移動・アーカイブされた瞬間にトレース不能になる
- リポジトリに ADR 集約場所が確立されておらず、判断の参照先が不安定
- 散文形式の判断記録は再発掘コストが高く、後続タスクが理由を再構築する手戻りが起きる

### 1.3 放置した場合の影響

- 将来別 hook ツール（例: lefthook → 別ツール）の移行検討時に過去判断が辿れない
- 同じ「採用 / 不採用」議論を再度行う重複コストが発生する
- 他の設計判断（D1 採用、Auth.js 採用等）の ADR 化も後回しになる

---

## 2. 何を達成するか（What）

### 2.1 目的

「Git hook ツールに lefthook を採用、husky を不採用」の判断を ADR として独立化し、リポジトリの ADR 集約場所に配置する。

### 2.2 最終ゴール

- ADR テンプレート (Context / Decision / Consequences / Alternatives Considered) で記述された ADR-001 が ADR 集約ディレクトリに存在する
- workflow outputs から ADR への参照リンクが貼られている
- 将来の hook ツール再評価時に ADR から判断履歴が辿れる

### 2.3 スコープ

#### 含むもの

- ADR 集約先ディレクトリの決定（`doc/decisions/` 新設 or 既存箇所活用）
- ADR-001 の執筆（husky / pre-commit / native git hooks との比較含む）
- 既存 workflow outputs（Phase 2 design / Phase 3 review）から ADR へのリンク追加

#### 含まないもの

- 他の設計判断（D1, Auth.js, Hono 等）の ADR 化
- lefthook 設定そのものの変更
- workflow outputs の内容書き換え（リンク追加のみ）

### 2.4 成果物

- ADR-001 ファイル（Markdown）
- ADR 集約ディレクトリ（必要なら新設）
- workflow outputs への参照リンク差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-git-hooks-lefthook-and-post-merge` Phase 2 / Phase 3 の outputs が存在する
- lefthook 採用が現状の正本である

### 3.2 依存タスク

- `task-git-hooks-lefthook-and-post-merge`

### 3.3 必要な知識

- ADR (Architecture Decision Record) フォーマット
- husky / lefthook / pre-commit / native git hooks の特性差
- 本タスク Phase 2 design ADR-01 の文脈

### 3.4 推奨アプローチ

ADR 集約場所は `doc/decisions/` の新設を第一候補とし、既存 `doc/00-getting-started-manual/` 配下に配置するなら命名規約を明確にする。ADR は Markdown 1ファイル / 1 判断とし、番号は `0001-git-hook-tool-selection.md` のように zero-padded で開始する。

---

## 4. 実行手順

### Phase構成

1. ADR 集約先の決定
2. ADR-001 の執筆
3. workflow outputs から ADR への参照追加

### Phase 1: ADR 集約先の決定

#### 目的

リポジトリ内の ADR 集約ディレクトリを確定する。

#### 手順

1. `doc/` 配下の既存構造を確認する
2. `doc/decisions/` 新設 vs 既存箇所活用 (`doc/00-getting-started-manual/decisions/` 等) を比較する
3. 採用先と命名規約（`NNNN-<slug>.md`）を決定する

#### 成果物

ADR ディレクトリ（空でもよい）と命名規約のメモ

#### 完了条件

ADR の置き場所が一意に決まっている

### Phase 2: ADR-001 の執筆

#### 目的

「Git hook ツールに lefthook を採用、husky を不採用」を ADR テンプレートで記述する。

#### 手順

1. Context: monorepo / pnpm / mise 環境での hook 運用要件を整理
2. Decision: lefthook を採用する旨を明記
3. Consequences: 採用による positive / negative 影響を列挙
4. Alternatives Considered: husky / pre-commit / native git hooks をそれぞれ比較し、不採用理由を記述
5. References: 派生元 workflow outputs へのリンクを末尾に貼る

#### 成果物

`<ADR-dir>/0001-git-hook-tool-selection.md`

#### 完了条件

ADR テンプレートの全セクションが埋まり、Phase 2 design / Phase 3 review の判断が ADR 側で完結している

### Phase 3: workflow outputs から ADR への参照追加

#### 目的

既存 workflow outputs から ADR への trace を確立する。

#### 手順

1. `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` ADR-01 セクションに ADR への相対リンクを追記
2. `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` 第5節に同様のリンクを追記
3. 内容の重複は避け、詳細は ADR を参照する旨を一文添える

#### 成果物

workflow outputs への diff（リンク追加のみ）

#### 完了条件

workflow outputs から ADR への遷移が 1 クリックで可能

---

## 5. 完了条件チェックリスト

- [ ] ADR 集約ディレクトリが確定している
- [ ] ADR-001 が ADR テンプレートで記述されている
- [ ] husky / pre-commit / native git hooks の不採用理由が記載されている
- [ ] workflow outputs から ADR への参照リンクが貼られている
- [ ] ADR の内容が workflow outputs に依存せず単独で読める

---

## 6. 苦戦箇所と将来知見

- workflow outputs に分散した設計判断は、workflow ディレクトリが移動・アーカイブされた瞬間にトレース不能になる。ADR を独立化するための集約場所がリポジトリに未確立。
- 「採用 X / 不採用 Y」の判断ログを ADR テンプレートに乗せず散文で書くと、後続タスクが理由を再発掘する手戻りが発生する。
- 候補 ADR 集約先: `doc/00-getting-started-manual/decisions/` または `doc/decisions/` の新設が必要。どちらにするかは本タスク Phase 1 で確定させる。

---

## 7. リスクと対策

- ADR 集約先を 2 箇所以上に分散させると、将来の ADR が散在し当タスクの目的を損なう → Phase 1 で一意に確定する
- workflow outputs と ADR で内容が二重管理になる → ADR を正本、outputs はリンクのみとする
- ADR-001 の番号衝突（並走タスクで別 ADR を作成中の場合） → 採用前に既存 ADR ディレクトリを再確認する

---

## 8. 参照情報

- `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` ADR-01
- `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` 第5節
- `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md` (B-2)
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`

---

## 9. 備考

- 本 ADR は Git hook ツール選定の歴史的判断を残す目的であり、現状の lefthook 採用を変更するものではない
- 将来別ツールへ移行する場合は ADR-001 を Superseded 扱いにし、新規 ADR を追加する運用とする
- 他の設計判断（D1 採用等）の ADR 化は本タスクのスコープ外。別タスクで段階的に進める
