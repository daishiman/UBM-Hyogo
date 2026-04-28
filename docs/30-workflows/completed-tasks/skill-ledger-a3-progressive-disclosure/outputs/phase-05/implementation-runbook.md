# Phase 5 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | SKILL.md の Progressive Disclosure 分割（A-3） |
| Phase | 5 / 13 |
| 作成日 | 2026-04-28 |
| 不変条件 | 機械的 cut & paste のみ。意味的書き換え禁止 |
| 最優先 skill | `task-specification-creator/SKILL.md`（517 行 → 200 行未満化） |

---

## Step 0: 事前準備

```bash
# clean 状態と base 確認
git status
git fetch origin

# skill 単位で着手 announce 済みであることを確認（announce-template.md 参照）
# 1 PR = 1 skill 分割の原則。並列他タスクが同 SKILL.md を編集していないこと。

# evidence 受け皿の作成
mkdir -p docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/evidence

# 既存 references レイアウト参考
ls .claude/skills/aiworkflow-requirements/references/
```

完了条件:
- 着手 announce 済 / `git status` clean / Phase 4 検証スクリプト雛形（あれば）取り込み済

---

## Step 1: 棚卸し（200 行超 SKILL.md 抽出）

```bash
for f in .claude/skills/*/SKILL.md; do
  printf '%5d  %s\n' "$(wc -l < "$f")" "$f"
done | sort -nr \
  | tee docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/evidence/inventory.log

awk '$1 >= 200' docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/evidence/inventory.log \
  | tee docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/evidence/targets.log
```

完了条件:
- `inventory.log` に全 SKILL.md の行数が降順に列挙
- `targets.log` に 200 行超 SKILL.md が漏れなく列挙
- `aiworkflow-requirements`（既分割済）は対象外であることを確認

---

## Step 2: 分割設計（topic 切り出し計画）

1. Phase 2 `outputs/phase-02/split-design.md` を参照し、対象 skill ごとに以下 3 項目を確定:
   - entry に残置するセクション
   - references に切り出す topic 名（単一責務命名）
   - 行数見積もり（entry < 200）
2. references topic 推奨命名（task-specification-creator の場合）:
   - `phase-templates.md` — Phase 1〜13 詳細テンプレ
   - `asset-conventions.md` — アセット規約 / artifact 命名
   - `quality-gates.md` — 品質ゲート / Phase 12 漏れ防止表 / 苦戦防止 Tips
   - `orchestration.md` — Task ナビ / agent lane / ベストプラクティス
3. references 同士の循環参照禁止。entry → references の片方向参照のみ。
4. entry 残置 10 要素:
   - front matter
   - 概要 5〜10 行
   - trigger
   - allowed-tools
   - Anchors
   - クイックスタート
   - モード一覧
   - agent 導線
   - references リンク表
   - 最小 workflow

完了条件: 各 skill で entry 行数見積もり < 200。

---

## Step 3: references/<topic>.md への抽出（cut & paste のみ）

```bash
SKILL=task-specification-creator
mkdir -p .claude/skills/$SKILL/references

# 各 topic セクションを SKILL.md から切り出し
# - 切り出し範囲は Phase 2 設計表の行範囲に従う
# - references 内のリンクは references 内で完結
# - 親 SKILL.md への戻り参照は禁止
# - 各 reference 冒頭に簡易 front matter（タイトル / 責務）を付与（cut & paste の前後で機械対応）
```

cut & paste の不変条件:
- 削除行と追加行が完全一致（言い換え禁止）
- 意味的書き換え / 文言整形 / Anchor 追記は別 PR

完了条件: SKILL.md から移送すべきセクションがすべて references に存在し、内容欠損なし。

---

## Step 4: 入口 SKILL.md のリライト

1. SKILL.md から移送済みセクションを削除。
2. references リンク表を末尾近傍に追加:
   ```markdown
   ## References

   | topic | path |
   | --- | --- |
   | Phase テンプレ詳細 | references/phase-templates.md |
   | アセット規約 | references/asset-conventions.md |
   | 品質ゲート | references/quality-gates.md |
   | オーケストレーション | references/orchestration.md |
   ```
3. entry 残置 10 要素チェックリスト（Step 2 参照）を目視確認。
4. 行数計測:
   ```bash
   wc -l .claude/skills/$SKILL/SKILL.md
   # 200 未満であること
   ```

完了条件:
- 行数 < 200
- 10 要素が残存
- references リンク表が末尾近傍に存在

---

## Step 5: mirror 同期（.agents/skills/...）

```bash
SKILL=task-specification-creator

rsync -av --delete \
  .claude/skills/$SKILL/ \
  .agents/skills/$SKILL/

diff -r .claude/skills/$SKILL .agents/skills/$SKILL \
  | tee docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/evidence/mirror-diff-$SKILL.log
# 出力が空であること

wc -l .claude/skills/$SKILL/SKILL.md \
  | tee -a docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-05/evidence/post-split-line-count.log
```

完了条件:
- `diff -r` 出力が空
- 分割後行数 < 200

---

## per-skill PR 計画

| 順 | ブランチ | 対象 skill | 元行数 | 目標行数 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1 | `skill-ledger/a3-task-specification-creator` | `task-specification-creator` | 517 | < 200 | 最優先 / 単独 PR / ドッグフーディング解消 |
| 2 | `skill-ledger/a3-automation-30` | `automation-30` | 432 | < 200 | PR 1 マージ後着手 |
| 3 | `skill-ledger/a3-skill-creator` | `skill-creator` | 402 | < 200 | 〃 |
| 4 | `skill-ledger/a3-github-issue-manager` | `github-issue-manager` | 363 | < 200 | 〃 |
| 5 | `skill-ledger/a3-claude-agent-sdk` | `claude-agent-sdk` | 324 | < 200 | 〃 |
| 6 | `skill-ledger/a3-anchors-guide` | skill 改修ガイドへの Anchor 追記 | — | — | 別 PR（cut & paste 原則と分離） |

### PR ルール

- **1 PR = 1 skill 分割**: 影響範囲を局所化し、レビュー / revert を容易化。
- **Anchor 追記は別 PR**: 「fragment で書け」「200 行を超えたら分割」の Anchor 追加は意味的書き換えに該当するため、A-3 本体（cut & paste のみ）と分離。
- **PR タイトル規約**: `refactor(skill): split <skill-name> into progressive disclosure`
- **PR 本文必須項目**:
  - 対象 skill 名 / 元行数 / 分割後行数
  - references トポロジ（topic 一覧）
  - V1〜V6 evidence へのリンク
  - canonical / mirror diff = 0 の証跡

---

## ロールバック概要（詳細は [rollback.md](./rollback.md)）

- 粒度: skill 単位で 1 PR / 1 マージコミット → `git revert <merge-sha>` のみで完全に元に戻る。
- canonical + mirror を同 PR / 同コミットに含める。
- 検証: revert 後に Phase 4 検証カテゴリ V1〜V4 を再実行し、すべて PASS することを確認。

---

## 完了条件 (Phase 5)

- [x] Step 0〜5 がコマンドベースで連続実行可能
- [x] Step 1 棚卸しで 200 行超対象が `targets.log` に列挙
- [x] Step 3 が cut & paste のみであることを明記
- [x] Step 4 で entry 10 要素チェックリスト + 行数 < 200 ゲートが組込み
- [x] Step 5 で `diff -r` 出力 0 が完了条件
- [x] PR 計画が 1 PR = 1 skill かつ最優先 `task-specification-creator` を明記
- [x] Anchor 追記が別 PR として分離
