---
name: task-specification-creator
description: |
  タスクを単一責務原則で分解しPhase 1-13の実行可能な仕様書を生成。Phase 12は中学生レベル概念説明を含む。
  Anchors:
  • Clean Code / 適用: SRP / 目的: タスク分解基準
  • Continuous Delivery / 適用: フェーズゲート / 目的: 品質パイプライン
  • DDD / 適用: ユビキタス言語 / 目的: 用語統一
  Trigger:
  タスク仕様書作成, タスク分解, ワークフロー設計, Phase実行, インテグレーション設計, ワークフローパッケージ, Cloudflare Workers, Web API設計, 外部連携パッケージ
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# Task Specification Creator

開発タスクを Phase 1〜13 の実行可能な仕様書へ落とし込む。`SKILL.md` は入口だけを持ち、詳細は `references/` と `LOGS/`（fragment 群、旧 `LOGS.md` は `LOGS/_legacy.md` に退避済み）に分離する。

## 設計原則

| 原則                      | 説明                                                        |
| ------------------------- | ----------------------------------------------------------- |
| Script First              | 決定論的処理は `scripts/` で固定する                        |
| LLM for Judgment          | 判断、設計、レビューだけを LLM が担う                       |
| Progressive Disclosure    | 必要な reference だけを段階的に読む                         |
| 1 File = 1 Responsibility | 大きくなった guide は family file へ分離する                |
| `.claude` Canonical       | 正本は `.claude/skills/...`、`.agents/skills/...` は mirror |

## 要件レビュー思考法

要件草案や設計草案を扱うときは、機能列挙のレビューで止めず、次の3系統を必ず通す。

- システム系: システム思考、因果関係分析、因果ループ、依存関係、責務境界、状態所有権
- 戦略・価値系: 価値提案、戦略的思考、why、トレードオン、プラスサム、価値とコストの均衡
- 問題解決系: 改善思考、仮説思考、論点思考、KJ法、優先順位付け

特に workflow / lane / UI統合 / runtime orchestration / verify 導入を含むタスクでは、次を明示してから Phase 1 へ進む。

1. 真の論点は何か
2. 依存関係・責務境界の問題点は何か
3. 価値とコストの不均衡箇所はどこか
4. 改善優先順位はどうあるべきか
5. 4条件の評価はどうか

### 真の論点の掘り方

- 現象ではなく主問題を1文で固定する。
- 1つの提案に複数案件が混ざっていないかを切り分ける。
- `what` / `how` だけでなく `why now` / `why this way` を仮説として書く。

### 因果と境界の確認

- 強化ループとバランスループを最低1本ずつ書く。
- 実行状態、phase 遷移、verify fail 後の意思決定権がどこにあるかを明記する。
- `Facade` / `Engine` / `Service` / `Bridge` / `Store` / `UI` の状態所有権を混在させない。

### 価値とコストの見方

- 初回スコープで得る価値と、導入コストが最も大きい部品を分けて書く。
- 将来拡張を初回価値と混同しない。
- verify / session persistence / UI統合のような高コスト項目は、初期層と将来層を分離する。

### 4条件の評価

`4条件` は原則として次で評価する。

- 価値性: 誰のどのコストをどれだけ下げるかが定義されているか
- 実現性: 初回スコープで実装可能な厚みに収まっているか
- 整合性: 責務境界、依存関係、状態所有権が矛盾なく閉じているか
- 運用性: 導入後の verify、resume、spec sync、監査運用が破綻しないか

要件レビュー出力では、上の5項目を一次結論として先に示し、その後に補足として因果ループ、KJ法クラスタ、戦略仮説を足す。

## タスクタイプ判定フロー（docs-only / NON_VISUAL）

タスク作成前に下記フローで **taskType** と **visualEvidence** を確定させる。Phase 1 記録 → artifacts.json 生成まで一貫して使う。

```
タスクにコード変更が含まれる?
├─ YES → taskType: "implementation"
│         visualEvidence: UI変更を伴う? "VISUAL" : "NON_VISUAL"
└─ NO  → タスクはドキュメント/設計のみ?
          ├─ YES → taskType: "docs-only"
          │         visualEvidence: "NON_VISUAL"
          │         Phase 11: screenshot 不要 / main.md + manual-smoke-log.md + link-checklist.md の3点のみ
          └─ NO  → 再確認（スコープが未確定）
```

**判定後のルール**:
- `docs-only` / `spec_created` のタスクは Phase 11 でスクリーンショットを作らない
- `screenshots/` ディレクトリを作成しない（`.gitkeep` も不要）
- `artifacts.json` の `metadata.visualEvidence` に必ず明記する（省略すると screenshot 要求側に倒れる）

---

## クイックスタート

| モード              | 用途                               | 最初に読むもの                                                                           |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `create`            | 新規 workflow を作る               | [references/create-workflow.md](references/create-workflow.md)                           |
| `execute`           | Phase 1〜13 を順番に実行する       | [references/execute-workflow.md](references/execute-workflow.md)                         |
| `update`            | 既存仕様書を修正する               | [references/phase-templates.md](references/phase-templates.md)                           |
| `detect-unassigned` | Phase 12 の残課題を formalize する | [references/phase-12-documentation-guide.md](references/phase-12-documentation-guide.md) |

