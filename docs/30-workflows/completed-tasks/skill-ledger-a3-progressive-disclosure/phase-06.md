# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-28 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（failure-case） |

## 目的

Phase 5 ランブック（Step 1〜5）で組み立てた SKILL.md 分割作業に対し、想定される失敗シナリオ（リンク切れ / 並列編集衝突 / canonical-mirror 差分 / 行数超過残置 / 意味的書き換え混入 / 循環参照）を網羅し、検出方法・自動化可能性・evidence・復旧手順まで揃える。Phase 7（AC マトリクス）でトレースし、Phase 9（品質保証）/ Phase 11（手動 smoke）で検証可能な状態にする。

## 依存境界

- 失敗シナリオは `.claude/skills/*` の構造的整合性に閉じる（アプリ層・skill loader 本体は対象外）。
- 検出は Phase 4 で定義した検証カテゴリ V1〜V6 を流用し、新規ランタイムは導入しない。
- 復旧は `git revert` / `rsync` / 手動再切り出し で完結する範囲のみ扱う。

## 実行タスク

1. 6 件の失敗シナリオ（F-1〜F-6）について、原因 / 検出 / 自動化可能性 / 復旧 / evidence の 5 項目を埋める（完了条件: 全件で空欄なし）。
2. 各シナリオを Phase 4 検証カテゴリ V1〜V6 と Phase 5 ランブック Step 0〜5 にマップする（完了条件: 全件で対応する V/Step が 1 件以上）。
3. 復旧手順をコマンドベースで記述する（完了条件: 代表シナリオ 3 件以上で `git` / `rsync` ベースの復旧コマンドが整う）。
4. 自動化可能性を「自動 / 半自動 / 手動」の 3 段階で分類する（完了条件: 全件で分類が一意）。
5. AC-1〜AC-11 への影響を明示する（完了条件: 各シナリオで影響 AC が 1 件以上特定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | §7 リスクと対策 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | AC-1〜AC-11 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-04.md | V1〜V6 検証カテゴリ |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-05.md | runbook Step 0〜5 / PR 計画 / ロールバック |
| 参考 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/skill-feedback-report.md | F-1 / F-5 の発見記録 |

## failure cases マトリクス

| # | シナリオ | 原因 | 検出 | 自動化 | 影響 AC | 対応 V / Step |
| --- | --- | --- | --- | --- | --- | --- |
| F-1 | SKILL.md → references リンク切れ | references リンク表追加漏れ / topic ファイル名タイポ | Phase 4 V2: `rg -n 'references/' SKILL.md` ヒット 0 件 / `test -f` 失敗 | 自動 | AC-4, AC-7 | V2 / Step 4 |
| F-2 | 並列 SKILL.md 編集タスクとの衝突 | 着手前 announce 漏れ / A-1, A-2 完了前の着手 | `git merge` conflict / PR レビューでの差分競合 | 半自動 | AC-3, AC-9 | Step 0 announce |
| F-3 | canonical / mirror 差分発生 | rsync 漏れ / canonical のみ commit | Phase 4 V4: `diff -r .claude/skills/<skill> .agents/skills/<skill>` 非空 | 自動 | AC-5 | V4 / Step 5 |
| F-4 | entry が 200 行を超える skill が残置 | 切り出し範囲不足 / topic 設計過小 | Phase 4 V1: `wc -l` >= 200 | 自動 | AC-1, AC-6, AC-9 | V1 / Step 4 |
| F-5 | 意味的書き換えの混入 | cut & paste 中の言い換え / Anchor 追記の本体 PR 混入 | Phase 4 V6: `git diff` の追加削除行不一致 | 半自動 | AC-2, AC-3, AC-11 | V6 / Step 3 |
| F-6 | references 同士の循環参照 | references 内で別 reference を参照しすぎ / 共通要素未抽出 | 依存グラフ目視 + `rg 'references/' references/<topic>.md` で他 reference 参照を検出 | 半自動 | AC-4 | V2 拡張 / Step 2 |

合計: 6 件（要件下限を満たす）。

## 各シナリオの詳細

### F-1: SKILL.md → references リンク切れ

| 項目 | 内容 |
| --- | --- |
| 原因 | references topic を新設したが、SKILL.md の References リンク表に追記漏れ。または `references/<typo>.md` のようなファイル名不一致。 |
| 検出 | Phase 4 V2 スクリプト `outputs/phase-04/scripts/link-integrity.sh` が FAIL 行を出力。 |
| 自動化 | 自動（CI / pre-PR で実行可能）。 |
| 復旧 | SKILL.md の References リンク表に正しい path を追加。または `references/<topic>.md` のファイル名を修正。修復後 V2 を再実行。 |
| evidence | `outputs/phase-06/evidence/F-1-link-integrity.log` |
| 影響 AC | AC-4, AC-7 |

