# Phase 7: テストカバレッジ確認（docs-only 読み替え＝AC matrix）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（U-UT01-07） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テストカバレッジ確認（docs-only: AC matrix） |
| 作成日 | 2026-04-30 |
| 前 Phase | 6（失敗系拡充） |
| 次 Phase | 8（DRY 化） |
| 状態 | spec_created |
| タスク分類 | docs-only-design-reconciliation（traceability 縮約） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 関連 Issue | #261 |

## 目的

Phase 4 の文書検証 7 項目（V-1〜V-7）と Phase 6 の失敗系 5 件 (a)〜(e) を、index.md で定義された AC-1〜AC-6 を縦串に縦串に紐付け、**未被覆セルを 0 にする 3 軸 matrix**（AC × 検証項目 × 失敗系）として確定する。schema 宣言タスクと違いコード変更ゼロのため line/branch coverage は適用せず、文書不変条件 3 種（充足率 / drift ヒット / 13 カラム被覆率）を coverage 代替指標として用いる。

## 実行タスク

1. AC × 検証項目 × 失敗系の 3 軸 matrix を `outputs/phase-07/ac-matrix.md` に転記する（完了条件: 全 AC が最低 1 V-i + 最低 1 失敗系で被覆）。
2. 未被覆セルが 0 件であることを確認する（完了条件: AC × V matrix と AC × 失敗系 matrix の双方で空セル無し）。
3. coverage 代替指標 3 種（文書不変条件充足率 / canonical 命名 drift ヒット / 13 カラム被覆率）を再掲し、目標値・計測方法・出力先を確定する（完了条件: 表が完成）。
4. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を Phase 4〜6 の成果物を踏まえて更新する（完了条件: 各条件で根拠ファイルが引用される）。
5. Phase 9 への引き継ぎ項目（実測値の取得方法・gap 分析の入力）を予約する（完了条件: 箇条書きで明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/index.md | AC-1〜AC-6 の唯一の registry |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | AC 出典（issue #261 本文） |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-04.md | V-1〜V-7 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-05.md | 文書実体化 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-06.md | 失敗系 (a)〜(e) |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 計測対象 |

## AC × 検証項目 × 失敗系 matrix

| AC# | AC 内容（要約） | 主担 V | 補助 V | 関連失敗系 |
| --- | --- | --- | --- | --- |
| AC-1 | canonical 命名決定と採択理由（破壊的変更コスト評価を含む） | V-1 | V-4 | (a) |
| AC-2 | 論理 13 カラム × 物理 1:N マッピング表 | V-2 | V-3 | (c) |
| AC-3 | 後方互換 4 案比較（no-op / view / rename / 新テーブル+移行） | V-4 | - | (b) |
| AC-4 | UT-04 への migration 戦略引き継ぎ | V-6 | V-3 | (a) |
| AC-5 | U-8 / U-9 直交性確認 | V-5 | - | (d) |
| AC-6 | aiworkflow-requirements `database-schema.md` drift 解消 | V-7 | - | (e) |

### 被覆検証

- 未被覆 AC: 0 件（AC-1〜AC-6 すべてが 1 V-i 以上 + 1 失敗系以上で被覆）
- 未参照 V-i: 0 件（V-1〜V-7 すべてが 1 AC 以上で参照）
- 未参照 失敗系: 0 件（(a)〜(e) すべてが 1 AC 以上で参照）

## coverage 代替指標

| 指標 | 目標値 | 計測方法 | 出力先 |
| --- | --- | --- | --- |
| 文書不変条件の充足率 | 100%（V-1〜V-7 全件 PASS） | Phase 4 grep / Read コマンド全実行 | `outputs/phase-09/manual-smoke-log.md` |
| canonical 命名 drift ヒット | 0 件 | V-1 grep 結果に物理名混同が無い | 同上 |
| 13 カラム被覆率 | 100% | V-2 行数 diff = 13 | 同上 |

> line/branch coverage は本タスクでは不適用。schema / コード変更ゼロのため。

## 計測対象 allowlist（変更ファイル限定）

```
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/index.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-04.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-05.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-06.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-07.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-04/test-strategy.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-05/main.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-05/aiworkflow-requirements-update-proposal.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-06/main.md
docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-07/ac-matrix.md
```

### 禁止パターン（広域指定）

