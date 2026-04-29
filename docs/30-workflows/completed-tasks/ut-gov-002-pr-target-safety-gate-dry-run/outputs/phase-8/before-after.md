# Phase 8 — Before / After 差分記録

## 0. 凡例

- **対象**: 修正対象の箇所（path / 章節 / 表現）
- **Before**: リファクタ前の表現・構造
- **After**: リファクタ後の表現・構造
- **理由**: なぜ修正したか（用語整合 / 重複削減 / 章構成 / リンク正規化 / 語義点検 のいずれか）

## 1. 用語整合（canonical 4 用語）

Phase 1 §3 で固定した 4 用語に対する表記揺れを点検し、以下の修正を確定した。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| phase-NN.md / outputs 全般 | "PR target gate" / "PR-target safety gate" | `pull_request_target safety gate` | 用語整合（canonical 統一） |
| phase-NN.md / outputs 全般 | "safety-gate workflow" / "triage-only workflow" | `triage workflow` | 用語整合 |
| phase-NN.md / outputs 全般 | "untrusted job" / "PR build job" | `untrusted build workflow` | 用語整合 |
| phase-NN.md / outputs 全般 | "pwn-request" / "pwn pattern" | `pwn request pattern` | 用語整合 |

確認手順（Phase 8 main.md §2.1 と同一コマンド）を実行し、揺れ表記の検出件数が **0 件** であることを記録する。

## 2. 重複削減（正本／参照分離）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `permissions: {}` ＋ job 単位昇格の説明 | design.md §2.1 / §2.2 と runbook.md §X に同等の解説が二重化 | runbook.md は要点のみ記述し design.md §2.1 / §2.2 へリンク参照 | 重複削減（正本 = design.md） |
| ロールバック設計の手順説明 | design.md §5 と runbook.md / go-no-go.md に手順詳細が散在 | 正本を design.md §5 とし、runbook.md と go-no-go.md は AC-9 三重明記要件のための **要点再掲** に整理 | 重複削減＋要件由来再掲の維持 |
| `persist-credentials: false` 強制方針 | 4 箇所以上で全文重複 | 正本 = design.md。runbook.md / quality-gate.md は AC-5 三重明記要件のため再掲を維持。それ以外は参照リンクへ置換 | 重複削減＋要件由来再掲の維持 |
| "pwn request" 非該当 5 箇条 | design.md §4 と review.md §3 で全文重複 | review.md §3 は検証手段列を加えた差分テーブルへ整理 | 重複削減（差分化） |

> AC-5（permissions / persist-credentials の三重明記）/ AC-9（ロールバックの三重明記）は受入条件由来の意図的再掲として維持する。

## 3. 章構成（7 章固定）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| phase-01.md 〜 phase-13.md | 一部 phase で章順が前後 / 章名表記が "##成果物" 形式 | 7 章固定（メタ情報 / 目的 / 実行タスク / 参照資料 / 成果物 / 統合テスト連携 / 完了条件）の順序・表記に統一 | 章構成標準化 |

検出コマンド: Phase 8 main.md §2.3 のとおり。実行結果は Phase 11 のリンクチェック工程で再検証する。

## 4. 図表の最小化（NON_VISUAL）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 全 .md | （Mermaid / 画像なしを継続） | Markdown table と箇条書きのみ | NON_VISUAL ポリシー再確認 |

検出コマンド: `grep -RnE '^\`\`\`mermaid|!\[' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/` で 0 件であること。

## 5. 参照リンクの正規化

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 内部リンク | 一部で `../../...` 形式の相対リンクが混在 | `docs/30-workflows/...` 起点の表記に統一 | 参照リンク正規化 |
| 外部 URL | 学習系・blog 系の URL が混入する余地あり | GitHub Security Lab / GitHub Docs / GitHub 内部 URL のみに限定 | 出典の信頼性確保 |

## 6. dry-run 用語の語義点検

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 各 phase / outputs | "dry-run を実施する" のような実走と仕様策定が混在する表現 | "dry-run specification を策定する" / "dry-run runbook に記述する" / "dry-run（実走）は後続実装タスク" のいずれかに分離 | 語義の三分化（dry-run / dry-run specification / dry-run runbook） |
| Phase 5 runbook.md | "dry-run を runbook に書く" 等の二義的表現 | "dry-run specification を runbook に記述する" | 語義点検 |
| Phase 11 manual-smoke-log.md | "dry-run smoke を実走する" の表現 | "dry-run specification の整合確認（手動 smoke は docs リンクチェックに限る）" | docs-only スコープ準拠 |

## 7. リンク切れ抽出手順（Phase 11 で実走）

```bash
# 内部 .md リンクをすべて列挙
grep -RnoE '\]\(([^)]+\.md)(#[^)]+)?\)' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/

# 列挙結果から実在を確認するスクリプト雛形（Phase 11 で実走）
grep -RnoE '\]\(([^)]+\.md)' docs/30-workflows/ut-gov-002-pr-target-safety-gate-dry-run/ \
  | awk -F'](' '{print $2}' | sed 's/).*//' | sort -u \
  | while read -r p; do test -f "$p" || echo "BROKEN: $p"; done
```

## 8. 修正サマリ（行ベース）

- canonical 4 用語の表記揺れを 0 件に収束
- 三重明記要件（AC-5 / AC-9）以外の重複を正本／参照分離で削減
- phase-NN.md の章構成を 7 章固定で整列
- Mermaid / 画像が 0 件であることを再確認
- 内部リンクを `docs/30-workflows/...` 起点へ統一
- 外部 URL を GitHub Security Lab / GitHub Docs のみに限定
- dry-run / dry-run specification / dry-run runbook の語義を三分化
- Phase 6 failure-cases.md / Phase 7 coverage.md を入力として参照することを明示
