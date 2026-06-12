# Phase 3: 設計レビュー

## メタ情報
正本: `outputs/phase-3/phase-3.md` / 上位 SSOT: `../../_shared-context.md`

## 目的
設計レビューと 4 条件評価を行い、Phase 4 進行を判定する。

## 1. 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ◎ | 運用者/開発者の「staging で /profile が localhost を叩いていないか」という不安を実機ログで即証明でき、真因（410/5xx/transport）の切り分けコストを下げる。fail-closed は設定破損時の事故を未然に防ぐ |
| 実現性 | ◎ | 変更は fetch/transport 層の型・純関数・optional フィールド追加に閉じ、既存シグネチャ後方互換。1 サイクルで完結（CONST_007） |
| 整合性 | ○ | 診断メタ生成を transport.ts に一元化し責務境界が閉じる。env→transport→authed→safe-fetch の依存方向が一方向。apps/api 非接触で endpoint surface 不変 |
| 運用性 | ◎ | ログイベント名（`server_fetch_failed`）を据え置き既存の解析を壊さない。fail-closed は error boundary（既存）で補足。実機確認手順を diagnose script に集約 |

## 2. 真の論点（SKILL 要件レビュー思考法）

1. **真の論点**: 「localhost を見ているか」という不安に対し、コードは No と言えるが**実機ログで証明できない**こと。本タスクは「証明可能性」と「fail-closed による不可能化」を与える。真因（410/5xx）の本格修正は別論点（実機確定後）。
2. **依存・責務境界**: 診断メタ生成が複数レイヤに散ると drift する → transport.ts の `describeTransport` に一元化。env の「明示判定」を transport の fail-closed の入力に使う依存は一方向で健全。
3. **価値とコストの不均衡**: 高コスト項目（本格的な 410/5xx 修正・apps/api 改変）は本サイクルに含めない（実機未確定 = 合意未済）。低コスト高価値（観測性・fail-closed）に集中。
4. **改善優先順位**: ①ログに transport 可視化（最優先・真因切り分けの土台）②fail-closed（事故予防）③diagnose echo（運用補助）。
5. **4 条件**: 上表。整合性のみ「○」= safe-fetch が transport メタを error 経由で受け取る配線が唯一の結合点。Phase 4 で error shape を契約として固定し drift を防ぐ。

## 3. レビュー指摘と対応

| # | 指摘 | 対応 |
|---|------|------|
| R1 | `safeServerFetch` の公開シグネチャを変えると呼び出し元（多数）が壊れる | 公開シグネチャ不変。元 error の受け渡しは関数内部に閉じる |
| R2 | `describeTransport` が localhost リテラルを足すと gate fail | 既存定数 + `URL.host` 抽出のみ。新規リテラル 0 |
| R3 | `environmentExplicit` 省略時に意図せず localhost fallback へ落ちる懸念 | `environmentExplicit === true` のときだけ明示 local として fallback 許可。省略時 `undefined` と `false` は fail-closed |
| R4 | ログに memberId/cookie が漏れる懸念 | 出力キーを `code/path/status/transportKind/baseHost` に限定。T4 で出力キー検査 |
| R5 | 既存 WF（#1189-1192）と重複起票の懸念 | Phase 12 未タスク化時に既存 issue と差分確認（FB-CANCEL-004-2） |

## 4. Phase 4 進行判定

**PASS。** 4 条件すべて実装可能な厚みに収まり、責務境界が閉じ、後方互換が担保される。Phase 4（I/O 契約・テスト期待値）へ進む。唯一の結合点（error→ログの transport メタ受け渡し）を Phase 4 で契約固定する。

## 統合テスト連携
Phase 4 で transport descriptor とログ shape を I/O 契約として固定し、各 spec の期待値表に落とす。

## 参照資料
- `../phase-1/phase-1.md` / `../phase-2/phase-2.md` / `../../_shared-context.md`

## 成果物
- `outputs/phase-3/phase-3.md`

## 完了条件
- [x] 4 条件評価とレビュー指摘対応を記録し、Phase 4 進行を PASS 判定した。
