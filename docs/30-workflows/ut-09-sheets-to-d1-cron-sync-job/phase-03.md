# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-27 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク分類 | specification-design（design review） |

## 目的

Phase 2 の設計（sync-job-design.md / d1-contention-mitigation.md）に対して、3 つ以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と各観点（不変条件 / 認可境界 / 無料枠 / Secret hygiene）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。

## 実行タスク

1. 代替案を最低 3 つ列挙する（A: Cron pull / B: push-based webhook / C: 手動 only / D: hybrid Cron + webhook）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 4 観点で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用案 = Cron pull + admin manual）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載されている）。
5. 着手可否ゲートを定義する（完了条件: GO / NO-GO の判定基準が Phase 4 移行の前提として明示されている）。
6. 残課題（open question）を Phase 4 以降に明示的に渡す（完了条件: open question が 0 件 or 受け皿 Phase が指定されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-02/sync-job-design.md | base case の構造 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-02/d1-contention-mitigation.md | base case の競合対策 |
| 必須 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/index.md | WAL 非前提制約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界制約 |
| 参考 | https://developers.google.com/sheets/api/guides/push-notifications | webhook 案の実現性参考 |

## 代替案比較

### 案 A: Cron pull + 手動 admin route（base case = Phase 2 採用）

- 概要: `wrangler.toml` `[triggers]` の Cron で `apps/api` の scheduled handler を起動し、Sheets API から pull、D1 へ batch upsert。`/admin/sync` は手動再実行用。
- 利点: local 開発容易（`wrangler dev --test-scheduled`）、push 系の Sheets watch quota に依存しない、無料枠で完結、UT-21 と契約整合しやすい。
- 欠点: 同期遅延（Cron 間隔分）、Cron 二重起動リスク（lock で対応）。

### 案 B: Push-based webhook（Sheets push notifications）

- 概要: Google Sheets の push notification（drive.changes.watch）で Workers にリアルタイム通知 → 同期。
- 利点: ほぼリアルタイム同期、不要な空 pull が無い。
- 欠点: Sheets push notification は Drive API 経由で TTL（max 7 days）で自動失効しチャネル更新ジョブが別途必要、Service Account では制約あり、local 開発困難、Cloudflare Workers の receive endpoint を public 公開する必要があり認可設計が複雑化。MVP では実現性 MAJOR。

### 案 C: 手動同期のみ（`/admin/sync` のみ）

- 概要: Cron を設けず、運用者が `/admin/sync` を叩いて同期。
- 利点: 実装最小、local 検証が単純。
- 欠点: 価値性 MAJOR（admin-managed data の鮮度が運用者の手作業に依存）。AC-1（Cron による定期実行）を満たせない。

### 案 D: Hybrid（Cron pull + webhook 補完）

- 概要: 案 A をベースに、将来的に push notification を追加。
- 利点: 段階的に rt 性を上げられる。
- 欠点: MVP スコープを越える。Phase 11/12 staging 確認の負荷が倍増。本タスクで導入するには整合性 MINOR。

### 案 E: Cron 別スケジュール案（参考: 1h / 6h / 24h）

- 概要: 案 A の中で Cron 間隔を 1h / 6h / 24h で比較。
- 結論: dev = 1h（迅速な開発検証）、main = 6h（無料枠余裕・admin 鮮度十分）を採用。24h は鮮度不足、1h は無料枠は問題ないが Sheets API quota の余裕を残すため main では採用しない。

### 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (webhook) | 案 C (manual) | 案 D (hybrid) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | MAJOR | PASS |
| 実現性 | PASS | MAJOR（SA + push 制約・channel 再登録） | PASS | MINOR |
| 整合性（不変条件 #1/#4/#5） | PASS | PASS | PASS | PASS |
| 運用性 | PASS | MINOR（channel 失効監視が増える） | MAJOR（人手依存） | MINOR |
| 認可境界 | PASS | MINOR（public webhook endpoint） | PASS | MINOR |
| 無料枠 | PASS | PASS | PASS | PASS |
| local 開発容易性 | PASS | MAJOR | PASS | MINOR |
| WAL 非前提整合 | PASS | PASS | PASS | PASS |

### 採用結論

