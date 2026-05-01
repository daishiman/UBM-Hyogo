# Phase 4: テスト作成（docs-only 読み替え＝文書検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（U-UT01-07） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（docs-only: 文書検証戦略） |
| 作成日 | 2026-04-30 |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（文書実体化 runbook） |
| 状態 | spec_created |
| タスク分類 | docs-only-design-reconciliation（test-strategy 縮約） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #261 |

## 目的

本タスクは設計 reconciliation のみで、コード変更も DDL 追加も含まない。したがって従来 Phase 4 の「テスト作成」は **文書整合性レビュー＝ doc 内容検証** に読み替える。Phase 2 で確定した canonical 命名・1:N マッピング表・後方互換 4 案比較・直交性チェックリスト・UT-04/UT-09 引き継ぎ事項を、第三者レビュアーが grep / Read で**機械的に検証可能な 7 項目の文書検証戦略**として定義し、Phase 6 の失敗系拡充と Phase 7 の AC matrix に渡せる粒度で固定する。

実装系 Phase 4 で言う「テストケース 8 件」「mapper contract」は本タスクでは「文書検証 7 項目」「AC-1〜AC-6 への trace 表」に置換する。コード変更が無いため line/branch coverage は適用せず、**「文書側不変条件の充足率」「漏れ検出 grep のヒット 0 件」を代替指標**として採用する。

## 実行タスク

1. 文書検証 7 項目（V-1〜V-7）を確定する（完了条件: 各項目に検証手段・合格条件・AC trace が揃う）。
2. 各 V-i に対し grep / Read コマンドベースの再現手順を記述する（完了条件: コピペで実行可能）。
3. 既存実装（`apps/api/migrations/0002_sync_logs_locks.sql` / `apps/api/src/jobs/sync-sheets-to-d1.ts`）を Read し、物理側に存在するカラム・関数・enum を抽出して検証 V-3 のベースライン表に固定する（完了条件: 物理側カラム列挙が成果物に存在）。
4. coverage 代替指標（文書不変条件 3 種）を定義する（完了条件: 計測コマンドと出力先が記述）。
5. AC-1〜AC-6 × V-1〜V-7 の trace 表を草案する（完了条件: 全 AC が最低 1 検証項目で被覆）。
6. UT-04 / UT-09 / U-8 / U-9 への引き継ぎ contract（本タスクが決定する／決定しない事項）を不変条件として明示する（完了条件: 「決定」「未決定」が明確に分離）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | 命名 canonical の正本 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | 1:N マッピング表 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | 4 案比較表 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | U-8 / U-9 直交性チェックリスト |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | 論理 13 カラム source |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（Read のみ・改変権限なし） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理側利用フロー（Read / Grep のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 仕様 drift 検出対象 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL 縮約テンプレ |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-04.md | 書式準拠元 |

## 文書検証 7 項目（V-1〜V-7）

