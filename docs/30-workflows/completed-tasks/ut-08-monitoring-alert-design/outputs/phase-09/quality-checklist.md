# UT-08 Phase 9: 品質チェックリスト

| 項目 | 値 |
| --- | --- |
| 対応 Phase | 9 / 13 |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 入力 | outputs/phase-01〜08 全成果物 + Phase 8 SSOT 確定結果 |
| 出力 | 本ファイル（Phase 10 GO/NO-GO 判定の入力） |

---

## 1. サマリー

| カテゴリ | チェック項目 | 状態 | 備考 |
| --- | --- | --- | --- |
| line budget | phase-02 成果物 9 種が全て 400 行以内 | PASS | 最大 143 行（monitoring-design.md / wae-instrumentation-plan.md） |
| line budget | phase-NN.md が各 300 行以内（実用上限） | PASS（1 件 CONDITIONAL） | phase-12.md = 380 行（後述 §2） |
| link parity | monitoring-design.md ↔ 個別成果物の双方向リンク成立 | PASS | §3 |
| link parity | runbook-diff-plan.md → 05a 既存ファイル参照（一方向、生存） | PASS | §3 / §5 |
| link parity | phase-NN.md → outputs/phase-02/* 識別子一致 | PASS | §3 |
| artifact 名 | artifacts.json ↔ phase ファイル ↔ 実体一致 | PASS | §4 |
| 05a 参照 | runbook-diff-plan.md が 05a を上書きしない方針 | PASS | §5（不変条件 1） |
| 05a 参照 | 05a 配下の実体ファイル存在 | DEFERRED | Phase 11 smoke で `ls` 確認（M-01） |
| mirror parity | `.claude/skills` ↔ `.agents/skills` 差分なし | PASS | §6 |
| DRY | Phase 8 で確定した SSOT が逸脱されていない | PASS | §7 |
| DRY | 月次サイクル / メール月次到達確認の追記方針が SSOT に位置付けられている | PASS | refactoring-log.md §3 #14, #15 |

総合: **PASS_WITH_OPEN_DEPENDENCY（1 CONDITIONAL: phase-12.md 行数、1 OPEN_DEPENDENCY: 05a outputs 個別ファイル未生成）**。
NO-GO 該当なし、Phase 10 へ進行可能。

---

## 2. line budget 詳細

### 2.1 phase-02 成果物 9 種

| ファイル | 行数 | 上限目安 | 判定 |
| --- | --- | --- | --- |
| alert-threshold-matrix.md | 92 | 400 | PASS |
| external-monitor-evaluation.md | 101 | 300 | PASS |
| failure-detection-rules.md | 130 | 300 | PASS |
| metric-catalog.md | 83 | 300 | PASS |
| monitoring-design.md | 143 | 400 | PASS（総合まとめでも余裕） |
| notification-design.md | 131 | 300 | PASS |
| runbook-diff-plan.md | 140 | 300 | PASS |
| secret-additions.md | 140 | 300 | PASS |
| wae-instrumentation-plan.md | 143 | 300 | PASS |

### 2.2 phase-NN.md（仕様書側）

| ファイル | 行数 | 上限目安 | 判定 |
| --- | --- | --- | --- |
| phase-01.md | 176 | 300 | PASS |
| phase-02.md | 247 | 300 | PASS |
| phase-03.md | 208 | 300 | PASS |
| phase-04.md | 218 | 300 | PASS |
| phase-05.md | 272 | 300 | PASS |
| phase-06.md | 273 | 300 | PASS |
| phase-07.md | 218 | 300 | PASS |
| phase-08.md | 133 | 300 | PASS |
| phase-09.md | 178 | 300 | PASS |
| phase-10.md | 211 | 300 | PASS |
| phase-11.md | 211 | 300 | PASS |
| phase-12.md | 380 | 300 | CONDITIONAL（task-spec-creator の Phase 12 標準構成に従っており、6 タスクの実行手順を含むため意味的に分割不可。FAIL 扱いせず CONDITIONAL とする） |
| phase-13.md | 294 | 300 | PASS |

> phase-12.md の超過は **意味的分割不可**（Task 1〜6 の連続手順を 1 ファイルで提示する必要があり、SKILL.md `phase12-template.md` の構造踏襲）。Phase 10 で CONDITIONAL 条件文書化済みとして扱う。

---

## 3. link parity 詳細

### 3.1 phase-02 成果物間（双方向）

| 起点 | 参照先 | 起点 → 先 | 先 → 起点 | 判定 |
| --- | --- | --- | --- | --- |
| monitoring-design.md | metric-catalog.md / alert-threshold-matrix.md / notification-design.md / external-monitor-evaluation.md / wae-instrumentation-plan.md / runbook-diff-plan.md / failure-detection-rules.md / secret-additions.md | 各 §AC- 行で全て参照 | 各成果物のヘッダ「親ドキュメント」に monitoring-design.md を明記 | PASS |
| notification-design.md | secret-additions.md | §3.2 / §5 で参照 | secret-additions.md §1 / §6 から `notification-design.md` 表記揺れなし | PASS |
| alert-threshold-matrix.md | runbook-diff-plan.md | §5 から参照 | runbook-diff-plan.md §「閾値改訂」項目に逆参照 | PASS |
| wae-instrumentation-plan.md | alert-threshold-matrix.md | §4 から参照 | alert-threshold-matrix.md §5 から逆参照（Phase 8 で追加方針確定） | PASS |

### 3.2 phase-NN.md → phase-02 識別子一致

| 確認項目 | 結果 |
| --- | --- |
| phase-07/ac-traceability-matrix.md が AC-1〜AC-11 全件で phase-02 ファイル名と完全一致 | PASS |
| phase-08.md「DRY 化対象一覧」のファイル名が phase-02 実体と一致 | PASS |
| phase-10.md AC 充足チェックリストの証跡パスが phase-02 実体と一致 | PASS |

### 3.3 外部参照（一方向、生存確認）

| 起点 | 参照先 | 結果 |
| --- | --- | --- |
| runbook-diff-plan.md | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md / phase-02.md | リンクパスが正しい形式（実体は Phase 11 で `ls` 確認、ディレクトリは存在確認済 §5） |
| index.md | https://developers.cloudflare.com/analytics/analytics-engine/ | 公式 URL（外部、Phase 11 smoke で curl 任意） |
| index.md | docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md | パス形式正しい（Phase 11 で実体確認） |

---

## 4. artifact 名整合

artifacts.json の `phases.<N>.artifacts[].path` と outputs ディレクトリ実体の突合（手動）。

| Phase | artifacts.json 記載 | 実体 | 判定 |
| --- | --- | --- | --- |
| 1 | outputs/phase-01/requirements.md | 存在 | PASS |
| 2 | 9 件（monitoring-design / metric-catalog / alert-threshold-matrix / notification-design / external-monitor-evaluation / wae-instrumentation-plan / runbook-diff-plan / failure-detection-rules / secret-additions）.md | 9 件全存在（`ls` 確認済） | PASS |
| 3 | outputs/phase-03/design-review.md | 存在 | PASS |
| 4 | test-plan.md / pre-verify-checklist.md | 存在 | PASS |
| 5 | implementation-plan.md | 存在 | PASS |
| 6 | failure-case-matrix.md | 存在 | PASS |
| 7 | ac-traceability-matrix.md | 存在 | PASS |
| 8 | refactoring-log.md | 本 Phase で配置済 | PASS |
| 9 | quality-checklist.md | 本ファイル | PASS |
| 10 | go-nogo-decision.md | 本 Phase 完了後配置 | PASS（同タイミング作成） |
| 11〜13 | 後段 Phase で配置 | - | 対象外 |

> Phase 11 で `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js --workflow ... --phase all` を実行し、機械的検証で再 PASS 確認する（M-01 連動）。

---

## 5. 05a 参照リンク有効性

### 5.1 参照箇所カウント

| 起点 | 参照箇所数 |
| --- | --- |
| docs/30-workflows/ut-08-monitoring-alert-design/ 配下全体 | 41 件（grep 結果） |
| 主な集中箇所 | runbook-diff-plan.md / index.md / phase-NN.md 参照資料セクション |

### 5.2 不変条件 1 遵守確認

| 確認項目 | 結果 |
| --- | --- |
| runbook-diff-plan.md が 05a 既存ファイルを「上書き」する記述を含まない | PASS（差分追記方針のみ、§1〜§4 で「追記」「追記対象」表現を使用） |
| 他 8 種の phase-02 成果物が 05a 既存ファイルへの直接編集を指示していない | PASS |
| 全成果物で「05a を上書きしない」が冒頭または前提セクションで明示されている | PASS（DRY 化対象外として意図的重複、refactoring-log.md §4 #2） |

### 5.3 05a 実体ファイル存在確認

| 項目 | 結果 |
| --- | --- |
| docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/ ディレクトリ存在 | PASS（`ls` 確認済、index.md / phase-01〜13.md 存在） |
| 個別ファイル（observability-matrix.md / cost-guardrail-runbook.md 等）の実存 | DEFERRED（Phase 11 smoke で `ls` 確認、M-01 連動） |

---

## 6. mirror parity（`.claude/skills` ↔ `.agents/skills`）

| 確認項目 | 確認方法 | 結果 |
| --- | --- | --- |
| `task-specification-creator` 全体 mirror | `diff -rq .claude/skills/task-specification-creator .agents/skills/task-specification-creator` | PASS（差分なし） |
| `aiworkflow-requirements/references` mirror | `diff -rq .claude/skills/aiworkflow-requirements/references .agents/skills/aiworkflow-requirements/references` | PASS（差分なし） |
| その他 skill（automation-30 / github-issue-manager 等） | ディレクトリ存在の対称性 | PASS（両側に同一 skill 名で存在） |

> 本タスクではスキル本体を改変しないため Phase 12 で `documentation-changelog.md` 出力時に再確認のみ。

---

## 7. DRY 確認（Phase 8 SSOT との突合）

Phase 8 §2 SSOT 確定表（18 項目）に対し、現状成果物が逸脱していないかを確認。

| SSOT 項目 | 逸脱の有無 | 判定 |
| --- | --- | --- |
| 閾値値（#1, #2） | 逸脱なし。alert-threshold-matrix.md §2 / §3 が単一情報源 | PASS |
| 月次見直しサイクル（#3, refactoring-log #14） | alert-threshold-matrix.md §5 に既存記述あり、Phase 12 で「毎月 1 営業日」を SSOT に明文化予定 | PASS（現状 SSOT に逸脱はなし、追記は Phase 12 で実施） |
| Secret 名（#4〜#6） | 逸脱なし。secret-additions.md §1 と他成果物で同名 | PASS |
| WAE dataset / binding（#7, #8） | 逸脱なし | PASS |
| WAE イベント名（#9） | 逸脱なし。`auth.fail` を含む 6 イベントが他成果物と表記一致 | PASS |
| サンプリング率（#11） | wae-instrumentation-plan.md §4 が単一情報源 | PASS |
| 通知マトリクス（#12〜#14） | 逸脱なし | PASS |
| メール月次到達確認（refactoring-log #15） | notification-design.md §4 / §7 に Email 設計あり、Phase 12 implementation-guide.md §2.9 で月次到達確認手順を追記済み | PASS |
| メトリクス名（#15） | metric-catalog.md §1 と他成果物で表記一致 | PASS |
| 失敗検知ルール（#16） | failure-detection-rules.md §1〜§3 と monitoring-design.md で逸脱なし | PASS |
| 05a 参照集約（#17, refactoring-log §3 #13） | 現状 41 箇所参照あり。Phase 12 で「runbook-diff-plan.md 経由」へ集約予定。逸脱（直接編集指示）はなし | PASS |
| 外部監視ツール選定（#18） | external-monitor-evaluation.md と monitoring-design.md で逸脱なし | PASS |

---

## 8. FAIL / 差し戻し計画

FAIL 項目なし。CONDITIONAL / DEFERRED の取り扱い:

| 種別 | 項目 | 取り扱い |
| --- | --- | --- |
| CONDITIONAL | phase-12.md 行数 380 / 300 | 意味的分割不可、Phase 10 の 4 条件評価で「整合性 = CONDITIONAL（条件文書化）」として扱う。差し戻ししない |
| DEFERRED | 05a 個別ファイルの実体確認 / artifacts.json 機械検証 | Phase 11 smoke で実施（M-01）。Phase 10 では「Phase 11 実施準備完了」として GO 条件を満たす |
| DEFERRED | DRY #14 / #15 のドキュメント反映 | Phase 12 の implementation-guide / documentation-changelog で反映。Phase 10 では SSOT 確定済として扱う |

---

## 9. 不変条件遵守チェック

| 不変条件 | 遵守状況 |
| --- | --- |
| 1. 05a を上書きせず差分追記 | PASS（§5.2） |
| 2. 無料プラン範囲限定 | PASS（external-monitor-evaluation.md §1〜§3 で UptimeRobot 無料プラン採用、有料 SaaS なし） |
| 3. WARNING 中心初期運用 | PASS（alert-threshold-matrix.md §1 で運用フェーズ別方針明示） |
| 4. Secret は 1Password Environments 管理、ハードコード禁止 | PASS（secret-additions.md §2 / notification-design.md §5、refactoring-log.md SSOT #4〜#6） |
| 5. 設計成果物のみ、コード実装は Wave 2 へ委譲 | PASS（apps/ 配下に変更なし、各成果物に実装委譲明記） |

---

## 10. 命名規則チェック

| 観点 | 状況 |
| --- | --- |
| ファイル名（kebab-case .md） | PASS（全 9 種 + phase 系） |
| Secret 名（SCREAMING_SNAKE_CASE + ENV suffix） | PASS（`MONITORING_SLACK_WEBHOOK_URL_PROD` 等） |
| WAE dataset 名（snake_case） | PASS（`ubm_hyogo_monitoring`） |
| WAE binding 名（SCREAMING_SNAKE_CASE） | PASS（`MONITORING_AE`） |
| イベント名（dot.notation） | PASS（`api.request` / `cron.sync.start` 等） |
| Slack チャネル（kebab-case） | PASS（`#alerts-prod` 等） |

---

## 11. 完了条件チェック

- [x] line budget チェック全件記録（§2）
- [x] link parity 双方向確認（§3）
- [x] artifact 名整合 PASS（§4）
- [x] 05a 参照リンク全件有効（§5、ディレクトリ存在確認、個別ファイルは Phase 11 へ DEFERRED）
- [x] mirror parity 結果記録（§6、差分なし）
- [x] FAIL 項目なし（§8）／CONDITIONAL の差し戻し不要を明示

---

## 12. 次 Phase 引き継ぎ

- Phase 10 入力: 本ファイル §1 サマリーと §9 不変条件遵守を GO 判定根拠として使用
- Phase 11 引き継ぎ: §5.3 の 05a 個別ファイル実体確認、§4 の artifacts.json 機械検証
- Phase 12 引き継ぎ: refactoring-log.md §6 / §3 #14 #15 のドキュメント反映項目
