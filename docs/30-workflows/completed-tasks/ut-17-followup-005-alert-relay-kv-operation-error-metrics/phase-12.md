# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| GitHub Issue | #701（OPEN） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 判定根拠 | Phase 2-10 で実装した構造化ログヘルパ・`KV.get` fail-open 化・テスト拡張・runbook 追記を、aiworkflow-requirements skill / runbook / unassigned-task index 等の正本へ反映する Phase。UI を持たないが Phase 12 strict 7 outputs は省略しない |

---

## 目的

Phase 1〜11 で完成した「`alert-relay.ts` KV 操作の構造化ログ emit」実装を、後段 dashboard (UT-17-FU-006 候補) が契約として参照できる正本群（runbook / skill references / completed-tasks 移動）へ引き継ぐ。

---

## なぜ正本同期が必要か（中学生レベル概念説明）

### 1. 「KV」って何？

KV は「Cloudflare 上のミニ付箋帳」だ。アプリが `key="xxx"` で付箋を貼っておくと、世界中のどこからでも `key` で引っ張り出せる。本タスクの alert-relay は、Slack に同じ通知を何度も流さないように「この通知は 5 分以内にもう送ったよ」というメモを KV に貼っている。

### 2. 「dedup」って何？

dedup（デデュープ）は「重複排除」の略。同じ警報が短時間に何度も Slack に流れると、本物の異常時に気づきにくい。そこで「直近 5 分以内に同じ警報を出していたら 2 回目以降は黙る」というロジックを入れる。dedup の判定材料は KV に保存する。

### 3. 「ログを構造化する」と何が嬉しい？

普通のログは「KV put に失敗しました」みたいな**文章**で出る。これだと、後で「今月、KV put 失敗が何回あった？」と数えるのが大変（人間が目で grep するか、正規表現を頑張る）。

構造化ログは、最初から **JSON 1 行**でログを書く。例:

```json
{"event":"alert_relay_kv_op_failed","op":"put","errorClass":"Error","dedupeKeyHash":"a1b2c3d4e5f6","isolateId":"7c9...","ts":"2026-05-16T03:00:00.000Z"}
```

こうしておくと、後で「`event` が `alert_relay_kv_op_failed` の行だけ抜き出して、`op="put"` と `op="get"` の件数を別々に数える」が 1 行のコマンドでできる。Cloudflare Dashboard のグラフ化や、Slack 通知の自動化にも繋げやすい。

### 4. なぜ正本を同期する必要がある？

「家に火災報知器を取り付けた」だけだと、家族の誰も**取扱説明書の存在を知らない**まま 1 年経ち、いざ点検しようとしたら手順が分からない、ということが起きる。

Phase 12 では「**新しく作ったログの説明書（schema 表）を、月次点検 runbook と skill リファレンスに追記する**」作業を行う。これで 3 ヶ月後の自分や別の運用者が「あのログは何 field でできてたっけ？」を**取扱説明書 1 ページ**で取り戻せる。

### 5. なぜ behaviour change を伴うのか

本タスクは「ログ 1 行を追加する」だけのつもりだが、現コードの `KV.get` は実は try/catch が無く、KV が一時障害になると Slack 配信ごと落ちる（fail-closed）。本タスクで catch を追加して fail-open + log にすることで「**KV が一時的にダメでも Slack には届く、その代わりログで気づける**」状態に切り替える。この意思決定は Phase 3 設計レビューで承認済。

---

## 必須 outputs（7 ファイル / strict）

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## 12-1. main.md（概要 + 7 ファイル状態一覧）

想定セクション:

- 「Phase 12 の目的」（1 段落）
- 「7 必須成果物の一覧と current status」（表形式・各ファイルの行数・更新日・PASS/PENDING）
- 「Phase 1-11 成果物への back-link」
- 「次 Phase (Phase 13) への引き継ぎ事項」

---

## 12-2. implementation-guide.md（Phase 13 PR 本文の元データ）

### Part 1 — 中学生レベル概念説明（必須・本 phase-12.md 冒頭「なぜ正本同期が必要か」5 段落を転記）

