# aiworkflow-requirements skill references への worktree 隔離方針追記 - タスク指示書

## メタ情報

```yaml
issue_number: 135
```


## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | ut-worktree-003-aiworkflow-references-update                         |
| タスク名     | aiworkflow-requirements skill references への worktree 隔離方針追記  |
| 分類         | ドキュメント                                                         |
| 対象機能     | `.claude/skills/aiworkflow-requirements/` の references / indexes 群 |
| 優先度       | 中                                                                   |
| 見積もり規模 | 小規模                                                               |
| ステータス   | 未実施                                                               |
| 発見元       | task-worktree-environment-isolation system-spec-update-summary.md    |
| 発見日       | 2026-04-28                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-worktree-environment-isolation` の Phase 12 で、worktree 隔離・tmux session-scoped env・gwt-auto lock・skill symlink 撤去の 4 つの正本仕様が確定した。これに伴い `.claude/skills/aiworkflow-requirements/references/` 配下の関連ファイルおよび `indexes/` 配下のキーワード・topic-map を更新する必要があるが、skill references の更新は専用の `update_references` フローを通す必要があり、本体タスクの単発 PR には含められなかった。

### 1.2 問題点・課題

- `keywords.json` に worktree 隔離系の新キーワードが未追加で、Progressive Disclosure による検索起点が不足している
- `topic-map.md` に `developer-environment / worktree-isolation` などの新 topic が反映されておらず、参照誘導が成立しない
- `lessons-learned-health-policy-worktree-2026-04.md` 末尾に追記すべき 3 教訓（skill symlink 撤去・tmux global env リーク・gwt-auto lock）が未反映で、再発防止知見が skill から取り出せない

### 1.3 放置した場合の影響

- AI エージェントが worktree 隔離方針を skill から発見できず、誤った手順（symlink 経由 / 共有環境変数のリーク等）が再発する
- task-worktree-environment-isolation で確定した不変条件が skill 側で参照されず、後続タスク（UT-A / UT-B）との整合性チェックが弱体化する
- lessons-learned が分散し、教訓ベースの検索が機能しない

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-worktree-environment-isolation` の `system-spec-update-summary.md` §1〜§3 の追記指示をそのまま `.claude/skills/aiworkflow-requirements/` の references / indexes に反映し、worktree 隔離方針が skill 検索フローから到達可能な状態にする。

### 2.2 最終ゴール

- `indexes/keywords.json` に新キーワード 5 件が追加されている
- `indexes/topic-map.md` に新 topic 3 件と参照誘導が追加されている
- `indexes/quick-reference.md`（存在すれば）にワークツリー作成・運用の参照リンク 3 件が追加されている
- `references/lessons-learned-health-policy-worktree-2026-04.md` 末尾に 3 教訓が追記されている

### 2.3 スコープ

#### 含むもの

- `indexes/keywords.json` への新キーワード追加
- `indexes/topic-map.md` への新 topic 追加
- `indexes/quick-reference.md` 追記（存在する場合のみ）
- `references/lessons-learned-health-policy-worktree-2026-04.md` 末尾への 3 教訓追記
- `system-spec-update-summary.md` §1〜§3 の追記指示そのままの反映

#### 含まないもの

- `references/development-guidelines-core.md` / `development-guidelines-details.md` / `task-workflow-active.md` / `task-workflow-backlog.md` の追記（system-spec-update-summary.md §1 で「追記済み」と記録されているため対象外）
- skill SKILL.md 本体の改修
- 新規 reference ファイルの追加
- worktree 関連スクリプト（`scripts/new-worktree.sh` 等）の改修（UT-B の責務）

### 2.4 成果物

