# Phase 10: 最終レビュー

実装区分: ドキュメントのみ仕様書

## レビュー観点（最終）

### 1. 仕様正本としての完備性

| 項目 | 確認 |
| --- | --- |
| 章立て §1〜§12 全て存在 | Phase 9 AC-2 |
| 3 テーマ全 token 値が転記 | Phase 9 AC-3 |
| 60+ token | Phase 9 AC-4 |
| JSON valid | Phase 9 AC-5 |
| sRGB fallback | Phase 9 AC-6 |
| Tailwind v4 `@theme inline` | Phase 9 AC-7 |
| dark mode placeholder | Phase 9 AC-8 |
| zone alias | Phase 9 AC-9 |
| cross-check 0 欠落 | Phase 9 AC-10 |
| markdown lint | Phase 9 AC-11 |

### 2. 下流契約整合（最終確認）

| 下流 | 期待 | 確認方法 |
| --- | --- | --- |
| task-09 | `tokens.css` / `globals.css` テンプレが §10 に提示済み | 目視 + grep |
| task-10 | `--ubm-*` 全 token が §2 / §3.4 / §4〜§8 で参照可能 | grep |
| task-18 | input 契約が §6.3 / §6.2 に文書化 | 目視 |

### 3. 親 workflow scope 規律

`SCOPE.md §6` に基づき、`git diff --name-only main...HEAD` が以下の 2 パターンのみで構成されるか確認:

```
docs/00-getting-started-manual/specs/09b-design-tokens.md
docs/30-workflows/task-08-w2-design-tokens-doc/**
```

範囲外への混入があれば `git checkout HEAD -- <path>` で復旧する。

### 4. 文書品質

| 観点 | 確認 |
| --- | --- |
| 読み手（task-09 / 10 / 18 担当者）が単独で理解可能 | §1 で本ファイルの位置づけを明示 |
| 規範文（"…する") が論点ごとに 1 文以上ある | §3.2 / §3.3 / §1.1 |
| 値の出典が明確（`styles.css` L番号） | §3.4 表の `source` 列 |
| 改訂履歴が §12 に記述 | grep `^## 12` |

### 5. 不変条件最終確認

`SCOPE.md §3` 不変条件 1〜4:

| 不変条件 | 守られているか |
| --- | --- |
| #1 既存 API のみ接続 | 該当なし（API 接続なし） |
| #2 OKLch トークン正本化 | 本ファイルが正本 ✓ |
| #3 プロトタイプ正本順位 | プロトタイプ values をそのまま転記 ✓ |
| #4 D1 直接アクセス禁止 | 該当なし ✓ |

## レビュー結論テンプレ

```markdown
## レビュー結論

- 仕様正本完備性: PASS（AC-1〜AC-11 全 PASS）
- 下流契約整合: PASS（task-09 / 10 / 18 すべて参照可能）
- diff scope 規律: PASS（範囲外 0 件）
- 文書品質: PASS
- 不変条件: PASS

Phase 11 へ進む。
```

## 完了条件

- [ ] 5 観点全て PASS
- [ ] レビュー結論が `outputs/phase-10/review-result.md` に記録
- [ ] 範囲外 diff が 0 件
