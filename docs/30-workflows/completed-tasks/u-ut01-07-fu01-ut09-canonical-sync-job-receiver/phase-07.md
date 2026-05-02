# Phase 7: テストカバレッジ確認（AC マトリクス）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver（U-UT01-07-FU01） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テストカバレッジ確認（AC マトリクス） |
| 作成日 | 2026-05-01 |
| 前 Phase | 6（異常系検証） |
| 次 Phase | 8（DRY 化） |
| 状態 | spec_created |
| タスク分類 | implementation-receiver-canonical-handoff |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #333（CLOSED） |

## 目的

Phase 4 の検証 4 項目（V-1〜V-4）と Phase 6 の異常系 4 件 (a)〜(d) を、AC-1〜AC-4 を縦串に紐付け、**漏れゼロ・重複ゼロの 5 軸 AC マトリクス**（AC × Phase × 成果物 × 検証方法 × 担当者）として確定する。本タスクは implementation 分類だが、コード変更は UT-09 側で行うため、coverage 代替指標として「文書不変条件充足率」「`sync_log` 物理化 grep ヒット 0 件」「Phase 2 正本4ファイル参照率」の 3 種を採用する。

## 実行タスク

1. AC × Phase × 成果物 × 検証方法 × 担当者 の 5 軸 matrix を `outputs/phase-07/ac-matrix.md` に転記する（完了条件: 全 AC が最低 1 Phase × 1 成果物 × 1 検証方法 × 1 担当者で被覆）。
2. 漏れゼロ・重複ゼロ確認（完了条件: 未被覆 AC 0 件 / 各 AC で重複行が無い）。
3. coverage 代替指標 3 種を再掲し目標値・計測方法・出力先を確定（完了条件: 表完成）。
4. AC × V × 異常系の 3 軸 trace を Phase 4 / 6 から統合（完了条件: 3 軸全件で被覆）。
5. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を更新（完了条件: 各条件で根拠ファイル引用）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md | AC-1〜AC-4 の registry |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-04.md | V-1〜V-4 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-05.md | 6 ステップ runbook |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-06.md | 異常系 (a)〜(d) |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | Phase 2 正本4ファイル |

## AC × Phase × 成果物 × 検証方法 × 担当者 マトリクス

| AC# | AC 内容（要約） | Phase | 成果物 | 検証方法 | 担当者 | 関連 V | 関連異常系 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | Phase 5 step 1 | `outputs/phase-05/main.md` 冒頭の root path 表 | V-1（`find`/`ls` で root 1 件特定） | 本タスク | V-1 / V-2 | (a) / (b) |
| AC-2 | canonical 名 `sync_job_logs` / `sync_locks` が UT-09 必須参照・AC に反映 | Phase 5 step 2 / step 3 | UT-09 root の必須参照リスト + AC 追記 | V-2（4 ファイル絶対パス grep / AC 文言 grep） | 本タスク | V-1 / V-2 | (b) |
| AC-3 | `sync_log` 物理テーブル化禁止が明記 | Phase 5 step 3 / step 6 | UT-09 root AC + `outputs/phase-05/main.md` の CI script 方針 | V-3（`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` / `DROP TABLE sync_job_logs` 各 0 件 grep） | 本タスク + UT-09（CI 取込） | V-3 | (d) |
| AC-4 | U-UT01-08 / U-UT01-09 / UT-04 直交性維持 | Phase 5 step 4 + Phase 6 (c) | `outputs/phase-05/main.md` 直交性表 + `outputs/phase-06/main.md` (c) 検出 | V-4（enum / retry / offset / DDL の越境 grep 0 件） | 本タスク | V-4 | (c) / (d) |

### 漏れゼロ・重複ゼロ確認

- 未被覆 AC: 0 件（AC-1〜AC-4 すべてが 1 Phase + 1 成果物 + 1 検証方法 + 1 担当者で被覆）
- 重複行: 0 件（各 AC は 1 行 = 1 主担 Phase。複数 Phase の補助関与は「関連 V」「関連異常系」列で表現）
- 未参照 V-i: 0 件（V-1〜V-4 すべてが 1 AC 以上で参照）
- 未参照 異常系: 0 件（(a)〜(d) すべてが 1 AC 以上で参照）

## coverage 代替指標

| 指標 | 目標値 | 計測方法 | 出力先 |
| --- | --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-4 全件 PASS） | Phase 4 grep / Read コマンド全実行 | `outputs/phase-09/manual-smoke-log.md` |
| `sync_log` 物理化 grep ヒット | 0 件 | V-3 の 3 コマンド合計 | 同上 |
| Phase 2 正本4ファイル参照率 | 100% | V-2 の MISSING 出力なし | 同上 |

> line/branch coverage は本タスクでは不適用（コード実装は UT-09 側で行うため）。UT-09 実装側の coverage は UT-09 タスク本体で計測する。

## 計測対象 allowlist（本タスクで編集するファイル限定）

```
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-04.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-05.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-06.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-07.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/**/*.md
docs/30-workflows/unassigned-task/<UT-09 root>.md   # Phase 5 step 2/3/4 で編集
```

### 禁止パターン（広域指定）

