# Phase 9: 品質保証 — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

## 0. 方針

本 Phase は、PASS済みローカル実装（GREEN + リファクタ完了後）が満たした QA 基準を記録する。本 workflow は **implemented_local_evidence_captured** 段階のため、ローカル deterministic gate は実行済み、commit / PR / staging の external ops のみユーザー承認後・Phase 13 に残す。判定対象は line budget / link / typecheck / lint / focused D1 test の一括。

---

## 1. 品質ゲート一括判定表

| # | ゲート | 実行コマンド | PASS 基準 |
|---|-------|-------------|-----------|
| Q-1 | typecheck | `mise exec -- pnpm typecheck` | エラー 0。`createMemberWithStatus` の型（`DbCtx` + `UpsertMemberInput` → `Promise<void>`）と `identities.ts` の `MemberId` import が整合 |
| Q-2 | lint | `mise exec -- pnpm lint` | エラー 0。import 整理後の no-unused-vars 含む（RT-2/RT-3 の整理が裏取りされる） |
| Q-3 | focused D1 テスト | 下記 §2 のコマンド | 対象 spec 全 PASS（新規 + 既存回帰） |
| Q-4 | apps/web diff 0（AC-6） | `git diff --name-only dev...HEAD \| grep '^apps/web/' \| wc -l` | 出力 `0`（apps/web 無変更） |
| Q-5 | migration 不在（AC-7） | `git diff --name-only dev...HEAD \| grep 'apps/api/migrations/' \| wc -l` | 出力 `0`（新規 migration・schema 変更なし） |
| Q-6 | grep gate（AC-3・新規生成経路の散在解消） | 下記 §3 | P-1/P-2 に独立 `ensureMemberStatusRow` 呼び出しが残らない / P-3 は保持される |
| Q-7 | link / line budget | docs の相対リンク有効性・各 phase 行数が異常肥大していないこと（CONST_005 粒度） | リンク切れ 0 / phase docs に意図せぬ巨大 diff なし |

> Q-7 の line budget は本タスクのコード変更が「helper 1 個 + 1 行連結 + 1 呼び出し差し替え + import 整理 + コメント更新」という小規模（scale:small）に収まることの確認。`git diff --stat dev...HEAD` で apps/api 変更が数十行規模であり、想定外の大量 diff（無関係ファイル混入）がないことを見る。

---

## 2. テスト実行コマンド（focused・全件 SIGKILL 回避）

```bash
# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# focused D1 テスト（vitest.d1.config.ts は repo root。新規 + 回帰の対象 spec を明示指定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts \
  apps/api/src/routes/auth/session-resolve.contract.spec.ts

# apps/web diff 0 確認（AC-6）
git diff --name-only dev...HEAD | grep '^apps/web/' | wc -l   # → 0 期待

# migration 不在確認（AC-7）
git diff --name-only dev...HEAD | grep 'apps/api/migrations/' | wc -l   # → 0 期待
```

---

## 3. grep gate（AC-3 / Q-6）

新規生成経路（P-1 ingest / P-2 auto-link）に独立した `ensureMemberStatusRow` 呼び出しが残っていないこと、かつ P-3 防御は保持されることを機械検証する。

```bash
# (a) ingest（P-1）に独立 ensureMemberStatusRow が残っていないこと（→ 0 期待。helper 内部委譲へ移管済み）
grep -n "ensureMemberStatusRow" apps/api/src/jobs/sync-forms-responses.ts

# (b) auto-link（P-2）= identities.ts には status 連結が「ある」こと（→ 1 行ヒット期待。backfillIdentityFromCandidate 内）
grep -n "ensureMemberStatusRow" apps/api/src/repository/identities.ts

# (c) P-3 防御は保持されること（→ member-status.ts:60 付近に 1 行ヒット期待）
grep -n "ensureMemberStatusRow" apps/api/src/routes/admin/member-status.ts

# (d) 正規 helper が新設され ingest が経由していること（→ members.ts 定義 + sync-forms-responses.ts 呼び出しがヒット）
grep -rn "createMemberWithStatus" apps/api/src --include="*.ts" | grep -v ".spec.ts"
```

| 検査 | 期待 | 意味 |
|------|------|------|
| (a) | 0 件 | P-1 ingest の独立呼び出しが集約され helper 内へ移管された |
| (b) | 1 件（`backfillIdentityFromCandidate` 内の連結） | P-2 auto-link の orphan が status 連結で解消された |
| (c) | 1 件（`member-status.ts` の防御） | P-3 は F-4 判定どおり意図的に保持された（除去禁止） |
| (d) | 2 件以上（`members.ts` 定義 + `sync-forms-responses.ts` 呼び出し） | 正規 helper が新設され ingest が経由している |

