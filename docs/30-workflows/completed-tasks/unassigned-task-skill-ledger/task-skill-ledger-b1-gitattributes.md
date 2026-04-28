# append-only skill ledger への merge=union 適用 - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | task-skill-ledger-b1-gitattributes                                  |
| タスク名     | append-only skill ledger への `merge=union` 適用（B-1）             |
| 分類         | 改善                                                                |
| 対象機能     | Git merge driver / `.gitattributes` による衝突回避                  |
| 優先度       | 低                                                                  |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | task-conflict-prevention-skill-state-redesign Phase 12              |
| 発見日       | 2026-04-28                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-conflict-prevention-skill-state-redesign` で、skill 配下 ledger の並列 worktree 衝突を解消する 4 施策（A-1〜B-1）を確定した。A-2 fragment 化（1 worktree = 1 fragment ファイル）が本筋だが、

- A-2 で fragment 化できないファイル（外部仕様による行独立 Markdown など）
- A-2 移行猶予中の `_legacy.md` 系ファイル

が一定期間残る。これらは append-only であっても通常の merge では同一末尾行をめぐり衝突するため、Git ビルトインの `merge=union` ドライバを `.gitattributes` で適用し、両 worktree の追記を機械的に保存する保険が必要となる。

### 1.2 問題点・課題

- `_legacy.md` や外部制約により fragment 化が困難な ledger は、A-1〜A-3 完了後も衝突源として残る
- `merge=union` を闇雲に広げると JSON / YAML / `SKILL.md` などの構造体が静かに壊れる（行独立でないため）
- 暫定策として導入した attribute を A-2 移行完了後に解除しないと、fragment 化済みファイルに対しても driver が残り技術負債化する

### 1.3 放置した場合の影響

- `_legacy.md` への両側追記で merge コンフリクトが発生し、並列開発が止まる
- A-2 で吸収しきれない append-only ledger に対し、衝突解消の最終手段が存在しないままとなる
- 行独立性チェックの自動化が無いまま広範に適用される事故が起こると、JSON / YAML 破損が静かに混入する

---

## 2. 何を達成するか（What）

### 2.1 目的

A-1〜A-3 完了後に残る「fragment 化できない / 移行猶予中の append-only ledger」に限定して `merge=union` ドライバを `.gitattributes` で適用し、並列 worktree の追記行衝突を 0 件化する。

### 2.2 最終ゴール

- リポジトリルート `.gitattributes` に B-1 セクションが追加されている
- 適用対象は **行独立な append-only Markdown のみ**（移行猶予中の `_legacy.md` 含む）
- JSON / YAML / `SKILL.md` / lockfile / コードファイルへ誤適用されていない
- 2 worktree からの並列追記で両エントリが保存され、`git ls-files --unmerged` が 0 行
- A-2 fragment 化完了時に該当行を解除する手順が明文化されている

### 2.3 スコープ

#### 含むもの

- `.gitattributes` への B-1 セクション追記
- 適用対象 path の列挙と「行独立性」レビュー
- `git check-attr merge` による適用結果の確認
- 2 worktree smoke 検証
- 解除手順の明文化（A-2 完了後の負債化防止）

#### 含まないもの

- A-1（`indexes/*` の `.gitignore` 化）
- A-2（fragment 化と render script）
- A-3（SKILL.md の Progressive Disclosure 分割）
- root `CHANGELOG.md` への適用（skill ledger 範疇外）
- `merge=union` 以外の merge driver 導入

### 2.4 成果物

- 更新後の `.gitattributes`（B-1 セクション追加差分）
- 適用対象 path 一覧と行独立性レビューメモ
- `git check-attr merge` 実行ログ（適用 / 不適用の切り分け）
- 2 worktree 並列追記 smoke の証跡

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-1（gitignore 化）が main にマージ済
- A-2（fragment 化と `_legacy.md` 退避）が main にマージ済
- A-3（SKILL.md 分割）が main にマージ済
- 並列 worktree が対象 ledger を同時に触らないことを announce 済

### 3.2 依存タスク

- A-1: `task-skill-ledger-a1-gitignore`
- A-2: `task-skill-ledger-a2-fragment`
- A-3: `task-skill-ledger-a3-progressive-disclosure`

B-1 は **A-1〜A-3 完了後の最後の保険** として実施する。先行実施すると fragment 化済みファイルにまで driver が残り、解除コストが増える。

### 3.3 必要な知識

- Git `.gitattributes` と `merge=union` ドライバの挙動（行独立な append のみ機械マージ）
- `git check-attr` による attribute 適用確認
- `_legacy.md` と fragment ディレクトリの構造（A-2 成果）
- Phase 2 `gitattributes-pattern.md` の適用 / 除外マトリクス

### 3.4 推奨アプローチ

Phase 2 で確定した「行独立 Markdown のみ対象」マトリクスをそのまま実装に落とす。pattern は **広く書きすぎず**、`.claude/skills/**/LOGS/_legacy.md` のように移行猶予対象を明示する。`git check-attr merge` で JSON / YAML が `unspecified` であることを必ず確認する。

---

## 4. 実行手順

### Phase構成

1. 対象 path 列挙
2. pattern 設計
3. `.gitattributes` 適用
4. smoke 検証

### Phase 1: 対象 path 列挙

#### 目的

A-1〜A-3 完了後に残存する append-only ledger を抽出し、`merge=union` 適用候補を確定する。

#### 手順

1. `git ls-files '.claude/skills/**/_legacy.md' '.claude/skills/**/LOGS/_legacy.md'` で移行猶予対象を列挙
2. A-2 で fragment 化できなかった行独立 Markdown（外部仕様制約等）を棚卸し
3. 各候補の冒頭を確認し、front matter（`^---$`）/ コードフェンス（` ``` `）/ JSON-YAML 構造体を含むものを除外
4. 結果を「対象 / 除外」の 2 リストに分類