```bash
node scripts/detect-mode.js --request "{{USER_REQUEST}}"
```

## 実行フロー

### create

1. `agents/decompose-task.md` で責務を分解する。
2. `agents/identify-scope.md` で前提、制約、受入条件を固定する。
   **[Feedback 1 対応]** Phase 1（要件定義）でタスク分類（UI task / docs-only task）を明示的に記録し、`artifacts.json` の artifact 命名 canonical 一覧を task root 生成時に先に確定させること。後回しにすると artifact 命名ドリフトが発生する。
3. `agents/design-phases.md` と `agents/generate-task-specs.md` で `index.md` と `phase-*.md` を作る。
4. `agents/output-phase-files.md` と `agents/update-dependencies.md` で `artifacts.json` を整える。
5. `agents/verify-specs.md`、`scripts/validate-phase-output.js`、`scripts/verify-all-specs.js` で gate を通す。

### execute

| Phase | 名称             | 目的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | 要件定義         | scope、受入条件、inventory を固定する。**既存コードの命名規則（camelCase / kebab-case 等）を分析し記録する**。**[FB-UI-02-2]** 全件 `pnpm test` が SIGKILL 終了するリスクがある場合は、targeted run ファイルリストを Phase 1 で事前列挙する（たとえば、メモリ制約が厳しい環境では vitest の対象ファイル指定が必須となる）。**[carry-over確認]** 前タスクの成果物（`git log --oneline -5` で確認）を棚卸しし、今タスクの新規作業との差異を明確化すること                                                                  |
| 2     | 設計             | topology、SubAgent lane、validation path を設計する。**[FB-SDK-07-1]** 「既存コンポーネント再利用可否」を必ず確認する。新規 UI 実装ゼロで品質・アクセシビリティ・HIG準拠を既存レベルで担保できる場合は再利用を優先する                                                                                                                                                                                                                                                                                                   |
| 3     | 設計レビュー     | Phase 4 へ進めるかを判定する                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4     | テスト作成       | command suite と expected result を作る。**TDD Red 前に、テストパターンが Phase 1-3 で確認した命名規則と整合しているかを検証する**。**[Feedback P0-09-U1]** private method のテストは `(facade as unknown as FacadePrivate)` キャストまたは public callback 経由を使う方針を Phase 4 仕様書に明記する。**[FB-MSO-002]** テスト実行前に依存関係整合（`pnpm install` + `pnpm --filter @repo/shared build`）を確認する。esbuild darwin バイナリ mismatch は worktree 直後に多発するため、Phase 4 開始前チェックを必須とする |
| 5     | 実装             | `.claude` 正本を更新し、mirror を同期する。**[Feedback RT-03]** 実装計画に「新規作成」「修正」ファイルパス一覧を必須記載する（見落とし防止）。**[Feedback P0-09-U1]** `improve()` フローで SDK callback が不適用な場合（`llmAdapter.sendChat()` 経由など）は「canUseTool 適用可能範囲と制約」を仕様書に明記する                                                                                                                                                                                                          |
| 6     | テスト拡充       | fail path、回帰 guard、補助 command を追加する                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7     | カバレッジ確認   | concern と dependency edge の coverage を可視化する                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 8     | リファクタリング | duplicate と navigation drift を削る。**[Feedback RT-03]** 変更内容を `対象/Before/After/理由` テーブル形式で記録する                                                                                                                                                                                                                                                                                                                                                                                                    |
| 9     | 品質保証         | line budget、link、mirror parity を一括判定する                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 10    | 最終レビュー     | acceptance criteria と blocker を判定する                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 11    | 手動テスト       | 3層評価（Semantic / Visual / AI UX）を実行し、フィードバックループで HIGH 問題を `unassigned-task/` へ自動生成する。shared path alias 系は build config と test config の parity を同時確認する。**[FB-MSO-003]** 画面証跡取得スクリプトには `try { ... } finally { browser.close(); server.close(); }` パターンを標準化し、ポート解放を確実にする                                                                                                                                                                       |
| 12    | ドキュメント更新 | implementation guide、spec sync、未タスク、feedback を完了する                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 13    | PR作成           | user の明示承認後のみ実施する                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Task仕様ナビ

| Task                     | 責務                       | パターン | 入力             | 出力                  |
| ------------------------ | -------------------------- | -------- | ---------------- | --------------------- |
| decompose-task           | タスクを単一責務に分解     | seq      | ユーザー要求     | タスク分解リスト      |
| identify-scope           | スコープ・前提・制約を定義 | seq      | タスク分解リスト | スコープ定義          |
| design-phases            | Phase構成を設計            | seq      | スコープ定義     | フェーズ設計書        |
| generate-task-specs      | タスク仕様書を生成         | seq      | フェーズ設計書   | タスク仕様書一覧      |
| output-phase-files       | 個別Markdownファイルを出力 | par      | タスク仕様書一覧 | phase-\*.md           |
| update-dependencies      | Phase間の依存関係を設定    | par      | タスク仕様書一覧 | 依存関係マップ        |
| verify-specs             | 全13仕様書の品質検証       | seq      | 検証レポート     | PASS/FAIL判定         |
| update-system-specs      | システム仕様書を更新       | seq      | 実装サマリー     | 更新完了チェック      |
| generate-unassigned-task | 未完了タスク指示書を生成   | cond     | レビュー課題     | unassigned-task/\*.md |

