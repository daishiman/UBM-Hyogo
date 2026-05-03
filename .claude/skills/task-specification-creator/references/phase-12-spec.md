# Phase 12 重要仕様

## 必須タスク（5タスク - 全て完了必須）

| Task | 名称                             | 必須 | 詳細参照                                    |
| ---- | -------------------------------- | ---- | ------------------------------------------- |
| 1    | 実装ガイド作成（2パート構成）    | ✅   | 下記参照                                    |
| 2    | システム仕様書更新（2ステップ）  | ✅   | 下記参照                                    |
| 3    | ドキュメント更新履歴作成         | ✅   | scripts/generate-documentation-changelog.js |
| 4    | 未タスク検出レポート作成         | ✅   | **0件でも出力必須**                         |
| 5    | スキルフィードバックレポート作成 | ✅   | **改善点なしでも出力必須**                  |

### Phase 12 outputs/ 必須成果物（合計 7 ファイル＝main.md + 6 補助）

Phase 12 では `outputs/phase-12/` 配下に以下 **7 ファイルを必ず揃える**。1 つでも欠落した場合は `phase12-task-spec-compliance-check.md` の判定を `FAIL` とし、blocker を列挙する（PASS 断言禁止）。

| # | ファイル                                  | 由来 Task         | 欠落時の扱い |
| - | ----------------------------------------- | ----------------- | ------------ |
| 1 | `main.md`                                 | Phase 12 本体     | FAIL         |
| 2 | `implementation-guide.md`                 | Task 1            | FAIL         |
| 3 | `system-spec-update-summary.md`           | Task 2            | FAIL         |
| 4 | `documentation-changelog.md`              | Task 3            | FAIL         |
| 5 | `unassigned-task-detection.md`            | Task 4（0 件でも必須） | FAIL    |
| 6 | `skill-feedback-report.md`                | Task 5（改善なしでも必須） | FAIL |
| 7 | `phase12-task-spec-compliance-check.md`   | Task 6（最終確認 root evidence） | FAIL |

> Task 6 の詳細: [phase-12-tasks-guide.md](phase-12-tasks-guide.md) §Task 6。`PASS` は「成果物の実体 + validator 実測値 + same-wave sync 証跡」が揃った後にのみ許可する。

### Implementation evidence path の状態表現

Phase 12 には `spec formalization path` と `implementation evidence path` がある。コード差分、Phase 11 evidence、Phase 12 7 成果物がすでに存在する実装タスクでは、root `artifacts.json`、`index.md`、`phase12-task-spec-compliance-check.md` の状態を `verified` / `implementation_complete_pending_pr` へ揃える。`spec_created` は実装着手前の状態だけに使い、実装済みタスクの compliance check に残さない。

`system-spec-update-summary.md` に `pending same-wave sync` が残る場合、Task 6 は `PASS` にしてはならない。同一 wave で aiworkflow-requirements indexes / task-workflow / legacy mapping を更新するか、明確に `PASS_WITH_OPEN_SYNC` / `FAIL` として blocker を列挙する。

#### Implementation evidence path 状態揃え checklist

実装タスク（コード差分が wave 内に存在し Phase 11 evidence が出揃ったケース）で root `artifacts.json` / `index.md` / `phase12-task-spec-compliance-check.md` を `verified` + `implementation_complete_pending_pr` に整合させる際は、以下を順に確認する（UT-02A 由来 / 2026-05-01）:

| # | 確認項目 | 失敗時の挙動 |
| --- | --- | --- |
| 1 | root `artifacts.json` の `metadata.workflow_state` が `verified` で、`metadata.implementation_status` が `implementation_complete_pending_pr` になっている | `spec_created` のままなら本セクション冒頭ルールに反するので置換 |
| 2 | `index.md` の Status / Workflow State 行が artifacts.json と一致（drift 禁止） | drift があれば artifacts.json を正本として index.md を上書き |
| 3 | `phase12-task-spec-compliance-check.md` の総合判定行が `verified` を反映し、`spec_created` と書かれていない | 旧テンプレ語彙が残る場合は当該行のみ書き換える |
| 4 | `system-spec-update-summary.md` の Step 1-A〜1-C / Step 2 / Step 3 が同一 wave で完了済 or `PASS_WITH_OPEN_SYNC` の根拠が併記されている | 未完なら same-wave sync を実施するか blocker を明記 |
| 5 | aiworkflow-requirements `indexes/` / `task-workflow-active.md` / legacy mapping のうち更新対象が wave 内コミットに含まれている | 別 wave に分離する場合は派生未タスクへ移管しリンクを貼る |
| 6 | `unassigned-task-detection.md` に新規未タスクが 0 件でも明示記載され、生成された未タスクファイルが [unassigned-task-quality-standards.md](unassigned-task-quality-standards.md) §ファイル命名規則 / §`<cat>` 語彙に従っている | 命名 drift があれば rename し、`detection.md` のリンクも更新 |

