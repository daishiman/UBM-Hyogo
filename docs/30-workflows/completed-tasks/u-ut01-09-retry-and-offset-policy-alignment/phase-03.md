# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | U-UT01-09 retry 回数と offset resume 方針の統一 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク分類 | docs-only（design review gate のみ。コード変更・PR は一切行わない） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Phase 2 で確定した 3 つの canonical 決定（retry 最大回数 / Exponential Backoff curve / `processed_offset` 採否）が AC1-AC6 を満たすかをチェックリスト方式で検証し、UT-09 / U-UT01-07 へ申し送る GO 判定または Phase 2 への差し戻し（NO-GO 判定）を確定するゲートを通す。

本 Phase はコード変更・migration 作成・PR 作成を一切伴わない。成果物は `outputs/phase-03/main.md` の 1 ファイルのみ。

## 真の論点 (true issue)

- レビューゲートの本質は「3 つの canonical 決定が **整合的に**（独立ではなく組合せで）AC を満たすか」を検証すること。単独の AC PASS が 6 つ揃っても、quota 試算が worst case 不在ならゲートは通らない。
- MAJOR / MINOR の判定基準を曖昧にすると Phase 2 への差し戻し条件が運用者依存になる → 本 Phase で MAJOR / MINOR の閾値を明文化する。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | チェックリスト評価結果のみ |
| 成果物の物理形態 | テキスト（Markdown 1 ファイル） | `outputs/phase-03/main.md` |
| 検証方法 | チェックリスト 6 項目（AC1-AC6）+ 横断観点 4 項目 + GO/NO-GO 判定 | 実機検証なし |

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | Phase 2 (設計) | `canonical-retry-offset-decision.md` / `migration-impact-evaluation.md` | チェックリスト入力 |
| 上流 | Phase 1 (要件定義) | AC1-AC6 / 苦戦箇所 4 件 | チェックリスト評価軸 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | GO 判定 + canonical 値 + 申し送り内容 | UT-09 受入条件への canonical 申し送り |
| 下流 | U-UT01-07 (ledger 物理整合) | GO 判定 + migration 影響評価 | `processed_offset` 列追加 migration 作業の入力 |

## 実行タスク

1. AC1-AC6 をチェックリスト形式で個別評価する（完了条件: 各 AC に PASS / MINOR / MAJOR 判定が付与）。
2. 横断観点（quota 試算 worst case / migration 手順完全性 / 申し送り経路一意性 / 不変条件 #1・#5 維持）を評価する（完了条件: 4 観点に判定付与）。
3. MAJOR / MINOR の判定基準を明文化する（完了条件: 判定基準文が記載）。
4. GO / NO-GO ゲート判定を確定する（完了条件: GO 条件全充足の証跡または NO-GO の差し戻し対象 Phase 2 セクションが明示）。
5. UT-09 / U-UT01-07 への申し送りパッケージを最終化する（完了条件: 申し送り 2 経路が確定値付きで記載）。
6. open question を残す場合は受け皿（UT-09 受入条件 / U-UT01-07 / 別 Phase）を明示する（完了条件: open question 件数 0 または受け皿明示）。

## チェックリスト: AC1-AC6 個別評価

| AC | 内容 | PASS 条件 | MINOR 条件 | MAJOR 条件 |
| --- | --- | --- | --- | --- |
| AC1 | canonical retry 最大回数の採択 | 採択値・採択理由・比較表が記載 | 採択理由が比較表から導出されない | 採択値が未確定 |
| AC2 | canonical Exponential Backoff curve の確定 | curve / jitter / 1 tick 滞在時間試算が記載 | jitter 方針が未確定 | 1 tick 滞在時間試算が無い |
| AC3 | `processed_offset` schema 採否 | 採否 + offset 単位 + Sheets 行削除耐性根拠 | offset 単位定義が曖昧 | 採否未確定 |
| AC4 | D1 migration 影響評価 | DDL / DEFAULT / backfill / rollback が記載 | rollback 手順が `cf.sh d1 export` 経由で固定化されていない | DDL 候補が未確定 |
| AC5 | Sheets API quota 整合 | worst case シナリオで 500 req/100s 未満を具体数値算定 | 算定が概算で worst case 不在 | 算定式が無い |
| AC6 | `SYNC_MAX_RETRIES` 存続可否と過渡期方針 | 存続可否 / 既定値 / 過渡期しきい値再校正期間が記載 | 参照ポイント appendix が不完全 | 既定値が未確定 |