凡例: `seq`=順次実行, `par`=並列実行, `cond`=条件分岐

---

## Phase 12 重要仕様

### 必須タスク（5タスク - 全て完了必須）

| Task | 名称                             | 必須 | 詳細参照                                    |
| ---- | -------------------------------- | ---- | ------------------------------------------- |
| 1    | 実装ガイド作成（2パート構成）    | ✅   | 下記参照                                    |
| 2    | システム仕様書更新（2ステップ）  | ✅   | 下記参照                                    |
| 3    | ドキュメント更新履歴作成         | ✅   | scripts/generate-documentation-changelog.js |
| 4    | 未タスク検出レポート作成         | ✅   | **0件でも出力必須**                         |
| 5    | スキルフィードバックレポート作成 | ✅   | **改善点なしでも出力必須**                  |

---

### Task 1: 実装ガイドの2パート構成

| パート     | 対象読者                 | 内容                                       |
| ---------- | ------------------------ | ------------------------------------------ |
| **Part 1** | **初学者・中学生レベル** | **概念説明（日常の例え話、専門用語なし）** |
| **Part 2** | **開発者・技術者**       | **技術的詳細（スキーマ・API・コード例）**  |

**Part 1（中学生レベル）の必須要件**:

- 日常生活での例え話を**必ず**含める
- 専門用語は使わない（使う場合は即座に説明）
- 「なぜ必要か」を先に説明してから「何をするか」を説明

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

### Task 2: システム仕様更新【4サブステップ + 条件付きStep 2】

| Step     | 必須 | 内容                                                                                                          |
| -------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| Step 1-A | ✅   | タスク完了記録（「完了タスク」セクション追加 + 関連ドキュメントリンク + 変更履歴 + LOGS fragment ×2（aiworkflow-requirements / task-specification-creator）+ topic-map.md） |
| Step 1-B | ✅   | 実装状況テーブル更新（実装完了:「未実装」→「完了」 / 仕様書作成のみ: `spec_created`）                         |
| Step 1-C | ✅   | 関連タスクテーブル更新（仕様書内の「関連タスク」「未タスク候補」テーブルのステータス更新）                    |
| Step 2   | 条件 | システム仕様更新（新規インターフェース追加時のみ）                                                            |

> **⚠️ Task 1（実装ガイド作成）との境界に注意**
>
> | 活動                             | Task 1（実装ガイド） | Task 2（仕様更新） |
> | -------------------------------- | -------------------- | ------------------ |
> | Part 1/2 実装ガイド作成          | ✅ メイン責務        | ❌ 対象外          |
> | aiworkflow-requirements 仕様更新 | ❌ 対象外            | ✅ Step 2          |
> | タスク完了記録（仕様書内）       | ❌ 対象外            | ✅ Step 1-A 必須   |
> | LOGS fragment ×2 作成（2 skill） | ❌ 対象外            | ✅ Step 1-A 必須   |

**Step 2 更新が必要な場合**:

- 新規インターフェース/型の追加
- 既存インターフェースの変更
- 新規定数/設定値の追加
- API仕様の変更

**Step 2 更新が不要な場合**:

- 内部実装の詳細変更のみ
- リファクタリング（インターフェース不変）
- バグ修正（仕様変更なし）

#### `spec_created` UI task の Phase 12 close-out ルール

`spec_created` ステータスの UI task でも Phase 12 実行時は Step 1-A〜1-C を N/A にせず same-wave sync で閉じる。

| Step     | `spec_created` での扱い                                                   |
| -------- | ------------------------------------------------------------------------- |
| Step 1-A | 完了タスク記録 + LOGS fragment ×2 + SKILL.md ×2 + topic-map を same-wave で更新（fragment は `pnpm skill:logs:append` 経由）|
| Step 1-B | 実装状況テーブルに `spec_created` を記録（`completed` ではない）          |
| Step 1-C | 関連タスクテーブルのステータスを current facts へ更新                     |
| Step 1-D | 上流 runbook 差分追記タイミング判定（same-wave / Wave N+1 / baseline 留置）を `runbook-diff-plan.md` で確定 |
| Step 2   | 新規インターフェース追加がなければ N/A（ただし下記の再判定ルールを確認）  |

> 設計タスク全体が次 Wave で実装される場合は IMPL 派生フローを適用する。詳細: [phase-template-phase12.md](references/phase-template-phase12.md) §設計タスク特有 / [unassigned-task-workflow-integration.md](references/unassigned-task-workflow-integration.md)。

#### docs-only task に後からコード実装が入った場合の再判定ルール

当初 docs-only / `spec_created` だった task に後から code 変更が入った場合:

1. **Step 2 再判定**: source workflow と `outputs/phase-12/*.md` を同一ターンで current facts へ戻す
2. **Screenshot 再判定**: `N/A` / `NON_VISUAL` だった Phase 11 evidence の reclassification を検討する
3. **新規未タスク 0 件固定より current gap formalize を優先**: code wave で生じた gap は即座に未タスク化する

---

### Task 4: 未タスク検出（0件でも出力必須）

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

