# Phase 3 成果物: 設計レビュー（u-04 sheets-to-d1-sync-implementation）

> 状態: completed-design
> 上位仕様: `../../phase-03.md`
> 入力: `outputs/phase-01/main.md`、`outputs/phase-02/{main,sync-module-design,audit-writer-design,cron-config,d1-contract-trace}.md`

## 1. レビュー対象

Phase 2 で確定した A 案（採用案）:
- mutex = DB 排他（既存 `sync_locks` 単文 INSERT）
- scheduled 差分検出 = `submittedAt >= last_success.finished_at` + responseId upsert
- backfill = D1 batch transaction で truncate-and-reload（admin 列は不可触）
- audit writer = `apps/api/src/sync/audit.ts` ローカル、物理は既存 `sync_job_logs` に寄せる
- Sheets API 認証 = Service Account JWT（`crypto.subtle` RS256）
- 既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` を `apps/api/src/sync/*` に責務分離移植

## 2. 代替案 9 件と判定

| 案 | 概要 | 判定 | 理由 |
| --- | --- | --- | --- |
| **A: 採用案** — mutex を DB 排他（`sync_locks`）+ scheduled `submittedAt` delta + backfill D1 batch + audit writer は `apps/api/src/sync/audit.ts` ローカル + Sheets 認証 Service Account JWT (`crypto.subtle`) + 物理は `sync_job_logs` | sync-flow.md §1〜§3 を素直に実装 | **PASS** | 不変条件 #4〜#7 完全準拠、追加 binding ゼロ、Workers 互換、既存実装の流用で移植コスト最小 |
| B: mutex を Durable Object で実装 | 強整合な lock | MINOR | DO は無料枠外（Workers Paid 必要）、運用コスト増。マルチ region 課題が無い MVP では過剰。Free tier 維持要件と整合しない |
| C: mutex を Cloudflare KV で実装 | TTL 付き lock | MINOR | KV の eventual consistency により短時間の重複起動可能性、AC-7 を確実に満たすには D1 排他が安全 |
| D: scheduled 差分検出キーを `responseId` revision テーブル比較 | ID リビジョン管理 | MINOR | Sheets には revision 概念がなく追加管理が必要、複雑度↑。`submittedAt >=` で要件を満たせる |
| E: backfill を全件 INSERT、transaction なし | 簡素 | **MAJOR** | 部分失敗時に member_identities が壊れる、AC-4 / 不変条件 #7 違反。truncate-and-reload を transaction で囲まないと整合性破綻 |
| F: audit writer を `packages/shared` に切り出す | 横断利用 | MINOR | 現状 sync 内に閉じる責務、shared 化は YAGNI。将来 admin endpoint からも呼ぶ場合に再検討（TECH-M-04）|
| G: Sheets 認証を OAuth user delegation | 個人アカウント連携 | **MAJOR** | Workers 上で refresh token 管理が困難、運用者個人依存、Service Account の方が運用安定 |
| H: scheduled handler を Workers Cron ではなく外部 cron（GitHub Actions）から `POST /admin/sync/run` | 既存 manual endpoint 再利用 | MINOR | secrets を GitHub に渡す追加コスト、Workers 内蔵 Cron で完結する利点を失う、認可境界が広がる |
| I: backfill を truncate せず upsert + 削除済み検知（Sheets 側 row 消失検知）で同期 | 安全性高 | MINOR | 実装複雑度↑、削除検知は出典 sync-flow.md §3 の truncate-and-reload と異なり契約違反 |
| J（追加）: 新規 `sync_audit` テーブルを U-05 で追加し、既存 `sync_job_logs` を deprecation | 契約論理名と物理名一致 | MINOR | U-05 の負荷増、二重 ledger 期間が発生（観測欠落リスク）。本タスクの DD-01 採用方針（既存テーブルへ writer を寄せる）の方が安全 |

### 集計

| 判定 | 件数 | 該当 |
| --- | --- | --- |
| PASS | 1 | A |
| MINOR | 7 | B, C, D, F, H, I, J |
| MAJOR | 2 | E, G |

## 3. 採用理由（A 案）

- **不変条件への完全準拠**:
  - #2 consent 統一 → AC-11
  - #4 admin 列分離 → backfill SQL の更新句から admin 列を除外
  - #5 D1 アクセス境界 → `apps/api/src/sync/` 配置
  - #6 Workers 互換 → `crypto.subtle` RS256 で fetch ベース実装
  - #7 Sheets を真として backfill → truncate-and-reload を transaction で原子化
- **無料枠運用**: Durable Object / KV / 追加 service なしで成立、Free tier 内
- **契約と差分ゼロ**: sync-flow.md §1〜§5 と 1:1 対応、AC-8 contract test が pass する設計
- **テスタビリティ**: DI 境界（`AuditDeps` / `SheetsClientDeps` / `MappingResolver`）で unit test 容易
- **既存実装活用**: `apps/api/src/jobs/sync-sheets-to-d1.ts` / `sync-lock.ts` / `sheets-fetcher.ts` / `mappers/` の流用で移植コスト最小
- **simpler alternative の比較**: B / C は機能過剰または整合性弱い、E / G は契約違反、F / J は YAGNI

## 4. 未解決事項（Q1〜Q6）

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | mutex の DB 排他で同一 ms 起動 race（Cron + manual 同時）を防げるか | `sync_locks` PK = UNIQUE 違反で取得失敗、D1 のシリアライズ書き込みで成立。INSERT 前に SELECT 不要 | Phase 5 / 6 で実 D1 検証（TECH-M-01） |
| Q2 | backfill D1 batch サイズ上限（50 名 MVP では数十 statements） | D1 `db.batch([...])` で安全圏内、CPU 10ms 以内に収まる想定 | Phase 5 で実測 |
| Q3 | Service Account JWT の有効期限（1h）と scheduled 周期の整合 | 各 invocation で発行、`getAccessToken()` で 60s safety margin の cache。既存実装で動作実績あり | Phase 5 で再確認 |
| Q4 | scheduled で `submittedAt` 同値の取りこぼし（同一秒の複数 row） | `>=` で受けて responseId upsert で重複排除（既存 `decideShouldUpdate` ロジックを継承）| Phase 4 / 5（TECH-M-02） |
| Q5 | rate limit 時の audit row 状態（`running` のまま終了したらどうなるか） | 各 handler の `try/finally` で `failRun` を保証、stale lock は次回 INSERT 前に `DELETE WHERE expires_at<now` で解放 | Phase 5 / 6（TECH-M-03） |
| Q6 | `extra_fields_json` に格納された未知 questionId のフォローアップ運用 | 03b（forms response sync / schema diff queue）owner に委譲、本タスクは退避まで | Phase 12 で unassigned-task として 07b へ引き渡し（TECH-M-04） |

## 5. simpler alternative 検討記録

- **B / C を試したが** Workers 無料枠から外れる / consistency 弱い → 不採用
- **F を試したが** 利用者が sync layer に閉じている現状で shared 化は不要 → 将来再検討（TECH-M-04）
- **H を試したが** GitHub Actions に secret を渡す追加コストと、Cron Trigger が無料枠 5 件まで使える事実から不採用
- **J を試したが** 新規 `sync_audit` テーブル追加は U-05 owner の負荷増、既存 `sync_job_logs` writer 寄せで観測継続性を確保

## 6. NO-GO / blocked 条件（Phase 4 開始）

| 条件 | 影響 | 対応 |
| --- | --- | --- |
| U-05（D1 migration）未完了 | `sync_job_logs` への `inserted_count` / `diff_summary_json` 等の列追加が未済 → writer は既存列のみで暫定動作。Phase 5 直前ゲートで U-05 完了確認 | Phase 4 のテスト戦略では既存列セットでの contract test を主、列追加後の追補テストを副とする |
| 04（secrets 配置）未完了 | Sheets API 認証不能 | Phase 5 / 11 開始 NO-GO、04 完了待ち |
| 03 contract outputs に変更がある | 契約差分発生 | 即 Phase 1 / 2 へ戻り再評価 |
| Workers の `crypto.subtle` で RS256 JWT 署名が動作しない | Sheets 認証実装不能 | 既存実装で動作実績あり、Phase 5 で再確認のみ |
| backfill の D1 batch が CPU time 10ms / 50ms 制限を超える | 50 名 MVP では発生可能性低だが要監視 | Phase 5 で実測、超える場合は chunk 分割 / Workers Paid 移行 |
| 既存 03a / 03b cron expression を誤って削除 | 別 wave のジョブ停止 | wrangler.toml 編集を `0 */6 → 0 *` の 1 行差分に限定、PR レビューで検証 |

## 7. 既存実装との差分・移行戦略（追補）

| 項目 | 既存 | 採用 A 案 | 移行戦略 |
| --- | --- | --- | --- |
| sync core 配置 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | `apps/api/src/sync/{manual,scheduled,backfill}.ts` | Phase 5 で新ファイル作成、jobs/ 側は薄い deprecation re-export として 1 phase 維持、Phase 9 で削除 |
| mutex | `apps/api/src/jobs/sync-lock.ts`（`sync_locks` 単文 INSERT） | `apps/api/src/sync/mutex.ts` で同等インターフェース継承 | export 移動のみ、SQL は変更なし |
| Sheets fetcher | `apps/api/src/jobs/sheets-fetcher.ts`（`GoogleSheetsFetcher` クラス） | `apps/api/src/sync/sheets-client.ts`（`createSheetsClient` factory + `fetchAll` / `fetchDelta`）| factory 化、`fetchDelta` 追加 |
| mapping | `apps/api/src/jobs/mappers/sheets-to-members.ts` | `apps/api/src/sync/mapping.ts`（`form_field_aliases` reader 接続） | re-export → Phase 9 物理移動、alias テーブル参照を追加 |
| audit ledger | `sync_job_logs` への INSERT/UPDATE（既存 `runSync`） | `apps/api/src/sync/audit.ts`（`startRun`/`finishRun`/`failRun`/`skipRun`/`listRecent`） | writer 関数化、`trigger` 値正規化（manual ↔ admin）、`status='skipped'` 対応追加 |
| manual endpoint | `POST /admin/sync` | `POST /admin/sync/run`（正本） + `/admin/sync` 互換 mount | DD-09、Phase 12 で deprecation 通知 |
| Cron expression（prod） | `0 */6 * * *` | `0 * * * *` | wrangler.toml の 1 行変更 |
| Forms response sync | `apps/api/src/jobs/sync-forms-responses.ts` | **触らない** | 別 wave、独自 ledger（DD-08） |

## 8. リスク

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| 既存 `runSync` の e2e テストが path / trigger 値変更で破綻 | テスト失敗 | `/admin/sync` 互換 mount + `trigger='admin'` 正規化で互換性維持 |
| `sync_job_logs` の不足列（inserted_count 等）で観測精度低下 | observability 弱化 | writer をフラグ駆動にし、U-05 列追加後にフルカラム書き込みへ切替（audit-writer-design.md §2.1） |
| 03a / 03b cron との同 minute 競合（`0 * * * *` と `*/15 * * * *` は :00 で重なる） | DB 同時書込 | 別 ledger / 別テーブル群を扱うため衝突しない。`sync_locks` も sync 系のみ |
| backfill 実行中の他 sync ブロック | ユーザー体感遅延 | mutex で意図通り、運用 runbook で「backfill は深夜帯」と注記（Phase 5）|

## 9. 多角的チェック

- 不変条件 #4: E 案を MAJOR と判定（admin 列保護不能）→ 採用案 A は §2.3 backfill 設計と d1-contract-trace.md §5 で安全
- 不変条件 #5: H 案は外部からの POST 経路を追加するため認可境界が広がるリスク → MINOR
- 不変条件 #6: B / G が Workers 互換性に影響 → MINOR / MAJOR
- 不変条件 #7: I 案は契約と乖離 → MINOR
- 認可境界: A 案は manual / backfill / audit endpoint が `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer、scheduled は internal trigger で外部公開なし
- 価値とコスト: A 案は追加 binding ゼロ、既存実装流用で移植コスト最小

