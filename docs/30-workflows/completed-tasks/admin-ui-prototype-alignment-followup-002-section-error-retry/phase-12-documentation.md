---
phase: 12
title: Compliance check — canonical 9 headings
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 12: Compliance check（中学生レベル概念説明込み）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 12 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

Compliance checkの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-12-documentation.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

---


## 1. なぜ Phase 12 が必要か（中学生レベル説明）

仕様書に「ここを直す」「ここを確認する」と書いても、実際に書いた人がうっかり書き忘れたり、別の言葉で書いてしまうと、後でレビューする人や CI（自動チェック機械）が「ちゃんと書いてあるか」を判別できない。Phase 12 は「決まった見出しが全部そろっているか」を機械でチェックするためのページ。先生が「宿題は表紙・名前・本文の 3 つがそろっているか確認するよ」と言うのと同じ仕組み。

Phase 12 は **「Phase 11 evidence と Phase 1-10 内容の照合」を CI で機械化** する gate。

## 2. canonical 9 headings（task-specification-creator 標準）

本ファイルは Phase 12 の standard 9 headings に準拠する:

1. 目的
2. 適用範囲
3. 検証ルール
4. 実行コマンド
5. 失敗時の対応
6. 例外規定
7. 監査ログ
8. 関連ドキュメント
9. SSOT 宣言

## 3. 目的

Phase 11 で定義した evidence inventory（5 entry）が物理存在し、`artifacts.json` が gate-metadata zod schema を通過していることを CI で機械検証する。これにより本タスクの DoD（Phase 8 AC-1〜AC-12）が evidence 裏付き状態で満たされる。

## 4. 適用範囲

| 範囲 | 内容 |
|------|------|
| 対象ディレクトリ | `docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/phase-11/` |
| 対象 evidence | Phase 11 §2 の 5 件（main.md / evidence-inventory.md / unit-test-result.md / axe-result.md / grep-use-client-result.md） |
| 対象 schema | 本 workflow `artifacts.json`（gate-metadata） |
| 対象 gate | `verify-phase12-compliance` / `verify-gate-metadata` |
| 対象 parent | parent `admin-ui-prototype-alignment/outputs/phase-10/final-review.md` deferred 解消整合 |

## 5. 検証ルール

| Rule | 内容 | 検証 |
|------|------|------|
| R-01 | Phase 11 inventory 表の全 5 path が物理存在 | evidence existence validator |
| R-02 | 各ファイルのサイズ > 0 | 同上 |
| R-03 | `artifacts.json` が zod schema を満たす（`status` enum / `passed_at` ISO 8601 / `evidence_path` 相対パス） | `gate-metadata:validate` |
| R-04 | `artifacts.json.gates[].evidence_path` が R-01 の存在チェックリスト or 仕様書ファイル群に含まれる | gate-metadata:validate |
| R-05 | 本ファイルに canonical 9 headings（§2 リスト）が存在 | `verify-phase12-compliance` |
| R-06 | workflow root の `index.md` と Phase 1 の参照整合 | `verify-phase12-compliance` |
| R-07 | 既存 unassigned-task spec ファイルが残置されている（本タスクで削除していない） | 手動 + `ls` |

## 6. 実行コマンド

```bash
WF=docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry
mise exec -- pnpm verify:phase12-compliance 2>&1 | tee "$WF/outputs/phase-11/verify-phase12-compliance.log"
mise exec -- pnpm gate-metadata:validate
```

## 7. 失敗時の対応

| 失敗パターン | 原因 | 対応 |
|------------|------|-----|
| evidence path 不在 | コマンド未実行 / 配置漏れ | Phase 10 §3 を再実行し配置 |
| ファイルサイズ 0 | コマンド失敗 → 空ログ | エラー解決後に再生成 |
| artifacts.json schema violation | enum / datetime 形式違反 | 本仕様 `artifacts.json` の例に揃える |
| canonical 9 headings 不足 | 見出し漏れ | 本ファイル §2 の 9 headings を全配置 |
| evidence_path drift | path 表記揺れ | workflow root 相対に統一 |
| 既存 unassigned-task spec 不在 | 誤って削除 | git restore で復元 |

参照: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 8. 例外規定

- 本タスクは `visualEvidence: NON_VISUAL` のため、visual / runtime screenshot 系 evidence は **適用外**
- 認証後画面の runtime 描画 evidence は本タスクスコープ外（UI primitive 拡張のみのため）

## 9. 監査ログ

`outputs/phase-11/verify-phase12-compliance.log` に exit code と検証結果が出力される。`artifacts.json` の `passed_at` が ISO 8601 で監査タイムスタンプとして残る。

## 10. 関連ドキュメント

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `.github/workflows/verify-phase12-compliance.yml`
- `.github/workflows/verify-gate-metadata.yml`
- `scripts/verify-pr-ready.sh`
- parent: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md`
- 既存 spec ソース: `docs/30-workflows/completed-tasks/unassigned-task/admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta.md`

## 11. SSOT 宣言

本 Phase 12 ファイルが、本タスクの Phase 11 evidence と Phase 8 DoD の **compliance に関する SSOT** である。`artifacts.json` の内容が本ファイルの検証ルール R-01..R-07 と矛盾する場合、本ファイルが優先する。

## 12. canonical 9 headings 自己診断表

| heading | 本ファイル内 §番号 | 存在 |
|---------|--------------------|------|
| 目的 | §3 | ✅ |
| 適用範囲 | §4 | ✅ |
| 検証ルール | §5 | ✅ |
| 実行コマンド | §6 | ✅ |
| 失敗時の対応 | §7 | ✅ |
| 例外規定 | §8 | ✅ |
| 監査ログ | §9 | ✅ |
| 関連ドキュメント | §10 | ✅ |
| SSOT 宣言 | §11 | ✅ |
