# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-28 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（runbook） |

## 目的

Phase 4 で確定した 6 検証カテゴリ（V1〜V6）に対する実施手順として、`task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md` の Step 1〜5（棚卸し → 分割設計 → references 抽出 → 入口リライト → mirror 同期）を 1 PR = 1 skill 粒度で機械的に実行する手順書を整備する。最優先は `task-specification-creator/SKILL.md` の単独 PR、それに続けて残対象を skill ごとに別 PR で進め、Anchor 追記は別 PR に切り分けて A-3 本体の独立 revert 可能性を確保する。

## 依存境界

- 改修対象は `.claude/skills/*/SKILL.md` および `.claude/skills/*/references/*.md`、ならびに mirror の `.agents/skills/*` のみ。
- アプリ層・skill loader 本体・doctor スクリプトは touch しない。
- 「機械的 cut & paste のみ」が不変条件。意味的書き換えは別 PR / 別タスクへ分離。
- A-1（gitignore）/ A-2（fragment）が完了済であることが前提。並列で同 SKILL.md を編集する他タスクが無いことを着手前に announce する。

## 実行タスク

1. Step 1（棚卸し）の手順を確定する（完了条件: `wc -l` 出力ソート結果から 200 行超対象一覧が `outputs/phase-05/inventory.md` に記録される）。
2. Step 2（分割設計）の手順を確定する（完了条件: 各 skill で entry 残置 / references topic / 行数見積もりの 3 項目が揃う）。
3. Step 3（references 抽出）の手順を確定する（完了条件: cut & paste のみで `references/<topic>.md` を生成する手順が記述）。
4. Step 4（入口リライト）の手順を確定する（完了条件: entry の 10 要素が残り、行数 < 200 を確認するゲートが組み込み）。
5. Step 5（mirror 同期）の手順を確定する（完了条件: `.agents/skills/...` への反映と `diff -r` 0 が確認できる）。
6. per-skill PR 計画を確定する（完了条件: 最優先 `task-specification-creator` を含む 1 PR = 1 skill の順序、Anchor 追記の別 PR 化が明記）。
7. ロールバック戦略を確定する（完了条件: skill ごとに 1 コミット粒度で revert 可能な構造が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | 原典タスク指示書 §3.4 / §4 Phase 1〜5 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | AC-1〜AC-11 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-02.md | 分割設計表 / 行数見積もり |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-04.md | V1〜V6 検証カテゴリと evidence パス |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 機械的手順 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | 実装順序 / ロールバック戦略 |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既分割の参考レイアウト |

## 改修対象ファイル一覧

### 新規作成

| パス | 役割 |
| --- | --- |
| `.claude/skills/task-specification-creator/references/phase-templates.md` | Phase テンプレ詳細（最優先 skill） |
| `.claude/skills/task-specification-creator/references/asset-conventions.md` | アセット規約 |
| `.claude/skills/task-specification-creator/references/quality-gates.md` | 品質ゲート |
| `.claude/skills/task-specification-creator/references/orchestration.md` | オーケストレーション |
| `.claude/skills/<other-skill>/references/<topic>.md` | Phase 2 設計表で指定された topic（skill 数だけ） |
| `.agents/skills/<skill>/references/<topic>.md` | canonical 同期 mirror |

### 修正

| パス | 修正内容 |
| --- | --- |
| `.claude/skills/<skill>/SKILL.md` | 移送セクション削除 / references リンク表追加 / 行数 < 200 |
| `.agents/skills/<skill>/SKILL.md` | canonical と完全同期（`diff -r` 0） |
| `outputs/phase-05/evidence/*.log` | Step 1〜5 実行ログ（line-count / link-integrity / orphan / mirror-diff） |

## runbook

### Step 0: 事前準備（Phase 4 引き継ぎ）

```bash
# 並列衝突回避: 着手前に skill 単位で announce 済みであることを確認
git status                                # clean であること
git fetch origin
git switch -c skill-ledger/a3-task-specification-creator origin/dev

# Phase 4 の検証スクリプトを取り込み
mkdir -p outputs/phase-05/evidence
ls outputs/phase-04/scripts/              # 検証スクリプト雛形が存在すること
```

### Step 1: 棚卸し（200 行超抽出）

```bash
for f in .claude/skills/*/SKILL.md; do
  printf '%5d  %s\n' "$(wc -l < "$f")" "$f"
done | sort -nr | tee outputs/phase-05/evidence/inventory.log

# 200 行以上の対象を抽出
awk '$1 >= 200' outputs/phase-05/evidence/inventory.log \
  > outputs/phase-05/evidence/targets.log
```

