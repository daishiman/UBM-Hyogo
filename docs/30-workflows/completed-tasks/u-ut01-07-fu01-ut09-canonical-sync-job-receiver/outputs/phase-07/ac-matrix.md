# Phase 7 成果物: ac-matrix.md（AC × Phase × 成果物 × 検証方法 × 担当者 5 軸 matrix）

Phase 4 V-1〜V-4 と Phase 6 異常系 (a)〜(d) を AC-1〜AC-4 に紐付けた **漏れゼロ・重複ゼロの 5 軸 AC マトリクス**。本タスクは implementation 分類だが、コード変更は UT-09 側で行うため、coverage 代替指標として「文書不変条件充足率」「`sync_log` 物理化 grep ヒット 0 件」「Phase 2 正本4ファイル参照率」の 3 種を採用する。

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| Phase 名称 | テストカバレッジ確認（AC マトリクス） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 関連 Issue | #333（CLOSED） |

---

## 1. AC × Phase × 成果物 × 検証方法 × 担当者 5 軸 matrix

| AC# | AC 内容（要約） | Phase | 成果物 | 検証方法 | 担当者 | 関連 V | 関連異常系 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | UT-09 実装タスク root の実パス確定 | Phase 5 step 1 | `outputs/phase-05/main.md` 冒頭の root path 表（UT-21 採択） | V-1（`find`/`ls` で root 1 件特定） | 本タスク | V-1 / V-2 | (a) / (b) |
| AC-2 | canonical 名 `sync_job_logs` / `sync_locks` が UT-09 必須参照・AC に反映 | Phase 5 step 2 / step 3 | UT-09 root（UT-21）の必須参照リスト + AC 追記 | V-2（4 ファイル絶対パス grep / AC 文言 grep） | 本タスク | V-1 / V-2 | (b) |
| AC-3 | `sync_log` 物理テーブル化禁止が明記 | Phase 5 step 3 / step 6 | UT-09 root AC + `outputs/phase-05/main.md` の CI script 方針 | V-3（`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` / `DROP TABLE sync_job_logs` 各 0 件 grep） | 本タスク + UT-09（CI 取込） | V-3 | (d) |
| AC-4 | U-UT01-08 / U-UT01-09 / UT-04 直交性維持 | Phase 5 step 4 + Phase 6 (c) | `outputs/phase-05/main.md` 直交性表 + `outputs/phase-06/main.md` (c) 検出 | V-4（enum / retry / offset / DDL の越境 grep 0 件） | 本タスク | V-4 | (c) / (d) |

---

## 2. 漏れゼロ・重複ゼロ確認

| 観点 | 結果 |
| --- | --- |
| 未被覆 AC | **0 件**（AC-1〜AC-4 すべてが 1 Phase + 1 成果物 + 1 検証方法 + 1 担当者で被覆） |
| 重複行 | **0 件**（各 AC は 1 行 = 1 主担 Phase。複数 Phase の補助関与は「関連 V」「関連異常系」列で表現） |
| 未参照 V-i | **0 件**（V-1〜V-4 すべてが 1 AC 以上で参照: V-1 → AC-1/AC-2 / V-2 → AC-1/AC-2 / V-3 → AC-3 / V-4 → AC-4） |
| 未参照 異常系 | **0 件**（(a)〜(d) すべてが 1 AC 以上で参照: (a) → AC-1 / (b) → AC-1/AC-2 / (c) → AC-4 / (d) → AC-3/AC-4） |

---

## 3. coverage 代替指標

implementation 分類だが、コード実装は UT-09 側で行うため、line/branch coverage は不適用。代わりに以下 3 種を採用する。

| 指標 | 目標値 | 計測方法 | 出力先 |
| --- | --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-4 全件 PASS） | Phase 4 grep / Read コマンド全実行 | `outputs/phase-09/manual-smoke-log.md` |
| `sync_log` 物理化 grep ヒット | 0 件 | V-3 の 3 コマンド合計 | 同上 |
| Phase 2 正本4ファイル参照率 | 100% | V-2 の MISSING 出力なし | 同上 |

> line/branch coverage は本タスクでは不適用（コード実装は UT-09 側で行うため）。UT-09 実装側の coverage は UT-09 タスク本体で計測する。

---

## 4. 計測対象 allowlist（本タスクで編集するファイル限定）

```
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/index.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-04.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-05.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-06.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-07.md
docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/**/*.md
docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md  # Phase 5 step 2/3/4 で編集
```

### 禁止パターン（広域指定 / 越境）

```
apps/api/**       # 本タスクは apps/api を改変しない
apps/web/**       # 本タスクは apps/web を改変しない
.claude/**        # database-schema.md 直接編集は U-UT01-07 親 Phase 12 Step 1-A
scripts/**        # CI grep ガード script 実体は UT-09 実装側
**                # 全域指定禁止
```

