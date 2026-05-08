# Lessons Learned — Issue #548 ML Model Selection (CF Audit Logs Classifier, 2026-05)

Issue #515 の `Classifier` 抽象化を継承し、Isolation Forest / XGBoost / Workers AI の 3 候補を同一 dataset に流して selection-criteria + tieBreaker で比較する harness を実装したサイクルで得られた知見。
根拠: `scripts/cf-audit-log/classifier/{isolation-forest,xgboost,workers-ai}.ts` / `scripts/cf-audit-log/evaluation/{model-comparison,selection-criteria}.ts` / `tests/fixtures/cf-audit/labeled-90day.jsonl` / `docs/30-workflows/issue-548-ml-model-selection/outputs/phase-12/`。

---

## L-ISSUE548-001: synthetic harness と production winner は同じ PASS で扱わない

### 現象
synthetic 720-row fixture で `xgboost` が selection-criteria を全充足したため "production winner = xgboost" と書きそうになる。production 90-day redacted dataset を replay する前に SSOT に winner を記録すると、FU-03-D production switch で実 dataset の rejection が発生したときに rollback 説明責任が追えなくなる。

### 原因分析
synthetic fixture の役割は harness shape / metric aggregation / tieBreaker 動作の smoke 検証のみ。fixture 上の precision / recall / latency は **production traffic の代理ではない**。Workers AI は sync comparison path で network call を持たない設計のため、合成上は fallbackRate=1.0 で必ず rejection されるが、これは runtime 性能ではなく実装契約の表現。

### 採用解決策
- root `artifacts.json` / `outputs/artifacts.json` / `index.md` / SSOT indexes すべての `state` を `implemented_synthetic` に統一
- Phase 11 evidence は `synthetic only` ヘッダを付け production winner と書かない
- production winner 確定は FU-03-B (redacted 90-day dataset) → FU-03-C (winner selection) → FU-03-D (production env switch) の 3 wave に分離
- `task-specification-creator/references/phase12-skill-feedback-promotion.md` の `Synthetic Harness vs Production Winner Rule` として skill 側に昇格

### 再利用ガイド
複数候補比較・benchmark harness・ML model selection の workflow では、Phase 1 で `candidates` / `criteria` / `tieBreaker` / `datasetBoundary` を固定セクション化し、`synthetic / production-equivalent` の 2 dataset を別 evidence path として宣言する。fixture 結果と production runtime を同じ語彙で書かない。

---

## L-ISSUE548-002: fallback rate / rejection reason は実 comparison 経路を構造化して計測する

### 現象
3 候補のうち Workers AI だけ Cloudflare Gateway への async network call を要するため、synthetic comparison runner で sync path を呼ぶと「fallback したか」「token 不在で rejection したか」「latency p95 が誤計測されたか」を取り違える。fallbackRate を 0 と過小計上する誘惑が生じる。

### 原因分析
`Classifier` interface は `classify()` (sync) を要求するが、Workers AI は本来 async。同期パスで配布したい場合は `fallbackActive` signal を返して sync 経路で threshold 相当に落とす設計が necessary。これを metric 上 0 と書くと "Workers AI は fallback ゼロ" と読まれ、本番切替判断を誤る。

### 採用解決策
- `classifier/types.ts` に `fallbackActive: boolean` と `fallbackReason: string` を追加
- `model-comparison.ts` で各 candidate の `fallbackRate = sum(fallbackActive) / total` を計上
- selection-criteria の `fallbackRateMax: 0.01` を満たさない候補は automatically rejected（synthetic で workers-ai は 1.0 として rejection）
- Phase 12 `implementation-guide.md` の評価結果テーブルに `fallbackRate` 列を必須化し、0 と 1.0 のいずれの場合も理由を本文で説明

### 再利用ガイド
`fallback / circuit-breaker / async-only` の挙動を持つ classifier / strategy を harness 比較に入れるときは、interface に **fallback signal** を含めて計測経路を分け、metric を擬似 PASS にしない。selection criteria に `fallbackRateMax` を必ず含める。

---

## L-ISSUE548-003: Phase status 語彙を `completed / pending / blocked` に正規化する

### 現象
`spec_created / implementation / NON_VISUAL` で Phase 11 evidence path を予約する場合、`PASS` と `OK` を未実行に対して書くと「synthetic 相当 evidence あり」「production runtime evidence pending」「user gate blocked」が同じ表記で混在し、phase12-task-spec-compliance-check の真偽が読み取れなくなる。

### 原因分析
Phase status の語彙が `PASS / OK / done / synced / completed` で混ざると、`runtime evidence の有無` と `spec sync の有無` が同義語になる。reviewer は文字列ではなく語彙の `位置` で判定する。

