# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (受け入れ確認) |
| 次 Phase | 13 (PR 作成) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 起源 Issue | GitHub #67（CLOSED 維持・reopen しない） |
| 状態 | pending |

## 目的

実装ガイド（中学生レベル + 技術者レベル）/ システム仕様書更新 / ドキュメント更新履歴 / 未タスク検出 / スキルフィードバック / 仕様準拠自己点検 の **7 ファイル**（main.md + 6 補助）を outputs/phase-12/ に揃え、後続タスク（05b smoke readiness / 09b cron monitoring）と global skill（aiworkflow-requirements / task-specification-creator）へ current facts として反映する。

## 必須出力ファイル一覧（合計 7、欠落で FAIL）

| # | ファイル | 由来 Task |
| - | --- | --- |
| 1 | outputs/phase-12/main.md | Phase 12 本体サマリー |
| 2 | outputs/phase-12/implementation-guide.md | Task 1（Part 1 + Part 2） |
| 3 | outputs/phase-12/system-spec-update-summary.md | Task 2（Step 1-A/1-B/1-C + Step 2 判定） |
| 4 | outputs/phase-12/documentation-changelog.md | Task 3 |
| 5 | outputs/phase-12/unassigned-task-detection.md | Task 4（**0 件でも必須**） |
| 6 | outputs/phase-12/skill-feedback-report.md | Task 5（**改善点なしでも必須**） |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 6（最終 self-check） |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-12 |
| 必須 | outputs/phase-02/main.md ほか設計 4 種 | sync 設計 |
| 必須 | outputs/phase-05/runbook.md | 運用手順 |
| 必須 | outputs/phase-09/main.md | 品質結果 |
| 必須 | outputs/phase-11/main.md | smoke 結果 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 5 タスク厳格仕様 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | UBM-009〜016 漏れ防止 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | docs フォーマット |
| 必須 | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Step 1-A/B/C 手順 |
| 必須 | `docs/30-workflows/02-application-implementation/_templates/phase-meaning-app.md` | Part 1 中学生レベルテンプレ |
| 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | Step 1-A 追記対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Step 1-B 追記対象 |
| 参考 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 制約 |

---

## 実行タスク

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（Step 1-A / 1-B / 1-C + Step 2 判定）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（0 件でも出力必須）
5. スキルフィードバックレポート作成（改善点なしでも出力必須）
6. Phase 12 自己点検（compliance check, root evidence）

---

## Task 1: implementation-guide.md（2 パート構成）

出力先: `outputs/phase-12/implementation-guide.md`

### Part 1: 中学生レベル（必須要件チェックリスト）

- [ ] 日常生活の例え話から開始する（下記テンプレ）
- [ ] 専門用語ゼロ。出現する場合は同じ文中で日常語に言い換える
- [ ] 「困りごと → 解決後の状態 → 何をするか」の順
- [ ] 200〜400 字目安

**Part 1 必須テンプレ（参考スニペット）**:

> UBM 兵庫支部会では、入会希望者が Google フォーム（Web 上の申込用紙）に答えることで「名簿の写し」が Google スプレッドシート（表計算ソフト）に積み上がります。
> ただし、表計算ソフトのデータをそのままサイトに出すのは、毎回紙の名簿をコピーしに事務所まで取りに行くようなもので、遅くて壊れやすいです。
> このタスクは、その**名簿の写しを 1 時間に 1 回、Cloudflare D1 という「カギ付きの引き出し」に自動でコピー**する仕組みを作ります。
> さらに、「いつコピーしたか」「成功したか失敗したか」を別ノート（`sync_audit` という台帳）に毎回書き残すので、後から「先週の水曜のコピーは無事だったか？」をすぐ確認できます。
> こうすることで、サイトの表示が速くなり、もし Google 側が止まっても D1 に直近のコピーが残っているので、サイトは普段どおりに動き続けます。

**Part 1 専門用語セルフチェック**（書き終えたら確認）:

| 専門用語 | 言い換え |
| --- | --- |
| Sheets | Google スプレッドシート（表計算ソフト） |
| D1 | Cloudflare のカギ付き引き出し（クラウド DB） |
| Cron | 「毎時 0 分に動かす」目覚まし時計の設定 |
| Workers | Cloudflare のサーバー |
| audit | 作業日誌・台帳 |
| upsert | 「あれば更新、なければ追加」の書き込み方 |
| mutex | 「同時に 2 人が書かないようにする錠前」 |
| backfill | 過去分まとめてやり直しコピー |

