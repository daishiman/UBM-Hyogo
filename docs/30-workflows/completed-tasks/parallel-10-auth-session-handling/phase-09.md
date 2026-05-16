# Phase 9 — 受入確認

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Workflow | parallel-10-auth-session-handling |
| Phase | 09 |
| Status | spec_created |

## 目的

この Phase の目的は、下記の詳細仕様に従って `parallel-10-auth-session-handling` を spec_created から実装可能な状態へ進めることである。

## 実行タスク

- [ ] 下記の Phase 固有手順を実行する。
- [ ] 成果物と evidence path を確認する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| workflow index | docs/30-workflows/parallel-10-auth-session-handling/index.md | 全体仕様 |
| artifacts | docs/30-workflows/parallel-10-auth-session-handling/artifacts.json | 状態台帳 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase output | docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-09/ | Phase成果物 |


## AC チェックリスト

- [ ] **AC-1**: `authed.spec.ts` 5 ケース PASS
- [ ] **AC-2**: `useAdminMutation.spec.tsx` の 401/403/その他 3 経路 PASS
- [ ] **AC-3**: `trigger` 実行で `isLoading` true→false 遷移を確認
- [ ] **AC-4**: open redirect 防止 5 ケース PASS（`/login?redirect=...` loop 防止を含む）
- [ ] **AC-5**: `outputs/phase-02/auth-session-policy.md` に silent refresh 不採用が明記
- [ ] **AC-6**: `Toast.spec.tsx` で alert role 描画 PASS
- [ ] **AC-7**: `outputs/phase-03/design-review.md` Verdict=GO
- [ ] **AC-8**: `outputs/phase-11/evidence/{typecheck,lint,test,build}.log` exit 0
- [ ] **AC-9**: Phase 12 必須 7 ファイル存在

## NG 時の処理

- AC-1〜AC-4 / AC-6 / AC-8 が NG → 該当 Step を Phase 6 に戻して再実装。
- AC-5 / AC-7 / AC-9 が NG → Phase 2 / 3 / 12 を再生成。

## 完了条件

- `outputs/phase-09/acceptance.md` に上 9 項目の Verdict と evidence path が転記されていること。
