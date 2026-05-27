---
spec_classification: implementation_spec
state: spec_created
phase: 8
phase_name: リファクタ
---

# Phase 8 — リファクタ

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

Phase 5〜7 で追加した実装の重複・密結合・命名のブレを整理し、後段 admin route 横展開で再利用しやすい形に整える。

## 前提と入力

- Phase 5〜7 完了済みコード
- 親 workflow が `implemented_local_runtime_pending` のため、共有 primitive の incompatible 変更は禁止

## 作業手順

1. `_members/` 配下の重複 util を抽出（chip tone マッピング / hue 生成 / time format）
2. adapter の純粋関数化（DI で `tagStore` / `now()` を受け取る形）
3. 命名: `MemberListRow` / `MemberDetail` の型名統一
4. dead code / unused import 削除（`pnpm lint --fix` で自動修正できる範囲）

## 成果物

- リファクタ後コード
- `outputs/phase-8/quality-gate.md`

## 完了条件 (DoD)

- `pnpm typecheck` / `pnpm lint` 継続 green
- 既存 / 新規 spec が継続 green
- 共有 primitive の API は additive のみ

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- --run
```

## 想定リスク

- リファクタによる adapter シグネチャ変更 → consumer の test 経由で検出

## ロールバック

- 個別 commit を `git revert`

## 関連 spec

- `phase-5-implementation.md`
- `phase-7-coverage.md`
