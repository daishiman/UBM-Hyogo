# Phase 10: 最終レビュー — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 10 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Phase 1〜9 の成果物を横断レビューし、invariants / branch protection / completed-tasks との整合を確認した上で Phase 11 実測の GO/NO-GO を判定する。

## レビュー観点

### 10.1 invariants

| invariant | 確認 |
| --- | --- |
| #4 本文更新は Google Form 再回答のみ | M-09 / M-10 の DOM count assertion で構造的に保証 |
| #5 public/member/admin boundary | M-16 の logout redirect で session boundary 確認 |
| #8 localStorage / GAS prototype を正本にしない | spec 内で `localStorage` 値を assertion ソースにしないこと |
| #11 管理者も他人本文を直接編集しない | 本タスク Out-of-Scope。admin 視点の M 確認は別タスク |

### 10.2 branch protection drift 確認

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '{required_pull_request_reviews, lock_branch, enforce_admins}'
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '{required_pull_request_reviews, lock_branch, enforce_admins}'
```

期待: `required_pull_request_reviews = null` / `lock_branch = false` / `enforce_admins = true`。drift があれば Phase 13 PR 作成前に解消。

### 10.3 completed-tasks との整合

| 既存タスク | 整合確認 |
| --- | --- |
| `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md` | 「本タスクで取得すべき残 evidence」リストと M-08〜10 / M-14〜16 が一致 |
| `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/` | 既取得 `/login` screenshot を二重取得していない |
| `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/` | 申請 UI が M-09 assertion で誤検知されない（DRY Phase 8） |

### 10.4 GO/NO-GO

GO 条件:
- [ ] Phase 1〜9 の成果物がすべて outputs/phase-XX/main.md に存在
- [ ] AC マトリクスに漏れなし
- [ ] branch protection drift なし
- [ ] storageState gitignore 済
- [ ] capture script に baseURL guard あり

NO-GO 条件:
- 上記いずれか未充足、または invariant 違反検出時に user approval 経路が未確定

## 統合テスト連携

- Phase 11 へ: GO 判定後、staging 実測へ進む。
- 09a staging visual smoke へ: 本 spec を継承候補として記録（Phase 12 で changelog）。

## サブタスク管理

- [ ] invariants 確認
- [ ] branch protection drift 確認
- [ ] completed-tasks 整合確認
- [ ] GO/NO-GO 判定
- [ ] outputs/phase-10/main.md に最終レビュー結果を記載

## 成果物

| 成果物 | パス |
| --- | --- |
| 最終レビュー結果 | `outputs/phase-10/main.md` |

## 完了条件

- [ ] 4 観点すべてのチェックが完了
- [ ] GO 判定 or NO-GO 修正計画が記載されている

## タスク100%実行確認

- [ ] 「未確認」を残したまま GO にしていない
- [ ] branch protection の主観判断ではなく `gh api` 出力に基づく判定であること

## 次 Phase への引き渡し

Phase 11 へ、GO 判定 + user approval 必須事項（staging アクセス / 認証情報利用）を引き渡す。
