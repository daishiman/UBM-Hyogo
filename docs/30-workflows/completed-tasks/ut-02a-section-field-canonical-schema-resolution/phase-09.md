# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

Phase 5〜8 で実装した metadata.ts / builder.ts 改修について、(a) typecheck / lint / unit test の全 pass、(b) 変更行 coverage ≥ 90%、(c) schema drift CI gate（resolve 失敗時に CI が fail する設計）の追加、(d) secret hygiene（migration SQL に PII を含めない / `.env` 実値を grep で検出しない）、(e) Cloudflare 無料枠考慮（D1 row 数 / migration 実行時間）を観測し、`outputs/phase-09/coverage-report.md` にカバレッジ実測値を残す。AC-9 の達成証跡を本 Phase で完結させる。

## 前 Phase からの引き継ぎ

- Phase 8 で抽出された helper（row 変換 / kind 判定 / locale）の単体テスト対象行
- Phase 6 で確定した CI gate 入力 JSON shape `{conflicts, unknowns, consentMisclassified}`
- Phase 5 で確定した採用方式（D1 column / static manifest / hybrid）に応じた migration 有無

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 5〜8 | 実装ファイル / helper / migration | 検証対象 |
| 並列 | `.github/workflows/verify-indexes.yml` 等 CI 群 | 既存 gate 設計 | schema drift gate 追加場所 |
| 下流 | Phase 10 | gate 結果 | GO 判定根拠 |
| 下流 | Phase 11 | unit test result | builder-unit-test-result.txt |

## 検証コマンド一覧

| 区分 | コマンド | 期待結果 | 備考 |
| --- | --- | --- | --- |
| 型 | `mise exec -- pnpm typecheck` | exit 0 | 全 workspace |
| Lint | `mise exec -- pnpm lint` | exit 0 | warn 0 |
| Unit | `mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared` | 全 pass | metadata.test.ts / builder.test.ts |
| Coverage | `mise exec -- pnpm --filter @ubm/api test --coverage apps/api/src/repository/_shared` | 変更行 ≥ 90% | v8 / istanbul いずれか既存設定に従う |
| fallback 削除確認 | 旧推測 fallback 分岐（`stable_key` label 流用 / heuristic kind / broad assignment）を対象にした grep または AST 確認 | 0 件。resolver 入力としての `stable_key` 参照は許可 | AC-2 |
| grep（secret hygiene） | `grep -E "(BEGIN PRIVATE KEY|sk_live|api_key=)" apps/api/migrations/` | 0 件 | PII / secret 検出 |
| migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | 採用方式の migration が表示 | 採用時のみ |

## schema drift CI gate

### 設計

- `.github/workflows/` 配下に `verify-schema-resolver.yml`（仮称）を新設、または既存 `verify-indexes.yml` 相当に追記
- ジョブステップ:
  1. `mise install` / `mise exec -- pnpm install`
  2. `mise exec -- pnpm --filter @ubm/api exec node ./scripts/verify-schema-resolver.mjs`（新設スクリプト）
  3. スクリプトは static manifest と既知 stable_key 集合を walk し `MetadataResolver` で resolve 実行
  4. `{conflicts, unknowns, consentMisclassified}` のいずれかが > 0 なら `process.exit(1)` で CI fail
- gate 入力契約は Phase 6 で確定した JSON shape を踏襲

### secret hygiene

- migration SQL ファイル（`apps/api/migrations/*.sql`）の grep で PII / secret パターンが 0 件であることを CI で確認
- ローカル `.env` の実値混入は `scripts/cf.sh` 経由運用ルール（CLAUDE.md）で予防済み。本 Phase では検出側のみ

### 無料枠考慮

| 観測項目 | 上限 / 目安 | 計測方法 |
| --- | --- | --- |
| `response_fields` row 数 | D1 free tier 5GB / 5M rows 内（実値は 31 質問 × 想定回答数） | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT COUNT(*) FROM response_fields"` |
| migration 実行時間 | < 30 秒（採用時のみ）| `bash scripts/cf.sh d1 migrations apply` の wall clock |
| resolver in-memory manifest size | < 1 MB（Workers bundle 制約 1 MB compressed の余裕分）| `du -h dist/*.js` |

## coverage-report.md テンプレ

`outputs/phase-09/coverage-report.md` には以下の表を埋める。

```
| ファイル | 変更行 | カバー行 | カバレッジ |
| --- | --- | --- | --- |
| apps/api/src/repository/_shared/metadata.ts | XX | XX | XX% |
| apps/api/src/repository/_shared/builder.ts (diff) | XX | XX | XX% |
| apps/api/src/repository/responseFields.ts (diff) | XX | XX | XX% |
| apps/api/src/repository/responseSections.ts (diff) | XX | XX | XX% |
| 合計 | XX | XX | ≥ 90% |
```