> 上記 6 項目すべてが OK のときに限り Task 6 を `PASS` にできる。1 つでも失敗するときは `PASS_WITH_OPEN_SYNC` か `FAIL` を選び、根拠を `phase12-task-spec-compliance-check.md` に列挙する。

---

## Task 1: 実装ガイドの2パート構成

| パート     | 対象読者                 | 内容                                       |
| ---------- | ------------------------ | ------------------------------------------ |
| **Part 1** | **初学者・中学生レベル** | **概念説明（日常の例え話、専門用語なし）** |
| **Part 2** | **開発者・技術者**       | **技術的詳細（スキーマ・API・コード例）**  |

**Part 1（中学生レベル）の必須要件**:

- 日常生活での例え話を**必ず**含める
- 専門用語は使わない（使う場合は即座に説明）
- 「なぜ必要か」を先に説明してから「何をするか」を説明

**Part 1 ドラフト採用ルール（運用ドリフト防止 / 2026-04-30 ut-06b 由来）**:

- ワークフロー仕様書の `phase-12.md`（または `phases[12].md` / 元タスク仕様書 Phase 12 セクション）に **中学生レベルドラフト** が既に存在する場合、`implementation-guide.md` Part 1 には **そのドラフトを原則そのままコピーペーストする**。AI による「自然な書き直し」と称した技術用語混入は禁止。
- Part 2（技術者レベル）を拡張するときに Part 1 の語彙を専門用語化して「整える」操作は禁止（Part 1 を Part 2 のために犠牲にしない）。Part 1 と Part 2 は独立したファイルセクションとして併存させる。
- 元仕様書にドラフトが無い場合のみ新規執筆し、その場合も次の必須要素チェックリストを **書き終えた後** に通すこと。

**Part 1 必須要素チェックリスト（書き終えたら全項目を確認）**:

| # | チェック項目 | 不合格時の対処 |
| --- | --- | --- |
| 1 | 日常生活の例え話が **1 つ以上** 本文中に登場する（料理 / 図書館 / 学校 / 郵便 / 店舗 など） | 例え話を追加してから次へ |
| 2 | 専門用語セルフチェック表に **5 用語以上** を載せ、各用語に日常語の言い換えを併記している | 5 用語未満なら本文を読み直し、説明なしで使った用語を抽出して表へ追加 |
| 3 | 本文の語彙が **学校生活レベル**（中学 2 年生が読んで止まらない）に収まっている | 「インターフェース」「契約」「永続化」等が括弧書きの言い換えなしで残っていないか確認 |
| 4 | 「なぜ必要か」が「何をするか」より先に書かれている | 段落順を入れ替える |
| 5 | phase-12.md にドラフトがある場合、そのドラフト本文との **逐語一致 or 句読点レベルの軽微差** に収まっている | drift があれば phase-12.md ドラフトに戻す |

**Part 1 専門用語セルフチェック**（書き終えたら以下を確認）:

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| バケット（R2 bucket） | 「クラウド上の大きなフォルダ」 |
| バインディング | 「Cloudflare のサーバーが使うための接続口」 |
| プレサインド URL | 「期限付きの特別な閲覧リンク」 |
| ステージング環境 | 「本番公開前の試し打ち環境」 |
| スキーマ | 「データの入れ物の設計図」 |

チェック手順: Part 1 本文を通読し、上記のような専門用語が説明なしで使われていないか確認する。使われていた場合は括弧書きで日常語を補う。

**Part 2（技術者レベル）の必須要件**:

- インターフェース/型定義（TypeScript）を含める
- APIシグネチャと使用例を記載
- エラーハンドリングとエッジケースを説明
- 設定可能なパラメータと定数を一覧化

---

## Task 2: システム仕様更新【4サブステップ + 条件付きStep 2】

