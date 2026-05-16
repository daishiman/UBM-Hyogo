# Phase 09: パフォーマンス / セキュリティ検証

[実装区分: 実装仕様書]

## 目的

型契約テスト追加による typecheck / test 実行時間の delta を計測し、セキュリティ観点での新規リスクが無いことを確認する。

## パフォーマンス検証

### 計測項目

| 指標 | コマンド | 期待 |
| --- | --- | --- |
| typecheck delta | `time mise exec -- pnpm typecheck`（before/after 各 3 回中央値） | +500ms 以内 |
| test delta | `time mise exec -- pnpm --filter @ubm-hyogo/shared test`（before/after 各 3 回中央値） | +500ms 以内 |
| vitest collected files | `pnpm vitest list \| wc -l` | +1 ファイル |

### 想定根拠

- 追加ファイルは 1 ファイル / 15 it。
- type assertion は実行時 no-op（`expectTypeOf` は runtime ノーオペレーション）。
- AC-5 の `safeParse` 1 回のみ runtime 実行。

### 出力

- `outputs/phase-09/perf-delta.md`（before/after の time 出力 + delta 表）

## セキュリティ検証

### 観点

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| シークレット混入 | 該当なし | テストファイルに env 値・トークン・URL を一切含めない |
| 外部 I/O | 該当なし | network / fs / D1 binding 利用なし |
| 認証バイパス | 該当なし | Auth.js / session 関連コードを触らない |
| 依存パッケージ追加 | 該当なし | `tsd` 等の新規 dev dep 追加なし |
| supply chain | 影響なし | `pnpm-lock.yaml` 変更なし |

## 入力

- `phase-07.md`（test 結果）

## 出力

- `outputs/phase-09/perf-delta.md`
- `outputs/phase-09/security-checklist.md`

## 完了条件 (DoD)

- [ ] typecheck / test 時間 delta が +500ms 以内。
- [ ] セキュリティ観点 5 項目すべて「該当なし」評価が記録。
- [ ] `pnpm-lock.yaml` 変更なしを `git diff pnpm-lock.yaml` で確認。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| typecheck 時間が想定超過 | 1 ファイル追加で 500ms 超は通常起きない。発生時は `tsc --extendedDiagnostics` で原因切り分け |
| 将来 `expectTypeOf` 連鎖で複合型推論が重くなる | type alias でキャッシュ化し、深いネスト評価を局所化（Phase 05 骨格で実施済） |
