# Spec-B-4: H4 修復 — schema alias backfill - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | google-form-reflection-diagnostics-fu-004-h4-schema-alias-backfill                    |
| タスク名     | Spec-B-4: H4 修復 — schema alias backfill                                             |
| 分類         | 修復（mapping 拡張 + backfill migration）                                             |
| 対象機能     | `schema_diff_queue` resolve / `schema_aliases` backfill / sync-forms-responses mapper |
| 優先度       | 高                                                                                    |
| 見積もり規模 | 中規模                                                                                |
| ステータス   | 未実施                                                                                |
| 発見元       | google-form-reflection-diagnostics Phase 01 (H4 仮説) / Phase 12 (Spec-B-4)           |
| 発見日       | 2026-05-26                                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Google Form の 31 項目（`questionCount=31`）について、`question_id` ↔ `field alias` の mapping drift が発生すると、`apps/api/src/jobs/sync-forms-responses.ts` の mapper が一部項目を未登録扱いとして落とす。結果として `response_fields` には N 項目が null で書き込まれ、admin / profile / public の 3 経路すべてで表示欠落が再現する。

親仕様 `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md` の H4 仮説では、これを Google Form 反映における **欠落の最有力根本原因候補** として位置付けている。

### 1.2 問題点・課題

- `schema_diff_queue` に新規 question_id が積まれても、resolve 経路がない / 運用未整備で `aliasPendingCount > 0` のまま放置される
- `/admin/diagnostics/member/:id` で `missingFieldKeys` が非空となるケースが大量に再現
- `response_fields` への reverse-backfill 経路が未整備で、過去 row が drift 解消後も欠落のまま残る
- Form 側の項目変更（追加 / リネーム）に対する耐性が不足し、毎回手動オペレーションが必要になる

### 1.3 放置した場合の影響

- 会員プロフィール / 公開ディレクトリの表示欠落が継続し、Google Form 反映の信頼性が損なわれる
- 後発で同 root cause を別 hypothesis として再調査するコストが累積する
- `schema_diff_queue` の pending が積み上がり、resolve オペレーションがさらに困難化する

---

## 2. 何を達成するか（What）

### 2.1 目的

`question_id ↔ field alias` mapping drift を resolve / backfill する正規経路を整備し、`aliasPendingCount=0` を恒常的に維持できる状態にする。

### 2.2 最終ゴール

- `aliasPendingCount=0` を確認できる（admin diagnostics endpoint）
- 任意 3 sample memberId で `missingFieldKeys=[]` を確認
- 再 sync 後も idempotent（重複 row / 再 backfill が走らない）
- `schema_diff_queue` の pending が 0
- 新規 Form 項目追加に対しても、resolve UI で手動採用 → backfill 自動化の経路が機能する

### 2.3 スコープ

#### 含むもの

- `schema_diff_queue` resolve UI（admin panel）
- `schema_aliases` backfill migration（D1 migration ファイル）
- `apps/api/src/jobs/sync-forms-responses.ts` の mapper 拡張（alias 解決ロジック）
- `response_fields` への reverse-backfill 経路（issue-836 の reverse-backfill 設計を踏襲）
- contract spec への alias parity 検証

#### 含まないもの

- Google Form schema 自体の変更（不変条件 #1 に反するため禁止）
- 新規 D1 table の作成（既存 `schema_aliases` / `schema_diff_queue` / `response_fields` のみ）
- `apps/web` からの D1 直接アクセス（不変条件 #5 違反）
- consent キー命名 / `responseEmail` system field の変更（不変条件 #2/#3）

### 2.4 成果物

- D1 migration ファイル（`apps/api/migrations/xxxx_schema_alias_backfill.sql`）
- `apps/api/src/jobs/sync-forms-responses.ts` の mapper 拡張差分
- `apps/web/src/app/(admin)/admin/schema/` 配下の resolve UI（既存 surface の拡張のみ）
- contract spec（`apps/api/src/jobs/sync-forms-responses.contract.spec.ts` 等で alias parity 検証）
- `aliasPendingCount=0` / `missingFieldKeys=[]` の検証ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 親仕様 `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md` の H4 仮説を読了済み
- `schema_aliases` / `schema_diff_queue` / `response_fields` の現行 schema を把握済み
- issue-836（response_fields reverse-backfill）の設計を理解済み