#### 成果物

- 適用候補一覧（path + 行独立性判定根拠）
- 除外候補一覧（除外理由つき）

#### 完了条件

- A-2 完了後も残る ledger が path レベルで把握できている
- 除外対象に JSON / YAML / `SKILL.md` / lockfile が含まれていない（含むなら必ず除外側）

### Phase 2: pattern 設計

#### 目的

`.gitattributes` に書き込む glob pattern を最小限に絞り込み、誤適用を防ぐ。

#### 手順

1. Phase 1 の対象一覧から共通 path 構造を抽出（例: `**/LOGS/_legacy.md`）
2. Phase 2 設計書 `outputs/phase-2/gitattributes-pattern.md` の許可マトリクスと突き合わせ
3. pattern 例: `.claude/skills/**/LOGS/_legacy.md merge=union`
4. 必要であれば個別 path 指定にして範囲を絞る（glob で構造体を巻き込まないこと）
5. コメントで「A-2 fragment 化完了時に削除」「JSON / YAML 適用禁止」を明記

#### 成果物

- pattern 案（diff 形式）と適用 / 除外マッピング表

#### 完了条件

- pattern が Phase 2 許可マトリクスを逸脱していない
- 除外対象を巻き込まないことを `git check-attr` のドライランで確認できる構造になっている

### Phase 3: `.gitattributes` 適用

#### 目的

設計した pattern を `.gitattributes` に追記し、リポジトリ全体に attribute を反映する。

#### 手順

1. リポジトリルート `.gitattributes` に B-1 セクションを追記（コメント + pattern）
2. `git add .gitattributes && git commit -m "chore(skill-ledger): apply merge=union for legacy ledger (B-1)"`
3. `git check-attr merge -- <対象 path>` で `merge: union` が出力されることを確認
4. `git check-attr merge -- <除外 path>`（例: `indexes/keywords.json`）で `merge: unspecified` を確認

#### 成果物

- `.gitattributes` 差分
- `git check-attr` 出力ログ（対象 / 除外の両方）

#### 完了条件

- 対象 path が `merge: union`、除外 path が `merge: unspecified`
- JSON / YAML / `SKILL.md` / lockfile が一切 `union` になっていない

### Phase 4: smoke 検証

#### 目的

2 worktree 並列追記シナリオで、両エントリ保存と衝突 0 件を実証する。

#### 手順

1. `bash scripts/new-worktree.sh verify/b1-1` と `verify/b1-2` を作成
2. 各 worktree から同一 `_legacy.md` 末尾に 1 行ずつ追記してコミット
3. main で `git merge --no-ff verify/b1-1 && git merge --no-ff verify/b1-2`
4. `echo $?` が 0、`git ls-files --unmerged` が 0 行を確認
5. `grep` で両 worktree の追記行が結果ファイルに残っていることを確認
6. 証跡を `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-11/evidence/<run-id>/` に保存

#### 成果物

- smoke 実行ログ
- 結果 `_legacy.md` の `grep` 出力

#### 完了条件

- merge 終了コード 0
- `git ls-files --unmerged` 0 行
- 両 worktree の追記行が両方残っている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `.gitattributes` に B-1 セクション（`merge=union` pattern）が追加されている
- [ ] 対象は行独立な append-only Markdown のみ（`_legacy.md` 含む）
- [ ] JSON / YAML / `SKILL.md` / lockfile / コードファイルへ適用されていない
- [ ] 2 worktree smoke で両追記行が保存され、衝突 0 件
- [ ] A-2 fragment 化完了後の解除手順が `.gitattributes` コメントまたは runbook に明記

