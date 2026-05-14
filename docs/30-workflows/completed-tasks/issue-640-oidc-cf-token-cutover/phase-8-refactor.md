# Phase 8: リファクタリング

> [実装区分: 実装仕様書]

## 1. リファクタリング対象

| 対象 | Before | After | 理由 |
|---|---|---|---|
| `web-cd.yml` の token check step + deploy step | 別々の step で env block を重複定義 | env を再利用するため `composite action` 化を**検討するが本タスクでは保留** | composite action の責務拡張は別 task、今回サイクル外 |
| `redaction-check.sh` の token regex | inline regex | 定数化（変数名 `TOKEN_REGEX`） | 可読性とメンテ性向上 |
| `__tests__` の共通 setup | 各 test に重複 | `setup.sh` を抽出 | テスト追加時の DRY |

## 2. 重複削減

- `__tests__/setup.sh` を作成し、各 test スクリプトから `source` する
- 期待値比較ヘルパ `assert_exit_code` / `assert_grep` を共通化

## 3. navigation drift 確認

- `scripts/redaction-check.sh` から呼ばれるユーティリティなし（独立）
- `scripts/cf.sh` への参照は変更なし

## 4. 削除対象

- なし（純粋な追加と env 階層降格のみ）

## 5. DoD

- [ ] リファクタ後も全テスト GREEN
- [ ] 差分は機能変更を含まない（純粋な構造改善のみ）