| Step     | 必須 | 内容                                                                                                          |
| -------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| Step 1-A | ✅   | タスク完了記録（「完了タスク」セクション追加 + 関連ドキュメントリンク + 変更履歴 + LOGS.md×2 + topic-map.md） |
| Step 1-B | ✅   | 実装状況テーブル更新(実装完了:「未実装」→「完了」 / 仕様書作成のみ: `spec_created`)                         |
| Step 1-C | ✅   | 関連タスクテーブル更新（仕様書内の「関連タスク」「未タスク候補」テーブルのステータス更新）                    |
| Step 1-H | 条件 | `skill-feedback-report.md` の各 item を owning skill/reference/lesson/no-op に routing し、promotion target / no-op reason / evidence path を記録 |
| Step 2   | 条件 | システム仕様更新（新規インターフェース追加時のみ）                                                            |

> **⚠️ Task 1（実装ガイド作成）との境界に注意**
>
> | 活動                             | Task 1（実装ガイド） | Task 2（仕様更新） |
> | -------------------------------- | -------------------- | ------------------ |
> | Part 1/2 実装ガイド作成          | ✅ メイン責務        | ❌ 対象外          |
> | aiworkflow-requirements 仕様更新 | ❌ 対象外            | ✅ Step 2          |
> | タスク完了記録（仕様書内）       | ❌ 対象外            | ✅ Step 1-A 必須   |
> | LOGS.md更新（2ファイル）         | ❌ 対象外            | ✅ Step 1-A 必須   |

**Step 2 更新が必要な場合**:

- 新規インターフェース/型の追加
- 既存インターフェースの変更
- 新規定数/設定値の追加
- API仕様の変更
- public response が不変でも、back-fill / CPU budget / retryable error / owner boundary / DB 実スキーマ差分吸収が入る場合

### design-spec タスクの dual canonical（markdown 論理正本 + TS ランタイム正本）登録ルール

design-spec タスクで論理正本（例: `docs/_design/<topic>-spec.md`）と TS / コードランタイム正本（例: `apps/api/src/...`）を分離する場合、`system-spec-update-summary.md` の current canonical set には **両方を必ず列挙**する（片側のみは drift の温床）。Phase 11 NON_VISUAL evidence には、両正本間の参照を確認する `rg` cross-reference 検索結果と、TS 側 schema test（zod parse / type guard 等）の実行ログの **双方** を含める。両者が同一契約を説明していることを `phase12-task-spec-compliance-check.md` で明示する。

### LOGS / generated index / artifacts parity の実測ルール

Phase 12 の Step 1-A で `LOGS.md` や `topic-map.md` を機械的に N/A にしない。現行 skill が fragment 化されている場合は次のように判定する。

| 対象 | 実体がある場合 | 実体がない / 生成物の場合 |
| --- | --- | --- |
| `LOGS.md` | 直接 append し、changelog に記録する | `LOGS/` fragment、`LOGS/_legacy.md`、または workflow-local changelog のどれに記録したかを `system-spec-update-summary.md` に明記する |
| `topic-map.md` / `keywords.json` | 手編集せず、正本更新後に generator を実行する | generator が存在しない場合のみ N/A。存在する場合は実行コマンドと結果を `phase12-task-spec-compliance-check.md` に残す |
| root / outputs `artifacts.json` parity | 両方ある場合は内容と status を同期する | `outputs/artifacts.json` が存在しない workflow では、root ledger が唯一正本であることを compliance check に明記する |

#### `outputs/artifacts.json` 不在ケースの compliance-check 文言テンプレ（必須・逐語コピー可）

`outputs/artifacts.json` が存在しないワークフローでは、`phase12-task-spec-compliance-check.md` の parity セクションに **以下の文言を必ず記述**する（誤記・PASS 断言の取り違え防止 / 2026-04-30 ut-06b 由来）:

> `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

- 「`outputs/artifacts.json` 不在 = 監査スキップ」と書かないこと（root 単独正本の宣言として明示する）。
- 「両方存在しないので N/A」とも書かないこと（root は必ず存在する）。
- 「parity = 両者同期確認」というテンプレ文言を残したまま `outputs/` 不在ケースに流用しないこと。

**Step 2 更新が不要な場合**:

- 内部実装の詳細変更のみ
- リファクタリング（インターフェース不変）
- バグ修正（仕様変更なし）

#### Step 2 N/A 判定例（記載必須テンプレ）

> 由来: UT-04 D1 データスキーマ設計 skill-feedback-report に基づく追加（2026-04-29）。`phase-12-pitfalls.md` の「Step 2 必要性判定の記録漏れ」を回避するため、N/A 判定時も以下 3 項目で根拠を明記する。

```markdown
## Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

理由:

