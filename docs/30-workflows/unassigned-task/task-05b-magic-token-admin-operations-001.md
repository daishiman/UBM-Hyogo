# Magic Token 履歴・強制無効化 admin operations - タスク指示書

## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | task-05b-magic-token-admin-operations-001                            |
| タスク名     | Magic Token 履歴・強制無効化 admin operations                        |
| 分類         | admin-ops / 運用機能                                                 |
| 対象機能     | apps/api admin / magic_tokens テーブルの可視化と revoke              |
| 優先度       | 中（MVP 後の運用 wave で着手）                                       |
| 見積もり規模 | 中規模                                                               |
| ステータス   | 未実施                                                               |
| 発見元       | 05b unassigned-task-detection U-04 / U-05                            |
| 発見日       | 2026-04-29                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05b（Magic Link Provider と Auth Gate State の並列実装）では `apps/api/src/repository/magicTokens.ts` に
`issue` / `consume` / `deleteByToken` を実装し、token の発行・consume・rollback の中核ロジックを完成させた。
一方で「admin が token 発行履歴を一覧する」「緊急時に未消費 token を強制 revoke する」運用面は MVP スコープ外として残し、
admin backoffice route として未実装のままになっている。

### 1.2 問題点・課題

- magic_tokens テーブルに対する admin 可視化経路が存在しないため、運用 incident 時には
  D1 への直 query（`bash scripts/cf.sh d1 execute ... --command "SELECT ..."`) を operator が手で打つ運用負荷がある。
- 強制無効化が API として存在しないため、誤発行や漏洩疑いが発生しても
  ローカル wrangler/cf.sh から DELETE/UPDATE を実行する経路しか残されていない。
- 直 query 経路は audit log に乗らず、誰がいつ何を消したかが追跡できない。

### 1.3 放置した場合の影響

- token 漏洩疑いの incident 対応が operator のシェル操作に依存し、対応時間と human error リスクが増える。
- audit 不在のまま admin operator が D1 を直接書き換える運用が常態化する。
- token 値そのものを誤って表示する admin UI を後付けで作るリスクが残り、機密境界が崩れる。

---

## 2. 何を達成するか（What）

### 2.1 目的

magic_tokens テーブルに対する admin operations（履歴閲覧 + 強制無効化）を `apps/api` の admin route として
正式に実装し、D1 直 query 経路を運用標準から外す。

### 2.2 最終ゴール

- admin が「member_id / email / 状態（issued/consumed/expired/revoked）/ 発行日時 / 消費日時」を一覧 UI / API で確認できる。
- admin が未消費 token を強制 revoke でき、操作が audit log に残る。
- token 値そのもの（plain / hash いずれも）は admin UI / API のいかなる response にも含まれない。

### 2.3 スコープ

#### 含むもの

- `GET /admin/magic-tokens` 履歴一覧 API（token 値マスキング済 schema）
- `POST /admin/magic-tokens/:id/revoke` 強制無効化 API
- 上記に対応する admin UI（apps/web 配下、Auth.js admin role gate 経由）
- audit log への revoke 操作記録
- token 値マスキングを契約レベルで保証する schema 定義

#### 含まないもの

- token 発行ロジック自体の変更（`apps/api/src/repository/magicTokens.ts` 既存実装は不変）
- magic link UX の admin 側からの再送信機能（別タスクで扱う）
- 公開 API への変更

### 2.4 成果物

- `apps/api/src/routes/admin/magicTokens.ts`（新規）
- `apps/api/src/repository/magicTokens.ts` への admin 用クエリ追加（token 値を返さない select 限定）
- audit log への記録経路
- admin UI 画面（一覧 + revoke ボタン）
- API contract test と repository test

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 05b（Magic Link Provider + Auth Gate State）が main にマージされている
- admin role gate（Auth.js role claim）が有効化されている
- audit log の書き込み経路が確立している

### 3.2 依存タスク

- 05b マージ済（必須）
- admin backoffice 基盤（04c admin endpoints）の取り込み

### 3.3 必要な知識

- `apps/api/src/repository/magicTokens.ts` の issue/consume/deleteByToken 仕様
- magic_tokens テーブル schema（特に token 列が hash 保管である前提）
- 不変条件: token 値は plain でも hash でも response に含めない
- Auth.js admin role gate と audit log 書き込み境界

### 3.4 推奨アプローチ

API contract を「token 値マスキング済 view」として最初に固定する。
repository 層には admin 専用 select 関数（例: `listForAdmin()` / `findByIdForAdmin()`）を追加し、
SELECT 句から token 列を物理的に除外することで、誤って response に乗る経路を型レベルで遮断する。

---

## 4. 実行手順

### Phase構成

1. 既存実装と schema の棚卸し
2. API contract 設計（token 値マスキング不変条件の明文化）
3. repository 拡張（admin 専用 select / revoke）
4. admin route 実装と audit log 連携
5. admin UI 実装
6. テストと不変条件検証

