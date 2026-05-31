# Phase 10: 最終レビュー

**[実装区分: 実装仕様書]**

## レビューチェックリスト

### 要件 trace

| AC | Phase 5 差分 | Phase 6 テスト |
|----|-------------|-------------|
| AC-1 (anchor 1 件) | 差分 2 で 1 件追加 | T1 |
| AC-2 (aria-label / 表示テキスト) | 差分 2 内属性 | T2-T4 |
| AC-3 (最下段配置) | footer 直前に挿入 | T11 |
| AC-4 (admin 9 件 regression) | 差分なし | T5 |
| AC-5 (会員ディレクトリ / 登録 / マイページ) | 差分 1 で「/」のみ削除、他保持 | T6 |
| AC-6 (SignOutButton + props) | 差分なし | T7-T9 |
| AC-7 (Props 互換) | signature 変更なし | typecheck |
| AC-8 (HEX 不在) | tokens のみ使用 | grep gate |
| AC-9 (`*.spec.tsx` 規約) | spec のみ編集 | grep gate |
| AC-10 (typecheck / lint / vitest) | — | QA section |

### 不変条件 trace

- [x] 既存 API 不変（D1 / endpoint 変更なし）
- [x] OKLch トークン正本化
- [x] `*.spec.tsx` 命名規約
- [x] 既存 nav 全 12 項目保持
- [x] SignOutButton 不変
- [x] PII 非露出

### CONST 系チェック

- CONST_004: 実装仕様書として作成（コード変更を伴うため）
- CONST_005: 必須項目（変更ファイル / シグネチャ / 入出力 / テスト / コマンド / DoD）すべて Phase 1〜9 に揃っている
- CONST_007: 1 サイクル / 1 PR で完了。先送りタスクなし

### 残課題

- なし（`SidebarShell` 統一は別 workflow `unified-sidebar-shell-public-and-admin` に既に存在し責務分離済）

## 完了条件

- AC trace 表が 10 件すべて埋まっている
- 不変条件 trace が全 ✓
- 残課題 0 件 もしくは別 workflow への明示的 trace が存在