完了条件:
- `targets.log` に 200 行超の SKILL.md が漏れなく列挙されている
- 既に `references/` を持つ skill（`aiworkflow-requirements` 等）が対象外として明示されている

### Step 2: 分割設計（topic 切り出し計画）

1. Phase 2 の `outputs/phase-02/split-design.md` を参照し、対象 skill の entry 残置 / references topic / 行数見積もりを再確認。
2. references topic 名は単一責務原則で命名（例: `phase-templates.md` / `asset-conventions.md` / `quality-gates.md` / `orchestration.md`）。
3. references 同士の循環参照が発生しない依存グラフを確認。
4. entry に残す 10 要素（front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow）を確認。

完了条件: 各 skill で entry 行数見積もりが 200 行未満。

### Step 3: references/<topic>.md への抽出（cut & paste のみ）

```bash
SKILL=task-specification-creator
mkdir -p .claude/skills/$SKILL/references

# 各 topic セクションを SKILL.md から切り出し（手動編集）
# - 切り出し範囲は Phase 2 設計表の行範囲に従う
# - references 内のリンクは references 内で完結
# - 親 SKILL.md への戻り参照は禁止
```

cut & paste の不変条件:
- 削除行と追加行が完全一致（`git diff` で言い換えが混入しないこと）
- 各 reference 冒頭に front matter（タイトル / 責務）を付与
- 意味的書き換えは別 PR

完了条件: SKILL.md から移送すべきセクションがすべて references に存在し、内容欠損なし。

### Step 4: 入口 SKILL.md のリライト

1. SKILL.md から移送済みセクションを削除。
2. references リンク表を追加:
   ```markdown
   ## References

   | topic | path |
   | --- | --- |
   | Phase テンプレ | references/phase-templates.md |
   | アセット規約 | references/asset-conventions.md |
   | 品質ゲート | references/quality-gates.md |
   | オーケストレーション | references/orchestration.md |
   ```
3. entry 残置要素チェックリスト（Phase 4 V5）の 10 要素を目視確認。
4. 行数計測:
   ```bash
   wc -l .claude/skills/$SKILL/SKILL.md
   # 200 未満であること
   ```

完了条件:
- 行数 < 200
- 10 要素が残存
- references リンク表が末尾近傍に存在

### Step 5: mirror 同期 (.agents/skills/...)

```bash
# rsync で canonical を mirror へ反映（ファイル削除も同期）
rsync -av --delete \
  .claude/skills/$SKILL/ \
  .agents/skills/$SKILL/

# 差分検証
diff -r .claude/skills/$SKILL .agents/skills/$SKILL \
  | tee outputs/phase-05/evidence/mirror-diff-$SKILL.log
# 出力が空であること

# Phase 4 検証カテゴリ V1〜V4 を実行
bash outputs/phase-04/scripts/line-count.sh        | tee outputs/phase-05/evidence/v1-line-count.log
bash outputs/phase-04/scripts/link-integrity.sh    | tee outputs/phase-05/evidence/v2-link-integrity.log
bash outputs/phase-04/scripts/orphan-references.sh | tee outputs/phase-05/evidence/v3-orphan-references.log
bash outputs/phase-04/scripts/mirror-diff.sh       | tee outputs/phase-05/evidence/v4-mirror-diff.log
```

完了条件:
- `diff -r` の出力が空
- V1〜V4 すべて FAIL 行 0 件

## per-skill PR 計画

### PR 順序

