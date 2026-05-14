# Phase 12 — Skill Feedback Report

## テンプレート改善候補

- **[FB-T26-01]** UI MVP recovery 系の "pure className migration" task は Phase 4-7（テスト）が極めて薄くなる。`verify_existing` モード + NON_VISUAL-equivalent（既存 visual baseline 利用）の組合せでも phase 構成は 13 phase 固定なので、空 phase を許容する明示ルールが欲しい。
- **[FB-T26-02]** task-08（SSOT）/ task-09（bridge）/ task-26（consumer）のような 3 層型 token migration の典型パターンを `references/patterns-design-token-migration.md` として汎化する候補。

## ワークフロー改善候補

- **[FB-T26-03]** "ファイル不在時の blocked 判定" を Phase 1 P50 チェックに明示する選択肢を増やす。本 task では task-05 マージ前提のため、P50 で upstream 完了確認を追加。
- **[FB-T26-04]** 視覚 baseline の diff 0 を VISUAL evidence の代替とする判断基準を `phase-template-phase11.md` に明文化（現状は WEEKGRD-03 で NON_VISUAL 宣言のみ）。

## ドキュメント改善候補

- **[FB-T26-05]** design-token consumer の置換マッピング表を Phase 2 必須セクション化する。

## 改善点なし宣言

該当なし（5 件記録）。
