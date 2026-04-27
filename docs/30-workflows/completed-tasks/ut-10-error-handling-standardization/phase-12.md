# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-27 |
| 前 Phase | 11 (手動 smoke test / NON_VISUAL) |
| 次 Phase | 13 (PR 作成) |
| 依存 Phase | Phase 1, Phase 2, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 11 |
| 状態 | spec_created |

## 目的

UT-10 の Phase 1〜11 で確定した設計・実装・検証結果を、開発者向け実装ガイド（中学生レベル概念説明 + 技術詳細の 2 パート）と正本仕様（aiworkflow-requirements）の双方に反映する。
さらに、close-out として documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check を生成し、UT-09 / UT-07 / UT-08 への引き継ぎ情報を確定させる。
本 Phase は **task-specification-creator skill** の Phase 12 必須 5 タスクをすべて充足する。

## 実行タスク（5 必須タスク全部入り）

- Task 12-1: 実装ガイド作成（2 パート構成）
- Task 12-2: システム仕様書更新（aiworkflow-requirements / task-specification-creator）
- Task 12-3: documentation-changelog 作成
- Task 12-4: unassigned-task-detection レポート作成（0 件でも出力必須）
- Task 12-5: skill-feedback-report 作成（改善点なしでも出力必須）
- 補助: phase12-task-spec-compliance-check.md を root evidence として作成
- artifacts.json と outputs/artifacts.json の同期確認
- topic-map.md 再生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | topic-map 更新元 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/ | 設計成果物（API スキーマ / コード体系 / retry / 補償処理 / ログ） |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | 正本仕様に反映する型・レスポンス仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/error-code-taxonomy.md | エラーコード体系の反映元 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-05/ | 実装成果物 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-06/security-leak-tests.md | セキュリティ検証の同期元 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-07/coverage-report.md | coverage 証跡 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-08/refactor-summary.md | リファクタ結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-09/test-result-summary.md | 品質保証結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-11/ | NON_VISUAL smoke 結果と既知制限 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/index.md | タスク正本 |
| 参考 | apps/api/docs/error-handling.md | 開発者ガイド配置先 |

## Task 12-1: 実装ガイド作成（2 パート構成）【必須】

出力: `outputs/phase-12/implementation-guide.md`（および `apps/api/docs/error-handling.md` への反映）

### Part 1: 中学生レベル（例え話で理解する）

「エラーが起きたとき、どう知らせるか・どう対処するか」を以下の例え話で導入する。

- **例え話 1: お店で品切れの時の張り紙**
  - 「申し訳ございません、ただいま在庫がありません」のような **お客さんに見せる張り紙**（= クライアントに返すエラー本文）と、
  - 店長だけが見る **発注ノート**（= サーバーログ：いつ・なぜ・どの商品が切れたか）の 2 種類を分ける。
  - 仕入れ先の電話番号や原価（機密情報）を張り紙に書いてはいけない。
- **例え話 2: 配達トラックが渋滞でつかまった**
  - すぐ諦めずに **少し時間をおいてかけ直す**（= リトライ）。
  - でも、ずっと粘ると後ろの仕事が止まる（= Workers の制約）ので、回数と間隔は決めておく。
- **例え話 3: 銀行振込で送金途中に止まった**
  - 「お金を引いた」だけで「相手に届いた」が失敗したら、**引いたお金を戻す**（= 補償処理 / compensating transaction）。
- **覚えておくこと**: エラーには「番号（コード）」「タイトル」「お客さん向け説明」「時刻」「リクエスト ID」を必ずつける。これがあると、後で何が起きたか調べやすい。

### Part 2: 技術者向け（API リファレンス）

| 項目 | 内容 |
| --- | --- |
| `ApiError` 型定義 | RFC 7807 ベース（`type` / `title` / `status` / `detail` / `instance`）+ UBM 拡張 `code` / `requestId`。`packages/shared/src/errors.ts` を参照 |
| UBM コード体系 | `UBM-1xxx`（バリデーション） / `UBM-4xxx`（クライアントエラー 4xx 系） / `UBM-5xxx`（サーバーエラー） / `UBM-6xxx`（外部依存・Sheets 等） |
| `withRetry` シグネチャ | `withRetry<T>(fn: () => Promise<T>, options: { maxAttempts; initialDelayMs; backoff: 'exponential' \| 'fixed'; jitter?: boolean; isRetryable?: (e) => boolean }): Promise<T>` |
| 補償処理 API | `withCompensation(steps: Array<{ apply; compensate }>, ctx)`：各 step の `apply` が成功した順に逆順で `compensate` を呼ぶテンプレート（`packages/shared/src/db/transaction.ts`） |
| グローバルエラーハンドラ | Hono `onError` ベース。`apps/api/src/middleware/error-handler.ts`。`ApiError` は `application/problem+json` で返却、未知例外は `UBM-5000` に正規化 |
| 構造化ログ | `packages/shared/src/logging.ts`。必須フィールド `timestamp / level / event / requestId / code`。機密フィールドはマスク処理 |
| 設定値一覧 | `RETRY_MAX_ATTEMPTS=3` / `RETRY_INITIAL_DELAY_MS=100` / `RETRY_BACKOFF=exponential` / `IN_REQUEST_RETRY_MAX=1`（Workers 制約由来） |
| 利用例 | 「Sheets API 呼び出し → withRetry → 失敗時 dead letter → Cron で次回再試行」のミニマルサンプルを記載 |