```
apps/api/**       # 本タスクは apps/api を改変しない
apps/web/**       # 本タスクは apps/web を改変しない
.claude/**        # database-schema.md 直接編集は U-UT01-07 親 Phase 12 Step 1-A
scripts/**        # CI grep ガード script 実体は UT-09 実装側
**                # 全域指定禁止
```

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-1〜AC-4 が V-1〜V-4 + 異常系 (a)〜(d) で漏れなくトレース。UT-09 実装着手者が canonical 名 `sync_job_logs` / `sync_locks` で迷いなく確定可能。`sync_log` 物理化を grep ガードで再発防止 |
| 実現性 | PASS | 全検証が grep / find / Read のみで完結。`apps/api/**` 改変ゼロ。CI script は方針のみで本 Phase スコープに収まる |
| 整合性 | PASS（要 Phase 11 確認） | 本仕様書 ↔ U-UT01-07 Phase 2 正本4ファイル ↔ `apps/api/migrations/0002_sync_logs_locks.sql` ↔ `apps/api/src/jobs/sync-sheets-to-d1.ts` audit 結果 の 4 文書間で diff が Phase 11 manual-smoke-log で最終確認 |
| 運用性 | PASS | Phase 4 検証コマンドがコピペ実行可能。Phase 5 step 6 CI script 方針が UT-09 実装担当に曖昧さなく伝達。Phase 6 異常系の handoff 境界が明示 |

## 計測の証跡記録

```bash
# V-1〜V-4 全件実行（Phase 4 / Phase 9 で観測）
# 結果は outputs/phase-09/manual-smoke-log.md に追記

# UT-09 root 特定確認
find docs/30-workflows -type d -iname "*ut-09*"
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09"

# Phase 2 正本4ファイル参照率
for f in naming-canonical.md column-mapping-matrix.md backward-compatibility-strategy.md handoff-to-ut04-ut09.md; do
  grep -rln "$f" docs/30-workflows/ | grep -iE "ut-?09" || echo "MISSING: $f"
done

# sync_log 物理化 grep ヒット（3 件すべて 0 必須）
grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ docs/30-workflows/ | grep -v completed-tasks
grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/ docs/30-workflows/
grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/ docs/30-workflows/
```

## 実行手順

1. 5 軸 matrix を `outputs/phase-07/ac-matrix.md` に転記。
2. 漏れゼロ・重複ゼロ確認セクションを記述。
3. coverage 代替指標 3 種と allowlist / 禁止パターンを固定。
4. 4 条件評価を更新し根拠ファイルを引用。
5. Phase 9 引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化で Phase 5 runbook と Phase 6 異常系の重複定義崩れを matrix で検査 |
| Phase 9 | coverage 代替指標 3 種の実測 |
| Phase 10 | go-no-go 根拠として AC matrix 漏れ 0 件と 4 条件 PASS を参照 |
| Phase 11 | dead link / drift 残置の最終確認 |
| Phase 12 | (d) の drift 解消を U-UT01-07 親 Step 1-A 完了条件へ送る |
| UT-09 | 確定 canonical name + assertion 方針 + CI script 方針を引き継ぎ実装 |
| UT-04 | 確定 canonical name を migration 計画前提として参照 |

## 多角的チェック観点（AI が判断）

- 価値性: AC-1〜AC-4 が 5 軸で漏れなくトレースされるか。
- 実現性: 代替指標が implementation-receiver タスクの handoff 性質に適合するか。
- 整合性: Phase 4 / 5 / 6 のファイル名・V 番号・異常系 ID と diff ゼロ。
- 運用性: 計測コマンドが PR 上から再現可能（grep / find / Read のみ）か。
- 認可境界: `apps/api/**` / `database-schema.md` / `scripts/**` が allowlist に含まれていないこと。
- セキュリティ: matrix / allowlist に API token / OAuth / D1 binding 値が露出していないこと。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC × Phase × 成果物 × 検証方法 × 担当者 5 軸 matrix | spec_created |
| 2 | 漏れゼロ・重複ゼロ確認 | spec_created |
| 3 | coverage 代替指標 3 種 | spec_created |
| 4 | AC × V × 異常系 3 軸統合 | spec_created |
| 5 | 4 条件評価更新 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | 5 軸 matrix + 代替指標 + 4 条件評価 + 3 軸 trace |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC × Phase × 成果物 × 検証方法 × 担当者 matrix が 4 行 × 5 主軸列で空セル無し
- [ ] 漏れゼロ・重複ゼロ（未被覆 AC / V / 異常系 が各 0 件）
- [ ] 代替指標 3 種が目標値・計測方法・出力先付きで定義
- [ ] allowlist と禁止パターンが明記
- [ ] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [ ] Phase 9 引き継ぎ項目が箇条書き

## タスク 100% 実行確認【必須】

- 実行タスク 5 件すべて `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-4 の 4 行が全て埋まる
- 関連 V-i / 関連異常系 列が 1 つ以上参照
- coverage allowlist と Phase 5 / 6 の成果物パスが一致
- wrangler 直叩き / `apps/api/**` 編集が本ドキュメント内に 0 件

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化）
- 引き継ぎ事項:
  - AC matrix → Phase 10 go-no-go 根拠として再利用
  - 代替指標 3 種 → Phase 9 で実測値取得
  - 4 条件評価 → Phase 10 最終判定の入力
  - allowlist 広域指定禁止ルール → Phase 8 / 9 で逸脱防止
- ブロック条件:
  - AC matrix に空セル残存
  - allowlist が広域指定に変質
  - 4 条件のいずれかが FAIL のまま
