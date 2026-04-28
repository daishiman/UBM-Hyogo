# Phase 2 — 設計（サマリ）

## Status
done

## 1. 位置づけ

Phase 1（`outputs/phase-1/main.md`）で確定したスコープ・受入条件・横断依存に基づき、
**草案** として以下を `design.md` に詳細化する。実装（GitHub への適用・YAML/JSON ファイルのリポジトリ投入）は **別タスク**。

## 2. 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-2/main.md` | 本サマリ |
| `outputs/phase-2/design.md` | branch protection（main/dev）／ squash-only ／ auto-rebase ／ pull_request_target safety gate の設計本体（JSON/YAML 抜粋付き草案） |

## 3. 設計トピック一覧

1. main / dev の branch protection 設定項目と差分
2. squash-only マージポリシー（repository setting 側 + protection 側 の二層）
3. 必須 status check の命名（apps/web / apps/api / shared を区別）
4. auto-rebase workflow（`pull_request` の labeled トリガー、最小 permissions、concurrency）
5. `pull_request_target` safety gate（PR code 実行を `pull_request` workflow へ分離・checkout ref 固定・secrets 非露出）
6. dev=1名 / main=2名 レビュアー差異
7. feature → dev → main の状態遷移図

## 4. 完了条件

- [ ] design.md に上記 7 トピックがすべて記載されていること。
- [ ] Phase 1 の AC-1〜AC-7 すべてに対応する記述箇所が `design.md` 内で参照可能であること。
- [ ] 草案 JSON/YAML はコードブロックで提示し、`*.draft` のラベルを付与すること（実体ファイル投入は本タスクの範囲外）。

## 5. 引用（Phase 1 → Phase 2）

- 真の論点（Phase 1 §2）を design.md §0 で再掲する。
- アーティファクト命名（Phase 1 §7）を design.md のコードブロック見出しと一致させる。
- 横断依存（Phase 1 §6）を design.md §8 で再確認し、Phase 3 のレビュー対象とする。
