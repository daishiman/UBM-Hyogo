# Phase 11: 手動テスト

## 11.1 NON_VISUAL 分類

YAML 設定変更のみ。UI スクリーンショット不要（visual_category: NON_VISUAL）。

## 11.2 手動検証手順

実装完了後、コミット前に以下を順次実行する。

### Step 1: 静的検証

```bash
bash scripts/verify-workflow-top-level-permissions.sh
```

期待出力: `All workflows declare top-level permissions`

### Step 2: 構造 diff レビュー

```bash
git diff dev -- .github/workflows/ | head -200
```

確認項目:
- 各 workflow に `+permissions:` `+  contents: read` のみが追加されている
- グループ B の workflow に `-` 行（削除）が出ていない（コメント先頭の `---` ヘッダーを除く）

### Step 3: actionlint（任意）

```bash
# local 導入済みの場合
./actionlint -color .github/workflows/*.yml
# 未導入時は CI gate に委ねる
```

### Step 4: CI 上の検証

PR push 後、以下の required check が green であることを確認:
- `ci / actionlint`（既存）
- `pr-build-test / *`（既存）
- 各 workflow 自身の job が新たに red にならないこと

## 11.3 evidence 保存

`outputs/phase-11/` ディレクトリに以下を保存:
- `verify-script-output.txt`（Step 1 の stdout）
- `workflow-diff.txt`（Step 2 の `git diff` 抜粋）

スクリーンショット evidence は不要（NON_VISUAL）。
