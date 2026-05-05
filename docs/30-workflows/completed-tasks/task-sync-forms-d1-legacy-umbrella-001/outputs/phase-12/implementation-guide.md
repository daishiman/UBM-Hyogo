# Phase 12 Task 12-1: Implementation Guide（PR メッセージ source）

## このファイルの役割

Phase 13 の PR body の source。本 PR の **何を / なぜ / どう確認するか** を、Part 1（初学者・中学生レベル）と Part 2（開発者・技術者レベル）の 2 段階で説明する。本タスクは docs-only / NON_VISUAL のため screenshot は添付しない。

---

## Part 1: 初学者・中学生レベル

### こまっていたこと（Why）

このプロジェクトには「Google Form の回答を毎日 D1 というデータベースに取り込む」しくみが必要です。むかし「UT-09」という古い計画書（旧 Sheets→D1 同期ジョブ）を書きましたが、最近は **Google Sheets ではなく Google Forms から直接データをもらう** やり方に変更しました。古い計画書をそのまま残しておくと、新しいメンバーや AI エージェントが「これに沿って実装しよう」と勘違いし、新しいやり方と古いやり方の両方が動く（=二重正本）危険があります。

### 何をしたか（What）

古い計画書（旧 UT-09）を **消さずに** 残し、その入口に「これは古いやり方の入口です。新しい入口はここにあります」と札を立てる作業をしました。新しい入口（実装場所）は次の 5 つです:

| 入口 | 役割 |
| --- | --- |
| 03a | Forms から「質問の構造」を取り込む |
| 03b | Forms から「回答」を取り込む |
| 04c | 管理者ボタンの API 入口（`/admin/sync/schema` と `/admin/sync/responses`） |
| 09b | 自動で動かすタイマー（cron）と運用手順書 |
| 02c | 二重に動かないようにする鍵（`sync_jobs` テーブル） |

### 日常生活での例え

たとえば、学校の古い下駄箱に「新しい教室はこちら」と札を貼る作業に似ています。下駄箱を壊す必要はありませんが、そこから授業を始めると古い地図を見て迷います。今回も旧 UT-09 を消さず、現役の 03a / 03b / 04c / 09b / 02c へ案内する札を付けました。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| Phase 12 の 7 成果物 | 実装ガイド、仕様更新 summary、更新履歴、未タスク検出、skill feedback、compliance check |
| legacy umbrella 台帳 | 旧 UT-09 が direct 実装ではなく現行タスクへの案内役だと示す |
| follow-up 未タスク | stale/current 分類と逆リンク掃除を別タスクで追跡する |

### 用語をその場で短く説明

- **legacy umbrella（古い包括タスク）**: 役目が終わった古い計画を、別の現役計画たちの「上にひろげた傘」のように位置づけて、入口だけ残す手法。
- **stale（古くなって使えなくなった）**: 仕様変更で意味がなくなった文書や設定。
- **D1**: Cloudflare が提供する SQLite ベースの軽量データベース。
- **WAL（Write-Ahead Logging）**: SQLite が同時書き込みに強くなる仕組み。D1 では保証されないので、別の仕組み（retry/backoff）で代替します。
- **`sync_jobs`**: 同期ジョブの実行履歴を残すテーブル。`status='running'` の行があれば、同じ仕事が二重に走らないように 409 Conflict を返します。

### この作業のあとの状態

- 古い計画書を見ても「これは古い入口です」と札がある
- 新しい実装は 03a / 03b / 04c / 09b / 02c に分かれている
- これからの新規実装者・AI エージェントが古い経路を作りなおすことがない

---

## Part 2: 開発者・技術者レベル

### legacy umbrella pattern の定義と適用条件

| 項目 | 内容 |
| --- | --- |
| 定義 | 旧 task が direct implementation として残ると現行 task と二重正本になる場合に、旧 task を **legacy umbrella** として保持し、責務を現行 task 群に分散吸収する pattern |
| 適用条件 | (a) 旧 task の責務が現行 task に完全分散できる、(b) 旧 task の品質要件（retry/backoff 等）を移植する受け手が存在する、(c) docs-only で完結し runtime コードを生成しない |
| 採用判定 | Phase 03 で A/B/C/D 4 案比較、C 案 PASS |

### stale → canonical のマッピング

| 観点 | stale | canonical |
| --- | --- | --- |
| 同期 API | `Google Sheets API v4` / `spreadsheets.values.get` | `forms.get` / `forms.responses.list` |
| 手動 endpoint | 単一 `/admin/sync` | `POST /admin/sync/schema` + `POST /admin/sync/responses` |
| 監査テーブル | `sync_audit` | `sync_jobs` |
| 環境表記 | `dev / main 環境` | `dev branch -> staging env` / `main branch -> production env` |
| ジョブ排他 | アプリ内 mutex | `sync_jobs.status='running'` 行 + 409 Conflict |
| 競合対策 | PRAGMA WAL 前提 | retry/backoff（指数）+ 短い tx + batch-size 制限 |
| ディレクトリ | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/` |

### 責務移管の根拠

- **Forms API 正規化**: `forms.get` + `forms.responses.list` で section / question / consent を直接取得でき、Sheets 列固定の脆弱性を回避（不変条件 #1）
- **`sync_jobs` 同種 job 排他**: `status='running'` の existing row があれば 409 Conflict を返す guard。WAL 非前提 D1 で二重起動を防ぐ
- **WAL 非前提**: D1 は `PRAGMA journal_mode=WAL` を保証しないため、`SQLITE_BUSY` retry/backoff・短い transaction・batch-size 制限を 03a / 03b の異常系として継承（specs/08-free-database.md 整合）

### TypeScript 型定義

```ts
type LegacyUmbrellaStatus = "spec_created" | "completed_with_followups";

