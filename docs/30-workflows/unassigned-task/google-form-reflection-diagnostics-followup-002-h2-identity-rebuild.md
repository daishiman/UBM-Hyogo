# H2 修復 — 本人マッチング再構築 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | google-form-reflection-diagnostics-fu-002-h2-identity-rebuild                         |
| タスク名     | H2 修復 — 本人マッチング再構築                                                        |
| 分類         | 修復 (identity link backfill / Auth.js callback 強化)                                 |
| 対象機能     | `apps/api/src/routes/me/*` / `member_identities` backfill migration / Auth.js callback |
| 優先度       | 高 (profile 経路の死命線)                                                             |
| 見積もり規模 | 中-大 (backfill migration を伴う場合あり)                                             |
| ステータス   | 未実施                                                                                |
| 発見元       | google-form-reflection-diagnostics Phase 12 (Spec-B-2 / H2 仮説)                      |
| 発見日       | 2026-05-26                                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

google-form-reflection-diagnostics の Phase 01 H2 仮説で「profile 経路 (`/api/me/*`) は `member_identities` を経由して本人 row を解決するが、`member_identities` の email / external_id alias が Google Form 由来 member row と不一致のため SELECT が 0 件になり、profile が空で返る」ケースが識別された。Phase 12 candidate detection で Spec-B-2 として未タスク化された。

### 1.2 問題点・課題

- `member_identities` には Auth.js session に紐づく `email` / `external_id` (provider sub) が格納されるが、Google Form 経由で先に作成された member row には `member_identities` レコードが存在しないことがある (片側欠損 alias)。
- `/api/me/*` の本人 row 取得 SQL は `member_identities` JOIN を前提としているため、alias 欠損 member は profile 経路から永続的に解決不能となる。
- 起票トリガ:
  - `identityHealth.identitiesWithoutMember > 0`
  - または `/admin/diagnostics/member/:id` で `H2_identityMissing === true` が複数本人で再現

### 1.3 放置した場合の影響

