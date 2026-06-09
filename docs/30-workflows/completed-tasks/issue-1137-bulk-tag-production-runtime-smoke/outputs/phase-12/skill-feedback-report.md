# Skill Feedback Report — issue-1137-bulk-tag-production-runtime-smoke

## テンプレート改善

- **production 拡張タスクの環境定数確認チェック**: 先行 staging タスク（issue-1081）を production へ拡張する際、production 環境定数（D1 名 / worker 名 / URL / allowlist regex）を Phase 1 で wrangler.toml から逐語確認する手順が有効だった。env 別変数の状態所有権テーブル（staging 現状不変 / production 追加）を Phase 2 に置くと、staging 退化リスク（AC-6）を構造的に防げる。テンプレに「先行 env タスクの拡張時は環境定数を Phase 1 で SSOT 確認」を recommend として追記する候補。

## ワークフロー改善

- **二重承認 gate の機械検証**: production mutation smoke の dual marker（GitHub environment + runner 内 marker）を、local test で marker 欠落時 exit 2 を踏むケースとして必ず設計する手順は再利用価値が高い。NON_VISUAL / 不可逆 mutation タスク共通のパターンとして `references/` に「dual-approval guard test pattern」を切り出す候補。
- **単一 runner env 分岐 vs 別 runner の判断**: 先行事例（#922 `runtime-admin-web.sh`）が単一 runner env 分岐を採用済みの場合、共通 lib 抽出（別タスク）に依存せず env 分岐拡張を選ぶのが DRY と staging 不変の両立に有効。Phase 2 設計レビューで代替案 A〜E を表で比較する手順が判断の透明性を高めた。

## ドキュメント改善

- **staging guard 逐語不変の表明方法**: 「`assert_staging_guard` を逐語変更しない（AC-6）」を Phase 1 不変条件 I-7 / Phase 2 状態所有権テーブル / Phase 3 リスク表 / Phase 10 AC 充足の 4 箇所で一貫表明する構造が、reviewer に安全境界を明確に伝えた。横断ガイドライン化候補。

## 結論

改善候補 3 点（環境定数 SSOT 確認 / dual-approval guard test pattern / staging 不変の多点表明）。いずれも本タスクで既存規約に準拠して対応済みのため、skill 本体への即時新規ルール追加は不要。将来の同型タスク（先行 env タスクの production 拡張）で再利用する候補として記録する。