「KV って何？」「dedup って何？」「ログを構造化すると何が嬉しい？」「なぜ正本を同期する？」「なぜ behaviour change を伴うのか」を 5 段落で説明する（本ファイル冒頭セクションを正本転記）。

### Part 2 — 技術契約

#### 2-A. 変更ファイル diff サマリ

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | module top で `isolateId` 採番 + `logKvOperationError` helper 追加 + `KV.get` を try/catch 化 + `KV.put` catch ブロックの `console.warn` 非構造化ログを構造化 JSON に置換 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 追加 4 ケース: (a) `KV.get` throw → fail-open + 構造化ログ 1 行、(b) `KV.put` throw → 既存レスポンス維持 + 構造化ログ 1 行、(c) 成功 path で `console.warn` が 0 回、(d) payload shape assertion (`event`/`op`/`errorClass`/`dedupeKeyHash`/`isolateId`/`ts` 6 field 完全一致) |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログ確認」セクション追記。`scripts/cf.sh tail \| grep alert_relay_kv_op_failed` 例 + field 定義表 |

#### 2-B. シグネチャ

```ts
// apps/api/src/routes/internal/alert-relay.ts (module-local helper)

const isolateId = crypto.randomUUID(); // module top で 1 回採番

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

#### 2-C. log schema 全文（後段 dashboard 契約）

```json
{
  "event": "alert_relay_kv_op_failed",
  "op": "get" | "put",
  "errorClass": "<err.constructor.name or typeof err>",
  "dedupeKeyHash": "<SHA-256(dedupeKey) hex 先頭 12 文字>",
  "isolateId": "<module top で採番した uuid v4>",
  "ts": "<new Date().toISOString()>"
}
```

`JSON.stringify` で 1 行に整形され、`console.warn` で emit される。Workers Logs / `wrangler tail` で `grep alert_relay_kv_op_failed` で抽出可能。

#### 2-D. 実行コマンド全集

```bash
# 型 / Lint / Test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay

# grep gate（schema 文字列の 3 点同期確認）
grep -rn "alert_relay_kv_op_failed" apps/api/src/
grep -rn "logKvOperationError" apps/api/src/

# runtime tail（staging deploy 後・user-gated）
bash scripts/cf.sh tail --env staging --config apps/api/wrangler.toml | grep alert_relay_kv_op_failed
```

#### 2-E. DoD（Definition of Done）

- [ ] `KV.get` に try/catch 追加され、catch ブロックで `logKvOperationError("get", err, dedupeKey)` を呼ぶ
- [ ] `KV.put` の既存 catch ブロックで `console.warn` 直書きを `logKvOperationError("put", err, dedupeKey)` に置換
- [ ] `isolateId` が module top で `crypto.randomUUID()` で 1 回採番される（emit ごとに採番しない）
- [ ] `dedupeKeyHash` が `SHA-256(dedupeKey)` の先頭 12 hex chars
- [ ] 成功 path で `console.warn` が 0 回（AC-6）
- [ ] HTTP レスポンス shape が変わっていない（AC-7）
- [ ] `*.spec.ts` 縛り遵守、新規 `*.test.ts` ファイル 0（AC-10）
- [ ] runbook に field 定義表 + `cf.sh tail \| grep` 例追記（AC-9）
- [ ] typecheck / lint / test PASS（AC-8）

---

## 12-3. system-spec-update-summary.md（aiworkflow-requirements / specs への反映点）

想定セクション:

- 「本タスクが更新する system spec: なし」
  - 理由: 本タスクは observability の補強であり、`docs/00-getting-started-manual/specs/` 配下（00-overview / 01-api-schema / 02-auth 等）の API 仕様自体は不変
  - `apps/api/src/routes/internal/alert-relay.ts` の HTTP レスポンス shape も不変
- 「runbook 更新」
  - `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への追記は **Phase 8 で完了済**（本 Phase で再度ファイル本体を編集する必要はない）
  - Phase 12 では「追記が漏れていないか」の cross-check のみ実施
