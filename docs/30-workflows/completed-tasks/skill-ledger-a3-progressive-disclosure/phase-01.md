# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| Wave | skill-ledger（A-2 → A-1 → **A-3** → B-1） |
| 実行種別 | serial（A-1 完了後に着手・並列 SKILL.md 編集衝突回避） |
| 前 Phase | なし |
| 次 Phase | 2 (設計：分割設計表) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（`.claude/skills/*/SKILL.md` 構造再編成仕様のみで実コードは触らない） |

## 目的

肥大化した `.claude/skills/*/SKILL.md`（500 行超を含む）を 200 行未満の entrypoint に縮め、詳細を `references/<topic>.md` 配下へ Progressive Disclosure 方式で機械的に分割するための「真の論点・依存境界・受入条件・4条件評価」を docs として固定する。Phase 2 の分割設計が、entry 残置項目と references 切り出し境界を一意に判断できる入力を作成する。コード実装は一切行わず、`.claude/skills/` 配下のファイルも本 Phase では変更しない。

## 真の論点 (true issue)

- 「単一 SKILL.md にサイズ制約（200 行未満）を入れる」ことではなく、「skill loader が必要とする entrypoint 情報（front matter / Anchors / trigger / allowed-tools / 最小 workflow）と、詳細仕様（Phase テンプレ / アセット規約 / 品質ゲート / オーケストレーション）の責務境界を Progressive Disclosure で固定し、worktree 並列編集時の merge conflict を構造的に消す」ことが本タスクの本質。
- ドッグフーディング論点: `task-specification-creator/SKILL.md` 自身が 200 行を超えており、「200 行未満を推奨」と書いた skill が自身の規約を破る矛盾を最優先で解消する。これを解消しない限り、本 skill が他 skill に課す制約は説得力を持たない。
- 副次的論点: canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分 0 を維持しつつ分割を遂行する同期規律。分割 PR の「1 PR = 1 skill」粒度が崩れると、A-2 / A-1 で fragment 化した記録ファイルの効果が SKILL.md 衝突によって相殺される。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | task-skill-ledger-a1-gitignore（Issue #129） | skill-state 系記録ファイルの gitignore 化により、SKILL.md 周辺の並列編集の衝突源が縮小済み | 本タスクは gitignore 規約を再設計しない |
| 上流 | task-skill-ledger-a2-fragment（Issue #130） | render script と fragment 規約（changelog / LOGS のフラグメント化）が確立済み | 本タスクは fragment 規約に乗って references 化を行うだけで、規約自体は変更しない |
| 並列 | 他 skill 改修タスク全般 | A-3 着手中は対象 SKILL.md を単独 PR で占有することが合意されている | 1 PR = 1 skill 分割の影響範囲を局所化し、他改修タスクへ「対象 skill を一時的に編集禁止」と announce |
| 下流 | task-skill-ledger-b1-gitattributes | A-3 完了後に `references/<topic>.md` を含む rename 検出規約として gitattributes を追加 | 200 行未満の entry と references レイアウトを B-1 のターゲットとして引き渡す |
| 下流 | skill-creator スキル本体テンプレ更新（別タスク化） | 「SKILL.md は 200 行未満」を必須項目として組み込むテンプレ改訂 | 本タスクで確定した固定セット（entry 残置項目）をテンプレ仕様として渡す |

## 価値とコスト

- 価値: worktree 並列開発時の SKILL.md 衝突を構造的に解消し、A-1 / A-2 / B-1 の効果を最大化する。`task-specification-creator` のドッグフーディング矛盾を解消し、skill 改修ルールが自己整合する。skill loader の context 消費を削減（loader は entry のみ読めば trigger / Anchors を解決できる）。
- コスト: 対象 skill 数 × （棚卸し + 分割設計 + cut & paste + リンク健全性検査 + mirror 同期）の人手作業。意味的書き換えは禁止のため、機械的作業に閉じる。CI / 無料枠への影響なし（ローカル docs / skill 構造の再編成のみ）。
- 機会コスト: 「200 行制約のみ入れて references を作らない」案や「全セクションを references に逃がし entry を front matter のみ」案も検討対象（Phase 3 で比較）。本案は Progressive Disclosure 固定セットによりバランスを取る。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | worktree 並列編集時の SKILL.md merge conflict を構造的に消し、ドッグフーディング矛盾（task-specification-creator/SKILL.md 自身が 200 行超）を解消する。loader の context 消費削減という副次効果もある |
| 実現性 | PASS | 対象は `.claude/skills/*/SKILL.md` のみで、技術的には Markdown の cut & paste と相対リンク張り替え。A-1 / A-2 完了済みで前提が揃い、`aiworkflow-requirements/SKILL.md` という分割済み参考例も既に存在する |
| 整合性 | PASS | プロジェクト不変条件 #1〜#7（Form schema / consent key / responseEmail / admin-managed data / D1 access / GAS prototype / 再回答）には touch しない。skill-ledger 内不変条件（canonical / mirror 差分 0、機械的 cut & paste のみ、1 PR = 1 skill）はすべて遵守可能 |
| 運用性 | PASS | 行数検査スクリプト（`wc -l`）/ リンク健全性検査（`rg`）/ canonical-mirror diff（`diff -r`）の 3 点で自動検証可能。Phase 5/11 の検証ログを evidence として残せる。ロールバックは `references/` 分割 PR の revert で 1 コミット粒度に戻る |

