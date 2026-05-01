# Phase 11: 手動検証（NON_VISUAL 縮約 / docs walkthrough）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動検証（NON_VISUAL 縮約 / 仕様書 walkthrough） |
| 作成日 | 2026-04-30 |
| 前 Phase | 10（最終レビューゲート） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created |
| タスク分類 | docs-only-contract（仕様策定のみ） |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| user_approval_required | false |
| GitHub Issue | #262（CLOSED のまま据え置き） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは shared パッケージの enum 値ドメインを文書化するのみで、実コード / DB / UI / API への変更を伴わない。
  - 出力先は Markdown 仕様書（`outputs/phase-*/*.md`）と `artifacts.json` のみ。CLI 実行ログ / 画面キャプチャ / テスト実行件数のいずれも一次証跡として要求されない。
  - 検証対象は「決定の単一正本性」「マッピング表の網羅性」「shared 配置先 / 書き換え対象リストが UT-04 / UT-09 で消費可能な粒度か」という **記述レベル** に閉じる。
- 必須 outputs（NON_VISUAL 縮約テンプレ準拠 / 3 点固定）:
  - `outputs/phase-11/main.md` — Phase 11 walkthrough トップ index、テスト方式 / 発火条件 / 必須 outputs リンク
  - `outputs/phase-11/manual-evidence.md` — 仕様書 walkthrough のレビューログ（決定整合 / カバレッジ / 直交関係の目視チェック結果）
  - `outputs/phase-11/link-checklist.md` — 成果物リンク疎通確認（workflow 内 / 上流仕様 / 既存実装ファイル）
- **screenshot は不要**（NON_VISUAL のため `outputs/phase-11/screenshots/` ディレクトリ自体作成しない / false green 防止）。
- 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「docs-only / NON_VISUAL 縮約テンプレ」 / 第一適用例 ut-gov-005-docs-only-nonvisual-template-skill-sync。
- utgov001（second-stage reapply）/ ut-gov-005 と同じ docs-only NON_VISUAL 3 点パターンを継承する。

## 目的

Phase 2〜10 で確定させた canonical decision（`status` 5 値 / `trigger_type` 3 値 + `triggered_by` 別カラム化）と関連成果物を、**仕様書 walkthrough** によって以下 4 観点で目視検証する。

1. canonical set 決定の **単一正本性**（Phase 8 DRY 結果が outputs 全域で一意に再利用されている）
2. 既存値 → canonical 値 マッピング表の **既存値カバレッジ**（`running` / `success` / `skipped` / `admin` の漏れがない）
3. shared 配置決定（`packages/shared/src/types/sync.ts` 案 + `packages/shared/src/zod/sync.ts` 案）が **U-UT01-10 と整合**（責務侵食なし）
4. 既存実装書き換え対象リストが **UT-04 / UT-09 で消費可能な粒度**（ファイルパス + 行番号 + 変更種別が揃っている）

実 migration / 型定義コミット / UI 文言更新は本 Phase でも対象外（UT-04 / UT-09 / U-UT01-10 へ委譲）。

## 実行タスク