### Phase 1: 既存実装と schema の棚卸し

#### 目的

`magicTokens.ts` の既存 API と magic_tokens テーブルの列を全件確認し、admin 可視化に必要な列だけを抽出する。

#### 手順

1. `apps/api/src/repository/magicTokens.ts` の export を列挙
2. magic_tokens テーブルの DDL と index を確認
3. admin 可視化に必要な列（id / member_id / email / status / created_at / consumed_at / expires_at）と
   返してはいけない列（token 値 / token_hash）を分類

#### 完了条件

可視化対象列と除外列の二分が一覧化されている。

### Phase 2: API contract 設計

#### 目的

admin route の request/response schema を確定し、token 値マスキングを不変条件として記録する。

#### 手順

1. `GET /admin/magic-tokens` の query parameter（page / status filter / member_id filter）を決定
2. response item schema を定義（token 値・hash を含めない）
3. `POST /admin/magic-tokens/:id/revoke` の request/response を定義
4. 不変条件「admin response は token 値も hash も返さない」を contract レベルのコメントとテストに固定

#### 完了条件

OpenAPI / zod schema に token 列が一切現れない状態が確定している。

### Phase 3: repository 拡張

#### 目的

admin 用 select / revoke を repository 層に追加する。

#### 手順

1. `listForAdmin(filters, pagination)` を追加（SELECT 句から token 列を除外）
2. `findByIdForAdmin(id)` を追加
3. `revokeById(id, actorId, reason)` を追加（status を revoked へ更新、consumed_at は触らない）
4. 既存 `issue` / `consume` / `deleteByToken` は不変

#### 完了条件

admin 用関数が token 列を返さない型で実装され、unit test が通る。

### Phase 4: admin route と audit log

#### 目的

route 層を実装し、revoke 操作を audit log に記録する。

#### 手順

1. `apps/api/src/routes/admin/magicTokens.ts` を新規作成
2. admin role gate を middleware で適用
3. revoke 実行時に audit log（actor / target id / reason / timestamp）を書き込む
4. エラー時は audit に失敗記録を残す

#### 完了条件

admin route の contract test が緑、audit log への書き込みが test で確認できる。

### Phase 5: admin UI 実装

#### 目的

apps/web の admin backoffice に履歴一覧と revoke ボタンを追加する。

#### 手順

1. 一覧画面を実装（status / member / 発行日時で filter）
2. revoke 確認モーダルを追加（reason 入力必須）
3. revoke 完了後、状態を即座に再取得して反映

#### 完了条件

admin UI から revoke が実行でき、画面に token 値が表示されないことが目視・E2E で確認できる。

### Phase 6: テストと不変条件検証

#### 目的

token 値マスキング不変条件と audit log 連携を保証する。

#### 手順

1. response schema に token 列が含まれないことを contract test で検証
2. revoke 後 status が revoked に変わり、consumed_at が触られていないことを repository test で検証
3. audit log に actor / reason が残ることを integration test で検証
4. `rg "token" apps/api/src/routes/admin/magicTokens.ts` で token 値露出経路を grep 検査

#### 完了条件

全テスト緑かつ admin 経路から token 値が露出する経路が 0 件。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `GET /admin/magic-tokens` が履歴を返す（token 値を含まない）
- [ ] `POST /admin/magic-tokens/:id/revoke` が未消費 token を revoke できる
- [ ] revoke 操作が audit log に残る
- [ ] admin UI から一覧と revoke が操作できる

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] 関連テスト緑（contract / repository / integration）
- [ ] response schema に token 列が型レベルで存在しない

### ドキュメント要件

- [ ] API contract（OpenAPI / zod）に token 値マスキング不変条件が明文化されている
- [ ] runbook が D1 直 query 経路から admin route 経由に更新されている

---

## 6. 検証方法

### テストケース

- 履歴一覧 response に token / token_hash 列が含まれない
- 未消費 token を revoke すると status が revoked に変わる
- 既に consumed の token を revoke しようとすると 409 が返る
- admin role を持たないユーザーは 403
- revoke 操作が audit log に actor / reason 付きで記録される

### 検証手順

```bash
rg -n "token" apps/api/src/routes/admin/magicTokens.ts
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api test
mise exec -- pnpm --filter @repo/web test
```

---

## 7. リスクと対策

| リスク                                                       | 影響度 | 発生確率 | 対策                                                                                  |
| ------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------- |
| admin response に token 値が誤って混入                       | 高     | 低       | repository の admin 用 select で token 列を SELECT 句から物理的に除外し、schema 型でも禁止 |
| revoke と consume の競合（同時実行で状態不整合）             | 中     | 中       | revoke は status='issued' のときだけ更新する条件付き UPDATE で表現                    |
| audit log 書き込み失敗時に revoke だけ成功                   | 中     | 低       | revoke と audit を同一 transaction にまとめる。失敗時は revoke もロールバック         |
| admin UI 実装中に token 値を誤ってログ/画面に露出            | 高     | 低       | E2E test で画面 DOM に token 文字列が含まれないことを assert                          |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/unassigned-task-detection.md`（U-04 / U-05）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`
- `apps/api/src/repository/magicTokens.ts`

