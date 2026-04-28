# Phase 11: NON_VISUAL Smoke Evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| 状態 | 未実行の証跡受け皿 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| screenshot | 不要 |

## 目的

本 design workflow は `.gitattributes` 実編集を行わないため、Phase 11 では派生実装タスクで実行する smoke evidence の受け皿を固定する。ここに書かれた内容は AC-3 GREEN の実証ログではない。スクリーンショットは作成せず、`manual-smoke-log.md` と `link-checklist.md` を必須証跡とする。

## 必須証跡

| ファイル | 役割 |
| --- | --- |
| `manual-smoke-log.md` | 派生実装タスクで実行する `git check-attr` と 2〜4 worktree smoke のログ形式 |
| `link-checklist.md` | 仕様書、runbook、`.gitattributes` セクション、Phase 12 outputs のリンク整合 |

## 完了条件

- `visualEvidence: NON_VISUAL` のため screenshot を作成しない理由が明記されている。
- 派生実装タスクで必要な smoke command と期待値が追跡できる。
- Phase 12 の documentation outputs から本証跡へリンクできる。
