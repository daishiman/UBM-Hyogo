# Phase 11 — 証跡取得（Task D: admin サイドバー Google Form 回答編集リンク）

## 正本への導線

本フェーズの証跡正本は **`outputs/phase-11/main.md`** とする。本ファイルは種別判定と
補助ドキュメントへの導線のみを宣言する。

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/main.md` | 主証跡正本（結論 / 証跡の主ソース / TC↔AC マッピング / 実テスト結果 / screenshot 取得計画） |
| `outputs/phase-11/manual-smoke-log.md` | 手動スモーク手順と確認状況（local / staging） |
| `outputs/phase-11/link-checklist.md` | 参照リンク・定数の整合チェック |
| `outputs/phase-11/canonical-paths.json` | Phase 11 evidence canonical path validator 用 manifest |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | **VISUAL**（admin サイドバー nav に項目を 1 件追加する UI 変更を含む） |
| landed | dev へマージ済み（親 PR #1064 / commit `745c95115`） |

## 種別判定の結論

本タスクは admin サイドバー nav へ外部リンク項目（「Form回答 ↗」）を 1 件追加する **VISUAL** 変更である。
したがって本来は screenshot を視覚証跡として取得する。

ただし対象画面（`/(admin)/admin/**`）は **staging 認証（admin ログイン）必須** であり、認証情報を伴う
staging 操作は **user-gated**（ユーザー明示操作が前提）である。よって本フェーズでは:

- **screenshot は取得せず保留（pending / user-gated）とする** ことを正とする。
- **主証跡は `apps/web` の jsdom render unit / 純関数 unit / 定数 unit（自動テスト）** とする。

この two-tier evidence（local test = present / screenshot = pending）の根拠・内訳・取得計画は
`outputs/phase-11/main.md` に記述する。

## 完了条件

完了条件は以下をすべて満たすこと。

1. `outputs/phase-11/main.md` に結論・証跡の主ソース表・TC↔AC マッピング・実テスト実行結果・
   screenshot 取得計画（user-gated）が記載されている。
2. `outputs/phase-11/manual-smoke-log.md` に手動スモーク手順と local / staging の確認状況が記載されている。
3. `outputs/phase-11/link-checklist.md` に定数・リンク整合チェックが記載されている。
4. `outputs/phase-11/canonical-paths.json` が存在し、validator で Phase 11 evidence path を検証できる。
5. 主証跡である 3 つの spec が green であることが main.md に記録されている。
6. screenshot の Status が `pending`（user-gated）であることが明示されている。
