# Phase 8: コードレビュー（self review）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. レビュー観点チェックリスト

### 1.1 不変条件

| # | 観点 | 確認方法 | 期待 |
|---|------|---------|------|
| 1 | 既存 API endpoint surface のみ利用 | mock URL pattern を `member-delete.ts` / `audit.ts` / `members.ts` の既存 path に限定 | OK |
| 2 | D1 直接アクセスなし | spec 内 `D1` / `binding` grep | 0 件 |
| 3 | OKLch 不変条件 | spec 内 `bg-[#` / `text-[#` / `#[0-9a-f]{6}` grep | 0 件 |
| 4 | 既存 fixture 再利用 | `apps/web/playwright/fixtures/` git diff | diff なし |
| 5 | reason 必須 | test #3 内で空 reason 時の disabled + API 到達 0 を assertion。API 422 は backend contract に責務分離 | OK |
| 6 | 期待差分 | `git diff` の対象が E2E spec、SSR fixture gate、Playwright config、削除後UI反映補強に限定 | OK |
| 7 | 決定論性 | mock state を test scope に閉じる | OK |

### 1.2 test 構造

| # | 観点 | 確認 |
|---|------|------|
| 1 | describe 名が route × 動詞 | `/admin/members × delete` |
| 2 | test #1 で 4 ステップ（button → dialog → reason → confirm）を分離 assert | OK |
| 3 | test #3 で UI disabled + API 到達 0、API 422 は backend contract 側 | OK |
| 4 | test #4 で `action='admin.member.deleted'` 文字列検証 | OK |
| 5 | test #5 / #6 で member / anonymous 分岐 | OK |
| 6 | skip = 1 件のみ（cascade preview） | OK |

### 1.3 selector 戦略

| # | 観点 | 確認 |
|---|------|------|
| 1 | `getByRole` / `getByLabel` / `getByText` 優先 | OK |
| 2 | class 名・色値 selector 不在 | OK |
| 3 | 言語依存 selector の OR 表現（日本語/英語） | `/確定\|削除する/` 等で OR |

### 1.4 ドキュメント整合

| # | 観点 | 確認 |
|---|------|------|
| 1 | `// TODO(stage-3)` コメントが Stage 3 ワークフロー path に到達可能 | path を spec 内コメントに明記 |
| 2 | spec 行数 175 | `wc -l` |

## 2. 自己 review 結果記録テンプレート

```text
| 観点 | 判定 | 備考 |
|------|------|------|
| 不変条件 1-7 | OK | — |
| test 構造 1-6 | OK | — |
| selector 戦略 | OK | — |
| ドキュメント | OK | — |
```

## 3. 修正が発生した場合のループ

修正 → Phase 7 §3 静的検証 → Phase 7 §1 単体実行 → 本 Phase に戻る。最大 3 反復（CONST 反復制限）。
