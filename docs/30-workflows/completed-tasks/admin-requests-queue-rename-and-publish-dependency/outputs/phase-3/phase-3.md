# Phase 3 — 設計レビューゲート（Gate-A）

`[実装区分: 実装仕様書]` / 判定: **GO**（Gate-A passed）

> Phase 1（要件）・Phase 2（設計）の妥当性を 4 条件 + 不変条件 + システム正本整合で検証する。

## 3.1 要件レビュー思考法 3 系統

### システム系（真の論点・因果と境界）
- 真の論点: 「依頼キューが冗長か？」ではなく「**2 つの公開状態変更経路の役割差が UI で説明されていない**」こと。因果はコードでなく情報設計（表現層）にある。
- 境界: 変更は (A) seed データ、(B) 表示テキスト/説明/リンク、(C) 会員一覧の読み取りフィールド + バッジ。ロジック・データモデル・API surface は境界外（不変）。

### 戦略・価値系（価値とコスト）
- 価値: 会員の自己決定権受付という固有価値を残しつつ、管理者が「なぜ 2 画面あるか」を一目で理解でき、staging で実挙動を確認できる。
- コスト: seed 拡張 + 表示テキスト変更 + 相関サブクエリ 1 本 + バッジ。いずれも 1 サイクルで完了。ルートリネームを避けることでリンク切れ/リダイレクトコストを回避。

### 問題解決系（改善優先順位）
1. 命名平易化（最小コスト・最大の認知改善）
2. 役割説明 + 相互リンク（混乱の直接解消）
3. 申請中バッジ + API（依存関係の可視化）
4. テスト seed（staging 実挙動確認の前提）

## 3.2 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | GO | 削除しない決定と「役割明確化」が整合。命名は表示テキスト限定で内部識別子と矛盾しない |
| 漏れなし | GO | ユーザーの 6 問（用途不明/依存関係/整理/追加要否/命名/テスト seed）すべてに対応。500・diff 表示はスコープ外として明示記録 |
| 整合性あり | GO | Lane C の SQL/型/zod/純関数が一貫。web zod 再宣言の同期を明記 |
| 依存関係整合 | GO | 既存 API/D1 を尊重。新 endpoint・schema 変更なし。承認経路と直接トグル経路の独立性を AC-13 で担保 |

## 3.3 不変条件チェック（CLAUDE.md）

| 不変条件 | 遵守 |
| --- | --- |
| 既存 API のみ・新 endpoint なし | ✅ `/members` projection 拡張のみ |
| D1 schema 変更なし | ✅ admin_member_notes 既存・seed のみ |
| apps/web から D1 直接禁止 | ✅ API 経由 |
| OKLch トークン・HEX 禁止 | ✅ AC-12 |
| spec ファイル `*.spec.{ts,tsx}` | ✅ §7 |
| admin mutation は useAdminMutation 経由 | ✅ 既存 resolve フロー不変 |
| コミット/PR/seed/screenshot user-gated | ✅ Phase 13 |

## 3.4 システム正本整合（aiworkflow-requirements / specs）

- `docs/00-getting-started-manual/specs/11-admin-management.md` の `/admin/requests` 記述（会員本人依頼の承認 queue）と本設計は整合。命名平易化に伴い同 spec の表示名注記を Phase 12 で更新する（機能定義は不変）。
- 会員一覧 API の `pendingRequestTypes` 追加は `01-api-schema.md` / admin API 仕様へ追記対象（Phase 12 system-spec-update-summary）。

## 3.5 リスクと緩和

| リスク | 緩和 |
| --- | --- |
| 命名変更で既存テスト/CSS/Playwright セレクタが壊れる | 表示テキスト/aria-label のみ変更、`id`/`data-*`/`className` 不変（AC-4）。既存 RequestQueuePanel spec は新ラベルへ同 wave 更新 |
| seed drift guard fail | build-seed-sql 再生成 → committed SQL を再生成物で更新し byte 一致を確認 |
| `json_group_array(DISTINCT ...)` の SQLite 互換 | SQLite/D1 は集約での DISTINCT をサポート。Lane C 実装で fakeD1 contract test により検証 |
| web zod 再宣言の同期漏れ | Lane C 仕様で API/web 両側の zod 同期を必須手順化 |

## 3.6 判定

**GO（Gate-A passed）**。Phase 4 以降（テスト作成→実装→検証→ドキュメント）へ進む。本プロンプトのサイクルで Lane A/B/C をローカル実装し、検証証跡を Phase 11 に記録する。

## 3.7 完了条件（Phase 3）

- [x] 3 系統レビュー実施
- [x] 4 条件すべて GO
- [x] 不変条件すべて遵守
- [x] システム正本との整合確認
- [x] リスクと緩和を明示
- [x] Gate-A passed
