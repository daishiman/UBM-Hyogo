# Phase 3: 設計レビュー

> **[実装区分: 実装仕様書]**。Phase 4 へ進めるかを判定するゲート。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / レビュー対象: Phase 1（要件）/ Phase 2（設計）
- 判定: **PASS（Phase 4 へ進行可）**

## 目的

Phase 1/2 の設計が AC-1..8 を満たし、不変条件・責務境界・CONST_007 スコープに矛盾がないことを確認する。

## 1. 要件レビュー 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ✅ | 公開ディレクトリで会員写真が表示され、admin が登録した写真の公開価値を解放。誰の何のコストも増やさない（既存 gate 流用） |
| 実現性 | ✅ | #983 資産（member_photos / presign helper / Avatar src）が landed 済みで、追加は schema optional + resolver DI + UI src 配線のみ。1 サイクルで実装可能 |
| 整合性 | ✅ | 責務境界（presign=route / gate=repo / 表示=Avatar）が閉じている。invariant #5（D1/R2 は apps/api）/ #11（admin 分離）維持 |
| 運用性 | ✅ | fail-soft（secret 未設定→200 維持）/ TTL 300s / D1 schema 不変で migration 運用負荷ゼロ |

## 2. 真の論点と確認

| 論点 | 結論 |
|------|------|
| 真の論点 | 「admin で登録された写真を、公開可否の境界を保ったまま public へ出す」 |
| 複数案件の混在 | self-upload / transcode は別タスク分離済み。本 task は表示のみに単一責務化 |
| why now | #983 で写真基盤が landed し、public 表示が唯一の未配線部だから |
| why this way | 新 consent カラム＝D1 schema 変更＝運用コスト増。既存 gate 流用で価値を最短で解放（ユーザー承認済み） |

## 3. 因果・境界の確認

- **強化ループ**: 写真公開 → ディレクトリの識別性向上 → 会員エンゲージメント。
- **バランスループ**: presign 失敗 / secret 未設定 → resolver undefined → schema optional 吸収 → hue placeholder（崩れない）。
- **状態所有権**: presign は route 層のみ。view-model は R2 非依存。web は photoUrl 文字列のみ受領。混在なし。

## 4. AC カバレッジ確認

| AC | 設計で担保される箇所 | 判定 |
|----|---------------------|------|
| AC-1 | Phase 12 で specs ADR 作成（gate/TTL/cost を明文化） | ✅ 計画済 |
| AC-2 | Phase 2 §2.1（optional + `.strict()` 維持） | ✅ |
| AC-3 | Phase 2 §1.1（gate 通過 + 写真登録 member のみ） | ✅ |
| AC-4 | Phase 2 §1.2（gate 後に resolve） | ✅ |
| AC-5 | Avatar 既存 fallback（src 無し→hue / onError→hue） | ✅ |
| AC-6 | presigned URL 文字列のみ返却（bucket 名/object key は route 内に閉じる） | ✅ |
| AC-7 | presign は apps/api route 層。web は photoUrl のみ | ✅ |
| AC-8 | `listMemberPhotosByIds`（1 query）+ fail-soft | ✅ |

## 5. リスクと対策

| リスク | 対策 | 検証 Phase |
|--------|------|-----------|
| consent なし member の写真露出 | gate を repo/use-case で先に適用し、その後 resolve | Phase 4/5/6 |
| public route に admin-only signed URL を出す | public 用 resolver は同 gate 配下のみ。bucket 名は route 内変数 | Phase 5/9 |
| list での R2 read 増加 | presign=CPU のみ。R2 read は browser img 時。batch query で N+1 防止 | Phase 2 §4 / Phase 7 |
| 既存 public test の破壊 | resolver optional（未注入で従来動作）。photoUrl optional | Phase 4/6 |
| TTL と browser cache の矛盾 | presigned URL の `X-Amz-Expires=300` で失効統一。Cache-Control 追加なし | Phase 12 ADR |

## 実行タスク

- 4 条件・AC カバレッジ・リスク対策を確認し PASS 判定を確定する。
- Phase 4 のテスト lane（shared schema / repo batch / use-case resolver / UI render）を承認する。

## 参照資料

- `phase-1.md` / `phase-2.md`
- `.claude/skills/task-specification-creator/references/review-gate-criteria.md`

## 成果物

- Phase 3 設計レビュー（本ファイル・PASS 判定）

## 完了条件

- [ ] 4 条件すべて ✅ である
- [ ] AC-1..8 が設計のどこで担保されるか対応づけられている
- [ ] リスク 5 件に対策と検証 Phase が割り当てられている
- [ ] Phase 4 進行可否が PASS で確定している

## 統合テスト連携

本 Phase の AC カバレッジ表が Phase 4 テストケースの設計起点になる。
