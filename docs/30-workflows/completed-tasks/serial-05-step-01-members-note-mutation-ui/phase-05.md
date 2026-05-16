# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装) |
| 状態 | pending |

## 目的

T1..T7 を実行順序・コミット粒度・branch 戦略まで落とし込み、Phase 6 で迷わず実装着手できる状態にする。

## 実行順序

```
Wave 1 (並列):
  T1: useAdminMutation.ts 新規作成
Wave 2 (並列):
  T2: hook barrel export
  T3: useAdminMutation.spec.ts
Wave 3:
  T4: NoteForm.tsx 新規作成
Wave 4 (並列):
  T5: NoteForm.spec.tsx
  T6: MemberDrawer 拡張
Wave 5:
  T7: 手動動作確認 + smoke
```

## コミット粒度

| commit | 含む T | message 例 |
| --- | --- | --- |
| 1 | T1 + T2 | `feat(admin-hooks): add useAdminMutation hook` |
| 2 | T3 | `test(admin-hooks): cover useAdminMutation unit cases` |
| 3 | T4 | `feat(admin-members): add NoteForm component` |
| 4 | T5 | `test(admin-members): cover NoteForm unit cases` |
| 5 | T6 | `feat(admin-members): wire notes section into MemberDrawer` |

## branch 戦略

- base: `dev`（CLAUDE.md / 個人メモリ準拠）
- branch 名: `feat/serial-05-step-01-members-note-mutation-ui`
- PR 先: `dev`

## デプロイチェックポイント

本タスクは `apps/web` UI 変更のみ。ホスト環境特有のデプロイチェックポイントは無いが、以下を確認:
- staging へのマージ後、`router.refresh()` が Cloudflare Workers (`@opennextjs/cloudflare`) で正しく機能するか
- toast component が SSR safe か（client component 境界）

## ローカル実行コマンド（Phase 6 で実行）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- useAdminMutation.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- NoteForm.spec.tsx
mise exec -- pnpm build
bash scripts/coverage-guard.sh
```

## リスク・対応

| リスク | 対応 |
| --- | --- |
| parallel-08 未完了 → ToastProvider / hook contract 未固定 | step-01 着手 NO-GO。stub toast で迂回しない |
| parallel-10 未完了 → 401/403 error class 未固定 | step-01 着手 NO-GO。task-local replacement class を作らない |
| `router.refresh()` が Workers 環境で no-op | Phase 8 integration test で確認、不具合あれば Phase 12 で未タスクに記録 |
| `notes` が drawer fetch に含まれない | Phase 3 で MAJOR 判定済の場合のみ。Phase 6 で発覚した場合は Phase 1 へ戻る |

## 完了条件

- [ ] Wave 1-5 が DAG として記載
- [ ] commit メッセージテンプレが 5 件記載
- [ ] branch / PR 先が明記
- [ ] ローカル実行コマンド列が完成
- [ ] リスク 4 件に対応策が紐づく
- [ ] coverage AC（Statements/Branches/Functions/Lines >=80%）を実行コマンドに含む
- [ ] `bash scripts/coverage-guard.sh` exit 0 を完了条件に含む

## タスク100%実行確認【必須】

- [ ] 全 Wave に T-id が割当済

## 次Phase

Phase 6 (実装): T1..T7 を Wave 順に実コードへ落とす。
