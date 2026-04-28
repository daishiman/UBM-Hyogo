# lefthook-operations.md から ADR-0001 への参照追加 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-lefthook-ops-adr-backlink |
| タスク名 | lefthook 運用ガイドから ADR-0001 への参照追加 |
| 分類 | DevEx / Documentation |
| 対象機能 | Git hook 運用ドキュメントと ADR の双方向リンク |
| 優先度 | Low |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | task-husky-rejection-adr Phase 12 unassigned-task-detection A-2 |
| 発見日 | 2026-04-28 |

## 1. なぜこのタスクが必要か（Why）

ADR-0001（`doc/decisions/0001-git-hook-tool-selection.md`）から `lefthook-operations.md` への参照は確立しているが、運用ガイド側から ADR-0001 への参照が無い。30種思考法レビューの「正本リンクの双方向性」観点で、運用者が hook 方針の設計判断履歴へ辿れるようにする必要がある。本タスクは task-husky-rejection-adr のスコープ外として明示的に分離された残作業。

## 2. 何を達成するか（What）

- `doc/00-getting-started-manual/lefthook-operations.md` の関連リンク節または方針セクションから `doc/decisions/0001-git-hook-tool-selection.md` へ相対リンクを追加する。
- ADR-0001 と運用ガイド間のリンクが双方向で機能することを目視確認する。

## 3. どのように実行するか（How）

1. `lefthook-operations.md` 冒頭または末尾の「参照」「関連リンク」節を確認し、ADR-0001 への相対リンクを追加する。
2. 追加リンクのアンカーテキストは「ADR-0001: Git hook ツール選定（lefthook 採用 / husky 不採用）」のように判断内容が一目で分かる文言にする。
3. ADR-0001 → 運用ガイド、運用ガイド → ADR-0001 の双方向リンクが実在パスで解決することを確認する。
4. ガイド本文の他セクションは原則改変しない（リンク追加のみ）。

## 4. 受入条件

- `doc/00-getting-started-manual/lefthook-operations.md` から `doc/decisions/0001-git-hook-tool-selection.md` への相対リンクが少なくとも1箇所追加されている。
- 追加リンクが実在パスを指し、相対パスとして解決する。
- ADR-0001 の本文は変更しない。
- リンク追加以外の運用方針改変を行わない。

## 5. 含まないもの

- ADR-0001 の本文修正
- ADR テンプレート標準化（task-adr-template-standardization で対応）
- 他 ADR への類似バックリンク追加
- `lefthook.yml` の設定変更

## 6. 苦戦箇所・将来への申し送り（task-husky-rejection-adr 経由）

- ADR の集約先選定で `doc/decisions/` 新設を選んだ判断（既存 `doc/00-getting-started-manual/` 配下案を不採用）の根拠は ADR-0001 Context / Alternatives Considered に記録済み。本タスクではこの方針を踏襲し、リンク方向のみ補完する。
- 双方向リンクは「ADR から運用ガイド」を Phase 5 runbook で先行整備済み。本タスクの追加分は短いが、後続 ADR でも同パターンを踏襲できるよう、リンク文言と挿入位置を後続 ADR の参考にできる粒度で記述すること。
- task-husky-rejection-adr Phase 12 では「記録のみで足りる」と判断していたが、後続 ADR を作る前に双方向化を済ませた方が運用負債が累積しないため formalize した。

## 7. 参照

- `doc/decisions/0001-git-hook-tool-selection.md`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `docs/30-workflows/task-husky-rejection-adr/outputs/phase-12/unassigned-task-detection.md`（A-2 原典）
