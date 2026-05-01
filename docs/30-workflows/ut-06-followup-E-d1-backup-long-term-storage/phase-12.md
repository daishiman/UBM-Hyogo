# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (手動 smoke / NON_VISUAL walkthrough) |
| 次 Phase | 13 (PR 作成 / ユーザー承認後の別 PR で実コード実装) |
| 状態 | spec_created |
| タスク種別 | docs-only / workflow_state: spec_created / visualEvidence: NON_VISUAL / scope: data_backup |
| GitHub Issue | #118 (CLOSED) |
| user_approval_required | false（本仕様書は仕様レベル定義に閉じる。実コード適用 PR は Phase 13 承認後の別オペレーション） |

> **300 行上限超過の根拠**: Phase 12 必須 6 タスク（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を全件「仕様レベル定義」として網羅し、Phase 11 4 階層 evidence trace と Phase 9 cron 基盤選定 / Phase 10 月次机上演習 / AC-1〜AC-9 への双方向 trace を直列追跡する責務分離不可能性を根拠に 300 行を許容超過する。

## 目的

Phase 1〜11 で確定した「GHA schedule を D1 export 主経路、Cloudflare cron triggers を R2 latest healthcheck / UT-08 alert 補助経路 + R2 daily 30 日 + monthly 12 ヶ月世代管理 + SSE/KMS/ACL + 復元 SLO < 15 分 + 空 export 許容 + `bash scripts/cf.sh` 経由徹底 + UT-08 alert 連携」を docs validator が読み取れる形で固定し、本ワークフローが「Phase 1〜13 タスク仕様書整備までで完了し、実コード実装 / 実 cron 有効化 / 実演習は Phase 13 ユーザー承認後の別 PR」である境界を明示する。

本 Phase 12 仕様書では **6 タスクの仕様レベル定義** と docs validator 用の最小 Phase 12 成果物作成に閉じる。runtime 実装・実 cron 有効化・実 export・実 restore rehearsal は Phase 13 承認後の別 PR で行う。

## 実行タスク（Phase 12 必須 6 タスク・全件必須）

1. **実装ガイド作成（Part 1 中学生レベル / Part 2 開発者技術詳細 / 視覚証跡 NON_VISUAL 宣言）の仕様レベル定義** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新サマリー（Step 1-A/1-B/1-C + 条件付き Step 2 判定）の仕様レベル定義** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴の仕様レベル定義** — `outputs/phase-12/documentation-changelog.md`
4. **未タスク検出レポート（0 件でも出力必須）の仕様レベル定義** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須・3 観点必須）の仕様レベル定義** — `outputs/phase-12/skill-feedback-report.md`
6. **Phase 12 task-spec compliance check の仕様レベル定義** — `outputs/phase-12/phase12-task-spec-compliance-check.md`

> 上記 6 タスクに対応する **Phase 12 最小成果物は本 wave で作成済み**。ただし runtime evidence と実装 PR 用の詳細 runbook は Phase 13 承認後に別 PR で拡張する。

## docs-only / spec_created モード適用表