- 本タスクは <スコープ（例: D1 schema 設計 / governance docs / runbook 整備）> のみ。TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規追加なし**。
- <既存参照仕様（例: `references/database-schema.md`）> に正本があり、本タスクはそこを参照する <種別（例: spec_created / docs-only / governance）> である。
- <派生作業（例: DDL→Zod 自動派生 / API handler 実装）> は別タスク（<タスク参照: 例 `task-ut-04-shared-zod-codegen.md` / UT-09 実装フェーズ>）でスコープ化済み。本 Phase 12 ではスコープ外。

> Step 2 を **N/A 判定の根拠付きで明記** しておくことで、phase-12-pitfalls.md「Step 2 必要性判定の記録漏れ」を回避する。
```

### Phase 13 承認ゲート付き NON_VISUAL implementation

外部サービスの不可逆 API 操作（GitHub branch protection PUT など）を Phase 13 のユーザー承認後に実行する implementation / NON_VISUAL task では、Phase 12 は「実装完了」ではなく `spec_created` close-out として扱う。

| 項目 | Phase 12 での扱い |
| --- | --- |
| workflow status | `spec_created` を維持し、`completed` / `applied` に上げない |
| 実行 JSON | payload / current / applied の予約パスは作ってよいが、fresh runtime evidence と区別する |
| system spec Step 2 | 適用後 GET など外部状態の正本証跡がない場合、最終状態反映は別 unassigned-task に分離する |
| AC evidence | spec evidence と runtime evidence を分け、`blocked_until_user_approval` を成功証跡にしない |


### `spec_created` UI task の Phase 12 close-out ルール

`spec_created` ステータスの UI task でも Phase 12 実行時は Step 1-A〜1-C を N/A にせず same-wave sync で閉じる。

### Phase 12 close-out hardening（2026-04-30）

Phase 12 の system spec update は classification-first で対象を選ぶ。責務が違う場合は semantic filename で新規 family file / artifact inventory を作り、旧 filename / 旧 path がある場合は `legacy-ordinal-family-register.md` を同一 wave で更新する。

Step 2 は新規 API 追加だけでなく、stale contract withdrawal、internal write-target replacement、security / data boundary hardening でも発火する。Implementation spec-to-skill sync は implementation-guide current facts、system-spec-update-summary、skill-feedback-report routing、変更した skill reference / asset、mirror diff / N/A evidence が同じ implemented contract を説明している状態を指す。PASS は成果物の実体、validator 実測、same-wave sync 証跡が揃った後にだけ記録する。

同一 wave の必須同期先: current canonical set、artifact inventory、parent docs、task-workflow、lessons-learned、LOGS、topic-map、quick-reference、resource-map。mirror は存在する場合のみ sync し、`diff -qr` で確認する。

| Step     | `spec_created` での扱い                                                   |
| -------- | ------------------------------------------------------------------------- |
| Step 1-A | 完了タスク記録 + LOGS.md x2 + SKILL.md x2 + topic-map を same-wave で更新 |
| Step 1-B | 実装状況テーブルに `spec_created` を記録（`completed` ではない）          |
| Step 1-C | 関連タスクテーブルのステータスを current facts へ更新                     |
| Step 1-D | 上流 runbook 差分追記タイミング判定（same-wave / Wave N+1 / baseline 留置）を `runbook-diff-plan.md` で確定 |
| Step 2   | 新規インターフェース追加がなければ N/A（ただし下記の再判定ルールを確認）  |

> 設計タスク全体が次 Wave で実装される場合は IMPL 派生フローを適用する。詳細: [phase-template-phase12.md](phase-template-phase12.md) §設計タスク特有 / [unassigned-task-workflow-integration.md](unassigned-task-workflow-integration.md)。

#### CLOSED Issue を reopen せず仕様作成のみで履歴を完結させる場合（governance / 再構築タスク向け）

`spec_created` で対象 Issue が既に CLOSED の場合、Issue ライフサイクルと仕様作成行為を **意図的に切り離す**選択肢が取れる。

- **採用条件**: governance / 既存方針の追認 / docs-only 再構築のように、Issue が要求する作業は完了済 or 不要で、仕様書として履歴を残すこと自体が目的のとき。
- **必須記録**:
  - `index.md` の Decision Log に「Issue を reopen せず仕様作成のみで履歴を完結させる」根拠を 1 段落明記
  - Issue 側へは PR / 仕様書リンクを comment で残す（双方向リンクは維持）
  - `task-workflow-completed.md` / Step 1-A の同波更新は通常通り実施
- **やってはいけないこと**: Issue 側を無言のまま放置する／reopen 判断を曖昧にする／spec を残さず close-out 扱いにする。
- 適用例: UT-GOV-002（pull_request_target safety gate dry-run, 2026-04-29）。

### legacy stub 配置のデフォルトルール（unassigned-task → 新 workflow 昇格時）

旧 `docs/30-workflows/unassigned-task/<LEGACY-NAME>.md` が新規 workflow dir（例: `docs/30-workflows/<canonical-name>/`）へ昇格する際、legacy stub の配置と参照記述を以下の **3 ステップ** で固定する（2026-04-30 ut-06b 由来 / 判断分岐の運用ドリフト防止）:

**ステップ 1: 配置場所のデフォルト**

- **デフォルト配置**: `docs/30-workflows/completed-tasks/<LEGACY-NAME>.md`
- legacy stub 冒頭に `## Canonical Status` 見出しを置き、canonical workflow root への **絶対参照**（`docs/30-workflows/<canonical-name>/index.md`）を明記する。
- 相対参照（`../<canonical-name>/...`）は禁止（移動・rename 時に壊れる）。

