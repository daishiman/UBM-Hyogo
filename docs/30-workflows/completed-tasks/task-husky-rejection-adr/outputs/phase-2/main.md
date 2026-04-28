# Phase 2: 設計 — outputs main

日付: 2026-04-28

## サマリ

ADR 集約先を `doc/decisions/` に確定し、ADR-0001 のファイル名を `0001-git-hook-tool-selection.md` と決定した。各セクションの記載方針・派生元引用範囲・backlink 追加位置を `design.md` に固定。Phase 3 設計レビューに引き渡せる粒度に整理した。

## 実行結果

- ADR 集約先確定: `doc/decisions/`（新設）
- ファイル命名規約: `NNNN-<slug>.md`（4 桁ゼロ詰め + kebab-case）
- 各セクション記載方針: design.md に表で整理
- backlink 追加位置: Phase 2 design.md ADR ライト表末尾 / Phase 3 review.md 第5節末尾

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/design.md`

## 完了条件チェック

- [x] artifacts.json と outputs 一致
- [x] ADR 集約先確定 + 命名規約明記
- [x] 各セクション記載方針と派生元引用範囲を design.md に列挙
- [x] backlink 追加位置を設計済み
- [x] commit / push / PR を行っていない

## 次 Phase への引き継ぎ

- Phase 3 で AC-1〜AC-6 の設計カバレッジを review.md に表化
- Alternatives Considered の一次資料追跡可能性を Phase 3 で検証
