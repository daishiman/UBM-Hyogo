# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 03 |
| Phase 名称 | 設計レビュー |
| Wave | -（legacy / governance） |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | phase-02.md（設計） |
| 次 Phase | phase-04.md（テスト戦略） |
| 状態 | pending |

## 目的

Phase 02 の設計（責務移管マッピング・stale↔正本対応・schema ownership 宣言）に対し、3 案以上の代替を比較レビューし、PASS-MINOR-MAJOR 判定で採用案を確定する。direct 残責務 0 件と AC-1〜AC-14 全カバーを最終確認する。

## Alternative 案比較

### A 案: 旧 UT-09 を direct implementation として残す

| 観点 | 評価 |
| --- | --- |
| 価値 | 旧仕様の引き継ぎとしては最短だが、Sheets API と Forms API の二重正本が発生 |
| 整合性 | 不整合（現行 03a/03b と機能重複、`/admin/sync` と `/admin/sync/schema` `/admin/sync/responses` の endpoint 衝突） |
| 不変条件 | #1 違反リスク（schema を Sheets 側で固定）、#5 不変条件への影響なし |
| 運用性 | 二重 cron / 二重 secret / 二重 D1 audit テーブルが必要、運用負荷大 |
| 判定 | **MAJOR REJECT**（採用しない） |

### B 案: 旧 UT-09 を完全削除する

| 観点 | 評価 |
| --- | --- |
| 価値 | リポジトリのクリーンさが上がる |
| 整合性 | 過去の議論履歴（D1 競合対策の知見、`SQLITE_BUSY` retry/backoff、batch-size 制限）が失われる |
| トレーサビリティ | GitHub Issue #95 のクローズ理由が追跡しにくくなる |
| 運用性 | 「なぜ Forms 正本にしたか」を未来の実装者が再調査することになる |
| 判定 | **MINOR REJECT**（採用しない、知見保持のため） |

### C 案: legacy umbrella として保持し、責務を現行タスクに分散吸収（採用）

| 観点 | 評価 |
| --- | --- |
| 価値 | 二重正本を防ぎつつ、旧 UT-09 の品質要件（retry/backoff、batch-size、二重起動防止）を 03a/03b/09b に移植できる |
| 整合性 | 現行 03a / 03b / 04c / 09b / 02c と完全整合（責務移管表で direct 残責務 0 件）。さらに `docs/00-getting-started-manual/specs/03-data-fetching.md` の sync_jobs / cursor pagination / current response / consent snapshot 契約を直接踏襲しており、A 案/B 案/D 案ではこの spec への準拠が崩れる |
| 不変条件 | #1 / #5 / #6 / #7 すべて満たす |
| トレーサビリティ | Issue #95 のクローズ記録を本タスクが保持、将来の参照導線として機能 |
| 運用性 | docs-only のため運用負荷ゼロ。未タスク監査の reference example として再利用可能 |
| 判定 | **PASS**（採用） |

### 補助案 D: Issue を再オープンし新規 task に分割し直す（参考）

| 観点 | 評価 |
| --- | --- |
| 価値 | 過去 Issue の整理にはなるが、現行タスク 03a/03b/04c/09b が既に存在するため重複 |
| コスト | governance のみのために新規 issue / branch / PR を作るのは過剰 |
| 判定 | **MINOR REJECT** |

## PASS-MINOR-MAJOR 判定総括

| 判定軸 | 結果 |
| --- | --- |
| 採用案 | **C 案（legacy umbrella として保持し責務を分散吸収）** |
| 全体判定 | **PASS** |
| 残課題 | なし（OQ-1 sync_audit 読替は 02c/03a/03b の Phase 12 に委譲、OQ-2 PRAGMA WAL は不採用で確定） |
| MINOR 修正要否 | 不要 |
| MAJOR 修正要否 | 不要 |

## 責務移管網羅レビュー

Phase 02 責務移管マッピング表に対し、旧 UT-09 §4 Phase 構成（4 phase 分）の各責務が現行タスクに割り当てられたか再確認。

| 旧 UT-09 の Phase / 責務 | 現行タスク | 割当確認 |
| --- | --- | --- |
| Phase 1 stale 前提棚卸し | 本タスク Phase 02 stale↔正本対応表 | OK |
| Phase 2 責務移管確認 | 本タスク Phase 02 責務移管表 | OK |
| Phase 3 品質要件移植（retry/backoff、batch、短 tx） | 03a / 03b 異常系（Phase 6）、09b runbook | OK |
| Phase 4 監査検証（filename / 必須 9 セクション） | 本タスク Phase 09 品質保証 | OK |
| schema 取得 / upsert | 03a | OK |
| response 取得 / cursor / current resp | 03b | OK |
| 手動 trigger endpoint | 04c | OK |
| cron / pause / resume / evidence | 09b | OK |
| `sync_jobs` 排他 | 02c | OK |
| secret 配備 | インフラ + 03a/03b 利用側 | OK |

**direct 残責務: 0 件確定（AC-2 PASS）**

## レビュー結論

