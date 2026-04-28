# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 2 (設計：分割設計表) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（設計レビュー docs。`.claude/skills/` 本体は本 Phase では変更しない） |

## 目的

Phase 2 の設計（inventory.md / split-design.md）に対して、3 つ以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と各観点（不変条件 / 並列衝突 / 参照切れ / mirror 同期 / 意味的書き換え混入）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通す。base case = Phase 2 で確定した「entry 固定 10 要素 + references 単一責務 topic 群」案が他案に優越することを根拠付きで示す。

## 真の論点（要約）

- 「分割の有無」ではなく「責務境界をどこに引くか」が論点。代替案はこの境界の引き方を変えた 3 種以上。
- base case が「ドッグフーディング矛盾の解消」「並列編集 conflict の構造的削減」「機械的 cut & paste のみで完了可能」の 3 点で他案を上回ることをマトリクスで示す。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | Phase 1 | 真の論点・4条件 PASS・AC | 本 Phase で再定義しない |
| 上流 | Phase 2 | inventory.md / split-design.md（base case） | レビュー対象 |
| 下流 | Phase 4 | 採用 base case と open question | テスト戦略の入力 |
| 下流 | Phase 5 | per-skill PR 計画と Anchor 追記の小 PR 計画 | 実装ランブック起点 |
| 下流 | Phase 10 | 4条件 + 観点の最終判定 | GO/NO-GO ゲートの根拠 |

## 代替案比較

### 案 A: 200 行制約のみ（references なし）

- 概要: SKILL.md を 200 行未満に圧縮するが、`references/` を作らず削除・要約のみで対応。
- 利点: 実装が単純、ファイル数が増えない。
- 欠点: 削除・要約は意味的書き換えに該当し「メカニカル cut & paste のみ」原則に反する（skill-ledger 内不変条件 違反）。情報量が減り skill の有用性が低下。Phase テンプレ・アセット規約等の詳細仕様が失われる。

### 案 B: 全セクションを references に逃がし entry を front matter のみ

- 概要: SKILL.md を front matter + 1 行概要のみに削り、それ以外は全て references 配下へ移送。
- 利点: entry が極小化し worktree 衝突が最小化。
- 欠点: skill loader が trigger / Anchors / 最小 workflow を解決するために references を追加ロードする必要があり Progressive Disclosure の本来意図（entry のみで loader 解決可能）に反する。`/admin` 用途に近い skill では entry の自明性が失われ運用性が下がる。

### 案 C（推奨・base case）: Progressive Disclosure 固定セット（Phase 2 採用案）

- 概要: entry に固定 10 要素（front matter / 概要 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow）を残し、それ以外を `references/<topic>.md` へ単一責務で切り出す。
- 利点: loader が entry のみで trigger / Anchors を解決できる。worktree 並列編集の衝突源が詳細仕様（references）と入口（entry）に構造的に分離される。`aiworkflow-requirements/SKILL.md` という前例があり実現性が高い。`task-specification-creator` のドッグフーディング矛盾を解消できる。機械的 cut & paste のみで完了可能。
- 欠点: ファイル数が増える（skill ごとに `references/` ディレクトリが追加）が、`.gitattributes`（B-1）で rename 検出規約を整えれば diff レビュー負荷は許容範囲。

### 案 D: skill 単位で個別判断（テンプレ無し）

- 概要: skill ごとに entry 残置項目を個別最適化し、共通テンプレを設けない。
- 利点: skill の特性に応じた最小化が可能。
- 欠点: 責務境界判断が skill ごとに揺れ、レビュー時に「entry に残すべきか references に逃がすべきか」が毎回議論になる。原典タスク指示書 §9 苦戦箇所 2 そのもの。再発防止策にならない。

### 代替案 × 評価マトリクス

