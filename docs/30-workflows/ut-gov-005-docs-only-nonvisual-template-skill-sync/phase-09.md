# Phase 9: 品質保証（typecheck / lint / mirror diff）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証（typecheck / lint / mirror diff） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 8（DRY 化） |
| 下流 | Phase 10（最終レビュー） |
| 状態 | pending |
| user_approval_required | false |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |

## 目的

skill 本体（`.claude/skills/task-specification-creator/`）への追記・DRY 化の結果を機械検証し、Phase 10 最終レビューへ提出する quality gate evidence を作成する。本タスクは docs-only のため runtime コードへの影響はゼロだが、副作用ゼロを `pnpm typecheck` / `pnpm lint` で確認する。`.agents/` mirror 同期 / `pnpm indexes:rebuild` と CI gate（`verify-indexes-up-to-date`）通過 / Progressive Disclosure 行数規約（200 行制限）違反 0 / skill-fixture-runner 互換性 を**機械的に**判定する。

## 入力

- DRY 化後の skill 本体（`.claude/skills/task-specification-creator/`）
- DRY 化後の mirror（`.agents/skills/task-specification-creator/`）
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/main.md`
- `outputs/phase-04/test-strategy.md`

## 検証コマンド一括（仕様レベル定義）

```bash
# 1. typecheck（skill 改修は runtime に影響しないが副作用ゼロ確認）
mise exec -- pnpm typecheck

# 2. lint（同上）
mise exec -- pnpm lint

# 3. mirror parity（差分 0 必須）
diff -qr .claude/skills/task-specification-creator/ .agents/skills/task-specification-creator/
# 期待: 標準出力なし（exit 0）

# 4. skill indexes 再生成（skill 編集後の正規経路）
mise exec -- pnpm indexes:rebuild
# その後、git status で indexes の差分を確認
git status --porcelain .claude/skills/aiworkflow-requirements/indexes/

# 5. verify-indexes-up-to-date CI gate のローカル相当（drift 検知）
#    indexes:rebuild 後に git diff が空であることを確認
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/
# 期待: exit 0（drift なし）

# 6. Progressive Disclosure 行数規約（A-3 確立の 200 行制限）違反チェック
#    references 配下の md ファイルが 200 行を超えていないか
find .claude/skills/task-specification-creator/references -name '*.md' -type f \
  -exec sh -c 'wc -l "$1" | awk -v f="$1" "{ if (\$1 > 200) print f, \$1 }"' _ {} \;
# 期待: 標準出力なし（200 行超過ファイル 0）

# 7. skill-fixture-runner 互換性確認（SKILL.md 構造検証）
#    fixture-runner の検証スクリプトで SKILL.md / references / agents mirror の構造をチェック
ls .claude/skills/skill-fixture-runner/scripts/ 2>/dev/null
# 期待: 検証スクリプトが存在し、task-specification-creator に対する fixture テストが実行可能であること

# 8. クリーン状態確認
git status --porcelain
# 期待: skill 改修と mirror 同期と本ワークフロー成果物以外の変更なし
```

## 一括判定ルール

| Gate | 期待 | FAIL 時の戻り先 |
| --- | --- | --- |
| typecheck | exit 0 | Phase 5（実装ランブック）— ただし skill 改修で typecheck が壊れることは想定外。壊れた場合は別タスクの巻き込みを疑う |
| lint | exit 0 | Phase 5 — markdown lint で skill 本体追記が引っかかる可能性あり |
| mirror parity (`diff -qr`) | 標準出力なし / exit 0 | Phase 5 — `.agents/` 同期忘れを修復 |
| `pnpm indexes:rebuild` 実行成功 | exit 0 | Phase 5 — skill 構造異常を疑う |
| indexes drift 0 | `git diff --exit-code` exit 0 | Phase 5 — skill 編集後に indexes 再生成が必要 |
| Progressive Disclosure 200 行制限 | 超過ファイル 0 | Phase 5 / Phase 8 — 追記内容を分割 or DRY 化見直し |
| skill-fixture-runner 互換 | 構造検証 PASS | Phase 5 — SKILL.md / references の構造異常を修復 |
| AC マトリクス GREEN | 全件 PASS | 該当 Phase へ戻る |

## 実行タスク

1. 検証コマンド 1〜8 を順次実行し、標準出力 / exit code を main.md に取り込む
2. 各 gate の PASS / FAIL を判定し、FAIL 時の戻り Phase を確定
3. mirror parity が FAIL の場合は `cp -r` 等で同期し再検証（同期コマンドは Phase 2 設計の正本表記に従う）
4. indexes drift が FAIL の場合は `pnpm indexes:rebuild` を再実行し commit に含める
5. AC-1〜AC-10 の各 AC に GREEN マークを Phase 7 マトリクスと連動して付与
6. skill-fixture-runner との互換性確認結果（PASS / N/A の判定根拠）を main.md に記録

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `outputs/phase-08/main.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `.claude/skills/task-specification-creator/`（DRY 化後） |
| 必須 | `.agents/skills/task-specification-creator/`（mirror） |
| 参考 | `.github/workflows/verify-indexes.yml`（CI gate 仕様の正本） |
| 参考 | `doc/00-getting-started-manual/lefthook-operations.md`（indexes:rebuild 運用） |
| 参考 | `.claude/skills/skill-fixture-runner/SKILL.md`（互換性確認の対象スキル） |

