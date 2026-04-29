# Phase 5 Output: 実装（比較表本体の作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 |
| 下流 | Phase 6（テスト拡充） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ — 採用方針

**採用案: ハイブリッド（案 B を default、案 A を fresh 環境補強の fallback）**

| 順位 | 案 | 採否 | 根拠 |
| --- | --- | --- | --- |
| 1（採用） | ハイブリッド | ACCEPT | Phase 3 R-2 で案 B 単独再発が判定され、R-5 でハイブリッド格上げ |
| 2 | 案 B（project-local-first） | ACCEPT（次点） | `scripts/new-worktree.sh` テンプレ配置を組み込めば再発抑制可能 |
| 3 | 案 A（global + alias 強化） | CONDITIONAL ACCEPT | 影響半径が広く、`--dangerously-skip-permissions` の deny 実効性が `task-claude-code-permissions-deny-bypass-verification-001` 結果待ち |

> 注: alias 強化（`--dangerously-skip-permissions`）は deny 実効性確認後にのみ採用する条件付き。未着の場合はハイブリッドの「fallback 部」から除外し、global の `defaultMode` 変更のみとする。

## 1. spec_only 文脈での「実装」

本タスクは `spec_only / docs-only / NON_VISUAL` のため、「実装」は **比較表本体（4 層責務表 / 3 案 × 5 軸 / rollback 手順 / ハンドオフ箇条書き）の Markdown 生成** を指す。実 settings / shell alias の書き換えは禁止。書き換えは `task-claude-code-permissions-apply-001` で実施する。

## 2. 章立て（`comparison.md` の構成）

| Section | 内容 | 紐付け AC |
| --- | --- | --- |
| Section 1 | 4 層責務表（Phase 2 D-1 集約） | AC-1 |
| Section 2 | project-local-first 再発判定（Phase 3 R-2 集約） | AC-2 |
| Section 3 | 3 案 × 5 軸比較表（評価値入り） | AC-3, AC-7 |
| Section 4 | global 採用時 rollback 手順（コマンド列） | AC-5 |
| Section 5 | 他プロジェクト副作用一覧 | AC-6 |
| Section 6 | 採用方針確定とハンドオフ箇条書き | AC-4, AC-9 |

## 3. 採用案決定の根拠ロジック

```
入力:
  - Phase 3 R-2: project-local-first 単独で fresh 環境再発する
  - Phase 3 R-3: global 変更の他プロジェクト副作用は CONDITIONAL ACCEPT
  - 環境ブロッカー: deny 実効性（task-claude-code-permissions-deny-bypass-verification-001）未確認

判定ロジック:
  IF R-2 = "再発する" THEN
    案 B 単独は不可
    IF R-3 = "ACCEPT" AND deny 検証 = "PASS" THEN
      ハイブリッド（B default + A 全要素 fallback）を採用
    ELSE IF R-3 = "ACCEPT" AND deny 検証 = "未着" THEN
      ハイブリッド（B default + A の global 変更のみ fallback、alias 強化は除外）を採用
      ↑ 本タスクの最終決定
    ELSE
      案 B + scripts/new-worktree.sh テンプレ配置（apply タスクへ）
```

## 4. ハンドオフ宣言

`task-claude-code-permissions-apply-001` への申し送り:

1. 採用案: ハイブリッド（B を default、A の global 変更のみ fallback）
2. alias 強化（`--dangerously-skip-permissions` 追加）は **deny 実効性確認後の追加タスク** として保留
3. 本タスク outputs（特に `comparison.md` Section 4 / 5）を apply タスク指示書の「参照」欄に追記する依頼を Phase 12 に残す
4. `scripts/new-worktree.sh` への `.claude/settings.local.json` テンプレ配置は未タスク化候補として記録（Phase 12 `unassigned-task-detection.md`）

## 5. 修正対象ファイル一覧

| 種別 | パス | 操作 | 担当 |
| --- | --- | --- | --- |
| 新規 | `outputs/phase-5/main.md` | Phase 5 実装ログ | 本タスク |
| 新規 | `outputs/phase-5/comparison.md` | 比較表本体（Section 1〜6） | 本タスク |
| 参照のみ | `~/.claude/settings.json` | 現状値読み取りのみ（書き換え禁止） | - |
| 参照のみ | `<project>/.claude/settings.local.json` | 現状値読み取りのみ（書き換え禁止） | - |
| 書き換え対象 | （上記 settings / `~/.zshrc`） | apply タスクで実施 | `task-claude-code-permissions-apply-001` |

## 6. 完了条件チェック

- [x] 4 層責務表が `comparison.md` Section 1 に存在
- [x] 3 案 × 5 軸の比較表が完成（Section 3）
- [x] global 採用時 rollback 手順がコマンドレベルで記述（Section 4）
- [x] 他プロジェクト副作用への言及（Section 5）
- [x] 採用方針が 1 案に確定し、apply タスクへのハンドオフ箇条書きが記載（Section 6）
- [x] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 7. 注意事項（再掲）

- 平文 `.env` を `cat` / `Read` しない
- API token / OAuth トークン値を比較表 / 決定ログに転記しない
- `wrangler` 直接実行を勧めない（`scripts/cf.sh` 経由）
- 実 `~/.claude/settings.json` / `~/.zshrc` への書き換えは禁止（apply タスクで実施）

## 8. 次 Phase へのハンドオフ

- Phase 6: TC-F-01 / TC-F-02 / TC-R-01 / TC-R-02 で fail path / 回帰 guard を追加
- Phase 7: AC × 成果物 × 充足判定のトレース表を作成
- Phase 11: TC-01〜TC-04 の手動レビューで PASS/FAIL を `manual-smoke-log.md` に記録
- Phase 12: 採用案を `implementation-guide.md` Part 2 に転記、apply タスクへの参照欄追記依頼を `documentation-changelog.md` または `unassigned-task-detection.md` に内包

## 9. 参照資料

- `phase-05.md`
- `outputs/phase-2/`（D-1 / D-2）
- `outputs/phase-3/main.md` / `impact-analysis.md`
- `outputs/phase-4/test-scenarios.md`