1. canonical set 決定の単一正本性を確認する（Phase 2 outputs ↔ Phase 5 runbook ↔ Phase 7 AC matrix で値の表記ゆれが 0 件）。
2. 既存値 → canonical 値マッピング表の既存値カバレッジを確認する（`running|success|failed|skipped|admin|cron|backfill|manual` の 8 値が網羅）。
3. shared 配置先決定が U-UT01-10 の責務（実装コミット）を侵食していないことを直交関係表で確認する。
4. 書き換え対象リスト（`apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` の行番号レンジ）が grep で実在することを確認する（コード変更は行わない / 行番号の整合のみ）。
5. 関連タスク（U-UT01-07 / U-UT01-09 / U-UT01-10 / UT-04 / UT-09）への委譲事項が漏れなく明記されていることを確認する。
6. 上流仕様（`docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` §2, §9 / `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` U-8）への参照リンクが疎通することを確認する。
7. 機密情報非混入を確認する（実 database_id / 実 token / 実会員データが outputs に含まれない）。
8. 上記 1〜7 の結果を `manual-evidence.md` / `link-checklist.md` / `main.md` に記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票仕様（AC-1〜AC-6） |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/index.md | 本タスクの目次・実行フロー |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/canonical-set-decision.md | 決定の正本（Phase 11 で再確認する対象） |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/value-mapping-table.md | 既存値 → canonical マッピング表 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/shared-placement-decision.md | shared 配置判断 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-05/contract-runbook.md | 仕様 runbook（書き換え順序） |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-05/rewrite-target-list.md | 書き換え対象（ファイル+行番号+変更種別） |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-07/ac-matrix.md | AC × evidence 対応 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-10/go-no-go.md | GO 判定の前提 |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | UT-01 論理設計（§2, §9） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md | U-8（検出根拠） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存実装の値リテラル所在 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存物理スキーマの enum 候補 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md §docs-only/NON_VISUAL 縮約テンプレ | 適用テンプレ |
| 参考 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-11.md | docs-only NON_VISUAL 第一適用例 |
| 参考 | docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/ | 縮約テンプレの参照実装 |

## 実行手順

### ステップ 1: 単一正本性ウォークスルー（決定の表記ゆれ 0 件確認）

`outputs/phase-02/canonical-set-decision.md` を正本とし、以下を `rg -n` で抽出して **記載順 / 値リスト / コメント表記** に差分が 0 件であることを目視で確認する。

```bash
# canonical 5 値（status）と 3 値（trigger_type）が outputs 全域で同じ並び順か
rg -n "pending|in_progress|completed|failed|skipped" docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs

rg -n "manual|cron|backfill" docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs
```

- 期待: Phase 2 / 5 / 7 / 10 の outputs で値リストの並び順が一致。`triggered_by='admin'` 補足の表記が統一。
- 不一致時: `manual-evidence.md` に Blocker として記録 → Phase 8 DRY 化へ差し戻す（NO-GO）。

### ステップ 2: マッピング表のカバレッジ確認

`outputs/phase-02/value-mapping-table.md` に対し、既存実装の 8 値（`running` / `success` / `failed` / `skipped` / `admin` / `cron` / `backfill` / `manual`）が **左辺（現行値）に全て登場** することを確認する。

```bash
# 既存実装にある値リテラルを抽出
rg -nP "'(running|success|failed|skipped|admin|cron|backfill|manual)'" \
  apps/api/src/jobs/sync-sheets-to-d1.ts apps/api/migrations/0002_sync_logs_locks.sql
```

- 期待: 抽出された値が全て value-mapping-table.md の左辺に存在し、変換 UPDATE 疑似 SQL が 1:1 対応。
- 漏れ時: `manual-evidence.md` に Blocker として記録 → Phase 2 / 5 へ差し戻す。

### ステップ 3: shared 配置決定 × U-UT01-10 直交性

`outputs/phase-02/shared-placement-decision.md` の決定（types only / Zod 併設 / U-UT01-10 統合 or 分離）が、U-UT01-10（shared 契約型 / Zod schema 化）の責務（**実装コミット**）を侵食していないことを確認する。

| 確認軸 | U-UT01-08 の責務 | U-UT01-10 の責務 |
| --- | --- | --- |
| 配置判断 | 本タスクで確定 | 本タスク決定を継承 |
| 型シグネチャ案 | 本タスクで提示 | 本タスク案を継承 |
| 実装コミット（`packages/shared/src/types/sync.ts` 等の実ファイル追加） | **対象外** | U-UT01-10 で実施 |

- 期待: `shared-placement-decision.md` が「配置 + 型シグネチャ案」までで停止しており、`packages/shared/src/types/` の実ファイル追加 PR を本タスクに含める指示が無い。
- 侵食検出時: `manual-evidence.md` に Blocker として記録 → Phase 2 / 8 へ差し戻す。

### ステップ 4: 書き換え対象リストの粒度確認（UT-04 / UT-09 が消費可能か）

