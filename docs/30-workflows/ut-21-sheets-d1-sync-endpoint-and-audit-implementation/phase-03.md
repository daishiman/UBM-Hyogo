# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging (UT-21) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #30 は CLOSED でも仕様書 blocked） |
| タスク分類 | specification-design（design review） |

## 目的

Phase 2 の設計（manual / scheduled / audit / mapper / sheets-client / worker の責務分割）に対して、3 つ以上の代替案を比較し、4条件（価値性 / 実現性 / 整合性 / 運用性）と各観点（不変条件 #1/#4/#5 / 03-serial 契約逸脱 / 認可境界 / Workers ランタイム互換 / Secret hygiene / audit 失敗時挙動）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。03-serial-data-source-and-storage-contract で確定した data-contract / sync-flow / runbook からの逸脱がないことを確認軸に必ず含める。

## 実行タスク

1. 代替案を最低 3 つ列挙する（a: 現行案 audit best-effort + outbox / b: audit を同一 transaction 化 / c: audit を別キューサービスへ委譲 / d: audit 同期省略）（完了条件: 4 案以上が比較表に並ぶ）。
2. 各代替案に対し 4条件 + 観点（不変条件 #1/#4/#5 / 03-serial 契約整合 / 認可境界 / Workers crypto.subtle 互換 / 1Password vault 整合 / audit 失敗時主データ保護）で PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）。
3. base case（Phase 2 採用案 = audit best-effort + outbox 蓄積）を 03-serial の `outputs/phase-02/data-contract.md` 「audit は best-effort + 失敗を別 outbox に蓄積」方針からの逸脱なしで確定する（完了条件: 選定理由が代替案比較から導出されている）。
4. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文が記載されている）。
5. 着手可否ゲートを定義する（完了条件: GO / NO-GO の判定基準が Phase 4 移行の前提として明示されている）。
6. 残課題（open question）を Phase 4 以降に明示的に渡す（完了条件: open question が 0 件 or 受け皿 Phase が指定されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 同期状態遷移の正本（start → fetch → upsert → audit → complete） |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit best-effort + outbox 方針 / upsert 仕様 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-05/sync-deployment-runbook.md | deploy 手順整合 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04) | 検出原典 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | 原典 unassigned-task spec |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | UT-09 AC・依存関係（並列タスク整合） |
| 必須 | CLAUDE.md | 不変条件 #1/#4/#5 / 認証要件 / scripts/cf.sh 経由運用 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Workers `crypto.subtle` RS256 仕様 |

## 代替案比較

### 案 a: audit best-effort + outbox 蓄積（base case = Phase 2 採用 / 03-serial 契約準拠）

- 概要: `runSync` 内で upsert 完了後に `writeAuditLog` を呼ぶ。失敗しても主データはロールバックせず、別 outbox テーブル (`sync_audit_outbox`) に蓄積し後段ジョブで再送する。
- 利点: 03-serial `data-contract.md` の方針と完全整合。主データの保全と監査性の両立。Workers の transaction 範囲制約に抵触しない。
- 欠点: outbox の再送ジョブを別途設計する必要（U-05 想定）。短期的には outbox 残件監視が運用追加項目となる。

### 案 b: audit を同一 D1 transaction 化（main data と audit を atomic 化）

- 概要: `db.batch()` で upsert 文と audit insert を 1 transaction に束ね、audit 失敗時は主データもロールバック。
- 利点: 監査性 100%。outbox 不要で実装が単純。
- 欠点: 03-serial `data-contract.md` の「audit は best-effort + outbox」方針からの **逸脱 MAJOR**。audit 側の何らかの瞬断で主データ同期が長期間止まり、admin-managed data の鮮度を破壊する。Workers の `db.batch()` メモリ制限（バッチサイズ拡大）にも干渉。

### 案 c: audit を別キューサービス（Cloudflare Queues）へ委譲

- 概要: upsert 後に Cloudflare Queues に audit イベントを enqueue し、別 consumer Worker が D1 へ書き込む。
- 利点: 主データ書き込みパスが軽量化。再送/可観測性が Queues の機能で得られる。
- 欠点: MVP スコープ外の依存追加（実現性 MINOR）。Queues は無料枠制約あり。03-serial 契約は「best-effort + outbox」を D1 内で完結させる前提のため、契約変更を要するレベル（整合性 MINOR〜MAJOR）。

### 案 d: audit 同期省略（Workers tail logs のみ）

- 概要: D1 の audit テーブルへ書き込まず、`console.log` + Workers tail で証跡を残す。
- 利点: 実装最小。
- 欠点: 監査要件不足（価値性 MAJOR）。03-serial `data-contract.md` の audit テーブル定義からの逸脱（整合性 MAJOR）。

### 案 e: 認可方式（参考: Auth.js admin role / SYNC_ADMIN_TOKEN Bearer / mTLS）