### 品質要件

- [ ] `git check-attr merge` の対象 / 除外切り分けが期待通り
- [ ] `mise exec -- pnpm typecheck` 成功（コード変更なしのはずだが確認）
- [ ] `mise exec -- pnpm lint` 成功

### ドキュメント要件

- [ ] Phase 2 `gitattributes-pattern.md` との整合確認メモ
- [ ] 解除条件（A-2 完了判定基準）を `.gitattributes` 内コメントに記録

---

## 6. 検証方法

### テストケース

- 2 worktree から同一 `_legacy.md` 末尾追記で衝突 0 件、両エントリ保存
- 除外対象（`indexes/keywords.json` 等）が `merge: unspecified` のまま
- `_legacy.md` 以外の fragment（`LOGS/<timestamp>-*.md`）には driver が当たらない

### 検証手順

```bash
# 適用結果確認
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# => merge: union
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
# => merge: unspecified

# 並列追記 smoke
git checkout main
bash scripts/new-worktree.sh verify/b1-1
bash scripts/new-worktree.sh verify/b1-2

( cd .worktrees/verify-b1-1 && \
  printf -- '- entry from wt1\n' >> .claude/skills/aiworkflow-requirements/LOGS/_legacy.md && \
  git commit -am "log: wt1" )
( cd .worktrees/verify-b1-2 && \
  printf -- '- entry from wt2\n' >> .claude/skills/aiworkflow-requirements/LOGS/_legacy.md && \
  git commit -am "log: wt2" )

git merge --no-ff verify/b1-1
git merge --no-ff verify/b1-2
echo $?                      # => 0
git ls-files --unmerged      # => 0 行
grep 'entry from wt1' .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
grep 'entry from wt2' .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
```

---

## 7. リスクと対策

