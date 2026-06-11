# Phase 3: 設計レビュー

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 判定: **PASS（Phase 4 へ進行可）**

## 目的

Phase 2 の設計が 4 条件（価値性 / 実現性 / 整合性 / 運用性）と CONST_005 を満たし、Phase 4（テスト計画）へ進めるかを判定する。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点 | PASS | 「非エンジニア運営者が読めない（英語/技術語）＋情報設計が崩れている（はみ出し/横長）」を 4 concern に分解。すべて apps/web 表現層に閉じる |
| 依存関係・責務境界 | PASS | glossary は末端 utility。コンポーネントは stateless。API 契約不変。循環依存なし |
| 価値とコストの均衡 | PASS | 新規ファイルは glossary 1 つ＋テスト 4 つのみ。新規 CSS/プリミティブ 0。コスト最小で 4 concern を解消 |
| 改善優先順位 | PASS | C1-C5 は独立で並行実装可能。glossary（C5）が C1/C3/C4 の前提のため最初に実装 |
| 4 条件 | PASS | 下記 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 非エンジニア運営者の「読めない/見にくい」コストを下げる。対象は明確（ダッシュボード 6 コンポーネント） |
| 実現性 | PASS | 1 サイクル・1 PR・apps/web 表現層のみ。新規 5 / 編集 8 ファイル。実装可能な厚み |
| 整合性 | PASS | API 契約・トークン・既存テスト契約（aria-label/HEX/audit リンク/axe）を維持。命名は既存 glossary パターンに整合 |
| 運用性 | PASS | glossary SSOT 化で将来のラベル追加が一元管理。fallback で未登録コードも壊れない。RES-1 として audit 画面にも同 SSOT を適用済み |

## 設計上のリスクと対策

| リスク | 対策 | 反映先 |
| --- | --- | --- |
| 新規 BEM クラスの CSS 実体欠如で視覚崩壊（`admin-meetings` の教訓） | Tailwind utility + 既存 `.ui-card` のみ。新規クラス 0 | Phase 2 §4 / Phase 5 |
| StatusDistribution の testid/aria 変更で既存 spec が落ちる | `aria-label` は維持、`status-distribution-chart`→`status-distribution-list` の spec 更新を Phase 6 に明記 | Phase 6 |
| RecentActionsTable のテーブル→リスト化で既存 spec（tbody 行数）が落ちる | `recent-action-item` testid で件数 assert に更新。`/admin/audit` リンク・axe は維持 | Phase 6 |
| 存在しないトークン参照（`surface-subtle`） | grep 確認済み。`--ubm-color-bg` を採用 | Phase 2（確定済） |
| 未登録 action/targetType の情報欠落 | fallback で raw 文字列を返す（握り潰さない） | Phase 2 glossary |

## CONST_005 必須項目の充足確認（設計時点）

| 項目 | 充足 | 参照 |
| --- | --- | --- |
| 変更対象ファイル一覧（新規/編集/削除） | ✅ | Phase 1 inventory / Phase 5 |
| 関数・型・モジュールのシグネチャ | ✅ | Phase 2 glossary コード |
| 入力・出力・副作用 | ✅ | Phase 2 §入出力 |
| テスト方針 | ✅ | Phase 4 / Phase 6 |
| ローカル実行・検証コマンド | ✅ | Phase 7 / Phase 9 |
| DoD | ✅ | Phase 10 |

## 統合テスト連携

- 設計レビューで確定したリスク対策（既存テスト契約維持・testid 更新方針・トークン確定）は Phase 4/6 のテスト設計に反映する。

## 成果物

- 本ファイル（設計レビュー）: レビュー観点判定、4 条件評価、設計リスクと対策、CONST_005 充足確認、進行判定。

## 結論

設計は 4 条件・CONST_005 を満たす。Phase 4（テスト計画）へ進行する。