- **採用案: C（legacy umbrella + 責務分散吸収）**
- 全 AC（AC-1〜AC-14）が Phase 02 設計でカバーされる見通しが立った
- direct 残責務 0 件、二重正本リスクなし
- 不変条件 #1 / #5 / #6 / #7 への違反は本設計には存在しない
- 残 Open Question は次 Phase に持ち越すべきものなし、Phase 12 の docs 反映に委譲する OQ のみ

## 実行タスク

1. **代替案 A / B / C / D の評価表を作成**（完了条件: 4 案を価値・整合性・不変条件・運用性で比較）
2. **PASS-MINOR-MAJOR 判定を確定**（完了条件: 全体判定が PASS、残課題が文書化）
3. **責務移管網羅レビュー**（完了条件: direct 残責務 0 件を再確認）
4. **不変条件チェック**（完了条件: #1 / #5 / #6 / #7 違反 0 件）
5. **outputs/phase-03/main.md 生成**（完了条件: 上記レビュー結論が単一ファイルにまとまる）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象設計 |
| 必須 | outputs/phase-02/responsibility-mapping.md | 移管表 |
| 必須 | outputs/phase-01/main.md | AC / open questions |
| 必須 | CLAUDE.md | 不変条件参照 |
| 参考 | .claude/skills/automation-30/ | 多角的レビュー思考法（任意） |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | C 案採用の根拠（sync_jobs / cursor pagination / current response / consent snapshot 契約との整合） |

## 実行手順

```bash
# Step 1: Phase 02 出力を Read で取得
# Step 2: A/B/C/D 4 案を比較表化
# Step 3: PASS-MINOR-MAJOR 判定
# Step 4: 責務網羅レビュー（旧 UT-09 §4 Phase 1-4 + 各責務の割当確認）
# Step 5: 不変条件 #1/#5/#6/#7 セルフチェック
# Step 6: outputs/phase-03/main.md を生成
```

## 統合テスト連携

- レビュー結論（C 案採用 / 全体 PASS）は **Phase 04 テスト戦略** の前提として固定される
- direct 残責務 0 件確定は **Phase 07 AC マトリクス** の AC-2 トレースに直接使われる
- 不変条件チェック結果は **Phase 09 品質保証** の入力になる
- alternative 案の MINOR/MAJOR REJECT 理由は **Phase 12 documentation-changelog.md** に記録

## 多角的チェック観点（不変条件）

| 不変条件 | レビュー観点 |
| --- | --- |
| #1 schema 過剰固定回避 | A 案を MAJOR REJECT した理由として明記 |
| #5 apps/web → D1 直接禁止 | C 案の schema ownership 宣言で apps/api 側に集中していることを再確認 |
| #6 GAS prototype 不採用 | C 案の cron 委譲先が Workers Cron Triggers（09b）のみであることを確認 |
| #7 Form 再回答が本人更新 | response sync 正本が 03b 一本に集約されていることを確認 |

## サブタスク管理

- [ ] A 案（direct 実装維持）を評価
- [ ] B 案（完全削除）を評価
- [ ] C 案（legacy umbrella + 分散吸収、採用）を評価
- [ ] D 案（issue 再分割、参考）を評価
- [ ] PASS-MINOR-MAJOR 判定を確定
- [ ] 責務移管網羅レビューで direct 残責務 0 件を確認
- [ ] 不変条件 #1/#5/#6/#7 違反 0 件を確認
- [ ] outputs/phase-03/main.md を生成

## 成果物

- `outputs/phase-03/main.md`: 設計レビュー結果（4 案比較表 / PASS-MINOR-MAJOR / 責務網羅レビュー / 不変条件チェック / 採用結論）

## 完了条件（AC）

- [ ] alternative 案が 3 つ以上比較されている（A/B/C 必須、D 任意）
- [ ] PASS-MINOR-MAJOR 判定が記録されている
- [ ] 採用案が C で確定し、direct 残責務 0 件が明示されている
- [ ] 不変条件 #1/#5/#6/#7 違反 0 件
- [ ] outputs/phase-03/main.md が生成

## タスク 100% 実行確認

| 確認項目 | 期待値 | 実測値 |
| --- | --- | --- |
| 代替案数 | ≥ 3 件 | - |
| PASS 判定 | PASS（C 案） | - |
| direct 残責務 | 0 件 | - |
| 不変条件違反 | 0 件 | - |
| outputs/phase-03/main.md 生成 | 存在 | - |

## 次 Phase への引き渡し

Phase 04（テスト戦略）へ次を渡す:

1. 採用案 C の最終確定設計（Phase 02 出力をそのまま継承）
2. 不変条件チェック結果 → 04 で verify suite に組み込む
3. AC-1〜AC-14 のうち Phase 02/03 で fix 済みの項目（AC-1 / AC-2 / AC-3 / AC-4 / AC-8 / AC-11）と未確定項目（AC-5/6/7/9/10/12）の区分
4. docs-only / NON_VISUAL のため、Phase 04 では code 検証ではなく lint / 監査スクリプト中心の verify 設計を求める
