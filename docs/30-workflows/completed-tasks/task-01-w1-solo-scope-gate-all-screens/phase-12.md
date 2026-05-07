# Phase 12: ドキュメント整備（task-01-w1-solo-scope-gate-all-screens）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク ID | `task-01-w1-solo-scope-gate-all-screens` |
| Phase | 12 / 13（ドキュメント整備） |
| 推定工数 | 0.05 人日 |
| 依存 Phase | Phase 11 |
| タスク種別 | `docs-only` / `NON_VISUAL` / `spec_created` |
| 必須 outputs | 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |

> 本 Phase は phase-template-phase12.md に準拠。docs-only タスクのため Step 2 は **N/A**（CLAUDE.md / specs/00-overview.md / SCOPE.md は本タスクの primary deliverable であり、それ自体が「正本登録」のため二重登録不要）。

---

## 0. 自己完結コンテキスト

task-01（docs 編集）の最終ドキュメント整備として、Phase 12 strict 7 outputs を生成する。docs-only / spec_created モードで Part 1（中学生レベル）/ Part 2（技術者レベル）の双方を作成し、後続 task-02..22 が scope gate 文書を正しく参照できる状態を保証する。

---

## 1. 目的

Phase 11 evidence 完了後、7 必須成果物を生成して Phase 13 user approval gate に必要な docs を全て揃える。

---

## 2. 必須成果物（7 ファイル）

| # | ファイル | 役割 | 必須セクション |
|---|---------|------|--------------|
| 1 | `outputs/phase-12/main.md` | Phase 12 index / strict 7 files manifest | 判定 / 7 ファイル一覧 / same-wave sync 状態 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） | アナロジー / 型定義相当 / API 相当 / 使用例 / エラー処理相当 / 設定値相当 |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1 結果 + Step 2 N/A 理由 | Step 1-A〜G / Step 2 = **N/A** |
| 4 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル一覧 / validator 結果 / current/baseline | 3 ファイル diff サマリ |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも summary 残す | SF-03 4 パターン照合結果 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill への観察事項 | 改善点 or 「なし」 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 12-1〜12-6 全完了確認 | spec_created 専用項目（計画系 wording 残無し / Step 2 = N/A 妥当） |

---

## 3. implementation-guide.md 要件

### 3.1 Part 1（中学生レベル / アナロジー）

> 「中学生レベル」とは、専門用語なしで概念を伝える。例えば「routes」は「学校で言うクラス一覧」のように比喩する。

必須要素:

- 何のタスクか: 「サイトに作る画面のリスト（19 個）と、それを作るときに守るルール（3 つ）を、みんなが見る場所に書いておく作業」
- なぜ必要か: 「あとで他のタスクをやる人が、画面の数や色のルールで迷わないようにするため」
- 結果どうなるか: 「次のタスクを始めるときに迷わない・後戻りしない」
- 比喩: 「料理レシピの目次を最初に作っておくのと同じ」

### 3.2 Part 2（技術者レベル / docs-only ブランチ）

phase-template-phase12.md `## Part 2 必須5項目チェック対応表` の docs-only 代替判定に従う:

| # | docs-only 代替記述 | 本タスクでの記述 |
|---|-------------------|----------------|
| C12P2-1 | 型定義 = YAML/JSON スキーマ / メタフィールド型 | SCOPE.md §1 表列構成（`\| 層 \| route \| プロトタイプ掲載 \| 設計指針 \|`）と §2 列構成 |
| C12P2-2 | API 相当 = SKILL.md セクション参照経路 / 発火条件式 | CLAUDE.md anchor `## UI prototype alignment / MVP recovery（進行中ワークフロー）` / specs anchor `## 画面一覧（19 routes）と API mapping` |
| C12P2-3 | 使用例 = タスク仕様書テンプレ実例 | 後続 task-02 仕様書ドラフト時に `[SCOPE.md](../SCOPE.md)` で参照する例 |
| C12P2-4 | エラー処理相当 = NO-GO 条件 / 差戻しルール | phase-10 §4 NO-GO 条件 / phase-08 R-01..R-10 |
| C12P2-5 | 設定値相当 = artifacts.json metadata 必須フィールド | `visualEvidence=NON_VISUAL` / `taskType=docs-only` / `state=spec_created` |

---

## 4. system-spec-update-summary.md 要件

### 4.1 Step 1（実コマンド実行結果）

| Step | コマンド | 結果記録先 |
|------|---------|----------|
| 1-A | `test -f CLAUDE.md ...` | manual-smoke-log.md と同じ |
| 1-B | `grep ui-prototype-alignment-mvp-recovery CLAUDE.md` | 同上 |
| 1-C | `grep "19 routes" specs/00-overview.md` | 同上 |
| 1-D | `mise exec -- pnpm lint` | 同上 |
| 1-E | `git diff --name-status main...HEAD` | 正本 docs / task package / approved archive のみであること |
| 1-F | `ls SCOPE.md` 等リンク到達 | link-checklist.md と同じ |
| 1-G | spec walkthrough / mirror parity（必要時） | 該当なし（mirror 対象 skill 無） |

### 4.2 Step 2 = **N/A**（判定理由）

phase-template-phase12.md `## Step 2 = N/A vs BLOCKED 判定基準` のフローに従い:

- ドメイン仕様（API endpoint / D1 schema / IPC 契約 / UI route / auth / Cloudflare Secret）に touch するか?
  - **No**（CLAUDE.md / specs/00-overview.md / SCOPE.md の 3 ファイルは workflow scope gate であり、本タスクの primary deliverable そのもの = 正本そのもの）
  - 不変条件 #1〜#7 への影響: 無し（既存 6 不変条件を保持し、本 workflow 固有 3 条件を新規追加するのみ・破壊変更なし）
- → **N/A** が妥当

> 「正本登録すべき変更」と「primary deliverable そのもの」は別概念。本タスクの 3 ファイル編集は後者のため二重登録不要。

---

## 5. documentation-changelog.md 要件

| 項目 | 内容 |
|------|------|
| 変更ファイル | CLAUDE.md (edit) / docs/00-getting-started-manual/specs/00-overview.md (edit) / docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md (new) / task package (new) / completed-tasks archive rename |
| validator 結果 | `mise exec -- pnpm lint` exit 0 / grep 検算 PASS / 行数検算 PASS |
| current vs baseline | baseline = main 上の各ファイル / current = task-01 適用後 / diff サマリ（追加行のみ・削除 0） |

---

## 6. unassigned-task-detection.md 要件（SF-03 4 パターン）

| パターン | 本タスクでの該当 | 派生タスク化 |
|---------|----------------|------------|
| 型定義→実装 | N/A（型定義なし） | 0 件 |
| 契約→テスト | N/A（契約コードなし） | 0 件 |
| UI 仕様→コンポーネント | **該当**（SCOPE.md §1 で 19 routes 仕様を確定したが、コンポーネント実装は task-09..22） | task-09..22 として **既起票済**（追加未タスク 0 件） |
| 仕様書間差異→設計決定 | N/A（CLAUDE.md / specs / SCOPE.md / phase-1〜3 で整合確認済） | 0 件 |

> 「設計タスクパターン確認済、追加未タスク 0 件」を明記。task-09..22 は workflow 内で既起票のため再起票不要。

---

## 7. skill-feedback-report.md 要件

task-specification-creator skill への観察事項:

- **観察 1**: docs-only / pure-docs タスクで `phase-template-phase11.md` の NON_VISUAL 縮約テンプレが明示されているのは適切。
- **観察 2**: 本タスクのような workflow scope gate（後続 21 タスクの参照基盤）では、Phase 12 Step 2 = N/A 判定の根拠を「primary deliverable そのもの」として明示する事例を skill に追記すると将来の同種タスクで判断が早い。
- **改善提案**: なし（現行 skill 範囲内で完結）

---

## 8. phase12-task-spec-compliance-check.md 要件

| Task 12-X | 完了確認項目 | spec_created 専用 |
|-----------|------------|-------------------|
| 12-1 implementation-guide | Part 1 / Part 2 完備 | docs-only Part 2 代替 5 項目 |
| 12-2 system-spec-update | Step 1 / Step 2 結果 | Step 2 = N/A 妥当性 |
| 12-3 documentation-changelog | 変更ファイル / validator | 3 ファイル diff |
| 12-4 unassigned-task | 0 件でも summary | SF-03 4 パターン |
| 12-5 skill-feedback | 改善点 or 「なし」 | 観察 1-2 + 改善提案 |
| 12-6 compliance-check | 12-1〜12-5 完了確認 | 計画系 wording 残無し |

### 計画系 wording 残存確認（必須実行）

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "計画系 wording なし"
```

---

## 9. プロトタイプ参照表（Phase 12 で確認）

| 成果物 | prototype 参照 | 記述箇所 |
|-------|---------------|---------|
| implementation-guide Part 2 | `styles.css` L1-70 / `primitives.jsx` L1-272 | C12P2-5 設定値相当の根拠としての OKLch / 13 primitive |
| documentation-changelog | SCOPE.md §3 #3 / #5 | prototype 参照 link 健全性 |

---

## 10. リスク

| リスク | 緩和 |
|-------|------|
| Step 2 = N/A を BLOCKED と誤判定 | §4.2 で判定フローを明示 |
| Part 1 のアナロジーが浅い（「画面のリスト」だけ）| 「料理レシピの目次」など複数比喩を併記 |
| unassigned-task で task-09..22 を二重起票 | §6 で「workflow 内既起票・追加 0」を明記 |
| 計画系 wording 残存 | §8 の grep を Phase 12 完了前に実行 |

---

## 11. 完了条件（Phase 13 へ進む gate）

- [ ] 7 必須成果物が `outputs/phase-12/` に存在
- [ ] Step 2 = N/A 判定理由が明記
- [ ] Part 1 / Part 2 が docs-only 代替判定で完備
- [ ] 計画系 wording grep が「なし」
- [ ] phase12-task-spec-compliance-check.md で 12-1〜12-6 全 PASS

## 実行タスク

- 本 phase 本文に記載済みのタスクを実行し、task-01 scope gate の正本化に必要な判断・検証・成果物を閉じる。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化の要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照先 |
| workflow 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1 -> W7 DAG |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| phase specification | `docs/30-workflows/task-01-w1-solo-scope-gate-all-screens/phase-12.md` | 本 phase の仕様書 |
| scope gate docs | `CLAUDE.md`, `docs/00-getting-started-manual/specs/00-overview.md`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | task-01 の実成果物 |

## 完了条件

- [ ] 本 phase の本文で定義した gate が満たされている。
- [ ] task-01 の3 docs成果物と矛盾していない。
- [ ] 後続 task-02..22 の参照基盤を壊していない。

## 目的

- task-01 scope gate を skill 準拠で前進させ、正本 docs と Phase evidence の整合を保つ。
