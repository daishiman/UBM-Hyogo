# Phase 4: 統合テスト設計（vitest / bats / production abort scenario）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-4/phase-4.md` |

## 目的
fixture / seed / cleanup / stress trial スクリプトのテスト戦略を確定する。最重要ケースは「production への誤投入が構造的に不可能であること」の検証。

## 実行タスク
1. vitest テストケース設計（`generate-50k-fixture.test.ts`）:
   - TC-GEN-01: `generateRow(index)` は同 index で同一 row を返す（決定論性）
   - TC-GEN-02: 50,000 行生成時の dedupe_key 重複ゼロ
   - TC-GEN-03: synthetic 性 — `@gmail` / `@senpai-lab` / `token` / `secret` が含まれない
   - TC-GEN-04: SQL chunk size 500 / JSON 単一配列出力
2. bats テストケース設計（`seed-staging-50k.bats`）:
   - TC-SEED-01: `--env production` → exit 1（stderr に明示メッセージ）
   - TC-SEED-02: `$CLOUDFLARE_ENV=production` → exit 1
   - TC-SEED-03: `--env staging --dry-run` で SQL を stdout 出力（実 INSERT 無し）
   - TC-SEED-04: `--fixture-file` 不在 → exit 1
3. cleanup / run-stress-trial も同様に bats でガード検証。
4. CI gate: `pnpm typecheck && pnpm lint && pnpm -w exec vitest run scripts/schema-alias-backfill && bats scripts/schema-alias-backfill/__tests__/`

## 統合テスト連携
Phase 5-7 の実装はこのテストケースを満たすことが完了条件。Phase 10 で全テスト実行 PASS を確認。

## 参照資料
- `outputs/phase-3/cli-spec.md`
- 既存 bats 例: なし（本タスクが初回導入の場合は導入も含む）

## 成果物
- `outputs/phase-4/phase-4.md`
- `outputs/phase-4/test-cases.md`

## 完了条件
- vitest / bats のテストケースが TC-ID で列挙され、各ケースの assertion 内容が明記。
- production abort 検証ケースが TC-SEED-01 / TC-SEED-02 として独立。
- CI gate コマンドが SSOT として記録。
