# Phase 6 — 異常系検証 / failure cases

Phase 5 ランブック (Step 0〜5) で実施する SKILL.md の Progressive Disclosure 分割
作業に対し、想定される 6 件の失敗シナリオ (F-1〜F-6) を網羅し、原因 / 検出 /
自動化可能性 / 復旧 / evidence の 5 項目を埋める。各シナリオは Phase 4 検証
カテゴリ V1〜V6 と Phase 5 Step 0〜5 にマップする。

evidence 保存先: `outputs/phase-06/evidence/`

---

## 概要マトリクス

| # | シナリオ | 種別 | 自動化 | 影響 AC | V (Phase 4) | Step (Phase 5) |
| --- | --- | --- | --- | --- | --- | --- |
| F-1 | SKILL.md → references リンク切れ | 構造的 | 自動 | AC-4, AC-7 | V2 | Step 4 |
| F-2 | 並列 SKILL.md 編集タスクとの衝突 | プロセス | 半自動 | AC-3, AC-9 | (V 該当なし) | Step 0 (announce) |
| F-3 | canonical / mirror 差分発生 | 構造的 | 自動 | AC-5 | V4 | Step 5 |
| F-4 | entry が 200 行を超える skill が残置 | 構造的 | 自動 | AC-1, AC-6, AC-9 | V1 | Step 4 |
| F-5 | 意味的書き換えの混入 (cut & paste 違反) | 不変条件 | 半自動 | AC-2, AC-3, AC-11 | V6 | Step 3 |
| F-6 | references 同士の循環参照 | 構造的 | 半自動 | AC-4 | V2 拡張 | Step 2 |

合計 6 件 (要件下限を満たす)。

自動化分類: 自動 = F-1 / F-3 / F-4、半自動 = F-2 / F-5 / F-6、手動のみ = (該当なし)。

---

## F-1. SKILL.md → references リンク切れ

| 項目 | 内容 |
| --- | --- |
| 原因 | references topic を新設したが SKILL.md の References リンク表に追記漏れ。または `references/<typo>.md` のようなファイル名不一致。 |
| 検出 | Phase 4 V2: `outputs/phase-04/scripts/link-integrity.sh` が `FAIL:` 行を出力。 |
| 自動化 | 自動 (CI / pre-PR で実行可能)。 |
| 復旧 | SKILL.md の References リンク表に正しい path を追加するか `references/<topic>.md` のファイル名を修正し、V2 を再実行。 |
| evidence | `outputs/phase-06/evidence/F-1-link-integrity.log` |
| 影響 AC | AC-4, AC-7 |

復旧コマンド例:

```bash
# 修正後に再検証
bash outputs/phase-04/scripts/link-integrity.sh \
  | tee outputs/phase-06/evidence/F-1-link-integrity.log
```

---

## F-2. 並列 SKILL.md 編集タスクとの衝突

| 項目 | 内容 |
| --- | --- |
| 原因 | A-3 着手前 announce 漏れ。または A-1 (gitignore) / A-2 (fragment) 未完了で受け皿が無いまま着手。 |
| 検出 | `git merge` 時の conflict / PR レビューでの差分競合 / dev へのマージ時の意図しない変更。 |
| 自動化 | 半自動 (git の conflict 検出は自動だが、announce は人手)。 |
| 復旧 | 衝突した片方の作業を待避 → 先行 PR をマージ → 待避側を rebase。1 PR = 1 skill 原則を再確認。 |
| evidence | `outputs/phase-06/evidence/F-2-merge-conflict.log` (`git status` / `git diff` の保存) |
| 影響 AC | AC-3, AC-9 |

復旧コマンド例:

```bash
git stash push -m "a3-skill-conflict-stash"
git fetch origin && git rebase origin/dev
# 競合解消後
git stash pop
git status > outputs/phase-06/evidence/F-2-merge-conflict.log
```

---

## F-3. canonical / mirror 差分発生

| 項目 | 内容 |
| --- | --- |
| 原因 | `.claude/skills/...` のみ修正し `.agents/skills/...` への rsync を忘れた。または rsync 後に片方のみさらに編集した。 |
| 検出 | Phase 4 V4: `outputs/phase-04/scripts/mirror-diff.sh` が非空出力で exit 1。 |
| 自動化 | 自動。 |
| 復旧 | canonical を正本として `rsync --delete` で mirror を上書き同期 → `diff -r` で 0 確認。 |
| evidence | `outputs/phase-06/evidence/F-3-mirror-diff.log` |
| 影響 AC | AC-5 |

復旧コマンド例:

```bash
SKILL=task-specification-creator
rsync -av --delete \
  ".claude/skills/$SKILL/" \
  ".agents/skills/$SKILL/"
diff -r ".claude/skills/$SKILL" ".agents/skills/$SKILL" \
  | tee outputs/phase-06/evidence/F-3-mirror-diff.log
```

---

## F-4. entry が 200 行を超える skill が残置

| 項目 | 内容 |
| --- | --- |
| 原因 | Phase 2 の分割設計時に切り出し対象セクションが過小。または cut & paste 後に新規 entry 追記が混入。 |
| 検出 | Phase 4 V1: `outputs/phase-04/scripts/line-count.sh` が `FAIL:` を出力し exit 1。 |
| 自動化 | 自動。 |
| 復旧 | Phase 2 設計表に立ち返り、追加で切り出す topic を選定 → references 分割追加 → SKILL.md 再リライト。 |
| evidence | `outputs/phase-06/evidence/F-4-line-count.log` |
| 影響 AC | AC-1, AC-6, AC-9 |

復旧手順:

1. `wc -l .claude/skills/<skill>/SKILL.md` で行数を確認。
2. 最も大きいセクションを `references/<additional-topic>.md` に追加切り出し。
3. SKILL.md References 表に追記し、再度 V1 を実行。