- profile 画面 (`/profile`) が空のまま返り続け、本人が自分の登録情報を確認できない (会員サービスの根幹機能停止)。
- Google Form 再回答による本人更新 (CLAUDE.md 不変条件 #7) が成立しても、profile 反映が確認できないため運用上の信頼性が崩れる。
- 後続で識別される H1 / H3 系仮説の切り分けが H2 ノイズに埋もれ、診断ループが収束しない。

---

## 2. 何を達成するか（What）

### 2.1 目的

`member_identities` の email / external_id alias 欠損を backfill 経由で解消し、Auth.js callback で session 確立時の identity link を強化することで、profile 経路から本人 row が 100% 解決される状態を作る。

### 2.2 最終ゴール

- `identityHealth.identitiesWithoutMember` が 0 件 (staging / production 双方)。
- `/admin/diagnostics/member/:id` で 3 sample memberId について `H2_identityMissing === false`。
- backfill migration が idempotent (再実行で副作用なし) であることが test で担保される。

### 2.3 スコープ

#### 含むもの

- `member_identities` backfill migration 作成 (email / external_id 突合ロジック・衝突時 merge policy 含む)。
- Auth.js callback (signIn / session callback) での identity link 強化 (session 確立時に欠損 alias を即時補填)。
- `/admin/diagnostics/member/:id` の H2 判定ロジック検証 (false positive / false negative 0 件を抑止)。
- staging で backfill 検証 → production 投入前 D1 backup (`bash scripts/cf.sh d1 export`) を必須化したランブック整備。

#### 含まないもの

- Auth.js provider 切替 (Google OAuth / Magic Link の入替) — 対象外。
- Google Form schema 変更・D1 schema の in-place ALTER — CLAUDE.md 不変条件 #5 / 本仕様 CONST 制約で禁止。
- H1 / H3 仮説の修復 (別 followup として個別起票)。

### 2.4 成果物

- backfill migration ファイル (`apps/api/migrations/00XX_backfill_member_identities.sql` 想定)。
- Auth.js callback 強化 patch (`apps/web` 認証境界、`apps/api` 側 me route の本人解決ロジック)。
- backfill idempotency test / regression test (`apps/api` D1 lane)。
- staging 検証ログ・production 投入前 D1 backup 手順を含むランブック追記。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- google-form-reflection-diagnostics Phase 01 H2 仮説と Phase 12 Spec-B-2 detection が merge 済み。
- `/admin/diagnostics/member/:id` が H2_identityMissing フラグを返却可能 (親 workflow 実装範囲)。
- `identityHealth.identitiesWithoutMember` が API / admin diagnostics 経由で観測可能。

### 3.2 依存タスク

- google-form-reflection-diagnostics 本体 (H2 観測点 / health metric 実装)。
- Auth.js セッション resolver 系の既存 followup (例: `04b-followup-006-authjs-cookie-session-resolver.md`) と衝突しないこと。

### 3.3 必要な知識

- D1 migration の冪等化パターン (`INSERT ... ON CONFLICT DO NOTHING` / `UPDATE ... WHERE NOT EXISTS`)。
- Auth.js callback の発火順序 (signIn → jwt → session) と副作用設計。
- `member_identities` schema (member_id / provider / external_id / email / created_at) と既存 INDEX 構成。

### 3.4 推奨アプローチ

1. **観測フェーズ**: staging で `identityHealth.identitiesWithoutMember` の現状値 / 内訳 (email 一致のみ / external_id 一致のみ / 両方不一致) を取得し、backfill 対象を分類。
2. **backfill 設計**: 衝突時 merge policy を明示 (email 一致を優先 / external_id 一致を優先 / 両方一致は idempotent skip)。
3. **migration 実装**: SQL を冪等化し、再実行 test を追加。
4. **callback 強化**: session 確立時に欠損 alias を即時補填する link 強化 patch を追加し、既存 session ユーザーへの影響を review。
5. **検証**:
   - `identitiesWithoutMember=0` を確認
   - 3 sample memberId で `/admin/diagnostics/member/:id` を叩き `H2_identityMissing === false` を確認
   - backfill migration を 2 回連続適用しても差分が出ないことを確認

---

## 4. 実行手順

### Phase 1: H2 内訳観測 (staging)

#### 目的

backfill 対象の alias 欠損パターンを分類し、merge policy 設計の入力を得る。

#### 手順

1. staging で `identityHealth.identitiesWithoutMember` の値と breakdown (email-only / external_id-only / both-missing) を取得。
2. 3 sample memberId を選定し `/admin/diagnostics/member/:id` で H2_identityMissing を確認。

#### 完了条件

alias 欠損パターン内訳が記録され、merge policy 設計の入力が揃う。

### Phase 2: backfill migration 実装

#### 目的

`member_identities` の alias 欠損を埋める idempotent migration を作成。

#### 手順

1. `apps/api/migrations/00XX_backfill_member_identities.sql` を追加。
2. 冪等化 SQL (`INSERT ... ON CONFLICT DO NOTHING` 等) で記述。
3. D1 lane (`pnpm --filter api test`) で backfill idempotency test を追加。

#### 完了条件

migration を 2 回連続適用しても差分 0、test green。

### Phase 3: Auth.js callback 強化

#### 目的

session 確立時に欠損 alias を即時補填し、新規 session 起点での H2 再発生を防ぐ。

#### 手順

1. Auth.js callback (signIn / session) で `member_identities` への upsert を追加。
2. 既存 session ユーザーへの影響 (例: 既存 link が上書きされないか) を unit / integration test で review。

#### 完了条件

callback 経由で alias が補填され、既存 link は維持される。

### Phase 4: staging 検証 → production 投入

#### 目的

production D1 への安全な backfill 適用と検証。

#### 手順

1. staging で migration 適用 → `identitiesWithoutMember=0` 確認 → 3 sample で H2_identityMissing=false 確認。
2. production 投入前に `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-h2-rebuild.sql` を実行。
3. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` で適用。
4. production で同一検証を再実施。

#### 完了条件

production で `identitiesWithoutMember=0` かつ 3 sample H2_identityMissing=false。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `identityHealth.identitiesWithoutMember` が staging / production 双方で 0 件
- [ ] 3 sample memberId で `/admin/diagnostics/member/:id` の `H2_identityMissing === false`
- [ ] backfill migration が idempotent (再実行で差分 0)
- [ ] Auth.js callback で session 確立時 alias 補填が動作

### 品質要件

- [ ] backfill SQL の D1 lane test (idempotency / merge policy) が green
- [ ] 既存 session ユーザーへの影響 review (regression なし)
- [ ] production 投入前 D1 backup (`cf.sh d1 export`) ログが evidence に保存

### ドキュメント要件

- [ ] backfill runbook (staging → production 手順 + rollback) が整備
- [ ] merge policy (email 優先 / external_id 優先 / 両方一致 skip) が仕様書に明記
- [ ] 親 workflow の Phase 12 detection (Spec-B-2) と本タスクの紐付けが追記

---

## 6. 苦戦箇所・予測される困難【必須】

| 項目                                                                       | 内容                                                                                                                                                                                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backfill migration の idempotency 担保                                     | `INSERT ... ON CONFLICT DO NOTHING` 等で記述する必要があり、再実行で副作用が出ないことを test で必ず担保する。production で 2 回適用される可能性 (deploy retry など) を前提にする。                          |
| Auth.js callback での identity link 強化が session 既存ユーザーへ与える影響 | signIn / session callback で member_identities を upsert する場合、既存 link を意図せず上書きするリスクがある。session 既存ユーザー review (regression test) が必要。                                       |
| email / external_id 両方マッチ衝突時の merge policy 設計                   | 同一 member_id に対し email 一致 row と external_id 一致 row が別々に存在するケースで、どちらを正本とするかの policy 設計が必要。policy が曖昧だと backfill 結果が非決定的になる。                          |
| `member_identities` への production 書き込み時の D1 backup 必須化          | production D1 への破壊的書き込みは `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production` での backup 取得を必須化する。backup なしの直接適用は本仕様 CONST 制約で禁止。                         |
| D1 schema 変更 (新 INDEX 等) が必要になった場合                            | in-place ALTER は禁止 (CLAUDE.md 不変条件 #5 / 本仕様 CONST 制約)。必ず migration ファイル経由で行う。INDEX 追加が必要かどうかは observability メトリクスで事前判定する。                                  |

---

## 7. 検証方法

### テストケース

- backfill migration を 2 回連続適用 → 差分 0
- email-only 一致 / external_id-only 一致 / 両方一致 / 両方不一致 の 4 パターンで期待挙動
- Auth.js callback で新規 session 確立時に alias 補填 → `member_identities` 行が追加
- 既存 link を持つ session で callback が走っても link が改変されない

### 検証手順

```bash
# staging 観測
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) FROM members m WHERE NOT EXISTS (SELECT 1 FROM member_identities mi WHERE mi.member_id = m.id);"

