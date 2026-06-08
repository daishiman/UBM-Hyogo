# Phase 12: ドキュメント同期

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- workflow_state: `implemented_local_evidence_captured`（実コード・focused tests・正本仕様同期まで完了。commit/PR/staging visual は user-gated）
- taskType: `implementation` / visualEvidence: `VISUAL`（label 文言 + KPI タイル 1 枚追加）
- source: GitHub issue **#1101**（CLOSED のまま維持。状態変更しない）
- 本 Phase の責務: task-specification-creator の Phase 12 必須 6 成果物を `outputs/phase-12/` 配下に作成する導線を定義し、各成果物の責務と本タスクでの該当/非該当を確定する

> **300 行許容の理由**: 本タスクは API/shared/web/doc/test の 4 面同期を伴う計算意味論是正であり、
> `system-spec-update-summary`（Step 2 該当 = 新規 field 追加）と `unassigned-task-detection`（検出事項を今回サイクル内で解消し current 0 件）を
> 横断参照しながら canonical 9 見出し compliance を成立させる必要があるため、意味的に分割すると追跡性を損なう（phase-template-phase12.md の条件付き超過許容）。

## 目的

出席分析の計算意味論是正仕様書（issue-1101）の Phase 1〜11 成果物を、
Phase 12 必須 6 成果物（+ main 索引）へ集約・正本同期する。
特に `01-api-schema.md` への新規 field 追加（Step 2 該当）と、検出した改善点を未タスク化せず今回サイクル内で解消した事実を漏れなく記録する。

## 実行タスク（Phase 12 必須 6 成果物 + main）

> 各成果物は `outputs/phase-12/` 配下に **実装サイクルで実体作成**される。本 Phase 仕様はその導線・責務・本タスクでの該当判定を定義する。

| Task | 成果物 | 本 Phase で実施する内容 | 本タスクでの該当 |
| --- | --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生向け概念説明）+ Part 2（技術詳細） | 該当 |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | `01-api-schema.md` の Zone 派生 / 集計母数 / overview shape 更新を Step 2 該当として記録 | 該当（Step 2 = 新規 field 追加） |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 変更ドキュメント・validator 結果・Step 結果の記録 | 該当 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` | M-1 / M-2 の解消結果を記録（current 0 件） | 該当（検出事項は本サイクル内で解消） |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善点 / 観察事項 | 該当 |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠確認 / 4 条件 verdict | 該当 |
| — | `outputs/phase-12/main.md` | Phase 12 全体サマリ・6 成果物索引 | 該当 |

### Task 12-1 implementation-guide.md（Part 1 + Part 2）

| Part | 内容 |
| --- | --- |
| Part 1（中学生向け概念） | 「出席回数を 0 / 1〜9 / 10〜99 / 100 回以上 の箱に仕分ける」例え話。**従来は『100 回以上の箱』が無く、たくさん出席した人が『仕分け不能の箱（unknown）』に放り込まれていた**バグの説明。延べ率（のべ何回出席したか）と unique 出席率（何人が 1 回でも出席したか）の違いを「クラスの出席ハンコの総数」vs「1 回でも来た人数」で説明 |
| Part 2（技術詳細） | `zoneFromCount` の境界修正（`>=100 → zone_100_plus`）、`AttendanceZoneZ` の snake_case 機械可読キー再設計、`normalizeZone` の旧矢印互換マッピング、`computeAttendanceOverviewExt` の DISTINCT サブクエリ追加と **bind 順序 3 セット化（最大の注意点）**、`AttendanceOverviewExtZ` の additive 2 field（`.strict()` 維持）、web `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` 追従、`KpiPanel` の unique タイル（`attendance-kpi-unique`）。検証コマンド（focused vitest 4 spec / typecheck / lint / grep gate / `git diff apps/api`）を明記 |

### Task 12-2 system-spec-update-summary.md（Step 2 該当）

- **Step 2 該当の根拠**: 本タスクは `AttendanceOverviewExt` に `uniqueAttendeeCount` / `uniqueAttendanceRate` という **新規 response field を追加**し、`AttendanceZone` の enum 集合を変更する。これは公開仕様 `docs/00-getting-started-manual/specs/01-api-schema.md` のドメイン仕様に影響するため **Step 2（システム仕様更新）に該当**する（親タスク `admin-attendance-dashboard-ux` は UI 表示のみで Step 2=N/A だった点と対照的）。
- **更新箇所**:
  - Zone 派生規則（`>=100 → 'unknown'` の誤記を `>=100 → 'zone_100_plus'` へ。enum を新 5 キーへ）
  - 集計母数の定義（`overallRate`=延べ率の分母分子明示 / unique 指標の追加）
  - overview response shape（`uniqueAttendeeCount` / `uniqueAttendanceRate` の additive 追加）
- D1 schema / endpoint path / method / Google Form schema は不変（Step 2 はあくまで response field 記述の更新であり、契約の破壊的変更ではない・additive）。

### Task 12-3 documentation-changelog.md

- 更新ドキュメント: `01-api-schema.md`（Zone 派生 / 集計母数 / overview shape）。
- validator 結果: `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift の結果を記録。
- Step 1（コード由来 doc 同期）/ Step 2（システム仕様更新）の結果サマリ。

