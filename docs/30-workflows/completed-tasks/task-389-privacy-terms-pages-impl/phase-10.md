# Phase 10: release readiness check — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

production deploy 直前に、全 gate と前提条件が揃っていることを確認する。

## release readiness checklist

- [ ] G-DEP: #385 regression non-repro / web build unblocked
- [ ] G-LINT: `pnpm lint` PASS
- [ ] G-TYPE: `pnpm typecheck` PASS
- [ ] G-UNIT: privacy/terms test PASS
- [ ] G-BUILD: `pnpm --filter web build` PASS
- [ ] G-STAGING-200: staging `/privacy` `/terms` HTTP 200
- [ ] 法務承認 or 「暫定文面で deploy 可」の合意取得
- [ ] PR レビュー（solo dev につき自己 sign-off で可）
- [ ] rollback runbook (Phase 8) の対象 version ID 把握済
- [ ] OAuth consent screen の編集権限を保有

## 確認コマンド（一括）

```bash
gh issue view 385 --json state,title
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms
mise exec -- pnpm --filter @ubm-hyogo/web build
curl -s -o /dev/null -w "staging-priv=%{http_code}\n" "$STAGING_HOST/privacy"
curl -s -o /dev/null -w "staging-terms=%{http_code}\n" "$STAGING_HOST/terms"
```

## blocker 一覧

| ID | 内容 | 解消方法 |
| --- | --- | --- |
| B-1 | #385 OPEN | task-05a-build-prerender-failure-001 完了 |
| B-2 | OAuth consent screen 編集権限なし | Workspace admin に依頼 |
| B-3 | 法務未承認 | 暫定文面 deploy で AC partial close（Phase 6 例外条項適用） |

## 完了条件

- [ ] checklist 全項目に PASS / 未達が記録されている
- [ ] blocker 解消方法が明示されている
- [ ] `outputs/phase-10/main.md` を作成する

## 統合テスト連携

- local readiness は focused test / typecheck / build。
- staging / production readiness は Phase 11 の runtime evidence 取得時に PASS へ昇格する。
