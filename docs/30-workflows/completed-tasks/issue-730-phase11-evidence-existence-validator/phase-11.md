# Phase 11 — 動作確認 / 証跡（NON_VISUAL）

## 1. taskType / visualEvidence

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 理由 | validator (Node.js script) の追加。UI / screenshot は無し |

## 2. 必須証跡（docs-only / NON_VISUAL 3 点 + main）

実装完了時に `docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-11/` に以下を配置:

| ファイル | 内容 |
| --- | --- |
| `main.md` | Phase 11 概要 / taskType / visualEvidence / 証跡サマリ |
| `manual-test-result.md` | `pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts` の手元実行ログ（実行コマンド・所要時間・PASS 件数・FAIL 件数・実行者・実行日時） |
| `manual-smoke-log.md` | `pnpm typecheck` / `pnpm lint` / `pnpm test:phase12-compliance` / `pnpm verify:phase12-compliance` の手元実行ログ（コマンド・exit code・所要時間） |
| `link-checklist.md` | spec 内リンク（index.md, phase-*.md, references リンク）の 200 確認結果 |

## 3. 必須メタ（各証跡共通）

各 markdown 冒頭に以下を含める:

```markdown
# <ファイル名>

- 証跡の主ソース: vitest spec / pnpm script 出力
- スクリーンショットを作らない理由: validator (Node.js) の追加であり UI 変更を伴わないため (NON_VISUAL)
- 実行者: <user>
- 実行日時: <ISO8601>
- 実行環境: Node 24.15.0 / pnpm 10.33.2 / macOS or ubuntu-latest
```

## 4. 期待される実行結果

| コマンド | 期待 |
| --- | --- |
| `pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts` | exit 0 / 全 spec PASS（既存 + 新規） |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test:phase12-compliance` | exit 0 |
| `pnpm verify:phase12-compliance` | 本タスク自身の root に対して exit 0 |

## 5. red ケース手動確認

`fail-missing-evidence` fixture の `outputs/phase-12/phase12-task-spec-compliance-check.md` を一時的に修正（または phase-11 配下ファイルを一時生成して `pass` 動作）して red / green 切り替わりが正しく発生することを目視確認し、結果を `manual-test-result.md` に記録する。