| # | 検証項目 | 検証手段 | 合格条件 | AC trace |
| - | --- | --- | --- | --- |
| V-1 | canonical 命名一意性 | `grep -rn "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` で出現箇所を列挙し、全箇所で「概念名（注釈付き）」「物理名 = `sync_job_logs` / `sync_locks`」のいずれかとして判別可能か目視レビュー | 物理表記と概念表記の混同 0 件、新ドキュメント内で canonical 採択名（A: 物理寄せ / C: 概念降格）が一貫 | AC-1 |
| V-2 | マッピング表完全性 | UT-01 phase-02 sync-log-schema.md の 13 カラムを抽出し、Phase 2 column-mapping-matrix.md に全件登場することを行数 diff で確認 | 13 カラム漏れ 0、判定空欄（物理対応 / 物理未実装 / 不要 のいずれか）0 | AC-2 |
| V-3 | 既存実装との整合 | `apps/api/migrations/0002_sync_logs_locks.sql` を Read し物理側全カラム / index / unique / FK を列挙、`apps/api/src/jobs/sync-sheets-to-d1.ts` を Grep し ledger 書込・lock 取得関数を列挙、両者がマトリクス左欄（物理側）に揃って記載されていることを確認 | 物理側に存在するカラム / 関数のうち matrix 未掲載のものが 0 件 | AC-2 / AC-4 |
| V-4 | 4 案比較表完全性 | Phase 2 backward-compatibility-strategy.md に no-op / view / rename / 新テーブル+移行 の 4 案が「破壊性 / 実装コスト / 監査連続性 / rollback 容易性」の 4 軸で評価され、採択 1 件 / 却下 3 件にすべて理由が付されていることを目視 | 4 案 × 4 軸 = 16 セル全埋め、採択案がデータ消失非伴の戦略であることが明記 | AC-3 |
| V-5 | 直交性チェックリスト存在 | Phase 2 handoff-to-ut04-ut09.md を Read し、本タスクが「enum 値 / retry 値 / offset 値の決定を含まない」ことを宣言するチェックボックスが存在することを確認 | チェック項目 5 件以上（U-8 enum、U-9 retry、U-9 offset、shared schema 実装、physical migration 発行）が明記 | AC-5 |
| V-6 | UT-04 / UT-09 引き継ぎ網羅 | Phase 2 成果物に「UT-04 への引き継ぎ事項」「UT-09 への引き継ぎ事項」セクションが独立して存在し、それぞれ canonical name / migration 戦略 / 未決定事項を箇条書き化していることを確認 | 各下流タスク向けに「決定事項」「未決定で下流に委ねる事項」が分離記述 | AC-4 |
| V-7 | aiworkflow-requirements drift 検出 | `grep -n "sync_log\|sync_job_logs\|sync_locks" .claude/skills/aiworkflow-requirements/references/database-schema.md` を実行し、`sync_log` 単独表記（物理名と整合しない記述）が残っているか抽出。drift があれば Phase 5 runbook で更新案として申し送り | drift 件数を Phase 2 成果物に記録、drift 0 件または更新案が成果物に存在 | AC-6 |

合計 7 項目（要件 7 項目を満たす）。

## 検証手段の再現コマンド集

