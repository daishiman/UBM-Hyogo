# Phase 3: 設計レビュー — main.md

## 1. レビューサマリ

Phase 2 の設計（**独立 workflow file `.github/workflows/verify-indexes.yml`**）に対し、4 つの代替案を比較した。
特に「authoritative gate を CI のどの位置に置くか」と「local hook で代替できないか」を評価した結果、
案 A（独立 workflow file）を採用とし、案 C / D は元タスクの問題を再発させるため却下する。

総合判定: **PASS（MINOR 2 件は許容、Phase 4 へ）**

## 2. alternative 案

### 案 A: 採用 = 独立 workflow file `.github/workflows/verify-indexes.yml`

- **構造**: 専用 file 1 本、独立 concurrency group `verify-indexes-${{ github.ref }}`、独立 trigger（PR + push to main/dev）
- **メリット**:
  - 責務が gate 専用で明確、Required Status Checks 設定時に発見しやすい
  - `git revert` 1 つで撤去可能
  - 既存 4 workflow と完全独立、衝突リスクゼロ
  - 他 skill の indexes 検証を将来追加する際にも同 file 内 job として並列追加可能
- **デメリット**:
  - workflow file が 1 本増える（保守対象 +1）
  - PR ごとに `pnpm install` のオーバーヘッド（cache で軽減）

### 案 B: 既存 `ci.yml` への job 追加

- **構造**: `ci.yml` に `verify-indexes` job を追加、既存 setup を共有
- **メリット**:
  - workflow file が増えない
  - setup を他 job と共有できる場合がある
- **デメリット**:
  - `ci.yml` の責務が肥大化し、build / typecheck と gate が同居
  - 撤去・改変時に他 job への影響評価が必要
  - trigger が将来ずれた場合の分離コストが高い
- **判定**: **不採用**（責務肥大化リスクが将来コストとして残る）

### 案 C: pre-commit hook 強化のみ（CI 不導入）

- **構造**: lefthook の pre-commit で `pnpm indexes:rebuild` + `git diff --exit-code` を実行
- **メリット**:
  - CI コスト不要、即時フィードバック
- **デメリット**:
  - `--no-verify` で迂回可能 → **authoritative gate にならない**
  - hook 未インストール環境（新規 worktree / clone 直後）で素通り
  - solo 開発で `--no-verify` を使う場面に保護が消える
- **判定**: 元タスク指示書「local hook は --no-verify や未インストールで回避できる」に正面衝突 → **却下**

### 案 D: post-merge hook で再生成を復活

- **構造**: lefthook の post-merge で `pnpm indexes:rebuild` を再有効化
- **メリット**:
  - merge 直後に自動再生成
- **デメリット**:
  - **元タスクが解決した「無関係 PR への generated diff 混入問題」が再発**
  - AC-4「post-merge hook に index 再生成を戻していない」に正面衝突
  - `lefthook-operations.md` の post-merge 廃止方針と矛盾
- **判定**: **即却下**

## 3. トレードオフ比較表

| 観点 | 案 A（採用） | 案 B | 案 C | 案 D |
| --- | --- | --- | --- | --- |
| authoritative 性（迂回不可） | ◎ | ◎ | ✗ | ◎ |
| 既存 CI との独立性 | ◎ | △ | — | — |
| 撤去容易性 | ◎ | △ | ◎ | △ |
| post-merge 復活の有無 | なし | なし | なし | **あり（AC-4 違反）** |
| 将来拡張性（他 skill の index） | ◎ | ○ | △ | △ |
| 学習コスト | ○ | ◎ | ◎ | ✗ |
| 元タスクの問題再発リスク | なし | なし | あり（迂回） | あり（diff 混入） |
| **採否** | **採用** | 不採 | 却下 | 却下 |

## 4. PASS-MINOR-MAJOR 判定

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 全体設計 | **PASS** | 案 A は authoritative gate 要件 + AC-4 + AC-5 を全て満たす |
| 既存 CI 独立性 | PASS | 独立 file + 独立 concurrency group |
| 撤去容易性 | PASS | `git revert` 1 コミット |
| 失敗時の伝達品質 | PASS | `git diff --name-only` + `git status --short` を必須出力 |
| workflow file +1 の保守コスト | **MINOR** | responsibility 明確化と引き換えに 1 file 増は許容 |
| `pnpm install` オーバーヘッド | **MINOR** | `cache: pnpm` で軽減、PR feedback への影響は数十秒〜1 分程度で許容 |
| 重大 blocker | なし | MAJOR 該当なし |

**総合判定: PASS（MINOR 2 件は許容、Phase 4 へ進行）**

## 5. AC レビューチェックリスト

- [x] AC-1 PR / push 自動起動 → 案 A の trigger（pull_request + push: main/dev）でカバー
- [x] AC-2 fail 時差分ファイル名出力 → `git diff --name-only -- <indexes>` でカバー
- [x] AC-3 false positive なし → Phase 4 で連続 2 回実行 test を申し送り
- [x] AC-4 post-merge 復活なし → 案 D 却下で確実に担保
- [x] AC-5 既存 4 workflow と非衝突 → 独立 file + 独立 concurrency
- [x] AC-6 Node 24 / pnpm 10.33.2 → `setup-node@v4` + `action-setup@v4`（version: 10.33.2）
- [x] AC-7 監視範囲限定 → `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` の path 引数で限定。`git add -N` で未追跡 index も検出

## 6. 採用案の根拠（4 点）

1. **責務分離**: gate 専用 file で build / typecheck と分離、failure 責務境界が明確
2. **trigger 独立**: ci.yml と将来ずれても分離コスト不要
3. **可読性**: workflow 名 = gate 意味で Required Status Checks に登録しやすい
4. **拡張性**: 他 skill の indexes 検証を同 file 内 job として並列追加できる

## 7. MINOR 申し送り（Phase 5 へ）

| MINOR | 実装上の対処 |
| --- | --- |
| workflow file +1 の保守コスト | runbook に「`git revert <commit>` 1 つで撤去可」と明記 |
| `pnpm install` オーバーヘッド | `actions/setup-node@v4` の `cache: pnpm` を必ず有効化 |

## 8. 最終決定

**独立 workflow file `.github/workflows/verify-indexes.yml` を採用** ✅
- workflow / job 名: `verify-indexes-up-to-date`
- concurrency: `verify-indexes-${{ github.ref }}`
- 監視パス: `.claude/skills/aiworkflow-requirements/indexes`
- 検出コマンド: `pnpm indexes:rebuild` → `git add -N <indexes>` → `git diff --exit-code -- <indexes>`

案 B（ci.yml 内 job 追加）は将来 ci.yml 肥大化リスクを残すため不採用。
案 C / D は元タスクの問題（迂回 / diff 混入）を再発させるため却下。

## 9. GO マーク

**GO**: Phase 4（テスト戦略）へ進行可能。引き継ぎ事項は採用案 A + MINOR 2 件 + 連続 2 回実行 test 戦略の必要性。

## 10. 完了条件チェック

- [x] 4 案文書化
- [x] 比較表（7 観点 × 4 案）
- [x] PASS 判定（MINOR 2 件は許容）
- [x] 採用理由 4 点が明記
- [x] MINOR 申し送り完了
