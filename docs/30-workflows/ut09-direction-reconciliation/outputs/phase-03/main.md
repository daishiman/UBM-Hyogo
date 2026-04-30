# Phase 3 設計レビュー（30種思考法 / GO/NO-GO）主成果物

正本仕様: `../../phase-03.md` / `../../index.md`
タスク ID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
推奨方針: **A — current Forms 分割方針へ寄せる**（base case / ユーザー承認なしで採用可）
AC トレース: AC-2 / AC-4 / AC-5 / AC-7 / AC-8 / AC-11 / AC-12 / AC-13 / AC-14

---

## 0. 本 Phase の位置づけ（先頭固定）

Phase 2 で作成した reconciliation 設計（撤回 / 移植マッピング・5 文書同期チェック・選択肢 A / B 4条件 + 5 観点比較）を、4 つ以上の代替案（A / B / B 部分採用 / 現状維持）と 30 種思考法（Phase 3 代表 8 種 + Phase 10 補完 22 種）で検証し、**MAJOR 0 件状態に到達**させる。GO/NO-GO ゲートを通過した場合のみ Phase 4 へ進める。

本 Phase は docs-only。コード変更・migration 撤回・PR 作成はスコープ外（別タスク化）。

---

## 1. 代替案比較（4 案 / AC-2）

### 1.1 案 a: 採用 A（current Forms 分割方針へ寄せる / base case 推奨）

- 概要: Sheets API 直接実装（`apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/src/routes/admin/sync.ts` 単一 endpoint / `sync_locks` + `sync_job_logs` migration）を撤回し、品質要件（retry/backoff・short transaction・batch-size 制限・WAL 非前提・lock TTL）を 03a / 03b / 09b へ移植する。旧 UT-09 root を legacy umbrella 参照に戻す。
- 利点: current facts と完全整合 / 03a・03b・04c・09b の 5 文書無変更 / 不変条件 #1・#4・#5・#6 すべて PASS / MAJOR 0 件・MINOR 0 件 / **ユーザー承認不要**。
- 欠点: 撤回コスト（別タスク）と品質要件移植の追加文書化が必要。
- 結論: **base case 採用**。

### 1.2 案 b: 採用 B（Sheets 採用方針）

- 概要: legacy umbrella の direct-implementation 禁止方針を撤回し、03a / 03b / 04c / 09b を Sheets API + 単一 `/admin/sync` 前提に同期更新。aiworkflow-requirements references（api-endpoints / database-schema / environment-variables / deployment-cloudflare）を same-wave で書換。
- 利点: Sheets 直接実装の短期実装コストが活きる / Service Account ベース認証で運用が単純。
- 欠点: current facts MAJOR / 不変条件 #6（GAS prototype 延長）の再検証必須 / references 5 文書 same-wave 更新の負荷大 / **ユーザー承認必須**。
- 結論: 不採用（ただし将来採用判断は Phase 12 unassigned-task-detection に open question として保持）。

### 1.3 案 c: B 部分採用（schema は Forms 維持 / response のみ Sheets）

- 概要: `/admin/sync/schema` は Forms API 経路を維持、`/admin/sync/responses` の上流のみ Sheets に置換。
- 利点: 既存 Sheets 実装の一部を活用できる。
- 欠点: 上流が schema と response で異なる責務分割が複雑化 / `/admin/sync/responses` の認可・冪等性・current response resolver が破壊的に変化 / 二重 ledger（`sync_jobs` と `sync_job_logs`）が残存 / 責務境界 MAJOR。
- 結論: **不採用**（責務境界破壊が MAJOR）。

### 1.4 案 d: 現状維持（reconciliation せず PR 化）

- 概要: 二重正本のまま PR を作成し、後続タスクで個別解消する。
- 利点: 短期コスト最小。
- 欠点: 後続 03a / 03b / 04c / 09b が連鎖 blocked / Phase 12 compliance が実態と乖離 / staging smoke 表記混乱 / unrelated 削除混入リスク残存 / 価値性・整合性・運用性すべて MAJOR。
- 結論: **不採用**（reconciliation せず PR 化する経路は遮断）。

### 1.5 評価マトリクス（13 観点 × 4 案 / 空セル 0）