### Part 2: 技術者レベル（必須要件チェックリスト）

- [ ] TypeScript の interface / type 定義を含む
- [ ] API シグネチャ + 使用例
- [ ] エラーハンドリングとエッジケース
- [ ] 設定可能なパラメータと定数を一覧化
- [ ] 実行コマンド（cf.sh ラッパー経由）の検証手順

**Part 2 章構成**:

| 章 | 内容 |
| --- | --- |
| 1. 全体構成 | `apps/api/src/sync/` のモジュール 10 ファイル責務 |
| 2. 型定義 | `SyncTrigger = 'manual' \| 'scheduled' \| 'backfill'`, `AuditRow`, `DiffSummary`, `MappingResult` |
| 3. API | `POST /admin/sync/run`, `POST /admin/sync/backfill`, `GET /admin/sync/audit`, `scheduled()` handler シグネチャ |
| 4. 使用例 | curl による manual 起動例、`bash scripts/cf.sh dispatch`、audit ledger query |
| 5. エラーハンドリング | rate_limited / sheets_unauthorized / mutex_held / mapping_unmapped の error_class 分類 |
| 6. エッジケース | 同 responseId 再回答、consent 値変更、Sheets 列追加、cron 重複起動 |
| 7. 設定値 | Cron Trigger `0 * * * *`、`SYNC_MAX_RETRIES=3`（実装上限 3）、batch_size 100 |
| 8. 検証コマンド | `mise exec -- pnpm --filter @ubm/api test`、`bash scripts/cf.sh d1 execute ...`、契約テスト実行 |
| 9. 既知制限 | D1 batch / transaction サイズは Phase 5 で実測、Workers CPU time はプランと実行経路に依存するため Phase 8/11 evidence で確認 |

---

## Task 2: system-spec-update-summary.md

出力先: `outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: タスク完了記録（必須）

| 更新対象 | 追記内容 | 配置箇所 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | 「Sheets → D1 sync 実装」節を新設し、`apps/api/src/sync/` の 4 handler + audit writer を current facts として記載。manual / scheduled / backfill 三系統と mutex 設計を 1 段落 + 1 表で要約 | apps/api 責務節の直下 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 「Cron Triggers」節に `[triggers] crons = ["0 * * * *"]` 設定例と scheduled handler 起動経路を追記。`bash scripts/cf.sh deploy` 経由のみで反映する旨を明記 | Cron 章 or 新設 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/sync/run` / `/admin/sync/backfill` / `/admin/sync/audit` を `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer endpoint として追記または更新 | 管理 / sync API 節 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_RANGE` / `SYNC_MAX_RETRIES` / `SYNC_ADMIN_TOKEN` の配置層を同期 | Cloudflare Workers / API env 節 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | U-04 の状態、UT-01 との ledger compatibility decision、05b / 09b relay を同期 | active workflow 表 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` | U-04 current facts と UT-01 導線を同 wave で索引化 | Sheets→D1 / sync / workflow inventory |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | ファイル実体なしのため N/A。代替として `outputs/phase-12/documentation-changelog.md` に記録 | N/A |
| `.claude/skills/task-specification-creator/LOGS.md` | ファイル実体なしのため N/A。代替として `outputs/phase-12/skill-feedback-report.md` に記録 | N/A |
| `.claude/skills/aiworkflow-requirements/references/topic-map.md` | `sheets-d1-sync` トピックを追加（参照: architecture-overview-core.md 該当節 / deployment-cloudflare.md Cron 節） | 該当カテゴリ |
| `docs/30-workflows/completed-tasks/_index.md`（または index ledger） | u-04 を completed に追加 | 末尾 |
| `docs/30-workflows/completed-tasks/U-04-sheets-to-d1-sync-implementation.md` | 冒頭に `> Status: completed (2026-04-30) → docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` を追記 | header |

### Step 1-B: 実装状況テーブル更新

| ファイル | 旧 | 新 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/U-04-sheets-to-d1-sync-implementation.md` | 未実装 | completed |
| 関連 task index（`task-workflow.md` 等） | spec_created / 該当なし | completed |

### Step 1-C: 関連タスクテーブル更新