### 3.2 依存タスク

- 親 workflow: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/`
- 関連: issue-836（response_fields reverse-backfill）

### 3.3 必要な知識

- Google Form `formId=119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` の section / question 構造
- `apps/api` の Hono route / job 実装パターン
- D1 migration の冪等性確保（IF NOT EXISTS / INSERT OR IGNORE 等）
- Audit log 記録の標準パターン（resolve 操作は audit 必須）
- contract spec による alias parity 検証パターン

### 3.4 推奨アプローチ

1. `schema_diff_queue` の pending entry を admin UI で列挙し、手動 resolve（採用 alias を確定）
2. 確定した alias を `schema_aliases` migration 経由で投入
3. mapper 拡張で新 alias を読み込み、新規 sync の落としを止める
4. 過去 row への reverse-backfill を idempotent な migration 形式で実施
5. contract spec で alias parity が崩れた場合 fail するよう gate を追加

---

## 4. 実行手順

### Phase構成

1. drift 棚卸しと正本決定
2. resolve UI 拡張
3. mapper 拡張と新 sync の検証
4. 既存 row への reverse-backfill
5. contract spec gate 追加と最終検証

### Phase 1: drift 棚卸しと正本決定

#### 目的

`schema_diff_queue` に積まれている全 pending entry を列挙し、Form 側 `question_id` と既存 alias のどちらを正本とするかを確定する。

#### 手順

1. admin diagnostics endpoint で `aliasPendingCount` と pending entry を取得
2. Form 側 `question_id` と既存 `schema_aliases` の対応表を作成
3. 衝突が出た entry について、Form 側 question_id を正本とするか既存 alias を正本とするかを記録
4. 決定ログを `outputs/phase-XX/alias-resolution-decision.md` に記録

#### 完了条件

全 pending entry の正本が確定し、衝突解消方針が記録されている

### Phase 2: resolve UI 拡張

#### 目的

`schema_diff_queue` の pending entry を admin UI 上で resolve できる経路を確保する。

#### 手順

1. `apps/web/src/app/(admin)/admin/schema/` 配下に resolve UI を追加（既存 admin surface の拡張）
2. `FormField` 経由で input を構成（不変条件 #9）
3. mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）
4. resolve 操作には audit log 記録を必ず付与

#### 完了条件

admin UI から pending entry を 1 件 resolve できる E2E が通る

### Phase 3: mapper 拡張と新 sync の検証

#### 目的

`apps/api/src/jobs/sync-forms-responses.ts` が新 alias を解決して新規 sync で項目を落とさない状態にする。

#### 手順

1. mapper が `schema_aliases` を読み込む経路を確認 / 拡張
2. 未知の question_id は `schema_diff_queue` に積む既存挙動を維持
3. contract spec で 31 項目すべての alias parity を検証
4. 新規 sync を staging で実行し `aliasPendingCount` の推移を確認

#### 完了条件

新規 sync 1 回で `aliasPendingCount` が増えない（または resolve 済 entry が再 pending にならない）

### Phase 4: 既存 row への reverse-backfill

#### 目的

過去の `response_fields` row に対して、drift 解消後の alias で再 mapping を適用し、`missingFieldKeys` を 0 にする。

#### 手順

1. D1 migration ファイル（`apps/api/migrations/xxxx_schema_alias_backfill.sql`）を作成
2. issue-836 の reverse-backfill 設計に倣い、idempotent な UPDATE / INSERT OR REPLACE を発行
3. staging で migration を apply し、3 sample memberId で `missingFieldKeys=[]` を確認
4. production apply は user-gated として明示

#### 完了条件

staging で 3 sample memberId について `missingFieldKeys=[]`

### Phase 5: contract spec gate 追加と最終検証

#### 目的

alias parity を CI で恒常的に保証する。

#### 手順

1. contract spec に「31 項目 question_id ↔ alias 対応」を assert する case を追加
2. D1 lane（`vitest.d1.config.ts`）で実行
3. `aliasPendingCount=0` / `schema_diff_queue.pending=0` を最終確認

#### 完了条件

CI で alias parity gate が green

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `aliasPendingCount=0` を staging で確認
- [ ] 3 sample memberId で `missingFieldKeys=[]`
- [ ] 再 sync 後も idempotent（重複 row / 再 backfill が走らない）
- [ ] `schema_diff_queue` の pending=0
- [ ] admin UI から resolve 操作が可能で audit log が記録される

### 品質要件

- [ ] contract spec で 31 項目 alias parity が gate されている
- [ ] migration が idempotent（複数回 apply しても結果が変わらない）
- [ ] mapper 拡張が新規 Form 項目追加に対しても動作する（unknown は `schema_diff_queue` に積む既存挙動を維持）

### ドキュメント要件

- [ ] alias resolution decision の正本が `outputs/phase-XX/` に記録されている
- [ ] reverse-backfill migration の影響範囲が記録されている

---

## 苦戦箇所（必須）

| 項目     | 内容                                                                                                                                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 症状1    | alias drift の正本決定で Form 側 `question_id` と既存 `schema_aliases` が衝突する。Form question_id は Google Forms 編集で変動しうるため、機械的に「新しい方を採用」では事故になる                                                                                                          |
| 原因1    | Form schema を固定しない不変条件 #1 と、既存 row 整合性のトレードオフ。両者を機械的に解消する規則は存在しない                                                                                                                                                                              |
| 対応1    | 手動 resolve UI を admin 経由で必須化。resolve 操作は audit 記録を強制し、後追いで判断根拠を辿れるようにする                                                                                                                                                                               |
| 症状2    | mapper 拡張で既存 `response_fields` row への遡及 backfill が必要。idempotent でない migration を流すと重複 row / 上書き事故が起きる                                                                                                                                                        |
| 原因2    | `response_fields` は 1 member × N field の append-only 構造になっており、単純な INSERT では重複する                                                                                                                                                                                        |
| 対応2    | issue-836 の reverse-backfill 設計を踏襲し、`INSERT OR REPLACE` / `UPDATE WHERE NOT EXISTS` パターンで idempotent を担保。複数回 apply しても結果が同一であることを staging で検証                                                                                                          |
| 症状3    | `schema_diff_queue` の resolve 操作で audit が抜けると、後追いで「なぜこの alias を採用したか」が辿れない                                                                                                                                                                                  |
| 原因3    | admin mutation の audit hook が `useAdminMutation` 経由でしか自動発火しない                                                                                                                                                                                                                |
| 対応3    | 不変条件 #10 に従い `@/features/admin/hooks/useAdminMutation` 経由で resolve mutation を発行し、audit 記録を強制                                                                                                                                                                            |
| 症状4    | Form schema を固定しすぎると不変条件 #1 違反になり、新項目追加時に毎回 mapper を変更する必要が出る                                                                                                                                                                                         |
| 原因4    | mapper の alias 解決が hard-coded だと、新 question_id が出るたびに code 変更が必要                                                                                                                                                                                                         |
| 対応4    | mapper は `schema_aliases` テーブルを runtime に読み込み、unknown question_id は `schema_diff_queue` に積む既存挙動を維持する。code には parity を assert する contract spec のみ置く                                                                                                       |
| 症状5    | `schema_aliases` への直接書き込みを admin UI から許すと、migration 経由の正本性が崩れる                                                                                                                                                                                                    |
| 原因5    | D1 schema 変更は migration 経由のみという CONST 制約                                                                                                                                                                                                                                       |
| 対応5    | resolve UI は「resolve 候補を migration ファイルとして生成 → user が apply」または「`schema_aliases` への INSERT のみ runtime で許可し、構造変更は migration 限定」のいずれかに限定。後者が現実的                                                                                           |

---

## 6. 検証方法

### テストケース

- `aliasPendingCount=0` が admin diagnostics endpoint から取得できる
- 3 sample memberId で `/admin/diagnostics/member/:id` の `missingFieldKeys=[]`
- 再 sync を 2 回連続実行しても `response_fields` の row 数が変わらない（idempotent）
- contract spec で 31 項目 alias parity が green
- `schema_diff_queue` の pending=0

### 検証手順

```bash
# staging で migration apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# diagnostics endpoint 確認
curl -s "https://<staging-api>/admin/diagnostics/alias-pending-count"

