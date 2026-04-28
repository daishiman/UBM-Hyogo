# 自動生成 skill ledger の gitignore 化 - タスク指示書

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | task-skill-ledger-a1-gitignore                             |
| タスク名     | 自動生成 skill ledger の gitignore 化                      |
| 分類         | 改善                                                       |
| 対象機能     | skill ledger / 自動再生成 indexes / rendered view          |
| 優先度       | 高                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施                                                     |
| 発見元       | task-conflict-prevention-skill-state-redesign Phase 12     |
| 発見日       | 2026-04-28                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`.claude/skills/<skill>/indexes/keywords.json` や `index-meta.json` などは hook / index 生成スクリプトによって自動再生成される派生物である。にもかかわらず現状はリポジトリに tracked file として登録されているため、複数 worktree が並列に同 skill を更新すると、同一 JSON の同じ位置（`totalKeywords` などのカウンタ、配列要素の並び）が異なる値で書き換わり、merge conflict を必ず引き起こす。

`task-conflict-prevention-skill-state-redesign` の Phase 5 で、これら派生物は「正本（source of truth）ではなく派生物」と位置付けられ、A-1 施策として `.gitignore` 化と untrack を行う方針が runbook 化された。本タスクはその runbook を実コードに適用する実装タスクである。

### 1.2 問題点・課題

- `indexes/keywords.json` / `indexes/index-meta.json` などが tracked のため、4 worktree 並列開発で必ず conflict が発生する
- 派生物を手動で merge すると、再生成すれば直る差分の解決に時間が浪費される
- `LOGS.rendered.md` のような render script 出力も tracked になっており、ローカル一時生成物がコミット対象に紛れ込みやすい
- post-commit / post-merge hook が「tracked canonical を上書き」する設計になっており、worktree 間で hook 実行順次第で状態が振動する

### 1.3 放置した場合の影響

- 並列開発の merge ごとに skill ledger 系 conflict が発生し続け、レビュー / マージ作業が継続的に阻害される
- 派生物 conflict の手動解決ミスにより、index が不整合な状態でコミットされる
- 4 worktree smoke（Phase 4 C-3 / Phase 11）で再現される衝突がそのまま残り、本タスクの設計目標「自動生成派生物は git 非管理」の前提が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

skill 配下の自動再生成 ledger（`indexes/*.json`、`*.cache.json`、`LOGS.rendered.md` など）を Git 非管理にし、複数 worktree 並列開発時に派生物 merge conflict が発生しない状態を作る。

### 2.2 最終ゴール

- 対象派生物が `.gitignore` で除外されている
- 既に tracked になっていた派生物が `git rm --cached` で追跡解除されている
- post-commit / post-merge hook が「tracked canonical を書かない」「未存在時のみ再生成する」冪等ガードを持つ
- Phase 4 C-3 / Phase 11 の 4 worktree 並列再生成 smoke で派生物由来の conflict が 0 件

### 2.3 スコープ

#### 含むもの

- `.gitignore` への以下 glob 追記
  - `.claude/skills/*/indexes/keywords.json`
  - `.claude/skills/*/indexes/index-meta.json`
  - `.claude/skills/*/indexes/*.cache.json`
  - `.claude/skills/*/LOGS.rendered.md`
- 既 tracked 派生物の `git rm --cached`
- hook ガードの「存在チェック → スキップ or 再生成」冪等化
- Phase 5 runbook §4 の検証コマンド実行と証跡保存

#### 含まないもの

- `LOGS.md` 本体の gitignore 化（A-2 完了後に別タスクで実施）
- fragment 化（A-2 のスコープ）
- SKILL.md 分割（A-3 のスコープ）
- `merge=union` 適用（B-1 のスコープ）
- 新規 hook の実装本体（補助タスク T-6 として subtask 化可能）

### 2.4 成果物

- `.gitignore` の差分
- `git rm --cached` の commit
- hook ガード差分（既存 hook がある場合は修正、無ければ実装は T-6 へ委譲）
- 検証ログ（`git check-ignore -v` 結果、4 worktree smoke の `git ls-files --unmerged` ログ）
- 証跡保存先: `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-11/evidence/<run-id>/a1/`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- **A-2（task-skill-ledger-a2-fragment）が完了している**
- A-2 の render script により fragment 群から `LOGS.md` 相当を再構成できる状態
- 既存 `LOGS.md` が `_legacy.md` へ退避済み

### 3.2 依存タスク

- **A-2: task-skill-ledger-a2-fragment（必須前提）**
- A-2 → A-1 の順序を逆にすると `LOGS.md` を ignore 化した瞬間に履歴が失われる（後述 §9 苦戦箇所参照）

### 3.3 必要な知識