> **未タスクテンプレ必須セクション（4 種）**: 「苦戦箇所【記入必須】」「リスクと対策」「検証方法」「スコープ（含む/含まない）」を必ず含める。詳細は [references/unassigned-task-required-sections.md](references/unassigned-task-required-sections.md) 参照。<!-- TODO(F-1): SKILL.md は 500 行超過のため、本本体への詳細展開は F-1 タスクで分割対応する。 -->

📖 [references/phase-11-12-guide.md](references/phase-11-12-guide.md)
📖 [references/spec-update-workflow.md](references/spec-update-workflow.md)
📖 [references/unassigned-task-required-sections.md](references/unassigned-task-required-sections.md)
📖 [agents/generate-unassigned-task.md](agents/generate-unassigned-task.md)

## 変更履歴

| Version       | Date           | Changes                                                                                                                                                                                                     |
| ------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v10.09.47** | **2026-04-27** | **UT-06 Phase 12 review hardening**: 本番不可逆操作 task の docs-only template 完了を本番完了と誤認しないルール、placeholder screenshot を実証跡として扱わないルール、実行前ブロッカー（OpenNext topology / API smoke endpoint）を Phase 12 未タスクへ昇格するルールを「よくある漏れ」表へ UBM-009/010/011 として追記。 |
| **v10.09.46** | **2026-04-27** | **SKILL.md 500行制限対応（529行→499行）**: 変更履歴の古い2エントリ（v10.09.41/42）・古いFeedback群（W0-RV-001・SC-13-1/2・UBM-001〜005）・重複「よく使うコマンド」テーブルを削除し合計30行削減。 |
| **v10.09.44** | **2026-04-26** | **05a-parallel-observability-and-cost-guardrails Phase 12 close-out 反映**: Phase 12 実行時によくある漏れ表に UBM-005（root/outputs `artifacts.json` 二重 ledger 同期漏れ）と UBM-006（Pages/Workers topology drift の未タスク formalize 漏れ、`task-{cat}-...-NNN.md` 命名と `docs/30-workflows/unassigned-task/` 配置）を追記。 |
| **v10.09.43** | **2026-04-26** | **02-serial-monorepo-runtime-foundation close-out hardening**: Phase 12 implementation guide Part 1/2 補正、Phase 11 NON_VISUAL docs-only validator 対応、`index.md` / Phase 11 link checklist / system spec summary の stale 状態同期。 |

> 詳細履歴: [changelog/](changelog/)（旧 `SKILL-changelog.md` は `changelog/_legacy.md` に退避）/ [LOGS/](LOGS/)（旧 `LOGS.md` は `LOGS/_legacy.md` に退避）/ 集約は `pnpm skill:logs:render --skill task-specification-creator [--include-legacy]`

### Task 5: スキルフィードバックレポート（改善点なしでも出力必須）

| 観点             | 記録内容                               |
| ---------------- | -------------------------------------- |
| テンプレート改善 | Phaseテンプレートの漏れや曖昧さ        |
| ワークフロー改善 | 機械検証や手順分岐の改善余地           |
| ドキュメント改善 | 再利用しやすい横断ガイドライン化の候補 |

出力:

- `outputs/phase-12/skill-feedback-report.md`

---

### Phase 12 実行時によくある漏れ

