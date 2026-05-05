# Phase 8: ドキュメント整流化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント整流化（docs-only DRY 化） |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証 - quota / SLA 算定) |
| 状態 | spec_created |
| タスク分類 | specification-design（docs-only / NON_VISUAL refactoring） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクはコード実装を一切伴わない設計確定タスクであるため、Phase 8 は通常の「コード DRY 化」ではなく **ドキュメント整流化** として扱う。Phase 2（canonical 比較表）/ Phase 6（採択結果）で生成した canonical 文書と、既存 UT-01 仕様（`sync-method-comparison.md` / `sync-log-schema.md`）および本タスク outputs 全体の間に発生する**重複記述・矛盾語・参照リンク drift** を排除し、AC1〜AC6 が単一正本に集約された状態を実現する。retry 回数（仕様 3 / 実装 5）・backoff curve（仕様秒オーダー / 実装 50ms 起点）・`processed_offset` 採否（追加 / 不採用 / hybrid）の各論点について、用語ゆれ（retry / re-attempt / 再試行 / リトライ）を **canonical 用語** に一意化する。

## 実行タスク

1. Phase 1〜7 の outputs / 本仕様 phase-01.md 〜 phase-07.md / 既存 UT-01 phase-02 成果物（`sync-method-comparison.md` / `sync-log-schema.md`）を横断 grep し、用語ゆれ（retry / re-attempt / 再試行 / リトライ / リトライ回数 / max_retries / DEFAULT_MAX_RETRIES / SYNC_MAX_RETRIES）を洗い出す（完了条件: 揺れ件数が表化されている）。
2. retry 最大回数の表記を canonical 用語と数値に統一する（完了条件: 全文書で「canonical retry 上限 = N 回」の N が一意で、3 / 5 / 環境変数の併記は Phase 2 比較表のみに局所化）。
3. Exponential Backoff curve の表記を canonical 値（base / 上限秒 / jitter 採否）で統一する（完了条件: 50ms 起点 / 1s 起点の併記は Phase 2 比較表のみに局所化、他は canonical 値のみ）。
4. `processed_offset` 採否ラベル（採用 / 不採用 / hybrid）と「offset 単位（行 / chunk index / 安定 ID）」の表記を統一する（完了条件: 採択ケースのラベルと単位が phase-04 以降で一意）。
5. canonical 値の **single-source-of-truth path** を `outputs/phase-02/canonical-retry-offset-decision.md` に固定し、phase-07 以降の AC マトリクス / quota 算定 / GO-NO-GO ドキュメントは link 参照のみとする（完了条件: canonical 数値の再記述 0、link 参照に集約）。
6. 既存 UT-01 仕様（`sync-method-comparison.md` / `sync-log-schema.md`）への申し送り（「本タスクで上書き決定された箇所」「UT-01 側で改訂される予定の箇所」）を `outputs/phase-08/main.md` の追補表に明文化する（完了条件: UT-01 改訂候補が表で列挙されている）。
7. 参照リンク drift（artifacts.json / index.md / phase-XX.md / outputs path / 原典 unassigned-task / aiworkflow-requirements references）の整合確認を行う（完了条件: リンク切れ 0、navigation drift 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/phase-01.md 〜 phase-07.md | 整流化対象 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md | 用語・命名の正本 |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | retry 上限 / backoff curve の UT-01 仕様（差分対象） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | `processed_offset` / `retry_count` 論理定義（差分対象） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 原典・苦戦箇所・AC1〜AC6 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset 関連の正本仕様索引 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-08.md | docs DRY 化観点の参照事例 |

## Before / After 比較テーブル（用語・数値の整流化）

### 用語統一

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 再試行の総称 | retry / re-attempt / 再試行 / リトライ 混在 | **retry**（英語）/ **再試行**（日本語）の 2 語に統一、それ以外は禁止 | 検索性・参照容易性 |
| 最大回数の変数名 | `max_retries` / `DEFAULT_MAX_RETRIES` / `SYNC_MAX_RETRIES` 混在記述 | canonical 値は `canonical_max_retries` と命名し、コード上の名称（`DEFAULT_MAX_RETRIES` / `SYNC_MAX_RETRIES`）は実装側参照のみ | 仕様値と実装識別子の責務分離 |
| backoff の単位 | `ms` / `s` 混在 | base は `ms` 単位、上限は `s` 単位で常に併記（例: `base 1000ms (1s) → 上限 32000ms (32s)`） | 仕様 / 実装の単位差を吸収 |
| offset 単位 | 行 / chunk / rowIndex / 安定 ID 揺れ | **行（row）/ chunk index / 安定 ID 集合** の 3 語に固定、採択ケースで 1 つを必ず選ぶ | 苦戦箇所 #2 / R5 と整合 |