- Git の追跡解除（`git rm --cached`）と `.gitignore` の glob 解釈
- `git check-ignore -v` による gitignore マッチ検証
- post-commit / post-merge hook の冪等性設計
- Phase 5 runbook（`gitignore-runbook.md`）の Step 1〜4

### 3.4 推奨アプローチ

1. Phase 5 runbook の Step 1 patch をそのまま `.gitignore` に適用
2. `git ls-files` で実際に tracked になっている派生物を棚卸ししてから untrack（runbook の例示パスだけでなく実態ベース）
3. hook 側は「既存ファイルあり → 早期 return」のガードのみを最小差分で入れる
4. Phase 4 C-3 の 2 worktree 並列再生成シナリオで smoke を実施し、`outputs/phase-11/evidence/` に証跡保存

---

## 4. 実行手順

### Phase 構成

1. 棚卸し（対象派生物の実体把握）
2. `.gitignore` 追記
3. tracked 派生物の `git rm --cached`
4. hook ガード適用と検証

### Phase 1: 棚卸し

#### 目的

実際にどの派生物が tracked になっているか、また hook がどのパスを書いているかを実態ベースで把握する。

#### 手順

1. `git ls-files .claude/skills | rg "(indexes/.*\\.json|\\.cache\\.json|LOGS\\.rendered\\.md)"` で tracked 派生物を列挙
2. 各 skill の hook / generate script が出力するパスを確認
3. runbook の例示 glob と実態の差分を対象一覧表にまとめる

#### 成果物

対象派生物一覧（パスと現状の追跡状態）

#### 完了条件

- tracked 派生物がすべて把握できている
- runbook 記載 glob とのギャップが識別されている

### Phase 2: `.gitignore` 追記

#### 目的

派生物を git 非管理にする glob を `.gitignore` に追記する。

#### 手順

1. Phase 5 runbook §Step 1 の patch を `.gitignore` に適用

   ```gitignore
   # === skill auto-generated ledger (A-1) ===
   # 派生物は post-commit / post-merge hook で再生成されるため git 非管理
   .claude/skills/*/indexes/keywords.json
   .claude/skills/*/indexes/index-meta.json
   .claude/skills/*/indexes/*.cache.json
   .claude/skills/*/LOGS.rendered.md
   # A-2 移行完了後に有効化（本タスクは A-2 完了が前提なので有効化済みでも可）:
   # .claude/skills/aiworkflow-requirements/LOGS.md
   ```

2. `git check-ignore -v` で各対象パスがマッチすることを確認

#### 成果物

`.gitignore` の diff

#### 完了条件

- 対象 glob すべてが `git check-ignore -v` でマッチする
- `.git/info/exclude` ではなくリポジトリ正本の `.gitignore` に記述されている

### Phase 3: tracked 派生物の untrack

#### 目的

既に履歴に入っている派生物を Git の追跡対象から外す（worktree の実体ファイルは残す）。

#### 手順

1. Phase 1 で列挙したパスを `git rm --cached` で追跡解除

   ```bash
   git rm --cached \
     .claude/skills/aiworkflow-requirements/indexes/keywords.json \
     .claude/skills/aiworkflow-requirements/indexes/index-meta.json
   # 他の skill / .cache.json / LOGS.rendered.md も対象に応じて
   ```

2. `chore(skill): untrack auto-generated ledger files (A-1)` 相当のコミット
3. `git status` で worktree にファイル本体が残っていることを確認

#### 成果物

untrack コミット差分

#### 完了条件

- `git ls-files` から対象派生物が消えている
- worktree 上の実ファイルは残っている
- 履歴は維持されている

### Phase 4: hook ガード適用と検証

#### 目的

hook が tracked canonical を上書きしないこと、未存在時のみ再生成することを保証し、4 worktree 並列再生成で conflict 0 件を確認する。

#### 手順

1. 既存 post-commit / post-merge hook に「`[[ -f <target> ]] && exit 0`」相当の冪等ガードを追加（hook 本体実装が無ければ補助タスク T-6 へ委譲）
2. 単一 worktree で再生成 → `git status --porcelain` が空であることを確認
3. Phase 4 C-3 の 2 worktree 並列再生成 → merge シナリオを実行

   ```bash
   git checkout main
   for n in 1 2; do bash scripts/new-worktree.sh verify/a1-$n; done
   ( cd .worktrees/verify-a1-1 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
   ( cd .worktrees/verify-a1-2 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
   git merge --no-ff verify/a1-1
   git merge --no-ff verify/a1-2
   git ls-files --unmerged | wc -l   # => 0
   ```

4. 証跡を `outputs/phase-11/evidence/<run-id>/a1/` に保存

#### 成果物

hook ガード差分、smoke 検証ログ、証跡

#### 完了条件