## 10. MINOR 追跡テーブル（gate-decision.md 用）

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| TECH-M-01 | mutex DB 排他の race 残存リスク（Q1） | Phase 5 | Phase 6 / 9 | 実 D1 で同時 INSERT race を再現試験 |
| TECH-M-02 | scheduled 同秒取りこぼし（Q4） | Phase 5 | Phase 6 | `>=` 採用 + responseId upsert で吸収 |
| TECH-M-03 | audit row が running のまま漏れるリスク（Q5） | Phase 5 | Phase 6 | try/finally で `failRun` 保証 |
| TECH-M-04 | F 案（shared 化）の将来再検討 | Phase 12 | - | unassigned-task として記録 |
| TECH-M-05 | `sync_job_logs` 不足列（inserted/updated/skipped/diff_summary_json）の U-05 列追加待ち | Phase 5 | Phase 8 | writer フラグ駆動で互換維持 |
| TECH-M-06 | `POST /admin/sync` 互換 mount の最終削除（DD-09） | Phase 12 | 後続タスク | deprecation 通知 |

## 11. サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 代替案 9 件 | completed | A〜I + J（追加） |
| 2 | PASS / MINOR / MAJOR | completed | §2 集計 |
| 3 | 採用理由 | completed | §3 |
| 4 | 未解決 Q1〜Q6 | completed | §4 |
| 5 | NO-GO 条件 | completed | §6 |
| 6 | simpler alt 検討 | completed | §5 |