| 観点 | 案 A (200行制約のみ) | 案 B (entry=front matterのみ) | 案 C (推奨・base case) | 案 D (個別判断) |
| --- | --- | --- | --- | --- |
| 価値性 | MINOR（情報量低下） | PASS | PASS | PASS |
| 実現性 | MAJOR（意味的書き換えが必須化し原則違反） | PASS | PASS | MINOR（個別議論コスト） |
| 整合性（skill-ledger 内不変条件） | MAJOR（cut & paste 原則違反） | PASS | PASS | MINOR（テンプレ無しは責務境界判断が揺れる） |
| 運用性 | MINOR（情報削減で skill 有用性低下） | MINOR（loader が references を追加ロード） | PASS | MAJOR（毎回判断・揺れが続く） |
| ドッグフーディング解消（AC-9） | PASS | PASS | PASS | MINOR（テンプレ無しでは再発リスク） |
| 並列衝突削減 | MINOR（entry が依然厚い） | PASS | PASS | MINOR |
| 参照切れリスク（AC-7） | PASS（references 不在） | MAJOR（外部リンクが大量に切れる） | MINOR（references リンク表で誘導） | MINOR |
| mirror 同期負荷（AC-5） | PASS（ファイル数増えず） | MINOR（references 大量化） | PASS（topic 数は単一責務で抑制） | MINOR |
| 意味的書き換え混入リスク | MAJOR（必須化） | PASS | PASS | MINOR |

### 採用結論

- base case = **案 C（Progressive Disclosure 固定セット）** を採用。
- 理由:
  1. 4条件すべて PASS、MAJOR ゼロ、MINOR は他案（案 B の loader 追加ロード、案 D の個別議論）を回避できる。
  2. skill-ledger 内不変条件「機械的 cut & paste のみ」を遵守できる唯一の案。
  3. `task-specification-creator` のドッグフーディング矛盾（AC-9）を解消し、Anchor 追記（AC-10）を別小 PR で独立 revert 可能に保てる。
  4. `aiworkflow-requirements/SKILL.md` という前例があり実現性が確立されている。
- 案 D（個別判断）は「将来の skill 特性に応じた最適化余地」として `outputs/phase-12/unassigned-task-detection.md` に候補列挙のみ行う（本タスクでは採用しない）。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず、Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 実装時に運用上の補足対応（log / runbook 追記 / Anchor 追加）が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 並列編集 conflict を構造的に削減し、loader context 消費も低減。ドッグフーディング矛盾を解消 |
| 実現性 | PASS | A-1 / A-2 完了済み、`aiworkflow-requirements` の前例あり、機械的 cut & paste のみで完了 |
| 整合性 | PASS | プロジェクト不変条件 #1〜#7 に touch せず、skill-ledger 内不変条件（canonical/mirror 差分 0、cut & paste のみ、1 PR = 1 skill）を全て遵守 |
| 運用性 | PASS | 行数検査 / `rg` リンク健全性 / `diff -r` の 3 点で自動検証可能。ロールバックは 1 PR 単位 |
| 参照切れリスク | MINOR → PASS（緩和策あり） | references リンク表を entry 末尾に置き、外部から旧アンカー名で来た場合の誘導を構造化。Phase 5 / 11 で `rg` 検査を完了条件化 |
| 並列衝突 | PASS | 1 PR = 1 skill 分割厳守 + A-3 着手前の skill 単位 announce |
| ドッグフーディング解消（AC-9） | PASS | `task-specification-creator/SKILL.md` を最優先・単独 PR で 200 行未満化 |
| Anchor 追記（AC-10） | PASS | 「fragment で書け」「200 行を超えたら分割」を別小 PR で独立 revert 可能に追記 |
| mirror 同期（AC-5） | PASS | canonical 編集後に rsync 等で `.agents/skills/<skill>/` に反映、`diff -r` = 0 を完了条件化 |
| 意味的書き換え混入 | PASS | 切り出しは「セクション単位の cut & paste」のみ。文言修正は別タスクへ分離 |