### 参考資料

- 不変条件: token 値は plain / hash いずれも admin response に含めない
- Auth.js admin role gate
- audit log 書き込み経路（既存 admin endpoints と同様）

---

## 9. 実装課題と解決策（lessons-learned 対応）

> 本セクションは `lessons-learned-05b-magic-link-auth-gate-2026-04.md` の該当 lesson および
> "Follow-up Boundaries"（admin 可視化は運用 wave 責務）を引用し、再発可能性と事前判断を整理する。

### 9.1 対応する lesson / boundary

| 出典                                                       | 要旨                                                                                                                          | 本タスクへの影響                                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Follow-up Boundaries（lessons-learned 末尾）              | rate limit の KV/DO 昇格、mail monitoring、token admin 可視化は **運用 wave の責務** として 05b 本体から切り離す                 | 本タスクは 04c admin backoffice 取り込み後の運用 wave で着手する前提を維持。05b スコープに巻き戻さない                                 |
| L-05B-003（区別化原則の派生）                              | dev/test の no-op success と production の fail-closed を区別して記録する                                                       | admin 一覧では `env=dev` レコードを既定で除外し、production のみ集計する。test fixture が admin 一覧に紛れ込まない設計を Phase 2 で固定 |

### 9.2 再発する可能性

- admin UI に「token 値そのもの」を出したくなる誘惑が必ず再発する（debug 効率を理由に）。**SELECT 句から token 列を物理的に除外する repository 関数** を Phase 3 で先に作り、route/UI では型レベルで token 列にアクセスできない状態にする
- 既存 `issue` / `consume` / `deleteByToken` を改造して admin 用に流用すると、token 値を返す経路が混入するリスクがある。admin 専用関数 (`listForAdmin` / `findByIdForAdmin` / `revokeById`) を **既存関数から派生させず独立に定義** する
- audit log 書き込み失敗時に revoke だけ成功する状態は incident 対応そのものを破壊する。Phase 4 で revoke と audit を同一 transaction にまとめる

### 9.3 事前に確認すべき設計判断

- token 列の保管形式（plain / hash）と admin 経路での扱いを Phase 1 で確定。**plain でも hash でも response に含めない** を不変条件として contract に明記
- revoke と consume の競合時の優先順位（条件付き UPDATE で `status='issued'` のときだけ更新）を Phase 3 で固定
- admin role gate の中間層（Auth.js role claim or 04c の admin middleware）の選択を Phase 4 着手前に確認。04c で確立した middleware を再利用するのが原則
- 緊急時の D1 直 query 経路を **runbook で「暫定」と明記** し、admin route 公開後は禁止される運用標準を docs に残す

---

## 10. 備考

### 苦戦箇所【記入必須】

> 05b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 05b 実装中、admin が magic_tokens 履歴を可視化したいニーズが U-04 / U-05 として浮上したが、admin route を実装できずに残った。結果として、運用 incident 時に operator が `bash scripts/cf.sh d1 execute` で SELECT を直接打つ運用が緊急時の唯一の経路となっている。 |
| 原因     | token は短命（15 分）かつ機密性が高く、admin UI に「token 値そのもの」を表示してはいけない（token 値はリンクからの consume にのみ使う）。一方で運用上は「いつ誰宛にどの response_id で発行されたか」「失効・利用済み・期限切れの分布」を監視したい。両者のバランスを 05b スコープでは決め切れず、admin route の API contract が固まらないまま着地した。 |
| 対応     | 05b では admin route を未実装で残し、本タスクで「token 値マスキング済 view」を contract レベルの不変条件として固定したうえで、admin route と UI を実装する。MVP 期は D1 直 query を緊急時の暫定経路として許容する。                                                |
| 再発防止 | admin 可視化を伴う機密 token 系機能は、Phase 1 の API contract 設計時に「token 値マスキング不変条件」を明文化する。具体的には repository の admin 用 select 関数で SELECT 句から token 列を物理的に除外し、response schema の型からも token 列を排除することで、コンパイル時に誤露出を遮断する。 |

### レビュー指摘の原文（該当する場合）

```
05b Phase 12 unassigned-task-detection.md にて
 - U-04: magic token 発行/消費/失効履歴の admin 可視化
 - U-05: 緊急時の token 強制無効化 admin UI / API
を未実装タスクとして識別。MVP では D1 直 query で代替し、運用 wave で admin route 化する方針。
```

### 補足事項

本タスクは admin backoffice 基盤（04c）の取り込み後に着手するのが最小コスト。
token 値マスキング不変条件は、後続の admin 系機能（reset password / mfa など）にも横展開する設計原則として位置づける。