- 単一 worktree 再生成で `git status` が clean
- 4 worktree smoke で派生物由来の unmerged が 0 件

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `.gitignore` に runbook §Step 1 の glob が追加されている
- [ ] tracked 派生物が `git ls-files` から消えている（worktree 実体は残存）
- [ ] hook ガードが「存在 → スキップ」「未存在 → 再生成」で冪等
- [ ] 4 worktree smoke で派生物 conflict 0 件

### 品質要件

- [ ] `git check-ignore -v` が対象すべてにマッチ
- [ ] 単一 worktree 再生成後 `git status --porcelain` が空
- [ ] hook の複数回実行で worktree が変化しない（冪等）

### ドキュメント要件

- [ ] `outputs/phase-11/evidence/<run-id>/a1/` に検証証跡を保存
- [ ] 本タスク仕様書の §9 苦戦箇所に実施時の発見を追記
- [ ] PR 説明に `outputs/phase-12/implementation-guide.md` のテンプレートを使用

---

## 6. 検証方法

### テストケース

| ケース | 期待結果 |
| --- | --- |
| `.gitignore` 追記後の `git check-ignore -v <target>` | 各対象 glob にマッチ |
| 単一 worktree で `generate-index.js` 実行 | `git status --porcelain` が空 |
| 2 worktree 並列再生成 → merge | `git ls-files --unmerged` が 0 |
| hook を複数回実行 | tree が変化しない（冪等） |
| `LOGS.md` への影響 | A-2 完了済みのため履歴喪失なし |

### 検証コマンド

```bash
# (a) gitignore マッチ確認
git check-ignore -v .claude/skills/aiworkflow-requirements/indexes/keywords.json
git check-ignore -v .claude/skills/aiworkflow-requirements/indexes/index-meta.json

# (b) tracked 解除確認
git ls-files .claude/skills/aiworkflow-requirements/indexes

# (c) 単一 worktree 再生成
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
git status --porcelain

# (d) 4 worktree smoke（Phase 4 C-3）
git checkout main
for n in 1 2; do bash scripts/new-worktree.sh verify/a1-$n; done
( cd .worktrees/verify-a1-1 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
( cd .worktrees/verify-a1-2 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
git merge --no-ff verify/a1-1
git merge --no-ff verify/a1-2
echo $?
git ls-files --unmerged | wc -l
```

---

## 7. リスクと対策

| リスク                                                                     | 影響度 | 発生確率 | 対策                                                                                       |
| -------------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| A-2 未完了で `LOGS.md` を ignore 化し履歴を喪失                            | 高     | 中       | 本タスク前提条件で A-2 完了を必須化、本仕様書 §9 苦戦箇所に依存順序を明記                  |
| `.git/info/exclude` に書いてしまい全 worktree で共有されない               | 中     | 低       | runbook §注意事項通りリポジトリ正本 `.gitignore` のみを編集する                            |
| hook が tracked canonical を書き続けており untrack 後に再追加してしまう    | 高     | 中       | Phase 4 で hook ガードを必須化、`git status` 空であることを完了条件にする                  |
| runbook 例示 glob と実態のズレで対象漏れ                                   | 中     | 中       | Phase 1 棚卸しで `git ls-files` ベースの実態確認を完了条件化                               |
| 4 worktree smoke で hook 実装本体不在により再生成自体が失敗                | 中     | 低       | 補助タスク T-6（hook 実装）の前後関係を確認し、必要なら T-6 を先行 / subtask 化            |
| ロールバック時に派生物を再追跡できない                                     | 低     | 低       | runbook §ロールバック手順（`git add -f`）に従い `revert(skill): re-track A-1 ledger files` で復元 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-5/main.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/file-layout.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/unassigned-task/task-skill-ledger-a2-fragment.md`（前提タスク）

### 参考資料

- 4 施策実装順序: A-2 → A-1 → A-3 → B-1（`implementation-guide.md` §実装順序）
- aiworkflow-requirements 関連: 複数 worktree 並列開発における skill ledger 設計、`references/` Progressive Disclosure 規約
- Phase 4 C-3 並列再生成シナリオ: `outputs/phase-4/parallel-commit-sim.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

> A-1 を A-2 より先に着手すると壊れる依存関係が runbook で明示されているため、本タスク実施者は必ず確認すること。