`outputs/phase-05/rewrite-target-list.md` のリストが **ファイルパス + 行番号レンジ + 変更種別** の 3 列を満たすかを確認する。

```bash
# リストに記載された行番号が現存するか確認（例）
sed -n '<記載行番号>p' apps/api/src/jobs/sync-sheets-to-d1.ts
sed -n '<記載行番号>p' apps/api/migrations/0002_sync_logs_locks.sql
```

- 期待: 行番号レンジが現行コードに対応し、UT-04（migration 追加）/ UT-09（sync job rewrite）担当が即時着手できる粒度。
- 不足時: `manual-evidence.md` に Note 以上で記録 → Phase 5 へ差し戻し or Phase 12 で UT-04 / UT-09 への委譲メモを補強。

### ステップ 5: 関連タスクへの委譲事項確認

`index.md` および `outputs/phase-08/main.md` の直交関係表で、以下 5 タスクへの委譲事項が漏れなく明記されていることを確認する。

| 委譲先 | 委譲事項 |
| --- | --- |
| U-UT01-07 | 物理テーブル名（`sync_log` 論理 vs `sync_job_logs` / `sync_locks` 物理）の整合は対象外（テーブル名のみ） |
| U-UT01-09 | retry 回数 / `processed_offset` カラムは対象外 |
| U-UT01-10 | shared 実装コミットは対象外（配置判断 + 型シグネチャ案までで停止） |
| UT-04 | 物理 migration（CHECK 制約追加 / 変換 UPDATE / DEFAULT 変更）の DDL 化を委譲 |
| UT-09 | `apps/api/src/jobs/sync-sheets-to-d1.ts` の実書き換え + 集計クエリ更新を委譲 |

### ステップ 6: 上流参照リンク疎通確認

`link-checklist.md` に以下のテーブルを記録する。

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| index.md → 起票仕様 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | OK / Broken |
| Phase 2 outputs → UT-01 論理設計 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md §2 §9 | OK / Broken |
| Phase 5 runbook → 既存実装 | apps/api/src/jobs/sync-sheets-to-d1.ts | OK / Broken |
| Phase 5 runbook → 既存物理スキーマ | apps/api/migrations/0002_sync_logs_locks.sql | OK / Broken |
| index.md → GitHub Issue #262（CLOSED 参照のみ） | https://github.com/daishiman/UBM-Hyogo/issues/262 | OK / Broken |
| index.md → 直交関係（U-UT01-07/09/10） | docs/30-workflows/unassigned-task/U-UT01-{07,09,10}-*.md | OK / Broken |

### ステップ 7: 機密情報非混入の最終 grep

```bash
rg -n -E "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" \
  docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/ \
  || echo "OK: no secrets"
```

- 期待: 0 件。検出時は即時停止し、該当 Phase の outputs を是正する。

### ステップ 8: walkthrough 結果記録

`outputs/phase-11/manual-evidence.md` に以下フォーマットで記録する。

| 検証観点 | コマンド / 確認手順 | 期待 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 単一正本性 | ステップ 1 の rg | 表記差 0 件 | 実行時採取 | PASS/FAIL |
| マッピング網羅 | ステップ 2 の rg | 8 値全網羅 | 実行時採取 | PASS/FAIL |
| shared 配置 × U-UT01-10 | ステップ 3 の表 | 侵食 0 件 | 実行時採取 | PASS/FAIL |
| 書き換え粒度 | ステップ 4 の sed | 行番号実在 | 実行時採取 | PASS/FAIL |
| 関連タスク委譲 | ステップ 5 の表 | 5 件全明記 | 実行時採取 | PASS/FAIL |
| 参照リンク疎通 | ステップ 6 の表 | Broken 0 件 | 実行時採取 | PASS/FAIL |
| 機密情報非混入 | ステップ 7 の rg | 0 件 | 実行時採取 | PASS/FAIL |

メタ情報として **証跡の主ソース**（仕様書 walkthrough セッション）/ **screenshot を作らない理由**（NON_VISUAL / docs-only / spec_created）/ **実行日時 / branch 名** を冒頭に記録する。