## リスクレビュー

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 既存ドキュメント・他 skill から SKILL.md 内部アンカーへの大量リンクが分割で切れる | 高 | 中 | entry 末尾に references リンク表を必ず置く。Phase 5 / 11 で `rg -n 'references/'` 健全性検査を完了条件化。AC-7 でトレース |
| 並列で同 SKILL.md を編集する他タスクと衝突 | 高 | 中 | A-2 / A-1 完了後に着手。タスク開始時に skill 単位で announce。1 PR = 1 skill 分割を厳守 |
| 意味的書き換えがメカニカル分割に混入 | 中 | 低 | 切り出しは「セクション単位の cut & paste」のみ。Anchor 追記は別小 PR で独立化（独立 revert 可能） |
| canonical / mirror 同期漏れ | 中 | 中 | Phase 5 / 11 で `diff -r .claude/skills/<skill> .agents/skills/<skill>` を完了条件化（AC-5） |
| 責務境界判断の skill ごとの揺れ | 中 | 高 | entry 残置の固定 10 要素を共通テンプレとして決め打ち。Phase 2 split-design.md で skill ごとに表化 |
| ドッグフーディング矛盾が残存（task-specification-creator が他 skill 後回しになる） | 中 | 中 | `task-specification-creator` を表の先頭・最優先・単独 PR で固定（AC-9） |

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 3 案以上が評価マトリクスに並んでいる
- [ ] base case の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（5 / 11 / 12）が指定されている
- [ ] open question が 0 件、または受け皿 Phase が明記されている
- [ ] `task-specification-creator` の最優先・単独 PR 計画が Phase 2 split-design.md の先頭に固定されている

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- skill-ledger 内不変条件（canonical/mirror 差分 0、cut & paste のみ、1 PR = 1 skill）に違反する設計が残っている
- entry 残置 10 要素のいずれかが欠落している skill がある
- references 同士に循環参照・相互参照が残っている
- ドッグフーディング論点（AC-9 / AC-10）が未対応

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | Anchor 追記の小 PR を A-3 本体 PR の前後どちらで出すか | Phase 5 | 独立 revert を維持できる順序を選定 |
| 2 | references topic の細粒度（4 件か / もっと細かく分けるか）の最終決定 | Phase 5 | skill ごとに split-design.md で再確認 |
| 3 | skill-creator スキル本体テンプレへの 200 行制約組込み | Phase 12 unassigned | 再発防止策として別タスク化 |
| 4 | 案 D（skill 個別判断）を将来導入するか | Phase 12 unassigned | 次 Wave 以降の判断 |

## 実行タスク

1. 代替案を 3 案以上列挙する（A: 200 行制約のみ / B: entry=front matter のみ / C: 推奨 = Progressive Disclosure 固定セット / D: skill 個別判断）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 5 観点（参照切れ / 並列衝突 / mirror / 意味的書き換え / ドッグフーディング）で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（案 C）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載されている）。
5. リスクレビュー 6 件（参照切れ / 並列衝突 / 意味的書き換え混入 / mirror 同期漏れ / 責務境界揺れ / ドッグフーディング残存）を表化し対策を明記する（完了条件: 6 行揃う）。
6. 着手可否ゲート（GO / NO-GO）と open question を確定する（完了条件: GO 6 条件・NO-GO 5 条件・open question 4 件が記載）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-01.md | 真の論点・4条件・AC |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-02.md | レビュー対象設計（base case） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-02/split-design.md | Phase 2 実行後に生成される base case の構造 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-02/inventory.md | Phase 2 実行後に生成される base case の対象 skill |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | 苦戦箇所 6 件・リスク表の出典 |
| 必須 | .claude/skills/aiworkflow-requirements/SKILL.md | 案 C の前例（実現性根拠） |
| 参考 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 実装順序・ロールバック戦略 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜D を `outputs/phase-03/alternatives.md` に記述する。
- 各案に概要・利点・欠点を 3〜5 行で記述する。

### ステップ 2: 評価マトリクスの作成

- 9 観点（4条件 + 参照切れ / 並列衝突 / mirror / 意味的書き換え / ドッグフーディング）× 4 案を `outputs/phase-03/main.md` のマトリクスに埋める。
- 空セルが残らないことを確認する。

### ステップ 3: base case の最終判定

- 案 C が全観点 PASS（または MINOR → 緩和策で PASS 化）であることを確認する。
- MINOR が残る場合は対応 Phase を明示する。

### ステップ 4: リスクレビューと着手可否ゲート

- リスク 6 件を表化し対策を `outputs/phase-03/main.md` に記述する。
- GO / NO-GO チェックリストを通す。GO の場合のみ artifacts.json の Phase 3 を `spec_created` のままにし、Phase 4 へ進める。