| 項目 | 適用内容 |
| --- | --- |
| workflow_mode | docs-only（実コード変更ゼロ。`.github/workflows/d1-backup.yml` の export 主経路追加、`apps/api/wrangler.toml` の healthcheck cron 追加は Phase 13 承認後の別 PR） |
| visualEvidence | NON_VISUAL（D1 export → R2 PUT データパイプライン。UI なし） |
| scope | data_backup |
| Step 1-A | REQUIRED（spec_created でも N/A 不可。LOGS.md×2 + topic-map + 親タスク双方向リンク） |
| Step 1-B | 実装状況 = `spec_created`（実コード実装は Phase 13 承認後の別 PR） |
| Step 1-C | REQUIRED（関連タスク UT-06 親 / UT-12 R2 / UT-08 monitoring / UT-05-FU-003 / UT-06 Phase 6 のステータス current 化） |
| Step 1-G 検証コマンド | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage` |
| Step 2 判定 | aiworkflow-requirements の deployment-cloudflare.md（D1 backup section 拡張）/ database-operations.md（バックアップ運用追記）への反映が REQUIRED か OPTIONAL かを §タスク 2 で判定 |

## タスク 1: 実装ガイド作成（Part 1 + Part 2 + NON_VISUAL 宣言）の仕様レベル定義

**出力先**: `outputs/phase-12/implementation-guide.md`
**pitfalls 参照**: phase-12-pitfalls.md `[UBM-012]`（wrangler 直接呼び出し禁止）

### 必須セクション

#### Part 1（中学生レベル / 日常の例え話・専門用語禁止）

- 「**バックアップってなに？**」: 学校で大事なノートをもう 1 冊「予備ノート」に書き写しておく。本物が燃えても予備があるから安心。
- 「**毎日自動でやるってどういうこと？**」: 毎晩 18 時に自動で「今日のノートをコピーする」装置（cron）を設置。寝てる間も働いてくれる。
- 「**30 日 + 月次の世代管理って？**」: 直近 1 ヶ月分の予備ノートを毎日入れ替え + 月初に「その月の保存版」を別棚に置く。古い保存版は 1 年後に廃棄。
- 「**暗号化って？**」: 予備ノートを鍵付きの金庫に入れる。鍵を持ってる人だけ読める。
- 「**復元演習って？**」: 月に 1 回「もし本物のノートが燃えたら予備から戻せるか」を実際に試す訓練。15 分以内にできなきゃダメ。
- 「**なんで空のノートでも保管するの？**」: 最初の日はまだ何も書いてない。空のノートを「失敗」と扱うと装置が止まっちゃうから、空も「これも一日分」として保管する。

**Part 1 専門用語セルフチェック表**:

| 専門用語 | 日常語への言い換え |
| --- | --- |
| バックアップ | 予備ノート |
| cron triggers | 毎晩 18 時の自動装置 |
| 30 日ローリング | 直近 1 ヶ月分の予備ノート入れ替え |
| 月次スナップショット | 月初の保存版を別棚に |
| SSE / KMS | 鍵付きの金庫 |
| 机上演習 | 戻せるかを試す訓練 |
| 空 export 許容 | 空のノートも一日分 |
| R2 | 予備ノート専用倉庫 |

#### Part 2（開発者技術詳細）

| セクション | 仕様レベル必須内容 |
| --- | --- |
| cron / GHA 設定 | `.github/workflows/d1-backup.yml` を export 主経路にし、`apps/api/wrangler.toml` の `[triggers]` は R2 latest healthcheck / UT-08 alert 補助に限定する |
| backup handler 実装 | GHA 上で `bash scripts/cf.sh d1 export` → gzip → `bash scripts/cf.sh r2 object put`（metadata: env / created_at / encrypted=true）→ 月初判定で monthly prefix へ copy |
| 4 ステップ実装手順 | (1) GHA workflow 追加 / (2) `apps/api` healthcheck cron 追加 / (3) R2 bucket binding + 暗号化設定 / (4) Phase 11 smoke S-03/S-07/S-11/S-15/S-19 期待値テンプレ同期 |
| 圧縮戦略 | gzip 採用（Phase 9 C7）/ 復元 runbook §2 で `gunzip` 単段復元 |
| 暗号化設定 | R2 SSE 標準 / 機密性レベル別暗号化方式（AC-9）/ ACL: bucket private + IAM 制限 |
| 復元 runbook | §1 前提確認 / §2 R2 GET + gunzip / §3 schema / §4 SQL import / §5 smoke、合計 < 15 分（Phase 10 §runbook） |
| 月次机上演習 | 頻度・合格基準・記録形式（Phase 10 §月次机上演習計画）|
| ロールバック | 3 連続失敗 / 容量警告 / 暗号化未適用 の 3 trigger と前世代後退の 3 階層（Phase 10 R5） |
| 視覚証跡 | **NON_VISUAL 宣言**: backend データパイプラインのため screenshot 不要。代替 evidence は L1〜L4（Phase 11） |

> **Part 2 で含めない事項**: `apps/web` 側コード変更（不変条件 #5 違反）/ `wrangler` 直接コマンド（`scripts/cf.sh` 経由を厳守, `[UBM-012]` 準拠）

### セルフチェック項目

- [ ] Part 1 が 6 つの例え話を含む
- [ ] Part 1 専門用語セルフチェック表が 8 行以上
- [ ] Part 2 が 9 セクションすべて記述
- [ ] Part 2 視覚証跡で NON_VISUAL 宣言が明示
- [ ] `wrangler` 直接コマンドが含まれていない（`scripts/cf.sh` ラッパー経由のみ）
- [ ] `apps/web` への変更指示が含まれていない（不変条件 #5）

## タスク 2: システム仕様書更新サマリーの仕様レベル定義

**出力先**: `outputs/phase-12/system-spec-update-summary.md`

### Step 1-A: 仕様書修正対象（REQUIRED）

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 バックアップ運用 / R2 30 日 + 月次世代管理 / 無料枠試算（Phase 9 C2 / C3）追記 |
| `apps/api/wrangler.toml` 関連 README | cron triggers 設定例の参照を追記 |
| `docs/30-workflows/LOGS.md` | UT-06-FU-E `spec_created` 行追加 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | docs-only / NON_VISUAL / data_backup scope 適用例として記録 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | deployment-cloudflare.md / database-operations.md 拡張対象の記録 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | D1 backup 章への UT-06-FU-E 反映を index 再生成で同期 |
| 親タスク `completed-tasks/ut-06-production-deploy-execution` への双方向リンク | UNASSIGNED-E が UT-06-FU-E として spec 化された旨を記録 |

### Step 1-B: 実装状況テーブル更新（REQUIRED）

- 実装状況 = **`spec_created`**
- 理由: 仕様書整備に閉じ、実コード実装（cron handler / wrangler.toml cron triggers）は Phase 13 承認後の別 PR

### Step 1-C: 検証コマンド

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage
```