| 観点 | 案 a (A / base) | 案 b (B) | 案 c (B 部分) | 案 d (現状維持) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | MINOR | MAJOR |
| 実現性 | PASS | MINOR | MINOR | PASS |
| 整合性（不変条件 #1） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #4） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #5） | PASS | PASS | PASS | PASS |
| 整合性（不変条件 #6） | PASS | MINOR | MINOR | MINOR |
| 整合性（current facts） | PASS | MAJOR | MAJOR | MAJOR |
| endpoint 認可（04c 整合） | PASS | MINOR | MAJOR | MAJOR |
| D1 ledger 一意性 | PASS（`sync_jobs`） | PASS（`sync_locks`+`sync_job_logs`） | MAJOR（二重 ledger） | MAJOR |
| Secret hygiene | PASS | PASS | MINOR（両方並存） | MAJOR |
| 5 文書同期 | PASS | MINOR（same-wave 必要） | MAJOR | MAJOR |
| 運用性 | PASS | MINOR | MINOR | MAJOR |
| docs-only 境界 | PASS | PASS | PASS | N/A |
| staging smoke 表記 | PASS | PASS | PASS | MAJOR |
| unrelated 削除混入 | PASS（別タスク化） | PASS | PASS | MAJOR |

集計:

- **案 a（base case）: MAJOR 0 / MINOR 0 / PASS 15** — 採用
- 案 b: MAJOR 1 / MINOR 4 — ユーザー承認必須・別タスク
- 案 c: MAJOR 3 / MINOR 5 — 不採用
- 案 d: MAJOR 8 / MINOR 1 — 不採用

---

## 2. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たし block にならず、Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 / Phase 11 / Phase 12 で運用上の補足対応が必要だが、Phase 4 への移行は許可 |
| MAJOR | block。Phase 4 に進めない。Phase 2 へ差し戻すか、ユーザー承認の上で代替案再選定 |

---

## 3. 30 種思考法レビュー（Phase 3 代表 8 種 + Phase 10 補完 22 種）

automation-30 の「30 種すべて使用」制約に従い、Phase 3 では意思決定ゲートに直結する 8 種を先行適用し、Phase 10 で補完 22 種を必須適用する。AC-11 の最終 PASS は 8 + 22 = 30 種完了時点で成立する。

### 3.1 Phase 3 代表 8 種

| # | 思考法 | findings | 判定 |
| --- | --- | --- | --- |
| 1 | First Principles Thinking | reconciliation の本質は「正本を 1 つに統一する」こと。案 a は current 正本維持で本質に最短経路 | PASS |
| 2 | Inversion Thinking | reconciliation を行わない（案 d）と何が壊れるかを明示。後続 4 タスク blocked / Phase 12 乖離 / PR 複雑化 / staging smoke 混同のすべてが顕在化し、案 a 採用根拠を反証側から強化 | PASS |
| 3 | Second-Order Effects | 案 b 採用は references 5 文書 same-wave 更新を発生させ UT-26 smoke シナリオの全面切替を誘発する。案 a はこれを発生させない | PASS（B 採用時 MINOR） |
| 4 | Cost-Benefit Analysis | 案 a の撤回 + 移植コスト < 案 b の same-wave 更新コスト。docs-only タスクとしては案 a が最小コストで最大効果 | PASS |
| 5 | Pre-mortem | 案 a で「品質要件移植の漏れ」が起きると D1 contention 知見が失われるリスク → 移植対象を Phase 2 で 5 知見（retry/backoff・short transaction・batch-size 制限・WAL 非前提・lock TTL）として明示済み | PASS |
| 6 | Devil's Advocate | 案 b の利点（短期実装コスト低）を擁護した上で、current facts MAJOR と Ownership 衝突再発リスクで反論成立 | PASS |
| 7 | Systems Thinking | 03a / 03b / 04c / 09b / legacy umbrella の 5 文書同期を Phase 9 で実施する手順が固定済み。reconciliation を 1 系として閉じている | PASS |
| 8 | Occam's Razor | 最小変更で正本統一できる案 a を選択。reconciliation の本旨に整合 | PASS |

> 8 種すべて PASS。MAJOR 0 件状態を確認。

### 3.2 Phase 10 補完 22 種（予約・必須ゲート）

