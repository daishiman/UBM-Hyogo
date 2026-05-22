# Phase 11: Evidence 収集

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 種別 | evidence |
| visualEvidence | VISUAL |
| 入力 | Phase 4-9 成果物 |
| 出力 | `outputs/phase-11/main.md`、`outputs/phase-11/evidence/*.log`、visual smoke baseline |

## evidence 一覧

`outputs/phase-11/evidence/` 配下に以下を保存:

| ファイル | 取得コマンド |
| --- | --- |
| `typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.log` |
| `spec.log` | `pnpm exec vitest run --config vitest.config.ts <focused admin primitive specs> 2>&1 \| tee outputs/phase-11/evidence/spec.log` |
| `grep-gate.log` | `bash scripts/verify-primitive-adoption.sh 2>&1 \| tee outputs/phase-11/evidence/grep-gate.log` |
| `visual-smoke/`（user-gated） | local dev server / authenticated admin runtime screenshot。未実行時は `VISUAL_RUNTIME_PENDING` を明記 |

## `outputs/phase-11/main.md` テンプレート

```md
# Phase 11 Evidence Summary

| AC | 検証 | exit code | log |
| --- | --- | :---: | --- |
| AC-2 | C1 raw `<input>` 残存 0 | 0 | evidence/grep-gate.log |
| AC-3 | C2 mutating panels trigger adoption 4/4 | 0 | evidence/grep-gate.log |
| AC-4 | C3 Breadcrumb 8 admin route | 0 | evidence/grep-gate.log |
| AC-5 | C5 EmptyState / C6 Pagination required surfaces | 0 | evidence/grep-gate.log |
| AC-7 | typecheck / focused specs | 0 / 0 | evidence/typecheck.log, spec.log |
| AC-10 | visual screenshot | pending_user_approval | visual-smoke/ |
```

## 完了条件

- [ ] local evidence ファイルが物理的に存在
- [ ] AC-2〜AC-7 全 exit 0
- [ ] AC-10 は `VISUAL_RUNTIME_PENDING` として user-gated 境界を明記
- [ ] `outputs/phase-11/main.md` がサマリ表で完成

## 次Phase

→ Phase 12（コンプライアンスチェック）