> grep gate の判定原則: AC-3 の「散在集約」対象は **新規生成経路 P-1/P-2 のみ**。P-3（route 防御）は性質が異なる backstop であり、(c) でヒットすること自体が PASS 条件（消えていたら FAIL）。

---

## 4. 削除確認（[FB-UI-02-1]）

本タスクは **関数追加 + 1 行連結 + 呼び出し差し替え中心**であり、関数・ファイルの「削除」は主目的ではない。削除に該当しうる箇所と判定基準を以下に明記する。

| 該当箇所 | 種別 | [FB-UI-02-1] 判定 |
|---------|------|-------------------|
| ingest（P-1）の独立 `ensureMemberStatusRow(dbCtx, memberId)` 呼び出し（`sync-forms-responses.ts:314`） | 呼び出し行の除去（helper 内部委譲へ移管） | **「live import 0」基準で PASS 判定**: 差し替え後 ingest 内に `ensureMemberStatusRow` の live 参照が 0（§3 (a) = 0 件）であること。stub 化ではなく、helper への責務移管に伴う呼び出し除去 |
| ingest の `ensureMemberStatusRow` named import（`status` import 文内） | import 除去（他 named import は残す） | **「live import 0」**: `ensureMemberStatusRow` の job 内 live 参照が 0 なら import から外す。`getStatus` / `setConsentSnapshot` は live で残るため import 文自体は維持（RT-3） |
| `upsertMember` named import（ingest） | import 除去の可能性 | 他用途で残らなければ除去。残れば維持（RT-2・実コード grep で確認） |
| 関数・ファイルの git delete | （該当なし） | **N/A**: 本タスクは関数・ファイルの物理削除を行わない（`upsertMember` / `ensureMemberStatusRow` 本体は再利用・存続） |

> [FB-UI-02-1] の PASS 基準適用: 除去対象（呼び出し・import）は「live import 0」を機械確認（§3 grep）してから外す。関数本体の git delete または stub 化は本タスクに存在しないため、その項目は N/A。

---

## 5. AC-1〜AC-7 一括充足確認（index.md §3）

| AC | 充足の検証 | 対応ゲート / spec |
|----|-----------|-------------------|
| AC-1 | member 作成経路の棚卸し表（ingest / auto-link）が文書化され全経路列挙 | index §1.2 / phase-1 §5 / §3 grep（経路確認） |
| AC-2 | identity + status 既定行を同期生成する単一 helper が新設 | §3 (d) / `members.repository.spec.ts`（helper 単体・冪等） |
| AC-3 | 全生成経路が helper 経由 or status 連結に差し替え、新規生成経路の散在呼び出しが集約 | §3 (a)=0 / (b)=1 / (c) 保持 |
| AC-4 | どの経路から作っても `member_status` 既定行が生成される | `sync-forms-responses.contract.spec.ts`（P-1）/ `identities.autolink.repository.spec.ts`（P-2） |
| AC-5 | 既存 endpoint surface・レスポンス不変で回帰なし | Q-1 typecheck / `member-status.contract.spec.ts` 等の既存 spec 全 PASS |
| AC-6 | apps/web 無変更（diff 0） | Q-4（`git diff --name-only` に apps/web なし） |
| AC-7 | D1 schema 変更・新規 endpoint・FK なし | Q-5（migration 0 件）/ followup-002 と非重複 |

---

## 6. 品質ゲート判定（implemented_local_evidence_captured 段階の位置づけ）

| ゲート | 段階判定 | 備考 |
|-------|---------|------|
| Q-1〜Q-7 / AC-1〜AC-7 | **GREEN** | focused D1 tests 5 files / 51 tests PASS、API typecheck/lint PASS、apps-web diff 0、新規 migration 0。commit・PR・staging はユーザー承認後のみ |
| Gate-B（implementation） | passed | Q-1〜Q-7 focused evidence PASS |
| Gate-C（PR） | blocked_pending_user_approval | Phase 13 |

> 本タスクは implemented_local_evidence_captured。上記コマンドは実装者が「迷わず再実行して PASS 判定できる」粒度（CONST_005）で確定し、ローカル実装 wave で focused evidence を取得済み。未実施として残すのは commit / PR / staging smoke の external ops のみ。

---

## 7. 完了条件

- [ ] line budget / link / typecheck / lint / 全テストの一括判定表を確定した（Q-1〜Q-7）
- [ ] 実行コマンド一覧（typecheck / lint / focused D1 vitest / apps/web diff 0 / grep gate）を提示した
- [ ] grep gate で P-1/P-2 の散在解消・P-3 保持の期待値を明記した
- [ ] [FB-UI-02-1]「git delete OR stub 化 + live import 0」基準で削除確認を判定した（関数削除なしの箇所は N/A 明記）
- [ ] AC-1〜AC-7 の一括充足確認表を作成した
- [ ] 品質ゲートを implemented_local_evidence_captured 段階の QA 基準として位置づけた（external ops のみユーザーゲート）