復旧コマンド例:
```bash
# 不足リンクを SKILL.md に追加（手動編集）→ 再検証
bash outputs/phase-04/scripts/link-integrity.sh \
  | tee outputs/phase-06/evidence/F-1-link-integrity.log
```

### F-2: 並列 SKILL.md 編集タスクとの衝突

| 項目 | 内容 |
| --- | --- |
| 原因 | A-3 着手前 announce 漏れ。または A-1 / A-2 未完了で fragment 受け皿が無いまま着手。 |
| 検出 | `git merge` 時の conflict / PR レビューでの差分競合 / dev へのマージ時の意図しない変更。 |
| 自動化 | 半自動（git の conflict 検出は自動だが、announce は人手）。 |
| 復旧 | 衝突した片方の作業を待避し、もう片方の skill を先にマージ → 待避側を rebase。1 PR = 1 skill 原則を再確認。 |
| evidence | `outputs/phase-06/evidence/F-2-merge-conflict.log`（`git status` / `git diff` の保存） |
| 影響 AC | AC-3, AC-9 |

復旧コマンド例:
```bash
# 待避
git stash push -m "a3-skill-conflict-stash"
# 先行 PR を rebase 取り込み
git fetch origin && git rebase origin/dev
# 競合解消後 stash pop
git stash pop
```

### F-3: canonical / mirror 差分発生

| 項目 | 内容 |
| --- | --- |
| 原因 | `.claude/skills/...` のみ修正し `.agents/skills/...` への rsync を忘れた。または rsync 後に片方のみさらに編集した。 |
| 検出 | Phase 4 V4 スクリプト `outputs/phase-04/scripts/mirror-diff.sh` が非空出力。 |
| 自動化 | 自動。 |
| 復旧 | canonical を正本として rsync で mirror を上書き同期。Phase 5 Step 5 のチェックリストを再実行。 |
| evidence | `outputs/phase-06/evidence/F-3-mirror-diff.log` |
| 影響 AC | AC-5 |

復旧コマンド例:
```bash
SKILL=task-specification-creator
rsync -av --delete \
  .claude/skills/$SKILL/ \
  .agents/skills/$SKILL/
diff -r .claude/skills/$SKILL .agents/skills/$SKILL \
  | tee outputs/phase-06/evidence/F-3-mirror-diff.log
```

### F-4: entry が 200 行を超える skill が残置

| 項目 | 内容 |
| --- | --- |
| 原因 | Phase 2 の分割設計時に切り出し対象セクションが過小。または cut & paste 後に新規 entry 追記が混入。 |
| 検出 | Phase 4 V1 スクリプトが `FAIL: <path> = <N>` を出力。 |
| 自動化 | 自動。 |
| 復旧 | Phase 2 設計表に立ち返り、追加で切り出す topic を選定 → references を分割追加 → SKILL.md を再リライト。 |
| evidence | `outputs/phase-06/evidence/F-4-line-count.log` |
| 影響 AC | AC-1, AC-6, AC-9 |

復旧手順:
1. `wc -l` で対象 skill の行数を確認。
2. 最も大きいセクションを `references/<additional-topic>.md` に追加切り出し。
3. SKILL.md References 表に追記し、再度 V1 を実行。

### F-5: 意味的書き換えの混入

| 項目 | 内容 |
| --- | --- |
| 原因 | cut & paste 中の言い換え / Anchor 追記の本体 PR 混入 / 句読点・順序の整理 |
| 検出 | Phase 4 V6: `git diff` の追加行と削除行を sort 後 diff し、テキスト不一致を検出。 |
| 自動化 | 半自動（境界判定は人手）。 |
| 復旧 | 該当 commit を `git revert` または `git rebase -i` で分離し、本体 PR から除外。Anchor 追記等の意味変更は別 PR に切り出す。 |
| evidence | `outputs/phase-06/evidence/F-5-semantic-diff-<skill>.md` |
| 影響 AC | AC-2, AC-3, AC-11 |

復旧コマンド例（注: `-i` は対話必須のためローカル人手で実行）:
```bash
# 意味変更コミットを特定
git log --oneline .claude/skills/$SKILL/SKILL.md
# 該当コミットを別 PR に切り出し（インタラクティブ rebase はローカルで実行）
# 本体 PR からは revert で除外
git revert <semantic-rewrite-sha>
```

### F-6: references 同士の循環参照

