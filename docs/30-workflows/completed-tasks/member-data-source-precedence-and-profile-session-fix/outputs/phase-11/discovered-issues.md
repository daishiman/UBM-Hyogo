# Phase 11 — Discovered Issues

spec_created 段階（実装前）の発見事項。実装時 / 実機検証時に再評価する。

| ID | 重大度 | 内容 | 扱い |
| --- | --- | --- | --- |
| DI-1 | HIGH | Sheets 同期が SQL レベルで全失敗（`member_responses` に存在しない列へ INSERT・CORR-1）。表示が読む `response_fields` に一切書かない。 | 本タスク Lane B で構造修正（current・先送りなし）。 |
| DI-2 | HIGH | ラベルマップ不一致（RC-1）/ consent 値不一致（RC-2）でスプレッドシート seed が機能しない・公開されない。 | 本タスク Lane B（current）。 |
| DI-3 | HIGH | `/profile` で `/me` が 401/404 以外を返し汎用エラーで詰まる（RC-3 / CORR-2）。 | 本タスク Lane E（current）。実機 status 切り分けが前提。 |
| DI-4 | MEDIUM | Form 経路 mapper の 2 ラベル（`X（Twitter）URL` / `その他のSNS・URL`）不一致で urlX/urlOthers が unknown 化（CORR-3）。 | 本タスク Lane B（current）。 |
| DI-5 | LOW | ラベルマップを実ラベル直書きで是正すると将来のフォーム文言変更に再び弱い。questionId / alias テーブル駆動化が望ましい。 | Phase 12 unassigned（baseline・本サイクルは実ラベル準拠で AC 達成）。 |
| DI-6 | LOW | 値ドメイン正規化マップ（`"0→1"`→`"0_to_1"` 等）が sync 側と shared enum で二重定義になりうる。 | Phase 12 unassigned（baseline・将来の集約候補）。 |

> HIGH（DI-1..4）はすべて本ワークフローの current スコープで解消する。LOW（DI-5/6）のみ baseline。