## 依存Phase明示

- Phase 4 成果物（テスト戦略）を参照する
- Phase 7 成果物（AC マトリクス）に GREEN を付与する
- Phase 8 成果物（DRY 化結果）を入力とする

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-09/main.md` | 検証コマンド標準出力ログ / 一括判定結果 / mirror parity 結果 / indexes drift 結果 / 200 行制限結果 / skill-fixture-runner 互換性 / AC GREEN マトリクス |

## 完了条件 (DoD)

- [ ] `pnpm typecheck` exit 0（標準出力をログに含めて記録）
- [ ] `pnpm lint` exit 0
- [ ] `diff -qr .claude/skills/task-specification-creator/ .agents/skills/task-specification-creator/` 標準出力なし
- [ ] `pnpm indexes:rebuild` 実行成功 + indexes drift 0（`git diff --exit-code` exit 0）
- [ ] Progressive Disclosure 200 行制限超過 0
- [ ] skill-fixture-runner 互換性確認結果記録済み
- [ ] AC-1〜AC-10 全件 GREEN
- [ ] FAIL 時の戻り Phase が main.md に明記済み

## 苦戦箇所・注意

- **`mise exec` 忘れ**: グローバル node で実行すると Node バージョン差で lint / indexes:rebuild が別挙動になる。必ず `mise exec --` 経由で実行
- **mirror parity の表記揺れ**: `diff -qr` のオプション順序や末尾スラッシュで偽陽性が出る。Phase 2 設計で固定したコマンド表記をそのままコピペ実行
- **indexes drift の見落とし**: `pnpm indexes:rebuild` 後に git status を確認しないと commit 漏れ → CI gate `verify-indexes-up-to-date` が main マージ後に失敗する。本 Phase で必ず drift 0 を確認
- **200 行制限の境界**: A-3 で確立した制限は references 配下の md ファイルに適用される。SKILL.md 自身は対象外。判定対象を明確に main.md に記録
- **skill-fixture-runner の N/A 判定**: 縮約テンプレ専用の fixture テストは別タスクスコープ。本 Phase では「既存 SKILL.md 構造検証が PASS する」ことのみを確認し、N/A 範囲を明記
- **ログ取り込みの揮発**: 「実行した」と書くだけでなく、各コマンドの標準出力を main.md に貼る。Phase 10 で再実行が必要になる事故を防ぐ

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パスと `artifacts.json` の outputs（`outputs/phase-09/main.md`）が一致していることを確認する
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改修であり、アプリケーション統合テストは追加しない
- 統合検証は本 Phase の検証コマンド 1〜8 と Phase 11 NON_VISUAL smoke / `artifacts.json` 整合で代替する
- skill-fixture-runner による fixture テストの拡張は別タスクで仕切る（本 Phase では既存構造の互換性確認のみ）

## 次 Phase

- 次: Phase 10（最終レビュー / Go-No-Go）
- 引き継ぎ: 検証ログ / 一括判定結果 / mirror parity / indexes drift 結果 / AC GREEN マトリクス
