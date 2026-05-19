---
phase: 12
title: Phase 12 compliance check
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 12 — compliance check

[実装区分: 実装仕様書]

> Phase 12 は中学生にも分かるレベルの概念説明（Part 1）と、エンジニア向け詳細（Part 2）の 2 部構成で記述する。

## Part 1 — 中学生にも分かる説明

### この作業は何を直したの？

ウェブサイトを開いたときに、もし画面が壊れて「エラー画面」が出てしまうと、目の不自由な人がスクリーンリーダー（画面を読み上げる機械）を使って状況を理解しようとします。

このとき、いままでの作りでは「読み上げの開始位置が画面のあちこちに散らばっていて、エラーが起きたことに気付くまでに時間がかかる」という問題がありました。

そこで今回、エラー画面が出た瞬間に「画面を表示できませんでした」という見出しに **自動的にカーソル（focus）を移動** させるようにしました。これで、画面リーダーは一番伝えたいメッセージを最初に読み上げてくれます。

### どうやって直したの？

- React の `useRef` という機能を使って、見出し（h1 タグ）の場所を覚えておく
- エラーが起きたとき、`useEffect` という機能でその見出しに focus を当てる
- ページがガクっとスクロールしないように `preventScroll: true` を指定する

変更したのはたった **4 行のコード** と、それをテストする **1 個のテストファイル** だけです。

## Part 2 — 技術者向け詳細

### 必須 6 アウトプット存在チェック

| # | アウトプット | path | 存在 |
|---|------------|------|------|
| 1 | 実装ガイド | `phase-05-implementation-guide.md` | ✓（本 workflow root 内） |
| 2 | システム仕様書更新 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` | present |
| 4 | 未タスク検出レポート | `outputs/phase-12/unassigned-task-detection.md` | present |
| 5 | スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | present |
| 6 | コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

### CONST_005 必須項目チェック

| 項目 | 反映先 |
|------|--------|
| 変更対象ファイル一覧 | Phase 3 §3 / Phase 5 §1 |
| 関数・型・モジュールのシグネチャ | Phase 4 §1-§5 |
| 入力・出力・副作用 | Phase 4 §3-§4 |
| テスト方針 | Phase 6 全体 |
| ローカル実行コマンド | Phase 10 §1 |
| DoD | Phase 8 全体 |

すべて充足。

### CONST_007 適合宣言

未タスク先送り 0 件。差分 4 行 + 1 test ファイル + docs Phase 1-13 のみで 1 サイクル完結。

### state vocabulary

実装完了後: `implemented_local_evidence_captured`（本 workflow root の `index.md` / `artifacts.json` メタ）。
Phase 13 の commit / push / PR は `blocked_pending_user_approval` のまま保持する。

### 整合性 gate

| gate | 確認 |
|------|------|
| spec 内 path の実在 | Phase 5 §1 の 2 path は実装サイクル後に存在する |
| source spec 整合 | `ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` と差分量 / DoD が一致 |
| canonical 9 heading | 本ファイルは Phase 12 compliance check の標準テンプレに準拠 |

### skill feedback 観点（テンプレート）

| 観点 | 内容 |
|------|------|
| テンプレ改善 | 4 行差分タスクで Phase 1-13 をフル展開する場合の簡略化テンプレ提案（in-place spec.md → Phase 1-13 昇格運用パターン） |
| ワークフロー改善 | source spec で `canonical_workflow: null` 指定されたタスクをユーザー指示で昇格する経路の整理 |
| ドキュメント改善 | 特記事項なし |

> 上記は仕様書時点での観測。実装完了後 `outputs/phase-12/skill-feedback-report.md` で確定する。
