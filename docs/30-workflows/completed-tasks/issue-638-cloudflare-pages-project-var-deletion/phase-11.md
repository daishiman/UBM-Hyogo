# Phase 11: DoD・evidence 受入条件

## 11.1 Definition of Done (CONST_005)

すべて満たすこと:

### DoD-A: 削除完了

- [x] `outputs/phase-11/evidence/user-approval-marker.md` が存在し、削除 command / rollback command / commit-push-PR 承認範囲を含む
- [x] `gh api repos/daishiman/UBM-Hyogo/actions/variables/CLOUDFLARE_PAGES_PROJECT` が HTTP 404 を返す
- [x] `gh api repos/daishiman/UBM-Hyogo/actions/variables` の JSON `.variables[].name` に `CLOUDFLARE_PAGES_PROJECT` が含まれない
- [x] `total_count` が削除前 4 → 削除後 3

### DoD-B: Evidence 取得

- [x] `outputs/phase-11/before.json` が存在し variable 4 件を含む
- [x] `outputs/phase-11/before-single.json` が存在し value=`ubm-hyogo-web` を記録
- [x] `outputs/phase-11/after.json` が存在し variable 3 件で `CLOUDFLARE_PAGES_PROJECT` を含まない
- [x] `outputs/phase-11/after-single.txt` が "HTTP 404" を含む
- [x] `outputs/phase-11/grep-gate.txt` が空ファイル（0 byte）
- [x] `outputs/phase-11/deletion-log.md` が Phase 6.3 フォーマットで作成済

### DoD-C: ドキュメント整合

- [x] `docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/` 配下に `index.md` + `phase-01.md` 〜 `phase-13.md` の計 14 ファイルが存在
- [x] `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md` 冒頭に SUPERSEDED marker が追記済

### DoD-D: ローカル品質ゲート（sanity）

- [ ] `mise exec -- pnpm typecheck` exit 0（apps/packages/scripts/.github に差分がある場合は blocking、無い場合は sanity）
- [ ] `mise exec -- pnpm lint` exit 0（apps/packages/scripts/.github に差分がある場合は blocking、無い場合は sanity）

### DoD-E: PR 状態（Phase 13 user-gated）

- [ ] user approval 後、PR が `dev` ブランチを base に作成済
- [ ] PR title が `docs(issue-638): delete CLOUDFLARE_PAGES_PROJECT GitHub variable` 形式
- [ ] PR body に `Refs #638` を含む（Issue は CLOSED のまま、close 操作なし）

DoD-E は Phase 13 の承認ゲートであり、Phase 11 の削除 evidence 完了判定をブロックしない。

## 11.2 Evidence 受入時の判定フロー

```
1. outputs/phase-11/ の 6 ファイルが揃っているか
2. before.json / after.json の diff が "CLOUDFLARE_PAGES_PROJECT 1 件除去のみ" か
3. after-single.txt に HTTP 404 が含まれるか
4. grep-gate.txt が 0 byte か
5. typecheck / lint exit 0 か
6. supersede marker が旧 spec に追記済か

→ すべて YES なら DoD 達成
→ 1 件でも NO なら Phase 8.5 fail 対応に従う
```

## 11.3 PR レビュー観点（self-review）

| 観点 | 確認内容 |
| --- | --- |
| 削除対象 | `CLOUDFLARE_PAGES_PROJECT` のみ。他 variable 不変 |
| scope | repo scope のみ。environment scope は事前確認で不在を確認済 |
| Issue 状態 | #638 は CLOSED のまま（ユーザー指示） |
| historical 改変 | `completed-tasks/` 配下は触っていない |
| 機密漏洩 | 削除した variable の value=`ubm-hyogo-web` は非機密（Pages project 名） |
