# Phase 6: 異常系検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

destructive かつ revert 不可な Pages プロジェクト削除において、想定される異常系を網羅し、
runtime cycle がそれぞれに対し「停止」「retry」「rollback」のいずれを取るかを事前確定する。

## 入力（参照ドキュメント）

- Phase 5 [`phase-05.md`](phase-05.md)
- `scripts/cf.sh`（passthrough 経路の error 伝播挙動）
- 親仕様 `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/outputs/phase-12/implementation-guide.md`（rollback section）

## 変更対象ファイル一覧

| パス | 種別 | 差分方針 |
| --- | --- | --- |
| `outputs/phase-06/main.md` | 新規 | 異常系シナリオ E-01〜E-08 の評価結果テンプレ |
| `runbook.md`（Phase 5 で作成） | 編集 | 異常系発生時の停止条件 / 連絡経路セクションを追記 |

## 異常系シナリオ

| ID | シナリオ | 期待動作 | 検証 / 対応 |
| --- | --- | --- | --- |
| E-01 | dormant 期間中に Workers cutover が rollback された | Pages 削除を**中止**。dormant 期間カウントを reset し、再度観察を始める | runbook 「停止条件」セクション / Phase 7 AC-1 |
| E-02 | Pages プロジェクトに custom domain attachment が残存 | 削除コマンド実行前に detach。detach できない場合は user 確認後に削除を中止 | Step 1 pre-flight / API token expired と区別 |
| E-03 | Cloudflare API token expired / 401 | wrangler が non-zero exit。`scripts/cf.sh` が exit code を伝播 → 削除中止 → `op` 経由で token 再取得 | E-04 と独立 |
| E-04 | Pages project not found（既に削除済み・名前差異） | 削除コマンド non-zero exit。pre-flight Step 1 のリスト出力で project name を再確認 | runbook の project name 確定手順を参照 |
| E-05 | 削除コマンドが部分成功（domain detach は成功・project delete だけ失敗） | 中間状態。手動で `bash scripts/cf.sh pages project list` を再取得し、`deletion-evidence.md` に部分成功状態を記録。再試行は user 再承認後 | runbook 「部分成功時のリカバリ」セクション |
| E-06 | 観察期間中に Workers production の 5xx 率が閾値を超えた | Pages 削除を**中止**。閾値（例: 5xx > 0.5% を 24h 連続）と判断者を明記 | `dormant-period-log.md` の週次サンプル |
| E-07 | redaction check で 1 件以上検出 | commit 前に該当 evidence を修正。修正後再 grep が 0 件になるまで commit しない | Step 7 / Phase 9 redaction gate |
| E-08 | user 承認文言が PR description にも Issue comment にも残っていない | 削除中止。承認取得を再依頼 | AC-4 / `user-approval-record.md` |

## 停止条件（runbook に転記）

以下のいずれかに該当する場合、削除コマンド (Step 5) を実行してはならない。

1. AC-1 を満たす Workers cutover 完了 evidence が無い、または rollback されている
2. AC-2 を満たす custom domain attachment 空状態が確認できていない
3. AC-3 を満たす dormant 観察期間（≥2 週間）が完了していない
4. AC-4 を満たす user 明示承認文言が記録されていない
5. AC-5 redaction check が 0 件で PASS していない

## 部分成功時のリカバリ方針

- 削除コマンドが non-zero exit したが Cloudflare 側で部分的に変更が入った可能性がある場合:
  1. ただちに `bash scripts/cf.sh pages project list` で現状を再取得し、redacted 形で `deletion-evidence.md` に追記
  2. Workers production smoke (Step 6) を**先に実行**し、200 OK 維持を確認
  3. user に状態と次の選択肢（再削除 / 復旧 / 中止）を提示し、再承認を得てから次手順へ
- 自動 retry は禁止（destructive 操作のため）

## fail-safe 確認

- `scripts/cf.sh` は `set -euo pipefail` で error を伝播する（既存実装で確認済み）
- redact 漏れの早期検出: Phase 9 の redaction grep を runtime gate として常に通す
- evidence skeleton の `PENDING_RUNTIME_EXECUTION` ヘッダは「未実行」と「PASS 済」の取り違えを防ぐ

## ローカル実行コマンド

```bash
# シナリオ評価結果の整形確認
mise exec -- pnpm lint
# scripts/cf.sh の error 伝播確認（実 API 副作用のない help 呼び出し）
bash scripts/cf.sh pages project --help
```

## 完了条件 (DoD)

- [ ] E-01〜E-08 の評価結果が `outputs/phase-06/main.md` に記録されている
- [ ] runbook.md に「停止条件」「部分成功時のリカバリ」が明記されている
- [ ] runtime cycle が destructive 操作の「停止」「再承認」「中止」を即決できる粒度になっている

## 実行タスク

- Phase 06 の判断と成果物境界を確定する。

## 参照資料

- [index.md](index.md)
- [phase-05.md](phase-05.md)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-06/main.md`