## 受入条件 (AC) — index.md と完全同期

- AC-1: 対象 `.claude/skills/*/SKILL.md` がすべて 200 行未満になっている
- AC-2: 詳細トピックが `references/<topic>.md` に単一責務で命名・配置されている
- AC-3: entry に front matter / 概要 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow が保持されている
- AC-4: SKILL.md → references の参照は片方向で、references 同士に循環参照がない
- AC-5: canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分が 0（`diff -r`）
- AC-6: 行数検査スクリプトで全対象 SKILL.md が `OK`（200 行未満）
- AC-7: `rg` によるリンク健全性検査でリンク切れ 0 件
- AC-8: 未参照 reference 0 件
- AC-9: `task-specification-creator/SKILL.md` が最優先・単独 PR で 200 行未満化されている
- AC-10: skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」Anchor が追記されている
- AC-11: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS

## 苦戦箇所と AC / 多角的チェックへの対応

| # | 苦戦箇所 | 対応する AC / チェック観点 |
| --- | --- | --- |
| 1 | 既存リンクが SKILL.md 内部アンカーを大量に指しており、分割で参照切れが発生しやすい | AC-7（リンク健全性 0 件）／ 多角的チェック「参照切れ検出」 |
| 2 | entry / references の責務境界判断が skill ごとに揺れる（共通テンプレ未整備） | AC-3（entry 固定セット保持）／ Phase 2 の固定セット明文化 |
| 3 | 並列で同一 SKILL.md を編集する他タスクとの衝突 | 依存境界「並列」／ 多角的チェック「1 PR = 1 skill 厳守」 |
| 4 | ドッグフーディング矛盾（task-specification-creator/SKILL.md 自身が 200 行超） | AC-9（最優先・単独 PR）／ AC-10（Anchor 追記） |
| 5 | canonical / mirror 同期漏れ | AC-5（`diff -r` = 0）／ Phase 5 検証ログ |
| 6 | 意味的書き換えがメカニカル分割に混入 | 多角的チェック「cut & paste のみ」／ skill-ledger 内不変条件 |

## 実行タスク

1. 原典タスク指示書（`docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md`）の苦戦箇所 6 件を本 Phase の AC または多角的チェックに対応付ける（完了条件: 上表「苦戦箇所と AC / 多角的チェックへの対応」が 6 行揃う）。
2. 真の論点を「200 行制約導入」ではなく「Progressive Disclosure による責務境界の構造的固定」に再定義する（完了条件: 真の論点セクションに entry / references の責務境界が明文化されている）。
3. 依存境界を上流 2 / 並列 1 / 下流 2 の計 5 件で確定する（完了条件: 各行に「受け取る前提」「渡す出力」が記述されている）。
4. 4条件評価（価値性 / 実現性 / 整合性 / 運用性）を全 PASS で確定する（完了条件: 各観点に PASS 判定と根拠が記載）。
5. AC-1〜AC-11 を index.md と一字一句同期する（完了条件: index.md `## 受入条件 (AC)` との文言差分がゼロ）。
6. ドッグフーディング論点（`task-specification-creator/SKILL.md` 自身が 200 行超）を最優先対象として固定する（完了条件: AC-9 / AC-10 が真の論点セクションに連動して記述されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | 原典タスク指示書（苦戦箇所 6 件・スコープ・検証方法の出典） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | メタ情報・AC-1〜AC-11・依存関係の正本 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/main.md | 分割方針の確定根拠 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 の機械的手順 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 実装順序（A-2 → A-1 → A-3 → B-1）・ロールバック戦略 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/file-layout.md | references レイアウト規約 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | 分割対象代表例（最優先・ドッグフーディング矛盾の現物） |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既に分割済みの参考例（スコープ外） |

## 実行手順

### ステップ 1: 原典の精読と苦戦箇所写経

- 原典タスク指示書の §9 苦戦箇所（症状 1〜3 + ドッグフーディング 1 件 = 計 4 群、合計 6 観点）を本 Phase に転記し、それぞれが AC 1 件以上または多角的チェック観点に紐づくことを確認する。
- 苦戦箇所が AC に対応していないものがあれば、本 Phase で多角的チェック観点に追加する。

### ステップ 2: 真の論点と依存境界の確定