実測値は Phase 9 実行時に置換する。90% 未達の場合は欠落 testcase を Phase 4 test-matrix.md にバックポートし再実行。

## 実行タスク

- [ ] typecheck / lint / unit test を順に実行し全 pass を確認
- [ ] coverage を取得し coverage-report.md に転記
- [ ] AC-2 grep（fallback 削除確認）が 0 件であることを記録
- [ ] secret hygiene grep（PII / secret pattern）が 0 件であることを記録
- [ ] schema drift CI gate（workflow + verify スクリプト）を追加
- [ ] D1 row 数 / migration 実行時間 / Workers bundle size を計測（採用方式に応じて）
- [ ] 失敗ケース（coverage < 90% / gate fail）の re-run 計画を main.md に記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 無料枠制約 |
| 必須 | CLAUDE.md（cf.sh ルール / lefthook 方針） | 検証コマンド実行ルール |
| 必須 | .github/workflows/verify-indexes.yml | 既存 CI gate の構造参考 |
| 参考 | phase-04.md / phase-06.md | testcase / failure case 入力 |

## 実行手順

### ステップ 1: ローカル品質ゲート
- `mise exec -- pnpm typecheck` / `lint` / `--filter @ubm/api test` の順で実行
- いずれか fail なら Phase 5 / Phase 8 に戻して修正

### ステップ 2: coverage 測定
- `mise exec -- pnpm --filter @ubm/api test --coverage` を実行
- 変更行ベースの coverage を抽出し coverage-report.md に転記
- < 90% の場合 Phase 4 test-matrix.md に testcase を追加して再測定

### ステップ 3: AC-2 / secret hygiene grep
- 旧推測 fallback 分岐（`stable_key` label 流用 / heuristic kind / broad assignment）→ 0 件。`stable_key` resolver 入力参照は許可
- `grep -rE "(BEGIN PRIVATE KEY|sk_live|api_key=)" apps/api/migrations/` → 0 件
- 結果を main.md に転記

### ステップ 4: schema drift CI gate 追加
- `.github/workflows/verify-schema-resolver.yml`（新設）を作成
- `scripts/verify-schema-resolver.mjs`（新設）を実装し gate 入力 JSON を出力
- PR 上で gate fail を 1 度確認 → fix → green を確認

### ステップ 5: 無料枠計測（採用方式依存）
- migration 採用時: `bash scripts/cf.sh d1 migrations apply` の wall clock を記録
- static manifest 採用時: `du -h` で bundle size を記録
- D1 row 数を `cf.sh d1 execute` で取得

### ステップ 6: 報告
- coverage-report.md を完成
- main.md に gate 結果サマリを記述

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC-9 / AC-6 の gate 結果 |
| Phase 10 | GO 判定の根拠 |
| Phase 11 | builder-unit-test-result.txt の origin |
| Phase 13 | local-check-result.md の入力 |

## 多角的チェック観点

- 不変条件 **#1**: schema drift CI gate により canonical 一本化が CI で恒常的に守られる
- 不変条件 **#2**: consent 誤判定 regression を gate の `consentMisclassified > 0` で fail させる
- 不変条件 **#3**: `responseEmail` system field の経路が unit test に含まれていることを coverage で確認
- 不変条件 **#5**: 検証コマンドはすべて `mise exec --` / `bash scripts/cf.sh` 経由で apps/api 境界を保つ

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck / lint / unit test | 9 | pending | 全 pass |
| 2 | coverage 測定 | 9 | pending | ≥ 90% |
| 3 | AC-2 grep | 9 | pending | 0 件 |
| 4 | secret hygiene grep | 9 | pending | 0 件 |
| 5 | schema drift CI gate 追加 | 9 | pending | workflow + script |
| 6 | 無料枠計測 | 9 | pending | 採用方式依存 |
| 7 | coverage-report.md 完成 | 9 | pending | 実測値転記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | gate 結果サマリ / grep 結果 / 無料枠計測結果 |
| ドキュメント | outputs/phase-09/coverage-report.md | 変更行ベース coverage 実測値（≥ 90%） |
| メタ | artifacts.json | phase 9 status を completed に更新 |

## 完了条件

- [ ] typecheck / lint / unit test 全 pass
- [ ] coverage ≥ 90%（変更行ベース）
- [ ] AC-2 grep 0 件
- [ ] secret hygiene grep 0 件
- [ ] schema drift CI gate が green
- [ ] 無料枠計測値が main.md に記録

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（coverage 不足 / gate fail / secret 検出）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ: gate 結果サマリ / coverage 実測値 / 採用方式の最終確定状態
- ブロック条件: いずれかの gate が fail なら Phase 10 不可
