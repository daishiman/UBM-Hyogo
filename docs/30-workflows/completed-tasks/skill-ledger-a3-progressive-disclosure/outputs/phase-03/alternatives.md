# Phase 3 成果物 — 代替案比較 alternatives.md

タスク: skill-ledger-a3-progressive-disclosure
Phase: 3 / 13（設計レビュー）
作成日: 2026-04-28
状態: spec_created（docs-only / NON_VISUAL）

---

## 案 A: 200 行制約のみ（references なし）

### 概要
- 対象 SKILL.md を削除・要約のみで 200 行未満に圧縮し、`references/` ディレクトリを作らない。
- entry がそのまま全責務を負い、肥大化セクションは削るか短くまとめる。

### 利点
- 実装が単純。ファイル数が増えず canonical / mirror 同期の表面積が広がらない。
- 行数検査だけで AC-1 / AC-6 を達成可能。

### 欠点
- 削除・要約は意味的書き換えに該当し「機械的 cut & paste のみ」という skill-ledger 内不変条件に違反する。
- 情報量が減り、Phase テンプレ・アセット規約・品質ゲート等の詳細仕様が失われ skill 有用性が下がる。
- 真の論点（責務境界の構造的固定）に応えていない。loader 側の context 削減効果は得られるが、worktree 並列編集の衝突源は entry にそのまま残る。
- ドッグフーディング矛盾（`task-specification-creator/SKILL.md`）解消後も「次に肥大化したら同じ削減作業」という再発を構造的に防げない。

---

## 案 B: 全セクションを references に逃がし entry を front matter のみ

### 概要
- SKILL.md を front matter + 1 行概要のみにし、それ以外のすべてのセクションを `references/` 配下へ移送する。
- entry を極小化することで worktree 衝突を理論的に最小化する。

### 利点
- entry が極小化し並列編集の衝突がほぼ消える。
- 行数制約を最も厳しく守れる（entry が 30〜50 行で済む）。

### 欠点
- skill loader が trigger / Anchors / 最小 workflow / モード一覧を解決するために references を追加ロードする必要があり、Progressive Disclosure の本来意図（entry のみで loader 解決可能）に反する。
- `/admin` 等の運用用途で entry の自明性が失われ、利用者が skill 概要を把握するのに references を都度開く必要が出る（運用性低下）。
- 外部から SKILL.md 内部アンカーを指していた既存リンクが大量に切れる（AC-7 リスク MAJOR）。
- references 数が肥大化（skill ごとに 8〜15 ファイル）し、mirror 同期負荷が増大する。

---

## 案 C（推奨・base case）: Progressive Disclosure 固定セット

### 概要
- entry に固定 10 要素（front matter / 概要 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow）を残し、それ以外を `references/<topic>.md` へ単一責務で切り出す。
- Phase 2 で確定した分割設計表（`split-design.md`）に基づき、機械的 cut & paste のみで実装する。

### 利点
- loader が entry のみで trigger / Anchors / 最小 workflow を解決できる（Progressive Disclosure 原義）。
- worktree 並列編集の衝突源が「詳細仕様（references）」と「入口（entry）」に構造的に分離される。詳細編集は references 単位に局所化し、entry の touch 頻度が激減する。
- `aiworkflow-requirements/SKILL.md`（190 行 + references/）という前例があり、実装プロセスのリスクが既知。
- `task-specification-creator` のドッグフーディング矛盾（517 行）を解消でき、AC-9 / AC-10 を満たす。
- 機械的 cut & paste のみで完了するため、skill-ledger 内不変条件「意味的書き換え禁止」を遵守できる。
- 4条件すべて PASS、MAJOR ゼロ。

### 欠点
- ファイル数が増える（5 skill × 4〜5 references ≒ 20〜25 ファイル新規追加）。
- ただし `.gitattributes`（B-1）で rename 検出規約を整えれば diff レビュー負荷は許容範囲。
- references リンク表のメンテナンスコストが entry に発生（ただし 10 要素テンプレで標準化されるため低い）。

---

## 案 D: skill 単位で個別判断（共通テンプレ無し）

### 概要
- 共通テンプレを設けず、skill ごとに entry 残置項目・references 切り出し範囲を最適化する。
- skill の特性（Phase 12 詳細を持つ / モード切替を持つ / Pattern 例集を持つ 等）に応じて柔軟に設計する。

### 利点
- skill ごとの特性に応じた最小化が可能。
- 一部の skill では entry を 100 行未満まで圧縮できる余地がある。

### 欠点
- 責務境界判断が skill ごとに揺れ、レビュー時に「entry に残すべきか references に逃がすべきか」が毎回議論になる（原典タスク指示書 §9 苦戦箇所 2 そのもの）。
- 再発防止策にならない。次に SKILL.md を作る作者が、どの基準で entry / references を切るかを毎回判断することになる。
- skill-creator スキル本体テンプレへの組込み（再発防止 / 別タスク化候補）が困難。

---

## 評価マトリクス（再掲）

| 観点 | 案 A | 案 B | 案 C（推奨） | 案 D |
| --- | --- | --- | --- | --- |
| 価値性 | MINOR | PASS | PASS | PASS |
| 実現性 | MAJOR | PASS | PASS | MINOR |
| 整合性（skill-ledger 内不変条件） | MAJOR | PASS | PASS | MINOR |
| 運用性 | MINOR | MINOR | PASS | MAJOR |
| ドッグフーディング解消（AC-9） | PASS | PASS | PASS | MINOR |
| 並列衝突削減 | MINOR | PASS | PASS | MINOR |
| 参照切れリスク（AC-7） | PASS | MAJOR | MINOR | MINOR |
| mirror 同期負荷（AC-5） | PASS | MINOR | PASS | MINOR |
| 意味的書き換え混入リスク | MAJOR | PASS | PASS | MINOR |

## 採用結論

- **案 C** を採用する。
- 案 A は意味的書き換え MAJOR、案 B は参照切れ MAJOR、案 D は責務境界の揺れ運用性 MAJOR。
- 案 C のみが MAJOR ゼロで、ドッグフーディング矛盾の解消（AC-9）+ 再発防止（AC-10 Anchor 追記）+ 機械的 cut & paste のみ という 3 要件を同時に満たす。
- 案 D は将来の skill 個別最適化余地として `outputs/phase-12/unassigned-task-detection.md` に登録のみ行い、本タスクでは採用しない。