- 概要: `/admin/sync`・`/admin/sync/responses`・`/admin/sync/audit` の認可方式比較。CLAUDE.md と原典 spec の「Auth.js セッション + admin role + CSRF」を base に、UT-09 で採用された Bearer トークンを scheduled handler 内部呼び出し検証用にのみ補助で残すか検討。
- 結論: SYNC_ADMIN_TOKEN Bearer を base case とし、scheduled handler は env binding（Workers 内部呼び出し / 外部到達不可）で認可境界を担保する。Bearer を API 正本認可として採用する（api-endpoints.md と同期）。

### 代替案 × 評価マトリクス

| 観点 | 案 a (base) | 案 b (atomic) | 案 c (queues) | 案 d (省略) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | PASS | MAJOR |
| 実現性 | PASS | PASS | MINOR（Queues 設定） | PASS |
| 整合性（03-serial 契約逸脱なし） | PASS | MAJOR | MINOR | MAJOR |
| 整合性（不変条件 #1） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #4） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #5） | PASS | PASS | MINOR（consumer も `apps/api` に閉じる必要） | PASS |
| 運用性 | PASS（outbox 監視必要） | MINOR（rollback 連鎖） | MINOR（Queue 監視） | MAJOR |
| 認可境界 | PASS（SYNC_ADMIN_TOKEN Bearer） | PASS | PASS | PASS |
| Workers crypto.subtle 互換 | PASS | PASS | PASS | PASS |
| 1Password vault 整合（Employee/ubm-hyogo-env） | PASS | PASS | PASS | PASS |
| audit 失敗時の主データ保護 | PASS | MAJOR（連鎖ロールバック） | PASS | N/A |

### 採用結論

- base case = 案 a（audit best-effort + outbox 蓄積） + 案 e（SYNC_ADMIN_TOKEN Bearer + scheduled は env binding）。
- 理由: 4条件すべて PASS、03-serial `data-contract.md` の方針からの逸脱なし、主データ保全と監査性が両立、Workers ランタイム互換性 PASS、不変条件 #1/#4/#5 すべて PASS。
- 案 b は 03-serial 契約逸脱 MAJOR のため不採用。案 c は Phase 12 unassigned-task-detection.md に「将来の拡張余地」として候補列挙のみ行う。案 d は監査要件不足のため不採用。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。block にならず、Phase 4 へ進める。 |
| MINOR | 警告レベル。Phase 5 実装時に運用上の補足対応（outbox 監視 runbook 追記等）が必要だが、Phase 4 への移行は許可。 |
| MAJOR | block。Phase 4 に進めない。設計を Phase 2 に差し戻すか、03-serial 契約変更の上位 PR を起こす必要がある。 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | manual / scheduled / audit の 3 経路を `runSync` 共通化で MVP 内に着地 |
| 実現性 | PASS | 03-serial セッションで `apps/api/src/sync/{types,sheets-client,mapper,worker}.ts` 基本実装済み |
| 整合性（03-serial 契約） | PASS | sync-flow / data-contract / runbook いずれからも逸脱なし |
| 整合性（不変条件 #1） | PASS | Sheets schema は `mapper.ts` の COL 定数に閉じ、worker / handler 層に染み出さない |
| 整合性（不変条件 #4） | PASS | admin-managed data は専用テーブル / audit / outbox テーブルへ分離 |
| 整合性（不変条件 #5） | PASS | D1 access は `apps/api/src/sync/*` に閉じ、`apps/web` から直接アクセスしない |
| 運用性 | PASS | `runSync` を pure function 化することで manual / scheduled で同一処理を共有、outbox 監視は U-05 として継承 |
| 認可境界 | PASS | `/admin/sync` / `/admin/sync/responses` / `/admin/sync/audit` に SYNC_ADMIN_TOKEN Bearer middleware を集約配置、scheduled は env binding |
| Workers crypto.subtle 互換 | PASS | googleapis 不使用、`crypto.subtle.importKey` + RSASSA-PKCS1-v1_5 SHA-256 で JWT 署名 |
| Secret hygiene（1Password vault 整合） | PASS | `op://Employee/ubm-hyogo-env/<FIELD>` に統一、wrangler は `scripts/cf.sh` 経由 |
| Service Account 名整合 | PASS | `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` を runbook と doc に統一 |
| audit 失敗時の主データ保護 | PASS | best-effort + outbox 蓄積で主データロールバックなし |
| exactOptionalPropertyTypes 整合 | PASS | SheetRow を `string | undefined` で宣言、DB バインドは `?? null` で null 合体 |

## 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### GO 条件（全て満たすこと）

