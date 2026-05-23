# Phase 11: Manual Test / Local Evidence 取得

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-10-final-review
**次 Phase**: phase-12-documentation

## 目的

NON_VISUAL タスクとしてローカル evidence を取得し、`outputs/phase-11/manual-test.md` に保存する。authenticated runtime / staging の手動 QA は Phase 13 のユーザー承認後に実行する。

本 workflow の現在状態は `implemented_local_evidence_captured`。focused Vitest と NON_VISUAL 代替検証は取得済みであり、スクリーンショットは `visualEvidence: NON_VISUAL` のため必須ではない。

## visualEvidence 区分

**NON_VISUAL**: component unit test 中心。dialog / destructive warning / 409 toast は focused component specs で検証し、layout / token / primitive の変更を伴わないため screenshot は取得しない。

## 取得対象 evidence 5 点セット

| ファイル | 取得コマンド |
|---|---|
| `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.log` |
| `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/evidence/lint.log` |
| `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx RequestQueueDetail.spec.tsx RequestConfirmDialog.spec.tsx 2>&1 \| tee outputs/phase-11/evidence/test.log`（2026-05-23 review cycle では同等コマンドを直接実行し focused specs PASS） |
| `outputs/phase-11/evidence/build.log` | `mise exec -- pnpm build 2>&1 \| tee outputs/phase-11/evidence/build.log` |
| `outputs/phase-11/evidence/grep-gate.log` | 下記 grep 群を実行し結果を保存 |

## grep-gate 内容

```bash
# HEX 直書きが無いこと（design token 経由のみ）
grep -nE '#[0-9a-fA-F]{3,8}' \
  apps/web/src/components/admin/RequestQueuePanel.tsx \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  || echo 'OK: no HEX literals'

# legacy useAdminMutation への import が無いこと（CLAUDE.md 不変条件 10）
grep -n "from ['\"]@/lib/useAdminMutation['\"]" \
  apps/web/src/components/admin/RequestQueuePanel.tsx \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  || echo 'OK: no legacy import'

# process.env.* 直接参照が無いこと
grep -nE 'process\.env\.' \
  apps/web/src/components/admin/RequestQueuePanel.tsx \
  apps/web/src/components/admin/RequestQueueDetail.tsx \
  apps/web/src/components/admin/RequestConfirmDialog.tsx \
  || echo 'OK: no process.env reference'

# *.test.tsx が含まれていないこと
find apps/web/src/components/admin/__tests__ -name '*.test.tsx' \
  | tee /dev/stderr | wc -l
```

全 grep 結果を `outputs/phase-11/evidence/grep-gate.log` に集約。現 close-out の要約は `outputs/phase-11/manual-test.md` に記録する。

## 手動 QA 実施

authenticated admin runtime で phase-9 の QA-01〜QA-10 / EC-01〜EC-05 を順に実行する場合は、ユーザー承認後に `outputs/phase-11/manual-smoke-log.md` に PASS/FAIL を記録する。

```
# manual-smoke-log.md template
| # | シナリオ | 結果 | 備考 |
|---|---|---|---|
| QA-01 | ... | PASS | - |
| ... |
```

## 完了条件

- `outputs/phase-11/manual-test.md` が存在し、NON_VISUAL 判定根拠を記録している
- focused component specs が PASS
- new inline color / legacy mutation import / direct env access / `*.test.tsx` 追加がない
- authenticated runtime / staging smoke は user-gated として未完了境界を明記する

## 出力ディレクトリ

```
outputs/phase-11/
├── manual-smoke-log.md
└── evidence/
    ├── typecheck.log
    ├── lint.log
    ├── test.log
    ├── build.log
    └── grep-gate.log
```