# 3 sample memberId
for id in <id1> <id2> <id3>; do
  curl -s "https://<staging-api>/admin/diagnostics/member/$id" | jq '.missingFieldKeys'
done

# contract spec
mise exec -- pnpm --filter api test:d1
```

---

## 7. リスクと対策

| リスク                                                              | 影響度 | 発生確率 | 対策                                                                                          |
| ------------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------- |
| alias 正本決定の判断ミスで誤った mapping を採用                     | 高     | 中       | resolve UI で audit を強制、決定根拠を `outputs/phase-XX/alias-resolution-decision.md` に記録 |
| reverse-backfill migration が非 idempotent で重複 row 発生          | 高     | 中       | `INSERT OR REPLACE` パターンで idempotent 担保、staging で 2 回 apply 検証                    |
| Form 側 question_id 変更で mapper が再度 drift する                 | 中     | 高       | unknown は `schema_diff_queue` に積む既存挙動維持、resolve UI で手動採用フローを恒常化        |
| `schema_aliases` への直接書き込みで migration 正本性が崩れる        | 中     | 低       | INSERT のみ runtime 許可、構造変更は migration 限定                                           |

---

## 8. 参照情報

### 関連ドキュメント

- 親仕様: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md`（H4 仮説）
- 候補定義: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md`（Spec-B-4）
- 関連 issue: issue-836（response_fields reverse-backfill 設計）
- `apps/api/src/jobs/sync-forms-responses.ts`（mapper 本体）

### CLAUDE.md 不変条件

- #1: 実フォームの schema をコードに固定しすぎない
- #5: D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）
- #9: admin form input は `FormField` 経由を標準
- #10: admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準

### CONST 制約

- D1 schema 変更は migration 経由のみ
- `apps/web` から D1 直接アクセス禁止
- mapper 拡張は contract spec で alias parity 検証必須

---

## 9. 備考

### 苦戦箇所【記入必須】

> §「苦戦箇所（必須）」セクションに詳細記録済み。要旨のみ再掲:

| 項目     | 内容                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | alias drift の正本決定 / reverse-backfill の idempotency / Form schema 固定回避の 3 軸でトレードオフが発生                                    |
| 原因     | Form schema 可変性（不変条件 #1）と既存 row 整合性の同時担保が必要                                                                            |
| 対応     | 手動 resolve UI + audit + idempotent migration + runtime alias 解決の組み合わせ                                                               |
| 再発防止 | contract spec で 31 項目 alias parity を恒常 gate。unknown question_id は `schema_diff_queue` に積む既存経路で常に検知可能な状態を維持        |

### レビュー指摘の原文（該当する場合）

```
docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/phase-01-requirements.md
H4 仮説: question_id ↔ field alias mapping drift により 31 項目中 N 項目が
表示側で null 化。admin / profile / public の 3 経路すべてで欠落が再現する
最有力根本原因候補。

docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/outputs/phase-12/unassigned-task-detection.md
Spec-B-4: H4 修復 — schema alias backfill
- 起票トリガ: aliasPendingCount > 0、または /admin/diagnostics/member/:id で
  missingFieldKeys 非空が大量再現
- 想定 surface: schema_diff_queue resolve / schema_aliases backfill /
  apps/api/src/jobs/sync-forms-responses.ts の mapper
- 想定 PR 規模: 中（mapping 拡張 + backfill migration）
- 優先度: high（表示欠落の直接原因になりやすい）
```

### 補足事項

- 本タスクは親 workflow `google-form-reflection-diagnostics` の H4 修復系列（Spec-B-4）に位置付けられる。H1〜H3 / H5+ の修復は別 followup として独立管理する
- 本タスクで触れる mapping 変更は MVP 不変条件「Google Form 再回答を本人更新の正式な経路とする」（#7）と整合するよう、再回答 row の reverse-backfill にも適用されることを Phase 4 で確認する
- production apply は staging 検証完了後、user 明示承認の上で実施する（user-gated）