| 項目 | 内容 |
| --- | --- |
| 原因 | `references/<a>.md` 内から `references/<b>.md` を参照し、`<b>` からも `<a>` を参照する構造を作ってしまう。共通要素を別 reference に切り出していない。 |
| 検出 | `rg 'references/' .claude/skills/<skill>/references/` で各 reference が他 reference を参照しているか確認 → 依存グラフを目視。 |
| 自動化 | 半自動（DAG 検査は自動化可能だが、初期実装は目視）。 |
| 復旧 | 共通要素を別 reference（例: `references/common.md`）に切り出すか、entry SKILL.md に戻す。Phase 2 設計表を更新。 |
| evidence | `outputs/phase-06/evidence/F-6-cycle-graph-<skill>.md` |
| 影響 AC | AC-4 |

検出コマンド例:
```bash
SKILL=task-specification-creator
rg -n 'references/[a-zA-Z0-9_\-]+\.md' \
  .claude/skills/$SKILL/references/ \
  | tee outputs/phase-06/evidence/F-6-cycle-graph-$SKILL.md
# 出力を読み、各 reference の依存先を抽出して循環がないか目視確認
```

## 自動化可能性まとめ

| 分類 | シナリオ |
| --- | --- |
| 自動 | F-1, F-3, F-4 |
| 半自動 | F-2, F-5, F-6 |
| 手動 | （該当なし） |

## 各シナリオ ↔ 検証カテゴリ / Step wire-in

| F# | Phase 4 V | Phase 5 Step |
| --- | --- | --- |
| F-1 | V2 | Step 4 |
| F-2 | （V 該当なし） | Step 0（announce） |
| F-3 | V4 | Step 5 |
| F-4 | V1 | Step 4 |
| F-5 | V6 | Step 3 |
| F-6 | V2 拡張 | Step 2 |

## 実行手順

1. `outputs/phase-06/failure-cases.md` を作成し、6 件のマトリクスと各シナリオ詳細を転記。
2. 各シナリオの evidence 雛形ファイルを `outputs/phase-06/evidence/` に空ファイルで用意。
3. F-1 / F-3 / F-4 を Phase 4 検証スクリプトと結線（CI / pre-PR で自動実行可能であることを記述）。
4. F-2 / F-5 / F-6 の半自動検出について、レビューア向けチェック観点を `outputs/phase-06/review-checklist.md` に整理。
5. AC-1〜AC-11 と F-1〜F-6 の対応表を Phase 7 に引き渡す形式で記録。

## 多角的チェック観点

- 価値性: 6 シナリオが Phase 5 ランブックの全 Step で発生し得る失敗を網羅しているか。
- 実現性: 全シナリオが既存ツール（`wc` / `rg` / `diff` / `git`）のみで検出可能か。
- 整合性: AC-1〜AC-11 と F-1〜F-6 の対応表に空セルが無いか。
- 運用性: 復旧コマンドがコピペで動作するか。
- 不変条件: F-5（意味的書き換え混入検出）が機械的 cut & paste 原則を構造的に守っているか。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは対象外。failure cases は Phase 4 の検証カテゴリ、Phase 9 の QA、Phase 11 の smoke で再確認する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 6 件マトリクス + 各シナリオ詳細 + 復旧手順 |
| ドキュメント | outputs/phase-06/review-checklist.md | F-2 / F-5 / F-6 の半自動レビュー観点 |
| evidence 配置 | outputs/phase-06/evidence/ | 各シナリオの検出ログ受け皿 |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 6 件以上の失敗シナリオが原因 / 検出 / 自動化 / 復旧 / evidence の 5 項目で網羅
- [ ] 全シナリオで Phase 4 V1〜V6 もしくは Phase 5 Step 0〜5 へのマップが付与
- [ ] 自動 / 半自動 / 手動 の 3 段階分類が一意
- [ ] 影響 AC（AC-1〜AC-11）が全シナリオで特定
- [ ] F-1 / F-3 / F-4 の復旧コマンドがコピペ動作可能
- [ ] F-5 が `git diff` ベースで意味的書き換え検出を担保
- [ ] F-6 で references 循環参照の検出と切り戻し方針が明記

## タスク 100% 実行確認【必須】

- 実行タスク 5 件すべてが `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 6 件全てに 5 項目（原因・検出・自動化・復旧・evidence）が記入
- Phase 5 ランブック全 Step で発生し得る失敗が漏れなくマップされている
- AC-1〜AC-11 の影響特定に空欄が無い

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス)
- 引き継ぎ事項:
  - F-1〜F-6 の ID を AC マトリクスの「関連 failure case」列に紐付け
  - F-3 / F-5 を Phase 9 品質保証の必須検証項目に昇格
  - 復旧 runbook を Phase 11 手動 smoke の対象に予約
  - F-2（並列衝突）のレビュー観点を Phase 12 implementation-guide に反映
- ブロック条件:
  - シナリオ 6 件未満で Phase 7 へ進む
  - 復旧手順が記述されないシナリオが残る
  - F-5（意味的書き換え）の検出方法が `git diff` 以外で代替不能のまま放置
