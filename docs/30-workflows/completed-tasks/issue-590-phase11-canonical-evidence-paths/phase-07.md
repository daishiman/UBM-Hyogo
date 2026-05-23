# Phase 7: パフォーマンス / セキュリティ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 7 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## パフォーマンス

| 項目 | 評価 |
| --- | --- |
| schema validation 時間 | < 50 ms（manifest 単発検証） |
| 単一 JSON validation | < 10 ms（典型 evidence 5〜10 件） |
| `--check-existence` 時 | I/O 主体、5〜10 件で < 50 ms |
| 全 workflow 一括 validation 想定 | 50 件 × 10 ms = 500 ms 以下 |

非機能要件 NFR-4（< 1s）を満たす。最適化は不要。

## セキュリティ

| 項目 | 評価 / 対応 |
| --- | --- |
| 外部入力 | JSON ファイル path（CLI 引数）のみ。ネットワーク呼び出しなし |
| Path traversal | `path.join(repoRoot, json.workflowDir, item.path)` で結合。`workflowDir` は schema pattern で `docs/30-workflows/...` に制約済み、`path` も `outputs/phase-11/...` に制約済み。`..` を含む値は schema で実質拒否されるが、validator 側で `path.normalize` 後に repoRoot prefix チェックを追加するとより安全 |
| Secret 漏洩 | schema / validator は `.env` / token を読まない。stderr 出力は file path のみ。Token 値の混入経路なし |
| ReDoS | schema の正規表現 `^docs/30-workflows/[A-Za-z0-9._-]+(/...)*$` および `^outputs/phase-11/` は単純な prefix / 文字クラスのため ReDoS リスク低 |
| Prototype pollution | plain JSON parse 後、許可 key のみ検証し追加 key を採用しない |
| 任意コード実行 | なし（commands 文字列を validator は実行しない、文字列として保持するのみ） |

## 追加防御（任意）

```js
// validator 内部で path traversal の二重防御
const abs = path.resolve(base, item.path);
if (!abs.startsWith(path.resolve(base) + path.sep)) {
  console.error(`[${file}] path traversal detected: ${item.path}`);
  process.exit(1);
}
```

実装サイクルで採用するかは Phase 5 実装時に決定（Phase 6 の E-4 / E-15 schema pattern で実質防御済みのため optional）。

## 完了条件

- [x] パフォーマンス見積が記載されている
- [x] セキュリティ評価項目が記載されている
- [x] path traversal の二重防御方針が記載されている

## 成果物

- `outputs/phase-07/main.md`

## 参照資料

- `phase-02.md`（schema pattern 制約）
- `phase-06.md`（異常系）
