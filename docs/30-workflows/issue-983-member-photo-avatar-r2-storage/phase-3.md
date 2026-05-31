# Phase 3: 設計レビュー（ゲート）

> **[実装区分: 実装仕様書]**。Phase 4 へ進めるかを判定する品質ゲート。

## 要件レビュー思考法（システム / 戦略 / 問題解決の3系統）

### 真の論点

- 主問題: 「avatar を写真化する」ではなく「**写真の入手経路と保存契約が未確定**」。Phase 2 で admin upload + R2 presign に確定したことで論点が閉じた。
- 混在排除: 「一般 member の self-upload」「public 表示」を切り出し、admin-managed の垂直スライスに単一化（CONST_007 例外で別タスク化、理由明記済み）。

### 因果・境界

- 強化ループ: photo 表示 → admin が写真を入れる動機 → 表示品質向上。
- バランスループ: R2 read（presign 経由）増 → 無料枠消費。→ list に photoUrl を露出させない設計で抑制。
- 責務境界: R2（binary）/ D1（metadata）/ apps/api（presign・検証）/ apps/web（表示のみ）。`apps/web` に R2/D1 が漏れない（invariant #5）。

### 価値とコスト

- 初回価値: admin が drawer で写真を登録 → detail avatar が実写真化。
- 高コスト部品: presign secret 運用・R2 bucket provisioning（user-gated runtime）。初期層（コード）と将来層（self-upload/public）を分離済み。

### 4条件評価

| 条件 | 評価 |
|------|------|
| 価値性 | ○ admin の member 識別性向上。誰の何のコストを下げるか明確 |
| 実現性 | ○ 既存 R2 binding パターン・`useAdminMutation`・audit 基盤を再利用。1 サイクル実装可能 |
| 整合性 | ○ invariant #4/#5/#6/#10、`.strict()` schema、free-tier 制約と矛盾なし |
| 運用性 | △→○ presign secret と bucket 作成が runtime ops（user-gated）。Phase 12 で未タスク化せず本 spec 内に手順記載 |

## 設計レビュー判定

| 観点 | 判定 | 備考 |
|------|------|------|
| 既存 API surface への影響 | PASS | 新 endpoint は admin 配下追加のみ。既存 detail は後方互換（photoUrl optional） |
| 不変条件整合 | PASS | invariant #4/#5/#6/#8/#10 すべて充足 |
| schema `.strict()` 破壊 | PASS | optional 追加のみ。`type-contracts.spec.ts`（input==output）も optional で維持 |
| 親 workflow invariant との関係 | **要注記** | 親 UI-prototype-alignment workflow は「新 endpoint/D1 変更禁止」。本 task は**その制約を意図的に超える followup**であり、グローバル invariant #4（admin-managed 分離）が根拠。index.md §0 に明記済み |
| テスト容易性 | PASS | presign を route 層注入にして builder を R2 非依存に保つ |
| visual baseline | PASS | src 無/失敗時は現行 DOM と同一（AC-4 pixel diff ゼロ） |

## ブロッカー / リスク

| リスク | 深刻度 | 対策 Phase |
|--------|--------|-----------|
| presign secret 未設定で detail 500 | 中 | presign 失敗を fail-soft（photoUrl 省略）に。Phase 2 §1 / Phase 5 で握り潰さず null 返却 |
| `aws4fetch` の SigV4 query 署名の TTL 実挙動 | 中 | Phase 4 で実測 contract（TTL 経過 403） |
| R2 bucket 未 provisioning | 中（runtime） | Phase 11/13 の user-gated runbook に bucket 作成手順を記載 |
| 256KB 超過の検証漏れ | 低 | Phase 4 で 413 ケースを RED 先行 |

## ゲート結論

**PASS — Phase 4（テスト作成）へ進行可。** 設計上のブロッカーは無く、runtime ops（secret/bucket）は user-gated として spec 内に手順化する方針で閉じる。

## 完了条件（Phase 3）

- [ ] 4条件評価が記録されている
- [ ] 親 workflow invariant との関係が注記されている
- [ ] 全リスクに対策 Phase が割当てられている
- [ ] ゲート判定 PASS/FAIL が明記されている

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
Phase 2 設計が不変条件、依存関係、リスク対策を満たすか判定する。

## 実行タスク
- 4条件評価を行う。
- Phase 4 へ進めるかを判定する。

## 参照資料
- `phase-1.md`
- `phase-2.md`

## 成果物
- Phase 3 設計レビュー

## 統合テスト連携
Phase 4 以降のテスト作成は本ゲートのリスク対策表を入力にする。
