# Phase 3: 設計レビュー

## 1. 設計妥当性チェック

| 観点 | 評価 | 根拠 |
|---|---|---|
| Single Responsibility | ◎ | adapter のドキュメント整備 1 責務のみ。コード本体には触れない |
| 不変条件維持 | ◎ | visibility filter / unknown kind silent skip / pure function / sanitize literal 除外 はすべて README に明文化される |
| 拡張順序の正当性 | ◎ | zod → fixture → spec → adapter → primitive の順は「破壊範囲が広い順」で red→green TDD と整合 |
| 元 one-pager との整合 | ◎ | unassigned-task の one-pager にある 5 ステップを README に反映、責務 mapping は 8 ケースに合わせて拡張 |
| primitive 別 PR の根拠 | ○ | primitive 拡張は props 型 breaking のリスクが高いため adapter PR と分離（serial-06 親仕様の方針と一致） |

## 2. 代替案検討

### 代替 A: README ではなく `apps/web/src/lib/adapters/EXTENSION.md` 別ファイル

- 却下理由: ディレクトリの「玄関」は README が慣習。検索性・初見導線で劣る。

### 代替 B: spec template を別ファイル `member-detail.spec.template.ts` に切り出す

- 却下理由: コピペ起点として spec ファイル末尾が最も視認性が高い。別ファイルは「探す」コストが発生する。

### 代替 C: 拡張順序を `adapter → spec → fixture → zod → primitive` にする（コード優先）

- 却下理由: spec ケース 1 で fixture self-validation が走るため、fixture と zod を先に同期しないと spec 全体が即落ちる。red phase が成立しないため不採用。

## 3. リスク

| ID | リスク | 対応 |
|---|---|---|
| R-1 | spec ファイル末尾コメントが将来「実コードだと誤読」される | `// === EXTENSION TEMPLATE ===` / `// === END EXTENSION TEMPLATE ===` で明示的に囲み、README から参照する |
| R-2 | README の責務 mapping 表が実 spec ケース順とズレる | Phase 5 で spec を再度開いて `it(...)` の登場順と突き合わせ確認する |
| R-3 | unassigned-task one-pager の削除で stale 参照が発生 | Phase 5 で現 workflow 配下を除外した `rg` を実行し、外部 stale 参照を 0 件にする |
| R-4 | 将来 adapter が増えた時に README 構造が陳腐化 | 「現在の adapter」セクションをリスト化し、増えたら追記する設計にする（本 PR では `member-detail.ts` のみ列挙） |

## 4. レビュー結論

設計を承認。Phase 4 のテスト計画に進む。