## Task 12-2: システム仕様書更新【必須】

出力: `outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: 完了タスク記録

以下の正本に「UT-10 が完了したこと」と影響範囲を追記する。

| 対象 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/error-handling.md`（新規 or 更新） | `ApiError` / コード体系 / `withRetry` / 補償処理 / 構造化ログの正本仕様 |
| `.claude/skills/aiworkflow-requirements/references/interfaces-shared.md` | `@ubm-hyogo/shared` の `errors` / `retry` / `db/transaction` / `logging` 公開 API |
| `.claude/skills/aiworkflow-requirements/references/interfaces-api.md` | `apps/api/src/middleware/error-handler.ts` のグローバルエラーハンドラ契約 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | "error-handling" トピックの追加・関連参照リンク |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | UT-10 完了ログを 1 行追加 |
| `.claude/skills/task-specification-creator/LOGS.md` | UT-10 仕様書作成完了ログを 1 行追加 |

### Step 1-B: 実装状況テーブル更新

- 仕様書作成段階では index.md の状態は `spec_created` のまま据え置き
- Phase 5 完了 → Phase 13 マージ後に `completed` に更新する旨をコメントで明記

### Step 1-C: 関連タスクテーブル更新

| 関連タスク | 影響内容 |
| --- | --- |
| UT-09（Sheets→D1 同期） | `withRetry` / 補償処理 / 構造化ログを利用する前提で実装 |
| UT-07（通知基盤） | 構造化ログの `event=error.dead_letter` をフックして通知 |
| UT-08（モニタリング） | 構造化ログを取り込みメトリクス化（エラー率・リトライ率・補償発生率） |
| 02-serial-monorepo-runtime-foundation | `apps/api` の Hono ランタイム上で `errorHandler` ミドルウェアが組み込まれる |

### Step 1-D: topic-map / index 再生成

- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行する
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` に error-handling / interfaces-shared / interfaces-api の見出しが反映されたことを確認する

### Step 1-E: documentation-changelog / evidence 同期

- `outputs/phase-12/documentation-changelog.md` に Step 1 / Step 2 / validation の実施結果を記録する
- Step 2 が不要な項目も「更新なし」と理由を残す

### Step 1-F: 4 ファイル更新

- `.claude/skills/aiworkflow-requirements/LOGS.md`
- `.claude/skills/task-specification-creator/LOGS.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/task-specification-creator/SKILL.md`

### Step 1-G: final validation

| 系統 | コマンド | PASS 基準 |
| --- | --- | --- |
| task spec | `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/ut-10-error-handling-standardization --strict` | error 0 |
| requirements index | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | exit 0、topic-map 更新 |
| requirements structure | `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` | error 0 |
| links / grep evidence | `rg -n "UT-10|error-handling|ApiError|withRetry" .claude/skills/aiworkflow-requirements docs/30-workflows/ut-10-error-handling-standardization` | 必須エントリ検出 |

### Step 2: 新規インターフェースの正本反映

新規追加インターフェース：

- `ApiError`（`@ubm-hyogo/shared/errors`）
- `withRetry`（`@ubm-hyogo/shared/retry`）
- `withCompensation`（`@ubm-hyogo/shared/db/transaction`）
- 構造化ログ I/F（`@ubm-hyogo/shared/logging`）

これらを aiworkflow-requirements の `error-handling.md` および `interfaces-shared.md` / `interfaces-api.md` に **契約として** 記述する。

### topic-map.md 再生成コマンド

```bash
# topic-map を再生成（aiworkflow-requirements skill の規定）
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
```

## Task 12-3: documentation-changelog【必須】

出力: `outputs/phase-12/documentation-changelog.md`

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規 | docs/30-workflows/ut-10-error-handling-standardization/ | UT-10 タスク仕様書一式 |
| 2026-04-27 | 新規 | apps/api/docs/error-handling.md | 開発者向けエラーハンドリングガイド |
| 2026-04-27 | 新規 | packages/shared/src/errors.ts / retry.ts / db/transaction.ts / logging.ts | 共通基盤実装 |
| 2026-04-27 | 新規 | apps/api/src/middleware/error-handler.ts | グローバルエラーハンドラ |
| 2026-04-27 | 更新 | apps/web/app/lib/api-client.ts | `ApiError` 型同期 |
| 2026-04-27 | 新規/更新 | .claude/skills/aiworkflow-requirements/references/error-handling.md | 正本仕様反映 |
| 2026-04-27 | 更新 | .claude/skills/aiworkflow-requirements/references/interfaces-shared.md | 公開 API 契約追加 |
| 2026-04-27 | 更新 | .claude/skills/aiworkflow-requirements/references/interfaces-api.md | グローバルエラーハンドラ契約追加 |
| 2026-04-27 | 更新 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | "error-handling" トピック追加 |
| 2026-04-27 | 更新 | .claude/skills/aiworkflow-requirements/LOGS.md | UT-10 完了ログ |
| 2026-04-27 | 更新 | .claude/skills/aiworkflow-requirements/SKILL.md | 公開トピック一覧の更新 |
| 2026-04-27 | 更新 | .claude/skills/task-specification-creator/LOGS.md | UT-10 仕様書作成完了ログ |
| 2026-04-27 | 更新 | .claude/skills/task-specification-creator/SKILL.md | NON_VISUAL Phase 11 運用例の追加 |

## Task 12-4: unassigned-task-detection【必須・0 件でも出力】

出力: `outputs/phase-12/unassigned-task-detection.md`

### 検出ソース（必須網羅）

1. 元仕様書（index.md スコープ外）の派生事項
2. Phase 3 / Phase 10 の MINOR 指摘で本タスク内未消化のもの
3. Phase 11 で発見した既知制限（L-1〜L-8）
4. 実装内 TODO / FIXME コメント
5. `describe.skip` / `it.skip` のテストケース

### 検出結果

| # | 検出項目 | 種別 | 検出ソース | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- | --- | --- |
| U-1 | Cron / Cloudflare Queues 経由の遅延リトライ実装 | 実作業 | Phase 11 既知制限 L-1 / L-2 | UT-09 内で実装 | UT-09 |
| U-2 | dead letter → Slack 通知連携 | 実作業 | スコープ外（index.md） | 構造化ログ `event=error.dead_letter` をフック | UT-07 |
| U-3 | 構造化ログ → メトリクス取り込み | 実作業 | スコープ外（index.md） | エラー率・リトライ率・補償発生率の可視化 | UT-08 |
| U-4 | apps/web 側エラー UI（トースト・モーダル）の実装 | 実作業 | Phase 11 既知制限 L-5 | NON_VISUAL タスク外、UI 実装タスクとして起票 | 別途起票（UI 実装タスク） |
| U-5 | i18n 対応（エラーメッセージ辞書） | 設計 | index.md 苦戦箇所 4 | MVP 後に多言語拡張する設計余地のみ確保済み | 将来タスク |
| U-6 | 認証エラー（401/403）詳細仕様の最終化 | 設計 | index.md スコープ外 | 02-auth.md / 13-mvp-auth.md で確定 | 認証系タスク |
| U-7 | ローカル `wrangler dev` と本番 Workers のログ出力差確認 | 運用 | Phase 11 既知制限 L-8 | 02-serial Phase 5 で運用確認 | 02-serial-monorepo-runtime-foundation |

> **検出件数 0 件の場合の運用**: それでも本ファイルは作成し、表に「該当なし」と記載する。

## Task 12-5: skill-feedback-report【必須・改善点なしでも出力】

出力: `outputs/phase-12/skill-feedback-report.md`

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL タスクの Phase 11 運用が UBM-002/003 / Feedback BEFORE-QUIT-001 に沿って明文化できた | NON_VISUAL タスクの Phase 11 テンプレに「自動 smoke + 既知制限リスト + screenshot-plan.json (mode=NON_VISUAL)」の 3 点セットを正式採用 |
| aiworkflow-requirements | エラーハンドリング正本（`error-handling.md`）が未整備だった | 本タスクで新規追加。`interfaces-shared.md` / `interfaces-api.md` への波及更新も同時に実施 |
| github-issue-manager | Issue #12 と Phase 13 PR の双方向リンクが 1 経路で十分だった | 改善点なし（現行運用維持） |
| int-test-skill | `withRetry` / `withCompensation` の契約テスト方針を本タスクで策定 | Mock プロバイダーで「リトライ枯渇」「補償処理発火」の不変条件を網羅するテンプレを skill 側に追加検討 |

> **改善点なしの場合の運用**: 該当 skill 行に「改善点なし（現行運用維持）」と明示。空ファイルにはしない。

## phase12-task-spec-compliance-check【必須・root evidence】

出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`

