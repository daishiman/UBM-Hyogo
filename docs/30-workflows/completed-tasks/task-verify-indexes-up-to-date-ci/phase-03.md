# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4 |
| 状態 | completed |

## 目的

Phase 2 の設計（独立 workflow file 採用案）に対し、4 つの代替案を比較し PASS-MINOR-MAJOR 判定を下す。
特に **「authoritative gate を CI のどの位置に置くか」** と **「local hook で代替できないか」** を評価する。

## alternative 案

### 案 A: 採用案 = 独立 workflow file `.github/workflows/verify-indexes.yml`

- **構造**: 専用 file 1 本、独立 concurrency group、独立 trigger（PR + push to main/dev）
- **メリット**:
  - 責務が gate 専用で明確、Required Status Checks 設定時に発見しやすい
  - `git revert` 1 つで撤去可能
  - 他 workflow と完全独立、衝突リスクゼロ
  - 他 skill の indexes 検証を将来追加する際にも同 file 内 job として並列追加可能
- **デメリット**:
  - workflow file が 1 本増える（運用上の保守対象が +1）
  - PR ごとに pnpm install のオーバーヘッドが発生（cache で軽減）

### 案 B: 既存 `ci.yml` への job 追加

- **構造**: `ci.yml` に `verify-indexes` job を追加、既存 setup を共有
- **メリット**:
  - workflow file が増えない
  - pnpm install を他 job と共有できる場面がある（matrix 次第）
- **デメリット**:
  - `ci.yml` の責務が肥大化し、build / typecheck と gate が同居
  - 撤去・改変時に他 job への影響評価が必要
  - ci.yml の trigger と本 gate の trigger が将来ずれた場合に分離コストが高い

### 案 C: pre-commit hook 強化のみ（CI 不導入）

- **構造**: lefthook の pre-commit で `pnpm indexes:rebuild` + `git diff --exit-code` を実行
- **メリット**:
  - CI コスト不要
  - 開発者にとって即時フィードバック
- **デメリット**:
  - `--no-verify` で迂回可能 → **authoritative gate にならない**
  - hook 未インストール環境（新規 worktree / clone 直後）で素通り
  - solo 開発で自分が `--no-verify` を使う場面（緊急時等）に保護が消える
- **判定**: 元タスク指示書 1.2「local hook は --no-verify や未インストールで回避できる」に正面衝突 → **却下**

### 案 D: post-merge hook で再生成を復活

- **構造**: lefthook の post-merge で `pnpm indexes:rebuild` を再有効化
- **メリット**:
  - merge 直後に自動再生成
- **デメリット**:
  - **元タスクが解決した「無関係 PR への generated diff 混入問題」が再発**
  - AC-4「post-merge hook に index 再生成を戻していない」に正面衝突
  - lefthook-operations.md の post-merge 廃止方針と矛盾
- **判定**: **即却下**

## トレードオフ比較表

| 観点 | 案 A（採用） | 案 B | 案 C | 案 D |
| --- | --- | --- | --- | --- |
| authoritative 性（迂回不可） | ◎ | ◎ | ✗ | ◎ |
| 既存 CI との独立性 | ◎ | △ | — | — |
| 撤去容易性 | ◎ | △ | ◎ | △ |
| post-merge 復活の有無 | なし | なし | なし | あり（AC-4 違反） |
| 将来拡張性（他 skill の index 追加） | ◎ | ○ | △ | △ |
| 学習コスト（既存パターン踏襲） | ○ | ◎ | ◎ | ✗ |
| 元タスクの問題再発リスク | なし | なし | あり（迂回） | あり（diff 混入） |
| 採否 | **採用** | 不採 | 却下 | 却下 |

## PASS-MINOR-MAJOR 判定

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 全体設計 | PASS | 案 A は authoritative gate 要件 + AC-4 + AC-5 を全て満たす |
| 既存 CI 独立性 | PASS | 独立 file + 独立 concurrency group |
| 撤去容易性 | PASS | `git revert` 1 コミット |
| 失敗時の伝達品質 | PASS | `git diff --name-only` + `git status --short` を必須出力 |
| workflow file が +1 する保守コスト | MINOR | 1 file 増は responsibility 明確化と引き換えに許容 |
| pnpm install オーバーヘッド | MINOR | `cache: pnpm` で軽減、PR feedback への影響は数十秒〜1 分程度で許容 |
| 重大 blocker | なし | MAJOR 該当なし |

総合判定: **PASS（MINOR 2 件は許容、Phase 4 へ）**

## 最終決定

**独立 workflow file `.github/workflows/verify-indexes.yml` を採用**。
案 B（ci.yml 内 job 追加）は将来 ci.yml 肥大化リスクを残すため不採用。
案 C / D は元タスクの問題（迂回 / diff 混入）を再発させるため却下。

## レビューチェックリスト

- [x] AC-1 PR / push 自動起動 → 案 A の trigger でカバー
- [x] AC-2 fail 時差分ファイル名出力 → 案 A の `git diff --name-only` でカバー
- [x] AC-3 false positive なし → Phase 4 で連続 2 回実行 test を申し送り
- [x] AC-4 post-merge 復活なし → 案 D 却下で確実
- [x] AC-5 既存 4 workflow と非衝突 → 独立 file + 独立 concurrency
- [x] AC-6 Node 24 / pnpm 10.33.2 → setup-node@v4 + action-setup@v4
- [x] AC-7 監視範囲限定 → `-- .claude/skills/aiworkflow-requirements/indexes` の path 引数で限定

## 実行タスク

1. 4 案を `outputs/phase-03/main.md` に文書化
2. 比較表 + PASS-MINOR-MAJOR 判定を記載
3. MINOR 2 件（file +1 / install オーバーヘッド）を Phase 5 申し送り
4. 採用案の根拠を 4 点（責務 / trigger 独立 / 可読性 / 拡張性）として明記
5. GO マーク

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 2 outputs | レビュー対象 |
| 必須 | docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md | 元タスク制約 |
| 必須 | doc/00-getting-started-manual/lefthook-operations.md | post-merge 廃止方針 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 4 | 連続 2 回実行 test / 意図的 drift fail test の戦略 |
| Phase 5 | MINOR 2 件の実装上の対処（cache 設定 / 撤去手順） |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 案 A 採用 | — | authoritative gate + 既存 CI 独立 |
| 案 C 却下 | — | `--no-verify` 迂回で authoritative にならない |
| 案 D 却下 | — | AC-4 違反（post-merge 復活禁止） |
| 不変条件 | #1〜#7 | 触れない |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 4 案文書化 | completed | A/B/C/D |
| 2 | 比較表 | completed | 7 観点 × 4 案 |
| 3 | PASS-MINOR-MAJOR 判定 | completed | MINOR 2 件 |
| 4 | 採用理由 4 点 | completed | 責務 / trigger / 可読性 / 拡張性 |
| 5 | MINOR 申し送り | completed | Phase 5 へ |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-03/main.md | 4 案 + 比較表 + 判定 + 採用理由 |

## 完了条件

- [ ] 4 案文書化
- [ ] PASS 判定（MINOR 2 件は許容）
- [ ] 採用理由 4 点が明記
- [ ] MINOR 申し送り完了

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-03/main.md 配置済み
- [ ] artifacts.json の Phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A（独立 workflow file）+ MINOR 2 件
- ブロック条件: PASS でなければ Phase 2 戻し
