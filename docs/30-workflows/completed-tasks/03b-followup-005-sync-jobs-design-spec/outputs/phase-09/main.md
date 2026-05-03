# Phase 9: indexes 再生成 + drift 検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 9 / 13 |
| Phase 名称 | indexes 再生成 + drift 検証 |
| 作成日 | 2026-05-02 |
| 前 Phase | 8 (database-schema.md の参照更新 + indexes drift 解消) |
| 次 Phase | 10 (レビュー + 整合確認) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま仕様書整備） |

## 目的

Phase 8 までで完了した `_design/sync-jobs-spec.md` 集約および `database-schema.md` 参照更新の結果に対して、`mise exec -- pnpm indexes:rebuild` を改めて実行し、`.claude/skills/aiworkflow-requirements/indexes` 配下が CI の `verify-indexes-up-to-date` gate と一致した状態にあることを最終確認する。Phase 8 実行時から本 Phase までに発生した中間コミットによる indexes drift を吸収し、PR 作成前の clean state を担保する。

## 実行タスク

1. `mise exec -- pnpm indexes:rebuild` を実行し、ログを `outputs/phase-09/indexes-rebuild.log` に保存する
2. `git status --porcelain .claude/skills/aiworkflow-requirements/indexes` で indexes 配下の差分有無を確認する
3. 差分がある場合は内容を `outputs/phase-09/indexes-diff.md` に貼り付け、`indexes` 配下の差分のみを別コミット（`chore(indexes): rebuild after 03b-followup-005-sync-jobs-design-spec`）にまとめる方針を記録する
4. 差分がない場合はその旨を `outputs/phase-09/indexes-diff.md` に「no drift」と記録する
5. `.github/workflows/verify-indexes.yml` が参照するパス（`.claude/skills/aiworkflow-requirements/indexes`）が rebuild 対象に含まれていることを `cat` ではなく Read で確認する
6. Phase 8 の `outputs/phase-08/ci-evidence.md` と本 Phase の rebuild 結果の整合（同一コミット範囲）を `outputs/phase-09/main.md` に要約する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/verify-indexes.yml | CI gate の検査対象パス確認 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/ | rebuild 対象 |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | Phase 6 で作成した正本（参照健全性確認） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | Phase 8 の編集結果 |
| 推奨 | docs/00-getting-started-manual/lefthook-operations.md | indexes 再生成方針の正本 |
| 推奨 | outputs/phase-08/ci-evidence.md | Phase 8 時点の CI 結果 |

## 実行手順（ステップ別）

### ステップ 1: rebuild 実行

```bash
mise exec -- pnpm indexes:rebuild | tee outputs/phase-09/indexes-rebuild.log
```

stderr も含めて捕捉したい場合は `2>&1` を併用する。終了コードが 0 でない場合は本 Phase を fail として停止し、Phase 8 の差し戻しを検討する。

### ステップ 2: drift 検出

```bash
git status --porcelain .claude/skills/aiworkflow-requirements/indexes > outputs/phase-09/indexes-status.txt
```

- 出力が空 → drift なし。`outputs/phase-09/indexes-diff.md` に「no drift」と記録
- 出力に行がある → `git --no-pager diff --stat .claude/skills/aiworkflow-requirements/indexes` を `outputs/phase-09/indexes-diff.md` に貼る

### ステップ 3: 差分のコミット方針記録

drift がある場合、コミットメッセージ案を `outputs/phase-09/main.md` に記載する:

```
chore(indexes): rebuild after 03b-followup-005-sync-jobs-design-spec
```

実コミットは Phase 13（PR 作成）直前に作業ブランチ上で行う。ここでは方針記述のみ。

### ステップ 4: CI gate 仕様の整合確認

`.github/workflows/verify-indexes.yml` を Read し、検査対象 path に `.claude/skills/aiworkflow-requirements/indexes` が含まれていることを確認。確認結果を `outputs/phase-09/ci-spec-check.md` に転記する。

### ステップ 5: Phase 8 evidence との整合

`outputs/phase-08/ci-evidence.md` の `verify-indexes-up-to-date` job 結果と、本 Phase の rebuild 結果を `outputs/phase-09/main.md` の末尾に対比表として記録する。

| 項目 | Phase 8 値 | Phase 9 値 | 差分 |
| --- | --- | --- | --- |
| rebuild exit code | (Phase 8 時点) | (本 Phase 時点) | (none / drift / fail) |
| indexes 差分 | (Phase 8 時点) | (本 Phase 時点) | (none / N files) |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | rebuild 総括 + Phase 8 整合表 |
| ログ | outputs/phase-09/indexes-rebuild.log | rebuild stdout/stderr |
| データ | outputs/phase-09/indexes-status.txt | `git status --porcelain` 出力 |
| ドキュメント | outputs/phase-09/indexes-diff.md | drift 内容（または「no drift」） |
| ドキュメント | outputs/phase-09/ci-spec-check.md | `verify-indexes.yml` 検査対象確認 |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] `mise exec -- pnpm indexes:rebuild` が exit code 0 で終了している
- [ ] `outputs/phase-09/indexes-rebuild.log` が保存されている
- [ ] `git status --porcelain .claude/skills/aiworkflow-requirements/indexes` の出力が空、または drift コミット方針が `outputs/phase-09/main.md` に記録されている
- [ ] `.github/workflows/verify-indexes.yml` の検査対象パスが現状の indexes ディレクトリと一致している
- [ ] Phase 8 evidence との整合表に MAJOR な差分がない

## DoD（implementation / NON_VISUAL）

- indexes drift がない、または drift を吸収するコミット方針が確定している
- CI の `verify-indexes-up-to-date` gate を pass できる前提が成立している
- 本 Phase の evidence 5 ファイルがすべて `outputs/phase-09/` 配下に揃っている

## 次 Phase

- 次: 10（レビュー + 整合確認）
- 引き継ぎ事項: rebuild 結果 / drift 有無 / CI gate 整合エビデンス
- ブロック条件: rebuild 失敗 / 永続的な indexes drift / `verify-indexes.yml` 検査対象不整合
