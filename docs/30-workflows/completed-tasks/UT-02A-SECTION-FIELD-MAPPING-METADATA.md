# Section/Field Metadata 正規化（response_fields / response_sections） - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | task-ref-02a-section-field-mapping-metadata-001                                     |
| タスク名     | response_fields / response_sections の section membership / label / field kind を canonical schema metadata から解決する |
| 分類         | リファクタリング（ref）                                                              |
| 対象機能     | `apps/api/src/repository/_shared/builder.ts` の section/field metadata 解決ロジック   |
| 優先度       | 中（medium）                                                                         |
| 見積もり規模 | 中規模                                                                               |
| ステータス   | 未実施                                                                               |
| 発見元       | Phase 12（02a-parallel-member-identity-status-and-response-repository / 30-method review） |
| 発見日       | 2026-04-27                                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02a タスク（member identity status and response repository）の Phase 9-11 で、`apps/api/src/repository/_shared/builder.ts` の `buildSections()` / `buildFields()` を実装した。
このとき、`response_fields` テーブルには `section_key` カラムが存在せず、`response_sections` 側にも canonical な field 紐付け情報が無かった。
そのため、暫定対応として以下の fallback を行っている。

- section membership: `responseSections.ts` でフィルタした field 集合を、すべての section に対して broad に割り当てる
- label: `field.label` が NULL のとき、`field.stable_key` をそのまま label として使用
- field kind: schema 由来の kind が無いため、固定の `text` / `select` / `consent` を heuristic で割り当てる

これは MVP 公開を急ぐためのトレードオフ判断であり、Google Form schema が変化したとき（section 増減・kind 変更・stable_key リネーム）に整合が崩れる前提で導入した。

### 1.2 問題点・課題

- **section membership の broad 割り当て**: 1 つの field が複数 section に重複表示される、または本来属さない section に紛れ込むリスクがある
- **label fallback の可読性**: `stable_key`（例: `q_section1_company_name`）が public/member view に露出すると UX が崩れる
- **field kind の heuristic**: consent 系 field を text として描画してしまうと法的同意フローが破綻する
- **schema drift 検知の欠如**: Google Form 側の section / question 構成が変わっても、リポジトリ層は気付けない

### 1.3 放置した場合の影響

- public ディレクトリ・会員マイページ・admin バックオフィスの 3 層で同じ field が異なる見え方をし、運用混乱が発生する
- consent kind の誤判定により、`publicConsent` / `rulesConsent` のフラグが正しく評価されず、公開可否判定が壊れる
- 03a の forms schema sync が完成したあとも、builder 側が古い fallback を参照し続け、StableKey alias queue（03a 側）の利益を享受できない

---

## 2. 何を達成するか（What）

### 2.1 目的

`response_fields` / `response_sections` から取り出した raw row を、canonical schema metadata（Google Forms schema または admin-managed schema diff）に基づいて正規化し、builder.ts の fallback ロジックを削除する。

### 2.2 最終ゴール

- builder.ts の `buildSections()` / `buildFields()` が、引数または resolver 経由で canonical な `section_id` / `field_kind` / `label` を受け取り、fallback 分岐が 0 行になる
- public / member / admin の 3 view それぞれで、section membership と field kind が同じ canonical metadata から導出される
- schema drift（form 側の question 追加/削除）が起きたとき、metadata 解決が失敗したことを repository 層から検知できる

### 2.3 スコープ

#### 含むもの

- canonical schema metadata の取得 API 設計（resolver interface または metadata table）
- builder.ts への metadata 注入経路の確立（引数追加 or repository 側 resolve）
- `response_fields` への `section_key` / `field_kind` カラム追加検討と migration（必要な場合）
- section membership / label / field kind 正規化のユニットテスト整備
- builder.ts の fallback ロジック削除

#### 含まないもの

- Google Forms API からの schema 同期実装本体（03a タスクの責務）
- StableKey alias queue の運用実装（03a タスクの責務）
- admin-managed schema diff UI の実装（04c タスクの責務）
- attendance / adminNotes など他テーブル統合（別タスク UT-02A-ATTENDANCE-PROFILE-INTEGRATION / UT-02A-ADMIN-MEMBER-NOTES-REPOSITORY）

### 2.4 成果物

