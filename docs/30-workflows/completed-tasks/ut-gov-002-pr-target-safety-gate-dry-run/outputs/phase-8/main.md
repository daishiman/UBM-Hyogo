# Phase 8 — リファクタリング（main）

## Status

spec_created

## 0. 目的

Phase 1〜7 で生成した **dry-run specification / runbook** 群を before / after で見直し、以下を達成する。

- canonical 4 用語（`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`）の表記揺れゼロ化
- 重複記述の正本／参照分離（特に `permissions: {}` / `persist-credentials: false` の三重明記方針 AC-5）
- 章立て・参照リンクの正規化
- docs-only / NON_VISUAL ポリシーに沿った図表の最小化（Markdown table 限定）

本 Phase はドキュメントリファクタに閉じ、コード変更・dry-run 実走は伴わない（AC-8）。

## 1. 入力

| 種別 | 入力 | 用途 |
| --- | --- | --- |
| 仕様 | `docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-08.md` | 完了条件・実行タスクの正本 |
| 設計母本 | `outputs/phase-1/main.md` §3（命名 canonical） | 用語整合チェックの基準 |
| 設計母本 | `outputs/phase-2/design.md` §2 / §3 / §4 / §5 | 重複削減の対象（runbook と重複する箇所の正本） |
| 設計レビュー | `outputs/phase-3/review.md` §6（用語整合チェック表） | Phase 3 時点の整合状態 |
| テスト設計 | `outputs/phase-4/test-matrix.md` | 用語反映先 |
| 実装ランブック | `outputs/phase-5/runbook.md` | 重複削減の対象（design.md 参照に置換） |
| **失敗ケース** | `outputs/phase-6/failure-cases.md` | FC-1〜FC-8 の用語整合確認入力 |
| **カバレッジ** | `outputs/phase-7/coverage.md` | AC-1〜AC-9 / 観点 coverage の入力（Phase 9 へ橋渡し） |

> 本 Phase は **Phase 6 / Phase 7 の最終出力を入力として参照** する。Phase 4-7 の更新内容は本 main.md / before-after.md の検査手順で逐次取り込む。

## 2. 実行内容（before / after サマリ）

詳細な差分表は `before-after.md` に記録する。本節は方針サマリのみ。

### 2.1 用語整合（canonical 4 用語）

- 対象用語: `pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`
- 検査コマンド（手順）:

```bash
# canonical 4 用語の使用箇所を抽出
grep -RnE 'pull_request_target safety gate|triage workflow|untrusted build workflow|pwn request pattern' \
  docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/

# 揺れ表記候補（NG パターン）の検出
grep -RniE 'PR target gate|safety-gate workflow|untrusted job|PR-target safety|pwn-request' \
  docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/
```

- 確認結果: Phase 3 review.md §6 の整合表を本 Phase で再点検し、phase-NN.md / outputs/phase-N/ 配下の全 .md に対して **canonical 4 用語の表記揺れゼロ** を確認した。

### 2.2 重複削減（正本／参照の役割分担）

| 重複項目 | 正本 | 参照側（diff 削減） |
| --- | --- | --- |
| `permissions: {}` ＋ job 単位昇格 | `outputs/phase-2/design.md` §2.1 / §2.2 | `outputs/phase-5/runbook.md` は要点のみ記述し design.md §2.1 / §2.2 へリンク |
| `persist-credentials: false` 全 checkout 強制 | `outputs/phase-2/design.md` §2.1 / §2.2 / §3 | `outputs/phase-5/runbook.md` / `outputs/phase-9/quality-gate.md` は AC-5 の三重明記要件のため再掲を維持（要件由来の重複は許容） |
| ロールバック設計（単一 revert コミット粒度） | `outputs/phase-2/design.md` §5 | `outputs/phase-5/runbook.md` / `outputs/phase-10/go-no-go.md` は AC-9 の三重明記要件のため再掲を維持 |
| "pwn request" 非該当 5 箇条 | `outputs/phase-2/design.md` §4 | `outputs/phase-3/review.md` §3 は検証手段列を加える形で差分化、`outputs/phase-9/quality-gate.md` は確認結果のみ記録 |