```bash
bash outputs/phase-04/scripts/line-count.sh \
  | tee outputs/phase-06/evidence/F-4-line-count.log
```

---

## F-5. 意味的書き換えの混入

| 項目 | 内容 |
| --- | --- |
| 原因 | cut & paste 中の言い換え / Anchor 追記の本体 PR 混入 / 句読点・順序の整理。 |
| 検出 | Phase 4 V6: `git diff main -- .claude/skills/<skill>` の追加行と削除行を sort 後に diff し、テキスト不一致を検出。 |
| 自動化 | 半自動 (境界判定は人手)。 |
| 復旧 | 該当 commit を `git revert` で本体 PR から除外。Anchor 追記等の意味変更は別 PR に切り出す。 |
| evidence | `outputs/phase-06/evidence/F-5-semantic-diff-<skill>.md` |
| 影響 AC | AC-2, AC-3, AC-11 |

復旧コマンド例:

```bash
SKILL=task-specification-creator
# 削除行と追加行のテキスト一致を機械的に確認
git diff main -- ".claude/skills/$SKILL/SKILL.md" \
  | grep '^-' | grep -v '^---' | sed 's/^-//' | sort > /tmp/del.txt
git diff main -- ".claude/skills/$SKILL/references/" \
  | grep '^+' | grep -v '^+++' | sed 's/^+//' | sort > /tmp/add.txt
diff /tmp/del.txt /tmp/add.txt \
  | tee "outputs/phase-06/evidence/F-5-semantic-diff-$SKILL.md"
# 差分が「セクション見出しの再配置のみ」でなければ revert
git log --oneline -- ".claude/skills/$SKILL/SKILL.md"
git revert <semantic-rewrite-sha>
```

---

## F-6. references 同士の循環参照

| 項目 | 内容 |
| --- | --- |
| 原因 | `references/<a>.md` 内から `references/<b>.md` を参照し、`<b>` からも `<a>` を参照する構造が発生。共通要素を別 reference に切り出していない。 |
| 検出 | `rg -n 'references/' .claude/skills/<skill>/references/` で各 reference の依存先を抽出 → グラフ目視 (DAG 違反検出)。 |
| 自動化 | 半自動 (DAG 検査は自動化可能だが初期実装は目視)。 |
| 復旧 | 共通要素を 3 つ目の reference (例: `references/_shared.md`) に切り出すか、entry SKILL.md に戻す。Phase 2 設計表を更新。 |
| evidence | `outputs/phase-06/evidence/F-6-cycle-graph-<skill>.md` |
| 影響 AC | AC-4 |

検出コマンド例:

```bash
SKILL=task-specification-creator
rg -n 'references/[A-Za-z0-9_./\-]+\.md' \
  ".claude/skills/$SKILL/references/" \
  | tee "outputs/phase-06/evidence/F-6-cycle-graph-$SKILL.md"
# 出力を読み、依存先を抽出して循環の有無を目視確認
```

---

## 自動化可能性まとめ

| 分類 | シナリオ | 備考 |
| --- | --- | --- |
| 自動 | F-1, F-3, F-4 | Phase 4 スクリプト 3 本で CI / pre-PR 実行可能 |
| 半自動 | F-2, F-5, F-6 | 検出は自動できるが、判定 / 復旧に人手介入が必要 |
| 手動 | (該当なし) | — |

## シナリオ ↔ 検証カテゴリ / Step 対応

| F# | Phase 4 V | Phase 5 Step | 備考 |
| --- | --- | --- | --- |
| F-1 | V2 | Step 4 (入口リライト) | リンク表追記漏れの典型 |
| F-2 | (V 該当なし) | Step 0 (announce) | プロセス系。announce で予防 |
| F-3 | V4 | Step 5 (mirror 同期) | rsync 漏れの典型 |
| F-4 | V1 | Step 4 (入口リライト) | 切り出し過小の典型 |
| F-5 | V6 | Step 3 (cut & paste) | 機械的原則違反 |
| F-6 | V2 拡張 | Step 2 (topic 設計) | 設計時に DAG 確認 |

## レビュー観点 (半自動シナリオ向け)

`outputs/phase-06/review-checklist.md` を別出しし、F-2 / F-5 / F-6 のレビュー観点を整理する。
本ドキュメントでは要点のみ:

- F-2: PR 説明文の「対象 skill」セクションで 1 PR = 1 skill が守られているか
- F-5: PR の `git diff` で追加行と削除行のテキスト一致をレビュアーが目視
- F-6: references 間の依存リンクが DAG であることを Phase 2 設計表と突合

## AC 影響まとめ

| AC | 影響シナリオ |
| --- | --- |
| AC-1 | F-4 |
| AC-2 | F-5 |
| AC-3 | F-2, F-5 |
| AC-4 | F-1, F-6 |
| AC-5 | F-3 |
| AC-6 | F-4 |
| AC-7 | F-1 |
| AC-8 | (Phase 4 V3 で別途確保) |
| AC-9 | F-2, F-4 |
| AC-10 | (F-5 経由で間接) |
| AC-11 | F-5 |

すべての AC が 1 件以上のシナリオもしくは Phase 4 検証カテゴリでカバーされている。

## ロールバックの最終的な拠り所

- F-3 / F-4 / F-1 は復旧コマンドが冪等。
- F-5 は `git revert <sha>` で 1 PR 単位の原状復帰が可能 (1 PR = 1 skill 原則の恩恵)。
- F-6 は Phase 2 設計表を更新し、再 cut & paste で構造を直す (内容の意味的変更は伴わない)。
- F-2 は人間プロセス (announce / 順序制御) で予防し、発生時は rebase で解消。