### Task 12-4 unassigned-task-detection.md（current 0 件）

| ID | 検出内容 | 区分 | 判断 |
| --- | --- | --- | --- |
| M-1 | API filter parse 層（`parse-attendance-filter.ts`）での旧 bookmark URL（`?zone=0→1`）救済 | improvement / 後方互換 | 今回サイクル内で実装済み。API query parser と web query reader で旧矢印値を新キーへ正規化 |
| M-2 | zone distribution の `zone_100_plus` 空バー表示判断 | improvement / UI 判断 | 正常帯は常時表示、`unknown` のみ count>0 表示という設計判断で完了 |

> 本タスクの未タスク検出は **0 件**。CONST_005 に従い、検出事項は今回サイクル内で実装または設計判断として閉じた。

### Task 12-5 skill-feedback-report.md

- 観察事項: (a) bind 順序が SELECT 出現順依存で、サブクエリ追加時に period binds が 3 セットになる注意点（Phase 2 §2・実装最大の注意点）。(b) 単一文字列型が API 内部分類 / shared schema / web ラベル / filter 入力の 4 役割を兼ねる「型の責務過負荷」が乖離の根本原因という設計知見。
- skill・テンプレート改善提案があれば記録。

### Task 12-6 phase12-task-spec-compliance-check.md

- canonical 9 見出し（compliance-check-template SSOT）への逐語準拠。
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）の verdict。
- Phase 11 evidence 表（status は `present` / `pending` / `n/a` のみ）の整合確認。

## 参照資料

| 種別 | Path | 内容 |
| --- | --- | --- |
| 要件定義 | `phase-1-requirements.md` | AC-1..AC-8・inventory・命名規則 |
| 設計 | `phase-2-design.md` | enum 再設計・rate 定義・SQL・4 面一致マップ・bind 順序注意 |
| タスク索引 | `index.md` | Phase 構成・検証コマンド（DoD） |
| artifacts | `artifacts.json` | gates / phase12 outputs / verify_commands |
| テンプレート | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | Phase 12 規約 |
| compliance SSOT | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | canonical 9 見出し |

### システム仕様（参照）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| api-schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | Zone 派生 / 集計母数 / overview shape（Step 2 更新対象） |
| design-tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本・HEX 禁止 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ構成 |

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ・6 成果物索引 |
| `outputs/phase-12/implementation-guide.md` | Part 1（例え話）+ Part 2（技術詳細: enum / SQL bind / unique field / KPI） |
| `outputs/phase-12/system-spec-update-summary.md` | Step 2 該当記録（01-api-schema.md の field 追加） |
| `outputs/phase-12/documentation-changelog.md` | 変更ドキュメント・validator 結果・Step 結果 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク 0 件・M-1/M-2 の解消結果 |
| `outputs/phase-12/skill-feedback-report.md` | skill・テンプレート改善提案・観察事項 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠 / 4 条件 verdict |

## 統合テスト連携

| テスト種別 | 対象 Phase | 本 Phase との関係 |
| --- | --- | --- |
| focused vitest（internals / repository / format / KpiPanel） | Phase 4/6/8/9/11 | 主証跡。結果を `outputs/phase-11/manual-test-result.md` と implementation-guide に明記 |
| `rg '"0→1"\|"1→10"\|"10→100"'` grep gate | Phase 9 | 旧矢印 enum 残存ゼロ確認。コマンドを documentation-changelog に記録 |
| `git diff --name-only -- apps/api/migrations apps/api/src/routes` | Phase 9 | AC-8 API endpoint/migration 非変更確認 |
| `pnpm typecheck` / `pnpm lint` | Phase 9 | 4 面同期の型整合・lint。本サイクルで実行 |

## Phase 10 MINOR 追跡テーブル

Phase 3 設計レビューで挙がった M-1 / M-2 は automation-30 再検証後、本サイクル内で解消した。

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 解決方法 | ステータス |
| -------- | -------- | ------------- | -------------- | -------- | ---------- |
| M-1 | parse 層旧 bookmark URL 救済 | Phase 5/6 | Phase 11/12 | `parse-attendance-filter.ts` と `read-attendance-filter.ts` に旧矢印値→新キー正規化を実装し、focused test で確認 | 解消済み |
| M-2 | `zone_100_plus` 空バー表示判断 | Phase 9/12 | Phase 12 | 正常帯は常時表示、分類不能の `unknown` のみ count>0 表示とする設計判断で確定 | 解消済み |

## 完了条件

1. Phase 12 必須 6 成果物（+ main）が `outputs/phase-12/` に実体として作成される導線・責務が定義されていること。
2. 各成果物の本タスクでの該当/非該当が表で明示され、`system-spec-update-summary` が **Step 2 該当（01-api-schema.md への新規 field 追加）** と判定されていること。
3. `unassigned-task-detection` が current 0 件を記録し、M-1 / M-2 の解消結果を明記していること。
4. `phase12-task-spec-compliance-check.md` の canonical 9 見出しが template 準拠であること（実装サイクルで成立）。
5. Phase 13 が user-gated（commit/push/PR）であること、issue #1101 を CLOSED のまま維持することが明記されていること。