| 漏れパターン                                                                                                                                                         | 防止方法                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1-C（関連タスクテーブル）を未実行                                                                                                                               | spec-update-workflow.md の「確認すべきファイル」表を実行前に必ず読む                                                                                                                                                                                                       |
| topic-map.md 未更新                                                                                                                                                  | 仕様書に新規セクション追加時は必ず topic-map.md のエントリも追加                                                                                                                                                                                                           |
| documentation-changelog.md が不完全                                                                                                                                  | 全Step（1-A/1-B/1-C/Step 2）の結果を個別に明記する（「該当なし」も記録）                                                                                                                                                                                                   |
| `system-spec-update-summary.md` を未作成で完了扱い                                                                                                                   | Phase 12成果物一覧と `outputs/phase-12/` 実体を1対1で突合し、不足ファイルは完了前に作成する                                                                                                                                                                                |
| LOGS fragment が片方の skill にしか作成されていない                                                                                                                                          | 必ず aiworkflow-requirements/LOGS/ と task-specification-creator/LOGS/ の両方に新規 fragment を `pnpm skill:logs:append` で作成                                                                                                                                                                                          |
| 完了タスクセクションが簡略形式                                                                                                                                       | spec-update-workflow.md のテンプレート（テスト結果サマリー + 成果物テーブル）に従う                                                                                                                                                                                        |
| `artifacts.json` と `outputs/artifacts.json` が不一致                                                                                                                | Phase 12完了前に2ファイルを同期し、completed成果物の参照切れを0件にする                                                                                                                                                                                                    |
| 設計タスクの workflow root を `completed` にしてしまう                                                                                                               | workflow root は `implementation_ready`、completed ledger は `spec_created` に分離する                                                                                                                                                                                     |
| Phase 10 MINOR指摘を未タスク化せず進行                                                                                                                               | **Phase 10レビュー前に** unassigned-task-guidelines.md を読み、MINOR判定→未タスク化ルールを確認                                                                                                                                                                            |
| 未タスク検出レポートで0件判定のまま未修正                                                                                                                            | Phase 10 MINOR指摘は必ず未タスク化の対象。「機能に影響なし」は不要判定の理由にならない                                                                                                                                                                                     |
| `task-workflow.md` の未タスクリンクが参照切れ                                                                                                                        | Step 1-E後に `verify-unassigned-links.js` を実行して `ALL_LINKS_EXIST` を確認する                                                                                                                                                                                          |
| **[Feedback 2]** Phase 12 着手時に `outputs/artifacts.json` と phase spec の artifact 名が照合されない                                                               | Phase 12 の **最初の作業**として `outputs/artifacts.json` と各 `phase-*.md` に記載されたartifact名を1対1で突合し、不一致があれば着手前に修正する                                                                                                                           |
| **[Feedback 3]** Phase 11 の UI task / docs-only task 判定がずれる                                                                                                   | Phase 1 で記録したタスク分類（UI task / docs-only task）を Phase 11 着手時に必ず参照する。分類が変わっていた場合は再判定を明示する                                                                                                                                         |
| **[Feedback W0-01]** shared 型追加で root `@repo/shared` に再エクスポートすると `SkillCategory` が衝突する                                                           | 新しい共有型は subpath export（例: `@repo/shared/types/skillCreator`）に閉じ、既存 root barrel は触らない。`phase-12-docs.md` と system spec の両方で公開経路を明記する                                                                                                    |
| **[Feedback P0-09-U1-1]** Phase 4 仕様書に private method テスト方針が未記載                                                                                         | `(facade as unknown as FacadePrivate)` キャストと public callback 経由テストの2択を Phase 4 仕様書に必ず明記する                                                                                                                                                           |
| **[Feedback P0-09-U1-2]** `improve()` フローの canUseTool 配線先（SDK callback vs `applyImprovement()`）が仕様書から読み取れない                                     | Phase 5 仕様書のタスク2に「canUseTool 適用可能範囲と制約」セクションを設け、`llmAdapter.sendChat()` 経由時は SDK callback 非適用と明記する                                                                                                                                 |
| **[Feedback BEFORE-QUIT-001]** Phase 11 が非 visual task なのに実地操作を要求してしまう                                                                              | Phase 11 では「実地操作不可」を明記し、自動テスト結果 + 既知制限リストを代替記録として残す                                                                                                                                                                                 |
| **[Feedback BEFORE-QUIT-002]** Phase 7 coverage が全ファイル一律指定だと局所検証の意図がぼやける                                                                     | Phase 7 では coverage の対象範囲を明示し、変更したファイル/ブロック以外を対象外として書く                                                                                                                                                                                  |
| **[Feedback BEFORE-QUIT-003]** Phase 12 の system-spec update で workflow-local と global sync が混在する                                                            | `documentation-changelog.md` で workflow-local 同期と global skill sync を別ブロックで記録する                                                                                                                                                                             |
| **[Feedback 4]** Phase 11 NON_VISUAL のとき manual-test-result.md の証跡メタが薄い                                                                                   | Phase 11 が NON_VISUAL の場合、`manual-test-result.md` のメタ情報に「証跡の主ソース（自動テスト名/件数）」と「スクリーンショットを作らない理由」を明記する。空メタでは reviewer が意図を読み取れない                                                                       |
| **[Feedback 5]** Phase 7 の coverage 目標が広域指定のとき変更行の保護確認が曖昧になる                                                                                | Phase 7 のカバレッジ目標が「全体 X%」など広域指定のとき、変更した関数/ブロックの line カバレッジと branch カバレッジの実測値を証跡に残す（例: `applyWorkflowSnapshot` 付近の line 100% / branch 100%）                                                                     |
| **[Feedback 6]** ViewType を追加した際に navigation 契約・store 型・既存テストの3点更新が漏れる                                                                      | `store/types.ts`（ViewType union）/ `skillLifecycleJourney.ts`（正規化関数・定数）/ renderView テスト を same-wave で更新し、`ui-ux-navigation.md` の ViewType テーブルも同時同期する。Phase 1 設計メモに「追加 ViewType: XYZ」を明示しておくと漏れが防げる                |
| **[FB-UI-02-1]** Phase 9 QA で「ファイル削除」を PASS 基準にすると stub 化タスクが FAIL 扱いになる                                                                   | Phase 9 の削除確認は「git delete されている OR `export {}` stub 化かつ live import ゼロのいずれか」を PASS とする。たとえば、廃止ファイルを stub 化した場合は `grep -rn "import.*廃止ファイル名" src/` でゼロ件を証跡に残す                                                |
| **[Feedback TASK-UI-04]** 実装完了後に `artifacts.json` status が `spec_created` / `in_progress` のまま放置される                                                    | 実装 Phase（Phase 5 or 最終実装 Phase）完了時に `complete-phase.js` を必ず実行し、status を `completed` に更新する。実装完了と仕様書ステータス更新は同一 wave で行う（後回しは乖離蓄積の主因）。有効値: `spec_created` / `in_progress` / `completed` / `phase12_completed` |
| **[Feedback W1-02b-1]** UI task の `screenshot-plan.json` が `mode: "NON_VISUAL"` のまま Phase 11 を迎えやすい                                                       | UI コンポーネント変更タスクでは `screenshot-plan.json` 生成時に `mode: "VISUAL"` をデフォルトにする。`phase11-capture-metadata.json` の `taskId` が現行タスク ID と一致するか Phase 11 着手前に確認する（`jq '.taskId' outputs/phase-11/phase11-capture-metadata.json`）   |
| **[Feedback W1-02b-2]** multi-step wizard 設計で「ステップ間の state ownership と引き渡し項目」が Phase 2 設計書に未記載                                             | Phase 2（設計）でウィザード / マルチステップ UI を設計する場合、「ステップ間 state 引き渡しテーブル」を必須セクションとして設ける。`smartDefaults` など推論値の反映タイミング（初回のみ / 都度上書き / ユーザー優先）は decision 欄で固定する                              |
| **[Feedback W1-02b-3]** `implementation-guide.md` の callback 名・props 名が実装と一致していない（identifier drift）                                                 | Phase 12 Task 12-6 で `implementation-guide.md` 内の識別子を現行コードで `grep` 確認する。スニペットは型定義・props interface から引用し、手書き snippets を避ける                                                                                                         |
| **[Feedback W1-02b-4]** renderer UI コンポーネントで node-only パッケージを直接 import し、Vite browser bundle が runtime error になる                               | renderer コンポーネントでは node-only パッケージ（`node-cron` 等）を直接 import しない。cron/schedule 検証は browser-safe ユーティリティに切り出す。Phase 11 capture 前に「ブラウザで実際に route を開く smoke test」を必須にする                                          |
| **[UBM-009]** 本番不可逆操作 task で docs-only template 整備を「本番完了」と誤読する | Phase 5 / Phase 11 が NOT EXECUTED の場合、index / artifacts / go-nogo は `docs-ready-execution-blocked` 等の状態にし、実デプロイ完了・本番稼働・下流解放を示す文言を使わない |
| **[UBM-010]** `capture-pending.png` 等の placeholder を Phase 11 screenshot evidence として扱う | PNG の存在だけで PASS にせず、実寸・内容・本番 URL・撮影日時・scenario ID を確認する。placeholder は `NOT EXECUTED` evidence として明記し、実 screenshot 必須タスクでは blocker にする |
| **[UBM-011]** smoke docs が未実装 endpoint（例: `/health/db`）を前提にする | Phase 12 で API 実装と smoke endpoint を突合し、未実装なら実行前ブロッカーまたは未タスクへ昇格する。docs 側の期待 JSON と実装の response shape も同時に確認する |
| **[UBM-012]** 本番デプロイ実行で `wrangler` 直接呼び出し / `wrangler login` ローカル OAuth が混入する | 実行前ブロッカー。Phase 5 / Phase 12 で deploy 系コマンド (`wrangler deploy` / `wrangler d1 ...` 等) を検出したら必ず `scripts/cf.sh` ラッパーへ強制集約する。`~/Library/Preferences/.wrangler/config/default.toml` 由来の OAuth トークンは禁止し、`.env` の `op://` 参照と `op run --env-file=.env` 経由の `CLOUDFLARE_API_TOKEN` 注入に一本化する。CLAUDE.md「Cloudflare 系 CLI 実行ルール」と整合させること |
| **[UBM-013]** Next.js 16 / Turbopack の worktree root 誤検出により別 worktree の `packages/*` が型チェック対象になる | `apps/web` を含むタスクでは `next.config.ts` に `outputFileTracingRoot` と `turbopack.root` を明示する（worktree 直下の絶対パス）。明示しないと親リポや別 worktree の `packages/shared/src/zod/*` が collected され、関係のない型エラーで build が落ちる。緊急回避で `typescript.ignoreBuildErrors = true` を入れる場合は Phase 12 で別 tsc gate（`pnpm typecheck` 単体）を必ずペアリングし、同 PR 内で解除予定を changelog に明記する |

