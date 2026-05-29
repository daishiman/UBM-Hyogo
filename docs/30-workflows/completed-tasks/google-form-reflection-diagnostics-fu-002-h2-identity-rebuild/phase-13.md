# Phase 13: PR 構成・ドキュメント更新計画

## 13.1 PR タイトル候補

```
feat(auth): H2 identity rebuild — member_identities backfill + session-resolve auto-link
```

## 13.2 PR 本文骨子

```markdown
## Summary

- google-form-reflection-diagnostics 親 workflow の H2 仮説（member_responses ありの本人が member_identities 欠損で profile 経路から永続的に解決不能）を修復する
- migration 0021 で過去データを backfill、session-resolve に auto-link を統合して将来発生も予防する

## 変更点

- 新規 `apps/api/migrations/0021_backfill_member_identities.sql`
- `apps/api/src/repository/identities.ts` に `findAutoLinkCandidateByEmail` / `backfillIdentityFromCandidate` / `tryAutoLinkIdentityByEmail` を追加
- `apps/api/src/routes/auth/session-resolve.ts` に auto-link を統合
- `apps/api/src/diagnostics/forms-pipeline.ts` の H2 derive 条件に `membersWithoutIdentity > 0` を追加
- test: `identities.autolink.spec.ts` 新規、`session-resolve.contract.spec.ts` 拡張
- docs: `specs/02-auth.md` に auto-link 仕様追記

## evidence

- typecheck / lint / api test green: `outputs/phase-11/typecheck.log` / `lint.log` / `api-test.log`
- staging before/after identityHealth: `outputs/phase-11/staging-identityHealth-{before,after}.json`
- 3 sample 検証: `outputs/phase-11/staging-member-diagnosis-sample-{1,2,3}.json`

## Test plan

- [ ] staging deploy → migration 適用 → identityHealth=0 確認
- [ ] staging で 3 sample H2_identityMissing=false 確認
- [ ] production backup → migration 適用 → 同上確認
- [ ] 24h 後ログ確認: UBM-AUTH-AUTOLINK-OK 件数、エラーなし
```

## 13.3 ドキュメント更新

| ファイル                                                                 | 変更内容                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `docs/00-getting-started-manual/specs/02-auth.md`                         | auto-link 仕様 1 節追記                                              |
| `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md` | Spec-B-2 を「実装済 (PR #XXX)」へ更新                                |
| `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-002-h2-identity-rebuild.md` | 完了マーク + 本 workflow へのリンク追記、または completed-tasks へ移動 |

## 13.4 関連 Issue / cross-link

- 親 Issue: #957（CLOSED 維持。PR description で言及）
- 親 workflow: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/`
- 関連 spec: `docs/00-getting-started-manual/specs/02-auth.md`、`specs/13-mvp-auth.md`

## 13.5 完了後のクリーンアップ

- PR merge 後、本 workflow directory を `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics-fu-002-h2-identity-rebuild/` に移動
- `outputs/phase-12/` 配下に Phase 12 strict 7 artifacts を生成（task-spec-creator skill の SSOT に従う）
- `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-002-h2-identity-rebuild.md` を削除または「→ completed-tasks/...」リンクへ置き換え
