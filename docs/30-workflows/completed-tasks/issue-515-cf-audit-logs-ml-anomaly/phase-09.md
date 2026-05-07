# Phase 9: テスト計画

## 目的

unit test / fixture-based offline evaluation / secret leakage grep / 互換性 test の網羅計画を確定する。

## テストファイル一覧

| ファイル | 種別 | 主要ケース |
| --- | --- | --- |
| `scripts/cf-audit-log/__tests__/classifier.test.ts` | unit | threshold wrapper / factory / ML skeleton fallback |
| `scripts/cf-audit-log/__tests__/features-extract.test.ts` | unit | redacted feature extraction / redact secret requirement |
| `scripts/cf-audit-log/__tests__/evaluation.test.ts` | fixture | offline replay metrics / leakage clean-positive detection |
| `scripts/cf-audit-log/__tests__/d1-client.test.ts` | unit | classification metadata write and legacy-column fallback |
| `scripts/cf-audit-log/__tests__/issue-reporter.test.ts` | unit | classifier metadata in Issue body / redaction / dry-run compatibility |

## Fixture

`tests/fixtures/cf-audit/`:

- `synthetic-anomaly.jsonl`: HIGH/NONE mixed labeled dataset。各行に `expectedSeverity` ラベル
- `leakage-positive-ip.jsonl`: 生 IPv4 を含む（grep test 用）
- `leakage-clean.jsonl`: redacted 済み
- `analyze-fixture.json`: `analyze.ts --fixture` / `--export-features` smoke 用

## 実行コマンド

```bash
# focused
pnpm vitest run scripts/cf-audit-log/__tests__

# 全体
pnpm typecheck
pnpm lint
```

## 完了条件

- [x] 5 focused test ファイル × 主要ケースを記述
- [x] fixture 4 ファイルの設計を記述
- [ ] 実行コマンドを確定
- [ ] 各 test と AC（AC-1〜AC-12）の対応表を作成

## 出力

- `outputs/phase-09/main.md`

## 参照資料

- `index.md`
- `phase-04.md` ・ `phase-06.md` ・ `phase-08.md`

## 統合テスト連携

- 本タスクは NON_VISUAL のため、Vitest unit / fixture が integration と兼ねる

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 09 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 09-1 | この Phase の契約を確定する |
| 09-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