### Step 2 判定: aiworkflow-requirements 仕様更新

| 反映対象 | 判定 | 理由 |
| --- | --- | --- |
| `deployment-cloudflare.md`（D1 backup section 拡張） | **REQUIRED** | 新規 cron 自動化基盤 / R2 長期保管 / 暗号化方針が aiworkflow-requirements 正本に存在しない |
| `database-operations.md`（バックアップ運用追記） | **REQUIRED** | D1 運用方針として日次バックアップ + 月次机上演習が正本に未反映 |
| WAF / 暗号化詳細章 | **OPTIONAL** | Phase 12 implementation-guide で十分。governance 系で別途吸収可 |

### セルフチェック項目

- [ ] Step 1-A の同期対象が 7 行以上
- [ ] Step 1-B が `spec_created` で固定
- [ ] Step 2 が章ごとに REQUIRED / OPTIONAL を判定（理由付き）
- [ ] LOGS.md 2 ファイル（aiworkflow-requirements + task-specification-creator）の更新指示が両方含まれる

## タスク 3: ドキュメント更新履歴の仕様レベル定義

**出力先**: `outputs/phase-12/documentation-changelog.md`

### エントリフォーマット必須項目

| 列 | 必須記載 |
| --- | --- |
| 日付 | YYYY-MM-DD（Phase 13 実行日） |
| 影響ファイル | 絶対パス |
| 変更概要 | 1〜2 行 |
| 起源タスク | UT-06-FU-E |
| Step 区分 | Step 1-A / Step 1-B / Step 1-C / Step 2 |

### 必須エントリ（Phase 13 実体生成時に最低限記録すべき行）