| リスク                                                           | 影響度 | 発生確率 | 対策                                                                                       |
| ---------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| JSON / YAML へ glob で誤適用し構造体が静かに壊れる               | 高     | 中       | pattern を `**/_legacy.md` 等の Markdown 限定に絞り、`git check-attr` で除外側を必ず確認   |
| `merge=union` が両側追記をそのまま並べ、front matter が重複する  | 中     | 中       | 適用対象から front matter を持つ Markdown を Phase 1 で除外する判定スクリプトを使う        |
| 行順序が保証されず、時系列性を要求する用途で意味が壊れる         | 中     | 低       | 時系列が重要な ledger は A-2 fragment 化（ファイル名 timestamp）に倒し、本対象から除外     |
| A-2 fragment 化完了後に attribute が残り技術負債化               | 中     | 中       | `.gitattributes` コメントで解除条件と判定基準を明記し、A-2 完了レビュー時に削除を必須化    |
| A-1〜A-3 未完で B-1 を先行適用し、本来 fragment 化すべき範囲に拡大| 中     | 低       | 依存タスク完了を着手前提条件に明示。B-1 PR レビュー時に依存マージ済を確認                  |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/main.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/gitattributes-runbook.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/gitattributes-pattern.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/unassigned-task/task-skill-ledger-a1-gitignore.md`
- `docs/30-workflows/unassigned-task/task-skill-ledger-a2-fragment.md`
- `docs/30-workflows/unassigned-task/task-skill-ledger-a3-progressive-disclosure.md`

### 参考資料

- Git Documentation: `gitattributes(5)` `merge` attribute / `union` driver
- 本タスク AC-4（merge=union が「行レベル独立」のみに限定されること）

---

## 9. 備考

### 苦戦箇所【記入必須】

> Phase 12 検出時点で予見される困難点を記録する。実装後に追記する。

| 項目     | 内容                                                                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `merge=union` は両 worktree の追記行をそのまま並べるため、front matter を持つ Markdown に誤適用すると `---` が重複したり順序が逆転して意味が壊れる。また JSON / YAML へ誤適用すると構造体が静かに破損する（人手で気付きにくい）。 |
| 原因     | `merge=union` ドライバは行単位の機械マージしか行わず、構造体の整合性を見ない。さらに glob pattern `**/*.md` のように広く書くと front matter 付き fragment まで巻き込み、A-2 設計と矛盾する。                                  |
| 対応     | pattern を `**/_legacy.md` のように移行猶予対象に限定し、Phase 1 で front matter / コードフェンス / 構造体の有無を判定して除外。Phase 3 で `git check-attr merge` を対象 / 除外双方に対して実行し、`unspecified` を確認する。   |
| 再発防止 | A-2 fragment 化完了後に該当 `.gitattributes` 行を削除する解除条件をコメントに明記し、A-2 完了レビューのチェックリストに「B-1 attribute 残存確認」を追加。適用禁止対象（JSON / YAML / `SKILL.md` / lockfile）を runbook で明示。  |

### レビュー指摘の原文（該当する場合）

```
task-conflict-prevention-skill-state-redesign Phase 12 implementation-guide.md にて、
A-1〜A-3 完了後の保険として B-1 `.gitattributes` 適用を最後に実施する旨を識別。
fragment 化できない / 移行猶予中の append-only ledger に対する merge=union 適用が
未タスクとして検出された。
```

### 補足事項

- B-1 は **A-1〜A-3 が完了するまで着手しない**。先行実施すると fragment 化対象にまで driver が残り、A-2 設計と二重管理になる。
- `merge=union` は行順を保証しないため、時系列性が必要な ledger は A-2 fragment 化（ファイル名 timestamp）で対応し、本タスク対象から除外する。
- ロールバックは `.gitattributes` 該当行の `git revert` のみで完了し、既存ファイルへの副作用はない（attribute は merge 時のみ作用）。
- 適用後に対象ファイルのフォーマットを「行をまたぐ構造」に変更してはいけない。変更が必要になった時点で B-1 対象から外し、A-2 fragment 化に切り替える。

### 苦戦箇所（ドッグフーディング設計時の追加記録）

> `outputs/phase-12/skill-feedback-report.md` 全般 / `outputs/phase-12/implementation-guide.md` §実装順序で発見した B-1 関連の追加苦戦箇所。

| 項目     | 内容                                                                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | A-2 fragment 化を skill 自身（`task-specification-creator/SKILL-changelog.md` / `aiworkflow-requirements/LOGS.md`）にも適用した結果、`_legacy.md` が skill 自身にも生まれ、B-1 適用対象の path 列挙が当初想定より広がる             |
| 原因     | skill-feedback-report F-2 / F-3 を A-2 のスコープに取り込んだことで `_legacy.md` の数が増加し、Phase 1 棚卸しを skill 自身も含めて行う必要が生じた                                                                                  |
| 対応     | Phase 1 棚卸しを `git ls-files '.claude/skills/**/_legacy.md' '.claude/skills/**/changelog/_legacy.md' '.claude/skills/**/lessons-learned/_legacy*.md'` のように skill 自身も含めて全件抽出する。pattern は `**/_legacy.md` 系で統一 |
| 再発防止 | `_legacy.md` 命名規約を A-2 で固定（`changelog/_legacy.md` / `LOGS/_legacy.md`）し、B-1 適用対象が機械的に決まるようにする。新規 skill 作成時の `_legacy.md` 命名規約違反を CI で検出（A-2 完了後の補助タスク）                          |

### スコープ（ドッグフーディング由来の追記）

#### 含む（追加）

- skill 自身（`task-specification-creator` / `aiworkflow-requirements`）の `_legacy.md` への `merge=union` 適用
- `git check-attr merge` の skill 自身 `_legacy.md` を対象に含めた検証

#### 含まない（追加）

- `_legacy.md` 命名規約違反の CI 検出スクリプト実装（A-2 完了後の補助タスク）
- skill 自身の SKILL.md / changelog / LOGS への現役 fragment への driver 適用（fragment は元々衝突しないため対象外）

### リスクと対策（ドッグフーディング由来の追記）

| リスク                                                                                                       | 影響度 | 発生確率 | 対策                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------ | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| skill 自身の `_legacy.md` が `**/_legacy.md` glob から漏れる命名違反を起こすと B-1 効果が部分的に失われる    | 中     | 中       | A-2 で `_legacy.md` 命名規約を固定し、B-1 Phase 1 棚卸しで skill 自身を必ず確認。pattern は `**/_legacy.md` 系の単一 glob で統一 |
| skill 自身の現役 fragment（`LOGS/<timestamp>-*.md` / `changelog/<timestamp>-*.md`）に誤って driver が適用される | 高     | 低       | pattern を `**/_legacy.md` のみに限定し、`**/*.md` のような broad な glob を禁止。`git check-attr merge` で fragment 側 `unspecified` を必須確認 |

### 検証方法（ドッグフーディング由来の追記）

```bash
# skill 自身の _legacy.md にも merge=union が当たること
git check-attr merge -- .claude/skills/task-specification-creator/changelog/_legacy.md
# => merge: union
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# => merge: union

# skill 自身の現役 fragment には適用されていないこと
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/20260101-000000-main-deadbeef.md
# => merge: unspecified
```