- base case = 案 A（+ 案 E の dev 1h / main 6h）を採用。
- 理由: 4条件すべて PASS、local 開発容易、Sheets API / D1 / Workers 全て無料枠内、MVP スコープと整合。
- 案 D は「将来の拡張余地」として Phase 12 unassigned-task-detection.md に候補列挙のみ行う（本タスクでは実装しない）。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず、Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 実装時に運用上の補足対応（log / runbook 追記）が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、open question として MVP スコープ外に明確化する。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | admin-managed data の鮮度を 6h 以内で担保し、運用コストゼロ |
| 実現性 | PASS | UT-01/02/03/04 完了済みで技術前提が揃う |
| 整合性 | PASS | 不変条件 #1/#4/#5 を全て満たす設計 |
| 運用性 | PASS | sync_job_logs + sync_locks + `/admin/sync` で観測・冪等・手動再実行が両立 |
| 不変条件 #1 | PASS | mapper 層に Sheets schema を閉じる |
| 不変条件 #4 | PASS | admin-managed data 専用テーブルへ upsert |
| 不変条件 #5 | PASS | D1 access が apps/api 内に閉じる |
| 認可境界 | PASS | scheduled は env binding、`/admin/sync` は Bearer token |
| 無料枠 | PASS | Workers / D1 / Sheets 全て free tier 内 |
| WAL 非前提整合 | PASS | retry/backoff・queue serialization・batch sizing を実装要件として継承 |

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（5 / 6 / 11 / 12）が指定されている
- [ ] open question が 0 件、または Phase 12 unassigned-task-detection.md への送り先が明記

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- WAL 非前提制約に違反する設計が残っている
- `/admin/sync` の認可方式が未定義
- Service Account JSON の Secret 化形式が決定していない

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | dev / main の Cron スケジュール（1h / 6h）を本番運用前に再計測するか | Phase 11 | staging で 1 週間観測 |
| 2 | sync_job_logs の retention 期間（90 日 / 365 日） | Phase 12 / UT-08 | monitoring と連携 |
| 3 | hybrid（案 D）の将来導入時期 | Phase 12 unassigned | 次 Wave 以降 |
| 4 | UT-21 audit hook の同居場所（同 file or 別 module） | Phase 5 | 並列タスクと整合 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 A〜E を `outputs/phase-03/main.md` に記述する。
- 各案に利点・欠点・結論を 3〜5 行で記述する。

### ステップ 2: 評価マトリクスの作成

- 8 観点（4条件 + 不変条件 #1/#4/#5 + 認可 + 無料枠 + local 開発 + WAL 整合）×案を縦持ち横持ちで埋める。
- 空セルが残らないこと。

### ステップ 3: base case の最終判定

- 全 PASS であることを確認する。
- MINOR が残る場合は対応 Phase を明示する。

### ステップ 4: 着手可否ゲートの判定

- GO / NO-GO チェックリストを通す。
- GO の場合のみ artifacts.json の Phase 3 を `spec_created` のままにし、Phase 4 へ進める。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力に、テスト戦略 8 モジュール × 検証種別を組む |
| Phase 5 | open question #4（audit hook の同居場所）を実装で確定 |
| Phase 10 | base case の最終 PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #1 を staging 観測で確認 |
| Phase 12 | open question #2 / #3 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: 案 A が admin-managed data の鮮度を運用コストゼロで担保できているか。
- 実現性: 案 B の MAJOR（push channel 失効・SA 制約）を base case が踏まないか。
- 整合性: 全代替案で不変条件 #1/#4/#5 が PASS であることを確認したか。
- 運用性: 案 C の MAJOR を回避し、Cron + 手動の両輪が機能するか。
- 認可境界: scheduled / `/admin/sync` 両方の認可が PASS であるか。
- 無料枠: dev 1h / main 6h で無料枠超過リスクが無いか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | spec_created | 案 A〜E |
| 2 | 評価マトリクスの作成 | 3 | spec_created | 8 観点 × 4 案 |
| 3 | base case 最終 PASS 判定 | 3 | spec_created | 全観点 PASS |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | spec_created | 3 レベル |
| 5 | 着手可否ゲートの定義 | 3 | spec_created | GO / NO-GO |
| 6 | open question の Phase 振り分け | 3 | spec_created | 4 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 8 観点 × 案のマトリクスに空セルが無い
- [ ] base case の最終判定が全観点 PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 4 件すべてに受け皿 Phase が割り当てられている

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4条件 + 4 観点すべてが PASS
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 A + 案 E（Cron pull、dev 1h / main 6h、`/admin/sync` 手動）
  - 8 モジュール（Phase 2 で確定）に対する検証観点を Phase 4 の入力に渡す
  - open question 4 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
