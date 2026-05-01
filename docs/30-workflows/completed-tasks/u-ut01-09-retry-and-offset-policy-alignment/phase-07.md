# Phase 7: AC マトリクス検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス検証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (失敗ケース整理) |
| 次 Phase | 8 (ドキュメント整流化) |
| 状態 | spec_created |
| タスク分類 | specification-design（traceability） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

index.md および unassigned-task で定義された AC1〜AC6 を唯一の AC registry とし、Phase 2（canonical
採択 / migration 影響評価）/ Phase 4（机上検証 V1〜V4）/ Phase 5（UT-09 引き継ぎ Step A〜F）/
Phase 6（失敗ケース 12 件）/ Phase 9（quota 試算）の成果物を縦串で結び、各 AC が Phase
ファイルへの相互参照で根拠付けられているマトリクスを作成する。docs-only タスクのため
line/branch coverage は採用せず、「AC トレース率 100%」と「4 条件評価 PASS」を達成基準とする。

## 実行タスク

1. AC1〜AC6 × 5 列（AC 内容 / 検証 (V) / Step (UT-09 引き継ぎ) / 関連 failure case / 根拠 Phase ファイル）の 6 行マトリクスを完成する（完了条件: 空セル無し）。
2. coverage 代替指標を確定する（完了条件: 「AC トレース率 100%」「Phase 2 採択値の理由文書化率 100%」「failure case 紐付け率 100%」を採用）。
3. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を Phase 2〜6 / Phase 9 を踏まえて更新する（完了条件: 各条件で根拠ファイルを引用）。
4. Phase 9 への引き継ぎ項目（worst case 算定実測値の予約）を箇条書きで明示する（完了条件: V3 算定式から取得する数値項目が列挙）。
5. Phase 10 GO/NO-GO の判定材料として AC マトリクスと 4 条件評価を整理する（完了条件: AC1〜AC6 全 PASS かつ 4 条件 PASS が GO の前提として記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md | AC1〜AC6 の唯一の registry |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | AC 出典・苦戦箇所・リスク |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | retry / backoff / offset 採択 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md | migration 採否決定 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-04.md | V1〜V4 机上検証 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-05.md | UT-09 引き継ぎ Step A〜F |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-06.md | failure case 12 件 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md | quota worst case 実測（Phase 9 で確定） |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync 関連正本仕様索引 |

## AC マトリクス

| AC# | AC 内容 | 検証 (Phase 4 V) | Step (Phase 5) | 関連 failure case (Phase 6) | 根拠 Phase ファイル |
| --- | --- | --- | --- | --- | --- |
| AC1 | canonical retry 最大回数（3 / 5 / その他）採択 + 採択理由明文化 | V1 retry boundary | Step B (定数 canonical 化) / Step F (過渡期運用) | #1, #2, #7, #8 | `outputs/phase-02/canonical-retry-offset-decision.md` §retry / `phase-04.md` V1 / `phase-05.md` Step B,F |
| AC2 | canonical Backoff curve（base / 上限 / jitter）確定 + 1 tick 内収まり証明 | V1 retry boundary / V3 quota | Step B (baseMs canonical 化) | #2, #9 | `outputs/phase-02/canonical-retry-offset-decision.md` §backoff / `phase-04.md` V1,V3 / `outputs/phase-09/quota-worst-case-calculation.md` |
| AC3 | `processed_offset` schema 採否決定 + offset 単位（行 / chunk index / 安定 ID）定義 | V2 offset シナリオ | Step C (offset ロジック追加) | #3, #4, #5, #11 | `outputs/phase-02/canonical-retry-offset-decision.md` §offset / `phase-04.md` V2 / `phase-05.md` Step C |
| AC4 | D1 migration 影響机上評価 + UT-09 / U-UT01-07 申し送り | V4 migration 決定木 | Step D (migration 追加) | #3, #5, #12 | `outputs/phase-02/migration-impact-evaluation.md` / `phase-04.md` V4 / `phase-05.md` Step D |
| AC5 | Sheets API quota worst case 算定（< 500 req/100s） | V3 quota 試算 | Step B (curve) / Step F (過渡期) | #2, #4, #6, #9 | `phase-04.md` V3 / `outputs/phase-09/quota-worst-case-calculation.md` |
| AC6 | `SYNC_MAX_RETRIES` 環境変数の存続可否 + 過渡期運用方針 | V1 retry boundary（環境変数経路） | Step A (env 既定値) / Step F (過渡期) | #1, #7, #8, #10 | `outputs/phase-02/canonical-retry-offset-decision.md` §env / `phase-05.md` Step A,F |

## coverage 代替指標と allowlist

### 目標

docs-only タスクのため line/branch coverage は適用しない。代替指標を採用:

| 指標 | 目標値 | 計測方法 |
| --- | --- | --- |
| AC トレース率 | 100% | AC1〜AC6 全行で V / Step / failure case / 根拠 Phase が空セル無し |
| Phase 2 採択値の理由文書化率 | 100% | retry / backoff / offset / migration の 4 採択について採択理由が記述 |
| failure case 紐付け率 | 100% | Phase 6 の 12 件全てが少なくとも 1 つの AC に紐付け |

### 計測対象 allowlist（変更ファイル限定）

```
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-04/test-strategy.md
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-05/ut09-handover-runbook.md
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-06/failure-cases.md
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-07/ac-matrix.md
docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md
```

### 禁止パターン（広域指定）

