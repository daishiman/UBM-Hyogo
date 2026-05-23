# Phase 12 — Skill Feedback Report

## テンプレート改善候補

- **[FB-T26-01]** UI MVP recovery 系の "className migration" task は Phase 4-7（テスト）が薄くなりやすい。`verify_existing` モードでも実 UI surface を変更する場合は Phase 11 screenshot 要否を早期判定する明示ルールが欲しい。
- **[FB-T26-02]** task-08（SSOT）/ task-09（bridge）/ task-26（consumer）のような 3 層型 token migration の典型パターンを `references/patterns-design-token-migration.md` として汎化する候補。

## ワークフロー改善候補

- **[FB-T26-03]** "ファイル不在時の blocked 判定" を Phase 1 P50 チェックに明示する選択肢を増やす。本 task では task-05 マージ前提のため、P50 で upstream 完了確認を追加。
- **[FB-T26-04]** downstream 視覚 baseline を「実測済み代替証跡」と誤記しない判断基準を `phase-template-phase11.md` に明文化する。

## ドキュメント改善候補

- **[FB-T26-05]** design-token consumer の置換マッピング表を Phase 2 必須セクション化する。

## Routing result

| Feedback | Result |
| --- | --- |
| FB-T26-01 | no-op: existing workflow-state vocabulary and `verify_existing` mode cover this case |
| FB-T26-02 | no-op: pattern候補として記録するが、skill化は複数事例蓄積後 |
| FB-T26-03 | no-op: current topology / stale path gate は既存 skill feedback で正本化済み |
| FB-T26-04 | local対応済み: task-26 は VISUAL として Phase 11 screenshot を保存。task-18 は downstream gate |
| FB-T26-05 | completed locally: Phase 2 / implementation-guide の mapping table に反映済み |

## 改善点なし宣言

skill 正本の同一 wave 変更は不要。上記 5 件は local workflow evidence または no-op routing として処理済み。
