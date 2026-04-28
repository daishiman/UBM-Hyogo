# Phase 8 — リファクタリング（サマリ）

## Status
done

> docs-only / NON_VISUAL / spec_created タスクのため、本 Phase の「リファクタリング」は
> **コード差分の整理ではなく、文書・章立て・参照関係の整理**を意味する。
> コード実装は別タスクで行う前提（Phase 1 §1）を踏襲する。

## 1. 目的

- 初稿で重複していた記述（branch protection と auto-rebase / pr-target safety gate に
  またがる permissions 記述、status check 命名の再掲など）を統合し、単一情報源に集約する。
- ナビゲーション drift（index.md / artifacts.json / phase-XX.md / outputs/phase-N/main.md
  の参照ずれ）を解消する。

## 2. 対象範囲

| 対象 | 種別 | 取り扱い |
| --- | --- | --- |
| design.md §2/§3 の重複キー | 章内重複 | 差分表に集約（§3 を main 差分として明示済） |
| permissions 記述（auto-rebase ＋ pr-target） | 横断重複 | 共通方針を §1 (status check) と並ぶ前提として整理 |
| status check 名 | 章間重複 | §1 を単一情報源、他章は §1 を参照する形に統一 |
| index.md Phase 表 | ナビ | artifacts.json と表記同期 |
| outputs/artifacts.json | ナビ | リポジトリ直下 artifacts.json と parity 維持 |

## 3. 結果サマリ

| 項目 | 結果 |
| --- | :-: |
| 重複統合（branch protection × auto-rebase 権限記述） | 完了 |
| 単一情報源化（status check 命名 = design.md §1） | 完了 |
| index.md ⇄ artifacts.json の Phase 表同期 | 整合 |
| phase-XX.md ⇄ outputs/phase-N/ の参照 | 整合 |
| ナビゲーション drift | 検出 0 件 |

詳細な before/after は `before-after.md` に記載。

## 4. Phase 9 への申し送り

- Phase 9 品質ゲートで「artifacts parity（artifacts.json と outputs/artifacts.json）」と
  「index.md の Phase 表 ⇄ artifacts.phases」の同期を再検証すること。
- mirror parity（`.claude` vs `.agents`）は本タスクの対象外（コード/skill 配備を伴わない
  docs-only タスクのため）→ Phase 9 で N/A 明記。
