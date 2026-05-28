# Phase 3 — 設計レビュー (gate)

[実装区分: 実装仕様書]

## 1. 不変条件レビュー（Gate-A）

| # | Invariant | 検証方法 | 判定 |
| --- | --- | --- | --- |
| 1 | 既存 API のみ接続 | Phase 2 §3 で list endpoint は **変更しない**。adapter で吸収。Drawer detail も既存 endpoint。 | PASS |
| 2 | OKLch トークン正本 | Phase 2 §6 で HEX 直書き 0 件方針 + 既存 token のみ使用を明示。`verify-design-tokens` で確認 | PASS（Phase 9 で実証） |
| 3 | プロトタイプ正本順位 | Phase 2 §1 ツリーが prototype L162-366 に 1:1 対応。逸脱は API gap 部のみ（§3 で adapter 化） | PASS |
| 4 | D1 直接アクセス禁止 | apps/web 側で D1 binding 追加なし | PASS |
| 5 | FormField 経由必須 | Drawer 内 textarea (管理者メモ) を `<FormField as="textarea">` で実装 | PASS |
| 6 | useAdminMutation 経由必須 | Phase 2 §5 で公開 Switch / 論理削除 / 復元すべて hook 経由 | PASS |
| 7 | テスト命名 `*.spec.*` | Phase 4 で `*.spec.{ts,tsx}` のみ列挙 | PASS |
| 8 | error boundary 戦略不変 | `AdminSectionErrorClient` 継続採用、戦略変更なし | PASS |
| 9 | in-place rewrite | 新規 `V2` ファイル禁止。既存 4 ファイル書き換え + 新規 primitive のみ追加 | PASS |
| 10 | CONST_007 (1 サイクル完了) | スコープ外項目は UX 上完結する範囲に限定 | PASS |

## 2. 正本順位レビュー

衝突しうるポイント:

- **API list response の field 不足**: 正本順位 #1 (本 workflow phase-1) が「list は変更しない」を AC-3 で明示。プロトタイプ (#5) の「tags / zone chip 表示」よりも index.md 不変条件 #1 が優先 → list 列では adapter で "—" 表示・Drawer 内で表示。

矛盾なし。

## 3. CONST_005 必須項目チェック

| 項目 | 記載箇所 |
| --- | --- |
| 変更対象ファイル一覧 | index.md 「変更対象ファイル」 / Phase 5 で詳細 |
| 主要関数・型シグネチャ | Phase 2 §2 / §5 |
| 入出力・副作用 | Phase 2 §5 / §3 |
| テスト方針 | Phase 2 §7 / Phase 4 |
| ローカル実行コマンド | Phase 9 / Phase 11 |
| DoD | index.md §「完了条件」 |

すべて記載済。

## 4. レビュー結論

- **Gate-A 状態**: `passed` (spec readiness)
- **次フェーズへ進む条件**: Phase 4 のテスト計画が AC-1〜AC-12 を漏れなく cover していること

## 5. レビュー外メモ

- 404 根因の最終確定は Phase 5 Lane A 着手時に確定する設計（Phase 1 §4 / Phase 2 §4）。設計レビュー段階で 3 仮説を維持することは Phase 2 §4 の検証手順が決まっているため許容する。
- スコープ外と明示した項目（tag chip list 列・avatar 画像・tag pill write 永続化・list response field 拡張）は **followup-004 候補** として Phase 12 `unassigned-task-detection.md` で明示する。
