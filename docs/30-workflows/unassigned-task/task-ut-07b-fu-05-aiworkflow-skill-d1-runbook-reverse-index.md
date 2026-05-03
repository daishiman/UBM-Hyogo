# UT-07B-FU-05 aiworkflow-requirements skill D1 migration runbook 逆引き index 整備 - タスク指示書

## メタ情報

```yaml
task_id: UT-07B-FU-05-aiworkflow-skill-d1-runbook-reverse-index
task_name: aiworkflow-requirements skill から D1 migration runbook + scripts を逆引きできる index 整備
category: type:improvement
target_feature: aiworkflow-requirements skill (indexes / references)
priority: low
scale: small
status: 未実施
source_phase: docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-03
dependencies:
  - UT-07B-FU-03-production-migration-apply-runbook (PR merge 済み前提)
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-FU-05-aiworkflow-skill-d1-runbook-reverse-index |
| タスク名 | aiworkflow-requirements skill 逆引き index 整備（D1 migration runbook + scripts） |
| 分類 | improvement / documentation / skill |
| 対象機能 | aiworkflow-requirements skill（indexes / references） |
| 優先度 | low |
| 見積もり規模 | small |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-03 |
| issue_number | #438 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-07B-FU-03 で production migration apply 用の運用ツール群（`scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` / runbook 文書）が追加された。これらは aiworkflow-requirements skill の references / indexes から逆引きできる必要があるが、現在は `references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` への 1 件追記に留まり、index（resource-map / quick-reference / topic-map）からの D1 migration runbook トピックの探索性が弱い。

skill-feedback-report#5 で「`docs/30-workflows/` 配下の runbook + scripts 系タスクを逆引きできる index 整備」が same-wave sync candidate として記録されている。

### 1.2 問題点・課題

将来 D1 migration や production apply runbook を再利用する場面で、skill 利用者が「scripts/d1 / d1-migration-verify gate / cf.sh d1:apply-prod の所在」を index から辿れず、references を全文検索しないと到達できない。

### 1.3 放置した場合の影響

- D1 migration 系の運用ツールが skill から発見しづらく、再発明や手探り運用が発生する
- 同 wave で記録した skill-feedback#5 が wave を跨いで失効しやすくなる

---

## 2. 何を達成するか（What）

### 2.1 目的

aiworkflow-requirements skill の indexes と references から、D1 migration runbook + scripts + CI gate を逆引きできる導線を最小差分で整備する。

### 2.2 最終ゴール

- `indexes/resource-map.md` または `indexes/quick-reference.md` から `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` / `bash scripts/cf.sh d1:apply-prod` の所在に到達できる
- `indexes/topic-map.md` が `generate-index.js` で再生成され、D1 / migration / runbook トピックが拾える
- references / indexes 間の整合性が壊れていない（drift gate `verify-indexes-up-to-date` が通る）

### 2.3 スコープ

#### 含む

- `indexes/resource-map.md` への D1 migration runbook + scripts セクション追加（1〜2 行）
- `indexes/quick-reference.md` への `bash scripts/cf.sh d1:apply-prod` 1 行追記
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` による `topic-map.md` の再生成
- 既存 references の所在表現を最小限統一（必要時のみ）

#### 含まない

