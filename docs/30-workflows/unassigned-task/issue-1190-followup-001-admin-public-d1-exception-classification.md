# admin / public route の D1 一次例外を UBM-5001 + scope context へ分類する横展開 - タスク指示書

## メタ情報

```yaml
issue_number: 1239
```

## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | issue-1190-followup-001-admin-public-d1-exception-classification     |
| タスク名     | admin / public route の D1 一次例外を UBM-5001 + scope context へ分類する横展開 |
| 分類         | 改善（可観測性 / エラー分類）                                        |
| 対象機能     | `apps/api/src/routes/admin/*`・`apps/api/src/routes/public/*` の一次 D1 read |
| 優先度       | 低                                                                   |
| 見積もり規模 | 中規模                                                               |
| ステータス   | 未実施                                                               |
| 発見元       | issue-1190-me-5xx-root-fix Phase 12（横展開候補 / SSOT §8）          |
| 発見日       | 2026-06-13                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #1190（`/me` 5xx の根治）で、`/me` 系の一次 D1 read 例外を汎用 `UBM-5000` に丸めず
`UBM-5001`（Database Error）+ `scope` context（`me-session-guard` / `me-profile-builder` /
`me-pending-requests`）へ分類する hardening を実装した（`toMeDatabaseError`・`session-guard.ts`）。

この実装により `/me` 系では「どの D1 read で 500 が出たか」を構造化ログの `scope` で特定でき、
二次データ（pendingRequests）は fail-soft で 200 維持できるようになった。

### 1.2 問題点・課題

`/me` 以外の route（admin / public）には、同型の「一次 D1 read 例外が握られず errorHandler に
到達し、`ApiError.fromUnknown(err, "UBM-5000")`（`error-handler.ts:46`）で汎用 `UBM-5000` に
丸まる」構造が残存している。具体的には以下の `Promise.all` による一次 read が try/catch なしで
例外を上位へ素通しする：

| route | 箇所 | 内容 |
|-------|------|------|
| `apps/api/src/routes/admin/schema.ts` | `:202` | `[items, resolvedAliases]` |
| `apps/api/src/routes/admin/dashboard.ts` | `:66` | `[totals, byStatus, recent, rawZones]` |
| `apps/api/src/routes/admin/meetings.ts` | `:82` / `:101` | `itemsWithAttendance` / `[attendance, candidates]` |
| `apps/api/src/routes/admin/members.ts` | `:814` / `:869` | `[assigned, available]` |
| `apps/api/src/routes/admin/member-fields.ts` | `:52` | `[fields, overrides]` |

これらは現状 `UBM-5000` に丸まり、`scope` が付与されないため、production で 500 が出た際に
「どの集計 read が原因か」を即座に切り分けられない。

### 1.3 放置した場合の影響

- admin ダッシュボード等で 500 が出た際、`UBM-5000` のログだけでは原因 read の特定に時間がかかる
- `/me` で確立した「一次例外は `UBM-5001` + scope、二次データは fail-soft」の方針が `/me` に閉じ、
  route 間でエラー分類ポリシーが不統一になる
- 将来 route が増えるたびに同じ「汎用 5xx 丸め」が再生産される

---

## 2. 何を達成するか（What）

### 2.1 目的

`/me` で確立した D1 一次例外分類パターン（`UBM-5001` + `scope` context）を admin / public route の
一次 D1 read へ横展開し、route 横断でエラー分類ポリシーを統一する。二次データ（補助表示用）が
ある route ではあわせて fail-soft 化の余地を評価する。

### 2.2 最終ゴール

- admin / public の一次 D1 read 例外が `UBM-5001` + route 固有 `scope`（例: `admin-dashboard` /
  `admin-members-tags` / `public-members-list`）でログ化される
- response shape / status 体系は不変（`UBM-5000` → `UBM-5001` はログ分類の変化のみで、外形は
  `errorHandler` の problem+json を維持）
- 各 route につき 5xx 契約テスト（D1 例外注入 → `UBM-5001` + scope 検証 / memberId 等 PII 非露出）が追加される

### 2.3 スコープ

#### 含むもの

- admin / public route の一次 D1 read を分類する共通 helper（`/me` の `toMeDatabaseError` を
  汎用化 or `packages/shared` の `ApiError` ヘルパへ昇格）の検討と実装
- 上記 6 箇所（および同等の一次 read）への分類適用
- 各 route の 5xx 契約テスト追加

#### 含まないもの

- `/me` 系（Issue #1190 で実装済み）
- D1 schema / Google Form 仕様 / endpoint surface の変更（不変条件 #1/#4/#5 を厳守）
- apps/web 側の表示・UX 変更
- 二次データの fail-soft 化を「全 route 一律」で強制すること（route ごとに UX 影響を評価して個別判断）

### 2.4 成果物

- D1 例外分類 helper（共通化の場合は新規ファイル、route-local の場合は各 route の差分）
- admin / public route 6 箇所の分類適用差分
- 各 route の 5xx 契約テスト差分（`*.contract.spec.ts`）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #1190（`/me` 5xx 根治）がマージ済みで、`toMeDatabaseError` / `UBM-5001` 運用実績がある
  （SSOT §8 の「`/me` 実績を前例に起票」条件を満たす）

### 3.2 依存タスク

- issue-1190-me-5xx-root-fix（前例 / マージ後着手）

### 3.3 必要な知識

- `packages/shared/src/errors.ts` の `ApiError` / `UbmErrorCode`（`UBM-5000` / `UBM-5001`）
- `apps/api/src/middleware/error-handler.ts:46` の `ApiError.fromUnknown(err, "UBM-5000")` fallback
- `apps/api/src/routes/me/index.ts` の `toMeDatabaseError`（前例パターン）
- D1 例外を注入する契約テストの書き方（`index.contract.spec.ts` の issue-1190 ケースが手本）

