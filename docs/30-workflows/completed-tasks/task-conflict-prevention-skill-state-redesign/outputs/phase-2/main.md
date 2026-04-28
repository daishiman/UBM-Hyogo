# Phase 2 成果物: 設計サマリー（index）

Phase 1 の FR / NFR を 4 つの設計成果物に落とし込んだ。本ファイルはそのインデックス。

## 設計の要

| 施策 | 中核設計 | 解消する衝突 |
| --- | --- | --- |
| A-1 | 自動再生成可能な index / metadata を `.gitignore` 化 | 同一 JSON key の値競合（`totalKeywords` 等） |
| A-2 | append-only ledger を「1 entry = 1 fragment」へ転換 | 同一 EOF 位置への追記競合 |
| A-3 | `SKILL.md` を 200 行未満の index にし `references/<topic>.md` へ分離 | 肥大 entrypoint の近接行編集競合 |
| B-1 | 行独立 Markdown に限定して `merge=union` を適用 | A-2 移行前・移行不可ファイルの暫定救済 |

## サブドキュメント

| ファイル | 内容 | カバー AC |
| --- | --- | --- |
| `file-layout.md` | A-1〜B-1 の対象 path・before/after・変更種別 | AC-1 |
| `fragment-schema.md` | A-2 fragment 命名 regex / front matter / nonce 設計 | AC-2 |
| `render-api.md` | `pnpm skill:logs:render` CLI 仕様・入出力・副作用なし | FR-3, NFR-2 |
| `gitattributes-pattern.md` | B-1 適用対象 glob・除外規則・解除条件 | AC-4 |

## 設計判断ログ

1. **fragment ディレクトリ構造**: フラット `LOGS/` を採用（年月階層は fragment 数 < 1k なら不要・render は O(N) 保証）
2. **render 出力**: 既定は stdout、`--out` は明示指定時のみ。git 管理外 path 強制
3. **SKILL.md 分割粒度**: 役割別（usage / triggers / integration / glossary）。章別だと相互参照が増える
4. **`.gitattributes` glob**: `.claude/skills/**/LOGS.md` のように skill 配下のみ。リポジトリ全体への副作用を回避

## Phase 3 への引き継ぎ

- 4 成果物を観点別（影響範囲・後方互換・並列正当性・運用性）でレビュー
- 既存 `LOGS.md` 555 行 / `SKILL-changelog.md` 310 行 の history 保持方針を確定
- `task-specification-creator/SKILL.md` 511 行 の分割案が AC-3（200 行未満）を満たすことを確認