- [ ] 代替案 4 案以上が評価マトリクスに並んでいる
- [ ] base case の最終判定が全観点 PASS
- [ ] MAJOR が一つも残っていない
- [ ] MINOR がある場合、対応 Phase（5 / 6 / 11 / 12）が指定されている
- [ ] open question が 0 件、または Phase 12 unassigned-task-detection.md への送り先が明記
- [ ] 03-serial の data-contract.md / sync-flow.md / sync-deployment-runbook.md 3 文書からの逸脱が 0 件

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- 03-serial 契約からの逸脱が解消されないまま実装に進もうとしている
- 不変条件 #1 / #4 / #5 のいずれかに違反する設計が残っている
- `/admin/sync*` ルートの SYNC_ADMIN_TOKEN Bearer 方式が未定義
- Service Account JSON が `op://Employee/ubm-hyogo-env/...` 経由でなくハードコードされる設計が残る
- `crypto.subtle` ではなく googleapis 等 Workers 非互換ライブラリへの依存が残る

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | outbox 再送ジョブ（`sync_audit_outbox` consumer）の実装方式 | Phase 12 unassigned (U-05) | 別タスク化候補 |
| 2 | dev / production の Cron スケジュール最終チューニング | Phase 11 / U-03（05a-observability） | 現状両環境 `0 * * * *` |
| 3 | `sync_job_logs` retention 期間（90 日 / 365 日） | Phase 12 / UT-08 | monitoring 連携 |
| 4 | 案 c (Cloudflare Queues 委譲) の将来導入時期 | Phase 12 unassigned | 次 Wave 以降 |
| 5 | Auth.js admin role の判定 source（D1 / claims / Both） | Phase 5 | mvp-auth (13-mvp-auth.md) と整合確認 |

## 実行手順

### ステップ 1: 代替案の列挙

- 案 a〜e を `outputs/phase-03/main.md` に記述する。
- 各案に利点・欠点・結論を 3〜5 行で記述する。

### ステップ 2: 評価マトリクスの作成

- 11 観点（4条件 + 03-serial 契約 + 不変条件 #1/#4/#5 + 認可 + Workers 互換 + Secret hygiene + audit 失敗時挙動）×案を縦持ち横持ちで埋める。
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
| Phase 4 | base case を入力に、Vitest unit / contract / authorization の検証観点を組む |
| Phase 5 | open question #5（SYNC_ADMIN_TOKEN Bearer 検証 source）を実装で確定 |
| Phase 10 | base case の最終 PASS 判定を GO/NO-GO の根拠に再利用 |
| Phase 11 | open question #2（Cron スケジュール）を staging 観測で確認 |
| Phase 12 | open question #1 / #3 / #4 を unassigned-task-detection.md に登録 |

## 多角的チェック観点

- 価値性: base case が manual / scheduled / audit の 3 経路を MVP 範囲で着地できているか。
- 実現性: 03-serial で先行実装された `apps/api/src/sync/*` 構成（types / sheets-client / mapper / worker）を base case が踏襲しているか。
- 整合性（03-serial 契約）: sync-flow.md の状態遷移が `runSync` 内の関数境界と 1:1 対応しているか。
- 整合性（不変条件 #1）: Sheets schema が `mapper.ts` の COL 定数に閉じているか。
- 整合性（不変条件 #4）: admin-managed data 専用テーブル / audit / outbox に分離されているか。
- 整合性（不変条件 #5）: D1 access が `apps/api/src/sync/*` に閉じているか。
- 運用性: `runSync` を pure function 化することで manual / scheduled が同一処理を共有しているか。
- 認可境界: SYNC_ADMIN_TOKEN Bearer が `/admin/sync*` の全ルートで漏れなく適用されるか。
- Workers ランタイム互換: `crypto.subtle` RS256 + `extractable: false` の方針が代替案でも踏襲されているか。
- Secret hygiene: `op://Employee/ubm-hyogo-env/...` に統一され、`scripts/cf.sh` 経由でのみ wrangler が実行されるか。
- audit 失敗時挙動: best-effort + outbox 蓄積で主データロールバックなし、03-serial `data-contract.md` 準拠か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 4 案以上の列挙 | 3 | spec_created | 案 a〜e |
| 2 | 評価マトリクスの作成 | 3 | spec_created | 11 観点 × 4 案 |
| 3 | base case 最終 PASS 判定 | 3 | spec_created | 全観点 PASS |
| 4 | PASS/MINOR/MAJOR 基準の定義 | 3 | spec_created | 3 レベル |
| 5 | 着手可否ゲートの定義 | 3 | spec_created | GO / NO-GO |
| 6 | open question の Phase 振り分け | 3 | spec_created | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・着手可否ゲート |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 代替案が 4 案以上比較されている
- [ ] 11 観点 × 案のマトリクスに空セルが無い
- [ ] base case の最終判定が全観点 PASS
- [ ] PASS / MINOR / MAJOR の判定基準が明文化されている
- [ ] 着手可否ゲートの GO / NO-GO 条件が記述されている
- [ ] open question 5 件すべてに受け皿 Phase が割り当てられている
- [ ] 03-serial 契約 3 文書からの逸脱が 0 件であることを確認している

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-03/main.md` に配置済み
- 4条件 + 11 観点すべてが PASS
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = 案 a（audit best-effort + outbox） + 案 e（SYNC_ADMIN_TOKEN Bearer + scheduled env binding）
  - `runSync` pure function 化方針 → Phase 4 のテスト戦略入力
  - 03-serial `data-contract.md` の audit best-effort 方針を contract test 軸として継承
  - open question 5 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - 03-serial 契約からの逸脱が残っている