- 「200 行制約のみ」案を Phase 3 の代替案として位置付け、本 Phase では「Progressive Disclosure 固定セットによる責務境界の構造的固定」に論点を寄せる。
- 上流（A-1 / A-2）が完了済みであることを `docs/30-workflows/completed-tasks/` で確認する。未完了があれば本 Phase の状態を `spec_created` のままにし Phase 2 に進めない。

### ステップ 3: 4条件と AC のロック

- 4条件すべてが PASS で固定されていることを確認する。
- AC-1〜AC-11 を `outputs/phase-01/main.md` に列挙し、index.md と完全一致させる（diff = 0）。

### ステップ 4: ドッグフーディング論点の最優先化

- AC-9（task-specification-creator/SKILL.md を最優先・単独 PR で 200 行未満化）と AC-10（Anchor 追記）を Phase 2 / 5 / 13 の入力として明示する。
- skill-creator 本体テンプレ改訂は別タスク化することを `outputs/phase-12/unassigned-task-detection.md` 候補として記録する旨を Phase 12 への引き渡しに含める。

## 多角的チェック観点

- 参照切れ検出: 分割前後で `rg -n 'references/' .claude/skills/*/SKILL.md` の結果が一貫しているか（Phase 5 検証）。
- 責務境界判断: entry に残す要素が「front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow」の固定セットに揃っているか（Phase 2 で明文化）。
- 並列衝突: A-3 着手前に対象 skill を announce し、1 PR = 1 skill を厳守できる体制が整っているか。
- ドッグフーディング整合: `task-specification-creator/SKILL.md` 自身が 200 行未満化される計画になっているか。
- mirror 同期漏れ: canonical 編集後に必ず `.agents/skills/<skill>/` を rsync 等で同期し `diff -r` = 0 を完了条件にしているか。
- 意味的書き換え混入: 切り出しは「セクション単位の cut & paste」のみ。文言修正・項目追加は別タスクへ分離する原則が遵守されているか。
- skill-ledger 内不変条件: canonical / mirror 二重管理 / 1 PR = 1 skill 分割 / 機械的 cut & paste の 3 点が全 Phase で守られているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 苦戦箇所 6 件 → AC / チェック対応表 | 1 | spec_created | 上表 6 行 |
| 2 | 真の論点を Progressive Disclosure 責務境界に再定義 | 1 | spec_created | main.md 冒頭 |
| 3 | 依存境界（上流 2 / 並列 1 / 下流 2）の固定 | 1 | spec_created | A-2 / A-1 完了確認含む |
| 4 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 5 | AC-1〜AC-11 を index.md と完全同期 | 1 | spec_created | 文言 diff = 0 |
| 6 | ドッグフーディング論点（AC-9 / AC-10）の最優先化 | 1 | spec_created | Phase 5 / 13 入力 |

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは実行しない。Phase 4 で定義する行数・リンク・mirror diff 検証へ、AC-1〜AC-11 と依存境界を入力として渡す。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（true issue / 4条件 / 依存境界 / AC / 苦戦箇所マッピング） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「200 行制約導入」ではなく「Progressive Disclosure による責務境界の構造的固定」に再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 2・並列 1・下流 2 すべてが「受け取る前提」「渡す出力」付きで記述されている
- [ ] AC-1〜AC-11 が index.md と完全一致している
- [ ] 苦戦箇所 6 件すべてが AC または多角的チェック観点に対応付けられている
- [ ] ドッグフーディング論点（task-specification-creator/SKILL.md）が AC-9 / AC-10 として最優先で固定されている
- [ ] プロジェクト不変条件 #1〜#7 のいずれにも touch しない範囲で要件が定義されている

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 実行時成果物が `outputs/phase-01/` 配下に配置される設計になっている
- 苦戦箇所 6 件すべてが AC または多角的チェックに対応
- 異常系（参照切れ / 並列衝突 / ドッグフーディング矛盾 / mirror 同期漏れ / 意味的書き換え混入 / 責務境界判断ミス）が要件レベルで提示されている
- artifacts.json の `phases[0].status` が `spec_created`
- `.claude/skills/` 配下のファイルを本 Phase で変更していない（docs のみ）

## 次 Phase への引き渡し

- 次 Phase: 2 (設計：分割設計表)
- 引き継ぎ事項:
  - 真の論点 = Progressive Disclosure による責務境界の構造的固定
  - entry 残置の固定セット（10 要素）を Phase 2 で表化する指示
  - 棚卸しコマンド `for f in .claude/skills/*/SKILL.md; do printf '%5d  %s\n' "$(wc -l < "$f")" "$f"; done | sort -nr` で 200 行超を抽出
  - `task-specification-creator/SKILL.md` を最優先対象として Phase 2 設計表の先頭に配置
  - topic 命名は単一責務（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`）
- ブロック条件:
  - A-1 / A-2 のいずれかが `completed` でない
  - 4条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が index.md と乖離
  - 苦戦箇所 6 件のうち未マッピングが残る
