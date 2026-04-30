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

### `spec_created` UI task の Phase 12 close-out ルール

`spec_created` ステータスの UI task でも Phase 12 実行時は Step 1-A〜1-C を N/A にせず same-wave sync で閉じる。

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
