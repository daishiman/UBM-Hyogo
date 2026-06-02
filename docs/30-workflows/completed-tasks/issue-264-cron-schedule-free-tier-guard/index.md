# issue-264-cron-schedule-free-tier-guard

| 項目 | 値 |
| --- | --- |
| task_id | issue-264-cron-schedule-free-tier-guard |
| 起票元 Issue | #264 [U-UT01-02] Cron 間隔の staging 測定（**CLOSED / クローズドのまま**） |
| 親 Issue | #50（UT-01 Sheets→D1 同期方式定義 / CLOSED） |
| 実装区分 | **実装仕様書（implementation spec）** |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| base_branch | dev |
| supersedes | `docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md` |
| free-tier 制約 | zero new dependency / no paid Cloudflare feature / no runtime deploy |

## このワークフローは何か（中学生にも分かる一言）

「フォームの回答を自動で取り込む“目覚まし時計（cron）”が、Cloudflare の**無料プランで許される数（3 本）**を
うっかり超えないように、**自動で見張るテスト**を作る」ための実装仕様書。

## 背景: issue #264 の調査結論（現行コードに最適化した再スコープ）

issue #264 の本文は「Sheets→D1 同期の既定 cron `0 */6 * * *` を staging で 6h / 1h / 5min の 3 段階で
24h 実測し、最適間隔を ADR で確定する」だった。**最新コードを確認した結果、この前提は obsolete（陳腐化）**:

| 観点 | issue #264 の前提 | 現行コード（2026-05-31 時点） | 出典 |
| --- | --- | --- | --- |
| 同期元 | Google **Sheets** API | Google **Forms** API へ完全移行 | `apps/api/src/jobs/sync-forms-responses.ts`, `index.ts:477-481` |
| 既定 cron | `0 */6 * * *`（6h） | **未デプロイ**（採用されず） | `wrangler.toml` に存在しない |
| Sheets hourly `0 * * * *` | 稼働対象 | **手動限定に撤回**（cron 非登録） | `wrangler.toml` コメント L85-91, `index.ts:539` |
| デプロイ済み cron | 未確定（実測で決める） | **確定済み 3 本**: `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]`（3 セクション一致） | `wrangler.toml:14,91,173` |
| 間隔決定理由 | quota/SLA 実測 | **Cloudflare free-plan の account cron 上限 3 本**に収める統合 | `deployment-cloudflare.md:85-89,269` |

### 結論

- **原 issue の「Sheets を 6h/1h/5min で 24h 実測」タスクは不要（obsolete）**。Sheets cron は撤回済み、
  間隔は free-plan 制約で既に確定・デプロイ済み。`*/5` は外部 API を叩かない D1-only tick（tag queue + notification）で、
  quota 競合の懸念も解消済み。
- ただし、その間隔を守る**回帰ガード（テスト）が存在せず**、現行 Forms ベース構成に対する**正本 ADR / 無料枠予算文書も未整備**。
  4 本目の cron 追加や legacy `0 * * * *` の再混入が起きると、**Cloudflare free-plan のデプロイが静かに壊れる**まで検知できない。
- → 本ワークフローは原 issue を**現行コードに最適化**し、「デプロイ済み 3-cron スケジュールの free-tier 回帰ガード（新規 spec test）＋ ADR / 無料枠予算」へ再定義する。

## デプロイ済み cron → ジョブ対応（正本）

| cron 式 | 頻度 | 駆動ジョブ | 外部 API | free-tier 影響 |
| --- | --- | --- | --- | --- |
| `0 18 * * *` | 1 回/日（03:00 JST） | `runSchemaSync`(Forms batchGet) + `runRetentionPurge` + `runAlertRelayHealthcheck` | Forms API ×1/日 | 無視可 |
| `*/15 * * * *` | 96 回/日 | `runResponseSync`(Forms responses.list, cursor, 200 write cap) + `runSheetsAuthHealthcheck` + `scheduledAuditCorrelation`(条件付) | Forms API ≤96/日 | D1 write ≤19,200/日 < 100k/日 |
| `*/5 * * * *` | 288 回/日 | `runTagQueueRetryTick` + `runNotificationDispatchTick`(条件付) | なし（D1-only） | D1 のみ |
| ~~`0 * * * *`~~ | — | `runScheduledSync`(Sheets) — **手動限定・cron 非登録** | Sheets API | 登録禁止（guard 対象） |

合計 Workers cron 起動 ≈ 385/日 ≪ free Workers 100,000 req/日。env あたり cron 数 = 3 = free-plan 上限（余裕 0 本）。

## 成果物（本サイクルで作ったもの）

1. **新規回帰ガードテスト** `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`（NON_VISUAL / 依存追加なし）
   - `apps/api/wrangler.toml` を読み、3 セクション（`[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]`）の `crons` 配列を抽出し、canonical 値一致・≤3 本・legacy `0 * * * *` 不在・3 セクション parity を assert。
2. **ADR / 無料枠予算表**（`outputs/phase-12/implementation-guide.md` + phase-02 design）— 解析的予算（24h 実測は不要）。

## Phase インデックス

| Phase | ファイル | 内容 |
| --- | --- | --- |
| 1 | phase-01.md | 要件定義（再スコープ根拠・FR/NFR・obsolete 判定） |
| 2 | phase-02.md | 設計（guard test アーキ・extractCrons・ADR/予算表） |
| 3 | phase-03.md | 設計レビュー（free-tier 整合・代替案比較） |
| 4 | phase-04.md | テスト設計（TC-1..5） |
| 5 | phase-05.md | 実装手順（変更ファイル・関数シグネチャ・差分方針） |
| 6 | phase-06.md | テスト拡充 |
| 7 | phase-07.md | カバレッジ確認 |
| 8 | phase-08.md | リファクタリング方針 |
| 9 | phase-09.md | 品質保証（typecheck/lint/test コマンド・DoD） |
| 10 | phase-10.md | 最終レビュー（go/no-go） |
| 11 | phase-11.md | 手動テスト（spec-only evidence / 任意 runtime は user-gated） |
| 12 | phase-12.md | ドキュメント整合・strict 7 |
| 13 | phase-13.md | PR 作成手順（user-gated） |

## 不変条件 / 制約

- CLAUDE.md 不変条件 #5（D1 直接アクセスは `apps/api` のみ） / #8（新規 test は `*.spec.ts` のみ）。
- free-tier: 依存追加 0・paid Cloudflare 機能なし・本サイクルで runtime deploy なし。
- issue #264 は **CLOSED のまま**（GitHub mutation なし）。commit / push / PR は user-gated。
- enum 整合: `SyncLogStatus = running|success|failed|skipped` / `SyncTriggerType = cron|admin|backfill`（issue #266）。

## 参照

- `apps/api/wrangler.toml`（L13-14, L90-91, L172-173）
- `apps/api/src/index.ts` scheduled handler（L420-541）
- `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/scheduled.ts`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（L85-89, L171, L259-269）
- 原仕様: `docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md`（superseded）