interface LegacyUmbrellaTransfer {
  staleResponsibility: string;
  canonicalOwner: "02c" | "03a" | "03b" | "04c" | "09b";
  currentContract: string;
  directResidualResponsibility: 0;
}
```

### CLIシグネチャ

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001 \
  --json
```

### 使用例

```bash
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-followup-cleanup-001.md
```

### specs 由来の用語解説（中学生レベル補助説明併記）

| 用語 | spec 出典 | 補助説明 |
| --- | --- | --- |
| `sync_jobs` | specs/03-data-fetching.md | 同期ジョブの履歴。`status='running'` 行が同種 job 排他の鍵 |
| cursor pagination | specs/03-data-fetching.md | Forms API レスポンス分割取得の続きを示す「しおり」 |
| current response | specs/03-data-fetching.md | 同一 `responseId` の最新 1 件を「現在の回答」と決めるロジック |
| consent snapshot | specs/03-data-fetching.md / 01-api-schema.md | response 取得時点の `publicConsent` / `rulesConsent` を凍結保存 |
| `responseId` | specs/01-api-schema.md | Forms API 側の回答識別子（system field） |
| `publicConsent` / `rulesConsent` | specs/01-api-schema.md | 同意キー。consent snapshot に格納される |

### 検証コマンド + 期待出力（reviewer 確認手順）

```bash
# 1. 必須 9 セクション準拠
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
# => current violations: 0

# 2. stale path scan
rg -n "ut-09-sheets-to-d1-cron-sync-job" docs/30-workflows/02-application-implementation
# => 0 hit（legacy umbrella 文脈以外）

# 3. Sheets API 残存
rg -n "Google Sheets API v4|spreadsheets\.values\.get" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver
# => 0 hit

# 4. conflict marker
rg -n "^(<<<<<<<|=======|>>>>>>>)" \
  docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001 \
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md \
  .claude/skills/aiworkflow-requirements/references
# => 0 hit

# 5. 影響範囲確認
git diff --stat origin/main...HEAD
# => docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/** 配下のみ（apps/ packages/ 変更なし）
```

### 不変条件チェック

| 不変条件 | 結果 |
| --- | --- |
| #1 schema 過剰固定回避 | OK（forms.get 動的取得を 03a に集約） |
| #5 apps/web → D1 直接禁止 | OK（D1 owner は 02c / 03a / 03b、apps/api 経由のみ） |
| #6 GAS prototype 不採用 | OK（cron は Workers Cron Triggers のみ） |
| #7 Form 再回答が本人更新 | OK（response sync を 03b に一本化） |
| #10 無料枠運用 | OK（増分 0、09b で cron 頻度試算継続） |

### visualEvidence

`NON_VISUAL`（UI 変更なし、screenshot 添付なし）。reviewer は screenshot を求めず、上記 rg / audit script の結果と `outputs/phase-11/manual-evidence-bundle.md` を主証跡とする。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `metadata.taskType` | `docs-only` |
| `metadata.visualEvidence` | `NON_VISUAL` |
| `metadata.workflow_state` | `spec_created`（Phase 12 完了でも据え置き） |
| `metadata.legacy_id` | `UT-09` |

### エラーハンドリング

- `metadata.workflow_state` が誤って `completed` に書き換えられた場合 → Phase 13 gate FAIL
- Phase 11 必須 3 ファイル + manual-evidence-bundle 欠落 → NON_VISUAL evidence 不足で FAIL
- `/admin/sync(?!/)` の hit → `/admin/sync/schema` / `/admin/sync/responses` へ置換
- `Google Sheets API` という語は legacy umbrella の説明文脈でのみ許容、新規実装入口の文脈では FAIL

### エッジケース

- `.agents/skills` が symlink の場合、mirror sync はコピーではなく `diff -qr .claude/skills .agents/skills` の exit code 0 を証跡にする
- stale 掃除が複数正本にまたがる場合、Phase 12 本体は `completed_with_followups` とし、follow-up 未タスクを full template で残す
- `sync_audit` が lessons の historical context に出る場合は削除せず、current fact として読める行だけを分類する

### テスト構成

| テスト | 目的 | 期待 |
| --- | --- | --- |
| implementation guide validator | Part 1 / Part 2 の必須見出しと内容を確認 | exit code 0 |
| unassigned task scoped audit | follow-up 未タスクの current 違反を確認 | `current violations: 0` |
| aiworkflow index / structure | system spec index と構造を確認 | PASS または既存 warning のみ |
| mirror parity | `.claude` 正本と `.agents` mirror の一致確認 | `diff -qr` 出力なし |

## reviewer 向け Quick Glance

| 項目 | 値 |
| --- | --- |
| 種別 | docs-only / NON_VISUAL |
| 影響範囲 | `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/**` のみ |
| direct 残責務 | 0 件 |
| AC 到達 | 13/14（AC-14 は本 PR 承認で履行） |
| screenshot | 不要 |
| 移植要件の受け手 | 03a / 03b / 04c / 09b / 02c |
