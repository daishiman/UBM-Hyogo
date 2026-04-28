# B-1 .gitattributes Implementation - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-B1-IMPL |
| タスク名 | B-1 `.gitattributes` 実装 |
| 分類 | 改善 |
| 対象機能 | skill ledger merge conflict prevention |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-conflict-prevention-skill-state-redesign` で定義された 4 施策のうち、B-1 は A-1 / A-2 / A-3 完了後に実施する最後の保険施策である。`docs/30-workflows/skill-ledger-b1-gitattributes/` は仕様書作成に閉じており、root `.gitattributes` の実編集は未実施である。

### 1.2 問題点・課題

行独立な `_legacy.md` 系 ledger に `merge=union` を限定適用する実装がないため、A-2 で吸収しきれない移行猶予中の追記衝突を Git が機械解決できない。

### 1.3 放置した場合の影響

並列 worktree で `_legacy.md` に末尾追記した際に手動 merge が発生し、skill ledger 改修の衝突削減効果が未完になる。広域 glob を後から急いで追加すると JSON / YAML / `SKILL.md` へ誤適用するリスクも高まる。

---

## 2. 何を達成するか（What）

### 2.1 目的

root `.gitattributes` に B-1 セクションを追加し、行独立な append-only `_legacy.md` 系 Markdown のみに `merge=union` を適用する。

### 2.2 最終ゴール

`git check-attr merge` で許可対象は `merge: union`、禁止対象は `merge: unspecified` となり、2〜4 worktree smoke で unmerged files が 0 になる。

### 2.3 スコープ

#### 含むもの

- root `.gitattributes` への B-1 セクション追記
- `_legacy.md` 系の限定 pattern 追加
- JSON / YAML / `SKILL.md` / lockfile / code の除外確認
- 2〜4 worktree smoke evidence の保存

#### 含まないもの

- A-1 / A-2 / A-3 の実装
- `**/*.md` の広域適用
- custom merge driver の導入
- UI / API / database / runtime code の変更

### 2.4 成果物

- `.gitattributes`
- `docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-11/evidence/<run-id>/`
- Phase 12 implementation guide / system spec summary の更新差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-1 / A-2 / A-3 が main にマージ済みであること
- 対象 `_legacy.md` が front matter / code fence / JSON-YAML 構造を含まないこと
- B-1 単独 PR として実施できること

### 3.2 依存タスク

- `task-skill-ledger-a1-gitignore`
- `task-skill-ledger-a2-fragment`
- `task-skill-ledger-a3-progressive-disclosure`

### 3.3 必要な知識

- Git attributes の `merge` attribute
- Git built-in `union` merge driver
- skill ledger の `_legacy.md` 移行方針

### 3.4 推奨アプローチ

`docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-05/implementation-runbook.md` の B-1 セクションを正本として、pattern を広げずに root `.gitattributes` へ追記する。

---

## 4. 実行手順

### Phase構成

1. 前提確認
2. `.gitattributes` 追記
3. attribute 検証
4. worktree smoke
5. Phase 12 証跡更新

### Phase 1: 前提確認

#### 目的

B-1 を先行適用しないことを確認する。

#### 手順

1. A-1 / A-2 / A-3 の完了状態を確認する。
2. 対象 `_legacy.md` の一覧を取得する。
3. front matter / code fence を含む対象を除外する。

#### 成果物

- 対象 path 一覧
- 除外 path 一覧

#### 完了条件

A-1 / A-2 / A-3 完了と、B-1 対象が行独立 Markdown に限定されていることを記録している。

### Phase 2: `.gitattributes` 追記

#### 目的

B-1 セクションを root `.gitattributes` に追加する。

#### 手順

1. 既存 `.gitattributes` の有無と内容を確認する。
2. B-1 コメント、解除条件、禁止対象を含めて追記する。
3. `**/*.md` を使っていないことを確認する。

#### 成果物

- root `.gitattributes`

#### 完了条件

B-1 セクションが単独で revert 可能な差分になっている。

### Phase 3: attribute 検証

#### 目的

許可対象と禁止対象の attribute を確認する。

#### 手順

1. `_legacy.md` 系で `merge: union` を確認する。
2. `SKILL.md` / JSON / YAML / lockfile / code で `merge: unspecified` を確認する。
3. 結果を evidence に保存する。

#### 成果物

- `check-attr.log`

#### 完了条件

許可対象と禁止対象の期待値がすべて一致している。

### Phase 4: worktree smoke

#### 目的

並列追記が衝突 0 件で merge できることを確認する。

#### 手順

1. 2〜4 worktree を作成する。
2. 各 worktree で同じ `_legacy.md` に末尾 1 行を追記して commit する。
3. main 側で順に merge する。
4. unmerged files が 0 件で、全追記行が残っていることを確認する。

#### 成果物

- `worktree-smoke.log`

#### 完了条件

`git ls-files --unmerged` が 0 行で、全 worktree の追記行が残存している。

### Phase 5: Phase 12 証跡更新

#### 目的

実装後の証跡を workflow outputs から追跡可能にする。

#### 手順

1. `outputs/phase-11/evidence/<run-id>/` にログを保存する。
2. `outputs/phase-12/implementation-guide.md` に evidence path を追記する。
3. `outputs/phase-12/system-spec-update-summary.md` に実施結果を追記する。

#### 成果物

- Phase 11 evidence
- Phase 12 更新差分

#### 完了条件

実装、検証、解除条件が Phase 12 から追跡できる。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] root `.gitattributes` に B-1 セクションがある
- [ ] 許可対象 `_legacy.md` 系のみ `merge: union` になる
- [ ] JSON / YAML / `SKILL.md` / lockfile / code は `merge: unspecified` のまま

### 品質要件

- [ ] `**/*.md` の広域 glob がない
- [ ] B-1 セクションに解除条件がコメントされている
- [ ] 2〜4 worktree smoke が PASS している

### ドキュメント要件

- [ ] Phase 11 evidence が保存されている
- [ ] Phase 12 implementation guide が evidence を参照している
- [ ] system spec summary が実施結果を記録している

---

## 6. 検証方法

### テストケース

- `_legacy.md` 系の `merge: union`
- 禁止対象の `merge: unspecified`
- 並列 worktree 追記 merge

### 検証手順

```bash
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/SKILL.md
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
git check-attr merge -- pnpm-lock.yaml
git ls-files --unmerged
```

期待: `_legacy.md` 系は `merge: union`、禁止対象は `merge: unspecified`、unmerged files は 0 行。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| `**/*.md` の広域適用 | 高 | 中 | Phase 2 / 3 で broad glob がないことを `rg '\\*\\*/\\*.md' .gitattributes` で確認する |
| JSON / YAML / `SKILL.md` への誤適用 | 高 | 低 | 禁止対象に対して `git check-attr merge` を必ず実行する |
| A-1〜A-3 未完での先行適用 | 中 | 中 | Phase 1 で依存タスク完了を NO-GO gate にする |
| B-1 解除忘れ | 中 | 中 | `.gitattributes` コメントと A-2 完了レビュータスクで残存確認を二重化する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/skill-ledger-b1-gitattributes/index.md`
- `docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-05/implementation-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitattributes-policy.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-overview.md`

### 参考資料

- `git help attributes`
- https://git-scm.com/docs/gitattributes

---

## 9. 備考

## 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | `merge=union` は便利だが、構造化ファイルへ当てると壊れ方が静かで検知しづらい |
| 原因 | union driver は行単位で両側を残すだけで、JSON / YAML / front matter の構造を理解しない |
| 対応 | `_legacy.md` 系に限定し、禁止対象の `git check-attr` を必須化する |
| 再発防止 | B-1 セクションに禁止対象と解除条件をコメントし、A-2 完了レビューで残存確認する |

### レビュー指摘の原文（該当する場合）

```
Phase 12 の unassigned-task-detection.md で UT-B1-IMPL を検出しているが、docs/30-workflows/unassigned-task/ に実体ファイルが存在しない。
```

### 補足事項

B-1 は保険施策であり、fragment 化できる ledger は A-2 に戻す。
