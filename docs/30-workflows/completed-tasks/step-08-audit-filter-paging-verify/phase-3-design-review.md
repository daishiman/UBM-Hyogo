# Phase 3: 設計レビュー（Phase 4-6 再解釈方針の固定）

**[実装区分: 実装仕様書（`verify_existing`）]**

> 監査タスク用テンプレ（`phase-template-audit-task.md`）§Phase 3 に従い、本 Phase で **Phase 4-6 の責務再解釈方針を明示宣言**する。これを宣言しないと、実装タスク骨格（RED/GREEN/カバレッジ）を機械適用して責務が空転する。

## 1. Phase 4-6 の再解釈方針（宣言）

| Phase | 実装タスクでの責務 | 本タスク（verify_existing）での再解釈 |
|-------|-------------------|--------------------------------------|
| Phase 4 | テスト設計（TDD RED） | **既存テストの inventory 化 + targeted regression run 設計**。新規 failing test は書かない。既存 `*.spec.*` を「回帰の正本」として走らせる手順を設計する |
| Phase 5 | 実装（GREEN） | **git diff 確認（コード変更ゼロの証跡）+ 既存挙動の動作再確認**。新規実装なし。`apps/` 差分が空であることを示す |
| Phase 6 | テスト拡充（fail path） | **既存テストの fail path カバレッジ確認 + 不足があれば追補判断**。現状の既存テストが fail path（不正 query / cursor / date range / parseError）を網羅しているかを点検し、穴があれば §7 で追補または本サイクル内差し戻しを意思決定 |

- Phase 11 は「**再現コマンド実行 → 0 差分確認**」に特化する（UI/UX 変更なしのため screenshot 撮影は行わない）。

## 2. 設計レビュー判定（MINOR / MAJOR）

| 観点 | 判定 | 内容 |
|------|------|------|
| 責務境界 | PASS | read-only / mutation 非依存 / 状態は URL 所有 が一貫している |
| PII masking | PASS | API + UI の二段防御。既存テストが両層を担保 |
| cursor 契約 | PASS | encode/decode/limit+1 方式が contract test でカバー済み |
| 命名整合 | PASS | 新規追加ゼロのためドリフトなし |
| スコープ | MINOR | bonus 3 機能が監査結論を超える。core 外として Phase 12 でscope-out記録（未タスク新規作成なし） |

> MINOR は 1 件（bonus scope-out記録）。Phase 10 / Phase 12 で追跡する（0 件ではないため追跡テーブルに記録）。

## 3. Phase 4 進行可否

- **判定: 進行可（GO）**。再解釈方針が固定され、検証 lane（Phase 2 §2）が確定したため Phase 4 へ進む。

## 4. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| esbuild darwin バイナリ mismatch（worktree 直後） | vitest 起動失敗 | Phase 4 開始前に `mise exec -- pnpm install` を実行（FB-MSO-002） |
| 全件 `pnpm test` の SIGKILL | メモリ制約 | Lane A/B は filter 指定で targeted run（Phase 1 §2 列挙のファイルに限定） |
| 既存テストが監査主張を完全カバーしていない | 回帰保証に穴 | Phase 9 で FR↔テスト 1:1 coverage map を作成し partial を検出 |

## 5. 完了条件（Phase 3 DoD）

- [ ] Phase 4-6 の再解釈方針（§1）を宣言した。
- [ ] Phase 11 が「再現コマンド実行 → 0 差分」に特化する旨を宣言した。
- [ ] 設計レビュー判定（§2）で MINOR 1 件（bonus scope-out記録）を記録した。
- [ ] Phase 4 進行可否を GO 判定した。
