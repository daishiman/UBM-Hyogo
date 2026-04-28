# Phase 10: Go / No-Go 判定書

## 最終判定: **GO**（仕様書フェーズとして）

本タスクは docs-only。Phase 11 手動テストおよび後続実装タスクへ進めて良い。

## 判定根拠

### Go 条件チェック

| # | Go 条件 | 状態 |
| --- | --- | --- |
| G-01 | AC-1〜AC-9 全達成（quality-checklist.md §2） | [x] OK |
| G-02 | phase-01〜09 が completed 想定で整合 | [x] OK |
| G-03 | 4 施策（A-1 / A-2 / A-3 / B-1）間の対象重複の処理順序が確定 | [x] OK |
| G-04 | 各ランブック（phase-05/06/07）にロールバック手順がある | [x] OK |
| G-05 | 後方互換性が phase-03 backward-compat.md で評価済 | [x] OK |
| G-06 | render script が無料枠（pnpm + Node 24）で動く設計 | [x] OK |
| G-07 | 用語 / リンク / artifacts 整合が phase-08 で確認済 | [x] OK |

すべて OK → **GO**

## 確定した処理順序

### LOGS.md（A-1 ∩ A-2 の重複対象）の処理順序

```
[1] A-2 fragment 化を先に実装
    → 既存 LOGS.md を LOGS/_legacy.md に退避
    → 以後の追記は LOGS/<YYYYMMDD-HHMMSS>-<branch>-<nonce>.md へ分散
[2] A-1 gitignore 化を後で適用
    → 旧 LOGS.md（集約 view）を git 追跡対象外に変更
    → render script 出力先として再生成可能化
```

**理由**:

- A-1 を先に実施すると、**既存 history がワンクッション無く git 管理から外れる**ため
  事故時の復旧が困難
- A-2 を先に実施することで、history は `LOGS/` 配下に **分散保持**された状態で
  A-1 の gitignore 化が「再生成可能なものだけを除外」という正しい意味になる

### keywords.json / index-meta.json（A-1 のみ）

A-2 制約なし。A-1 単独で適用可能。

### SKILL.md（A-3 のみ）

A-1 / A-2 / B-1 と独立。任意のタイミングで適用可能。

### B-1（暫定策）

- A-2/A-1 の後に適用する保険。fragment 化できない legacy ledger のみに限定する。
- A-2 完了対象は `.gitattributes` から外す手順を gitattributes-runbook.md で固定済。

## 既知のリスク

| リスク | 影響度 | 対応 |
| --- | --- | --- |
| 実装タスクでロールバック手順が機能するか未検証 | 中 | Phase 11 で手動検証、NG なら phase-05/06/07 へ差し戻し |
| OS 差異による hook 挙動差 | 低 | Phase 11 を macOS / Linux 両方で実行 |
| 別 worktree 並走中に本仕様確定前の skill 改修が起きる | 中 | index.md の依存関係欄で「ledger 触らない推奨」を維持 |

## 次アクション（実装タスク起票順）

| 順序 | タスク名 | 内容 | 起票タイミング |
| --- | --- | --- | --- |
| 1 | task-skill-ledger-A2-fragment | A-2: LOGS / changelog の fragment 化 + render script 実装 | Phase 13 完了直後 |
| 2 | task-skill-ledger-A1-gitignore | A-1: 自動生成物の gitignore 化 + hook ガード | (1) 完了後 |
| 3 | task-skill-ledger-A3-progressive | A-3: SKILL.md の 200 行分割 | 上記と並行可 |
| 4 | task-skill-ledger-B1-gitattributes | B-1: `.gitattributes` の merge=union 適用 | (1)(2) 完了後 |

## 完了条件

- [x] go-no-go.md / main.md 作成
- [x] 判定 GO
- [x] 重複対象の処理順序を確定
- [ ] artifacts.json の Phase 10 を `completed` に更新（Phase 11 進行時に実施）

## 次 Phase

- 次: Phase 11 (手動テスト)
- 引き継ぎ事項: 本 Go 判定書、処理順序、実装タスク起票リスト