# backfill 適用 (staging)
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 再実行 idempotency 検証
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# production backup → 適用
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-h2-rebuild.sql
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

---

## 8. リスクと対策

| リスク                                                            | 影響度 | 発生確率 | 対策                                                                                  |
| ----------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------- |
| backfill migration が non-idempotent で再実行時に重複行が発生     | 高     | 中       | `ON CONFLICT DO NOTHING` 化と D1 lane idempotency test 必須                           |
| Auth.js callback 強化で既存 session の link が破壊される          | 高     | 低       | callback で既存 link を尊重する upsert ロジック + regression test                     |
| production D1 への直接適用で rollback 不能                        | 高     | 低       | `cf.sh d1 export` での backup を必須化、適用前に staging 検証完了をゲート             |
| merge policy 未定義のまま実装 → backfill 結果が非決定的           | 中     | 中       | Phase 2 開始前に merge policy をドキュメント化し review を通す                        |

---

## 9. CONST 制約

- D1 schema 変更は migration ファイル経由のみ (in-place ALTER 禁止 / CLAUDE.md 不変条件 #5)。
- `apps/web` から D1 直接アクセス禁止 (CLAUDE.md 不変条件 #5)。本人解決は `apps/api` の me route 経由のみ。
- production 投入前に staging で backfill 検証必須 (`identitiesWithoutMember=0` 確認 + 3 sample H2_identityMissing=false)。
- production D1 書き込み前に `bash scripts/cf.sh d1 export` で backup を取得すること。

---

## 10. 参照情報

### 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md` (H2 仮説)
- 候補定義: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md` (Spec-B-2)
- 認証設計仕様: `docs/00-getting-started-manual/specs/02-auth.md`
- CLAUDE.md 不変条件 #5 (D1 直接アクセス制限 / `apps/api` 閉域)
- CLAUDE.md 不変条件 #7 (Google Form 再回答が本人更新の正式経路)

### 参考資料

- 既存 Auth.js cookie / session resolver followup: `docs/30-workflows/unassigned-task/04b-followup-006-authjs-cookie-session-resolver.md`
- Cloudflare CLI ラッパー: `scripts/cf.sh` (CLAUDE.md「Cloudflare 系 CLI 実行ルール」)

---

## 11. 備考

### 起票トリガの再掲

- `identityHealth.identitiesWithoutMember > 0`
- または `/admin/diagnostics/member/:id` で `H2_identityMissing === true` が複数本人で再現

### スコープ外明示

- Auth.js provider 切替 (Google OAuth / Magic Link の入替) は対象外。
- H1 / H3 仮説の修復は別 followup として個別起票する。
