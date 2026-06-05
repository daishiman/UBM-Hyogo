# Skill Feedback Report — issue-1078

状態: `implemented_local_evidence_captured`。改善点なしでも出力必須のため記録する。

## テンプレート改善

- **[FB-1078-01] 旧 issue の contract drift 検出を Phase 1 inventory に明文化したい**: 元 issue が
  cosmetic UX を主問題に置いていたが、実コードでは依存先 API（#1035）の応答 shape 変更で client
  fetch が壊れていた。「issue が古い場合、依存先 endpoint の応答 shape を実コードで突合する」を
  Phase 1 P50 チェックの推奨項目に加えると、similar な runtime contract 破綻の早期発見に有効。

## ワークフロー改善

- **[FB-1078-02] テスト mock の API 形 parity チェック**: `BulkActionBar.spec.tsx` の fetch mock が
  実 API 形（`{total,items}`）ではなく client の誤った前提（`{available}`）を mirror していたため、
  テスト緑のまま runtime 破綻を隠蔽していた。「component が叩く endpoint の実 response schema と
  test mock の shape を突合する」guard を Phase 4/9 のチェックに加える価値がある。

## ドキュメント改善

- **[FB-1078-03] ワークツリー path 事故の再発防止**: 仕様書 backbone を絶対パスで Write する際、
  ワークツリー prefix を欠いてメインリポジトリ側へ書き込む事故が起きた（後に統合・残骸削除で復旧）。
  「ファイル生成は必ずワークツリー root からの相対パス、または `pwd` で確認した絶対パスを使う」を
  運用 Tips に追記すると、並列 SubAgent との root 不一致を防げる。
