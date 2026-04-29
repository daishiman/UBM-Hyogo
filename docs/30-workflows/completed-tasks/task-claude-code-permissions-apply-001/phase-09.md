# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-apply-001 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 8 (リファクタリング) |
| 下流 | Phase 10 (最終レビュー) |
| 状態 | blocked（Phase 8 完了まで着手禁止） |
| user_approval_required | false |
| Issue | [#140](https://github.com/daishiman/UBM-Hyogo/issues/140) |

## 目的

Phase 8 まで完了した実機反映状態 + 設計ドキュメントに対し、**品質ゲートを一括判定**する。判定結果は `quality-gate-result.md` にチェックリスト形式で記録し、1 件でも FAIL があれば Phase 10 に進めず該当 Phase へループバックする。

## 入力

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 runbook-execution-log | `outputs/phase-05/runbook-execution-log.md` | 実機反映の正本ログ |
| Phase 5 backup-manifest | `outputs/phase-05/backup-manifest.md` | backup 4 件の存在確認 |
| Phase 7 coverage-matrix | `outputs/phase-07/coverage-matrix.md` | カバレッジ未消化項目 0 件確認（carry-over 入力） |
| Phase 8 before-after | `outputs/phase-08/before-after.md` | リファクタ後の最終形 |
| 全 Phase 成果物ディレクトリ | `outputs/phase-01/` 〜 `outputs/phase-08/` | link checklist 対象 |

## 品質ゲート項目

| ID | 項目 | 基準 | チェック方法 |
| --- | --- | --- | --- |
| Q-1 | JSON validity | settings 4 ファイルすべて `jq empty` PASS | `jq empty <file>` exit 0 |
| Q-2 | alias 重複 0 | `~/.zshrc` の `^alias cc=` ヒットが 1 件 | `grep -cE '^alias cc=' ~/.zshrc` |
| Q-3 | backup 4 件揃い | settings ×3 + zshrc ×1 の `*.bak.<TS>` が存在 | `ls -1 *.bak.* \| wc -l` ≥ 4 |
| Q-4 | line budget | `outputs/phase-05/runbook-execution-log.md` および各 phase ファイル ≤ 250 行 | `wc -l outputs/phase-*/*.md docs/30-workflows/task-claude-code-permissions-apply-001/phase-*.md` |
| Q-5 | link checklist | 参照リンクの dead link 0 件 | `index.md` → `phase-NN.md` → `outputs/phase-N/*.md` を手動 trace |
| Q-6 | mirror parity | 本タスクは N/A（mirror 対象 docs を持たない） | 明示記録 |
| Q-7 | coverage carry-over | Phase 7 coverage-matrix の未消化 0 件 | manual review |
| Q-8 | secrets 漏洩 | API token / `.env` 実値の混入 0 件 | `grep -rE '(sk-[A-Za-z0-9]{20,}\|api_key\s*=\|API_KEY\s*=)' outputs/ docs/30-workflows/task-claude-code-permissions-apply-001/` |
| Q-9 | grep 0 件証跡（[FB-UI-02-1] 反映） | 削除/置換対象（旧 alias / 旧 defaultMode）の grep が 0 件 | `grep -RE '"defaultMode"\s*:\s*"(default\|acceptEdits\|plan)"' ~/.claude/ <project>/.claude/` および古い `cc` alias 形 |
| Q-10 | artifacts.json parity | `outputs` 配列と実ファイル一致 | `jq -r '.phases[].outputs[]' artifacts.json` と `find outputs -type f -name '*.md'` の突合 |

## 手順

1. **Q-1〜Q-3 自動チェック**: 検証コマンドを順次実行し、結果を `quality-gate-result.md` のチェックリストに転記
2. **Q-4 line budget**: `wc -l` の結果を一覧化、≤ 250 行を超えるファイルがあれば Phase 8 に差し戻し
3. **Q-5 link checklist**: `index.md` の Phase 表 → `phase-NN.md` → `outputs/phase-N/*.md` の 3 段リンクを手動 trace し、dead link を 0 件確認
4. **Q-6 mirror parity**: 本タスクは host 環境変更タスクであり mirror docs を持たないため **N/A** と明示
5. **Q-7 coverage carry-over**: Phase 7 coverage-matrix.md の「未消化」列が 0 件であることを確認（Phase 7 carry-over の取り込み）
6. **Q-8 secrets 漏洩**: grep 検出 0 件を確認。token 様の文字列があれば Phase 8 に差し戻し
7. **Q-9 grep 0 件証跡**（[FB-UI-02-1] 反映）:
   - 削除/置換対象（旧 `defaultMode` 値、旧 `cc` alias 形）の grep を実行し 0 件を証跡として記録
   - 削除は git delete または stub 化のいずれかで PASS とし、grep 0 件を必須証跡とする
8. **Q-10 artifacts parity**: `jq` で artifacts.json の outputs 配列を抽出し、実ファイルと突合
9. **総合判定**:
   - Q-1〜Q-10 すべて PASS → **Phase 10 着手 Go**
   - 1 件でも FAIL → 当該 Phase（Q-1〜Q-3,Q-9 = Phase 5、Q-4 = Phase 8、Q-5,Q-10 = Phase 8、Q-7 = Phase 7、Q-8 = Phase 8）にループバック

## 成果物

`artifacts.json` の Phase 9 outputs と 1:1 一致:

| ファイル | 内容要件 |
| --- | --- |
| `outputs/phase-09/main.md` | 品質ゲート総合判定サマリ。Q-1〜Q-10 の PASS/FAIL 一覧、ループバック先 Phase（FAIL 時）、Phase 10 着手 Go/No-Go |
| `outputs/phase-09/quality-gate-result.md` | Q-1〜Q-10 のチェックリスト詳細。各項目の検証コマンド出力（または手動確認結果）を引用形式で記録。Q-6（mirror parity）は **N/A** を明示、Q-9 は grep 0 件の証跡を必須記載 |

## 完了条件

- [ ] `outputs/phase-09/main.md` / `quality-gate-result.md` の 2 ファイルが存在
- [ ] Q-1〜Q-10 すべてに PASS / FAIL / N/A の判定が記録
- [ ] Q-6 が N/A として明示記録されている
- [ ] Q-9 の grep 0 件証跡が記録されている
- [ ] FAIL がある場合はループバック先 Phase が `main.md` に明示
- [ ] artifacts.json の `phases[8].outputs` と本 Phase 成果物が完全一致

## 検証コマンド

```bash
# Q-1: JSON validity
for f in ~/.claude/settings.json ~/.claude/settings.local.json \
         "$PWD/.claude/settings.json" "$PWD/.claude/settings.local.json"; do
  test -f "$f" && jq empty "$f" && echo "OK: $f"
done

# Q-2: alias 重複
grep -cE '^alias cc=' ~/.zshrc  # 期待値: 1

# Q-3: backup 4 件
ls -1 ~/.claude/settings.json.bak.* ~/.claude/settings.local.json.bak.* \
      "$PWD/.claude/settings.local.json.bak."* ~/.zshrc.bak.* 2>/dev/null | wc -l

# Q-4: line budget
wc -l outputs/phase-*/*.md docs/30-workflows/task-claude-code-permissions-apply-001/phase-*.md \
  | awk '$1 > 250 {print "OVER:", $0}'

# Q-8: secrets 漏洩
grep -rE '(sk-[A-Za-z0-9]{20,}|api_key\s*=|API_KEY\s*=)' \
  outputs/ docs/30-workflows/task-claude-code-permissions-apply-001/ 2>/dev/null

# Q-9: 旧 defaultMode 値の grep 0 件
grep -rE '"defaultMode"\s*:\s*"(default|acceptEdits|plan)"' \
  ~/.claude/ "$PWD/.claude/" 2>/dev/null  # 期待値: 0 件

# Q-10: artifacts parity
diff <(jq -r '.phases[].outputs[]' artifacts.json | sort) \
     <(find outputs -type f -name '*.md' | sort)
```

## 依存 Phase

- 上流: Phase 8（refactoring 完了状態）
- 上流（参照）: Phase 5（実機反映の正本）/ Phase 7（coverage carry-over）
- 下流: Phase 10（PASS 時のみ）

## 想定 SubAgent / 並列性

- 単一 agent で直列実行（ゲート判定のため並列化不可）
- Q-1〜Q-3 / Q-8 / Q-9 の自動 grep は並列化可

## ゲート判定基準

- Q-1〜Q-10 すべて PASS / N/A → **Phase 10 着手 Go**
- 1 件でも FAIL → **No-Go**、ループバック先 Phase を明示
- 削除/置換は git delete または stub 化のいずれかで PASS とし、**grep 0 件を必須証跡** とする（[FB-UI-02-1] 反映）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| line budget 超過の見落とし | `wc -l` を `awk` でフィルタし、超過ファイルを自動列挙 |
| dead link 検出漏れ | manual trace 3 段（index → phase → outputs）を全件辿り、`quality-gate-result.md` にリンク先 path を列挙 |
| secrets 誤検出による False Positive | `grep -E` のパターンを `sk-`+20 文字以上等に絞り、誤ヒット時は文脈確認の上 N/A 記録 |
| Q-9 grep 検出条件の網羅性不足 | 旧 `defaultMode` 値（default / acceptEdits / plan）+ 旧 alias 形（古い `--permission-mode` 引数なし）の 2 系統を必須化 |
| backup 4 件のいずれかが消失 | Phase 5 backup-manifest と diff し、欠損が判明した時点で Phase 5 ループバック |

## 実行タスク

本 Phase の実行タスクは上記「手順」セクションを正本とする。blocked 状態の Phase は、上流 gate が Go になるまで実行しない。

## 参照資料

- `docs/30-workflows/task-claude-code-permissions-apply-001/index.md`
- `docs/30-workflows/task-claude-code-permissions-apply-001/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`

## 統合テスト連携

NON_VISUAL / host 環境設定タスクのため、UI 統合テストは対象外。検証は各 Phase の CLI 証跡、JSON validity、artifact 同期、Phase 11 manual smoke log で担保する。