| 順 | ブランチ | 対象 skill | 変更範囲 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `skill-ledger/a3-task-specification-creator` | `task-specification-creator` | SKILL.md + references/* + mirror | 最優先・単独 PR（ドッグフーディング解消） |
| 2 | `skill-ledger/a3-<skill-2>` | Phase 1 棚卸しで挙がった 2 番目 | 同上 | PR 1 マージ後に着手 |
| 3 | `skill-ledger/a3-<skill-N>` | 残対象 skill | 同上 | 1 PR = 1 skill を厳守 |
| 4 | `skill-ledger/a3-anchors-guide` | skill 改修ガイドへの Anchor 追記 | 別 PR（cut & paste 原則保持のため） | A-3 本体 revert 可能性を独立担保 |

### PR ルール

- **1 PR = 1 skill 分割**: 影響範囲を局所化し、レビュー / revert を容易化。
- **Anchor 追記は別 PR**: 「fragment で書け」「200 行を超えたら分割」の Anchor 追加は意味的書き換えに該当するため、A-3 本体（cut & paste のみ）と分離。
- **PR タイトル規約**: `refactor(skill): split <skill-name> into progressive disclosure`
- **PR 本文必須項目**:
  - 対象 skill 名 / 元行数 / 分割後行数
  - references トポロジ（topic 一覧）
  - V1〜V6 evidence へのリンク
  - canonical / mirror diff = 0 の証跡

## ロールバック戦略

- **粒度**: skill 単位で 1 PR / 1 マージコミット → `git revert <merge-sha>` のみで完全に元に戻る。
- **Anchor 追記の独立性**: 別 PR にしているため、A-3 本体を revert しても Anchor 追記は残る。逆も成立。
- **mirror 同期の不可分性**: canonical + mirror を同 PR / 同コミットに含めることで、revert 時に差分 0 が自動的に維持される。
- **検証**: revert 後に Phase 4 検証カテゴリ V1〜V4 を再実行し、すべて PASS することを確認。

## 実行手順

1. `outputs/phase-05/implementation-runbook.md` を作成し、Step 0〜5 を転記。
2. PR 計画表を Phase 13（PR 作成）と相互参照可能なフォーマットで記録。
3. `outputs/phase-05/evidence/` を作成し、Step 1〜5 のログ受け皿を準備。
4. ロールバック戦略を `outputs/phase-05/rollback.md` として独立ファイル化（Phase 10 GO/NO-GO に紐付け）。
5. 着手前 announce のテンプレを `outputs/phase-05/announce-template.md` に用意（並列衝突回避）。

## 多角的チェック観点

- 価値性: ランブック通りに進めれば AC-1, AC-2, AC-3, AC-5, AC-9 が満たせるか。
- 実現性: cut & paste のみで全対象 skill が 200 行未満に収まるか（Phase 2 行数見積もりと整合）。
- 整合性: `.claude/skills/aiworkflow-requirements` の既存レイアウトと矛盾しないか。
- 運用性: 1 PR = 1 skill / Anchor 別 PR / `git revert` 1 コミット粒度がレビューア・運用者に明白か。
- 不変条件: 機械的 cut & paste 原則が Step 3 / V6 で二重に守られているか。
- 並列衝突回避: 着手前 announce が PR 計画に組み込まれているか。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは実行しない。runbook の Step 1〜5 は Phase 4 の検証セットと Phase 11 の smoke 証跡に直結させる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | Step 0〜5 + PR 計画 + ロールバック |
| ドキュメント | outputs/phase-05/rollback.md | 1 コミット粒度 revert 戦略 |
| テンプレ | outputs/phase-05/announce-template.md | 着手前 announce 雛形 |
| evidence 配置 | outputs/phase-05/evidence/ | Step 1〜5 実行ログ受け皿 |
| メタ | artifacts.json | Phase 5 状態更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] Step 0〜5 がコマンドベースで連続実行可能
- [ ] Step 1 棚卸しで 200 行超対象が `targets.log` に列挙
- [ ] Step 3 が cut & paste のみであることを明記
- [ ] Step 4 で entry 10 要素チェックリスト + 行数 < 200 ゲートが組込み
- [ ] Step 5 で `diff -r` 出力 0 が完了条件
- [ ] PR 計画が 1 PR = 1 skill かつ最優先 `task-specification-creator` を明記
- [ ] Anchor 追記が別 PR として分離
- [ ] ロールバック戦略が skill ごとに 1 コミット粒度で revert 可能と記述

## タスク 100% 実行確認【必須】

- 実行タスク 7 件すべてが `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置済み
- Phase 4 検証スクリプトパス（V1〜V4）が runbook Step 5 に紐付けされている
- Step 0（事前準備 / announce）・Step 5（mirror 同期）の省略が無い
- PR 計画に最優先 `task-specification-creator` 単独 PR が含まれる

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - runbook の各 Step で発生し得る失敗（cut & paste ミス / 並列衝突 / mirror 同期漏れ等）を Phase 6 failure case に展開
  - PR 計画のロールバック戦略を Phase 6 復旧手順の入力にする
  - evidence パス `outputs/phase-05/evidence/` を Phase 11 手動 smoke で再利用
- ブロック条件:
  - A-1 / A-2 が未完了のまま着手しようとしている
  - 並列で同 SKILL.md を編集する他タスクが存在
  - Phase 2 分割設計表で行数見積もりが 200 行を超える skill が残っている