> 旧フィードバック（W0-RV-001・SC-13-1/2・UBM-001〜008・FB-SDK-07-2/4）は [changelog/_legacy.md](changelog/_legacy.md)（旧 `SKILL-changelog.md`）に移動済み。


### Phase 12 苦戦防止Tips

> UT-STORE-HOOKS-COMPONENT-MIGRATION-001の経験に基づく（2026-02-12）

| Tips                                                     | 説明                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **事前に空欄チェックリストを作成**                       | documentation-changelog.mdにStep 1-A〜1-D + Step 2の各欄を空欄で事前作成し、逐次消化する                                                                                                                                                                             |
| **spec-update-workflow.mdを常に参照**                    | Phase 12開始時に必ず [spec-update-workflow.md](references/spec-update-workflow.md) を開き、チェックリストを確認                                                                                                                                                      |
| **「全Step確認前に完了と記載しない」厳守**               | P4パターン。全Stepの結果を個別に記録してから「Phase 12完了」とする                                                                                                                                                                                                   |
| **LOGS fragment ×2 + SKILL.md ×2 を更新**                     | aiworkflow-requirements/LOGS/<fragment>.md, task-specification-creator/LOGS/<fragment>.md, aiworkflow-requirements/SKILL.md, task-specification-creator/SKILL.md（fragment は `pnpm skill:logs:append` 経由で生成）                                                                                                                           |
| **topic-map.md再生成はセクション変更時も**               | 新規追加だけでなく、セクション更新・削除時も `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` と `node .claude/skills/task-specification-creator/scripts/generate-index.js --workflow docs/30-workflows/{{FEATURE_NAME}} --regenerate` を実行 |
| **worktree環境でも `.claude` 正本を実更新する**          | worktree を理由に LOGS fragment / SKILL.md / backlog / workflow の更新を先送りしない。fragment は worktree-local に作成しても conflict しない（命名に nonce + escapedBranch 含む）。`.agents/skills/` は `rsync` / `diff` で mirror parity を確認する                                                                                                                    |
| **並列エージェント完了後はファイルシステムで検証**       | P43/P59対策。エージェントがコンテキスト制限で応答不能になった場合、`git diff --stat` + `ls outputs/phase-*/` + `artifacts.json` のPhaseステータスで成果物の存在を確認する                                                                                            |
| **NON_VISUAL判定時は `screenshots/.gitkeep` を削除する** | `screenshots/` ディレクトリが空（PNG 0件）のまま残るとvalidator errorになる。NON_VISUAL判定で実スクリーンショットが不要な場合は `screenshots/.gitkeep` を削除してディレクトリごと除外する                                                                            |
| **worktree作成後は `pnpm install` を確認する**           | `esbuild` host/binary version drift により Vitest 起動前に停止することがある。worktree作成後は必ず `pnpm install` を実行してバイナリの整合を確保する                                                                                                                 |

