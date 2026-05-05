# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

Phase 2 設計に対し代替案を 3 件以上提示し、PASS / MINOR / MAJOR で判定する。主要論点は (a) mutex 実装方式、(b) scheduled 差分検出キー、(c) backfill transaction 範囲、(d) audit writer の配置（apps/api ローカル vs packages/shared）、(e) Sheets API 認証方式。

## 実行タスク

1. 代替案 6 件以上を列挙
2. PASS / MINOR / MAJOR 判定
3. 採用案の理由
4. 未解決事項を確定 Phase 付きで残す
5. simpler alternative を検討した結果を記録
6. NO-GO 条件 / Phase 4 開始条件を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/sync-module-design.md | 採用案（モジュール構成） |
| 必須 | outputs/phase-02/audit-writer-design.md | audit writer 採用案 |
| 必須 | outputs/phase-02/cron-config.md | Cron 採用案 |
| 必須 | outputs/phase-02/d1-contract-trace.md | mapping 整合 |
| 参考 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | 契約 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Workers 制約 |

## 実行手順

### ステップ 1: 代替案

| 案 | 概要 | 判定 | 理由 |
| --- | --- | --- | --- |
| A: 採用案 — mutex を DB 排他（`sync_job_logs.status='running' + sync_locks` 検出）+ scheduled は `submittedAt` delta + backfill は D1 batch + audit writer は `apps/api/src/sync/audit.ts` ローカル + Sheets 認証は Service Account JWT (`crypto.subtle`) | sync-flow.md §1 / §2 / §3 を素直に実装 | PASS | 不変条件 #5〜#7 完全準拠、追加 binding ゼロ、Workers 互換 |
| B: mutex を Durable Object で実装 | 強整合な lock | MINOR | DO は無料枠外（Paid 必要）、運用コスト増。マルチ region 課題が無い MVP では過剰 |
| C: mutex を Cloudflare KV で実装 | TTL 付き lock | MINOR | KV の eventual consistency により短時間の重複起動可能性あり、AC-7 を満たさない場合がある |
| D: scheduled 差分検出キーを `responseId` revision テーブル比較 | ID リビジョン管理 | MINOR | Sheets には revision 概念がなく追加管理が必要、複雑度↑ |
| E: backfill を全件 INSERT で transaction なし | 簡素 | MAJOR | 部分失敗時に member_identities が壊れる、AC-4 / 不変条件 #7 違反 |
| F: audit writer を `packages/shared` に切り出す | 横断利用 | MINOR | 現状 sync 内に閉じる責務であり、shared 化は YAGNI。将来 admin endpoint からも呼ぶ場合に再検討 |
| G: Sheets 認証を OAuth user delegation | 個人アカウント連携 | MAJOR | Workers 上で refresh token 管理が困難、運用者個人依存 |
| H: scheduled handler を Workers Cron ではなく外部 cron（GitHub Actions）から POST /admin/sync/run | 既存 manual endpoint 再利用 | MINOR | secrets を GitHub に渡す必要、Workers 内蔵 Cron で完結する利点を失う |
| I: backfill を truncate せず upsert + 削除済み検知（Sheets 側 row 消失検知）で同期 | 安全性高 | MINOR | 実装複雑度↑、削除検知は出典 sync-flow.md §3 の truncate-and-reload と異なり契約違反 |

### ステップ 2: 集計

| 判定 | 件数 | 該当 |
| --- | --- | --- |
| PASS | 1 | A |
| MINOR | 6 | B, C, D, F, H, I |
| MAJOR | 2 | E, G |

### ステップ 3: 採用理由

A 案を採用。理由:

- **不変条件への完全準拠**: #4 admin 列分離 / #5 D1 アクセス境界 / #6 Workers 互換 / #7 Sheets を真として backfill すべて満たす
- **無料枠運用**: Durable Object / 追加 service なしで成立
- **契約と差分ゼロ**: sync-flow.md §1〜§5 と 1:1 対応、AC-8 contract test が pass
- **テスタビリティ**: DI 境界を `AuditDeps` / `SheetsClientDeps` で明確化、unit test 容易
- **simpler alternative の比較**: B / C は機能過剰、E / G は契約違反、F は YAGNI

### ステップ 4: 未解決事項

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | mutex の DB 排他で同一 ms 起動の race を防げるか（Cron + manual 同時） | INSERT 前に SELECT count + INSERT で十分（D1 はシリアライズ書き込み） | 4 / 5 で実 D1 で検証 |
| Q2 | backfill 中の D1 batch サイズ上限（50 名 MVP では数十 statements） | D1 batch 一括で安全圏内 | 5 で実測 |
| Q3 | Service Account JWT の有効期限（既定 1h）と scheduled 周期の整合 | 各 invocation で発行、cache しない | 5 |
| Q4 | scheduled で `submittedAt` 同値の取りこぼし（同一秒の複数 row） | `>=` で受けて responseId upsert で重複排除 | 4 / 5 |
| Q5 | rate limit 時の audit row 状態（`running` のまま終了したらどうなるか） | 各 handler の `try/finally` で `failRun` を保証 | 5 / 6 |
| Q6 | `extra_fields_json` に格納された未知 questionId のフォローアップ運用 | Phase 12 で unassigned-task として 07b（schema diff alias）へ引き渡し | 12 |