| 名称                                              | 説明                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/api/src/repository/_shared/metadata.ts`     | canonical schema metadata resolver（新規）                         |
| `apps/api/src/repository/_shared/builder.ts`      | fallback 削除版                                                   |
| D1 migration（`section_key` / `field_kind` 追加） | 必要であれば `migrations/` 配下に追加                              |
| `apps/api/src/repository/_shared/builder.test.ts` | section/field 正規化のテスト                                       |
| `docs/30-workflows/.../implementation-guide.md`   | 03a / 04a / 04b 担当向けの metadata 注入ガイド更新                |

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 02a Phase 12 が close されていること（builder.ts の現状実装が main にマージ済み）
- 03a の forms schema sync 設計が一定固まっていること（StableKey alias queue の interface ドラフトが存在する）

### 3.2 依存タスク

- **03a（forms schema sync and stablekey alias queue）**: canonical schema 取得元と StableKey alias queue を提供する。本タスクの metadata resolver はこの interface を呼び出す
- **04a / 04b（API contract hardening）**: section/field の view contract を確定する。本タスクの正規化結果はこの contract に揃える

### 3.3 必要な知識

- Cloudflare D1 の migration 運用（`apps/api` 配下の wrangler 設定）
- Google Forms schema の section/question 構造（`doc/00-getting-started-manual/specs/01-api-schema.md`）
- 02a の repository builder pattern（`apps/api/src/repository/_shared/`）
- StableKey と form fieldId のマッピング設計（03a で議論中）

### 3.4 推奨アプローチ

以下のいずれか、または併用を検討する。

1. **D1 metadata table 方式**: `response_fields` に `section_key` / `field_kind` カラムを追加し、03a の schema sync が書き込む。builder.ts は row をそのまま使う
2. **Static manifest 方式**: canonical schema を JSON manifest としてビルド時に embed し、builder.ts に注入する resolver を経由する
3. **Hybrid 方式**: kind は static manifest、section_key は D1 column（admin による override を許容するため）

03a 側の運用要件（reload 頻度・admin override 有無）が固まり次第、上記から選択する。

---

## 4. 実行手順

### Phase 構成

Phase A（調査）→ Phase B（resolver 設計）→ Phase C（builder 改修とテスト）→ Phase D（fallback 削除と契約確定）の 4 段で進める。

### Phase A: canonical schema 取得元の調査

#### 目的

03a の schema sync interface を確認し、metadata 取得経路を確定する。

#### 手順

1. 03a タスク仕様書を読み、StableKey alias queue / canonical schema の output 形式を確認する
2. 既存 `apps/api/src/repository/_shared/responseFields.ts` / `responseSections.ts` の row shape を整理する
3. Google Forms schema（`doc/00-getting-started-manual/specs/01-api-schema.md`）と D1 schema の差分を表にする

#### 成果物

- 取得経路の比較表（D1 column / static manifest / hybrid）

#### 完了条件

- 推奨方式が 1 つに絞られ、03a 担当者と合意済み

### Phase B: metadata resolver の設計

#### 目的

builder.ts に注入する resolver の interface を確定する。

#### 手順

1. `MetadataResolver` interface を `apps/api/src/repository/_shared/metadata.ts` に定義する
2. `resolveSectionKey(stableKey): SectionKey` / `resolveFieldKind(stableKey): FieldKind` / `resolveLabel(stableKey, locale): string` のシグネチャを決める
3. resolve 失敗時の挙動（throw / Result 型 / fallback to UNKNOWN）を決める
4. 03a の StableKey alias queue を呼び出すフックを定義する

#### 成果物

- `metadata.ts` の interface 定義とドキュメント

#### 完了条件

- interface が 04a / 04b の view contract と矛盾しないことをレビュー済み

### Phase C: builder 改修とテスト

#### 目的

builder.ts を resolver 経由に切り替え、テストで保証する。

#### 手順

1. `buildSections()` / `buildFields()` の引数に `MetadataResolver` を追加する
2. fallback ロジックを resolver 呼び出しに置換する
3. ユニットテストで以下をカバーする
   - section membership: 1 field は 1 section にのみ属する
   - label: stable_key がそのまま露出していない
   - field kind: consent / select / text が canonical に分岐する
   - resolve 失敗: schema drift を検知できる
4. 必要に応じて D1 migration を追加する

#### 成果物

- builder.ts 改修版とテスト

#### 完了条件

- すべてのテストが pass し、fallback 分岐が 0 行になっている

### Phase D: fallback 削除と契約確定

#### 目的

旧 fallback を削除し、03a / 04a / 04b へ契約を引き渡す。

#### 手順

1. builder.ts の fallback コードを削除する
2. `implementation-guide.md` を更新し、metadata 注入の使用例を追記する
3. 03a / 04a / 04b の担当者に契約変更を通知する

#### 成果物

- 更新済み implementation guide

#### 完了条件

- 03a / 04a / 04b の review 済み

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/src/repository/_shared/builder.ts` から fallback label/kind/section 分岐が削除されている
- [ ] `MetadataResolver` interface が `apps/api/src/repository/_shared/metadata.ts` に定義されている
- [ ] `response_fields` / `response_sections` から取得した row が、canonical schema metadata で正規化されている
- [ ] schema drift（resolve 失敗）が repository 層から検知可能になっている

### 品質要件