| ファイル | 行 | 更新内容 |
| --- | --- | --- |
| 03-serial-data-source-and-storage-contract index | 下流 U-04 行 | spec_created → completed |
| 05b-parallel-smoke-readiness-and-handoff index | 上流 U-04 行 | pending → ready（U-04 完了で smoke 開始可） |
| 09b-parallel-cron-triggers-monitoring-and-release-runbook index | 上流 U-04 行 | pending → ready（Cron 配備済み、監視設計可） |

### Step 1-D: 上流 runbook 差分追記タイミング

| 上流 | 判定 | 配置 |
| --- | --- | --- |
| 03 contract data-contract.md | same-wave 同期不要（契約変更なし） | baseline 留置 |
| `outputs/phase-05/runbook.md` | same-wave 反映済み | 本タスク内 |

### Step 2: aiworkflow-requirements 仕様更新（条件付き）

判定: **実施する**。

理由: `apps/api/src/sync/` 配下の新規モジュール公開、新規 endpoint 3 種（`/admin/sync/run` / `/admin/sync/backfill` / `/admin/sync/audit`）と scheduled handler の追加は新規インターフェースに該当する。

| 更新対象 | 内容 |
| --- | --- |
| architecture-overview-core.md | sync layer 節を Step 1-A で追記済み |
| deployment-cloudflare.md | Cron Triggers + scheduled handler を Step 1-A で追記済み |
| 必要に応じ `endpoints` テーブル / API contract 仕様 | 3 endpoint + scheduled の登録 |

> Step 1-A の追記と Step 2 の追記が同一範囲を指すため、`spec-update-workflow.md` に従い 1 PR 内で同期する（drift 防止）。

---

## Task 3: documentation-changelog.md

出力先: `outputs/phase-12/documentation-changelog.md`

```markdown
| 日付       | Step  | 変更                                                                                       | 理由                          |
| ---------- | ----- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| 2026-04-30 | 1-A   | architecture-overview-core.md に「Sheets → D1 sync 実装」節を追加                          | U-04 完了 current facts 反映  |
| 2026-04-30 | 1-A   | deployment-cloudflare.md に Cron Triggers + scheduled handler 節を追加                     | U-04 完了 current facts 反映  |
| 2026-04-30 | 1-A   | aiworkflow-requirements/LOGS.md に U-04 完了 entry append                                  | LOGS x2 同期                  |
| 2026-04-30 | 1-A   | task-specification-creator/LOGS.md に U-04 Phase 12 close-out entry append                 | LOGS x2 同期                  |
| 2026-04-30 | 1-A   | topic-map.md に `sheets-d1-sync` トピック追加                                              | topic-map 同期                |
| 2026-04-30 | 1-B   | unassigned-task/U-04-*.md status を completed へ                                           | 実装状況テーブル更新          |
| 2026-04-30 | 1-C   | 03 / 05b / 09b の関連タスクテーブル status 更新                                            | 関連タスクテーブル current 化 |
| 2026-04-30 | Step2 | endpoints 3 件 + scheduled handler を仕様に登録                                            | 新規インターフェース追加      |
```

> 全 Step を個別に明記すること（「該当なし」も明記）。workflow-local 同期と global skill sync は別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。

---

## Task 4: unassigned-task-detection.md（0 件でも必須）

出力先: `outputs/phase-12/unassigned-task-detection.md`

### 検出スコープ

| ソース | 確認 |
| --- | --- |
| index.md「含まない」節 | U-05 migration / 04 secrets / 06c admin UI / 07b form schema diff / 09b monitoring（既存タスクへ既割当 → 未タスク化不要） |
| Phase 3 / 10 MINOR 指摘 | Phase 3 / 10 で MINOR 判定があれば必ず未タスク化（生成時点で 0 件想定だが、Phase 10 の最終結果を反映する） |
| Phase 11 smoke 発見事項 | running 残留 alert（09b へ引き継ぎ済み） |
| TODO / FIXME / HACK | `grep -rn -E "TODO\|FIXME\|HACK\|XXX" apps/api/src/sync/` 結果を貼付 |
| describe.skip | 同上で 0 件確認 |

### 期待される件数と書式

