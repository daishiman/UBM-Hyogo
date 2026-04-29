# Phase 4: テスト戦略（CODEOWNERS 検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消 (UT-GOV-003) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（CODEOWNERS 検証戦略） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL / infrastructure_governance |

## 目的

CODEOWNERS は実行系コードを伴わない **governance ファイル** であり、Vitest / line coverage の概念が適用できない。本 Phase では「ownership 文書化が GitHub 側で正しく機能していることを検証する手段」を T1〜T4 として固定する。検証は以下の 4 系統で構成する。

1. **構文・参照健全性検証**（GitHub REST API による errors=[] 確認）
2. **ownership 反映の dry-run 検証**（test PR で suggested reviewer 表示確認）
3. **表記揺れ棚卸し検証**（`doc/` → `docs/` 統一の達成確認）
4. **CI 自動 gate の導入可否判定**（過剰品質を避けるための discriminator）

> 本タスクは solo 運用のため `require_code_owner_reviews=true` を有効化しない（AC-6）。したがって「ownership が表明されていること」の検証であって「PR が CODEOWNERS により block されること」の検証ではない点に注意。

## 依存タスク順序

- 親 `task-github-governance-branch-protection` の方針確定（solo 運用 / `require_code_owner_reviews=false`）に依存。
- 関連 UT-GOV-001 / UT-GOV-002 / UT-GOV-004 / UT-GOV-005 は **本 Phase の検証手段（gh api / test PR）には直接依存しない** が、CODEOWNERS の owner 表明が UT-GOV-001 の branch protection 草案と整合する必要があるため Phase 5 で再確認する。

## 実行タスク

- タスク1: T1〜T4 の検証観点・コマンド・期待値・Red 状態を表として確定する。
- タスク2: 「test PR を起こさずに済むケース／必須なケース」の境界を明文化する。
- タスク3: CI 上の `actions/codeowners-validator` 等の導入可否判断基準を固定する（過剰品質防止）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md | AC / 苦戦箇所 / 落とし穴 §8 |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-02.md | 設計（owner 順序 / 最終マッチ勝ち） |
| 必須 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/phase-03.md | 設計レビュー結論 |
| 参考 | GitHub Docs "About code owners" | 構文 / glob 仕様 / team 権限要件 |
| 参考 | GitHub REST `GET /repos/{owner}/{repo}/codeowners/errors` | 構文・参照エラー検出 API |

## テスト一覧（4 系統）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前）の状態

### T1: `gh api /codeowners/errors` で errors=[]

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 観点 | 構文・参照健全性 |
| 検証コマンド | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` |
| 期待値 | `[]`（空配列）。HTTP 200 で 1 件もエラーが無いこと |
| Red 状態（現状） | `.github/CODEOWNERS` が未整備 or `doc/` 旧表記が残存しており、glob 不一致 / 不正な user handle が混入しうる |
| 失敗時切り分け | (a) 構文エラー（記号・コメント） / (b) 存在しない user/team handle / (c) team が repo に write 権限を持たず silently skip / (d) glob パターン非互換（GitHub gitignore-like 仕様の差異） |
| 実走タイミング | Phase 5 Step 4（PR 作成時）+ Step 5（main マージ後） |

### T2: test PR の suggested reviewer 表示確認（dry-run）

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 観点 | ownership 表明の GitHub UI 反映 |
| 検証手順 | (1) `chore/codeowners-test` ブランチを作成 / (2) governance 5 パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）にそれぞれ無害な 1 file を touch / (3) PR を draft で作成 / (4) Reviewers 欄の suggested reviewer 表示を目視 |
| 期待値 | 5 パスすべてで `@daishiman` が suggested reviewer として表示される |
| Red 状態 | 該当パスが空欄、または別 owner が表示される |
| 失敗時切り分け | (a) パス glob のミスマッチ / (b) 最終マッチ勝ちで global fallback が上書きしている / (c) team handle の権限不足で silently skip |
| 実走タイミング | Phase 5 Step 4（test PR を draft で作成し、確認後 close） |
| 注意 | test PR は **マージしない**。確認のみで close する。`chore/codeowners-test` ブランチも検証後削除。 |

### T3: `doc/` 表記の残存ゼロ確認（棚卸し）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 観点 | 表記揺れの解消（AC-5） |
| 検証コマンド | `rg -n "(^\|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!docs/30-workflows/completed-tasks/**' .` |
| 期待値 | 0 hit、または「外部リンク等の不可避ケース」のみで Phase 5 Step 1 の棚卸しメモに **明示記録** されたものに限定 |
| Red 状態 | CLAUDE.md / 正本仕様 / 既存タスク仕様内に `doc/` 旧表記が混在する |
| 失敗時切り分け | (a) 置換漏れ / (b) `docs/00-getting-started-manual` のような複合パスが grep 範囲外 / (c) URL 等 false positive の精査不足 |
| 実走タイミング | Phase 5 Step 1（事前棚卸し）+ Step 2（置換後）+ main マージ後 |
| 補足 | `docs/30-workflows/completed-tasks/**` は完了タスクの履歴であり原典の「doc/」言及を保持する場合があるため除外。除外範囲は Phase 5 で確定する。 |

