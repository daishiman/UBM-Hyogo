# Phase 7: リファクタリング

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 7 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 6 (実装) |
| 次 Phase | 8 (統合テスト) |
| 状態 | pending |

## 目的

Phase 6 で完成した動くコードを、step-02..08 が再利用できる API surface に仕上げる。「動く」→「再利用しやすい」への質的整備。

## リファクタリング観点

### 7.1 hook の汎用化見直し

- `endpoint` を string で受け取っている → step-02..08 すべて admin endpoint だが、prefix `/api/admin/` を強制せず利用側責務に留める（過剰な検証を入れない）
- `options.successMessage` の default を `"✓ 保存しました"` から `"保存しました"` に変更検討（toast lib 側で prefix を付ける場合は外す）

### 7.2 NoteForm の primitive 抽出（行わない）

- 同じ form pattern が step-02..05 で出る可能性はあるが、本 step では先行抽出しない（YAGNI）
- step-03 完了時点でパターンが固まったら、後続別タスクで `<AdminFormShell>` 抽出を検討

### 7.3 命名整合

- hook 内 auth error 名は parallel-10 が定義した名前に合わせる
- parallel-10 未完了の場合は step-01 着手 NO-GO とし、task-local replacement class は作らない

### 7.4 SRP チェック

- `useAdminMutation` が `router.refresh` と `toast` 両方を呼ぶ → 1 関心（mutation 後の通知 + 再 fetch）として許容
- `NoteForm` が「form state + validation + 通信」を持つ → 通信は hook に委譲済。validation を hook 化しない判断を記録

### 7.5 dead code / TODO 残置 0

- 実装中の `// TODO` / `// FIXME` を削除 or Issue 化
- 未使用 import / 未使用変数を `pnpm lint --fix` で除去

## 実行タスク

- [ ] hook の export 名 / シグネチャを step-02..05 担当者と合意可能な形に整える
- [ ] dead code / 未使用 import を除去
- [ ] JSDoc を hook / component に追加
- [ ] `pnpm lint --fix` / `pnpm typecheck` を再実行

## 検証コマンド

```bash
mise exec -- pnpm lint --fix
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
bash scripts/coverage-guard.sh
```

## 完了条件

- [ ] dead code / TODO 残置 0
- [ ] JSDoc 付与（hook / component / 公開型）
- [ ] `pnpm lint` / `pnpm typecheck` green
- [ ] coverage AC 維持（>=80%）
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] step-02..08 担当が `import` で受け取る surface が確定

## タスク100%実行確認【必須】

- [ ] 全 unit test green を維持
- [ ] PR diff が説明可能なサイズに収まっている

## 次Phase

Phase 8 (統合テスト): hook + form + drawer + API stub の結合検証。
