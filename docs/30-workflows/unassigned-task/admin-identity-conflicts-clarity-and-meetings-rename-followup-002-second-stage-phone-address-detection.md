# Admin Identity Conflicts FU-002 — 第二段階検出（電話番号・住所一致）の追加 - タスク指示書

## メタ情報

```yaml
issue_number: 1225
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-clarity-and-meetings-rename-followup-002-second-stage-phone-address-detection |
| タスク名 | 重複検出に電話番号・住所一致の第二段階を追加 (FU-002) |
| 分類 | 機能拡張 |
| 補足分類 | 検出ロジック多段化 (API/D1 変更を伴う) |
| 対象機能 | `/admin/identity-conflicts` 重複検出ロジック（第二段階） |
| 優先度 | 中 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| GitHub Issue | #1225 |
| 発見元 | `admin-identity-conflicts-clarity-and-meetings-rename` Phase 3 design-review 将来層 / Phase 12 unassigned-task-detection baseline / shared-context §9 |
| 発見日 | 2026-06-12 |
| canonical source | `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

現行の `apps/api/src/services/admin/identity-conflict-detector.ts` の `detectConflictCandidates` は、**氏名（name）AND 職業（affiliation）の NFKC 正規化後の完全一致**（`norm(fullName) + "\u0000" + norm(occupation)` を単一文字列キーとし、別 member_id 同士を突き合わせる）だけで重複候補を検出する第一段階のみを実装している。

これは決定的で誤検出が少ない反面、氏名・職業の表記が揃わないケース（旧姓・転職・略称など）では同一人物の重複を取りこぼす。

### 1.2 問題点・課題

- 氏名／職業が一致しないが、実は同一人物（電話番号や住所が同じ）という重複を第一段階では検出できない。
- `keyOf(name, affiliation)` という単一文字列キー設計のため、複数の照合軸（氏名×職業 / 電話 / 住所）を OR で組み合わせる多段検出を表現できない。
- 電話番号・住所はそもそも Google Form の 31 個の固定 stableKey（`packages/shared/src/zod/field.ts`）に専用項目として存在せず（`location`=居住地、`hometown`=出身地はあるが phone / 番地レベルの住所は無い）、D1 read 範囲・正規化方針の新設計が前提になる。

### 1.3 放置した場合の影響

- 同一人物の重複会員が「氏名・職業の表記ゆれ」だけで検出網をすり抜け、公開ディレクトリや会員管理で二重登録が残り続ける。
- 後から検出軸を足すと、merge / dismiss の監査ログ（identity-merge / identity-conflict repository）と PII 取り扱い範囲を再確認するコストが高くなる。

---

## 2. 何を達成するか（What）

### 2.1 目的

第一段階（氏名 AND 職業の完全一致）に加え、**電話番号の一致**および**住所の一致**を照合軸とする第二段階の重複検出を追加し、氏名・職業が揃わなくても同一人物候補を挙げられるようにする。

### 2.2 最終ゴール

- 氏名／職業が不一致でも、電話番号または住所が一致すれば重複候補として `detectConflictCandidates` が候補を返す。
- 第一段階の決定的な検出結果は drift せず維持される（既存 spec が緑のまま）。
- `matchedFields` が `phone` / `address` を含められるよう拡張され、どの軸で一致したかを呼び出し側が判別できる。
- 電話・住所の正規化方針（電話＝ハイフン／全角半角／国番号の吸収、住所＝表記ゆれの吸収）が定義され、誤検出率（別人の同居家族が同住所など）を抑える AND/OR 設計が明文化される。

### 2.3 受け入れ基準

- [ ] 氏名・職業が不一致でも電話番号が正規化後に一致する別 member_id を候補として返す。
- [ ] 氏名・職業が不一致でも住所が正規化後に一致する別 member_id を候補として返す。
- [ ] `matchedFields` が `"name" | "affiliation" | "phone" | "address"` を表現でき、一致した軸が記録される。
- [ ] 第一段階（氏名 AND 職業）の既存検出結果・既存 spec が変化しない（regression なし）。
- [ ] 電話・住所の正規化関数が単体テストで境界ケース（ハイフン有無・全角半角・空文字・国番号）を網羅する。
- [ ] 別人の同居家族など住所一致のみの誤検出を抑制する AND/OR 条件と閾値が design として明記され、テストで意図通りに分類される。
- [ ] 電話・住所を D1 read に含める変更が PII redaction / 監査ログ設計と矛盾しないことが確認・記録される。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 第二段階ロジック追加 / `IdentitySnapshot` `EmailConflictRow` `ConflictCandidate` 型拡張 / keyOf の多段化 |
| `apps/api/src/services/admin/identity-conflict-detector.spec.ts` | 電話・住所一致 / 正規化境界 / 第一段階非回帰の assertion |
| `apps/api/src/repository/identity-conflict.ts` | `response_fields` から phone / address に相当する値を read する SQL 拡張（stable_key 経由） |
| `packages/shared/src/zod/field.ts` | 電話・住所に相当する stableKey が無い場合の取り扱い（既存 31 key 不変条件との整合判断） |
| `apps/api/src/repository/identity-merge.ts` | merge / dismiss 監査ログへの PII 波及確認 |

### 3.2 実装方針

