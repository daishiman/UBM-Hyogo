# Phase 7: カバレッジ確認 — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

## 0. 方針（[Feedback BEFORE-QUIT-002 / Feedback 5]）

coverage の評価対象は **本タスクで変更/追加した関数・ブロックの行に限定**する。`apps/api/src/**` を一律に閾値判定したり、無関係なファイル（既存の他 repository・routes・apps/web）まで coverage 目標に含めない。理由は、本タスクは「生成責務の単一点集約」という構造変更であり、影響範囲が以下の 3 関数 + 1 呼び出し差し替えに閉じているため。全件 coverage を強制すると無関係 diff の揺れで誤判定が出る（FB-UI-02-2 と同趣旨）。

> 評価は「変更行（changed lines）」基準。`git diff dev...HEAD` で着色される行のみを line/branch カバレッジの分母とする。新規 helper は新規行=全行が分母になる。

---

## 1. coverage 対象範囲（変更行限定）

| # | 対象（ファイル:関数） | 変更種別 | 変更行（実コード行・実装後の想定） | line 目標 | branch 目標 |
|---|----------------------|---------|----------------------------------|----------|------------|
| C-1 | `apps/api/src/repository/members.ts` : `createMemberWithStatus`（**新規**） | 追加 | helper 本体全行（`upsertMember` 委譲 + `ensureMemberStatusRow` 委譲の 2 行 + シグネチャ） | **line 100%** | **branch 100%**（後述の冪等経路含む） |
| C-2 | `apps/api/src/repository/identities.ts` : `backfillIdentityFromCandidate` の status 連結（INSERT OR IGNORE 後に `findIdentityByEmail` で実 identity を確定し、存在時のみ `ensureMemberStatusRow(c, asMemberId(identity.member_id))`） | 追加 | 追加した再取得 + 条件分岐 + `asMemberId` / `ensureMemberStatusRow` import | **line 100%** | **branch 100%**（identity あり / なし、および競合 no-op で losing candidate に status を作らない経路） |
| C-3 | `apps/api/src/jobs/sync-forms-responses.ts` : helper 差し替え箇所（`:307` `upsertMember` + `:314` `ensureMemberStatusRow` の 2 呼び出し → `:307` `createMemberWithStatus` 1 呼び出し。`writeCount += 2` は不変） | 置換 | 置換後の `createMemberWithStatus(dbCtx, {...})` 呼び出し行（`isFirstResponse` の新規 identity 分岐 = `else` ブロック内） | **line 100%**（新規 member 経路） | 既存 `if (existingIdentity) / else` 分岐は不変。差し替え行は `else` 側で必ず通過 |

> C-1 の branch 100% の意味: `createMemberWithStatus` 自体には条件分岐がないが、内部委譲する `upsertMember`（`ON CONFLICT DO UPDATE`）と `ensureMemberStatusRow`（`INSERT OR IGNORE`）の **冪等経路**（= 新規 INSERT が成立するケースと、既存行で no-op になるケース）の両方を helper 単体テストで通す。具体的には「新規 memberId で 1 回目呼ぶと 2 行生成」「同一 memberId で 2 回目呼ぶと例外なし・重複なし」を別ケースで検証し、冪等性の双方の分岐を coverage に含める。

---

## 2. concern × dependency edge の coverage 可視化

本タスクの中核は「identity 生成 → member_status 生成」という**同期生成の依存辺（dependency edge）**を、各経路で必ず通すこと。下表で各 concern とその依存辺が coverage されることを可視化する。

| concern（経路） | dependency edge（identity → status の同期） | カバーする spec | この edge を検証するアサーション |
|----------------|---------------------------------------------|----------------|----------------------------------|
| 単一 helper 単体（C-1） | `upsertMember`（identity）→ `ensureMemberStatusRow`（status）が 1 呼び出しで両方走る | `members.repository.spec.ts`（新規 or 拡張） | helper 1 回呼び出し後、`member_identities` に行あり **かつ** `member_status` に既定行あり（`public_consent='unknown'` / `publish_state='member_only'`） |
| P-1 ingest（C-3） | 新規 member（`else` 分岐）で identity upsert → status 既定行が同期生成 | `sync-forms-responses.contract.spec.ts`（回帰・拡張） | 新規 responseEmail を ingest 後、当該 memberId の `member_status` 行が存在し `writeCount` が従来どおり 2 増 |
| P-2 auto-link（C-2・最重要） | `backfillIdentityFromCandidate` の identity INSERT OR IGNORE → status 連結が必ず走る | `identities.autolink.repository.spec.ts`（新規 or 拡張） | candidate から backfill 後、`member_identities` に行あり **かつ** `member_status` 既定行あり。再呼び出しでも重複・例外なし（冪等） |
| P-3 route 防御（保持・非生成経路） | （新規生成しない・既存行 mutation 前の防御呼び出し） | `member-status.contract.spec.ts`（非回帰） | legacy orphan（status 行なし identity）への PATCH が 404 にならず status 既定行が生成され mutation 成功（既存挙動の維持確認） |