| 日付 | 変更種別 | 対象ファイル | 変更概要 | Step |
| --- | --- | --- | --- | --- |
| 実行日 | 新規 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/ | Phase 1〜13 仕様書 + outputs/ | 新規 |
| 実行日 | 同期 | docs/30-workflows/LOGS.md | UT-06-FU-E spec_created 行 | Step 1-A |
| 実行日 | 同期 | .claude/skills/task-specification-creator/LOGS.md | data_backup scope 適用例 | Step 1-A |
| 実行日 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | deployment-cloudflare 拡張予告 | Step 1-A |
| 実行日 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | D1 backup 章への反映 | Step 1-A |
| 実行日 | 同期 | completed-tasks/ut-06-production-deploy-execution → 双方向リンク | UT-06-FU-E spec 化記録 | Step 1-C |
| 実行日 | 追記 | docs/00-getting-started-manual/specs/08-free-database.md | D1 backup 運用追記 | Step 2 |
| 実行日 | 追記 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 backup section 拡張 | Step 2 |
| 実行日 | 追記 | .claude/skills/aiworkflow-requirements/references/database-operations.md | バックアップ運用追記 | Step 2 |

### セルフチェック項目

- [ ] Step 1-A / 1-B / 1-C / Step 2 の 4 区分が個別行として記録（マージ禁止）
- [ ] workflow-local 同期と global skill sync が別ブロック扱い
- [ ] 「該当なし」の場合も明示的に行を残す（空欄禁止）

## タスク 4: 未タスク検出レポートの仕様レベル定義（0 件でも出力必須）

**出力先**: `outputs/phase-12/unassigned-task-detection.md`

### baseline（UT-06 親タスクから継承した既知未タスク群）

| 検出項目 | 種別 | 推奨対応 | 区分 |
| --- | --- | --- | --- |
| UT-12 R2 storage セットアップ | 既存独立タスク | 本タスク上流前提として参照固定 | baseline |
| UT-08 monitoring 通知基盤 | 既存独立タスク | Phase 11 S-15 / S-19 で連携検証 | baseline |
| UT-05-FU-003 GHA 監視 | 既存独立タスク | GHA 採用時のみ参照 | baseline |
| UT-06 Phase 6 rollback-rehearsal | 既存実績 | 月次机上演習と並列管理（拡張ではない） | baseline |

### current（本ワークフローで派生した未タスク）

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| 月次机上演習の SOP formalize | 運用 SOP | 頻度 / 合格基準 / 記録形式 / 失敗時 escalation | unassigned-task として formalize 候補（governance 系）|
| R2 暗号化方式（SSE-C / KMS）の機密性レベル別決定 | 設計判定 | AC-9「機密性レベル別暗号化方式記録」を別タスクで詳細化 | unassigned-task として formalize 候補 |
| GHA schedule 監視の UT-05-FU-003 拡張 | 条件付き | C4 で GHA schedule 主経路を採用したため監視対象に追加 | UT-05-FU-003 内吸収可 |

### 未タスクテンプレ 4 必須セクション

1. 苦戦箇所【記入必須】
2. リスクと対策
3. 検証方法
4. スコープ（含む / 含まない）

### セルフチェック項目

- [ ] current / baseline が完全分離
- [ ] 0 件でも「該当なし」セクション明示
- [ ] formalize 候補に割り当て先候補を明記
- [ ] 月次机上演習 SOP は formalize 必須

## タスク 5: スキルフィードバックレポートの仕様レベル定義（3 観点必須）

**出力先**: `outputs/phase-12/skill-feedback-report.md`

### 3 観点必須テーブル

| 観点 | 仕様レベル必須内容 |
| --- | --- |
| **task-specification-creator skill** | `docs-only / NON_VISUAL / data_backup` scope の Phase 12 close-out が `spec_created` で完結できたか / 6 タスク仕様レベル定義（compliance-check 含む）の粒度が phase-12-spec.md と整合したか / Part 1 中学生レベル例え話が「予備ノート / 自動装置 / 月次保存版 / 鍵付き金庫」で再利用可能なテンプレ化候補になるか |
| **aiworkflow-requirements skill** | `deployment-cloudflare.md` / `database-operations.md` への反映が Step 2=REQUIRED として根拠付きで判定できたか / topic-map.md 再生成と LOGS.md 同期が二重カバーできたか |
| **scripts/cf.sh ラッパ運用** | 本タスクは `bash scripts/cf.sh d1 export` / `r2 object put` 等を中心に使う（AC-7）/ Phase 13 実コード適用 PR で `wrangler` 直接呼び出しが implementation-guide / runbook に混入しないか / `[UBM-012]` 規約と整合か |

