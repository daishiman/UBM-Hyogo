# Phase 3: 設計レビュー（Phase 4 進行可否ゲート）

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [phase-1-requirements.md](phase-1-requirements.md) / [phase-2-design.md](phase-2-design.md) / [shared-context.md](shared-context.md)
- 判定: **PASS（Phase 4 へ進行可）**

## 不変条件適合性チェック

| 不変条件 | 適合 | 根拠 |
| --- | --- | --- |
| #1 実フォーム schema を固定しすぎない | ✅ | Form schema 非変更 |
| #5 D1 直接アクセスは apps/api に閉じる | ✅ | apps/web 表現層のみ。D1 非接触 |
| #8 新規 test は `*.spec.{ts,tsx}` のみ | ✅ | T1-T5 全て `.spec.` |
| #9 admin form input は FormField 経由 | ✅ | 本タスクは表示のみ。input 追加なし |
| UI 不変条件 #2 OKLch トークン正本 | ✅ | 新規 className は `var(--ubm-color-*)` のみ・HEX 0（AC-9） |
| UI 不変条件 #1 既存 API のみ接続 | ✅ | 新 endpoint なし・既存値の読み取りのみ（AC-10） |

## 設計判断レビュー

| 判断 | 評価 | コメント |
| --- | --- | --- |
| 既存 `formatJstDateTime` を変更せず新 helper 追加 | ✅ 妥当 | 他所（送信日時・監査ログ）の表示を保護。秒なし/年2桁の既存仕様を壊さない |
| `formatToParts` で確定組み立て | ✅ 妥当 | ロケール実装差を回避。年月日漢字 + 秒の要件を確実に満たす |
| fail-soft（不正値で元入力返却） | ✅ 妥当 | WEEKGRD-02 準拠。一覧描画中の例外クラッシュを防ぐ |
| 用語集 SSOT 新規作成 | ✅ 妥当 | 既存 ZONE_LABEL パターン踏襲。今後の項目追加を 1 箇所集約（強化ループ） |
| 英語キー併記方式 | ✅ 妥当 | 非エンジニアの可読性 + 技術者の参照性 + 既存テスト互換を三立 |
| `boolLabel` 削除して `formatBooleanJa` 統一 | ✅ 妥当 | 真偽値表記の SSOT 化。yes/no と true/false の表記揺れを解消 |
| 見出しの uppercase クラス除去 | ✅ 妥当 | 日本語に uppercase は無効。視覚的副作用なし |

## リスクと対策

| リスク | 深刻度 | 対策 |
| --- | --- | --- |
| 既存テスト/Playwright が英語キーを exact 一致で検証 | 中 | 併記で英語キー文字列を DOM に残す。exact:true で壊れる場合は Phase 5/6 でテスト側を併記対応に更新（AC-11）。実装者は着手前に `getByText("memberId")` 等の exact 利用を grep 確認 |
| `MemberDrawer.tsx` が #1187 で最近変更 | 低 | 対象は tag source 正規化で IDENTITY セクション（229-254）とは別箇所。コンフリクトリスク低 |
| Intl 月日のゼロ埋め | 低 | `Number()` でゼロ除去を設計済み（`6月9日`）。T1 で `2026年6月9日` を assert |
| opacity-60 のトークン抵触 | 低 | Tailwind opacity ユーティリティは色 HEX を含まず AC-9 非抵触 |

## MINOR 指摘

Phase 3 設計レビューにて MINOR 指摘なし（明示 0 件）。

| MINOR ID | 指摘内容 | 解決予定 Phase | ステータス |
| --- | --- | --- | --- |
| （なし） | — | — | 0 件 |

## 4 条件評価

| 条件 | Verdict | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 運営者（非エンジニア）の読み取りコストを低減。誰のどのコストかが定義済み |
| 実現性 | PASS | 表現層のみ・5 ファイル・純関数中心で初回スコープに収まる |
| 整合性 | PASS | API/D1/Form 非接触で境界が閉じる。責務所有権が分離（§Phase2） |
| 運用性 | PASS | 用語集 SSOT で今後の項目追加を一元化。verify gate で回帰検知 |

## 判定

**PASS** — Phase 4（テスト計画）へ進行する。設計は不変条件に適合し、リスクは対策済み。

## 完了条件（Phase 3）

- 不変条件適合性を確認した。
- 設計判断とリスクをレビューし対策を確定した。
- MINOR 0 件を記録した。
- 4 条件で PASS 判定した。