> AC-5 / AC-9 のように受入条件が **三重明記** を要求する箇所は、重複ではなく要件由来の意図的再掲として維持する。意図しない重複（design.md と runbook.md の workflow 構造説明など）のみ正本／参照分離を適用する。

### 2.3 章構成の標準化（7 章固定）

phase-NN.md は以下の 7 章固定で逸脱なきことを確認。

1. メタ情報
2. 目的
3. 実行タスク
4. 参照資料
5. 成果物
6. 統合テスト連携
7. 完了条件

逸脱検出手順:

```bash
for f in docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/phase-*.md; do
  echo "=== $f ==="
  grep -E '^## ' "$f"
done
```

### 2.4 図表の最小化（NON_VISUAL）

- Mermaid / 画像埋め込みは使用しない方針を再確認。
- 表現は Markdown table と箇条書きのみ。
- 検査: `grep -RnE '^\`\`\`mermaid|!\[' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` の結果が 0 件であること。

### 2.5 参照リンクの正規化

- 内部リンクは `docs/30-workflows/...` から相対で記述。
- 外部 URL は GitHub Security Lab / GitHub Docs に限定（学習リンクの混入禁止）。
- 検査:

```bash
# 内部 .md リンク列挙
grep -RnE '\]\(.*\.md[^)]*\)' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/

# 許可外の外部 URL 検出
grep -RnE 'https?://' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/ \
  | grep -vE 'securitylab\.github\.com|docs\.github\.com|github\.com/[^/]+/[^/]+/(blob|tree)'
```

### 2.6 dry-run 用語の語義点検

`dry-run` / `dry-run specification` / `dry-run runbook` の三者を以下の語義に統一する。

- `dry-run`: 後続実装タスクが実走する **検証行為そのもの**（本タスク非対象）
- `dry-run specification`: 本タスクが整備する **仕様書**（Phase 1〜13 の成果物）
- `dry-run runbook`: Phase 5 の `runbook.md`（実装手順書）

実走と仕様策定が混在する記述（例: "dry-run を実施する" → "dry-run specification を策定する"）を before-after.md で個別に修正記録する。

## 3. 修正サマリ（チェックリスト）

- [x] canonical 4 用語の表記揺れチェック手順を定義し、表記揺れゼロを確認
- [x] 重複削減の正本／参照分離方針を確定（AC-5 / AC-9 由来の意図的再掲は維持）
- [x] 章構成 7 章固定の検出手順を定義
- [x] 図表最小化（Mermaid / 画像 0 件）の検査手順を定義
- [x] 参照リンクの正規化方針を確定
- [x] dry-run 用語の語義点検方針を確定
- [x] Phase 6 failure-cases.md / Phase 7 coverage.md を入力として参照する旨を明示

## 4. 統合テスト連携

リファクタは docs 内に閉じる。挙動を変える変更ではないため、Phase 9 quality-gate では **G-5（用語整合）／ G-6（リンク切れ）** 観点で本 Phase 出力を再検証する。

## 5. 完了条件チェック（Phase 8）

- [x] before-after.md にリファクタ前後の差分が記録されている
- [x] 用語整合チェック手順と結果が記録され、4 用語の表記揺れゼロを確認した旨を含む
- [x] 重複削減方針（正本 / 参照の役割分担）が記録されている
- [x] 章構成（7 章）の検証手順が定義されている
- [x] リンク切れ抽出手順が記述されている
- [x] Phase 6 / Phase 7 の最終出力を入力として参照する旨が main.md に明示されている
- [x] commit / push / PR 作成は行わない

## 6. 次 Phase への引き継ぎ

Phase 9 は本 main.md / before-after.md の整合結果を入力として、`outputs/phase-9/quality-gate.md` で AC-1〜AC-9 / G-1〜G-7 の最終評価を行う。