- [ ] section/field 正規化のユニットテストが pass する
- [ ] `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が pass する
- [ ] 1 field が複数 section に重複しないことがテストで保証されている
- [ ] consent kind の誤判定が起きないことがテストで保証されている

### ドキュメント要件

- [ ] `implementation-guide.md` に metadata 注入の使用例が追記されている
- [ ] 03a / 04a / 04b との依存関係が依存タスクセクションに反映されている

---

## 6. 検証方法

### テストケース

1. canonical schema に存在する field を resolve すると、正しい section_key / field_kind / label が返る
2. canonical schema に存在しない stable_key を resolve すると、resolve 失敗が検知される
3. consent 系 stable_key（`publicConsent` / `rulesConsent`）が consent kind として解決される
4. 1 つの field が複数 section に同時に属さない
5. label が `stable_key` 文字列そのままで露出しない

### 検証手順

```bash
mise exec -- pnpm --filter @ubm/api test apps/api/src/repository/_shared
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7. リスクと対策

| リスク                                                          | 影響度 | 発生確率 | 対策                                                                                          |
| --------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------- |
| 03a の StableKey alias queue 仕様が遅れて本タスクが着手できない | 中     | 中       | resolver interface を先行定義し、03a 完成までは static manifest で代替実装する                |
| schema drift 検知が遅れ、resolve 失敗が本番で発生する            | 高     | 中       | resolve 失敗時に CI / Phase 12 で alert を出す。本番では UNKNOWN section に隔離し露出を防ぐ    |
| alias 失敗時に historical response が view から消える             | 高     | 低       | alias 解決失敗時の fallback バケット（"未分類 section"）を canonical 設計に含める             |
| `section_key` カラム追加 migration がデータ量増で遅延する         | 中     | 低       | static manifest 方式を選択することで migration を回避する                                     |
| public/member/admin で view contract がズレる                    | 中     | 中       | 04a / 04b の contract を本タスク Phase A で先に確認し、resolver 出力をそれに揃える            |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/index.md`
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/repository/_shared/builder.ts`
- `apps/api/src/repository/_shared/responseFields.ts`
- `apps/api/src/repository/_shared/responseSections.ts`
- `doc/00-getting-started-manual/specs/01-api-schema.md`
- `doc/00-getting-started-manual/specs/00-overview.md`

### 参考資料

- 03a タスク仕様書（forms schema sync and stablekey alias queue）
- 04a / 04b タスク仕様書（API contract hardening）
- `docs/30-workflows/unassigned-task/UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT.md`（03a と境界を共有）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 02a Phase 9-11 の `buildSections()` 実装中に、`response_fields` から section 紐付けを正規化できず、フィルタ済み field 集合をすべての section に broad に割り当てる暫定設計を採用した。public / member / admin view の filter 整合が将来崩れる懸念が残っている。                                                                                                       |
| 原因     | (1) `response_fields` テーブルに `section_key` カラムが無く、03a の schema sync が未着手のため canonical な紐付け元が存在しない。(2) `section_id` / `field_kind` を builder の引数として受け取るか、repository 内部で resolve するか、責務分割の判断材料が乏しかった。(3) StableKey と form fieldId のずれを 02a で吸収すべきか、03a の alias queue に倒すべきか境界線が不明確だった。 |
| 対応     | 02a スコープでは builder 引数に metadata を渡さず、broad section assignment + fallback label/kind に倒した。canonical 化は本未割当タスクとして 03a 完成後に着手する前提で、Phase 12 unassigned-task-detection.md に記録した。境界線については「StableKey ↔ form fieldId の解決は 03a alias queue の責務」「section_key / field_kind の resolve は本タスクの responsibility」とした。 |
| 再発防止 | repository builder を新規追加するときは、(a) canonical schema の取得経路がまだ無い場合は resolver interface だけ先に定義する、(b) fallback を入れるなら必ず未割当タスクに昇格させる、(c) StableKey 関連の責務分割を 03a と事前合意してから着手する、を運用ルール化する。本タスクの Phase A 調査結果を `implementation-guide.md` に転記する。                                              |

source evidence:

- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`（項番 4: section / field metadata の正規化）
- `apps/api/src/repository/_shared/builder.ts`（broad section assignment と fallback の現行実装）
- `apps/api/src/repository/_shared/responseFields.ts` / `responseSections.ts`（row shape に `section_key` / `field_kind` が無いこと）

### レビュー指摘の原文（該当する場合）

```
02a Phase 12 30-method review より:
`response_fields` does not currently carry `section_key`, label, or field kind metadata.
`buildSections()` therefore assigns filtered fields broadly and uses fallback labels/kinds.
Section membership should be derived from canonical schema metadata.
Labels and field kinds should be populated from schema definitions.
Tests should cover section-specific placement and no duplicated fields across unrelated sections.
```

### 補足事項

- 本タスクは 03a の StableKey alias queue 仕様が固まり次第着手するのが望ましい。仕様確定前に着手する場合は、Phase A の調査結果に基づき static manifest 方式を暫定採用すること。
- `MetadataResolver` interface は 04a / 04b の view contract と整合性を保つ必要があるため、Phase B のレビューには両タスクの担当者を含めること。
- D1 migration を伴う方式（hybrid / D1 metadata table）を採用する場合は、`scripts/cf.sh` 経由で wrangler を実行すること（直接実行は禁止）。
