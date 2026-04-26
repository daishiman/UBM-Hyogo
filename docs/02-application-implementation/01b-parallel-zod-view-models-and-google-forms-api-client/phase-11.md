# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 11 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 10 (最終レビュー) |
| 下流 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

typecheck / vitest / ESLint boundary / Forms client mock 実行 / consent normalize 実行 を手動で smoke し、evidence を outputs/phase-11/ に保存。

## 実行タスク

1. smoke 6 手順抽出
2. evidence path 確定
3. 出力 placeholder
4. outputs

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/implementation-runbook.md | step |
| 必須 | outputs/phase-04/test-strategy.md | command |

## 実行手順

### 6 手順 → evidence

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 12 | implementation-guide |
| 13 | PR description |

## 多角的チェック観点（不変条件参照）

- **#5**: ESLint rule で boundary 違反 evidence
- **#7**: branded distinct evidence

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | smoke 抽出 | 11 | pending |
| 2 | evidence path | 11 | pending |
| 3 | placeholder | 11 | pending |
| 4 | outputs | 11 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-11/main.md |
| evidence | outputs/phase-11/typecheck.log |
| evidence | outputs/phase-11/vitest.log |
| evidence | outputs/phase-11/eslint-boundary.log |
| evidence | outputs/phase-11/forms-mock-run.log |
| evidence | outputs/phase-11/consent-normalize.log |
| evidence | outputs/phase-11/branded-distinct.log |
| メタ | artifacts.json |

## 完了条件

- [ ] 6 evidence placeholder

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-11/ 配下 6 evidence 配置
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 12
- 引き継ぎ事項: evidence path
- ブロック条件: 未配置

## Manual Evidence

### 1. typecheck

```bash
$ pnpm -w typecheck
# 期待: 0 error
```

evidence: `outputs/phase-11/typecheck.log`

### 2. vitest（型 + zod + Forms mock）

```bash
$ pnpm -F @ubm/shared test
$ pnpm -F @ubm/integrations-google test
# 期待: 全 PASS, coverage 90%+
```

evidence: `outputs/phase-11/vitest.log`

### 3. ESLint boundary

```bash
$ pnpm -w lint
# 期待: 0 violation
$ cd apps/web && echo 'import "@ubm/integrations/google";' > /tmp/violation.ts && pnpm eslint /tmp/violation.ts
# 期待: error import/no-restricted-paths
```

evidence: `outputs/phase-11/eslint-boundary.log`

### 4. Forms client mock 実行

```bash
$ pnpm -F @ubm/integrations-google test -- --testNamePattern "forms-auth|forms-get|forms-list|backoff"
# 期待: 全 case PASS
```

evidence: `outputs/phase-11/forms-mock-run.log`

### 5. consent normalize 実行

```bash
$ pnpm -F @ubm/shared test -- --testNamePattern "consent-normalize"
# 期待: 旧キー → 新キー変換 PASS
```

evidence: `outputs/phase-11/consent-normalize.log`

### 6. branded distinct test

```bash
$ pnpm -F @ubm/shared test -- --testNamePattern "branded-distinct"
# 期待: MemberId !== ResponseId 確認 PASS
```

evidence: `outputs/phase-11/branded-distinct.log`
