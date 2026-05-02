# skill-feedback report

## task-specification-creator

| 項目 | フィードバック |
| --- | --- |
| Phase テンプレートの粒度 | implementation / NON_VISUAL / small で 13 phase は妥当。小規模スクリプトでは Phase 1〜2 を `phase-01-02` 統合する選択肢もあると軽量化できる |
| AC × TC matrix | Phase 4 と Phase 6 で TC 番号空間 (TC-01..06 / TC-07..12) を分けたのは追跡しやすかった |
| redaction 不変条件の表現 | 「stdout / stderr 両方を redact」「一時ファイル禁止」「on-memory のみ」の 3 点を C-2 / C-6 / C-7 で複数箇所に分散して書くより、redaction-policy.md の 1 箇所に集約する方が運用上明瞭 |
| 苦戦箇所 | macOS BSD sed と GNU sed の文字クラス挙動差 (`[^/?...]` の `?` 解釈) で R-03 が初回失敗した。次回は文字クラスを最小化し、`[^/[:space:]]+` のように POSIX class のみで構成する design hint を Phase 2 に書いておくと再発防止になる |

## 改善案
- `redaction-rules.md` に「regex は POSIX class のみ。bracket expression 内に `?` を入れない」を design rule として追加する
- Phase 9 quality gate に shellcheck を含めるか CI 整備状況を明示する
