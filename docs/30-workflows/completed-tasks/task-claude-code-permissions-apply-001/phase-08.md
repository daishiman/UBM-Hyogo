# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 (カバレッジ確認) |
| 下流 | Phase 9 (品質保証) |
| 状態 | blocked（Phase 7 完了まで着手禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 5 で実機反映済みの settings 4 ファイル（`~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.json` / `<project>/.claude/settings.local.json`）と `~/.zshrc` の `cc` alias、および本タスクの設計ドキュメント（Phase 1-7 の outputs）を対象に、**冗長性の排除と整形** を最小スコープで行う。

本タスクは host 環境のシェル/JSON ファイル編集が中心であり、コード重複削減の余地は限定的。リファクタリング対象は次の 3 領域に限定する:

1. `~/.zshrc` 内の `cc` alias 重複定義（複数行残存していないか）
2. settings JSON 4 ファイル内の冗長な key（同一値が hierarchy 内で多重定義されていないか）
3. JSON フォーマットの整形（`jq .` を通して順序統一・インデント統一）

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` | 実機反映前の元状態と diff の根拠 |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` | 実反映後の最終形 |
| Phase 7 coverage-matrix | `outputs/phase-07/coverage-matrix.md` | 重複検出箇所がカバレッジに影響しないか確認 |
| Phase 2 topology | `outputs/phase-02/topology.md` | 冗長 key 判定の正本 |

## 手順

1. **alias 重複検出**
   - `grep -nE '^alias cc=' ~/.zshrc` を実行
   - ヒット件数が 2 以上の場合、最後の 1 行（CC_ALIAS_EXPECTED と一致するもの）以外を削除
   - ヒット件数が 1 のままなら no-op として記録
2. **settings 階層内の冗長 key 削除**
   - `~/.claude/settings.json` と `~/.claude/settings.local.json` を `jq` で diff
   - 同一 key/value が両方に重複している場合、`settings.local.json` 側に残し `settings.json` から削除（local が優先される階層原則に従う）
   - project 層も同様に `<project>/.claude/settings.json` と `<project>/.claude/settings.local.json` で確認
   - `defaultMode` は **3 ファイルすべてで `bypassPermissions` を維持**（AC-1 の要件であるため削除禁止）
3. **JSON フォーマット整形**
   - 4 ファイルすべてに `jq --indent 2 . <file> > <file>.tmp && mv <file>.tmp <file>` を適用
   - 整形後 `jq empty` で JSON validity を再確認
4. **before-after.md 作成**
   - 対象 / Before / After / 理由 のテーブル形式で記録（[Feedback RT-03] 反映）
5. **navigation drift / dead link 確認**
   - 本タスクは host 環境変更タスクであり、ドキュメント間の navigation 構造変更は無いため **N/A** と明示
   - `index.md` → `phase-NN.md` → `outputs/phase-N/*.md` のリンクは Phase 9 で再点検

## 成果物

`artifacts.json` の Phase 8 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-08/main.md` | リファクタリング実施サマリ。alias 重複検出結果 / 冗長 key 削除結果 / JSON 整形結果の 3 軸を記録。実施 0 件の領域は「no-op」と明示 |
| `outputs/phase-08/before-after.md` | 対象 / Before / After / 理由 のテーブル形式（[Feedback RT-03] 反映）。alias / settings.json hierarchy / JSON フォーマットの 3 領域を最低 1 行ずつ記録（no-op の場合も「no-op」行で記載） |

## 完了条件

- [ ] `outputs/phase-08/main.md` / `before-after.md` の 2 ファイルが存在
- [ ] `grep -nE '^alias cc=' ~/.zshrc` のヒットが 1 件かつ `CC_ALIAS_EXPECTED` と完全一致
- [ ] settings JSON 4 ファイルが `jq empty` で JSON valid
- [ ] `defaultMode` が 3 ファイルすべてで `bypassPermissions` を維持
- [ ] before-after.md が「対象 / Before / After / 理由」テーブル形式
- [ ] navigation drift / dead link は本タスク **N/A** と明示
- [ ] artifacts.json の `phases[7].outputs` と本 Phase 成果物が完全一致

## 検証コマンド

```bash
# alias 重複検出
grep -cE '^alias cc=' ~/.zshrc  # 期待値: 1

# JSON validity 再確認
for f in ~/.claude/settings.json ~/.claude/settings.local.json \
         "$PWD/.claude/settings.json" "$PWD/.claude/settings.local.json"; do
  test -f "$f" && jq empty "$f" && echo "OK: $f"
done

# defaultMode 維持確認
for f in ~/.claude/settings.json ~/.claude/settings.local.json "$PWD/.claude/settings.local.json"; do
  jq -r '.defaultMode // empty' "$f"
done  # 期待値: 各行 bypassPermissions

# 成果物存在確認
test -f outputs/phase-08/main.md && test -f outputs/phase-08/before-after.md && echo "outputs OK"
```

## 依存 Phase

- 上流: Phase 7（coverage-matrix.md で未カバー領域 0 件確認済み）
- 下流: Phase 9（リファクタ後の成果物に対し品質ゲート判定）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行（host 環境 file 操作のため並列化不可）
- 4 ファイルの `jq` 整形のみ独立並列可

## ゲート判定基準

- 完了条件チェックリストすべて PASS で **Phase 9 着手 Go**
- alias 重複が解消されない / JSON invalid / `defaultMode` 不一致 のいずれか発生時は **No-Go**:
  - alias 関連 FAIL → 本 Phase 内で再修正
  - JSON / defaultMode FAIL → Phase 5（実装）にループバック

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `jq` 整形時の I/O 競合で原本破損 | 一時ファイル経由（`<file>.tmp`）で書き戻し、失敗時は Phase 5 backup から復旧 |
| 冗長 key 削除で `defaultMode: bypassPermissions` を誤削除 | 削除前に `jq -r '.defaultMode'` で値を確認、AC-1 の 3 ファイル要件は不変 |
| alias の重複削除で正準形を消す | 削除前に `CC_ALIAS_EXPECTED`（Phase 1 inventory に記録）と完全一致する行を残す |
| navigation drift 誤判定 | 本タスクが host 環境変更タスクである旨を明示し N/A と記録、Phase 9 の link checklist で改めて確認 |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