### 採用解決策
- Phase status は `completed` / `pending` / `blocked` の 3 値に正規化
- `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `PENDING_IMPLEMENTATION_EVIDENCE` を Phase 11 判定行で使い、`PASS` / `OK` 単独表記を禁止（issue-355 deploy-deferred ルールと連動）
- `phase12-task-spec-compliance-check.md` は 8 項目を `completed` / `pending` 列で並べる
- 今回は実装済 synthetic evidence が存在したため `implemented_synthetic` reclassification を root → outputs → Phase 11 → Phase 12 → SSOT indexes の 5 同期点で実施

### 再利用ガイド
implementation / NON_VISUAL workflow で Phase 11 evidence を予約する場合、判定行語彙を `task-specification-creator/references/phase12-skill-feedback-promotion.md` の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 表に揃える。同じ語彙が root artifacts / outputs artifacts / SSOT indexes で再利用できる状態を保つ。

---

## L-ISSUE548-004: FU 依存図は親 issue の successor trace に正本を置く

### 現象
issue-548 着手時、`unassigned-task/issue-515-ml-model-selection.md`（issue-515 起票時の予約名）を正本として参照し続けると、現リポジトリには存在しない path に dependency が残り、reviewer が手で root を辿ることになる。issue-548 自体が successor になったため、起票時 path は consumed として閉じる必要がある。

### 原因分析
parent issue の Phase 12 が起票した unassigned task は、successor が formalize されたタイミングで `consumed_by_<successor-root>` 表記へ更新しないと stale なまま残る。`workflow self-contained` 原則違反。

### 採用解決策
- issue-515 inventory の `follow-up unassigned` 行に `FU-03-C successor docs/30-workflows/issue-548-ml-model-selection/` を追記
- issue-548 inventory の `predecessor` / `successor` 行で wave 順序 (FU-03-A → FU-03-B → FU-03-C → FU-03-D) を一意に表現
- `FU-03-D production switch` は `unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-production-classifier-switch.md` に formalize し、issue-548 から path で参照
- skill-feedback-report の "ドキュメント改善" 項目に no-op routing として記録（`task-specification-creator/references/phase12-skill-feedback-promotion.md` 既存の `Canonical Root Existence Gate` ルールで担保済）

### 再利用ガイド
複数 wave に跨る follow-up chain を持つ workflow では、artifact inventory に `predecessor` / `successor` 行を必ず置き、起票時 path ではなく現リポジトリ実在 path を SSOT に載せる。successor が formalize されたら parent の inventory も同 wave で update する。

---

## L-ISSUE548-005: SSOT 同期は同一 wave で 8 同期点を消化する

### 現象
issue-548 のような ML model selection workflow では、observability spec / runbook / task-workflow / resource-map / quick-reference / topic-map / keywords / artifact inventory の 8 箇所を同期する必要がある。一部だけ更新すると後続 wave で driftが検出されない箇所が残る。

### 原因分析
同期点が分散しており、`pnpm indexes:rebuild` で自動再生成されるのは indexes/{topic-map, keywords.json} のみ。それ以外 (resource-map / quick-reference / artifact inventory / observability / runbook / task-workflow / LOGS) は手動編集対象。

### 採用解決策
8 同期点を以下のチェックリストで同一 wave 消化:
1. `references/observability-monitoring.md` §11 ML Model Selection Contract 追加
2. `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` promotion / rollback runbook 追加
3. `references/task-workflow-active.md` issue-548 行追加
4. `indexes/resource-map.md` issue-548 エントリ追加
5. `indexes/quick-reference.md` issue-548 エントリ追加
6. `indexes/topic-map.md` / `indexes/keywords.json` を `pnpm indexes:rebuild` で再生成
7. `references/workflow-issue-548-ml-model-selection-artifact-inventory.md` 新規作成
8. `LOGS/_legacy.md` に sync 日付ヘッダ追加

### 再利用ガイド
同期点が 5 を超える workflow では、Phase 12 system-spec-update-summary に「Updated」「Not Updated As Runtime Fact」の 2 セクションを必須化し、誤差ゼロを compliance check で検証する。新規 references ファイルは `pnpm indexes:rebuild` で indexes に反映されることを CI gate で確認する。

---

## 関連参照

- 親: `lessons-learned-issue-515-cf-audit-logs-ml-anomaly-2026-05.md` (Issue #515 ML-ready Classifier)
- 親: `lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md` (Issue #408 threshold 監視 baseline)
- 後継: `unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-production-classifier-switch.md` (FU-03-D production switch)
- skill 昇格: `task-specification-creator/references/phase12-skill-feedback-promotion.md` §`Synthetic Harness vs Production Winner Rule`
- artifact inventory: `references/workflow-issue-548-ml-model-selection-artifact-inventory.md`