- 「aiworkflow-requirements skill 反映」
  - `indexes/keywords.json` に `alert_relay_kv_op_failed` / `dedupeKeyHash` / `isolateId` / `structured logging` を追加するか判定する
  - 反映する場合は `pnpm indexes:rebuild` 実行を Phase 13 PR 直前に行い、`verify-indexes-up-to-date` CI gate が PASS することを確認する
- 「completed-tasks 移動」
  - `docs/30-workflows/unassigned-task/ut-17-followup-005-*.md` を `docs/30-workflows/completed-tasks/` 配下へ移動するのは Phase 13 post-merge アクションとし、本 Phase では「移動先 path と git mv コマンド文」のみ準備する

---

## 12-4. documentation-changelog.md（更新ファイル absolute path 列挙）

想定セクション:

- 「コード変更ファイル」
  - `/Users/.../apps/api/src/routes/internal/alert-relay.ts`
  - `/Users/.../apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
- 「runbook 変更ファイル」
  - `/Users/.../docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- 「ワークフロー仕様書ファイル（本タスク配下）」
  - `index.md` / `artifacts.json` / `phase-01.md` 〜 `phase-13.md`
  - `outputs/phase-01/` 〜 `outputs/phase-13/` 配下の全ファイル絶対 path
- 「skill 同期ファイル（実施する場合のみ）」
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
  - `.agents/skills/aiworkflow-requirements/indexes/keywords.json`（mirror parity）
- 各ファイルに対する「変更種別」（new / edit / move）を列に持つ

---

## 12-5. unassigned-task-detection.md（後続 followup 候補）

想定セクション:

- 「本サイクルで新たに発見した unassigned task: 1 件」
  - **UT-17-FU-006（候補）: alert-relay KV op failure dashboard 化**
  - 概要: 本タスクで emit する `event=alert_relay_kv_op_failed` を Cloudflare Workers Logpush → R2 / Analytics Engine に流し、daily/weekly 集計と閾値超過時の Slack 通知を実装する
  - 接続点: 本タスクが生成する log schema (AC-3) を**後続契約として固定**することで、UT-17-FU-006 は schema を変更せず consumer 側だけ実装すれば良い
  - 優先度: LOW（運用観測の充実フェーズ）
  - スコープ案: Logpush 設定 / Analytics Engine binding / 集計クエリ / dashboard 配信
- 「既存 followup との独立性確認」
  - UT-17-FU-001 / 002 / 003 / 004 はそれぞれ独立。本タスクは 002（dedup KV 永続化）の延長線上にあるが、coding 上は alert-relay.ts に閉じ独立
- 「Issue #701 の扱い」
  - 本 PR merge + post-merge `completed-tasks/` 移動で close 可。close コミットでは `Closes #701` ではなく `Refs #701` を使う運用に従う

---

## 12-6. skill-feedback-report.md（3 観点・0 件でもセクション固定）

想定セクション（各セクションは必ず存在させる。観察事項が 0 件なら「該当なし」と明記）:

- 「テンプレ改善」
  - 例: 「`phase-11.md` の NON_VISUAL 代替 evidence について、5 点セット (typecheck/lint/test/build/grep) のフォーマットを再利用テンプレ化すると良い」
- 「ワークフロー改善」
  - 例: 「原典 unassigned-task の test path (`*.test.ts`) と現行ポリシー (`*.spec.ts`) の乖離を Phase 1 で検出した。今後 unassigned-task 起票時に `*.spec.ts` 縛りを check list 化したい」
- 「ドキュメント改善」
  - 例: 「`docs/30-workflows/runbooks/` 配下の runbook が log schema を field 表として持つパターンは再利用価値が高い。skill reference に schema 表のフォーマットテンプレを切り出す価値あり」
- 0 件の場合: 各セクション本文に「該当なし。本サイクルでは新規 feedback 観察事項なし」と 1 行で明記

---

## 12-7. phase12-task-spec-compliance-check.md（Phase 12 compliance 9 必須セクション充足チェック）

想定セクション:

- 「Phase 12 必須 outputs 7 ファイル充足チェック」（チェックリスト）
- 「中学生レベル概念説明 (5 段落) 充足チェック」
- 「変更ファイル diff サマリ充足チェック」
- 「シグネチャ / 入出力 / 副作用充足チェック」
- 「log schema 全文記載チェック」
- 「実行コマンド全集チェック」
- 「DoD チェック」
- 「placeholder token grep 0 件 gate」（後述）
- 「dirty-code gate」（後述）

---

## placeholder token grep 0 件 gate

Phase 12 outputs 全 7 ファイルに対し以下 grep を実行し、いずれも **0 件** であることを確認する:

```bash
ROOT=docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-12

# 禁止トークン
grep -rn "token-sized" "$ROOT"
grep -rn "09b-token-value" "$ROOT"
grep -rn "token-mix" "$ROOT"
grep -rn "TODO" "$ROOT"
grep -rn "FIXME" "$ROOT"
grep -rn "XXX" "$ROOT"

# 期待: いずれも 0 件
```

これらは task-specification-creator skill が placeholder のまま残置するケースを検出する gate。1 件でもマッチした場合、該当 outputs を Phase 12 完了前に修正する。

---

## dirty-code gate

仕様書段階（Phase 1-5）では `apps/` `packages/` への差分は基本無いが、Phase 6 実装後はコード差分を伴う。Phase 12 完了時点では:

- `git diff dev...HEAD --name-only -- apps/api/` が 2 ファイル（`alert-relay.ts` / `alert-relay.spec.ts`）に限定されていること
- `apps/web/` 配下に差分が 1 件も無いこと（`git diff dev...HEAD --name-only -- apps/web/` が空）
- `packages/` 配下に差分が 1 件も無いこと
- `apps/api/wrangler.toml` / `apps/api/src/env.ts` に差分が無いこと（既存 `ALERT_DEDUP_KV` binding 流用のため）

これらを Phase 12 完了 gate として `phase12-task-spec-compliance-check.md` 末尾でチェックする。

---

## 完了条件

- [ ] strict 7 outputs（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）が `outputs/phase-12/` に配置されている
- [ ] `implementation-guide.md` に Part 1 (中学生レベル 5 段落) + Part 2 (技術契約: 変更ファイル / シグネチャ / log schema 全文 / 実行コマンド / DoD) が揃っている
- [ ] `system-spec-update-summary.md` で「specs 配下更新なし」「runbook は Phase 8 で完了済」「completed-tasks 移動は Phase 13 post-merge」が明記されている
- [ ] `unassigned-task-detection.md` に後続 UT-17-FU-006 候補と log schema 契約固定の旨が記載されている
- [ ] `skill-feedback-report.md` に 3 観点（テンプレ/ワークフロー/ドキュメント）のセクションが必ず存在する（0 件でもセクション固定）
- [ ] placeholder token grep 0 件
- [ ] dirty-code gate PASS（`apps/web` / `packages/` / `wrangler.toml` / `env.ts` への混入なし）

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13（PR・振り返り / user approval gate）
- 引き継ぎ:
  - `implementation-guide.md` Part 2-A〜2-E → PR 本文「変更ファイル / シグネチャ / log schema / 検証コマンド / DoD」
  - `unassigned-task-detection.md` → PR 本文「後続タスク」 + post-merge unassigned-task 移動アクション
  - `system-spec-update-summary.md` の git mv コマンド → Phase 13 post-merge ステップ
- ブロック条件: placeholder token grep が 1 件以上ヒット、または dirty-code gate FAIL の場合は Phase 13 へ進まない

---

## 参照

- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-12.md`（フォーマット参考）
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs ルール）
- `index.md` AC-3（log schema 全文）/ AC-9（runbook 追記要件）

## 実行タスク

Phase 11 evidence、Phase 12 strict 7 outputs、aiworkflow-requirements 同期、workflow state 再分類を完了する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-12/*.md` | strict 7 outputs |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 正本索引 |

## 成果物/実行手順

root `artifacts.json` と `outputs/artifacts.json` を mirror し、`implemented_local_evidence_captured` として記録する。