---

## 重要ルール

### Phase完了時の必須アクション

1. **タスク完全実行**: Phase内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json更新**: `complete-phase.js` でPhase完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

### PR作成に関する注意

**PR作成は自動実行しない。必ずユーザーの明示的な許可を得てから実行すること。**

📖 [references/commands.md](references/commands.md) - コマンド一覧

## agent 導線

- [agents/decompose-task.md](agents/decompose-task.md)
- [agents/identify-scope.md](agents/identify-scope.md)
- [agents/design-phases.md](agents/design-phases.md)
- [agents/generate-task-specs.md](agents/generate-task-specs.md)
- [agents/output-phase-files.md](agents/output-phase-files.md)
- [agents/update-dependencies.md](agents/update-dependencies.md)
- [agents/verify-specs.md](agents/verify-specs.md)
- [agents/update-system-specs.md](agents/update-system-specs.md)
- [agents/generate-unassigned-task.md](agents/generate-unassigned-task.md)

## Phase 12 と Phase 13 の境界

| Task      | 完了条件                                                                                                              | 詳細                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Task 12-1 | `implementation-guide.md` が Part 1/2 を満たす                                                                        | [references/phase-12-documentation-guide.md](references/phase-12-documentation-guide.md)   |
| Task 12-2 | Step 1 と Step 2 の判定が記録される                                                                                   | [references/spec-update-workflow.md](references/spec-update-workflow.md)                   |
| Task 12-3 | `documentation-changelog.md` と artifacts が同期される                                                                | [references/spec-update-validation-matrix.md](references/spec-update-validation-matrix.md) |
| Task 12-4 | 0件でも `unassigned-task-detection.md` を出し、`current/baseline` を分離して記録する                                  | [references/unassigned-task-guidelines.md](references/unassigned-task-guidelines.md)       |
| Task 12-5 | 改善点なしでも `skill-feedback-report.md` を出し、`phase12-task-spec-compliance-check.md` を root evidence として残す | [references/patterns-phase12-sync.md](references/patterns-phase12-sync.md)                 |
| Phase 13  | commit と PR は user の明示承認後だけ                                                                                 | [references/review-gate-criteria.md](references/review-gate-criteria.md)                   |

UI/UX 実装を含む task では Phase 11 で screenshot と Apple UI/UX 視覚検証を行う。手順は [references/phase-11-screenshot-guide.md](references/phase-11-screenshot-guide.md) と [references/screenshot-verification-procedure.md](references/screenshot-verification-procedure.md) を使う。

NON_VISUAL タスク（API repository / library / config / boundary tooling など）で staging 未配備や実フロー前提が成立しない場合は、Phase 11 の代替 evidence プレイブックを使う: [references/phase-11-non-visual-alternative-evidence.md](references/phase-11-non-visual-alternative-evidence.md)。L1 型 / L2 lint-boundary / L3 in-memory test / L4 意図的 violation の 4 階層と「代替 evidence 差分表」で何を保証し何を保証できないかを明示する。

## リソース導線

### core workflow

- [references/resource-map.md](references/resource-map.md)
- [references/create-workflow.md](references/create-workflow.md)
- [references/execute-workflow.md](references/execute-workflow.md)
- [references/commands.md](references/commands.md)
- [references/quality-standards.md](references/quality-standards.md)
- [references/coverage-standards.md](references/coverage-standards.md)
- [references/review-gate-criteria.md](references/review-gate-criteria.md)
- [references/artifact-naming-conventions.md](references/artifact-naming-conventions.md)
- [references/evidence-sync-rules.md](references/evidence-sync-rules.md)
- [references/self-improvement-cycle.md](references/self-improvement-cycle.md)

### phase templates

