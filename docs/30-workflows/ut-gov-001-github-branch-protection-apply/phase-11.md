# Phase 11: 手動 smoke test（dry-run / apply / rollback リハーサル — 仕様レベル固定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub branch protection apply / rollback payload 正規化（dev / main 実適用） |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（dry-run / apply / rollback リハーサル） |
| 作成日 | 2026-04-28 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL / github_governance |
| user_approval_required | false（Phase 13 の実 PUT 承認とは独立。本 Phase は仕様レベル固定のみ） |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- **taskType: implementation（governance 適用）**
- 判定理由:
  - 本ワークフローは GitHub REST API への PUT / GET 操作と JSON payload 正規化が中心であり、UI / Renderer / 画面遷移は一切発生しない。
  - 実 `gh api PUT` の実走 / snapshot / payload / applied JSON 取得 / rollback リハーサルは **Phase 13 ユーザー承認後** の別オペレーションで実行する。本 Phase 11 では「仕様レベルでの手順固定 + spec walkthrough」までを成果物とする。
  - したがって screenshot は不要。`phase-template-phase11.md` の docs-only / spec_created 代替証跡フォーマット（必須 3 点）を適用する。
- **`outputs/phase-11/screenshots/` ディレクトリは作成しない**（NON_VISUAL のため `.gitkeep` 含め一切作らない）。
- **本 Phase は「実地操作不可」**: 実 GET / 実 PUT / 実 rollback リハーサルは本ワークフローのスコープ外であり、Phase 13 ユーザー承認後に別オペレーションで実走される。本 Phase ではコマンド系列・期待結果・検証手順の仕様レベル固定と spec walkthrough のみを行う。

## 必須 outputs（spec_created Phase 11 代替証跡 3 点）

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | Phase 11 walkthrough のトップ index。NON_VISUAL 代替 evidence プレイブック（L1/L2/L3/L4）の適用結果と「実地操作不可」明示 |
| `outputs/phase-11/manual-smoke-log.md` | dry-run プレビュー → 実適用 → `gh api` GET 実値確認 → CLAUDE.md grep 一致確認 の 4 ステップを **NOT EXECUTED** ステータスで列挙 |
| `outputs/phase-11/link-checklist.md` | 仕様書間の参照リンク健全性チェック（index.md / phase-NN.md / outputs / 親仕様 / design.md） |

## 目的

Phase 1〜10 で固定された設計（lane 1〜5 / payload 正規化 adapter / dev・main 独立 PUT / `enforce_admins=true` 緊急 rollback 経路 / UT-GOV-004 完了前提）に対し、docs-only / NON_VISUAL 代替 evidence プレイブックを適用して spec walkthrough を実施し、以下を確定する。

1. 仕様書の自己完結性（前提・AC-1〜AC-14・成果物パス）が満たされている
2. 4 ステップ手動 smoke（**dry-run プレビュー → 実適用 → `gh api` GET で実値確認 → CLAUDE.md と grep 一致確認**）のコマンド系列が Phase 2 §7 の固定通りに `manual-smoke-log.md` で再現可能な形に展開されている
3. 全リンク（index.md ↔ phase-NN.md ↔ outputs ↔ 親仕様 ↔ design.md）が健全である
4. NON_VISUAL の限界（runtime PUT 応答 / GitHub 実値 drift / `enforce_admins` 詰み再現性）を明示し、保証できない範囲を Phase 12 `unassigned-task-detection.md` 候補として記録する

依存成果物として Phase 2 設計（adapter / 4 ステップ手順 / 9 章 rollback 3 経路）、Phase 3 レビュー（NO-GO ゲート / 4 条件 PASS）を入力する。本 Phase 11 は実走ではなく walkthrough と手順仕様固定に限定する。

## 実行タスク

1. NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）を `outputs/phase-11/main.md` に作成する（完了条件: 4 階層が漏れなく記述）。
2. 4 ステップ手動 smoke のコマンド一覧を `outputs/phase-11/manual-smoke-log.md` に **NOT EXECUTED** ステータスで列挙する（完了条件: Phase 2 §7 のコマンド系列が網羅 + 期待結果 + 担当者）。
3. spec walkthrough を実施し、phase-01〜phase-13 / index.md / artifacts.json / outputs/* / 親仕様 / design.md 間の参照リンクを `outputs/phase-11/link-checklist.md` に記録する（完了条件: 全リンクが OK / Broken で表記）。
4. 「実地操作不可 / Phase 13 ユーザー承認後実走」を `main.md` 冒頭に明記する。
5. 保証できない範囲（GitHub 実値の eventual consistency / `enforce_admins=true` 詰みの再現実験不可 / UT-GOV-004 contexts 未同期下の 2 段階適用挙動）を Phase 12 申し送り候補として最低 3 項目列挙する。

## NON_VISUAL 代替 evidence の 4 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| **L1: 型** | adapter 出力 payload が GitHub REST `PUT /repos/{owner}/{repo}/branches/{branch}/protection` の schema field（§4.1 マッピング表）を満たすか jq 構造検証（dry walkthrough） | payload の「型」整合（field 名 / 型 / 配列 vs bool） | 実 PUT 応答の意味的整合（422 / 200 OK 判定） |
| **L2: lint / boundary** | snapshot（GET 形）と payload（PUT 形）の **用途分離 boundary** を設計レベルで読み取り検証。snapshot は PUT 不可（422）、payload / rollback のみ PUT 可、を spec で固定 | 「snapshot を誤って PUT に流す」二重正本事故の境界 | 実走時の人為ミス（誤ファイル指定）— runbook で別途緩和 |
| **L3: in-memory test** | 4 ステップ手動 smoke（dry-run / apply / GET 検証 / grep 検証）の **コマンド系列を仕様レベルで固定**（manual-smoke-log.md に NOT EXECUTED で列挙） | 「再現する手順」の網羅性 | GitHub 実値 drift / network race / API rate limit |
| **L4: 意図的 violation snippet** | わざと `required_pull_request_reviews` を非 null にした payload で適用するケースを spec walkthrough で red 確認（CLAUDE.md の solo 運用ポリシーと drift する状態）+ snapshot をそのまま PUT する 422 ケースの red 確認 | 「赤がちゃんと赤になる」(drift / schema 違反検出) | （L4 自体は green 保証ではない） |

## 4 ステップ手動 smoke コマンド系列（NOT EXECUTED）

> 本 Phase では実走しない。Phase 13 ユーザー明示承認後に別オペレーションで走らせる前提。
> ここで列挙するのはコマンドの「仕様レベル固定」のみであり、実行ログ・実 PUT 応答は本 Phase では取得しない。

```bash
# === STEP 0: 前提確認（NOT EXECUTED）===
# UT-GOV-004 (required_status_checks.contexts 同期) completed か
# task-github-governance-branch-protection Phase 13 承認済か
# gh auth status で administration:write スコープがあるか

# === STEP 1: dry-run プレビュー（NOT EXECUTED）===
# snapshot 取得（lane 1）
gh api repos/{owner}/{repo}/branches/dev/protection  > outputs/phase-13/branch-protection-snapshot-dev.json
gh api repos/{owner}/{repo}/branches/main/protection > outputs/phase-13/branch-protection-snapshot-main.json

# adapter で payload / rollback payload 生成（lane 2 / Phase 5 で実装）

# 差分プレビュー
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-dev.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-dev.json)
diff <(jq -S . outputs/phase-13/branch-protection-snapshot-main.json) \
     <(jq -S . outputs/phase-13/branch-protection-payload-main.json)
# 期待結果: intended diff のみ（field 名差異 / 値差異が design.md §2 と一致）

# === STEP 2: 実適用（NOT EXECUTED — Phase 13 ユーザー承認後）===
gh api repos/{owner}/{repo}/branches/dev/protection  -X PUT \
  --input outputs/phase-13/branch-protection-payload-dev.json \
  > outputs/phase-13/branch-protection-applied-dev.json
gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
  --input outputs/phase-13/branch-protection-payload-main.json \
  > outputs/phase-13/branch-protection-applied-main.json
# 期待結果: HTTP 200 / applied JSON が saved

# === STEP 3: gh api GET で実値確認（NOT EXECUTED）===
gh api repos/{owner}/{repo}/branches/dev/protection  | jq '.required_pull_request_reviews'  # 期待: null
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_pull_request_reviews'  # 期待: null
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_status_checks.contexts' # 期待: UT-GOV-004 同期済 contexts のみ
gh api repos/{owner}/{repo}/branches/main/protection | jq '.enforce_admins.enabled'           # 期待: true
gh api repos/{owner}/{repo}/branches/main/protection | jq '.lock_branch.enabled'              # 期待: false
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_linear_history.enabled'  # 期待: true
gh api repos/{owner}/{repo}/branches/main/protection | jq '.allow_force_pushes.enabled'       # 期待: false
gh api repos/{owner}/{repo}/branches/main/protection | jq '.allow_deletions.enabled'          # 期待: false
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_conversation_resolution.enabled' # 期待: true

# === STEP 4: CLAUDE.md と grep 一致確認（NOT EXECUTED）===
# solo 運用ポリシー（required_pull_request_reviews=null）が CLAUDE.md と GitHub 実値で一致
grep -nE "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md
# 期待: 1 件以上ヒット

# 線形履歴 / force-push 禁止 / 削除禁止 / 会話解決必須 が CLAUDE.md にも記述されているか
grep -nE "required_linear_history|allow_force_pushes|allow_deletions|required_conversation_resolution" CLAUDE.md
# 期待: 各条項に対応する記述が一致
```

> **担当者**: solo 運用のため実行者本人。緊急 rollback 経路（`enforce_admins=false` 最小 patch / DELETE 経路）の連絡先・手元 ssh / GitHub UI 二重経路を `outputs/phase-13/apply-runbook.md` に明記。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-02/main.md | 4 ステップ手順（§7）と adapter（§4）の正本 |
| 必須 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-03/main.md | NO-GO 条件 / 4 条件 PASS の参照 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 親タスク仕様（苦戦箇所 §8.1〜8.6） |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | 草案 JSON（payload の正本） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase11.md | docs-only / spec_created Phase 11 必須 3 outputs フォーマット |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | L1〜L4 プレイブックの正本 |
| 必須 | CLAUDE.md | ブランチ戦略（grep 検証ターゲット） |
| 参考 | docs/30-workflows/skill-ledger-a1-gitignore/phase-11.md | NON_VISUAL Phase 11 構造リファレンス |

## 実行手順

1. NON_VISUAL 代替 evidence の 4 階層を `outputs/phase-11/main.md` へ記録する。
2. 4 ステップ手動 smoke のコマンド系列を `manual-smoke-log.md` に NOT EXECUTED として記録する。
3. `link-checklist.md` で index.md / phase-NN.md / outputs / 親仕様 / design.md の参照リンクを確認する。
4. 「Phase 13 ユーザー承認後に実走」を `main.md` 冒頭で明記する。

## 統合テスト連携

本 Phase は spec walkthrough のため smoke を実走しない。Phase 13 ユーザー明示承認後に同じコマンド系列を実走し、`outputs/phase-13/branch-protection-{snapshot,payload,rollback,applied}-{dev,main}.json` および `apply-runbook.md` / `rollback-rehearsal-log.md` を確定させる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| walkthrough | outputs/phase-11/main.md | NON_VISUAL 代替 evidence の記録（L1〜L4） |
| smoke log | outputs/phase-11/manual-smoke-log.md | 4 ステップ手動 smoke の NOT EXECUTED コマンド系列 |
| link check | outputs/phase-11/link-checklist.md | 仕様書間リンク確認 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] NON_VISUAL 代替 evidence 差分表（L1/L2/L3/L4）が `main.md` に記載
- [ ] 4 ステップ手動 smoke（dry-run / apply / GET 検証 / grep 検証）のコマンド系列が `manual-smoke-log.md` に NOT EXECUTED ステータスで網羅
- [ ] spec walkthrough のリンク健全性が `link-checklist.md` に OK/Broken で記録
- [ ] 「実地操作不可 / Phase 13 ユーザー承認後実走」が `main.md` 冒頭で明記
- [ ] 保証できない範囲が Phase 12 申し送り候補として最低 3 項目列挙
- [ ] UT-GOV-004 完了前提が NO-GO 条件として再掲されている（3 重明記の 3 箇所目）

## 検証コマンド

```bash
# 必須 3 ファイルの存在
ls docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/
# main.md / manual-smoke-log.md / link-checklist.md の 3 件のみ

# screenshots/ が存在しないこと
test ! -d docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/screenshots && echo OK

# NOT EXECUTED が manual-smoke-log.md に明記されていること
rg -n "NOT EXECUTED" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/manual-smoke-log.md

# 4 ステップ smoke の各ステップが記述されているか
rg -n "STEP [0-4]" docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/manual-smoke-log.md
```

## 苦戦防止メモ

1. **screenshots/ を作らない**: NON_VISUAL タスクで `.gitkeep` を作ると validator が VISUAL と誤判定する。
2. **「実走した」と書かない**: 本 Phase は spec walkthrough。manual-smoke-log.md には必ず `NOT EXECUTED` ステータスを残す。実 PUT は Phase 13 ユーザー承認後。
3. **snapshot をそのまま PUT したケースを赤として明示**: GET 応答（`enforce_admins.enabled` ネスト等）を PUT に流すと 422。L4 で意図的 violation として記録する。
4. **CLAUDE.md grep を「設計参照」ではなく「drift 検証」として位置づけ**: §8.6 の二重正本事故防止が目的。GitHub 実値が正本、CLAUDE.md は参照、を明記。
5. **UT-GOV-004 完了 NO-GO の 3 重明記**: Phase 1 / Phase 2 / Phase 3 に加え、本 Phase 11 でも `manual-smoke-log.md` STEP 0 に再掲する。
6. **`enforce_admins=true` 詰み再現実験は spec walkthrough では行わない**: 実走でしか再現できないため Phase 13 で apply-runbook.md に緊急 rollback 2 経路を明記し、本 Phase では参照のみ。

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - L3/L4 で発見した「保証できない範囲」を `unassigned-task-detection.md` の current 区分へ転記
  - 4 ステップ手動 smoke のコマンド系列を `implementation-guide.md` Part 2 に再掲
  - link-checklist.md の Broken 項目があれば Phase 12 で同 sprint 修正
  - CLAUDE.md grep 検証手順を `system-spec-update-summary.md` Step 1-A の「ブランチ戦略章」反映候補として申し送る
- ブロック条件:
  - `screenshots/` ディレクトリが誤って作成されている
  - `manual-smoke-log.md` が「実走済」と誤記している
  - `link-checklist.md` が空（spec walkthrough 未実施）
  - 4 ステップのいずれかが欠落