- **検出件数 0 件であってもファイルは必ず作成する**
- 0 件の場合は冒頭に `## 検出件数: 0` を明記し、上記スコープ表を残す
- 1 件以上ある場合は `unassigned-task-required-sections.md` の 4 必須セクション（苦戦箇所【記入必須】/ リスクと対策 / 検証方法 / スコープ）を含む派生 task 仕様（`docs/30-workflows/unassigned-task/task-{cat}-...-NNN.md`）を別途作成し、本ファイルから link する

### 想定（U-04 固有は 0 件、検証で見つかった横断課題は別 backlog）

U-04 のスコープ外（U-05 / 04 / 06c / 07b / 09b）はすべて **既存の planned task** に割当済みのため、U-04 固有の追加 unassigned task は 0 件を想定する。
ただし Phase 12 最終検証で `validate-structure.js` の reference line budget warning が見つかった場合は、U-04 実装とは分けて `docs/30-workflows/unassigned-task/` に横断 backlog として formalize する。

---

## Task 5: skill-feedback-report.md（改善点なしでも必須）

出力先: `outputs/phase-12/skill-feedback-report.md`

| 観点 | 内容 |
| --- | --- |
| 役立ったスキル | task-specification-creator の Phase 11 NON_VISUAL alternative evidence ガイド、aiworkflow-requirements の deployment-cloudflare.md（Cron 制約） |
| 役立ったパターン | UBM-012 の cf.sh ラッパー強制、UBM-014 の dev/test/production 挙動分離 |
| 困難 | Sheets API の Service Account JWT を Workers `crypto.subtle` で署名する手順が既存仕様に未記載で、Phase 2 設計時に独自検証が必要だった |
| 改善案（テンプレ） | implementation テンプレに「外部 SaaS auth を Workers でやる際の crypto.subtle 検証手順」セクションを追加すると次回以降の sync 系タスクで再利用できる |
| 改善案（ワークフロー） | Phase 11 の `bash scripts/cf.sh dispatch` 失敗時の代替（cron 表現の一時短縮）を `phase-11-non-visual-alternative-evidence.md` に追記すると良い |
| 改善案（ドキュメント） | aiworkflow-requirements に「sync 系タスク汎用パターン（mutex / audit writer / backoff）」のリファレンス節を新設すると次の sync 系タスク（例: Slack / GAS 連携）で参照できる |

> 改善点が真に 0 件の場合でも「観点列を空欄で残す」ことは禁止。最低限「現時点で改善点なし」を明記する。

---

## Task 6: phase12-task-spec-compliance-check.md

出力先: `outputs/phase-12/phase12-task-spec-compliance-check.md`

| チェック | 期待 | 結果記録 |
| --- | --- | --- |
| 13 phase 構成完備 | OK | `ls phase-*.md \| wc -l` == 13 |
| outputs/phase-12 7 ファイル揃い | OK | 上記必須出力一覧と 1:1 |
| Part 1 専門用語セルフチェック通過 | OK | 言い換え表 8 行確認 |
| Step 1-A LOGS x2 更新 | OK | 2 ファイルへ append |
| Step 1-B 実装状況更新 | OK | unassigned ledger 反映 |
| Step 1-C 関連タスクテーブル更新 | OK | 03 / 05b / 09b |
| Task 4 unassigned 0 件レポート存在 | OK | 0 件でも生成 |
| Task 5 feedback レポート存在 | OK | 改善なしでも生成 |
| AC-1〜AC-12 トレース | OK | implementation-guide Part 2 + Phase 11 マトリクス |
| 不変条件 #1〜#7 trace | OK | implementation-guide Part 2 §エッジケース |
| `screenshots/` 不在 | OK | NON_VISUAL |
| Issue #67 reopen 回避記録 | OK | index.md Decision Log + Phase 13 `Refs #67` |

> Task 6 の `PASS` 断言は **成果物の実体 + validator 実測値 + same-wave sync 証跡が揃った後のみ** 許可（[phase-12-spec.md] §Task 6 ルール）。1 つでも欠落の場合は `FAIL` とし blocker を列挙する。

---

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description に 7 ファイルすべての link を貼付 |
| 下流 05b | smoke readiness の入力（implementation-guide Part 2 §4 を参照） |
| 下流 09b | Cron 監視 / runbook 化の入力（system-spec-update-summary.md の Cron 節） |
| global skill | aiworkflow-requirements / task-specification-creator の LOGS / SKILL に同期 |

## 多角的チェック観点

