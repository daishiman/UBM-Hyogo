# Phase 4: Playwright 実行条件の確定 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 4 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| user_approval_required | false |

## 目的

実行直前に Playwright project / viewport / timeout / retry / 環境変数を 1 つに固定する。本タスクは spec を改修しないので、`apps/web/playwright.config.ts` の既存定義に合わせて wrapper 経由で渡す環境変数を確定するだけ。

## 入力 / 出力

| | 内容 |
| --- | --- |
| 入力 | Phase 1 target、Phase 2 out-dir、`apps/web/playwright.config.ts`、wrapper の環境変数仕様 |
| 出力 | `outputs/phase-04/main.md`（実行条件 matrix） |

## 実行条件 matrix

| 項目 | 値 | 由来 |
| --- | --- | --- |
| project | `staging` | wrapper の `--project` デフォルト。`apps/web/playwright.config.ts` で staging project を定義済 |
| spec ファイル | `apps/web/playwright/tests/profile-readonly.spec.ts` | wrapper で固定 |
| viewport (desktop) | width 1280 × height 800 (or 720) | spec 内の `for (viewport of ...)` ループに従う |
| viewport (mobile) | width 390 × height 844（iPhone 13 相当） | spec 内ループ |
| reporter | `line` | wrapper 固定 |
| timeout | Playwright config のデフォルト（spec 改修なしのため触らない） | `playwright.config.ts` |
| retry | 0（CI ではない手元実行） | デフォルト |
| 環境変数 `PLAYWRIGHT_BASE_URL` | Phase 1 承認 target | wrapper が export |
| 環境変数 `PLAYWRIGHT_STAGING_BASE_URL` | 同上 | wrapper が export |
| 環境変数 `PROFILE_EVIDENCE_STORAGE_STATE` | `apps/web/playwright/.auth/state.json` | wrapper が export |
| 環境変数 `PROFILE_EVIDENCE_OUT_DIR` | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11` | wrapper が export |
| Node | v24.15.0（`mise exec --` 経由） | `.mise.toml` |
| pnpm | 10.33.2 | `.mise.toml` |

## 実行コマンド（Phase 5 で実際に走らせるもの）

```bash
mise exec -- bash scripts/capture-profile-evidence.sh \
  --base-url <approved-target> \
  --storage-state apps/web/playwright/.auth/state.json \
  --out-dir docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11 \
  --project staging \
  --markers M-08,M-09,M-10,M-16
```

注意:
- `--base-url` は Phase 1 で承認された値のみ。production URL は `phase-03` で確認した guard により拒否される
- `--out-dir` は `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/outputs/phase-11` 固定（Phase 2 確定）
- `--markers` の `M-14` / `M-15` は wrapper が「automated capture では扱わない」旨の警告を出す。M-14 / M-15 は Phase 8 で手動取得を試みる

## 事前確認

| 項目 | 確認コマンド | 期待 |
| --- | --- | --- |
| dev server 起動（local target の場合） | `mise exec -- pnpm --filter @ubm-hyogo/web dev`（別ターミナル） | http://localhost:3000 が 200 |
| storageState 存在 | `ls -la apps/web/playwright/.auth/state.json` | ファイルが存在 |
| storageState 期限切れチェック | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright codegen --load-storage=apps/web/playwright/.auth/state.json <target>/profile`（headed で `/profile` がログイン状態で開けるか） | `/profile` が 200 表示 |
| browsers インストール | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install` | 完了 |

## 完了条件チェックリスト

- [ ] project = `staging` で固定
- [ ] viewport（desktop / mobile）が spec 由来で記録されている
- [ ] 環境変数 4 種が wrapper export 順で記録されている
- [ ] 実行コマンドが `outputs/phase-04/main.md` に確定形で貼られている
- [ ] 事前確認 4 項目（dev server / storageState / 期限 / browsers）の手順が明記されている

## 次 Phase への引き渡し

Phase 5 へ確定済 command を引き渡す。Phase 5 は実行 + command log 採取。