| 項目     | 内容                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | A-2（fragment 化）より先に A-1 を実施し、`.claude/skills/<skill>/LOGS.md` を `.gitignore` に追加した瞬間、それまで append-only で蓄積されてきた `LOGS.md` の履歴が「git 管理対象外」に転落し、worktree 削除や別 PR の checkout で履歴が事実上失われる |
| 原因     | `LOGS.md` は本来「正本（source of truth）」だが、A-2 完了前は履歴を保持する場所が `LOGS.md` 1 ファイルのみで、fragment への退避先（`LOGS/_legacy.md` および `LOGS/<timestamp>-<branch>-<nonce>.md`）がまだ作られていない。この状態で ignore 化すると、Git は履歴を追跡できず、worktree 上のファイルしか残らないため事故的に消える |
| 対応     | Phase 5 runbook（`gitignore-runbook.md`）§適用範囲で「`LOGS.md` は **A-2 完了まで** gitignore に入れない」と明記。`outputs/phase-12/implementation-guide.md` §実装順序でも 1) A-2 → 2) A-1 → 3) A-3 → 4) B-1 を厳守と規定。本タスクの §3.1 / §3.2 で A-2 完了を必須前提条件に位置付け、§7 リスク表でも最上位リスクとして明示する |
| 再発防止 | 本仕様書を参照する実装担当者が、Phase 5 runbook と `implementation-guide.md` の実装順序を必ず読むよう、§3.4 推奨アプローチ・§7 リスク表・§9 苦戦箇所の 3 箇所で重複明記する。さらに、A-1 実装 PR のレビュアは「`LOGS.md` を gitignore に入れていないこと」「A-2 PR が先行マージ済みであること」をレビューチェック項目とする |

### レビュー指摘の原文（該当する場合）

```
task-conflict-prevention-skill-state-redesign Phase 12 unassigned-task-detection.md にて
T-1 (task-skill-ledger-a1-gitignore) を派生実装タスク候補として識別。
推奨起票順は T-2 (A-2) → T-1 (A-1) → T-3 (A-3) → T-4 (B-1)。
```

### 補足事項

- 本タスクは `task-conflict-prevention-skill-state-redesign` の Phase 5 runbook を実コードに適用する独立 PR として進める（1 PR = 1 施策の原則）。
- ロールバックは runbook §ロールバック手順に従い、`.gitignore` の該当行 revert と `git add -f` での再追跡で 1 コミット粒度の戻しが可能。
- 補助タスク T-6（task-skill-ledger-hooks）が未着手の場合、Phase 4 hook ガードは「最小限の存在チェックガード」のみに留め、本格実装は T-6 へ委譲する。
- 並列開発中の他 worktree が同 skill ledger を触らないよう、本タスク開始時に announce すること（implementation-guide.md §前提条件）。

### 苦戦箇所（ドッグフーディング設計時の追加記録）

> `outputs/phase-12/skill-feedback-report.md` F-4 / `outputs/phase-12/implementation-guide.md` §実装順序で発見した A-1 関連の追加苦戦箇所。

| 項目     | 内容                                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `task-specification-creator` skill 自身の `indexes/keywords.json` / `index-meta.json` が tracked のまま運用されており、skill 改修 PR で必ず派生物 conflict が発生していた                              |
| 原因     | 派生物（hook / index 生成スクリプト出力）と正本の境界が runbook 化されておらず、過去の skill 改修 PR で派生物がそのまま add されてきた歴史的経緯                                                       |
| 対応     | A-1 のスコープを「実プロジェクト依存リポジトリ全 skill の `indexes/*.json` / `*.cache.json` / `LOGS.rendered.md`」に拡張し、skill 自身も含めて gitignore 化する（feedback F-4）。対象 glob は本仕様書 §3 の通り |
| 再発防止 | skill 改修ガイド（`task-specification-creator/SKILL.md` または references）に「派生物は tracked にしない」「hook が tracked canonical を書かない」を Anchor として明記し、新規 skill 作成テンプレへ反映 |

### スコープ（ドッグフーディング由来の追記）

#### 含む（追加）

- 全 `.claude/skills/*/indexes/*.json` を A-1 対象に統一（特定 skill のみに限定しない）
- skill 自身の派生物（hook 出力 / render 出力）も棚卸し対象に含める

#### 含まない（追加）

- skill 改修ガイドへの Anchor 追記そのもの（A-3 Progressive Disclosure 化タスクで実施）

### リスクと対策（ドッグフーディング由来の追記）

| リスク                                                                                | 影響度 | 発生確率 | 対策                                                                                                                  |
| ------------------------------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------- |
| skill 自身の派生物追跡解除を見落とし、特定 skill の `indexes/*.json` だけ tracked が残る | 中     | 中       | Phase 1 棚卸しで `git ls-files .claude/skills` を全 skill 横断で実行し、対象一覧を skill 単位でレビュー必須化           |
| skill 改修者がガイド未整備のため再び派生物を tracked に戻す                            | 中     | 中       | A-3 で skill 改修ガイドへ「派生物は tracked にしない」Anchor を追加するまでの暫定として、PR テンプレに確認項目を追加 |

### 検証方法（ドッグフーディング由来の追記）

```bash
# skill 横断で派生物が全て untrack されているか
git ls-files .claude/skills | rg "(indexes/.*\\.json|\\.cache\\.json|LOGS\\.rendered\\.md)"
# => 0 件であること
```

