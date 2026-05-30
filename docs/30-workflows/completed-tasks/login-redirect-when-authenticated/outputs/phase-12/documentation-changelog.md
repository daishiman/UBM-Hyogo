# documentation-changelog

## workflow-local（本 workflow 内）

| ファイル                                                          | 変更 | 内容                            |
| ----------------------------------------------------------------- | ---- | ------------------------------- |
| `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/index.md`    | 新規 | workflow root                   |
| `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/artifacts.json` | 新規 | gate / phase ledger             |
| `outputs/phase-1/phase-1.md` 〜 `phase-13/phase-13.md`            | 新規 | Phase 1-13 仕様書               |
| `outputs/phase-11/manual-test-result.md`                          | 新規 | NON_VISUAL 証跡テンプレート     |
| `outputs/phase-12/*.md`（strict 7）                                | 新規/更新 | Phase 12 close-out 成果物       |
| `apps/web/src/lib/url/safe-next.ts`                                | 新規 | `safeNext` 実装                 |
| `apps/web/src/lib/url/__tests__/safe-next.spec.ts`                 | 新規 | `safeNext` focused test         |
| `apps/web/app/login/page.tsx`                                      | 編集 | ログイン済み redirect 配線      |
| `apps/web/app/login/__tests__/page.spec.tsx`                       | 新規 | `/login` redirect focused test  |

## global skill sync

| skill                                | 更新 | 理由                                |
| ------------------------------------ | ---- | ----------------------------------- |
| `aiworkflow-requirements`            | 更新 | workflow ledger / quick-reference / resource-map / artifact inventory |
| `task-specification-creator`         | N/A  | 既存 Implementation Target Physical Existence Gate / Command Contract Drift Rule で吸収 |

## Step 結果

| Step       | 結果              |
| ---------- | ----------------- |
| Step 1-A   | 完了（本 workflow 内 index/artifacts 新規） |
| Step 1-B   | 完了（`implemented_local_evidence_captured` へ再分類） |
| Step 1-C   | 完了（親 workflow + `safe-redirect.ts` 再利用を記録） |
| Step 2     | 完了（aiworkflow-requirements 索引へ同期） |

## 関連 commit

実装着手時に追記。
