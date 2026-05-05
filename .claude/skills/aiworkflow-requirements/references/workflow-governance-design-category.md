# Workflow Governance Design Category

> **読み込み条件**: `docs/30-workflows/_design/` 配下の owner table / governance 設計ドキュメントを resource-map / quick-reference に登録する判断、または canonical workflow path の削除/移動差分を扱う際に参照する。
>
> **promote 元**: `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/outputs/phase-12/skill-feedback-report.md`（Promote candidate #3, #4）

---

## 1. `_design/` カテゴリ定義

`docs/30-workflows/_design/` は実装タスクではなく、**ガバナンス・所有権設計のみを扱う docs-only 成果物のホーム**。task workflow の Phase 1-13 を伴わず、`_design/<feature>.md` に owner / accountable / responsible 列を含む表（または governance 設計図）を集約する。

| 項目 | 値 / ルール |
| --- | --- |
| 物理パス | `docs/30-workflows/_design/<feature>.md` |
| 関連 README | `docs/30-workflows/_design/README.md`（カテゴリ単位の入口） |
| `taskType` 紐付け | docs-only governance タスクが本カテゴリへ owner table を出力する |
| `metadata.designCategory` | `workflow-governance-design`（task-specification-creator 側 [artifact-naming-conventions.md §7](../../task-specification-creator/references/artifact-naming-conventions.md) 参照） |
| resource-map 分類 | `### 10. その他（デプロイ・運用）` 直下の `#### Workflow Governance Design (_design/)` サブセクションへ登録 |
| quick-reference 分類 | 「設計同期」テーブル列「正本ファイル」へ `_design/<feature>.md` を current canonical として記載 |

### 1.1 登録判定フロー

1. PR / commit に `docs/30-workflows/_design/**` の追加・変更が含まれる
2. **同時に**親の workflow root（`docs/30-workflows/<task>/`）が implementation-track ではなく docs-only の場合
3. 上記2条件を満たすとき `resource-map.md` の Workflow Governance Design サブセクションに 1 行追加し、quick-reference からは「設計同期」エントリへリンクする

### 1.2 既知の登録済エントリ

| `_design/` ファイル | 親 workflow root | 登録日 |
| --- | --- | --- |
| `docs/30-workflows/_design/sync-shared-modules-owner.md` | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 2026-05-02 |
| `docs/30-workflows/_design/README.md` | `_design/` 全体入口 | 2026-05-02 |

---

## 2. Current canonical deletion guard

> **目的**: workflow root / `_design/` 配下の **current canonical path** が `git status` 上で削除（`D`）として現れた場合、後続の resource-map / quick-reference 更新で参照切れが発生する。本ガードで FAIL 判定基準を固定する。

### 2.1 判定ルール

| 入力 | 判定 |
| --- | --- |
| `git diff --name-status` で `D <canonical-path>` が出現 | 候補として捕捉 |
| `references/legacy-ordinal-family-register.md` に `<canonical-path>` の legacy mapping が存在する | **PASS**（rename / 履歴 alias として正規化済） |
| 同 PR 内に move destination（`R <canonical-path> -> <new-path>`）が存在する | **PASS**（rename track として整合） |
| 上記いずれも無い場合 | **FAIL**: deletion を実施しない、もしくは legacy mapping を追加してから削除する |

### 2.2 検出コマンド

```bash
# 1. 削除候補 canonical path の抽出（docs/30-workflows/ 配下のみ対象）
git diff --name-status main...HEAD -- docs/30-workflows/ \
  | awk '$1=="D"{print $2}'

# 2. legacy mapping 登録の有無を確認（0件なら FAIL）
for path in $(git diff --name-status main...HEAD -- docs/30-workflows/ | awk '$1=="D"{print $2}'); do
  if grep -q "$path" .claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md; then
    echo "PASS legacy-mapped: $path"
  else
    # rename destination の探索（同 commit 内）
    if git diff --name-status main...HEAD | grep -E "^R[0-9]*\s+$path\s+" > /dev/null; then
      echo "PASS renamed: $path"
    else
      echo "FAIL canonical-deletion-without-mapping: $path"
    fi
  fi
done
```

### 2.3 FAIL 時の対応手順

1. 削除そのものが意図と異なる → revert
2. 意図的な統廃合 → `references/legacy-ordinal-family-register.md` に `<canonical-path> -> <new-path-or-archived>` を追記してから削除をコミット
3. resource-map / quick-reference に該当 canonical を参照する行が残存する場合は同一 wave で current path へ書き換える

---

## 3. SKILL.md 入口導線

`SKILL.md` の resource-map 起動章で `_design/` カテゴリと canonical deletion guard を 1 行で参照できるようにする。詳細展開は本ファイルに集約し、Progressive Disclosure を維持する。

---

## 4. 関連ファイル

- [`indexes/resource-map.md`](../indexes/resource-map.md) — `### 10. その他` 配下に `_design/` サブセクションを追加するときの宿主
- [`references/legacy-ordinal-family-register.md`](legacy-ordinal-family-register.md) — canonical deletion guard の PASS 条件である legacy mapping の正本
- [`references/task-workflow-active.md`](task-workflow-active.md) — current canonical task root 一覧。deletion 検出時はここの参照行も同期する
- task-specification-creator 側: [`artifact-naming-conventions.md` §7](../../task-specification-creator/references/artifact-naming-conventions.md) — docs-only governance owner 表テンプレと Phase 12 filename drift guard

## 変更履歴

| Date | Changes |
| --- | --- |
| 2026-05-02 | 初版。Issue #195 03b follow-up 002 skill-feedback-report.md の Promote candidate #3 / #4 を反映 |