- `detectConflictCandidates` の単一文字列キー方式を、複数の照合インデックス（氏名×職業 / 電話 / 住所）を別々に張る多段マッチへ拡張する。第一段階の挙動は完全に温存する（既存キーは据え置き、軸を追加する形）。
- `norm` の汎用 NFKC + trim はそのまま使い、電話用 `normPhone`（数字以外除去・先頭国番号正規化）と住所用 `normAddress`（全角半角・空白・ハイフン表記ゆれ吸収）を別関数として新設する。pure function を維持し D1 直接参照しない（不変条件 #5）。
- `ConflictCandidate.matchedFields` を `("name" | "affiliation" | "phone" | "address")[]` に拡張し、複数軸ヒット時はマージして返す。
- D1 read 拡張は `apps/api/src/repository/identity-conflict.ts` 側で行い、detector は引数で受け取る snapshot を拡張するだけに留める（read と判定の責務分離を維持）。
- 電話・住所は固定 stableKey に存在しない可能性が高いため、まず「どの項目を電話／住所として扱うか」の供給元（admin-managed data か form raw か）を確定させてから read 範囲を決める。

---

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/services/admin/identity-conflict-detector.ts`
- 症状（キー設計）: 第一段階は `keyOf(name, affiliation)` の単一文字列キー（`${norm(name)}\u0000${norm(affiliation)}`）で決定的・低誤検出だが、電話／住所一致を OR で足すにはこの単一キーでは複合条件を表現できず、検出器のキー設計そのものを多段（軸ごとにインデックスを張る）化する必要がある。
- 症状（正規化の難しさ）: 第一段階の氏名・職業は NFKC + trim の完全一致で済むが、電話は「ハイフン有無・全角半角・国番号（+81 / 0 始まり）」、住所は「番地表記・全角半角・空白ゆれ」が混在し、正規化が難しい。AND/OR の組み合わせ次第で、別人の同居家族が同住所で一致するなどの誤検出が増える。
- 症状（データ供給元）: 電話番号・住所は Google Form の固定 31 stableKey（`packages/shared/src/zod/field.ts`：`location`=居住地 / `hometown`=出身地はあるが phone・番地レベル住所は無い）に専用項目が存在しない。第二段階を成立させるには、どの項目を電話／住所として扱うかの供給元決定と、それに伴う D1 read 範囲の拡張が前提になる。
- 症状（PII 波及）: D1 read 範囲を電話／住所へ広げると PII の取り扱い範囲が広がり、既存の merge / dismiss 監査ログ（`apps/api/src/repository/identity-merge.ts` / `identity-conflict.ts`）の redaction / audit 設計への波及確認が要る。これが「API/D1 変更を伴うため本サイクル分離」の核心理由。
- 参照: `apps/api/src/services/admin/identity-conflict-detector.ts`（`norm` / `keyOf` / `detectConflictCandidates` の現行シグネチャと単一キー構成）

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 住所一致のみで別人の同居家族を重複候補に挙げてしまう | 中 | 住所単独一致は弱い軸として扱い、氏名部分一致など別軸との AND を要求する閾値設計をテストで固定する |
| 電話の正規化漏れ（国番号・全角）で一致取りこぼし／過剰一致 | 中 | `normPhone` の境界ケース（ハイフン・全角半角・+81/0 始まり・空文字）を単体テストで網羅する |
| 多段キー化で第一段階の決定的検出結果が drift する | 高 | 既存軸キーは温存し追加軸のみ足す設計とし、第一段階の既存 spec を非回帰ガードとして残す |
| 電話／住所の供給元が固定 stableKey に無く、read 範囲が未定義 | 中 | 供給元（admin-managed data / form raw）を先に確定し、read 拡張は repository 層に閉じる |
| PII read 拡張が既存監査ログ / redaction 設計と矛盾する | 中 | merge / dismiss 監査ログへの波及を事前確認し、PII 露出範囲を記録・最小化する |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/services/admin/identity-conflict-detector.spec.ts
```

期待: 電話一致 / 住所一致 / 正規化境界 / 第一段階非回帰の assertion が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/repository/__tests__/identity-conflict.repository.spec.ts
```

期待: `response_fields` からの phone / address read 拡張が、第一段階の name / affiliation read を壊さずに候補生成へ反映される。

### 静的検証

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint
```

期待: `ConflictCandidate.matchedFields` 拡張（`"phone" | "address"` 追加）に伴う型不整合がなく、lint 違反が出ない。

---

## スコープ

### 含む

- `detectConflictCandidates` への電話番号・住所一致による第二段階検出ロジック追加。
- `normPhone` / `normAddress` 正規化関数と境界ケースの単体テスト。
- `ConflictCandidate.matchedFields` の `"phone" | "address"` 拡張。
- `identity-conflict.ts` repository での電話／住所 D1 read 範囲拡張。
- 第一段階非回帰ガードの維持。

### 含まない

- merge / dismiss の mutation contract 変更（監査ログは波及確認のみ）。
- Google Form schema（固定 31 stableKey / questionCount）の変更（不変条件 #1）。
- `/admin/identity-conflicts` の UI レイアウト・命名・表現層の変更（別 followup）。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/`
- 未タスク検出: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md`
- 対象 detector: `apps/api/src/services/admin/identity-conflict-detector.ts`
- detector 単体テスト: `apps/api/src/services/admin/identity-conflict-detector.spec.ts`
- read 拡張対象 repository: `apps/api/src/repository/identity-conflict.ts`
- stableKey 正本: `packages/shared/src/zod/field.ts`
