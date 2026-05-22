# Phase 3 — 設計レビュー

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 名前 | 設計レビュー |
| 状態 | spec_created |
| 依存 | Phase 2 |
| 入力 | outputs/phase-02/{api-design,service-design,ui-design}.md |
| 出力 | outputs/phase-03/design-review.md |

## 目的

Phase 2 で確定した設計を Phase 4 (RED テスト) に進める前に GO / NO-GO 判定する。
依存・リスク・整合性を 1 ファイルにまとめ、Gate-A の evidence にする。

## タスク

- [ ] Phase 4 進入判定（GO / NO-GO）を明文化する
- [ ] 親タスク UT-07C との依存（単一 add/remove + audit_log 既実装）を整合確認する
- [ ] リスクを列挙する
  - D1 batch 部分失敗時の commit semantics（dry-run は副作用なし保証、commit は全行 preflight ok の場合のみ insert）
  - audit_log の count 整合性（成功行 = audit_log row 数）
  - papaparse 追加による bundle size 影響
  - 500 行上限超過時のクライアント側 UX（413 受信時の表示）
- [ ] CLAUDE.md 不変条件 5（apps/web から D1 直接アクセス禁止）への整合確認
- [ ] 既存 UT-07C endpoint surface への影響（破壊的変更なし）を確認する

## 成果物

- `outputs/phase-03/design-review.md`
  - GO / NO-GO 判定
  - 依存マトリクス
  - リスクと緩和策
  - Gate-A 通過判定根拠

## 完了条件

- GO 判定が明文化されている
- 全リスクに緩和策が紐づいている
- 親タスク状態との整合が示されている

## 注意点 / リスク

- ここで NO-GO が出た場合は Phase 2 に戻る（Phase 4 以降に進まない）
- Gate-A の `evidence_path` は本ファイルではなく `outputs/phase-03/design-review.md` を指す