---

## 5. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | **PASS（高）** | AC-1〜AC-4 が V-1〜V-4 + 異常系 (a)〜(d) で漏れなくトレース。UT-09 実装着手者が canonical 名 `sync_job_logs` / `sync_locks` で迷いなく確定可能。`sync_log` 物理化を grep ガードで再発防止。根拠: `outputs/phase-04/test-strategy.md` 第 2/6 節 + `outputs/phase-05/main.md` 第 0/9 節 |
| 実現性 | **PASS** | 全検証が grep / find / Read のみで完結。`apps/api/**` 改変ゼロ。CI script は方針のみで本 Phase スコープに収まる。根拠: `outputs/phase-05/main.md` 第 7/8 節（禁止操作 0 件）+ `outputs/phase-05/audit-log.md`（read-only audit） |
| 整合性 | **PASS（要 Phase 11 確認）** | 本仕様書 ↔ U-UT01-07 Phase 2 正本4ファイル ↔ `apps/api/migrations/0002_sync_logs_locks.sql` ↔ `apps/api/src/jobs/sync-sheets-to-d1.ts` audit 結果（line 313/337/369）の 4 文書間で diff が Phase 11 manual-smoke-log で最終確認。根拠: `outputs/phase-05/audit-log.md` 第 3 節 |
| 運用性 | **PASS** | Phase 4 検証コマンドがコピペ実行可能。Phase 5 step 6 CI script 方針が UT-09 実装担当に曖昧さなく伝達。Phase 6 異常系の handoff 境界が明示。根拠: `outputs/phase-04/test-strategy.md` 第 3 節 + `outputs/phase-06/main.md` 第 4 節 |

---

## 6. 計測の証跡記録（Phase 9 で実測）

```bash
# V-1〜V-4 全件実行（Phase 4 / Phase 9 で観測）
# 結果は outputs/phase-09/manual-smoke-log.md に追記

# UT-09 root 特定確認
find docs/30-workflows -type d -iname "*ut-09*"
ls docs/30-workflows/unassigned-task/ | grep -iE "ut-?09|UT-21"

# Phase 2 正本4ファイル参照率
for f in naming-canonical.md column-mapping-matrix.md backward-compatibility-strategy.md handoff-to-ut04-ut09.md; do
  grep -rln "$f" docs/30-workflows/ | grep -iE "ut-?09|UT-21" || echo "MISSING: $f"
done

# sync_log 物理化 grep ヒット（3 件すべて 0 必須）
grep -rn "CREATE TABLE sync_log\b" apps/api/migrations/ docs/30-workflows/ | grep -v completed-tasks
grep -rn "ALTER TABLE sync_job_logs RENAME" apps/api/migrations/ docs/30-workflows/
grep -rn "DROP TABLE sync_job_logs" apps/api/migrations/ docs/30-workflows/
```

---

## 7. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化で Phase 5 runbook と Phase 6 異常系の重複定義崩れを matrix で検査 |
| Phase 9 | coverage 代替指標 3 種の実測 |
| Phase 10 | go-no-go 根拠として AC matrix 漏れ 0 件と 4 条件 PASS を参照 |
| Phase 11 | dead link / drift 残置の最終確認 |
| Phase 12 | (d) の drift 解消を U-UT01-07 親 Step 1-A 完了条件へ送る |
| UT-09 | 確定 canonical name + assertion 方針 + CI script 方針を引き継ぎ実装 |
| UT-04 | 確定 canonical name を migration 計画前提として参照 |

---

## 8. 完了条件チェック

- [x] AC × Phase × 成果物 × 検証方法 × 担当者 matrix が 4 行 × 5 主軸列で空セル無し
- [x] 漏れゼロ・重複ゼロ（未被覆 AC / V / 異常系 が各 0 件）
- [x] 代替指標 3 種が目標値・計測方法・出力先付きで定義
- [x] allowlist と禁止パターンが明記
- [x] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [x] Phase 9 引き継ぎ項目が箇条書き

---

## 9. 次 Phase への引き渡し

- AC matrix → Phase 10 go-no-go 根拠として再利用
- 代替指標 3 種 → Phase 9 で実測値取得
- 4 条件評価 → Phase 10 最終判定の入力
- allowlist 広域指定禁止ルール → Phase 8 / 9 で逸脱防止

---

## 10. タスク 100% 実行確認

- [x] 実行タスク 5 件すべて `spec_created`
- [x] 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- [x] AC-1〜AC-4 の 4 行が全て埋まる
- [x] 関連 V-i / 関連異常系 列が 1 つ以上参照
- [x] coverage allowlist と Phase 5 / 6 の成果物パスが一致
- [x] wrangler 直叩き / `apps/api/**` 編集が本ドキュメント内に 0 件
