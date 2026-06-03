# Phase 3: 設計レビュー（ゲート）

> **[実装区分: 実装仕様書]**。Phase 4 へ進めるかを判定する。Gate-A。

---

## 1. 4条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 運用者の「identity action 手入力ミス・記憶負荷」を下げる。誰の何のコストかが定義済み |
| 実現性 | PASS | native datalist + 既存 primitive 再利用で実装は `AuditLogPanel.tsx` 1 箇所 + spec 2 ファイル。1 サイクル完了 |
| 整合性 | PASS | API producer / schema 非接触。URL query 契約・自由入力・pagination をすべて不変に保つ設計で責務境界が閉じる |
| 運用性 | PASS | state 増やさず server component 維持。回帰テストで AC-2/3/4 の非退化を保証 |

## 2. 真の論点

- **真の論点**: 「identity 操作の監査が、action 文字列の正確な手入力に依存している」運用上の摩擦の解消。
- **what / how**: action 入力に候補提示（datalist）を足す。
- **why now**: #987 で producer 側（`identity.dismiss` 記録）が成立し、閲覧側の操作性だけが follow-up として残った。
- **why this way**: Select 置換は自由入力を殺す（AC-3 違反）。datalist は「候補提示 + 自由入力維持」を native で両立する唯一の最小手段。

## 3. 因果・境界確認

- **バランスループ**: 候補提示を増やす ↔ 「identity だけが唯一の選択肢に見える」過剰提示リスク → option を 2 値に限定し placeholder は identity 以外（`attendance.add`）を維持して均衡。
- **状態所有権**: 入力値の所有は DOM(uncontrolled) → URL → SSR で一貫。UI(AuditLogPanel) は提示のみを所有し、フィルタ意味論（producer 側 action 値）は API が所有。混在なし。
- **責務境界**: 本タスクは「閲覧 UI」レイヤに閉じ、`apps/api` producer / D1 schema に越境しない。

## 4. 設計レビュー指摘（MINOR）

| ID | 指摘 | 対応 |
|----|------|------|
| M-1 | 既存テスト L408 `getByLabelText(/action/)` が datalist 追加で複数マッチしないか | datalist には `<label>` 紐付けが無く `getByLabelText` の対象外。複数マッチしない。Phase 4 で明示テストして保証 |
| M-2 | datalist option を inline 直書きにすると将来増加時に重複しやすい | 初回 2 値は inline で YAGNI。増加時は Phase 8 で定数配列抽出（未タスク化は不要・現時点で過剰実装回避） |
| M-3 | ブラウザにより datalist の描画差異がある | 機能要件（候補提示 + 自由入力）はどのブラウザでも満たす。視覚差は許容（Phase 11 で Chromium 撮影） |

> MINOR 指摘はいずれも本サイクル内で吸収可能。Phase 12 未タスク化対象なし。

## 5. ゲート判定

| 判定 | 結果 |
|------|------|
| Phase 4 へ進行 | **GO** |
| ブロッカー | なし |
| 設計確定 | datalist 方式（`id="audit-action-presets"`, option = `identity.merge` / `identity.dismiss`） |

## 完了条件（Phase 3）

- [x] 4条件すべて PASS
- [x] 真の論点・因果ループ・責務境界を明記
- [x] MINOR 指摘 3 件の本サイクル内吸収方針を確定
- [x] Gate-A: Phase 4 進行を GO 判定

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
4条件評価と MINOR 指摘の吸収方針を確定し、Phase 4 へ進める設計ゲート（Gate-A）を判定する。

## 実行タスク
- 4条件（価値性 / 実現性 / 整合性 / 運用性）を評価する。
- MINOR 指摘の本サイクル内吸収方針を確定し、GO/NO-GO を判定する。

## 参照資料
- `phase-1.md`
- `phase-2.md`

## 成果物
- Phase 3 設計レビュー仕様（本ファイル・Gate-A 証跡）

## 統合テスト連携
Gate-A の GO 判定により Phase 4（テスト作成）以降の実装仕様 Phase が起動する。