### セルフチェック項目

- [ ] 3 観点すべてに行
- [ ] 改善点なしでも「観察事項なし」で行を埋める
- [ ] フィードバック ID は append-only

## タスク 6: phase12-task-spec-compliance-check の仕様レベル定義

**出力先**: `outputs/phase-12/phase12-task-spec-compliance-check.md`

### 必須チェック項目

| # | 項目 | 確認方法 |
| --- | --- | --- |
| 1 | Phase 1〜13 全 13 仕様書が存在 | `ls docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-*.md` |
| 2 | `index.md` / `artifacts.json` が存在 | 同 |
| 3 | NON_VISUAL 整合（screenshots/ 不在） | `find ... -name screenshots -type d` が 0 件 |
| 4 | `wrangler` 直接実行手順が存在しない | `rg -n -e '(^|[[:space:]])wrangler[[:space:]]+(d1|deploy|rollback|secret)' docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` の hit が説明文・禁止例のみで、実行手順は `bash scripts/cf.sh` 経由 |
| 5 | `bash scripts/cf.sh` 経由が全 CLI 例で徹底 | `rg -n "scripts/cf\.sh"` が各 phase で 1 件以上 |
| 6 | AC-1〜AC-9 が phase-01 / phase-07 / phase-12 で trace される | 各 AC が implementation-guide Part 2 に対応 |
| 7 | 不変条件 #5 違反なし（apps/web 実ファイル差分なし） | `git diff --name-only -- apps/web` が 0 件、かつ文中の `apps/web` は「変更禁止 / D1 直接アクセス禁止」の境界説明に限定 |
| 8 | Secret 実値混入なし（`op://` 参照名は許可） | `rg -n -e 'ya29\\.' -e '-----BEGIN PRIVATE' -e 'CLOUDFLARE_API_TOKEN=' docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` が 0 件 |
| 9 | 計画系 wording（仕様策定のみ / 実行予定 / 保留として記録）が outputs に残っていない | `rg -n "仕様策定のみ\|実行予定\|保留として記録" outputs/` が 0 件 |
| 10 | docs validator PASS | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js` |

### セルフチェック項目

- [ ] 10 項目すべて確認方法が記述
- [ ] 1 件でも FAIL なら Phase 12 差し戻し旨を明示
- [ ] Phase 13 ユーザー承認ゲート前の最終 gate として機能する

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 7 AC trace 表 | AC-1〜AC-9 → タスク 1 implementation-guide Part 2 / タスク 2 system-spec-update-summary に各 AC trace |
| Phase 11 smoke S-03 / S-07 / S-11 / S-15 / S-19 | smoke 期待値テンプレ → タスク 1 Part 2 4 ステップ手順「(4) Phase 11 smoke 期待値テンプレ同期」へ trace |
| Phase 13 PR description | タスク 3 documentation-changelog → PR description 草案根拠 / タスク 4 unassigned-task-detection の current → PR body「related work」/ タスク 6 compliance-check → user 承認ゲート前の最終 gate |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須 6 タスクの正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | Phase 12 落とし穴 / Feedback ID |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/index.md | AC-1〜AC-9 / 苦戦箇所 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-09.md | C1〜C7 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-10.md | R1〜R5 / 月次机上演習 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-11.md | S-03 / S-07 / S-11 / S-15 / S-19 |
| 必須 | CLAUDE.md §Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` ラッパ強制 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 / R2 無料枠正本 |
| 参考 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint/phase-12.md | NON_VISUAL Phase 12 リファレンス |

## 実行手順

### ステップ 1〜6: タスク 1〜6 の仕様レベル定義
- §タスク 1〜§タスク 6 を本仕様書内に固定し、Phase 12 最小成果物は本 wave で作成済み。runtime evidence は Phase 13 別 PR で追記する。