## チェックリスト: 横断観点評価

| 観点 | PASS 条件 | MAJOR 判定基準（差し戻し閾値） |
| --- | --- | --- |
| quota 試算 worst case 完全性 | cron + 手動同期同時刻 + retry 上限の組合せで 500 req/100s 未満 | quota 試算が未収束（worst case 不在 / 算定式無し） |
| migration 手順完全性 | DDL / DEFAULT / backfill / rollback / 適用 runbook の 5 要素全て記載 | migration 手順未確定（5 要素のいずれか欠落） |
| 申し送り経路一意性 | UT-09 / U-UT01-07 への申し送りが具体値付きで分離記載 | 申し送り先が曖昧、または UT-09 と U-UT01-07 の責務境界が不明確 |
| 不変条件 #1 / #5 維持 | Sheets schema をコードに固定しない / D1 アクセスは apps/api 限定 を維持 | いずれか不変条件に違反する canonical 採択 |

## MAJOR / MINOR 判定基準

| レベル | 基準 | 対応 |
| --- | --- | --- |
| PASS | AC / 横断観点ともに PASS 条件を全充足 | UT-09 / U-UT01-07 へ GO 判定で申し送り |
| MINOR | 警告レベル。本タスクの canonical 決定は維持するが、UT-09 受入条件追記または appendix 補強で対応可能 | UT-09 受入条件 / U-UT01-07 受入条件のいずれかに補足条件を申し送って GO |
| MAJOR | block。Phase 2 へ差し戻し。代表的 MAJOR: (a) quota 試算が worst case 不在、(b) migration 手順が 5 要素のいずれか未確定、(c) canonical 採択値が 3 軸のいずれかで未確定、(d) 不変条件 #1 / #5 違反 | Phase 2 (設計) のうち該当セクションを差し戻し再評価 |

## GO / NO-GO ゲート

### GO 条件（全て満たすこと）

- [ ] AC1-AC6 すべて PASS（MINOR は対応経路明示で許容、MAJOR は不可）
- [ ] 横断観点 4 項目すべて PASS（MAJOR ゼロ）
- [ ] 3 軸 canonical 値（retry / backoff / offset）が成果物 1 で確定
- [ ] migration 影響評価が成果物 2 で 5 要素全て記載
- [ ] UT-09 / U-UT01-07 への申し送り経路が分離・確定
- [ ] open question が 0 件、または受け皿が明示

### NO-GO 条件（一つでも該当）

- AC1-AC6 のいずれかに MAJOR 判定
- 横断観点 4 項目のいずれかに MAJOR 判定
- canonical 採択値が 3 軸のいずれかで未確定
- migration 5 要素のいずれかが未確定
- 不変条件 #1 / #5 のいずれかに違反する canonical 採択

NO-GO 時は本 Phase 成果物に「差し戻し対象 Phase 2 セクション」と「再評価が必要な MAJOR 項目」を列挙し、Phase 2 を再実行する。

## 申し送りパッケージ（GO 時の最終化）

| 申し送り先 | 内容 | 形式 |
| --- | --- | --- |
| UT-09 受入条件 | canonical retry 最大回数 / Exponential Backoff curve（base / 上限 / jitter）/ `SYNC_MAX_RETRIES` 既定値 / `wrangler.toml` 反映ポイント | 受入条件追記文 |
| U-UT01-07 受入条件 | `processed_offset` 採否（採用なら DDL 候補 + backfill + rollback 手順）+ 列名 / DEFAULT 値 | 受入条件追記文 |

## リスクと対策

| # | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| R1 | レビューが PASS / MINOR / MAJOR 判定基準なしで主観評価 | 差し戻し基準が運用者依存 | 本 Phase で判定基準を明文化（上記表） |
| R2 | GO 判定したが UT-09 実装で quota 超過が発覚 | canonical 再決定 + 過渡期データ整合崩壊 | quota worst case を MAJOR 判定基準に含めることで Phase 3 で予防 |
| R3 | 申し送り経路の責務境界が UT-09 / U-UT01-07 で重複 | 実装側で重複作業 / 漏れ | 申し送りパッケージを 2 経路に分離して記述 |

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 / U-UT01-07 への GO 判定が一意化され、実装側で再判断不要 |
| 実現性 | PASS | docs-only / チェックリスト評価で完結 |
| 整合性 | PASS | Phase 1 / Phase 2 の真の論点・AC1-AC6 を維持し、不変条件 #1 / #5 を再確認 |
| 運用性 | PASS | MAJOR / MINOR / PASS 判定基準が明文化され、再現性ある差し戻し判断が可能 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-01.md | AC1-AC6 / 苦戦箇所 4 件 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-02.md | レビュー対象 spec |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | レビュー対象成果物 1 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md | レビュー対象成果物 2 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | canonical 入力（受入条件の正本） |

### aiworkflow-requirements 連携

| 種別 | パス | 用途 |
| --- | --- | --- |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset / quota 索引 |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_job_logs` 物理 schema 整合確認 |
| 参考 | .claude/skills/task-specification-creator/SKILL.md | docs-only / NON_VISUAL ゲート設計テンプレ |

## 完了条件チェックリスト

- [ ] AC1-AC6 全て個別判定が記載されている
- [ ] 横断観点 4 項目（quota / migration / 申し送り / 不変条件）の判定が記載
- [ ] PASS / MINOR / MAJOR の判定基準が明文化
- [ ] GO / NO-GO ゲートのチェックリストが両方記述
- [ ] GO の場合、申し送りパッケージ（UT-09 / U-UT01-07）が確定値付きで分離記載
- [ ] NO-GO の場合、差し戻し対象 Phase 2 セクションと MAJOR 項目が列挙
- [ ] open question 件数 0、または受け皿（UT-09 / U-UT01-07 / 別 Phase）が明示
- [ ] 成果物 1 ファイル（`outputs/phase-03/main.md`）が配置
- [ ] コード変更 / migration 作成 / PR が発生していない

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | GO 判定済みの AC1〜AC6 を V1〜V4 のテスト戦略へ渡し、MAJOR が残る場合は Phase 2 に差し戻す |
| Phase 5 | UT-09 / U-UT01-07 への申し送りパッケージを implementation handover runbook の入力にする |
| Phase 7 | PASS / MINOR / MAJOR 判定と open question の受け皿を AC マトリクスに反映する |
| Phase 10 | Phase 3 の GO / NO-GO を最終レビューゲートの前提条件として再確認する |
| Phase 12 | MINOR 補足や未解決 Note があれば unassigned-task-detection / skill-feedback-report の入力にする |

## 完了条件（コマンド）

```bash
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment \
  --phase 3 \
  --artifacts docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-03/main.md
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計レビューゲート結果 | outputs/phase-03/main.md | AC1-AC6 個別判定 / 横断観点 4 項目判定 / MAJOR-MINOR-PASS 基準 / GO-NO-GO 結果 / 申し送りパッケージ |
| メタ | artifacts.json | Phase 3 状態の更新 + workflow_state を完了側へ遷移 |

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 申し送り先:
  - UT-09 受入条件: canonical retry / backoff / `SYNC_MAX_RETRIES` 既定値 / `wrangler.toml` 反映ポイント
  - U-UT01-07 受入条件: `processed_offset` 採否 + DDL + backfill + rollback
- ブロック条件（NO-GO 時）:
  - AC1-AC6 のいずれかに MAJOR
  - 横断観点 4 項目のいずれかに MAJOR
  - canonical 採択値が 3 軸のいずれかで未確定
  - migration 5 要素のいずれかが未確定
  - 不変条件 #1 / #5 違反
  → Phase 2 へ差し戻し再実行