> dependency edge の可視化目的: 「identity だけ生成され status が欠ける」という orphan 状態が、変更後の全経路で再現不能であることを coverage 上で証明する。各行の coverage（§1）に加え、上表の edge アサーションが PASS して初めて「同期生成」が機械検証されたとみなす。

---

## 3. カバレッジ計測コマンド（focused / 変更ファイルのみ対象）

`vitest.d1.config.ts`（リポジトリ root に存在）経由で、**本タスクの変更に対応する spec ファイルだけを明示指定**して計測する。全件実行（SIGKILL リスク・FB-UI-02-2）を避ける。

```bash
# focused: 変更経路に対応する D1 spec だけを対象に coverage 計測
# （vitest.d1.config.ts は repo root。--root はリポジトリ root を指す）
mise exec -- pnpm exec vitest run \
  --root=. \
  --config=vitest.d1.config.ts \
  --coverage \
  --coverage.include="apps/api/src/repository/members.ts" \
  --coverage.include="apps/api/src/repository/identities.ts" \
  --coverage.include="apps/api/src/jobs/sync-forms-responses.ts" \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts
```

> `--coverage.include` を変更 3 ファイルに限定することで、coverage の分母を本タスクの変更ファイルだけに絞る（[Feedback BEFORE-QUIT-002]）。`status.ts` の `ensureMemberStatusRow` は本タスクで内部委譲されるが**実装は不変**のため coverage 対象に含めない（再利用であり変更行ではない）。

PASS済みローカル実装での確認手順:
1. 上記コマンドを実行し、`apps/api/coverage/d1/` のレポートで C-1〜C-3 の行が covered であることを確認する。
2. `createMemberWithStatus` の全行が covered（line 100%）であること。
3. `backfillIdentityFromCandidate` の追加 status 連結行が covered であること。
4. `sync-forms-responses.ts` の差し替え呼び出し行（`else` 分岐）が covered であること。

> D1 include パターン補足: `members.repository.spec.ts` / `identities.autolink.repository.spec.ts` は `apps/api/src/repository/**/*.repository.spec.ts`、`sync-forms-responses.contract.spec.ts` は `apps/api/src/jobs/**/*.contract.spec.ts`、`member-status.contract.spec.ts` / `session-resolve.contract.spec.ts` は `apps/api/src/routes/**/*.contract.spec.ts` に各々マッチし、`vitest.d1.config.ts` の `D1_INCLUDE` で拾われる。

---

## 4. coverage 対象外（明記）

| 対象外 | 理由 |
|-------|------|
| `apps/web/**` | 本タスクは無変更（不変条件 #5・AC-6）。diff 0 のため coverage 評価対象外 |
| `apps/api/src/repository/status.ts`（`ensureMemberStatusRow` / `defaultMemberStatusRow`） | 既存 helper の**再利用のみ**で実装不変。変更行ゼロにつき対象外（既存 `status.repository.spec.ts` の既存カバレッジを維持するのみ） |
| `apps/api/src/repository/members.ts` の既存関数（`upsertMember` / `findMemberById` / `listMembersByIds`） | 変更なし。`createMemberWithStatus` から内部委譲されるが本体は不変 |
| `apps/api/src/routes/admin/member-status.ts:60` の `ensureMemberStatusRow`（P-3 防御） | F-4 判定で**意図的に保持**（新規生成経路ではない）。挙動不変のため非回帰確認のみ（§2 P-3 行）で、新規 coverage 目標は課さない |
| `apps/api/migrations/**` | 新規 migration なし（AC-7）。backfill 0025 再利用のため対象外 |
| その他 `apps/api` 全 repository / routes / jobs | 本タスクの変更範囲外。一律閾値判定しない（[Feedback BEFORE-QUIT-002]） |

---

## 5. 完了条件

- [ ] coverage 対象を変更行（C-1/C-2/C-3）に限定して明示した（[Feedback BEFORE-QUIT-002]）
- [ ] `createMemberWithStatus`: line 100% / 冪等経路（新規 INSERT・再呼び出し no-op）の branch を coverage に含めた
- [ ] `backfillIdentityFromCandidate` の status 連結追加行が covered であることを確認した
- [ ] `sync-forms-responses.ts` の helper 差し替え行が covered であることを確認した
- [ ] concern × dependency edge（identity → status 同期）の coverage を表で可視化した
- [ ] focused 計測コマンド（変更 3 ファイル限定 `--coverage.include`）を提示した
- [ ] coverage 対象外（apps/web / status.ts 再利用部 / migrations）を明記した