- `indexes/keywords.json` の差分
- `indexes/topic-map.md` の差分
- `indexes/quick-reference.md` の差分（該当時のみ）
- `references/lessons-learned-health-policy-worktree-2026-04.md` の差分
- 反映確認ログ（`rg` による新キーワード / topic ヒット確認）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-worktree-environment-isolation` Phase 12 までの成果物が `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/` に存在する
- aiworkflow-requirements skill の `update_references` フローが利用可能である
- skill references への追記は **拡張のみ・既存記述の改変なし** を維持する

### 3.2 依存タスク

- `task-worktree-environment-isolation`（Phase 12 までの成果が確定済みであること）

### 3.3 必要な知識

- aiworkflow-requirements skill の Progressive Disclosure 構造（`indexes/` → `references/`）
- `keywords.json` / `topic-map.md` / `quick-reference.md` のスキーマ
- lessons-learned ファイルの記法

### 3.4 推奨アプローチ

`system-spec-update-summary.md` §2.1 / §2.2 / §2.3 をチェックリスト化し、1 項目ずつ追記する。追記後は `rg` で新キーワード・新 topic がヒットすることを確認し、Progressive Disclosure の到達性を保証する。

---

## 4. 実行手順

### Phase構成

1. 追記指示の棚卸し
2. indexes 更新
3. lessons-learned 追記
4. 到達性検証

### Phase 1: 追記指示の棚卸し

#### 目的

`system-spec-update-summary.md` §1〜§3 の追記指示を全件抽出する。

#### 手順

1. `system-spec-update-summary.md` §2.1 / §2.2 / §2.3 / §3 を読み、追記対象を一覧化
2. `indexes/quick-reference.md` の存在を確認（無ければ §2.3 はスキップ）
3. 既存 `keywords.json` / `topic-map.md` の該当箇所を確認し、衝突がないことを確認

#### 成果物

追記項目チェックリスト

#### 完了条件

追記対象の 5 キーワード / 3 topic / 3 教訓が一覧化されている

### Phase 2: indexes 更新

#### 目的

`keywords.json` / `topic-map.md` / `quick-reference.md` に追記する。

#### 手順

1. `indexes/keywords.json` に `worktree-isolation` / `tmux-session-scoped-env` / `gwt-auto-lock` / `skill-symlink-removal` / `mise-shell-state-reset` を追加
2. `indexes/topic-map.md` に `developer-environment / worktree-isolation`、`developer-environment / tmux-session-state`、`developer-environment / lock-strategy` を追加し、`system-spec-update-summary.md` §2.2 の表どおりの参照誘導を記述
3. `indexes/quick-reference.md` が存在する場合のみ、「ワークツリー作成・運用」項に implementation-guide Part 2 §2.3 / design.md §3 / design.md §6 の 3 リンクを追加

#### 成果物

indexes 配下の差分

#### 完了条件

`system-spec-update-summary.md` §2 の追記指示と差分が 1:1 で一致する

### Phase 3: lessons-learned 追記

#### 目的

`references/lessons-learned-health-policy-worktree-2026-04.md` 末尾に 3 教訓を追記する。

#### 手順

1. ファイル末尾に「task-worktree-environment-isolation 教訓」節を追加
2. 教訓 1: skill symlink 撤去（理由 / 検出方法 / 再発防止）
3. 教訓 2: tmux global env リーク（理由 / 検出方法 / 再発防止）
4. 教訓 3: gwt-auto lock（理由 / 検出方法 / 再発防止）

#### 成果物

lessons-learned ファイルの差分

#### 完了条件

`system-spec-update-summary.md` §1 の指示どおり 3 教訓が末尾に追記されている

### Phase 4: 到達性検証

#### 目的

Progressive Disclosure による検索が成立することを保証する。

#### 手順

1. `rg "worktree-isolation" .claude/skills/aiworkflow-requirements/indexes/` でキーワードヒットを確認
2. `rg "tmux-session-state" .claude/skills/aiworkflow-requirements/indexes/topic-map.md` で topic ヒットを確認
3. lessons-learned に新教訓が末尾追加されたことを `tail` または diff で確認
4. 既存記述の改変が無いことを `git diff --stat` で確認

#### 成果物

検証ログ

#### 完了条件

新キーワード / 新 topic / 新教訓が `rg` で確認可能、既存記述に変更が無い

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `indexes/keywords.json` に新キーワード 5 件が追加されている
- [ ] `indexes/topic-map.md` に新 topic 3 件と参照誘導が追加されている
- [ ] `indexes/quick-reference.md` が存在する場合、3 リンクが追加されている
- [ ] `references/lessons-learned-health-policy-worktree-2026-04.md` 末尾に 3 教訓が追記されている

### 品質要件

- [ ] 既存記述の改変が無い（拡張のみ）
- [ ] `keywords.json` が JSON として valid（`jq . keywords.json` 成功）
- [ ] Progressive Disclosure 上、トップレベルから 2 ホップ以内に新項目に到達可能

### ドキュメント要件

- [ ] `system-spec-update-summary.md` §1〜§3 の追記指示と差分が 1:1 で一致する
- [ ] 反映確認ログが残っている

---

## 6. 検証方法

### テストケース

- 新キーワード 5 件すべてが `keywords.json` 内で grep ヒットする
- 新 topic 3 件すべてが `topic-map.md` 内で grep ヒットする
- lessons-learned に追記された 3 教訓が末尾に存在する

### 検証手順

```bash
rg -n "worktree-isolation|tmux-session-scoped-env|gwt-auto-lock|skill-symlink-removal|mise-shell-state-reset" \
  .claude/skills/aiworkflow-requirements/indexes/keywords.json