### 数値表記の single-source 化

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| canonical retry 上限 | 各 phase で 3 / 5 を都度説明 | `outputs/phase-02/canonical-retry-offset-decision.md` に 1 箇所のみ確定値、他は link 参照 | 重複削減・矛盾防止 |
| canonical backoff curve | 各 phase で curve を再列挙 | 同上、link 参照に集約 | 同上 |
| `processed_offset` 採否 | phase-03 / phase-04 / phase-06 で再記述 | 採否ラベル（採用 / 不採用 / hybrid）+ 単位を Phase 6 に集約、他は link | 同上 |
| `SYNC_MAX_RETRIES` 既定値方針 | 各 phase で再記述の恐れ | Phase 6 canonical-decision.md の appendix に集約 | AC6 の単一受け皿 |

### 参照 path の整流化

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| canonical decision 参照 | 直接値再記述 | `outputs/phase-02/canonical-retry-offset-decision.md#<anchor>` への相対 link | DRY |
| UT-01 phase-02 参照 | 値を transcribe | path link のみ + 「差分対象」マーク | 上書き決定箇所の追跡性 |
| 実装 path 参照 | 直接 path 文字列の重複 | `apps/api/src/jobs/sync-sheets-to-d1.ts` 1 箇所定義 + 行番号は最新 main を引く際に再確認する旨を注記 | 行番号 drift 回避 |

## 用語辞書（本タスク内で必ず使う表記）

| 概念 | 表記（日本語） | 表記（英語） | 禁止表記 |
| --- | --- | --- | --- |
| 再試行 1 単位 | 再試行 | retry | re-attempt / リトライ / retry attempt |
| 最大再試行回数 | 最大再試行回数 | max retries | リトライ上限 / max attempt |
| 指数バックオフ | 指数バックオフ | exponential backoff | EB / 指数遅延 |
| バックオフ起点 | base | base | 起点 / 起算値 |
| 再開可能境界 | 再開境界 | resume offset | resume point / 続きの位置 |
| chunk 単位の連番 | chunk index | chunk index | バッチ番号 / page no. |
| Sheets 行索引 | Sheets rowIndex | Sheets rowIndex | 行番号 / row id |
| 業務的に安定な行識別子 | 安定 ID | stable id | 行 ID / row uid |

## 重複記述の抽出箇所

| # | 重複候補 | 抽出方針 | 適用範囲 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | canonical retry 上限の数値 | Phase 6 canonical-decision.md に集約 | 全 phase | link 参照に統一 |
| 2 | canonical backoff curve の列挙 | 同上 | 全 phase | 同上 |
| 3 | `processed_offset` 採否ラベル | 同上 | phase-03 以降 | 同上 |
| 4 | offset 単位の選択肢列挙 | Phase 2 比較表に集約、Phase 6 で採択値のみ再掲 | 全 phase | DRY |
| 5 | `SYNC_MAX_RETRIES` 既定値方針 | Phase 6 appendix に集約 | 全 phase | AC6 単一受け皿 |
| 6 | UT-01 phase-02 への申し送り箇所 | Phase 8 main.md の追補表に集約 | 全 phase | UT-01 改訂候補 |

## UT-01 仕様への申し送り表（本タスクが上書き / 加筆する箇所）

| UT-01 該当箇所 | 現状記述 | 本タスクで決定する canonical | 改訂方法 |
| --- | --- | --- | --- |
| `sync-method-comparison.md` retry 上限 | retry 最大 3 回 | Phase 6 採択値 | UT-01 側を Phase 6 値に同期、または併記 |
| `sync-method-comparison.md` backoff curve | 1s/2s/4s/8s/16s/32s | Phase 6 採択値 | 同上 |
| `sync-log-schema.md` `processed_offset` | 「再開可能な書き込み済境界」として定義 | Phase 6 採択ケース（採用 / 不採用 / hybrid）と offset 単位 | UT-01 側を採択結果で確定 |
| `sync-log-schema.md` failed → in_progress 再開 | 言及あり | 採否決定後に再開判定の根拠（offset / retry_count / started_at）を明文化 | UT-01 側に注記追加 |