**ステップ 2: canonical state が `spec_created` の場合の追加併記**

canonical workflow の `metadata.workflow_state` が `spec_created`（実装未着手）の場合、legacy stub の `## Canonical Status` 直下に以下の文言を **必ず併記**する:

> Current canonical state is `spec_created`; do not treat as completed evidence.

- これにより、`completed-tasks/` 配下にあっても「実装証跡として読まれる」誤認を防ぐ。
- canonical state が `completed` / `applied` に昇格した時点で本注記は撤去してよい（同一 wave で行う）。

**ステップ 3: legacy → canonical mapping を register に登録**

- aiworkflow-requirements skill の `references/legacy-ordinal-family-register.md` に **legacy name → canonical name** の mapping エントリを必ず追加する。
- mapping エントリには「legacy path / canonical path / 昇格日 / canonical state」の 4 項目を最低限含める。
- 同一 wave で SKILL.md changelog にも legacy 昇格を記録する（mapping の正本は register、運用ログは changelog）。

**Phase 12 チェックリスト（legacy stub がある場合の追加項目）**

| # | チェック項目 | 配置 |
| --- | --- | --- |
| L1 | legacy stub が `docs/30-workflows/completed-tasks/<LEGACY-NAME>.md` に存在する | `phase12-task-spec-compliance-check.md` |
| L2 | `## Canonical Status` に canonical absolute path が書かれている | 同上 |
| L3 | canonical state が `spec_created` なら警告文言が併記されている | 同上 |
| L4 | `legacy-ordinal-family-register.md` に mapping が登録されている | `system-spec-update-summary.md` |

### docs-only task に後からコード実装が入った場合の再判定ルール

当初 docs-only / `spec_created` だった task に後から code 変更が入った場合:

1. **Step 2 再判定**: source workflow と `outputs/phase-12/*.md` を同一ターンで current facts へ戻す
2. **Screenshot 再判定**: `N/A` / `NON_VISUAL` だった Phase 11 evidence の reclassification を検討する
3. **新規未タスク 0 件固定より current gap formalize を優先**: code wave で生じた gap は即座に未タスク化する

---

## Task 4: 未タスク検出（0件でも出力必須）

| ソース                   | 確認項目                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| 元タスク仕様書           | 「スコープ外」として明示された項目                                                          |
| Phase 3/10レビュー結果   | MINOR判定の指摘事項                                                                         |
| Phase 11手動テスト       | スコープ外の発見事項・改善提案                                                              |
| コードコメント           | TODO/FIXME/HACK/XXX                                                                         |
| `describe.skip` ブロック | 削除したtestid/要素名が旧参照として残存していないか（残存時はcleanupタスクをbacklogに登録） |

```bash
# 未タスク検出スクリプト
node scripts/detect-unassigned-tasks.js --scan packages/shared/src --output .tmp/unassigned-candidates.json
```

> **未タスクテンプレ必須セクション（4 種）**: 「苦戦箇所【記入必須】」「リスクと対策」「検証方法」「スコープ（含む/含まない）」を必ず含める。詳細は [unassigned-task-required-sections.md](unassigned-task-required-sections.md) 参照。<!-- TODO(F-1): SKILL.md は 500 行超過のため、本本体への詳細展開は F-1 タスクで分割対応する。 -->