| # | 思考法 | 適用 Phase | 状態 |
| --- | --- | --- | --- |
| 9 | Lateral Thinking | Phase 10 | reserved |
| 10 | Critical Thinking | Phase 10 | reserved |
| 11 | Analogy Thinking | Phase 10 | reserved |
| 12 | Convergent Thinking | Phase 10 | reserved |
| 13 | Divergent Thinking | Phase 10 | reserved |
| 14 | Abductive Reasoning | Phase 10 | reserved |
| 15 | Deductive Reasoning | Phase 10 | reserved |
| 16 | Inductive Reasoning | Phase 10 | reserved |
| 17 | Probabilistic Thinking | Phase 10 | reserved |
| 18 | Bayesian Updating | Phase 10 | reserved |
| 19 | Decision Tree | Phase 10 | reserved |
| 20 | Constraint Analysis | Phase 10 | reserved |
| 21 | Trade-off Analysis | Phase 10 | reserved |
| 22 | Counterfactual Thinking | Phase 10 | reserved |
| 23 | Pareto Thinking | Phase 10 | reserved |
| 24 | Long-term Thinking | Phase 10 | reserved |
| 25 | Stakeholder Mapping | Phase 10 | reserved |
| 26 | Risk Decomposition | Phase 10 | reserved |
| 27 | Boundary Examination | Phase 10 | reserved |
| 28 | Reframing | Phase 10 | reserved |
| 29 | Symmetry / Asymmetry | Phase 10 | reserved |
| 30 | Meta-cognition | Phase 10 | reserved |

> AC-11: Phase 3 時点で代表 8 種すべて PASS（MAJOR 0）。Phase 10 で 22 種適用後に AC-11 を最終 PASS とする。

---

## 4. base case 最終判定（4 条件 + 13 観点 / AC-12）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | reconciliation により後続 4 タスク（03a / 03b / 04c / 09b）の判断面が安定化。stale contract 誤参照を構造的に防げる。 |
| 実現性 | PASS | docs-only。撤回 / 移植マッピングが Phase 2 で 5 軸 + 5 知見記述済み。中規模文書作業に収まる。 |
| 整合性（不変条件 #1） | PASS | schema を mapper.ts / schema 定義に閉じる方針維持。Ownership 宣言（Phase 1 §2）で構造保証。 |
| 整合性（不変条件 #4） | PASS | `sync_jobs` を admin-managed data 専用 ledger として維持。 |
| 整合性（不変条件 #5） | PASS | D1 binding は `apps/api` 内に閉じる方針維持。`apps/web` から D1 直接アクセス禁止。 |
| 整合性（不変条件 #6） | PASS | 旧 UT-09 を direct implementation 化しない方針維持で GAS prototype 延長扱いリスク排除。 |
| 整合性（current facts） | PASS | legacy umbrella spec / 03a / 03b / 04c / 09b すべて無変更。 |
| endpoint 認可（AC-4） | PASS | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint と 04c の整合維持。Bearer middleware 挿入点 `app.use('/admin/sync*', adminAuth)` で認可境界一意。 |
| D1 ledger 一意性（AC-5） | PASS | `sync_jobs` 単一 ledger。`sync_locks` + `sync_job_logs` migration は撤回対象。二重 ledger 化を構造的に排除。 |
| Secret hygiene | PASS | Sheets 系（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）は廃止候補、Forms 系（`GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）+ admin 共通（`SYNC_ADMIN_TOKEN` / `ADMIN_ROLE_EMAILS`）に一意化。 |
| 5 文書同期 | PASS | Phase 9 で 5 文書 × チェック観点マトリクスを実施する手順を Phase 2 で固定済み。 |
| 運用性 | PASS | 運用変更なし。`scripts/cf.sh` 経由の wrangler / `op://Employee/ubm-hyogo-env/<FIELD>` 1Password 参照は維持。 |
| docs-only 境界 | PASS | コード変更・migration 撤回・PR 作成は別タスク化と Phase 1〜2 で明記。 |
| staging smoke 表記（AC-13） | PASS | 「実機未走行 = pending、合否 = PASS/FAIL」を区別する運用ルールを §6 で明文化。 |
| unrelated 削除混入（AC-14） | PASS | unrelated verification-report 削除は別タスク化方針を §6 で明文化。 |