```
apps/api/**       # 本タスクは apps/api を改変しない
apps/web/**       # 本タスクは apps/web を改変しない
.claude/**        # database-schema.md の直接編集は Phase 12 Step 1-A
**                # 全域指定禁止
```

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC-1〜AC-6 が V-1〜V-7 と失敗系 (a)〜(e) で漏れなくトレース。UT-04 / UT-09 着手前提として canonical name / mapping / migration 戦略が確定。`outputs/phase-02/naming-canonical.md` 等 4 ファイルが下流参照点となる |
| 実現性 | PASS | 全検証が grep / Read のみで完結（実 D1 / wrangler / コード実行不要）。`scripts/cf.sh` 経由の操作も本タスクでは不要 |
| 整合性 | PASS（要 Phase 11 確認） | 本仕様書 ↔ Phase 2 成果物 ↔ `apps/api/migrations/0002_sync_logs_locks.sql` ↔ `database-schema.md` の 4 文書間で diff が Phase 11 link-checklist と manual-smoke-log で最終確認される。AC-2 / AC-6 が責務 |
| 運用性 | PASS | Phase 4 検証コマンドがコピペ実行可能。Phase 6 文書ガードが具体的位置 + 強度付き。Phase 5 で `database-schema.md` の編集は Phase 12 Step 1-A に明示引き渡し |

## 計測の証跡記録

```bash
# V-1〜V-7 全件実行（Phase 4 / Phase 9 で観測）
# 結果は outputs/phase-09/manual-smoke-log.md に追記

# 13 カラム被覆率
diff <(grep -c '^| ' docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md) \
     <(echo 13)   # 論理 13 カラムとの一致確認（ヘッダ行差分は手動補正）

# canonical 命名 drift ヒット
grep -rn "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/ \
  | grep -v "concept\|概念\|canonical 注釈"   # 物理混同検出

# aiworkflow-requirements drift
grep -n "sync_log\|sync_job_logs\|sync_locks" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

## 実行手順

1. 3 軸 matrix を `outputs/phase-07/ac-matrix.md` に転記。
2. 未被覆セル 0 件を被覆検証セクションで明示。
3. coverage 代替指標 3 種と allowlist / 禁止パターンを固定。
4. 4 条件評価を更新し、根拠ファイルを引用。
5. Phase 9 引き継ぎ項目を箇条書きで明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化で Phase 2 成果物の重複定義（canonical 名・マッピング行）が崩れないことを matrix で検査 |
| Phase 9 | coverage 代替指標 3 種の実測（V-1〜V-7 全件 PASS） |
| Phase 10 | go-no-go の根拠として AC matrix の未被覆 0 件と 4 条件 PASS を参照 |
| Phase 11 | dead link / drift 残置の最終確認 |
| Phase 12 | Step 1-A で `database-schema.md` の drift list を消化 |
| UT-04 | 確定 canonical name と mapping を migration 計画の前提 |
| UT-09 | 確定 canonical name を ledger / lock 書込先として参照 |

## 多角的チェック観点（AI が判断）

- 価値性: AC-1〜AC-6 が V-1〜V-7 + 失敗系 (a)〜(e) で漏れなくトレースされるか。
- 実現性: 代替指標が docs-only タスクの宣言的性質に適合し、line/branch coverage の誤用を避けているか。
- 整合性: Phase 4 / 5 / 6 のファイル名・V 番号・失敗系 ID と diff ゼロ。
- 運用性: 計測コマンドが PR 上から再現可能か（grep / Read のみ）。
- 認可境界: 物理 DDL / コード / `database-schema.md` 編集が allowlist に含まれていないこと。
- セキュリティ: matrix / allowlist に API token / OAuth / D1 binding 値が露出していないこと。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC × V × 失敗系 3 軸 matrix | spec_created |
| 2 | 未被覆セル 0 件確認 | spec_created |
| 3 | coverage 代替指標 3 種確定 | spec_created |
| 4 | 4 条件評価更新 | spec_created |
| 5 | Phase 9 引き継ぎ予約 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × V × 失敗系 3 軸 matrix + 代替指標 + 4 条件評価 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC × V × 失敗系 matrix が 6 行 × 4 列で空セル無し
- [ ] 未被覆 AC / V / 失敗系 がそれぞれ 0 件
- [ ] 代替指標 3 種が目標値・計測方法・出力先付きで定義
- [ ] allowlist と禁止パターンが明記
- [ ] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [ ] Phase 9 引き継ぎ項目が箇条書き

## タスク 100% 実行確認【必須】

- 実行タスク 5 件すべて `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-6 の 6 行が全て埋まる
- 関連 V-i / 関連失敗系 列が 1 つ以上参照
- coverage allowlist と Phase 5 / 6 の成果物パスが一致
- wrangler 直叩き / 物理 DDL 編集が本ドキュメント内に 0 件

## 次 Phase への引き渡し

- 次 Phase: 8（DRY 化）
- 引き継ぎ事項:
  - AC matrix → Phase 10 go-no-go の根拠として再利用
  - 代替指標 3 種 → Phase 9 で実測値取得
  - 4 条件評価 → Phase 10 最終判定の入力
  - allowlist 広域指定禁止ルール → Phase 8 / 9 で逸脱防止
- ブロック条件:
  - AC matrix に空セル残存
  - allowlist が広域指定に変質
  - 4 条件のいずれかが FAIL のまま