| チェック項目 | 基準 | 状態 |
| --- | --- | --- |
| Task 12-1 implementation-guide が 2 パート構成で作成されている | 中学生レベル + 技術詳細 | PASS |
| Task 12-2 system-spec-update-summary が作成され、4 ファイル更新（aiworkflow-requirements LOGS/SKILL、task-specification-creator LOGS/SKILL）が反映されている | 全 4 ファイル更新 | PASS |
| Task 12-3 documentation-changelog が全変更ファイルを網羅 | 全変更ファイル列挙 | PASS |
| Task 12-4 unassigned-task-detection が 5 検出ソース全て確認済み | 5 ソース網羅 | PASS |
| Task 12-5 skill-feedback-report が改善点なしでも出力されている | ファイル存在 | PASS |
| topic-map.md 再生成コマンドが記載されている | コマンド記載 | PASS |
| artifacts.json と outputs/artifacts.json の同期 | 両者一致 | PASS |
| same-wave sync ルール遵守 | spec-update-workflow.md 準拠 | PASS |

## artifacts.json 同期確認【漏れ防止 準拠】

```bash
# 双方の artifacts.json が同期しているか diff
diff docs/30-workflows/ut-10-error-handling-standardization/artifacts.json \
     docs/30-workflows/ut-10-error-handling-standardization/outputs/artifacts.json
```

差分が出た場合は `outputs/artifacts.json` を `artifacts.json` に揃え、Phase 12 close-out 時点で必ず一致させる。

## 4 ファイル更新ルール【必須】

Phase 12 終了時点で以下 4 ファイルすべてに UT-10 関連エントリが追加されている。

1. `.claude/skills/aiworkflow-requirements/LOGS.md`
2. `.claude/skills/task-specification-creator/LOGS.md`
3. `.claude/skills/aiworkflow-requirements/SKILL.md`（公開トピック・索引の更新）
4. `.claude/skills/task-specification-creator/SKILL.md`（NON_VISUAL Phase 11 運用例の追加）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 実装成果物のパスを implementation-guide / changelog に反映 |
| Phase 11 | 既知制限リスト L-1〜L-8 を unassigned-task-detection に展開 |
| Phase 13 | documentation-changelog を merge-checklist の "files changed" 一覧に再利用 |

## 多角的チェック観点（AIが判断）

- 価値性: 実装ガイドが 2 パート構成で「なぜこの設計か」「どう使うか」両方を満たすか。
- 実現性: 4 ファイル更新ルール・artifacts.json 同期・topic-map 再生成が CI 可能な手順で記述されているか。
- 整合性: documentation-changelog が Phase 5 / 11 の成果物および skill 側更新と一致しているか。
- 運用性: unassigned-task-detection が UT-09 / UT-07 / UT-08 への引き継ぎを漏れなくカバーしているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（2 パート） | 12 | spec_created | Task 12-1 |
| 2 | system-spec-update-summary.md | 12 | spec_created | Task 12-2（Step 1-A/1-B/1-C/2） |
| 3 | documentation-changelog.md | 12 | spec_created | Task 12-3 |
| 4 | unassigned-task-detection.md | 12 | spec_created | Task 12-4（5 検出ソース網羅） |
| 5 | skill-feedback-report.md | 12 | spec_created | Task 12-5 |
| 6 | phase12-task-spec-compliance-check.md | 12 | spec_created | root evidence |
| 7 | artifacts.json 同期確認 | 12 | spec_created | outputs/artifacts.json と diff 0 |
| 8 | topic-map.md 再生成 | 12 | spec_created | aiworkflow-requirements |
| 9 | 4 ファイル更新（LOGS x2 / SKILL x2） | 12 | spec_created | 必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | Task 12-1（2 パート構成） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Task 12-2 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | Task 12-3 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | Task 12-4 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | Task 12-5 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance-check root evidence |
| メタ | artifacts.json / outputs/artifacts.json | Phase 状態の更新（同期） |

## 完了条件

- [ ] Task 12-1〜12-5 の全成果物が `outputs/phase-12/` に配置されている
- [ ] phase12-task-spec-compliance-check.md の全項目が PASS
- [ ] artifacts.json と outputs/artifacts.json が同期している
- [ ] topic-map.md が再生成されている
- [ ] 4 ファイル更新（aiworkflow-requirements LOGS/SKILL、task-specification-creator LOGS/SKILL）が完了
- [ ] unassigned-task-detection が 5 検出ソース全てで実施されている（0 件でも出力済み）
- [ ] skill-feedback-report が出力されている（改善点なしでも記録）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: documentation-changelog の変更ファイル一覧 / unassigned-task-detection の委譲先一覧 / skill-feedback-report のサマリーを Phase 13 の PR 本文に反映する。
- ブロック条件: phase12-task-spec-compliance-check に未 PASS 項目、または 4 ファイル更新ルール未達の場合は Phase 13 に進まない。