### ステップ 5: open question の振り分け

- 4 件の open question すべてに受け皿 Phase（5 / 12 unassigned）を割り当てる。

## PASS / MINOR / MAJOR 判定（base case 全観点）

上記「base case 最終 PASS / MINOR / MAJOR 判定」表を参照（全観点 PASS、MAJOR ゼロ）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用 base case を入力に、行数検査 / `rg` リンク健全性 / `diff -r` のテスト戦略を組む |
| Phase 5 | open question #1（Anchor 小 PR の順序）/ #2（topic 細粒度）を実装で確定 |
| Phase 7 | base case の AC-1〜AC-11 を AC matrix の左軸に再利用 |
| Phase 10 | 4条件 + 9 観点の最終判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | リスク 6 件すべての検証ログ取得 |
| Phase 12 | open question #3（skill-creator テンプレ） / #4（案 D 将来導入）を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: 案 C が並列編集 conflict 削減・ドッグフーディング解消・loader context 削減の 3 点を満たすか。
- 実現性: 案 A の MAJOR（cut & paste 原則違反）・案 B の MAJOR（参照切れ）を base case が踏まないか。
- 整合性: 全代替案で skill-ledger 内不変条件が PASS であることを確認したか。
- 運用性: 案 D の MAJOR（責務境界の揺れが続く）を回避し、固定 10 要素テンプレで再発防止できているか。
- 参照切れ: entry 末尾の references リンク表で外部からの旧アンカー誘導が成立するか。
- mirror 同期: PR 単位で canonical → mirror の同期コミットが組まれているか。
- 意味的書き換え混入: cut & paste 以外の変更が混入していないか PR レビューで検出できる体制か。
- ドッグフーディング: `task-specification-creator` が表の先頭で最優先・単独 PR と固定されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 3 案以上の列挙 | 3 | spec_created | 案 A〜D の 4 案 |
| 2 | 評価マトリクスの作成 | 3 | spec_created | 9 観点 × 4 案 |
| 3 | base case 最終 PASS 判定 | 3 | spec_created | 全観点 PASS |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | spec_created | 3 レベル |
| 5 | リスクレビュー 6 件の表化 | 3 | spec_created | 参照切れ / 並列衝突 / 意味的書き換え / mirror / 責務境界揺れ / ドッグフーディング |
| 6 | 着手可否ゲート + open question 振り分け | 3 | spec_created | GO/NO-GO + open question 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・リスクレビュー・着手可否ゲート |
| ドキュメント | outputs/phase-03/alternatives.md | 代替案 4 案の詳細記述（概要・利点・欠点） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 代替案が 3 案以上（推奨 4 案）比較されている
- [ ] 9 観点 × 案のマトリクスに空セルが無い
- [ ] base case（案 C）の最終判定が全観点 PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] リスクレビュー 6 件（参照切れ / 並列衝突 / 意味的書き換え混入 / mirror 同期漏れ / 責務境界揺れ / ドッグフーディング残存）が対策付きで表化されている
- [ ] 着手可否ゲートの GO（6 条件）/ NO-GO（5 条件）が記述されている
- [ ] open question 4 件すべてに受け皿 Phase が割り当てられている
- [ ] 成果物が 2 ファイル（main.md / alternatives.md）に分離されている

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` および `outputs/phase-03/alternatives.md` に配置済み
- 4条件 + 5 観点すべてが PASS
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`
- `.claude/skills/` 配下のファイルを本 Phase で変更していない（docs のみ）

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 C（Progressive Disclosure 固定セット、entry 10 要素 + references 単一責務 topic）
  - 行数検査 / `rg` リンク健全性 / `diff -r` mirror diff の 3 点を Phase 4 のテスト戦略入力として渡す
  - リスク 6 件を Phase 6（異常系検証）の網羅対象として渡す
  - open question 4 件を該当 Phase（5 / 12 unassigned）へ register
  - `task-specification-creator` の最優先・単独 PR 計画を Phase 5 / 13 に引き渡し
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
  - skill-ledger 内不変条件に違反する設計が残っている