- references の本文書き換え（content drift を避ける）
- D1 migration 仕様の変更
- skill 全体構造（resource-map / quick-reference / topic-map / keywords）の改修
- 他 workflow 用 reverse index の整備
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-07B-FU-03 PR が main に merge 済みであること
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` が存在すること
- `pnpm indexes:rebuild` または `node .../generate-index.js` がローカルで実行可能であること

### 3.2 推奨アプローチ

1. 現状の `indexes/resource-map.md` / `indexes/quick-reference.md` を読み、D1 / migration / runbook トピックの記載粒度を確認する
2. 既存セクションのフォーマットに合わせて 1〜2 行で D1 migration runbook + scripts のエントリを追加する
3. `pnpm indexes:rebuild` を実行して `topic-map.md` を再生成する
4. CI gate `verify-indexes-up-to-date` がローカルで通ることを `git diff` で確認する

---

## 4. 実行手順

### Phase 1: 現状確認

1. `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md` を読む
2. UT-07B-FU-03 関連 reference の id / path を確認する
3. 既存 D1 / migration / runbook 関連エントリを `rg "d1|migration|runbook" .claude/skills/aiworkflow-requirements/indexes` で確認する

### Phase 2: index 追記

1. `indexes/resource-map.md` に D1 migration runbook + scripts/d1 + CI gate の所在を追記する
2. `indexes/quick-reference.md` に `bash scripts/cf.sh d1:apply-prod` 1 行を追記する

### Phase 3: 再生成と drift 検証

1. `mise exec -- pnpm indexes:rebuild` を実行する
2. `git diff .claude/skills/aiworkflow-requirements/indexes/topic-map.md` で再生成差分を確認する
3. CI gate `verify-indexes-up-to-date` 相当の検証をローカル再現する（`scripts/verify-indexes.sh` 等の既存スクリプトを使う）

### Phase 4: 仕様同期

1. `outputs/phase-12/system-spec-update-summary.md` の Step 2 に「FU-05 で完了」追記候補をメモする
2. references 本文の書き換えは行わない

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `indexes/resource-map.md` から D1 migration runbook + scripts/d1 + d1-migration-verify gate に到達できる
- [ ] `indexes/quick-reference.md` から `bash scripts/cf.sh d1:apply-prod` の使い方 1 行が見える
- [ ] `topic-map.md` が `generate-index.js` で再生成済みである

### 品質要件

- [ ] CI gate `verify-indexes-up-to-date` がローカル検証で通る
- [ ] references の本文には書き換えが入っていない（drift 範囲を indexes に閉じている）
- [ ] 追記が 1〜2 行 / セクション程度の最小差分である

### ドキュメント要件

- [ ] 追記内容が UT-07B-FU-03 references の id / path と整合している
- [ ] 機密値（API token / Account ID 等）が含まれていない

---

## 6. 検証方法

### 索引検証

```bash
rg "d1-migration-verify|scripts/d1|d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes
```

期待: D1 migration runbook + scripts + CI gate の所在が indexes から見つかる。

### 再生成検証

```bash
mise exec -- pnpm indexes:rebuild
git diff .claude/skills/aiworkflow-requirements/indexes
```

期待: `topic-map.md` の再生成のみ、または手追記分のみ差分。

### CI gate 再現

```bash
bash scripts/verify-indexes.sh  # 既存 gate スクリプト名は実在パスに合わせる
```

期待: drift なし（exit 0）。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| references 本文と整合しない記述を indexes に書く | 中 | references を読んでから indexes に書く順序を守る |
| `topic-map.md` の再生成漏れで CI gate が fail | 中 | 必ず `pnpm indexes:rebuild` 実行後に `git diff` を確認する |
| skill 全体構造改修にスコープが広がる | 中 | 本タスクは indexes 1〜2 行 + topic-map 再生成に限定する |

---

## 8. 参照情報

- `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/system-spec-update-summary.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md`
- `.github/workflows/verify-indexes.yml`

---

## 9. 備考

本タスクは UT-07B-FU-03 の skill-feedback-report#5（same-wave sync candidate）と unassigned-task-detection の LOW 候補「skill index 整備」を formalize する。skill 全体改修ではなく、D1 migration runbook + scripts の逆引きに限定した最小タスクとして切り出している。

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/system-spec-update-summary.md` Step 2 の「同 wave 追記判定」
- 症状: skill references への artifact inventory 追加までは UT-07B-FU-03 本体で完了したが、indexes（resource-map / quick-reference / topic-map）からの逆引き整備は「skill 全体改修ではない最小スコープ」と「全体改修待ち」の境界が曖昧で、formalize タイミングがずれやすかった。
- 教訓: artifact inventory（references）追加と indexes 追記を別 wave に分けるなら、別タスクとして同時に formalize する判断基準を skill 側に明記しないと、formalize が抜け落ちる。
- 参照: `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/skill-feedback-report.md` 行 11（feedback#5）
