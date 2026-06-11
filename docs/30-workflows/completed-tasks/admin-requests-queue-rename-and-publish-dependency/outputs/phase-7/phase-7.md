# Phase 7 — カバレッジ確認

`[実装区分: 実装仕様書]` / taskType: implementation / visualEvidence: VISUAL / workflow_state: implemented_local_evidence_captured

> 正本は [_shared-context.md](../../_shared-context.md)（特に §7 テスト方針 / §8 検証コマンド）。Phase 1-3 設計書と整合させ、後続実装者が「どのファイルをどの粒度でカバーすればよいか」を曖昧さなく実行できるようにする。
>
> 本サイクルでは **コード実装・テスト実行を完了した**（implemented_local_evidence_captured）。本 Phase は「本実装サイクルが満たすべきカバレッジ目標と測定手順」を確定する仕様。

---

## 7.1 カバレッジ方針

このタスクの変更は **(A) seed 生成（純データ + 決定論的 SQL 生成）/ (B) apps/web 表示テキスト / (C) 会員一覧 projection への読み取り専用フィールド追加 + UI バッジ** の 3 レーンに閉じる。よってカバレッジは「ロジックを増やした箇所」=Lane A の生成ロジックと Lane C の純関数・分岐 UI を重点とし、Lane B（表示テキストのみ）は分岐網羅を component spec で担保する。

| 種別 | 重点 | 理由 |
| --- | --- | --- |
| **branch 100% 目標** | `parsePendingRequestTypes`（Lane C 純関数）/ `build-seed-sql.ts` の依頼 INSERT 生成ロジック | 新規に増えた分岐（NULL/不正 JSON/payload 空/note_type 種別）を全網羅 |
| **分岐網羅（component spec）** | 申請中バッジの出/非出・遷移先 type 分岐・命名後ラベル | UI の条件分岐は描画 assert で網羅 |
| **非破壊（regression）** | 既存 `requests.contract.spec` / `RequestQueueDetail` spec / members list spec | 命名・新フィールドで既存テストが GREEN を保つ |

---

## 7.2 Lane 別カバレッジ目標と測定対象ファイル

| Lane | 測定対象（プロダクトコード） | カバーする spec | カバレッジ目標 | 重点分岐 |
| --- | --- | --- | --- | --- |
| **A** | `apps/api/src/testing/test-accounts/build-seed-sql.ts`（依頼 INSERT 生成・cleanup DELETE 生成の追加分） | `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（既存拡充） | 追加生成ロジック **branch 100%** | payload あり（`json(...)`）/ payload 空（`json_object()`）/ visibility vs delete / `INSERT OR REPLACE` 冪等 |
| **A** | `apps/api/src/testing/test-accounts/catalog.ts`（`requests` 配列追加） | `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts`（既存拡充） | 追加データの存在 assert（3 件・3 パターン） | hidden 申請 / public 申請 / 退会申請が各 1 件 |
| **C(API)** | `apps/api/src/routes/admin/members.ts` の `parsePendingRequestTypes` 純関数 + 相関サブクエリ projection | `apps/api/src/routes/admin/members.contract.spec.ts`（既存拡充） | 純関数 **branch 100%** + projection の有/無 | NULL→`[]` / 不正 JSON→`[]` / 非配列→`[]` / 既知 enum のみ通過・未知値除外 / 空配列 / 単一 / 複数（visibility+delete） |
| **C(shared schema)** | `AdminMemberListViewZ` の `pendingRequestTypes`（`packages/shared` or `apps/api` の正本 + web 再宣言） | 同 contract spec（safeParse 成功・default `[]`） | default 適用・enum 外 reject の分岐 | フィールド省略時 `[]` default / enum 外値の扱い |
| **B** | `RequestQueuePanel.tsx` / `RequestQueueDetail.tsx` / `shell-config.ts` の表示ラベル | `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx`（既存拡充） | 命名後ラベルの分岐網羅 | `会員からの申請`（h1）/ `申請一覧`（aria-label）/ `未処理の申請はありません`（空表示）/ 役割説明文・相互リンク描画 |
| **C(web UI)** | 会員一覧行コンポーネント（`rg "MemberRow\|区画 / ステータス\|members" apps/web/src/components/admin` で特定） | 同階層の members 行 component spec（既存拡充 or 新規 `*.component.spec.tsx`） | バッジ分岐網羅 | `pendingRequestTypes.length===0`→バッジ非表示 / `["visibility_request"]`→「申請中」+ `href=...type=visibility_request` / `["delete_request"]`→ `type=delete_request` / 両方→優先 or 両チップ（遷移先 type が実在タブに一致） |

> 新規 spec は `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8）。`*.test.{ts,tsx}` は lefthook `block-test-suffix` / CI `verify-test-suffix` が reject する。

