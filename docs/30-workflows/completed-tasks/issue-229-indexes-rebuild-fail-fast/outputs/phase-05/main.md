# Phase 5 成果物: 実装ランブック

## 新規作成 / 修正ファイルパス一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 修正 | atomic helper / decisive log / silent catch 分離 / CLI ガード / export 化 |
| `scripts/__tests__/generate-index-fail-fast.spec.ts` | 新規 | TC-01〜TC-07 回帰 spec（root vitest glob） |

> 上記 2 件以外は変更しない。`indexes/` は byte-identical 維持。hook / CI / verify-pr-ready は回帰確認のみ（編集なし）。

## 実装ステップ（Before/After 方針・実コードは今回サイクル）

| Step | 対象 | Before | After（方針） | TC |
| --- | --- | --- | --- | --- |
| 1 | top-level `main().catch` | import で即実行 | `if (import.meta.url === pathToFileURL(process.argv[1]).href)` で囲む + 純粋関数を named export | TC-06 |
| 2 | `writeFile(topic-map)` / `writeFile(keywords)` | 逐次・非 atomic | `writeFileAtomic`（tmp→rename）+ `writeAllIndexesAtomic`（全 tmp 成功後 commit / finally で残存 tmp 削除） | TC-01 / TC-02 |
| 3 | top-level catch ログ | `console.error("エラー:", err.message)` | `[generate-index] aiworkflow-requirements / <index> (<step>) 失敗: <message>` を throw / stderr 出力 + exit 1 | TC-03 |
| 4 | `extractHeadings` catch | `catch { return []; }` | ENOENT は `[]` 継続 / その他は context 付き throw | TC-04 / TC-05 |
| 5 | 新規 spec + byte-identical | — | spec 作成 + `pnpm indexes:rebuild && git diff --quiet -- indexes` exit 0 | TC-07 |

## コミット粒度

| # | メッセージ |
| --- | --- |
| 1 | `refactor(generate-index): add CLI guard and export pure functions for testability (#229)` |
| 2 | `fix(generate-index): atomic all-or-nothing index write to prevent partial output (#229)`（decisive log 同梱可） |
| 3 | `fix(generate-index): separate ENOENT skip from other I/O throw in extractHeadings (#229)` |
| 4 | `test(generate-index): add fail-fast / atomic / decisive log regression spec (#229)` |

> revert は 1 コミット粒度。byte-identical のため revert しても index に差分なし。

## ローカル検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts
mise exec -- pnpm indexes:rebuild
git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes && echo "drift 0 OK"
```

## 委譲境界

実コード適用・コミット作成は今回の実装サイクル。本ワークフローは仕様化までで完了。