📖 [phase-11-12-guide.md](phase-11-12-guide.md)
📖 [spec-update-workflow.md](spec-update-workflow.md)
📖 [unassigned-task-required-sections.md](unassigned-task-required-sections.md)
📖 [../agents/generate-unassigned-task.md](../agents/generate-unassigned-task.md)

## Phase 12 SubAgent 実行ルール

Phase 12 の監査は並列化してよいが、編集は単一 owner が直列に適用する。

| レーン | 目的 | 編集可否 | 完了条件 |
| --- | --- | --- | --- |
| A | Phase 12 成果物 / artifacts parity 監査 | 禁止 | 7 outputs、root/outputs `artifacts.json` parity、status 表記差異を報告 |
| B | system spec / index / LOGS / lessons 監査 | 禁止 | current canonical set、artifact inventory、topic-map 再生成対象、500行超過リスクを報告 |
| C | skill feedback / skill update 監査 | 禁止 | 更新対象 skill、asset/reference 候補、AskUserQuestion 制約を報告 |
| owner | 編集適用 | 可 | SubAgent 結果を統合し、同一ファイル編集を直列化 |
| validator | 最終検証 | 禁止 | `generate-index.js`、`validate-structure.js`、mirror sync、`diff -qr` を実測記録 |

`phase12-task-spec-compliance-check.md` の `PASS` は、成果物の実体・validator 実測値・same-wave sync 証跡が揃った後にのみ許可する。存在しない監査スクリプト名を根拠にしてはならない。

### Skill feedback promotion gate

Phase 12 の `skill-feedback-report.md` に再発防止が記録された場合、同一 wave で次のどちらかを必ず決める。

| 判定 | 必須アクション |
| --- | --- |
| Promote | 該当 skill の `SKILL.md` / `references/` / `assets/` / `LOGS` のいずれかへ反映し、更新先を `system-spec-update-summary.md` に記録する |
| Defer | `docs/30-workflows/unassigned-task/` に formalize し、`unassigned-task-detection.md` に status / path / 根拠を記録する |
| Reject | なぜ現行 skill へ反映しないかを `skill-feedback-report.md` に明記する |

スキル更新監査を SubAgent へ委譲する場合は read-only とし、編集 owner が結果を統合する。監査出力には、更新対象 skill、追記候補 reference、テンプレート整合性リスク、新規 skill 要否、編集候補ファイルを含める。

## 変更履歴

| Version       | Date           | Changes                                                                                                                                                                                                     |
| ------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v10.09.47** | **2026-04-27** | **UT-06 Phase 12 review hardening**: 本番不可逆操作 task の docs-only template 完了を本番完了と誤認しないルール、placeholder screenshot を実証跡として扱わないルール、実行前ブロッカー（OpenNext topology / API smoke endpoint）を Phase 12 未タスクへ昇格するルールを「よくある漏れ」表へ UBM-009/010/011 として追記。 |
| **v10.09.46** | **2026-04-27** | **SKILL.md 500行制限対応（529行→499行）**: 変更履歴の古い2エントリ（v10.09.41/42）・古いFeedback群（W0-RV-001・SC-13-1/2・UBM-001〜005）・重複「よく使うコマンド」テーブルを削除し合計30行削減。 |
| **v10.09.44** | **2026-04-26** | **05a-parallel-observability-and-cost-guardrails Phase 12 close-out 反映**: Phase 12 実行時によくある漏れ表に UBM-005（root/outputs `artifacts.json` 二重 ledger 同期漏れ）と UBM-006（Pages/Workers topology drift の未タスク formalize 漏れ、`task-{cat}-...-NNN.md` 命名と `docs/30-workflows/unassigned-task/` 配置）を追記。 |
| **v10.09.43** | **2026-04-26** | **02-serial-monorepo-runtime-foundation close-out hardening**: Phase 12 implementation guide Part 1/2 補正、Phase 11 NON_VISUAL docs-only validator 対応、`index.md` / Phase 11 link checklist / system spec summary の stale 状態同期。 |

> 詳細履歴: [../SKILL-changelog.md](../SKILL-changelog.md) / [../LOGS.md](../LOGS.md)

### Task 5: スキルフィードバックレポート（改善点なしでも出力必須）

| 観点             | 記録内容                               |
| ---------------- | -------------------------------------- |
| テンプレート改善 | Phaseテンプレートの漏れや曖昧さ        |
| ワークフロー改善 | 機械検証や手順分岐の改善余地           |
| ドキュメント改善 | 再利用しやすい横断ガイドライン化の候補 |

出力:

- `outputs/phase-12/skill-feedback-report.md`
