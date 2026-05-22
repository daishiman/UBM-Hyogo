# Phase 3: タスク分解

| ID | タスク | 種別 | ファイル | 担当 Phase |
|----|--------|------|---------|-----------|
| T-01 | `bg-surface-2` utility 実在確認 (grep) | verify | tailwind config / globals.css | Phase 5 開始時 |
| T-02 | utility 未定義時の最小追加 | conditional modify | `apps/web/src/styles/globals.css` | Phase 5 |
| T-03 | `loading.tsx` を skeleton 形状に置換 | modify | `apps/web/app/profile/loading.tsx` | Phase 5 |
| T-04 | `loading.spec.tsx` を新規作成 | create | `apps/web/app/profile/loading.spec.tsx` | Phase 5 |
| T-05 | unit test 実行 (`pnpm test -- profile/loading`) | verify | — | Phase 6 |
| T-06 | typecheck / lint | verify | — | Phase 7 |
| T-07 | grep gate (HEX 直書きなし) | verify | — | Phase 9 |
| T-08 | ビルド検証 | verify | — | Phase 8 |
| T-09 | Phase 11 evidence 収集 | evidence | `outputs/phase-11/` | Phase 11 |
| T-10 | Phase 12 ドキュメント整備 | docs | `outputs/phase-12/` | Phase 12 |
| T-11 | PR 作成 | release | — | Phase 13 |

## 依存グラフ

```
T-01 → T-02 (conditional) → T-03, T-04 → T-05, T-06, T-08, T-07
                                       ↓
                                      T-09 → T-10 → T-11
```

T-03 と T-04 は同一 commit 単位（同一 PR）として扱う。

## SRP 確認

- T-03 は「render 出力の置換」単一責務
- T-04 は「a11y 契約の検証」単一責務
- T-02 は前提整備（条件付き）

## 完了条件

- [ ] 全タスクの担当 Phase 確定
- [ ] 依存グラフに循環なし