- [references/phase-templates.md](references/phase-templates.md)
- [references/phase-template-core.md](references/phase-template-core.md)
- [references/phase-template-execution.md](references/phase-template-execution.md)
- [references/phase-template-phase11.md](references/phase-template-phase11.md)
- [references/phase-template-phase12.md](references/phase-template-phase12.md)
- [references/phase-template-phase13.md](references/phase-template-phase13.md)

### Phase 11/12 guides

- [references/phase-11-12-guide.md](references/phase-11-12-guide.md)
- [references/phase-11-screenshot-guide.md](references/phase-11-screenshot-guide.md)
- [references/phase-11-non-visual-alternative-evidence.md](references/phase-11-non-visual-alternative-evidence.md)
- [references/phase-12-documentation-guide.md](references/phase-12-documentation-guide.md)
- [references/phase12-checklist-definition.md](references/phase12-checklist-definition.md)
- [references/technical-documentation-guide.md](references/technical-documentation-guide.md)
- [references/screenshot-verification-procedure.md](references/screenshot-verification-procedure.md)
- [assets/phase12-task-spec-compliance-template.md](assets/phase12-task-spec-compliance-template.md)

### spec update

- [references/spec-update-workflow.md](references/spec-update-workflow.md)
- [references/spec-update-step1-completion.md](references/spec-update-step1-completion.md)
- [references/spec-update-step2-domain-sync.md](references/spec-update-step2-domain-sync.md)
- [references/spec-update-validation-matrix.md](references/spec-update-validation-matrix.md)

### pattern family

- [references/patterns.md](references/patterns.md)
- [references/patterns-workflow-generation.md](references/patterns-workflow-generation.md)
- [references/patterns-validation-and-audit.md](references/patterns-validation-and-audit.md)
- [references/patterns-phase12-sync.md](references/patterns-phase12-sync.md)

### logs and archives

- [LOGS/](LOGS/)（旧 `LOGS.md` は `LOGS/_legacy.md` に退避済み）
- [references/logs-archive-index.md](references/logs-archive-index.md)
- [references/logs-archive-2026-march.md](references/logs-archive-2026-march.md)
- [references/logs-archive-2026-feb.md](references/logs-archive-2026-feb.md)
- [references/logs-archive-legacy.md](references/logs-archive-legacy.md)
- [references/changelog-archive.md](references/changelog-archive.md)

## システム観点チェック

| 観点               | aiworkflow-requirements 側の参照先 |
| ------------------ | ---------------------------------- |
| セキュリティ       | `security-*.md`                    |
| UI/UX              | `ui-ux-*.md`                       |
| アーキテクチャ     | `architecture-*.md`                |
| API/IPC            | `api-*.md`                         |
| データ整合性       | `database-*.md`                    |
| エラーハンドリング | `error-handling.md`                |
| インターフェース   | `interfaces-*.md`                  |

Web/API task では Browser、Server (Workers)、外部インテグレーション（packages/integrations/）、Cloudflare バインディングの境界を都度明記する。詳細は [references/quality-standards.md](references/quality-standards.md) を参照。

## 検証コマンド

```bash
node scripts/validate-phase-output.js docs/30-workflows/{{FEATURE_NAME}}
node scripts/verify-all-specs.js --workflow docs/30-workflows/{{FEATURE_NAME}}
node ../skill-creator/scripts/quick_validate.js .claude/skills/task-specification-creator
node ../skill-creator/scripts/validate_all.js .claude/skills/task-specification-creator
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
node scripts/log-usage.js --result success --phase "Phase {{N}}"
```

Phase 12 では追加で `detect-unassigned-tasks.js`、`audit-unassigned-tasks.js`、`verify-unassigned-links.js`、`validate-phase12-implementation-guide.js` を実行する。

## ベストプラクティス

### すべきこと

- 仕様、テスト、実装、検証、同期の順序を崩さない。
- `outputs/phase-N/` を phase ごとに実体化し、`artifacts.json` と同時更新する。
- SubAgent 相当の lane は 3 並列以下に抑え、validation lane は直列で締める。
- detail を増やしたくなったら `references/` へ逃がし、`SKILL.md` は入口に保つ。
- Phase 12 は `implementation-guide`、`system-spec-update-summary`、`documentation-changelog`、`unassigned-task-detection`、`skill-feedback-report` を必ず揃える。
- **[Feedback P0-09-U1-3]** 小規模タスク（Phase 1〜3 で設計が自明）の outputs 必須度は規模（小/中/大）で tier 分けを検討する。ドキュメント作成コストが実装コストを上回るリスクを Phase 1 スコープ固定時に評価する。

### 避けるべきこと

- `.agents` 側だけ先に更新して canonical root を残すこと。
- `outputs/` を後回しにして phase 完了だけ先に付けること。
- `current` と `baseline` の監査結果を混ぜること。
- UI task で screenshot を自動テスト代替として扱うこと。
- user の明示承認なしに commit や PR を作ること。

詳細な履歴と usage log は [LOGS/](LOGS/)（旧 `LOGS.md` → `LOGS/_legacy.md`）、[changelog/](changelog/)（旧 `SKILL-changelog.md` → `changelog/_legacy.md`）、[references/logs-archive-index.md](references/logs-archive-index.md) を参照。集約は `pnpm skill:logs:render --skill task-specification-creator [--include-legacy]`。