## 代替 evidence 差分表（NON_VISUAL 必須）

| 検証シナリオ | 元前提（VISUAL タスク） | 代替手段（本タスク） | カバー範囲 | 保証外 / 申し送り |
| --- | --- | --- | --- | --- |
| S-1 決定の単一正本性 | UI 上の表記一致確認 | rg による outputs 全域の値リスト diff | 仕様書間の表記ゆれ | 実コード上の値リテラル整合（→ UT-09） |
| S-2 マッピング網羅 | DB CHECK 制約による reject | 既存実装値 grep × value-mapping-table.md の 1:1 対応 | 文書上の網羅性 | 実 migration の制約違反 reject（→ UT-04） |
| S-3 shared 配置整合 | shared 型のテスト実行 | 直交関係表の責務境界目視 | 配置判断の単一性 | 型 satisfies / exhaustive switch 実テスト（→ U-UT01-10） |
| S-4 書き換え粒度 | rebuild & smoke | 行番号 sed 確認 | リストの即時着手可能性 | 実 PR レビュー時の再確認（→ UT-09） |
| S-5 関連タスク委譲 | E2E 連動テスト | 直交関係表 5 件目視 | 責務分離の文書化 | 実装フェーズで再衝突しないこと（→ U-UT01-10） |

> **NON_VISUAL のため screenshot 不要**。本表により「文書レベルで何を保証し、何を実装フェーズに委譲したか」を明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の evidence 列に本 Phase の証跡パスを記入 |
| Phase 10 | GO 判定の前提として本 Phase の walkthrough PASS を確認 |
| Phase 12 | walkthrough で得た改善点を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |
| UT-04 | 書き換え対象リストの粒度確認結果を migration 設計の入力として引き渡す |
| UT-09 | 既存実装書き換え範囲の確定状態を sync job 実装タスクへ引き渡す |
| U-UT01-10 | shared 配置 + 型シグネチャ案を実装コミットの入力として引き渡す |

## 多角的チェック観点

- 価値性: walkthrough により後段（UT-04 / UT-09 / U-UT01-10）が即時着手できる粒度に整っているか。
- 実現性: Phase 11 で要求する rg / sed / grep がすべて本リポジトリ環境で実行可能か（依存ツール 0）。
- 整合性: 単一正本性（S-1）と関連タスク委譲（S-5）が独立に PASS し得るか。
- 運用性: 仕様書間の表記ゆれが 0 件である状態を Phase 12 以降も保てる仕組みが index.md で明示されているか。
- 認可境界: outputs に Cloudflare Secret / DB binding 名 実値 / 実会員データが含まれていないか。
- Secret hygiene: ステップ 7 grep が 0 件であること。
- Issue ライフサイクル: GitHub Issue #262 が CLOSED のまま、本タスクで再 OPEN しない方針が `link-checklist.md` に明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 単一正本性 walkthrough | 11 | spec_created | rg による表記ゆれ 0 件確認 |
| 2 | マッピング表カバレッジ | 11 | spec_created | 既存 8 値全網羅 |
| 3 | shared 配置 × U-UT01-10 直交性 | 11 | spec_created | 責務侵食 0 件 |
| 4 | 書き換え対象リスト粒度 | 11 | spec_created | 行番号実在確認 |
| 5 | 関連タスク委譲明記 | 11 | spec_created | 5 タスクへの委譲事項 |
| 6 | 上流参照リンク疎通 | 11 | spec_created | link-checklist.md 記録 |
| 7 | 機密情報非混入 grep | 11 | spec_created | 0 件 |
| 8 | walkthrough 結果記録 | 11 | spec_created | manual-evidence.md / main.md |

## manual evidence（記録 placeholder）【必須】

