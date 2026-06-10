# Phase 13: PR 作成

## 目的

ユーザー承認後に PR を `dev` 宛に作成する。本 wave は `implemented_local_evidence_captured` であり、ローカル実装・focused tests・web typecheck・web lint・診断スクリプト syntax/transport failure probe・static UI contract screenshot は完了している。staging 実機調査（`/me` status / D1 read-only）・認証 cookie 付き診断・staging runtime screenshot・commit・push・PR は user-gated。本 Phase は PR 作成の多段ゲートと PR 構成を仕様として確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | VISUAL |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | pending_user_approval |
| workflow_state | implemented_local_evidence_captured |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点・issue リンクなし） |

## 多段ゲート（spec / impl / external-ops）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| **Gate-A（spec）** | spec 完了（Phase 1〜12 + 3 タスク仕様 T01/T02/T03 + strict 7 + Phase 11 実機切り分け計画 + unassigned current 4 件） | ユーザー明示 OK（artifacts.json で passed 済） |
| **Gate-B（impl）** | 実装 + local 検証: `mise exec -- pnpm typecheck` / `pnpm lint` / web focused Vitest（`page.spec.tsx` / `session-error-display.spec.ts` / `safe-fetch.spec.ts` / `SectionError.spec.tsx`）PASS + apps/api 非接触（`git diff dev...HEAD -- apps/api` 空）+ 診断後 static UI contract screenshot 取得 | ユーザー明示 OK |
| **Gate-B'（diagnosis）** | staging 実機調査: DevTools Network で `/me` status 確認（MT-A）/ `bash scripts/diagnose-profile-session.sh` 実行（MT-B）/ `bash scripts/cf.sh d1` で `member_status.is_deleted` read-only 確認（MT-C）→ 真因を H3/H4/H5 に収束（AC-1/AC-2） | ユーザー明示 OK（staging 認証必須・user-gated） |
| **Gate-C（external-ops）** | staging authenticated runtime screenshot 取得 + commit / push / PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。Gate-B' / Gate-C は staging 認証セッションが必要なため user-gated（Claude Code は取得しない）。

## PR 構成

| 項目 | 値 |
| --- | --- |
| Title | `feat(profile,web): add /me session-fetch failure observability (410/5xx/transport disambiguation, structured logging, diagnose script)` |
| Base | `dev` |
| Head | `feat/profile-session-fetch-failure-investigation` |

### PR 本文（テンプレ）

```md
## Summary

- T01 (apps/web UI): `/profile` の Server Component が `/me` 取得失敗時に一律「時間をおいて再読み込み」へ集約していたデフォルト分岐を、`MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` で区別する。ユーザー向けには安全な一般文言を維持しつつ、開発者向けに原因コードを `data-cause`（`session-410`/`session-5xx`/`session-failed`）属性で可視化する。401→redirect・404→再ログイン CTA の既存挙動は回帰なし。
- T02 (apps/web lib): `safe-fetch.ts` の `/me` 取得失敗パスで `status`/`code`/`path` を構造化ログ出力する（memberId 等の個人情報は出さない・技術文字列はユーザー画面に露出しない）。
- T03 (scripts): read-only・冪等な診断スクリプト `scripts/diagnose-profile-session.sh` を追加し、staging `/me` の status 確認・env/secret parity 確認・deploy 版数確認を 1 本に集約する（`bash scripts/cf.sh` 経由・secret 実値は出さない）。

## Why

staging `/profile`（ログイン済み・管理者）で「セッション情報を取得できませんでした / 時間をおいて再読み込みしてください」エラーバナーが表示され本体が描画されない。症状は `/profile` page.tsx のデフォルト失敗分岐（非404・非redirect）で、`session-guard` の分岐と突き合わせると 401 は redirect され、404 は再ログイン CTA になるため、真因は 410（`member_status.is_deleted=1`）/ 5xx / transport 失敗のいずれか（H3/H4/H5）に絞られる。これら 3 つが一律集約され root cause が隠蔽されている観測性欠如（H6）が診断不能の主因。本 PR は **観測性を獲得して真因を即座に切り分けられるようにする**（区別表示 + 構造化ログ + 診断スクリプト）。`/me` の path・shape・status 体系・D1 schema・Google Form 仕様・`apps/api/src/**` は不変（apps/api 非接触）。真因確定後の本格修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 UX）は真因確定待ちの未タスク（C-1〜C-4）として分離。

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run 'app/(member)/profile/page.spec.tsx' src/lib/server-fetch/safe-fetch.spec.ts src/components/member/__tests__/SectionError.spec.tsx` PASS
- [ ] `git diff --name-only dev...HEAD -- apps/api` 空（apps/api 非接触・AC-6）
- [ ] staging 実機調査で `/me` status を確認し真因を H3/H4/H5 に収束（Gate-B'・auth-required user-gated）
- [ ] staging `/profile` の区別バナー runtime screenshot 取得（Gate-C・auth-required user-gated）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 本ワークフローは独立 issue 番号を持たない（relatedIssue=null）ため、PR 本文に issue リンクは付けない。

## blocked 条件

- Gate-A〜Gate-C のいずれかが未承認 → Phase 13 blocked。
- focused Vitest または typecheck/lint fail → Phase 8（リファクタリング）/ Phase 1（要件）へ戻る。
- `git diff dev...HEAD -- apps/api` が空でない（apps/api 接触）→ 該当変更を revert（AC-6 違反）。

## 完了条件

- [ ] Gate-A〜Gate-C すべてユーザー承認済み（user-gated）
- [ ] PR が `dev` base で open され URL が記録されている
- [ ] CI（required status checks）すべて green

## 出力

- `outputs/phase-13/phase-13.md`（本仕様）
- 実装サイクルで PR URL を `outputs/phase-13/pr.md` 等に記録予定

## 参照資料

- `outputs/phase-5/task-01..03-*.md`（実装仕様書本体）
- `outputs/phase-11/manual-test-result.md`（staging 実機切り分け MT-A〜MT-D）
- `outputs/phase-12/implementation-guide.md`（PR 本文の根拠）
- `CLAUDE.md` §「PR作成の完全自律フロー」