```
apps/api/**/*           # docs-only タスクのため実装ファイル変更は対象外
docs/**                 # 他タスクの outputs を含めない
```

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS（高） | AC1〜AC6 が V1〜V4 / Step A〜F / failure case 12 件でトレース完結。UT-09 実装側が独自判断不要 |
| 実現性 | PASS | canonical 採択値が既存実装値（DEFAULT_MAX_RETRIES=5 / baseMs=50）から Step 単位で安全に移行可能。`scripts/cf.sh` 経由で migration 反映可能（CLAUDE.md `Cloudflare 系 CLI 実行ルール`） |
| 整合性 | PASS（要 Phase 11 確認） | sync-method-comparison.md / sync-log-schema.md / Phase 2 採択 / Phase 5 引き継ぎの 4 文書間で diff ゼロを Phase 11 link-checklist で最終確認 |
| 運用性 | PASS | Phase 5 Step F の過渡期 7 日運用ルール（しきい値再校正・revert 条件）が SRE 運用で実施可能。Phase 6 残存リスク表で B 群 4 件の運用判断が示されている |

## 計測の証跡記録（机上のみ）

```bash
# AC マトリクス空セル無しチェック（grep ベース）
grep -c '^| AC' outputs/phase-07/ac-matrix.md
# 期待: 6（AC1〜AC6 の 6 行）

# Phase 2 採択値の理由文書化率（採択 4 種が記述されているか）
grep -E '^### (retry|backoff|offset|migration)' outputs/phase-02/canonical-retry-offset-decision.md outputs/phase-02/migration-impact-evaluation.md
# 期待: 4 セクション

# failure case 紐付け率（Phase 6 12 件全件が AC に参照されているか）
for n in $(seq 1 12); do
  grep -c "#$n" outputs/phase-07/ac-matrix.md
done
# 期待: 全件 1 以上
```

> 上記は本ドキュメント上の自己整合チェック手順であり、実装変更・migration apply・本番 query を伴わない。

## 実行手順

1. AC マトリクス 6 行 × 5 列を `outputs/phase-07/ac-matrix.md` に転記する。
2. coverage 代替指標 3 種と allowlist / 禁止パターンを記述する。
3. 4 条件評価を Phase 2〜6 / Phase 9 outputs を引用して更新する。
4. 計測の証跡記録手順を grep ベースで明示する。
5. Phase 9 へ引き継ぐ実測値項目（V3 算定式の確定値）を箇条書きで予約する。
6. Phase 10 GO/NO-GO 判定材料として AC マトリクス + 4 条件評価が利用可能であることを明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | AC 行が DRY 化（同一根拠ファイルへの重複参照削減）の入力 |
| Phase 9 | AC2 / AC5 の worst case 実測値を `quota-worst-case-calculation.md` で確定 |
| Phase 10 | GO/NO-GO の根拠として AC マトリクスの空セル無し + 4 条件 PASS を参照 |
| Phase 11 | link-checklist で AC マトリクスの根拠ファイル参照リンクを全件検証 |
| Phase 12 | 残存リスク（Phase 6 B 群）を unassigned-task-detection に登録 |
| UT-09 | 確定 AC ↔ Step 表を実装側の受入条件入力に流す |

## 多角的チェック観点

- 価値性: AC1〜AC6 が抜け漏れなく検証 / Step / failure case / 根拠 Phase にトレースされているか。
- 実現性: 代替指標が docs-only タスクの性質に適合し、line/branch coverage の誤用を避けているか。
- 整合性: Phase 4 V 番号 / Phase 5 Step / Phase 6 case# と本マトリクスに diff ゼロ。
- 運用性: 過渡期運用の根拠が AC6 行と Phase 5 Step F に二重記述されず DRY か。
- 認可境界: 本タスクで実装変更を伴わないことが allowlist と禁止パターンで担保されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC マトリクス 6 行 × 5 列確定 | spec_created |
| 2 | coverage 代替指標 3 種確定 | spec_created |
| 3 | 4 条件評価更新 | spec_created |
| 4 | Phase 9 引き継ぎ項目予約 | spec_created |
| 5 | Phase 10 GO/NO-GO 判定材料整理 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × V × Step × failure case × 根拠 Phase のトレース表 + 代替指標 + 4 条件評価 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件

- [ ] AC マトリクス 6 行 × 5 列に空セル無し
- [ ] 代替指標 3 種が目標値・計測方法付きで定義
- [ ] 広域指定の禁止パターンが例示
- [ ] 4 条件評価が根拠ファイル引用付きで PASS 判定
- [ ] Phase 9 への引き継ぎ項目が箇条書き
- [ ] Phase 10 GO/NO-GO 判定材料として整理済み
- [ ] 計測の証跡記録手順が grep ベースで明示

## Phase 完了スクリプト呼出例

```bash
# Phase 7 完了マーキング
mise exec -- pnpm tsx scripts/phase/mark-complete.ts \
  --task u-ut01-09-retry-and-offset-policy-alignment \
  --phase 7 \
  --output outputs/phase-07/ac-matrix.md
```

## タスク100%実行確認【必須】

- 実行タスク 5 件が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC1〜AC6 の 6 行が全て埋まる
- 関連 failure case 列が Phase 6 の case# を 1 つ以上参照
- coverage allowlist と Phase 5 / Phase 6 の outputs 一覧が一致
- 実装変更・migration apply 指示が本ドキュメントにゼロ件

## 次 Phase への引き渡し

- 次 Phase: 8 (ドキュメント整流化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 GO/NO-GO の根拠として再利用
  - 代替指標 3 種 → Phase 9 で AC2 / AC5 の実測値取得
  - 4 条件評価 → Phase 10 最終判定の入力
  - 広域指定禁止ルール → Phase 8 / Phase 9 で逸脱を防ぐ
- ブロック条件:
  - AC マトリクス空セル残存
  - allowlist が広域指定に変質
  - 4 条件のいずれかが FAIL のまま