| 項目 | コマンド / 手順 | 採取先 | 採取済 |
| --- | --- | --- | --- |
| 単一正本性 | ステップ 1 rg | manual-evidence.md §1 | 実行時採取 |
| マッピング網羅 | ステップ 2 rg | manual-evidence.md §2 | 実行時採取 |
| shared 配置整合 | ステップ 3 表確認 | manual-evidence.md §3 | 実行時採取 |
| 書き換え粒度 | ステップ 4 sed | manual-evidence.md §4 | 実行時採取 |
| 関連タスク委譲 | ステップ 5 表確認 | manual-evidence.md §5 | 実行時採取 |
| 参照リンク疎通 | ステップ 6 表記録 | link-checklist.md | 実行時採取 |
| 機密情報非混入 | ステップ 7 rg | manual-evidence.md §7 | 実行時採取 |

> 各セクションには「コマンド」「実行日時」「stdout 抜粋」「期待値との一致 / 不一致」を記録すること。実 token / database_id（UUID） は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | 実 migration / CHECK 制約適用は本 Phase で実行しない | DB レベル制約の reject 検証 | UT-04（migration 設計）/ UT-09（sync job rewrite）|
| 2 | shared 実コミット（型 / Zod 実ファイル）は対象外 | ランタイム検証 | U-UT01-10 |
| 3 | UI ラベル / i18n リソース更新は対象外 | UI 表示整合 | UT-08 監視 or 別タスク |
| 4 | 監視アラート閾値改訂は対象外 | SLO / 集計クエリ整合 | U-UT01-04 連動 |
| 5 | NON_VISUAL のため screenshot 不要、文書 walkthrough が一次証跡 | 視覚証跡なし | link-checklist.md / manual-evidence.md で補完 |
| 6 | GitHub Issue #262 は CLOSED のまま、本タスクで再 OPEN しない | Issue ライフサイクル整合 | PR body / commit message では `Refs #262` のみ採用（Phase 13）|

## 成果物（NON_VISUAL 縮約 / 3 点固定）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | walkthrough サマリー / 必須 outputs リンク / NON_VISUAL 発火条件記録 |
| ログ | outputs/phase-11/manual-evidence.md | 7 観点の walkthrough ログ（コマンド / 期待 / 実測 / 判定） |
| 参照検証 | outputs/phase-11/link-checklist.md | 仕様書 ↔ 上流 ↔ 既存実装ファイル ↔ Issue のリンク疎通表 |
| メタ | artifacts.json | Phase 11 状態の更新（`phases[10].status = completed`） |

> `outputs/phase-11/screenshots/` は作成しない（NON_VISUAL 整合 / false green 防止）。

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-evidence.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブル 7 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] 代替 evidence 差分表（S-1〜S-5）が記述され、保証範囲 / 保証外が明示されている
- [ ] ステップ 1 の単一正本性 walkthrough が PASS（表記ゆれ 0 件）
- [ ] ステップ 2 のマッピング網羅が PASS（既存 8 値全網羅）
- [ ] ステップ 3 の shared 配置 × U-UT01-10 直交性が PASS（責務侵食 0 件）
- [ ] ステップ 7 の機密情報非混入 grep が 0 件
- [ ] 既知制限が 6 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] GitHub Issue #262 が CLOSED のまま、再 OPEN 指示が文書に存在しない

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1〜AC-6 の証跡採取手順が定義済み
- 実 migration / 型コミット / UI 文言更新が UT-04 / UT-09 / U-UT01-10 / 別タスクへ委譲されることが明記
- artifacts.json の Phase 11 entry（`phase: 11`）が `completed` に更新可能な設計

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - walkthrough で得られた知見を Phase 12 の `unassigned-task-detection.md` / `skill-feedback-report.md` に渡す
  - 既知制限 #1（実 migration）/ #2（shared 実コミット）を unassigned-task として **既存タスク** UT-04 / UT-09 / U-UT01-10 へ委譲メモを追記
  - shared 配置決定 + 型シグネチャ案の確定状態を U-UT01-10 へ引き渡す
- ブロック条件:
  - manual evidence の 7 項目に未採取 / 未 N/A 化が残っている
  - 単一正本性 / マッピング網羅 / shared 配置整合 のいずれかが FAIL
  - `screenshots/` ディレクトリが誤って作成されている
  - 機密情報 grep で 1 件以上検出（→ 即時停止 / Phase 2-5 outputs を是正）