### ステップ 5: simpler alternative 検討記録

- B / C を **試したが** Workers 無料枠から外れる / consistency 弱い → 不採用
- F を **試したが** 利用者が sync layer に閉じている現状で shared 化は不要 → 将来再検討
- H を **試したが** GitHub Actions に secret を渡す追加コストと、Cron Trigger が無料枠 5 件まで使える事実から不採用

### ステップ 6: NO-GO / blocked 条件

| 条件 | 影響 | 対応 |
| --- | --- | --- |
| U-05（D1 migration）未完了 | sync_audit テーブル不在で起動不能 | Phase 4 開始 NO-GO、U-05 完了待ち |
| 04（secrets 配置）未完了 | Sheets API 認証不能 | Phase 5 / 11 開始 NO-GO |
| 03 contract outputs に変更がある | 契約差分発生 | 即 Phase 1 / 2 へ戻り再評価 |
| Workers の `crypto.subtle` で RS256 JWT 署名が動作しない | Sheets 認証実装不能 | Phase 5 で発覚した場合は外部 token vendor を Phase 1 へ戻して再設計 |
| backfill の D1 batch が CPU time 50ms 制限を超える | 50 名 MVP で発生する可能性低だが要監視 | Phase 5 で実測、超える場合は分割 batch に変更 |

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | A 案前提で test 設計（contract test / mutex 試験 / rate limit 試験） |
| Phase 5 | runbook に Q1〜Q6 の検証手順を組み込む |
| Phase 6 | E 案的「transaction なし」を異常系で再現させ、A 案で防げることを示す |
| Phase 7 | AC-1〜AC-12 整合再確認 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| 代替案件数 | 3 件以上 | 9 件（PASS） |
| 採用案理由明記 | 必須 | TBD |
| 未解決事項の確定 Phase | 全件記載 | TBD |

## 多角的チェック観点

- 不変条件 #4: E 案を MAJOR と判定（admin 列保護不能）→ 採用案 A は安全
- 不変条件 #5: H 案は外部からの POST 経路を追加するため認可境界が広がるリスク → MINOR
- 不変条件 #6: B / G が Workers 互換性に影響 → 不採用 / MAJOR
- 不変条件 #7: I 案は契約と乖離 → MINOR
- 認可境界: A 案は manual / backfill / audit endpoint が `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer、scheduled は internal trigger で外部公開なし
- 価値とコスト: A 案は追加 binding ゼロでコスト最小

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 代替案 9 件 | 3 | pending | A〜I |
| 2 | PASS / MINOR / MAJOR | 3 | pending | 集計 |
| 3 | 採用理由 | 3 | pending | A |
| 4 | 未解決 Q1〜Q6 | 3 | pending | 確定 Phase 付き |
| 5 | NO-GO 条件 | 3 | pending | 5 件 |
| 6 | simpler alt 検討 | 3 | pending | B/C/F/H |

## MINOR 追跡テーブル（gate-decision.md 用）

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 備考 |
| --- | --- | --- | --- | --- |
| TECH-M-01 | mutex DB 排他の race 残存リスク（Q1） | Phase 5 | Phase 6 / 9 | 実 D1 で SELECT+INSERT race を再現試験 |
| TECH-M-02 | scheduled 同秒取りこぼし（Q4） | Phase 5 | Phase 6 | `>=` 採用 + responseId upsert で吸収 |
| TECH-M-03 | audit row が running のまま漏れるリスク（Q5） | Phase 5 | Phase 6 | try/finally で `failRun` 保証 |
| TECH-M-04 | F 案（shared 化）の将来再検討 | Phase 12 | - | unassigned-task として記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案 + 判定 + 採用 + 未解決 + NO-GO |
| メタ | artifacts.json | phase 3 status |

## 完了条件

- [ ] 代替案 3 件以上（9 件記載）
- [ ] 全案に PASS / MINOR / MAJOR 判定
- [ ] 採用案 A の理由が不変条件参照で明記されている
- [ ] 未解決事項 Q1〜Q6 が確定 Phase 付きで記録されている
- [ ] simpler alternative 検討の結果が記録されている
- [ ] NO-GO / Phase 4 開始 blocked 条件が記載されている
- [ ] MINOR 追跡テーブルが記入されている
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-03/main.md 配置
- 不変条件 #4 / #6 / #7 違反案（E / G / I）が MAJOR / MINOR と判定
- 次 Phase へ Q1〜Q6 と TECH-M-01〜04 を引継ぎ
- artifacts.json の phase 3 を completed に更新

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項:
  - A 案前提の contract test / unit test / mutex 試験 / rate limit 試験設計
  - Q1〜Q6 の検証手段を test matrix に展開
  - TECH-M-01〜04 を Phase 5 / 6 / 9 / 12 で解決確認
- ブロック条件: 採用案未確定 / Q1〜Q6 未記載 / U-05 未完了の場合は進まない（Phase 1 / 2 / 3 で重複明記）

## Phase 13 blocked 条件（早期警告）

- contract test が pass していない（AC-8 違反）
- `sync_audit` row が finalize されない経路が残っている（AC-5 違反）
- backfill が admin 列に touch する痕跡がある（AC-4 / 不変条件 #4 違反）
- 上記いずれかが残ったまま Phase 13 PR 作成に進んだ場合、ユーザー承認を得られない
