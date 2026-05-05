# Phase 11: NON_VISUAL evidence 収集

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL evidence 収集 |
| 作成日 | 2026-05-02 |
| 前 Phase | 10 (レビュー + 整合確認) |
| 次 Phase | 12 (実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま仕様書整備） |

## 目的

本タスクは `visualEvidence=NON_VISUAL` のため UI スクリーンショットを取らない。代わりに `_design/sync-jobs-spec.md` の正本性・横断参照健全性・実装整合性を grep ベース evidence で証明する。最低 3 種類の evidence ファイルを `outputs/phase-11/` 配下に保存し、Phase 12 の `manual-test-result.md` 代替として再利用できる構造にする。

## 実行タスク

1. cross-reference grep evidence の収集（03a / 03b / `database-schema.md` から `_design/sync-jobs-spec.md` への参照）
2. job_type enum coverage evidence の収集（実装値と `_design/` enum 一覧の差分が 0 件）
3. indexes drift check evidence の収集（Phase 9 の rebuild 結果スナップショット）
4. evidence ファイル 3 種を `outputs/phase-11/` 配下に保存
5. VISUAL evidence は不要（NON_VISUAL のため）であることを `outputs/phase-11/main.md` に明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | 横断参照のターゲット |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/ | 03b 側 spec |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md | 起票元 followup |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | Phase 8 編集結果 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | job_type enum 実装値 |
| 推奨 | outputs/phase-09/indexes-status.txt | indexes drift スナップショット |

## 実行手順（ステップ別）

### ステップ 1: cross-reference grep

```bash
rg -n "_design/sync-jobs-spec\.md|sync-jobs-spec\.md" \
  docs/30-workflows \
  .claude/skills/aiworkflow-requirements/references \
  > outputs/phase-11/grep-cross-references.txt
```

`outputs/phase-11/grep-cross-references.md` に下記表を構成:

| 参照元 | 参照行数 | 期待 | 結果 |
| --- | --- | --- | --- |
| 03a 側 task spec | (件数) | ≧1 | PASS/FAIL |
| 03b followup 起票元 | (件数) | ≧1 | PASS/FAIL |
| `database-schema.md` | (件数) | ≧1 | PASS/FAIL |

03a 側が未取り込みの場合は「N/A（03a 取り込み後の follow-up に分離）」と記録。

### ステップ 2: job_type enum coverage

```bash
rg -n "job_type|response_sync|schema_sync" \
  apps/api/src/jobs/sync-forms-responses.ts \
  apps/api/src/jobs/sync-lock.ts \
  apps/api/src/jobs/cursor-store.ts \
  > outputs/phase-11/job-type-impl.txt

rg -n "^\s*\|.*forms_(response|schema)_sync" \
  docs/30-workflows/_design/sync-jobs-spec.md \
  > outputs/phase-11/job-type-design.txt
```

`outputs/phase-11/job-type-enum-coverage.md` に対応表を作成:

| job_type | `_design/` 一覧 | 実装値 | 差分 |
| --- | --- | --- | --- |
| `response_sync` | (有/無) | (有/無) | (none/MAJOR) |
| `schema_sync` | (有/無) | (有/無) | (none/MAJOR) |

差分 MAJOR が 1 件でもあれば Phase 6 / 8 に差し戻し。

### ステップ 3: indexes drift check

Phase 9 の `outputs/phase-09/indexes-status.txt` をコピーまたは再収集:

```bash
mise exec -- pnpm indexes:rebuild > outputs/phase-11/indexes-rebuild.log 2>&1
git status --porcelain .claude/skills/aiworkflow-requirements/indexes \
  > outputs/phase-11/indexes-status.txt
```

`outputs/phase-11/indexes-drift-check.md` に下記表を記録:

| 項目 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| rebuild exit code | 0 | (実測) | PASS/FAIL |
| `git status` 行数 | 0 | (実測) | PASS/FAIL |

### ステップ 4: evidence 一覧の最終整理

`outputs/phase-11/main.md` に以下を記載:

- evidence 種別（最低 3 種）と各ファイルのパス
- VISUAL evidence は採取しない理由（taskType=implementation / visualEvidence=NON_VISUAL）
- Phase 12 `manual-test-result.md` での再利用方針（grep / indexes 結果を引き継ぐ）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL evidence 総括 |
| ドキュメント | outputs/phase-11/grep-cross-references.md | 横断参照 evidence |
| データ | outputs/phase-11/grep-cross-references.txt | grep 生出力 |
| ドキュメント | outputs/phase-11/job-type-enum-coverage.md | enum 整合 evidence |
| データ | outputs/phase-11/job-type-impl.txt | 実装側 grep |
| データ | outputs/phase-11/job-type-design.txt | `_design/` 側 grep |
| ドキュメント | outputs/phase-11/indexes-drift-check.md | indexes drift evidence |
| ログ | outputs/phase-11/indexes-rebuild.log | rebuild ログ |
| データ | outputs/phase-11/indexes-status.txt | `git status` 出力 |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] evidence 種別が最低 3 種類（cross-references / job_type coverage / indexes drift）揃っている
- [ ] 03a / 03b / `database-schema.md` のいずれかからは `_design/sync-jobs-spec.md` への参照が確認できる（03a 未取り込みの場合は注記付きで N/A）
- [ ] job_type enum で `_design/` と実装値の MAJOR 差分が 0 件
- [ ] indexes rebuild が exit 0 / `git status` 行数 0
- [ ] VISUAL evidence を採取していない（NON_VISUAL）旨が `main.md` に明記されている

## DoD（implementation / NON_VISUAL）

- evidence 3 種が `outputs/phase-11/` 配下に揃っている
- Phase 12 `manual-test-result.md` への引き継ぎ材料が完備されている
- すべて grep ベースで再現可能（コマンドが evidence ファイル内に記載されている）

## 次 Phase

- 次: 12（実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback）
- 引き継ぎ事項: evidence 3 種 / VISUAL 不要の根拠 / `manual-test-result.md` 代替方針
- ブロック条件: cross-reference 0 件 / enum MAJOR 差分 / indexes drift 残存