---

## 7.3 `parsePendingRequestTypes` の branch 100% テスト表（Lane C 純関数）

純関数は `members.ts` の既存 `parseTagsJson`（L130 付近）の隣に同型で配置する想定（詳細は Phase 8）。以下の入力全分岐を contract spec で網羅する。

| # | 入力 `pending_request_types_json` | 期待 | カバー分岐 |
| --- | --- | --- | --- |
| 1 | `null` | `[]` | NULL guard |
| 2 | `""`（空文字） | `[]` | 空/parse 失敗 guard |
| 3 | `"{ 壊れた JSON"` | `[]` | try/catch（不正 JSON）|
| 4 | `'"visibility_request"'`（非配列） | `[]` | 非 array guard |
| 5 | `'[]'` | `[]` | 空配列 |
| 6 | `'["visibility_request"]'` | `["visibility_request"]` | 既知 enum 単一 |
| 7 | `'["delete_request"]'` | `["delete_request"]` | 既知 enum 単一（別種別） |
| 8 | `'["visibility_request","delete_request"]'` | 両要素（順序不問） | 複数 |
| 9 | `'["general","visibility_request"]'` | `["visibility_request"]` | 未知 note_type の除外 |
| 10 | `'[null, 123, "visibility_request"]'` | `["visibility_request"]` | 非文字列要素の除外 |

> AC-9（list item に `pendingRequestTypes` が載る）・AC-10（バッジ + 遷移先 type）の基盤。空配列許容・順序不問は §5 データ契約に従う。

---

## 7.4 focused test 実行コマンド（DoD・SSOT §8 正本）

```bash
# Lane A + Lane C(API): admin routes + seed builder
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts

# Lane B + Lane C(web): admin components（命名ラベル + バッジ）
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin
```

カバレッジ計測を取る場合（任意・目標確認用）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin/members.contract.spec.ts --coverage
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/testing/test-accounts --coverage
```

---

## 7.5 統合検証手順（seed drift guard）

seed 生成物（committed SQL）は `scripts/gen-test-accounts-seed.mjs` で生成し、`--check` で drift（生成 vs committed の byte 一致）を検証する（裏取り済み・正本コマンド）。

```bash
# 1) catalog.ts / build-seed-sql.ts 拡張後、生成物を再生成
mise exec -- node scripts/gen-test-accounts-seed.mjs          # apps/api/package.json: seed:test-accounts:gen 相当

# 2) drift guard（committed と byte 一致なら exit 0・差分があれば "drift: <path>" を出力し非0）
mise exec -- node scripts/gen-test-accounts-seed.mjs --check

# 3) ビルダ単体テスト（生成 SQL に 3 依頼 INSERT・cleanup DELETE が含まれることを assert）
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/testing/test-accounts
```

> 生成物（`apps/api/migrations/seed/test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json`）は再生成結果をコミット対象に含める（user-gated・Phase 13）。manifest は申請が member メタに影響しないなら不変だが、`--check` 出力で確認する。

---

## 7.6 カバレッジ充足の確認観点（AC 紐付け）

| 確認観点 | コマンド/spec | 充足 AC |
| --- | --- | --- |
| seed 生成 SQL に 3 依頼 INSERT が含まれる | build-seed-sql.spec.ts | AC-5, AC-6 |
| cleanup SQL に `DELETE ... note_id LIKE 'TEST-NOTE-%'` | build-seed-sql.spec.ts | AC-7 |
| drift guard byte 一致 PASS | `gen-test-accounts-seed.mjs --check` | AC-6 |
| list item に `pendingRequestTypes` が載る / 空配列含む | members.contract.spec.ts | AC-9 |
| 申請中バッジ表示 + 正しい href | members 行 component spec | AC-10 |
| 命名後ラベル「会員からの申請」「申請一覧」 | RequestQueuePanel.component.spec.tsx | AC-1, AC-2, AC-3 |
| 既存 contract/component spec 非破壊 | 上記 focused test 全 GREEN | AC-12 |

---

## 7.7 完了条件（Phase 7）

- [ ] Lane A/B/C 別のカバレッジ目標と測定対象ファイルを表で確定した
- [ ] `parsePendingRequestTypes` / build-seed-sql の生成ロジックを branch 100% 目標として 10 分岐入力表で定義した
- [ ] focused test 実行コマンド（api `src/routes/admin src/testing/test-accounts` / web `src/components/admin`）を SSOT §8 から正本化した
- [ ] seed drift guard の統合検証手順（`gen-test-accounts-seed.mjs --check`）を確定した
- [ ] カバレッジ確認観点を AC-1..13 に紐付けた
- [x] 本 Phase のローカルコード/テスト検証は本実装サイクルで完了（staging runtime evidence のみ user-gated）
