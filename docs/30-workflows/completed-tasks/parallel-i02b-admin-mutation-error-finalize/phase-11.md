# Phase 11: エビデンス収集（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 種別 | エビデンス収集 |
| visualEvidence | NON_VISUAL |
| 入力 | Phase 4-10 出力 |
| 出力 | `outputs/phase-11/` 配下の evidence ledger |

## 目的

NON_VISUAL タスクの canonical evidence path（typecheck / lint / test / grep-gate / build）を `outputs/phase-11/evidence/` 配下に物理配置し、Phase 12 evidence existence validator から検出可能にする。

## evidence ledger（Phase 11 evidence file inventory）

| # | Status | Path | 取得方法 |
| --- | --- | --- | --- |
| 1 | present | `outputs/phase-11/evidence/typecheck.log` | Phase 6 §1 |
| 2 | present | `outputs/phase-11/evidence/lint.log` | Phase 6 §2 |
| 3 | present | `outputs/phase-11/evidence/grep-gate.log` | Phase 6 §3（0 件を保証する空ファイル） |
| 4 | present | `outputs/phase-11/evidence/test-focused.log` | Phase 5 |
| 5 | present | `outputs/phase-11/evidence/test-integration.log` | Phase 7 |
| 6 | present | `outputs/phase-11/evidence/ac-verification.log` | Phase 8 |
| 7 | n/a | screenshot / visual evidence | NON_VISUAL のため取得不要 |
| 8 | n/a | runtime smoke (staging) | 本 spec はローカル完結タスクのため不要 |

## 実行手順

```bash
mkdir -p outputs/phase-11/evidence

# Phase 5-8 の各コマンドを実行し、上記 ledger の path に tee で保存する
# （詳細は各 phase ドキュメントの実行手順を参照）
```

## evidence 不変条件

- すべての `Status: present` 行の path が `existsSync` + `isFile()` で実在すること（Phase 12 compliance check が自動検証）
- `.log` は tracked file として `git add` する（`.gitignore` 対象外であることを確認）
- redaction: log 内にトークン / Cloudflare API Token / OAuth トークンの偶発出力がないことを目視確認

## 完了条件


- [x] Phase 11 の完了条件を満たす証跡が保存されている。
- 上記 6 evidence ファイルがすべて生成されている
- `git status outputs/phase-11/` で untracked として表示される（次に `git add` 可能）
- redaction 確認済

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
- Phase 5 / 6 / 7 / 8 出力

## 実行タスク

- Phase 11 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
