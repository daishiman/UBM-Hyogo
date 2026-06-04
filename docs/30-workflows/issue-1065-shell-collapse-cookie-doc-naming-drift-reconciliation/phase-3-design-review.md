# Phase 3: 設計レビュー

> **[実装区分: 実装仕様書 / NON_VISUAL]** — Phase 4 へ進めるかを判定する。

## 1. レビュー観点と判定

| ID | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-1 | SSOT 方向の妥当性 | PASS | code-primary を正本化（AskUserQuestion 推奨）。consumer・test が既に primary 名のため churn 最小。 |
| R-2 | alias 削除の安全性 | PASS | 3 alias とも `apps/web/src` 0 参照（grep 確認）。削除でビルド/テスト不変。 |
| R-3 | issue 前提誤りの扱い | PASS | `parseShellCollapsedCookie` は値 parser（ヘッダではない）と訂正済み。SSOT 表 + 訂正注記で恒久化。 |
| R-4 | 不変条件 I-6 維持 | PASS | cookie 名/value/属性/Max-Age は無変更。export 名のみ縮約。 |
| R-5 | スコープ単一サイクル性（CONST_007） | PASS | alias 削除 + doc 3 本整合は 1 サイクルで完了。先送り項目なし。 |
| R-6 | doc 整合の網羅性 | PASS | phase-2-design.md / phase-3-design-review.md / implementation-guide.md の 3 本に置換マップを適用。 |

## 2. MINOR 指摘（未タスク化判断は Phase 10/12 で確定）

| ID | 指摘 | 対応方針 |
| --- | --- | --- |
| M-1 | issue-1024 配下の他 phase doc（phase-4/5/6/8/9 等）にも alias 名が散在する可能性 | 当初は「正本対象は AC-1 の設計 doc。残 phase doc は履歴記録で整合必須対象外（不整合許容）」としていたが、SSOT 完遂レビュー（user 決定）で *phase-2-design は整合済なのに残 phase doc は旧名のまま*という内部矛盾が SSOT 目的と衝突するため、本サイクル内で issue-1024 配下の旧名 doc を primary 名へ全整合済み（Phase 12 で実施・grep で dead alias 0 を確認）。 |
| M-2 | `SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS` の doc 表記揺れ | 置換マップに含め同 wave で整合。 |

## 3. ゲート判定

**PASS — Phase 4 へ進む。** MAJOR 指摘なし。M-1/M-2 は MINOR で本サイクル内整合 or Phase 12 判断に委譲。SSOT 方向（code-primary）・削除安全性・不変条件維持の 3 点が確認できたため、テスト計画（Phase 4）へ進行する。