```bash
# V-1: canonical 命名一意性
grep -rn "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# V-2: マッピング表完全性（13 カラムの行数チェック）
grep -c '^| ' docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md

# V-3: 既存実装との整合
#   物理側 DDL を Read
#   apps/api/migrations/0002_sync_logs_locks.sql
#   ledger 書込・lock 取得を Grep
grep -n "sync_job_logs\|sync_locks\|INSERT\|UPDATE\|acquireLock\|releaseLock" \
  apps/api/src/jobs/sync-sheets-to-d1.ts

# V-4: 4 案比較表完全性
grep -c '^| ' docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md

# V-5: 直交性チェックリスト存在
grep -n "U-8\|U-9\|enum\|retry\|offset" \
  docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md

# V-6: UT-04 / UT-09 引き継ぎ網羅
grep -n "UT-04\|UT-09\|引き継ぎ\|handoff" \
  docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md

# V-7: aiworkflow-requirements drift 検出
grep -n "sync_log\|sync_job_logs\|sync_locks" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

> wrangler / D1 / DDL 操作は本タスクスコープ外のため、検証は **静的 grep / Read のみ** で完結する。

## coverage 代替指標（docs-only 読み替え）

line/branch coverage は適用不可。代替指標を採用する:

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-7 全件 PASS） | grep / Read 結果を Phase 6 / Phase 9 で観測 |
| canonical 命名 drift ヒット | 0 件 | V-1 の grep 結果に「物理名と整合しない `sync_log` 単独表記」が無いこと |
| 13 カラム被覆率 | 100% | V-2 の行数 diff = 13 |

## AC × V trace 草案（Phase 7 で最終確定）

| AC# | 内容（要約） | 主担 V | 補助 V |
| --- | --- | --- | --- |
| AC-1 | canonical 命名決定と採択理由 | V-1 | V-4 |
| AC-2 | 1:N マッピング表 | V-2 | V-3 |
| AC-3 | 後方互換 4 案比較 | V-4 | - |
| AC-4 | UT-04 への migration 戦略引き継ぎ | V-6 | V-3 |
| AC-5 | U-8 / U-9 直交性 | V-5 | - |
| AC-6 | aiworkflow-requirements drift 解消 | V-7 | - |

> 全 AC が最低 1 検証項目で被覆されている（未被覆セル 0）。最終 matrix は Phase 7 で確定。

## 実行手順

1. 7 検証項目を `outputs/phase-04/test-strategy.md` に転記する。
2. 各検証項目に grep / Read コマンドを付し、コピペで再現可能な状態にする。
3. V-3 のため `apps/api/migrations/0002_sync_logs_locks.sql` と `apps/api/src/jobs/sync-sheets-to-d1.ts` を Read し、物理側カラム列挙のベースラインを成果物末尾に貼る。
4. AC trace 草案を Phase 7 の入力として固定する。
5. UT-04 / UT-09 / U-8 / U-9 引き継ぎ contract を不変条件として明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 文書実体化 runbook が 7 検証項目を pass する状態を到達条件にする |
| Phase 6 | 失敗系 5 件（誤新規 CREATE / rename 後追い / idempotency 誤追加 / U-8 enum 混入 / drift 残置）を 7 項目に対応付ける |
| Phase 7 | AC × V × 失敗系の 3 軸 matrix に流し込み、未被覆セル 0 件を確認 |
| UT-04 phase-04 | 本タスク決定の canonical name / mapping を migration 計画の前提として参照 |
| UT-09 phase-04 | canonical name を ledger 書込先テーブル名として参照 |

## 多角的チェック観点（AI が判断）

- 価値性: AC-1〜AC-6 が V-1〜V-7 で漏れなく被覆されているか。
- 実現性: grep / Read のみで全項目が静的検証可能か（実 D1 / wrangler 不要）。
- 整合性: V-3 の物理側列挙が `0002_sync_logs_locks.sql` の DDL と diff ゼロか。
- 運用性: コマンドが `scripts/cf.sh` を要求しない（DB アクセス無し）静的検証で完結するか。
- 認可境界: 既存物理 DDL / コードに対する書込操作が検証手段に含まれていないか。
- セキュリティ: 検証手段に API token / secret / OAuth 値が露出していないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 文書検証 7 項目確定 | spec_created |
| 2 | grep / Read 再現コマンド集 | spec_created |
| 3 | 物理側ベースライン抽出（V-3） | spec_created |
| 4 | coverage 代替指標 3 種 | spec_created |
| 5 | AC × V trace 草案 | spec_created |
| 6 | UT-04 / UT-09 引き継ぎ contract | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 文書検証 7 項目 + 再現コマンド + 代替指標 + AC trace 草案 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 文書検証 7 項目（V-1〜V-7）が手段・合格条件・AC trace 付きで列挙
- [ ] 各 V-i に grep / Read コマンドが付され再現可能
- [ ] V-3 の物理側ベースラインが `0002_sync_logs_locks.sql` の Read 結果と整合
- [ ] coverage 代替指標 3 種が目標値・計測方法付きで記述
- [ ] AC-1〜AC-6 すべてが最低 1 つの V-i で被覆
- [ ] UT-04 / UT-09 / U-8 / U-9 引き継ぎ contract が不変条件として明示
- [ ] wrangler / 実 D1 操作が検証手段に含まれていないこと

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC-1〜AC-6 すべてに 1 つ以上の V-i が対応
- 物理 DDL / コード変更を伴う検証手段が 0 件
- wrangler 直叩きが本ドキュメント内に 0 件

## 次 Phase への引き渡し

- 次 Phase: 5（文書実体化 runbook）
- 引き継ぎ事項:
  - V-1〜V-7 の合格状態が Phase 5 完了の前提
  - V-3 物理側ベースラインを Phase 5 の「物理側変更ゼロ」検証に流用
  - V-7 の drift 検出結果を Phase 5 runbook の Step 1-A（aiworkflow-requirements 更新）で利用
  - AC trace 草案 → Phase 7 ac-matrix.md の確定入力
- ブロック条件:
  - 13 カラムのいずれかが mapping-matrix に未登場
  - V-1 の grep で物理名混同が 1 件でも残存
  - 4 案比較表に未確定セル（採否理由空欄）が残存
