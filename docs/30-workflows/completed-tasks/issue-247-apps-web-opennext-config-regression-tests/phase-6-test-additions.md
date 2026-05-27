# Phase 6 — テスト追加

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 追加テスト

| パス | 種別 | 件数 | 内容 |
|------|------|------|------|
| `apps/web/__tests__/opennext-config-regression.spec.ts` | vitest | 4 it / 1 describe | AC1〜AC4 を 1:1 で検証 |

## 2. 本ファイルの「自己検証」セクション

このタスクでは spec 自体が本体実装である。したがって以下を自己検証として残す。

### 2.1 静的検証

- TypeScript strict（既存 `apps/web/tsconfig.json` 適用）
- ESLint（既存 web ルール）

### 2.2 動的検証（赤化テスト）

Phase 11 で 4 件の drift inject により、各 it が独立に fail することを確認する（Phase 4 §4 参照）。

## 3. テスト方針

- spec は副作用なし（ファイル read のみ）
- assertion メッセージに「どの key/path/line が drift しているか」を含む
- TOML パースは 1 度だけ実行し describe スコープで共有

## 4. ローカル実行

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts --reporter=verbose
```

## 5. DoD

- 4 件 pass
- describe 共有データは const のみ（再代入なし）