## 多角的チェック

- **不変条件 #5 違反なし**: タスク 1 Part 2 4 ステップに `apps/web` 編集指示が含まれていないか。
- **6 タスク全件出力（仕様レベル定義）**: §タスク 1〜§タスク 6 が漏れなく記述されているか。1 件欠落で FAIL。
- **docs-only 整合**: 6 実体成果物の作成は Phase 13 承認後の別 PR である旨が冒頭・成果物節・完了条件で 3 重明記されているか。
- **AC-7 整合**: タスク 5 観点 3 で `[UBM-012]` wrangler 直接禁止が反映されているか。タスク 1 Part 2 / タスク 6 でも `bash scripts/cf.sh` 経由徹底が確認されているか。
- **Step 2 判定の妥当性**: deployment-cloudflare.md / database-operations.md への反映が REQUIRED 判定根拠と一致しているか。
- **NON_VISUAL 整合**: タスク 1 Part 2 視覚証跡セクションで NON_VISUAL 宣言 + L1〜L4 代替 evidence 参照が記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | タスク 1（implementation-guide）の仕様レベル定義 | 12 | spec_created | Part 1 + Part 2 + NON_VISUAL 宣言 |
| 2 | タスク 2（system-spec-update-summary） | 12 | spec_created | Step 1-A/B/C + Step 2 章別判定 |
| 3 | タスク 3（documentation-changelog） | 12 | spec_created | エントリ 9 行 |
| 4 | タスク 4（unassigned-task-detection） | 12 | spec_created | current/baseline 分離 |
| 5 | タスク 5（skill-feedback-report） | 12 | spec_created | 3 観点 |
| 6 | タスク 6（phase12-task-spec-compliance-check） | 12 | spec_created | 10 項目チェック |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様書 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-12.md | 本ファイル（Phase 12 6 タスクの仕様レベル定義） |

> **重要**: Phase 12 outputs の 6 実体ファイルは本 wave で作成済み。Phase 13 ユーザー承認後の別 PR では、runtime evidence と実装 PR 用の詳細 runbook のみを拡張する。

## 完了条件

- [ ] タスク 1〜6 すべての仕様レベル定義（必須セクション + セルフチェック）が本仕様書に記述
- [ ] 各タスクで「出力先パス / 必須セクション / セルフチェック」が揃っている
- [ ] docs-only / spec_created モード適用表が記述
- [ ] 300 行上限超過の根拠が冒頭に記述
- [ ] 統合テスト連携（Phase 7 / Phase 11 / Phase 13）が記述
- [ ] 多角的チェック（不変条件 #5 / 6 タスク全件 / docs-only 整合 / AC-7 / Step 2 判定 / NON_VISUAL 整合）が記述
- [ ] 「Phase 12 最小成果物 6 件は本 wave で作成済み、runtime evidence は Phase 13 承認後」が冒頭・成果物節・完了条件で 3 重明記

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべてが本仕様書に記述済み
- 本仕様書の状態 = `spec_created`
- 実成果物（6 ファイル）は Phase 13 承認後の別 PR で生成
- artifacts.json の `phases[11].status` 更新は別タスク

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required: true**）
- 引き継ぎ事項:
  - 6 タスクの仕様レベル定義 → Phase 13 実コード適用 PR の docs 同期スコープ
  - タスク 1 Part 2 4 ステップ手順 → Phase 13 `apply-runbook` の正本
  - タスク 3 必須エントリ 9 行 → Phase 13 PR description 草案根拠
  - タスク 4 current 3 件 → Phase 13 後続 formalize 候補
  - タスク 6 compliance-check 10 項目 → Phase 13 ユーザー承認ゲート前の最終 gate
- ブロック条件:
  - 6 タスクのいずれかの仕様レベル定義が欠落
  - 実成果物（6 ファイル）が本 PR で誤って作成されている
  - `wrangler` 直接呼び出しが implementation-guide 仕様に混入
  - 不変条件 #5 違反（`apps/web` 編集指示）が混入