rg -n "developer-environment / worktree-isolation|tmux-session-state|lock-strategy" \
  .claude/skills/aiworkflow-requirements/indexes/topic-map.md
tail -n 60 .claude/skills/aiworkflow-requirements/references/lessons-learned-health-policy-worktree-2026-04.md
jq . .claude/skills/aiworkflow-requirements/indexes/keywords.json > /dev/null
```

---

## 7. リスクと対策

| リスク                                              | 影響度 | 発生確率 | 対策                                                                              |
| --------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------- |
| `keywords.json` の JSON 破損                        | 高     | 低       | `jq .` を完了条件に組み込み、構文不正時は即時修復                                 |
| 既存記述を誤って改変                                | 中     | 中       | 「拡張のみ」を完了条件に明記し、`git diff` で確認                                 |
| topic-map と keywords の語彙ずれ                    | 中     | 中       | `system-spec-update-summary.md` §2 を正本として表現を 1:1 で写経                  |
| `quick-reference.md` 不在時に誤って新規作成        | 低     | 中       | Phase 1 で存在確認、無ければスキップを完了条件として許容                          |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/unassigned-task-detection.md` §1.3 UT-C
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-2/design.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-health-policy-worktree-2026-04.md`

### 参考資料

- aiworkflow-requirements skill `update_references` フロー
- Progressive Disclosure 設計原則

---

## 9. 備考

### 苦戦箇所【記入必須】

> 本タスク切り出し時に確認した具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | skill references の更新が、本体 task-worktree-environment-isolation の単発 PR には含められなかった                                                    |
| 原因     | skill 更新は `update_references` 等の skill 専用ワークフローを通す必要があり、docs-only タスクの PR と同居させると skill メンテ枠の運用境界を侵す     |
| 対応     | docs-only タスクから skill メンテ枠へ切り出し、本書（UT-C）として独立タスク化                                                                         |
| 再発防止 | 本体タスク Phase 12 で skill 反映が必要と判明した時点で、即座に `unassigned-task/` へ skill 更新タスクを別件登録するルール化を検討                     |

### レビュー指摘の原文（該当する場合）

```
unassigned-task-detection.md §1.3 UT-C にて、aiworkflow-requirements references の更新は
skill メンテ枠（既存 update_references フロー）で別タスク化すると識別
```

### 補足事項

本タスクは **拡張のみで既存記述の改変なし** が大原則。`system-spec-update-summary.md` §1〜§3 を正本として写経的に反映することで、用語ずれと衝突リスクを最小化する。`quick-reference.md` は存在しない可能性があり、その場合は §2.3 をスキップしても完了条件を満たす（不存在ファイルの新規作成は本タスクのスコープ外）。