> 4 条件 + 13 観点すべて PASS。MAJOR 0 件・MINOR 0 件で base case 確定。

### 4.1 4 条件 PASS 根拠の集約

| 条件 | 根拠 |
| --- | --- |
| 価値性 | 二重正本解消で後続 03a / 03b / 04c / 09b の判断面安定化。reconciliation 未実施だと PR 経路が連鎖 blocked になるため、本タスク完了が必須前提。 |
| 実現性 | docs-only でコード変更を伴わない。原典 spec（213 行）+ 上流 5 文書 + aiworkflow-requirements 4 references から reconciliation 設計が一意に導出可能。 |
| 整合性 | 不変条件 #1 / #4 / #5 / #6 の 4 件すべて PASS。current facts（legacy umbrella / 03a / 03b / 04c / 09b）すべて無変更。Ownership 宣言（Phase 1 §2）が再発防止の構造保証。 |
| 運用性 | 推奨 A 採用時は current 方針維持で運用変更なし。`scripts/cf.sh` / 1Password 参照運用は採用方針共通で維持。staging smoke 表記ルール / unrelated 削除分離ルールを §6 で明文化。 |

---

## 5. 推奨 A をユーザー承認なしで採用する論拠

reconciliation 結論として **推奨 A をユーザー承認なしで base case として確定** する論拠を以下に固定する。

| # | 論拠 | 裏付け |
| --- | --- | --- |
| L1 | current facts と完全整合 | legacy umbrella spec / 03a / 03b / 04c / 09b すべて無変更で確定。仕様書を 1 文字も書き換えない。 |
| L2 | MAJOR 0 件 / MINOR 0 件 | 13 観点 × 4 案マトリクス（§1.5）で唯一 MAJOR 0 件を達成。30 種思考法代表 8 種すべて PASS。 |
| L3 | docs-only 境界遵守 | コード変更・migration 撤回・PR 作成は別タスク化。本タスクで実コードに触れず、reconciliation 設計のみを確定する。 |
| L4 | 不変条件 4 件すべて PASS | #1（schema を mapper.ts に閉じる）/ #4（admin-managed data 分離）/ #5（D1 binding は `apps/api` 内のみ）/ #6（GAS prototype 本番昇格禁止）に整合。 |
| L5 | ユーザー承認は B / C 採用時のみ必須 | index.md・Phase 1 §0 / §3 / Phase 2 §3 で「B はユーザー承認前提」「A は current 維持で承認不要」を一貫して明文化済み。 |
| L6 | reconciliation 結論欄に「推奨 = 選択肢 A」が固定済み | index.md 「正本語彙」表 reconciliation 結論行で正本宣言済み。 |
| L7 | 解放される PR 経路の一意性 | A 採用は後続 03a / 03b / 04c / 09b の PR 経路を即時解放。B / C / D は連鎖 blocked または広範囲 same-wave 更新を誘発。 |

> 結論: A は **ユーザー追加承認なしで採用方向の reconciliation を確定** する。B（Sheets 採用）の将来採用判断のみユーザー承認を必要とし、Phase 12 unassigned-task-detection に open question として保持する。

---

## 6. 運用ルール明文化

### 6.1 ルール 1: staging smoke 表記の明確化（AC-13）

| 表記 | 意味 |
| --- | --- |
| **pending** | 実機未走行。判定保留。PR 表記でも `pending` のまま使う。**PASS と書き換え禁止**。 |
| **PASS** | 実機走行済み + 合否判定 OK |
| **FAIL** | 実機走行済み + 合否判定 NG |

- pending を PASS と誤記したことが Phase 12 review で検出された場合、reconciliation タスクを再起票する。
- 旧 UT-09 系で発生した「smoke 未走行を PASS と誤記」は本ルールで構造的に再発防止する。

### 6.2 ルール 2: unrelated verification-report 削除の分離（AC-14）

- 本 reconciliation タスクの PR には **unrelated verification-report 削除を含めない**。
- verification-report 削除は別 unassigned-task として起票し、独立 PR で実施する。
- ユーザー承認なしで削除を本 PR に混ぜた場合、Phase 13 の GO/NO-GO を NO-GO とする。
- 本ワークツリーに既に unrelated 削除差分が含まれていた場合、Phase 13 の local-check で検出して別 PR に分離する。

