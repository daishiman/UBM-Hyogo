# UT-08A-06: 既存 `*.test.ts` → `*.contract.spec.ts` 段階的 rename

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-08A-06 |
| タスク名 | 既存 `*.test.ts` → `*.contract.spec.ts` 段階的 rename |
| 分類 | refactor / NON_VISUAL |
| 対象機能 | `apps/api/src/**/*.test.ts` のテストファイル命名規則統一 |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | 08a Phase 10 §5 リスク表 / Phase 12 unassigned-task-detection §6 |
| 発見日 | 2026-04-30 |
| 検出元ファイル | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` |
| 推奨割当 | 08a 追補 or 09a の小 PR |

## 概要

08a で導入したテスト suffix 規約（`*.contract.spec.ts` / `*.authz.spec.ts` / `*.repository.spec.ts` 等）を、既存 20 ファイル超の `*.test.ts` に段階的に適用し、suite 種別がファイル名から判別できる状態にする。

## 背景

08a Phase 10 のリスク表で「既存 `*.test.ts` の rename を本 task で行うと git diff が膨大化し、レビュー負荷が高まる」と判断し、**新規追加分にのみ suffix 規約を適用**する混在許容方針を取った。混在状態は短期は許容できるが、長期では suite 種別が見えづらく、CI の filter（`vitest --testNamePattern` 等）で contract / authz を切り出す運用も難しくなる。

## 受入条件

- `apps/api/src/**/*.test.ts` を以下の suffix に分類して rename する:
  - contract: `*.contract.spec.ts`
  - authz: `*.authz.spec.ts`
  - repository: `*.repository.spec.ts`
  - その他（unit）: `*.spec.ts`
- rename PR は 1 PR 内で完結させ、test 内容は変更しないことをレビューで確認できる体裁にする（`git mv` のみ・diff 0）。
- vitest config / coverage exclude / lefthook / CI workflow の glob を同時更新する。
- rename 後 `mise exec -- pnpm --filter @ubm-hyogo/api test` が green であること。

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/**/*.test.ts` の rename 戦略
- 症状: rename を 08a 内でやろうとすると、`git mv` 大量と new test 追加が同一 PR に混在し、レビューで「test 内容を変えていないこと」の確認が極めて難しくなる。08a では混在許容にしたが、rename 専用 PR を別途切る場合も glob (`vitest.config.ts` の `include` / `coverage.exclude` / lefthook の path filter) を漏れなく追従させる必要があり、1 つでも外すと CI が静かに skip するリスクがある。
- 参照: `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md` §6

## リスクと対策

| リスク | 対策 |
| --- | --- |
| rename PR が test 内容変更と混ざりレビューで検出できなくなる | `git mv` のみで diff 0 になることを PR description で約束し、1 commit / no-content-change を強制する |
| glob 更新漏れで CI が test を実行しなくなる | rename 後の test 件数が rename 前と同一であることを CI で assert する |
| 08a の suffix 規約自体が後から変わると二重 rename になる | 規約を `docs/30-workflows/` に確定 ADR として残してから着手する |

## 検証方法

### 要件検証

```bash
find apps/api/src -name '*.test.ts' | wc -l
find apps/api/src -name '*.spec.ts' | wc -l
```

期待: rename 前の `*.test.ts` 件数を記録し、rename 後に `*.spec.ts` 件数として保存されていることを確認する基準とする。

### glob 確認

```bash
rg "test\\.ts|spec\\.ts" apps/api/vitest.config.ts apps/api/package.json .github/workflows lefthook.yml
```

期待: rename と同時に追従が必要な箇所が全て列挙されている。

## スコープ

### 含む

- `apps/api/src/**/*.test.ts` の suffix rename
- `vitest.config.ts` / `package.json` / CI workflow / lefthook の glob 同期
- suffix 規約 ADR の確定

### 含まない

- test 内容の修正・追加
- `apps/web` 側 test の rename（別 task）
- `packages/*` 側 test の rename（別 task）

## 関連

- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/phase-10.md`
