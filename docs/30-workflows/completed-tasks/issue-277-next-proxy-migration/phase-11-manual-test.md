# Phase 11: 手動テスト & Evidence

## 環境

- ローカル dev: `mise exec -- pnpm --filter @ubm-hyogo/web dev`
- ベース URL: `http://localhost:3000`
- アカウント（memory project_test_accounts より）:
  - admin: `manjumoto.daishi@senpai-lab.com`
  - 一般会員: `manju.manju.03.28@gmail.com`

## シナリオ & 期待

| # | 操作 | 期待結果 | Evidence 保存先 |
|---|---|---|---|
| M-1 | logged-out で `/profile` GET | 307 → `/login?redirect=%2Fprofile` | `outputs/phase-11/m1-curl.txt` |
| M-2 | logged-out で `/admin` GET | 307 → `/login?gate=admin_required` | `outputs/phase-11/m2-curl.txt` |
| M-3 | focused Vitest で non-admin `/admin` | 403 Forbidden | `outputs/phase-11/m3-focused-test.txt` |
| M-4 | focused Vitest で admin `/admin` | `NextResponse.next()` | `outputs/phase-11/m4-focused-test.txt` |
| M-5 | logged-out で `/profile/edit?tab=tags` GET | 307 → `/login?redirect=%2Fprofile%2Fedit%3Ftab%3Dtags` | `outputs/phase-11/m5-profile-with-query.txt` |
| M-6 | `pnpm build` 出力 grep | `middleware...deprecated` が hit しない | `outputs/phase-11/m6-build-log.txt` |
| M-7 | `pnpm --filter @ubm-hyogo/web test -- proxy.spec.ts` | AC-1〜AC-7 pass | `outputs/phase-11/m7-proxy-spec.txt` |

## curl テンプレ

```bash
mkdir -p docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11

curl -i --max-redirs 0 http://localhost:3000/profile \
  | tee docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/m1-curl.txt

curl -i --max-redirs 0 http://localhost:3000/admin \
  | tee docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/m2-curl.txt

curl -i --max-redirs 0 'http://localhost:3000/profile/edit?tab=tags' \
  | tee docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/m5-profile-with-query.txt

mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \
  | tee docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/m6-build-log.txt

mise exec -- pnpm --filter @ubm-hyogo/web test -- proxy.spec.ts 2>&1 \
  | tee docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/m7-proxy-spec.txt
```

## Evidence 表

| ケース | 種別 | パス | 取得日 |
|---|---|---|---|
| M-1 | curl | `outputs/phase-11/m1-curl.txt` | (実装時に記入) |
| M-2 | curl | `outputs/phase-11/m2-curl.txt` | |
| M-3 | focused test | `outputs/phase-11/m3-focused-test.txt` | |
| M-4 | focused test | `outputs/phase-11/m4-focused-test.txt` | |
| M-5 | curl | `outputs/phase-11/m5-profile-with-query.txt` | |
| M-6 | build log | `outputs/phase-11/m6-build-log.txt` | |
| M-7 | focused test | `outputs/phase-11/m7-proxy-spec.txt` | |

## Evidence Gate

Phase 13 の PR 本文で `outputs/phase-11/` を参照するのは、M-1〜M-7 の evidence ファイルが物理生成済み、または未取得理由が `outputs/phase-11/manual-test-result.md` に明記済みの場合に限る。実行前の PR テンプレではチェックボックスを未チェックのまま維持する。

## Screenshot Boundary

本タスクは `visualEvidence: NON_VISUAL` で、UI/UX の JSX・CSS・表示仕様は変更しない。スクリーンショットは必須 evidence ではない。認証済 browser smoke を追加取得する場合も、補助 evidence として扱う。

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

実装後の admin/profile runtime behavior を curl、focused Vitest、build grep で確認する。

## 実行タスク

- M-1〜M-7 の evidence を取得する。
- build warning grep を保存する。
- PR evidence gate を満たす。

## 参照資料

- Phase 4 manual test plan。
- Phase 9 QA。

## 成果物

- `outputs/phase-11/m1-curl.txt`
- `outputs/phase-11/m2-curl.txt`
- `outputs/phase-11/m3-focused-test.txt`
- `outputs/phase-11/m4-focused-test.txt`
- `outputs/phase-11/m5-profile-with-query.txt`
- `outputs/phase-11/m6-build-log.txt`
- `outputs/phase-11/m7-proxy-spec.txt`

## 完了条件

- M-1〜M-7 が取得済み、または runtime smoke 未取得理由が `manual-test-result.md` に記録済み。
- PR 本文が未取得 evidence を完了済みとして扱わない。

## 統合テスト連携

Phase 6 の unit tests と Phase 9 の build / grep gate を runtime smoke で補完する。