### 6.3 ルール 3: Phase 12 compliance の PASS / FAIL 実態判定（AC-7）

Phase 12 compliance は実態と一致する判定でなければならない。以下の判定ルールを正本とする。

| 状態 | 判定 |
| --- | --- |
| 5 文書同期チェック（Phase 9）すべて GREEN かつ staging smoke 走行済み + 合否 OK | **PASS** |
| 5 文書同期チェックいずれか RED または staging smoke 未走行（pending） | **FAIL（pending を PASS と書かない）** |
| 5 文書同期チェック GREEN かつ staging smoke 未走行 | **pending**（PASS でも FAIL でもなく、判定保留として明記） |
| MAJOR が 1 件でも残存 | **FAIL** |
| unrelated 削除混入が検出 | **FAIL** |

- compliance 判定は実態に合わせて 3 値（PASS / FAIL / pending）で記述する。2 値（PASS / FAIL）に潰さない。
- 「pending を PASS と書く」「実機未走行で PASS と書く」は禁止。検出時は reconciliation タスクを再起票する。

### 6.4 ルール 4: aiworkflow-requirements に stale contract を登録しない（AC-8）

- `.claude/skills/aiworkflow-requirements/references/` 配下（api-endpoints.md / database-schema.md / environment-variables.md / deployment-cloudflare.md）には、**現に正本として確定した contract のみ登録**する。
- 採用 A 確定後は、Sheets 系 contract（`/admin/sync` 単一 endpoint / `sync_locks` + `sync_job_logs` / `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）を references に登録しない。誤って登録された場合は撤回する（撤回作業は別タスク）。
- 採用 B が将来確定する場合は、**ユーザー承認後**に references を same-wave 更新する。承認前の事前登録は禁止。
- Ownership 宣言（Phase 1 §2）で「admin endpoint 命名」「D1 ledger schema」の Owner が衝突した時点で reconciliation タスクを起票し、references 登録の前段で衝突を解消する。

---

## 7. 着手可否ゲート（Phase 4 への GO / NO-GO 判定）

### 7.1 GO 条件（全て満たすこと）

- [x] 代替案 4 案（a / b / c / d）以上が評価マトリクスに並んでいる（§1）
- [x] base case（案 a）の最終判定が全観点 PASS（§4）
- [x] MAJOR が一つも残っていない（§1.5 / §4）
- [x] MINOR がある場合、対応 Phase（5 / 11 / 12）が指定されている（§1.5 — base case は MINOR 0）
- [x] open question が 0 件、または受け皿 Phase / 別タスクが明記（§8）
- [x] current facts 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）からの逸脱が 0 件（§4）
- [x] 運用ルール 4 件（staging smoke / unrelated 削除 / Phase 12 compliance / stale contract）が明文化（§6）
- [x] docs-only 境界（コード変更は別タスク）が Phase 1〜3 で一貫（§0）
- [x] 30 種思考法代表 8 種すべて PASS、補完 22 種が Phase 10 で必須ゲート予約（§3）

→ **判定: GO**

### 7.2 NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- 案 b（採用 B）をユーザー承認なしで base case にしようとしている
- 案 c / d を base case として採用している
- `sync_jobs` と `sync_locks` + `sync_job_logs` を同時に正本扱いしている
- `/admin/sync` 単一と 2 endpoint を同時に正本扱いしている
- staging smoke pending を PASS と表記している
- unrelated verification-report 削除を本 PR に混ぜる方針が残っている
- aiworkflow-requirements references に stale contract を登録する手順が残っている

→ **判定: 該当なし**

### 7.3 ゲート最終判定

**GO（Phase 4 へ進行可能）**。base case = 案 a（採用 A）で確定。

---

## 8. open question（Phase 4 以降への引き渡し）

| # | 質問 | 受け皿 | 備考 |
| --- | --- | --- | --- |
| 1 | Sheets 実装撤回の具体手順（ファイル削除 / migration down / Secret 削除） | 別タスク（reconciliation 後の implementation task） | 本タスクは docs-only |
| 2 | D1 contention mitigation 5 知見の 03a / 03b / 09b への移植 PR | 別タスク | Phase 2 で 5 知見明示済み |
| 3 | 案 b（Sheets 採用）の将来採用判断時期 | Phase 12 unassigned-task-detection | Wave 後段以降の検討候補。ユーザー承認前提 |
| 4 | 旧 UT-09 root の legacy umbrella 参照復元 PR | 別タスク | direct implementation 化記述の撤回 |
| 5 | aiworkflow-requirements references の更新確認 | Phase 9 / 別タスク | A 採用時は現行登録維持で OK か Phase 9 で確認 |
| 6 | unrelated verification-report 削除の別タスク化 | 別 unassigned-task 起票 | 本 PR に混ぜない |

> 6 件すべて受け皿が明記されている。Phase 3 内 open question は 0 件。

---

## 9. AC トレース（本 Phase 確定分）

| AC | Phase 3 での確定 | 参照 |
| --- | --- | --- |
| AC-2 | 採用方針 A を 1 案として決定。決定理由を「current 整合 / same-wave 更新コスト / 03a-09b 影響範囲」3 軸で記述 | §1, §5 |
| AC-4 | `/admin/sync` 単一 vs 2 endpoint の認可境界比較・04c 整合確認 | §1.5 / §4 endpoint 認可行 |
| AC-5 | D1 ledger を `sync_jobs` 単一に確定 | §1.5 / §4 D1 ledger 一意性行 |
| AC-7 | Phase 12 compliance の PASS / FAIL / pending 3 値判定ルール明文化 | §6.3 |
| AC-8 | aiworkflow-requirements に stale contract を登録しない運用ルール | §6.4 |
| AC-11 | 30 種思考法レビューで PASS / MINOR / MAJOR を代替案ごとに付与・MAJOR 0 件達成（代表 8 種完了 / 補完 22 種 Phase 10 予約） | §3 |
| AC-12 | 4 条件最終 PASS + 根拠記述 | §4, §4.1 |
| AC-13 | staging smoke pending を PASS と誤記しない運用ルール | §6.1 |
| AC-14 | unrelated verification-report 削除を本 PR に混ぜない方針 | §6.2 |

---

## 10. 完了確認

- [x] 代替案が 4 案（a / b / c / d）比較されている（§1）
- [x] 13 観点 × 4 案のマトリクスに空セルが無い（§1.5）
- [x] base case（案 a / 採用 A）の最終判定が全観点 PASS（§4）
- [x] 30 種思考法のうち代表 8 種で findings と判定が記述、補完 22 種が必須ゲート予約（§3）
- [x] PASS / MINOR / MAJOR の判定基準が明文化（§2）
- [x] 着手可否ゲートの GO / NO-GO 条件が記述・GO 判定（§7）
- [x] open question 6 件すべてに受け皿 Phase / 別タスクが割り当て（§8）
- [x] current facts 5 文書からの逸脱が 0 件（§4）
- [x] 運用ルール 4 件（staging smoke / unrelated 削除 / Phase 12 compliance 実態判定 / stale contract 非登録）が明文化（§6）
- [x] AC-2 / AC-4 / AC-5 / AC-7 / AC-8 / AC-11 / AC-12 / AC-13 / AC-14 がトレース済み（§9）
- [x] 推奨 A をユーザー承認なしで採用する論拠 7 件を固定（§5）

---

## 11. 次 Phase への引き渡し

- **次 Phase**: Phase 4（テスト戦略）
- **引き継ぎ事項**:
  1. 採用 base case = 案 a（採用 A / current Forms 分割方針へ寄せる）
  2. 5 文書同期チェック手順 → Phase 4 / Phase 9 のテスト戦略入力
  3. 運用ルール 4 件（staging smoke / unrelated 削除 / Phase 12 compliance 3 値判定 / stale contract 非登録）を Phase 12 / Phase 13 で再確認
  4. open question 6 件を該当 Phase / 別タスクへ register
  5. docs-only 境界（コード変更は別タスク）を Phase 4 以降の制約として固定
  6. 30 種思考法 補完 22 種を Phase 10 必須ゲートとして予約（AC-11 最終 PASS は Phase 10 完了時）
- **ブロック条件**:
  - GO 条件のいずれかが未充足
  - MAJOR が残っている
  - 案 b をユーザー承認なしで base case 化しようとしている
  - current facts 5 文書からの逸脱が残っている
  - 運用ルール 4 件のいずれかが未明文化

---

状態: spec_created → completed
