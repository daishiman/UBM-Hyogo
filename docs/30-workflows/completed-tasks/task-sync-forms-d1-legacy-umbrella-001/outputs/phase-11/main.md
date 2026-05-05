# Phase 11 成果物: 手動 smoke（docs-only / NON_VISUAL 縮約）

## サマリ

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` の docs-only タスクとして、screenshot を作らず（false green 防止）、代替証跡 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）＋ NON_VISUAL evidence bundle で Phase 11 を閉じる。本タスクの主証跡は以下:

1. `audit-unassigned-tasks.js` の current violations 0
2. `rg` による stale path / Sheets API / `sync_audit` / 単一 `/admin/sync` / conflict marker の確認（`sync_audit` / 単一 endpoint は follow-up 化）
3. 責務移管表（Phase 02 `responsibility-mapping.md`）の rendering / リンク先到達確認
4. `git diff --stat` による影響範囲が docs / aiworkflow-requirements index に限定され、apps/ packages/ 変更がないこと

## テスト方式

| 項目 | 値 |
| --- | --- |
| 方式 | NON_VISUAL / docs walkthrough |
| 発火条件 | `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` |
| screenshot | **作成しない**（docs-only / spec_created のため、false green 防止） |
| runtime smoke | **不要**（runtime コードなし、HTTP 呼出なし、UI 変更なし） |

## 必須 outputs

| ファイル | 役割 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md`（本ファイル） | テスト方式 / 発火条件 / 必須 outputs index | 生成 |
| `outputs/phase-11/manual-smoke-log.md` | 実行コマンド / 期待結果 / 実結果テーブル | 生成 |
| `outputs/phase-11/link-checklist.md` | 参照元 → 参照先 / 状態テーブル | 生成 |
| `outputs/phase-11/manual-evidence-bundle.md` | NON_VISUAL evidence bundle | 生成 |

## ウォークスルーシナリオ

| シナリオ | 内容 | 期待結果 |
| --- | --- | --- |
| W-1 | 旧 UT-09 ファイル冒頭から legacy umbrella 表記を確認 | `legacy umbrella (closed)` 表記が存在 |
| W-2 | 本タスク `index.md` から 03a / 03b / 04c / 09b / 02c の各 `index.md` への参照リンクを順に踏む | すべて到達可能 |
| W-3 | `outputs/phase-02/responsibility-mapping.md` を開き responsibility 表が direct 残責務 0 件で結ばれていることを確認 | direct 残責務行 = 0 件 |
| W-4 | `audit-unassigned-tasks.js --target-file ...` を実行し violations 0 を確認 | violations 0 |
| W-5 | `rg` で stale 表記 / conflict marker を確認 | conflict marker 0 件。stale references hit は follow-up 化 |
| W-6 | `git diff --stat` で本ブランチの差分範囲を確認 | docs / aiworkflow-requirements のみ、apps/ packages/ 変更なし |

## 発見事項のリアルタイム分類

| 重大度 | 取扱い |
| --- | --- |
| Critical | Phase 12 進行を停止し、対象 phase の outputs を再生成 |
| Major | `manual-smoke-log.md` に記録、Phase 12 documentation-changelog に反映 |
| Minor | log 記録のみ、後続タスクで対応 |

## エビデンス / 参照

- `.claude/skills/task-specification-creator/references/phase-template-phase11.md` § docs-only / NON_VISUAL 縮約テンプレ
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
- `outputs/phase-09/main.md`（品質ゲート）
- `outputs/phase-10/go-no-go.md`（GO 判定）

## AC トレーサビリティ

| AC | Phase 11 での扱い |
| --- | --- |
| AC-10 / AC-11 | W-4（audit）で再確認 |
| AC-12 | W-5（rg stale path）で再確認 |
| AC-13 | W-2 + W-3 でリンク到達確認、specs 参照の整合 |
| 全 AC 共通 | manual-smoke-log.md / link-checklist.md / manual-evidence-bundle.md に統合記録 |

## 次 Phase（12 ドキュメント更新）への引き渡し

1. manual-smoke-log の PASS / ACTION REQUIRED 結果一覧
2. link-checklist の到達確認済み参照
3. manual-evidence-bundle の章立て（NON_VISUAL）
4. 発見事項分類（Critical / Major / Minor）と follow-up task