| # | 不変条件 | 反映場所 |
| --- | --- | --- |
| #1 | schema コード固定回避 | implementation-guide Part 2 §2（mapping は form_field_aliases 駆動） |
| #2 | consent キー統一 | implementation-guide Part 2 §6（consent 値変更） |
| #3 | responseEmail = system field | implementation-guide Part 2 §2 型定義 |
| #4 | admin 列分離 | implementation-guide Part 2 §1 backfill 章 |
| #5 | apps/web から D1 直接禁止 | implementation-guide Part 2 §1 + system-spec-update-summary §architecture-overview-core 追記 |
| #6 | GAS prototype 不昇格 | implementation-guide Part 2 §1（fetch ベース実装） |
| #7 | Sheets を真として backfill | implementation-guide Part 2 §6 エッジケース |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1 + Part 2） | 12 | pending | Part 1 セルフチェック必須 |
| 2 | system-spec-update-summary.md（Step 1-A/B/C/D + Step 2） | 12 | pending | LOGS x2 / topic-map / SKILL |
| 3 | documentation-changelog.md | 12 | pending | 全 Step 個別記載 |
| 4 | unassigned-task-detection.md（0 件でも必須） | 12 | pending | 0 件想定 |
| 5 | skill-feedback-report.md（改善なしでも必須） | 12 | pending | 観点 6 行 |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending | self check |
| 7 | main.md サマリー | 12 | pending | 7 ファイルへの index |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 本体 | outputs/phase-12/main.md | Phase 12 サマリー + 7 ファイル index |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1 + Part 2 |
| 仕様差分 | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜1-D + Step 2 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 日付 × Step × 内容 |
| 未タスク | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| feedback | outputs/phase-12/skill-feedback-report.md | 改善なしでも必須 |
| 自己点検 | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 6 root evidence |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] outputs/phase-12/ に 7 ファイルすべて配置（欠落で FAIL）
- [ ] implementation-guide.md Part 1 が中学生レベル（専門用語セルフチェック通過）
- [ ] implementation-guide.md Part 2 に型定義 / API / エラー / 定数 / 検証コマンドが含まれる
- [ ] system-spec-update-summary.md に Step 1-A/B/C/D + Step 2 がすべて記載
- [ ] LOGS.md x2（aiworkflow-requirements / task-specification-creator）を append
- [ ] topic-map.md 更新（generate-index.js 再生成）
- [ ] documentation-changelog.md に全 Step 個別記載（「該当なし」も明記）
- [ ] unassigned-task-detection.md が 0 件でも生成されている
- [ ] skill-feedback-report.md が改善点なしでも生成されている
- [ ] phase12-task-spec-compliance-check.md の判定ロジックが PASS / FAIL を明示
- [ ] root `artifacts.json` と Phase 12 evidence に記録した artifacts snapshot が同期
- [ ] `screenshots/.gitkeep` を含む screenshots ディレクトリが存在しないこと
- [ ] Issue #67 reopen 回避が index.md Decision Log と本ファイルに記録
- [ ] **本 Phase 内の全タスクを 100% 実行完了**

## タスク 100% 実行確認【必須】

- 全 7 サブタスクが completed
- 7 ファイル配置を `ls outputs/phase-12/` で確認
- LOGS x2 の差分を `git diff` で確認
- topic-map.md / SKILL.md の更新を確認
- compliance-check.md が成果物の実体 + validator 実測値で PASS
- artifacts.json の phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 7 ファイルの path、Issue #67 は CLOSED 維持で `Refs #67` を使用する旨
- ブロック条件: 7 ファイルのいずれか欠落、Step 1-A/B/C のいずれか未実行、LOGS x2 同期漏れのいずれかなら進まない

## 真の論点 / 漏れ防止

- **UBM-012**: Phase 5 / 12 で `wrangler` 直接呼び出しが混入していないか implementation-guide Part 2 §8 で再確認する
- **UBM-014**: dev/test と production の Sheets API key 未設定時挙動を Part 2 §5 / §9 で分けて記述する
- **UBM-015**: implementation-guide Part 2 §1 で「apps/web から D1 直アクセス禁止」を boundary 用語で明記する
- **[Feedback TASK-UI-04]**: 実装完了時に artifacts.json status を `completed` へ更新する（`spec_created` 残留を回避）
