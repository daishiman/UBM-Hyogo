# Phase 10: レビュー + 整合確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 10 / 13 |
| Phase 名称 | レビュー + 整合確認 |
| 作成日 | 2026-05-02 |
| 前 Phase | 9 (indexes 再生成 + drift 検証) |
| 次 Phase | 11 (NON_VISUAL evidence 収集) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま仕様書整備） |

## 目的

Phase 1〜9 の成果物に対して 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）と 3 面整合（03a / 03b / 実装）を再実施し、`_design/sync-jobs-spec.md` の正本仕様が以下と矛盾なく一致しているかをレビューする。本タスクは implementation かつ solo 運用のためユーザー承認は NOT_REQUIRED だが、自己レビューの結論は `outputs/phase-10/review-summary.md` として記録する。

- 03a side（schema sync）の想定 `job_type` / `metrics_json` 形
- 03b side（response sync）の現行実装値（lock TTL 10 分 / `metrics_json.cursor` 仕様）
- `apps/api/src/jobs/sync-forms-responses.ts` の実装

## 実行タスク

1. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を再実施し、各条件に PASS/MAJOR/MINOR を付ける
2. 3 面整合（03a spec / 03b spec / `sync-forms-responses.ts`）の差分一覧を `outputs/phase-10/cross-check.md` に再構築する
3. `metrics_json` 共通 schema が PII を含まないこと（INV-1）を schema 定義レベルで再確認する
4. lock TTL 10 分の正本値が、`apps/api/src/jobs/sync-lock.ts` の実装値と一致することを `rg` で確認する
5. open question 残件（Phase 1 で挙げた Q1〜Q3）が Phase 2〜9 で解消されたか棚卸しする
6. 残課題があれば「本タスク内で解消」「別 follow-up に分離」のいずれかを判定する
7. ユーザー承認は不要（NOT_REQUIRED）だが、判定結果を `outputs/phase-10/review-summary.md` に署名行（自己レビュー / 日付 / コミット SHA）付きで記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | レビュー対象（Phase 6 成果） |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 の根拠 |
| 必須 | outputs/phase-05/main.md | 棚卸し結果（3 面差分の起点） |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 03b 実装（lock TTL 10 分の根拠） |
| 必須 | apps/api/src/jobs/sync-lock.ts | lock TTL 実装値 |
| 必須 | apps/api/src/jobs/cursor-store.ts | `metrics_json.cursor` 実装 |
| 推奨 | .claude/skills/aiworkflow-requirements/references/database-schema.md | Phase 8 編集結果 |

## 実行手順（ステップ別）

### ステップ 1: 4 条件評価の再実施

| 条件 | 問い | 期待判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | `_design/` 集約で同期更新漏れ・drift リスクが解消されたか | PASS | Phase 6 成果の正本性 |
| 実現性 | implementation / Phase 1〜9 で完遂できたか | PASS | Phase 9 の indexes drift 解消 |
| 整合性 | AC-1〜AC-10 すべてに evidence が紐づいているか | PASS | 各 Phase の `outputs/phase-XX/main.md` |
| 運用性 | 後続 sync wave 追加時に `_design/` 経由で更新できる導線があるか | PASS | Phase 7 の参照差し替え + Phase 8 の `database-schema.md` 参照化 |

各条件で MAJOR が出た場合は本タスクをここで stop し、該当 Phase に差し戻す。

### ステップ 2: 3 面整合の再構築

```bash
rg -n "job_type|metrics_json|lock_acquired_at|lock_ttl|10\s*\*\s*60|600000" \
  docs/30-workflows/_design/sync-jobs-spec.md \
  docs/30-workflows/03b-followup-005-sync-jobs-design-spec \
  apps/api/src/jobs \
  > outputs/phase-10/cross-check-grep.txt
```

`outputs/phase-10/cross-check.md` に下記表を埋める:

| 項目 | `_design/` 値 | 03b spec 参照 | 実装値 | 整合 |
| --- | --- | --- | --- | --- |
| `job_type` enum | (一覧) | (参照のみ) | (`sync-forms-responses.ts` の値) | PASS/FAIL |
| `metrics_json.cursor` | (schema) | (参照のみ) | (`cursor-store.ts` の値) | PASS/FAIL |
| lock TTL | 10 分 | (参照のみ) | (`sync-lock.ts` の値) | PASS/FAIL |

### ステップ 3: PII 不混入チェック（INV-1）

`_design/sync-jobs-spec.md` の `metrics_json` schema 内に下記 token が出ないことを `rg` で確認:

```bash
rg -n "email|name|phone|address|response_email|displayName" \
  docs/30-workflows/_design/sync-jobs-spec.md \
  > outputs/phase-10/pii-grep.txt
```

検出 0 件であること。検出があれば schema 定義の問題なので Phase 6 に差し戻す。

### ステップ 4: lock TTL 整合（INV-4）

```bash
rg -n "lock_acquired_at|10\s*\*\s*60|TEN_MINUTES|LOCK_TTL" apps/api/src/jobs > outputs/phase-10/lock-ttl-grep.txt
```

`_design/sync-jobs-spec.md` 記載値と一致していることを `outputs/phase-10/cross-check.md` に追記。

### ステップ 5: open question 棚卸し

Phase 1 で挙げた Q1〜Q3 を `outputs/phase-10/open-questions.md` に再掲し、各々:

- 解消（どの Phase で）
- 残（理由 + 引き取り先）

を 1 行ずつ記録。残件は Phase 12 の `unassigned-task-detection.md` に引き継ぐ。

### ステップ 6: 残課題の判定

| 残課題 | 判定 | 引き取り先 |
| --- | --- | --- |
| (例) 03a 側 task spec 未取り込み時の参照差し替え | 別 follow-up | 03a 取り込み後タスク |
| (例) 実装と schema 乖離 | 別 follow-up | `unassigned-task` 配下 |

### ステップ 7: 自己レビュー署名

`outputs/phase-10/review-summary.md` 末尾に下記を記載:

```
自己レビュー: daishiman
日付: 2026-05-02
コミット SHA: <Phase 9 末尾の HEAD>
判定: APPROVED（implementation / NOT_REQUIRED）
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | レビュー総括 |
| ドキュメント | outputs/phase-10/review-summary.md | 4 条件 + 自己レビュー署名 |
| ドキュメント | outputs/phase-10/cross-check.md | 3 面整合表 |
| データ | outputs/phase-10/cross-check-grep.txt | grep 生出力 |
| データ | outputs/phase-10/pii-grep.txt | PII 検査 grep |
| データ | outputs/phase-10/lock-ttl-grep.txt | lock TTL grep |
| ドキュメント | outputs/phase-10/open-questions.md | open question 棚卸し |
| メタ | artifacts.json | Phase 10 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] 4 条件すべてが PASS、または MAJOR がない
- [ ] 3 面整合表で `job_type` / `metrics_json.cursor` / lock TTL すべてが PASS
- [ ] PII 検査 grep の検出が 0 件
- [ ] lock TTL の実装値と `_design/` 値が一致
- [ ] open question Q1〜Q3 がすべて解消、または引き取り先が確定
- [ ] 残課題はすべて「本タスク内で解消」または「別 follow-up」に分類済み
- [ ] 自己レビュー署名が `review-summary.md` 末尾に記録されている

## DoD（implementation / NON_VISUAL）

- レビュー結果に MAJOR がない
- 残課題は Phase 12 `unassigned-task-detection.md` への引き継ぎ準備が整っている
- ユーザー承認は不要（NOT_REQUIRED）

## 次 Phase

- 次: 11（NON_VISUAL evidence 収集）
- 引き継ぎ事項: 4 条件結果 / 3 面整合表 / 残課題リスト
- ブロック条件: 4 条件で MAJOR / 3 面整合 FAIL / PII 検出