### 3.4 推奨アプローチ

1. まず `/me` の `toMeDatabaseError` を `packages/shared` 側の汎用ヘルパ
   （`toDatabaseError(scope, err): ApiError`）へ昇格できるか評価する。PII を context に載せない
   設計（`/me` 実装と同じく `{ scope }` のみ）を維持する。
2. route ごとに一次 read を `try/catch` または `.catch(err => throw toDatabaseError(scope, err))` で
   ラップし、route 固有の `scope` リテラルを決める。
3. 二次データ（補助カラム・presign 等）がある route は `/me` の pendingRequests と同様に fail-soft 化を
   個別評価する（UX 影響があるものは別タスク化）。
4. 各 route に D1 例外注入の 5xx 契約テストを追加する。

---

## 4. 実行手順

### Phase構成

1. 分類 helper の共通化方針確定（shared 昇格 vs route-local）
2. admin route への分類適用 + 契約テスト
3. public route への分類適用 + 契約テスト
4. 回帰確認（response shape / status 不変・apps/web 非接触）

### Phase 1: 分類 helper の共通化方針確定

#### 目的

`/me` の `toMeDatabaseError` を汎用化するか route-local に複製するかを決め、scope 命名規約を固定する。

#### 完了条件

helper の配置（shared / route-local）と `scope` 命名規約（`<route>-<read-name>`）が決定される

### Phase 2: admin route への分類適用 + 契約テスト

#### 目的

admin の一次 D1 read 6 箇所を `UBM-5001` + scope へ分類し、各 route に 5xx 契約テストを追加する。

#### 完了条件

admin 6 箇所が分類適用され、D1 例外注入テストが `UBM-5001` + scope を検証して緑

### Phase 3: public route への分類適用 + 契約テスト

#### 目的

public route（`/public/members` 等）の一次 D1 read を同様に分類する。

#### 完了条件

public route の一次 read が分類適用され、契約テストが緑

### Phase 4: 回帰確認

#### 目的

response shape / status 体系不変・apps/web 非接触を gate で確認する。

#### 完了条件

`git diff --stat -- apps/web` が空・status enum 不変・全 contract spec 緑

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] admin / public の一次 D1 read 例外が `UBM-5001` + route 固有 scope でログ化される
- [ ] response shape / status 体系が不変（`UBM-5000` → `UBM-5001` はログ分類のみ）
- [ ] PII（memberId / email 等）が context・ログ・response に非露出

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] 各 route の 5xx 契約テスト緑 + 既存 contract spec 回帰なし

### ドキュメント要件

- [ ] `docs/00-getting-started-manual/specs/` の error-handling 記述（あれば）を route 横断方針へ更新
- [ ] 分類 scope の一覧を実装ガイドに記録

---

## 6. 検証方法

### テストケース

- admin/dashboard の集計 read で D1 例外注入 → `UBM-5001` + `scope: admin-dashboard` + PII 非露出
- admin/members の tags read で D1 例外注入 → `UBM-5001` + scope
- public/members の一覧 read で D1 例外注入 → `UBM-5001` + scope
- 正常系 200 は不変（回帰）

### 検証手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run apps/api/src/routes/admin
mise exec -- pnpm exec vitest run apps/api/src/routes/public
git diff --stat -- apps/web   # 空であること
```

---

## 7. リスクと対策

| リスク                                                       | 影響度 | 発生確率 | 対策                                                                         |
| ------------------------------------------------------------ | ------ | -------- | ---------------------------------------------------------------------------- |
| `UBM-5000` → `UBM-5001` 変更で既存ログ集計 / アラートが乱れる | 低     | 中       | ログ分類変更のみで status / response 外形は不変。アラート定義があれば同波で更新 |
| scope context に PII を載せてしまう                          | 中     | 低       | `/me` 実装と同じく context は `{ scope }` のみ。テストで JSON.stringify 非露出を機械検証 |
| route 数が多く一括変更でレビュー負荷が高い                   | 低     | 中       | admin / public を Phase 分割し、route 単位で契約テストと同波コミット          |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/_shared-context.md` §8（スコープ外 / 横展開候補）
- `docs/30-workflows/completed-tasks/issue-1190-me-5xx-root-fix/outputs/phase-12/unassigned-task-detection.md` §2
- `apps/api/src/routes/me/index.ts`（`toMeDatabaseError` 前例）
- `apps/api/src/middleware/error-handler.ts:46`（`UBM-5000` fallback）
- `packages/shared/src/errors.ts`（`UbmErrorCode` / `ApiError`）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `/me` 5xx 根治の調査中、500 のログが `UBM-5000` に丸まり「どの D1 read が原因か」を即座に特定できなかった                          |
| 原因     | 一次 D1 read 例外が握られず errorHandler の `ApiError.fromUnknown(err, "UBM-5000")` fallback に到達し、scope context が付かないため |
| 対応     | `/me` 系のみ `toMeDatabaseError` で `UBM-5001` + scope 分類を実装。admin / public への横展開は Issue #1190 のスコープ外として分離 |
| 再発防止 | 一次 D1 read は最初から「例外を握って `UBM-5001` + scope へ分類」する共通ヘルパ経由にし、route 追加時のテンプレートに組み込む       |

### 補足事項

本タスクは Issue #1190（`/me` 限定）の **横展開**であり、`/me` の実装・運用実績を前例として
起票している（SSOT §8 の起票条件）。二次データの fail-soft 化は route ごとに UX 影響が異なるため、
一律強制せず route 単位で評価する。schema / endpoint surface は不変（不変条件 #1/#5 厳守）。