## 12. 完了条件チェック

- [x] 代替案 3 件以上（10 件記載）
- [x] 全案に PASS / MINOR / MAJOR 判定
- [x] 採用案 A の理由が不変条件参照で明記されている（§3）
- [x] 未解決事項 Q1〜Q6 が確定 Phase 付きで記録されている（§4）
- [x] simpler alternative 検討の結果が記録されている（§5）
- [x] NO-GO / Phase 4 開始 blocked 条件が記載されている（§6）
- [x] MINOR 追跡テーブルが記入されている（§10、6 件）
- [x] 本 Phase 内の全タスクを 100% 実行完了

## 13. 次 Phase（Phase 4）への引き継ぎ事項

- A 案前提の contract test / unit test / mutex 試験 / rate limit 試験設計
- Q1〜Q6 の検証手段を test matrix に展開
- TECH-M-01〜06 を Phase 5 / 6 / 8 / 9 / 12 で解決確認
- 既存 `runSync` のテスト互換維持戦略（`POST /admin/sync` mount + `trigger='admin'` 正規化）

## 14. Phase 13 blocked 条件（早期警告）

- contract test が pass していない（AC-8 違反）
- audit row が finalize されない経路が残っている（AC-5 違反）
- backfill が admin 列に touch する痕跡がある（AC-4 / 不変条件 #4 違反）
- 既存 03a / 03b cron expression を誤って削除している
- 上記いずれかが残ったまま Phase 13 PR 作成に進んだ場合、ユーザー承認を得られない