### T4: CI 自動 gate（codeowners-validator）導入可否判定

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 観点 | 過剰品質回避 / 自動再発防止の必要性判定 |
| 判定基準 | 以下 3 条件を **すべて満たす場合のみ** CI gate を導入する：(i) 月次以上の頻度で CODEOWNERS 改変が見込まれる、(ii) team handle 採用予定があり権限欠落の自動検知が必要、(iii) 将来 `require_code_owner_reviews=true` 切替計画がある |
| 期待値（本タスク時点） | **3 条件いずれも該当せず → CI gate は導入しない**。T1（`gh api` 手動実行）+ Phase 5 Step 5 の post-merge 確認で十分とする |
| Red 状態 | 上記 3 条件のいずれかが将来満たされた場合 → Phase 12 unassigned-task-detection.md に「CODEOWNERS CI gate 導入」を再起票候補として記録 |
| 失敗時切り分け | 判定基準が時間とともに変化した場合の再評価トリガを Phase 12 に申し送り |
| 実走タイミング | Phase 5 Step 0（実装着手前判定）/ Phase 12 申し送り |

## カバレッジ観点（CODEOWNERS 特化）

CODEOWNERS には実行コードがないため、line / branch coverage ではなく **「AC で要求された 5 ownership パス × 3 検証観点（構文 / UI 反映 / 表記統一）」** をスコープとする。

| 観点 | T1（構文） | T2（UI 反映） | T3（表記統一） |
| --- | --- | --- | --- |
| `docs/30-workflows/**` | ◎ | ◎ | ◎ |
| `.claude/skills/**/references/**` | ◎ | ◎ | ◎（`references/` 内の `doc/` 残存） |
| `.github/workflows/**` | ◎ | ◎ | - |
| `apps/api/**` | ◎ | ◎ | - |
| `apps/web/**` | ◎ | ◎ | - |
| global fallback (`* @daishiman`) | ◎ | -（specific rule に上書きされるべき） | - |

> 凡例: ◎ = 主たる被覆 / - = 該当なし。
> 全 5 パス × T1 / T2 で ◎ が揃うこと、表記統一は該当する 2 パスで ◎ があることをカバレッジ要件 PASS とする。

## 統合テスト連携

- T1 / T2 は Phase 5 Step 4〜5 の gate として実走する。
- T3 は Phase 5 Step 1（事前棚卸し）と Step 2（置換実施後）の 2 タイミングで実走する。
- T4 は Phase 5 Step 0 の判定として 1 回のみ実走し、Phase 12 へ申し送る。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T4 のテスト一覧 / 検証コマンド / 期待値 / 失敗切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## 完了条件

- [ ] T1〜T4 が `outputs/phase-04/main.md` に表化されている
- [ ] 各テストに ID / 観点 / 検証コマンド or 手順 / 期待値 / Red 状態 / 失敗切り分け / 実走タイミングが記述されている
- [ ] 5 ownership パス × 3 観点のカバレッジ表が空セル無く埋まっている
- [ ] CI gate 不採用の判定基準（T4 の 3 条件）が明記されている
- [ ] solo 運用方針（`require_code_owner_reviews=false`）と検証目的の整合性が再掲されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-04/main.md
rg -c "^### T[1-4]:" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-04/main.md
# => 4
rg -q "require_code_owner_reviews=false\|require_code_owner_reviews.*無効\|有効化しない" docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-04/main.md && echo OK
```

## 苦戦防止メモ

1. **silently skip 挙動**: team handle 権限不足時、`gh api /codeowners/errors` は **errors=[] のまま** だが UI 上では suggested reviewer が出ない。T1 だけでは検出できないため T2（test PR）と併用する。
2. **`doc/` 棚卸しの除外範囲**: `docs/30-workflows/completed-tasks/**` は完了タスクの原典スペック内に `doc/` 言及を含むため除外候補。除外範囲は Phase 5 で最終確定する。
3. **test PR をマージしない**: T2 の test PR は **必ず close 運用**。マージすると governance パスに無害ファイルが残置する事故。
4. **CI gate 導入の誘惑**: solo 運用ではメンテコストが過剰。T4 の 3 条件で discriminate する。
5. **本 Phase は実走しない**: 仕様化のみ。T1〜T3 の実走は Phase 5 / Phase 11 で行う。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T3 を Phase 5 Step 1〜5 の Green 条件として参照
  - T4 判定結果（CI gate 不採用）を Phase 5 Step 0 に明記
  - test PR ブランチ名 `chore/codeowners-test` を Phase 5 Step 4 で再利用
- ブロック条件:
  - T1〜T4 のいずれかに期待値・検証手段が欠けている
  - solo 運用方針との不整合（必須レビュー化を前提とした検証になっている）