> 本タスクは UT-01 仕様ファイルを直接書き換えない。改訂は UT-09 追補または UT-01 spec_updated タスクの責務へ送る。

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls で照合 | 完全一致 |
| phase-XX.md 内の他 phase 参照リンク | `../phase-YY.md` 全件 | リンク切れ 0 |
| 原典 unassigned-task への参照 | `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` 実在 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 実在 |
| UT-01 outputs link | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/*.md` | 実在 |
| 実装 path | `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` | 実在 |

## 共通化パターン

- canonical 値は **必ず** `outputs/phase-02/canonical-retry-offset-decision.md` の 1 箇所のみで定義し、他は link 参照に統一する。
- 用語辞書（本仕様内）に違反する表記は禁止。grep で検出可能な状態を保つ。
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- AC ID は `AC1`〜`AC6`（原典 unassigned-task と一致、ハイフンを付けない）で全 Phase 統一。

## 削除対象一覧

- 本タスク内で重複していた canonical 値の transcribe（Phase 6 link 参照に置換）。
- UT-01 phase-02 から transcribe された数値の重複（path link のみへ置換）。
- 用語辞書違反の表記（リトライ / re-attempt 等）。
- 実装側変数名（`DEFAULT_MAX_RETRIES`）を仕様値として使っている箇所（`canonical_max_retries` に正規化）。

## 実行手順

### ステップ 1: 用語ゆれの洗い出し
- `grep -rEn '(retry|re-attempt|再試行|リトライ|max_retries|DEFAULT_MAX_RETRIES|SYNC_MAX_RETRIES)' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` を実行。
- 表記揺れを表に整理。

### ステップ 2: Before / After 比較テーブルの作成
- 3 区分（用語 / 数値表記 / 参照 path）で記述。

### ステップ 3: 用語辞書の確定
- 8 概念以上について「日本語 / 英語 / 禁止表記」を列挙。

### ステップ 4: canonical 値の single-source 化
- Phase 6 canonical-decision.md を正本とし、他 phase の数値再記述を link に置換する方針を確定。

### ステップ 5: UT-01 申し送り表の作成
- 4 件以上の改訂候補を列挙（retry 上限 / backoff curve / processed_offset / failed→in_progress 再開）。

### ステップ 6: navigation drift 確認
- 7 チェック項目すべてで「実在 / 完全一致 / リンク切れ 0」を確認。

### ステップ 7: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 整流化済み用語・参照を quota / SLA 算定の前提に使用 |
| Phase 10 | navigation drift 0 / canonical single-source 化を GO/NO-GO の根拠に使用 |
| Phase 12 | UT-01 申し送り表を unassigned-task-detection.md に転記し、UT-01 改訂タスクとして送出 |
| UT-09 | 整流化済み canonical 値を実装反映の前提として引き渡し |

## 多角的チェック観点

- 価値性: 用語統一により仕様読者と実装者の解釈差が減り、苦戦箇所 #1（retry 回数差分による失敗解釈の二重化）の再発を予防。
- 実現性: 数値の single-source 化は文書編集のみで実装不要、本タスク制約（コード変更禁止）と整合。
- 整合性: UT-01 仕様との差分が「申し送り表」として可視化され、後続タスクが拾える状態になる。
- 運用性: canonical 値の再確認時、Phase 6 1 箇所を見れば済む。
- 認可境界: 本 Phase は文書整流化のみで認可境界に影響なし。
- 無料枠: 同上、無料枠に影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 用語ゆれ洗い出し | 8 | spec_created | grep 結果を表化 |
| 2 | 用語辞書確定 | 8 | spec_created | 8 概念以上 |
| 3 | canonical 値 single-source 化 | 8 | spec_created | Phase 6 を正本 |
| 4 | Before/After 比較テーブル | 8 | spec_created | 3 区分 |
| 5 | UT-01 申し送り表 | 8 | spec_created | 4 件以上 |
| 6 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 7 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | ドキュメント整流化結果（用語辞書・Before/After・UT-01 申し送り・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 用語ゆれ洗い出し表が作成され、ゆれ件数が定量化されている
- [ ] 用語辞書が 8 概念以上で確定し、禁止表記が明記されている
- [ ] Before / After 比較テーブルが 3 区分（用語 / 数値表記 / 参照 path）すべてで埋まっている
- [ ] canonical 値の single-source path が `outputs/phase-02/canonical-retry-offset-decision.md` に確定し、他 phase は link 参照になっている
- [ ] UT-01 申し送り表に 4 件以上の改訂候補が列挙されている
- [ ] navigation drift 0（artifacts.json / index.md / phase-XX.md / outputs path / 原典 unassigned-task / aiworkflow-requirements / 実装 path 全件 PASS）
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- 用語辞書 8 概念以上
- Before/After 3 区分網羅
- UT-01 申し送り 4 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## Phase 完了スクリプト呼出例

```bash
# canonical 値再記述の検出（Phase 6 link 以外で数値が transcribe されていないか）
grep -rEn 'max[_ ]retries\s*[:=]\s*[0-9]+' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/ | grep -v 'phase-06'

# 禁止用語の検出
grep -rEn '(re-attempt|リトライ)' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/

# navigation drift 一括確認
ls docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-08/main.md
ls docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md
ls docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md
ls .claude/skills/aiworkflow-requirements/indexes/quick-reference.md

# Phase 完了マーク（artifacts.json 更新は手動 or 別スクリプト）
# bash scripts/phase-complete.sh u-ut01-09-retry-and-offset-policy-alignment 8
```

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証 - quota / SLA 算定)
- 引き継ぎ事項:
  - 整流化済み用語辞書（Phase 9 quota 算定式の表記に使用）
  - canonical single-source path（Phase 9 が参照する canonical 値の唯一の正本）
  - UT-01 申し送り表（Phase 12 unassigned-task-detection に転記される）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - 用語辞書違反の表記が残る
  - canonical 値が複数箇所で transcribe されている
  - navigation drift が 0 にならない
  - UT-01 申し送り表が空
