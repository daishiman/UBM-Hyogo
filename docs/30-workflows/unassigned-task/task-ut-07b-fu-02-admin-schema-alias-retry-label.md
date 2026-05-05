# UT-07B-FU-02 admin schema alias retry label - タスク指示書

## メタ情報

```yaml
issue_number: 362
task_id: UT-07B-FU-02-admin-schema-alias-retry-label
task_name: 管理 UI schema alias retryable back-fill 表示
category: type:improvement
target_feature: 管理画面 schema diff alias assignment workflow
priority: low
scale: small
status: 未実施
source_phase: docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-01
dependencies:
  - UT-07B-schema-alias-hardening-001
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-FU-02-admin-schema-alias-retry-label |
| タスク名 | 管理 UI schema alias retryable back-fill 表示 |
| 分類 | implementation / UI / improvement |
| 対象機能 | 管理画面 schema diff alias assignment workflow |
| 優先度 | low |
| 見積もり規模 | small |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |
| issue_number | #362 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-07B schema alias hardening では、schema alias apply を二段階化し、back-fill が Workers CPU budget に到達した場合でも再開可能な API contract を定義した。具体的には `POST /admin/schema/aliases` が HTTP 202 と `code='backfill_cpu_budget_exhausted'`、`backfill.status='exhausted'`、`retryable=true` を返す。

Phase 12 の未タスク検出では「admin UI retry label」が、運用者に再試行可能な状態を見せるための別 UI タスクとして検出された。API は「失敗」ではなく「途中まで処理済みで、再実行すれば続きから進む」状態を返せるが、管理 UI 側で通常エラーと同じ表示にすると運用判断を誤る。

### 1.2 問題点・課題

HTTP 202 / `backfill_cpu_budget_exhausted` / retryable backfill status が管理 UI 上で明確に区別されない場合、管理者は alias apply が失敗したのか、続きから再試行すべきなのか判断しづらい。特に大きなフォームや回答数の多い revision では、back-fill が複数回の retry を前提に完了する可能性がある。

### 1.3 放置した場合の影響

- retryable な途中停止が通常エラーに見え、管理者が不要な調査や重複操作を行う
- `backfill.status='exhausted'` の再試行導線が見えず、back-fill 未完了状態が長く残る
- UT-07B で定義した HTTP 202 contract と実際の管理 UI 体験がずれる

---

## 2. 何を達成するか（What）

### 2.1 目的

管理画面 schema alias assignment workflow で retryable back-fill status を通常エラーと区別し、HTTP 202 / `backfill_cpu_budget_exhausted` を「続きから再試行できる状態」として明確に表示する。

### 2.2 最終ゴール

- HTTP 202 かつ `code='backfill_cpu_budget_exhausted'` かつ `retryable=true` の response を管理 UI が retryable continuation として扱う
- `backfill.status='exhausted'` の場合、alias 確定済みで back-fill の続きが残っていることを短い label / status message で表示する
- retry / 再実行ボタンまたは既存 apply 操作の再実行導線が、通常失敗と混同されない形で提示される
- UI test または component test で retryable 表示が固定されている

### 2.3 スコープ

#### 含む

- 既存 admin schema alias UI の response handling 確認
- HTTP 202 / `backfill_cpu_budget_exhausted` / `retryable=true` の表示分岐追加
- `backfill.status='exhausted'` 向けの小粒度 label / status message 追加
- retryable 状態を固定する UI test / component test / route mock test の追加
- 必要最小限の文言同期

#### 含まない

- API contract の変更
- `POST /admin/schema/aliases` の workflow / repository / D1 migration 変更
- queue / cron 分割や 50,000 行級 back-fill の処理方式変更
- 監視アラート閾値や通知基盤の追加
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-07B schema alias hardening の API contract が参照可能であること
- `POST /admin/schema/aliases` が HTTP 202 と `backfill_cpu_budget_exhausted` を返す可能性を UI 側で扱うこと
- UI 表示は小粒度の改善に限定し、API や back-fill 実装に踏み込まないこと

### 3.2 推奨アプローチ

1. 既存の admin schema alias UI と API client の response handling を `rg "backfill_cpu_budget_exhausted|schema/aliases|retryable|backfill"` で確認する。
2. HTTP 202 を成功でも失敗でもない retryable continuation として model 化する。
3. 表示文言は短くし、例として「Back-fill paused」「Retry available」「続きから再試行できます」のように、通常エラーと区別できる label にする。
4. `backfill.status='exhausted'`、`retryable=true`、`code='backfill_cpu_budget_exhausted'` の fixture を使って UI test を追加する。
5. 既存の dryRun / apply success / validation error 表示が regress していないことを確認する。

---

## 4. 実行手順

### Phase 1: 現状確認

1. `apps/web` または管理 UI 実装配下で schema alias assignment UI の実在パスを確認する。
2. `POST /admin/schema/aliases` を呼ぶ API client / hook / action を確認する。
3. 現行の HTTP 2xx / 4xx / 5xx 表示分岐を読む。

### Phase 2: 表示仕様確定

1. HTTP 202 + `backfill_cpu_budget_exhausted` + `retryable=true` を retryable continuation と定義する。
2. `backfill.status='exhausted'` の label と補助文を決める。
3. 再実行導線を既存 apply 操作の再押下にするか、専用 retry ボタンにするかを既存 UI の操作体系に合わせて決める。

### Phase 3: UI 実装

1. API response 型または narrowing helper に retryable continuation 判定を追加する。
2. 管理 UI に retryable label / status message を追加する。
3. 通常 success、validation error、conflict error、retryable continuation の表示がそれぞれ区別されるようにする。

### Phase 4: テスト追加

1. HTTP 202 fixture を使い、retryable label が表示されることを確認する。
2. `retryable=false` または通常 error では retryable label が出ないことを確認する。
3. 既存 alias apply success test がある場合は regress していないことを確認する。

### Phase 5: 仕様同期

1. 必要に応じて UI 表示仕様を該当 workflow の Phase 12 implementation guide または正本仕様に追記する。
2. UT-07B の API contract 自体は変更しないことを記録する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] HTTP 202 / `backfill_cpu_budget_exhausted` / `retryable=true` が retryable continuation として扱われる
- [ ] `backfill.status='exhausted'` が通常エラーと異なる label / status message で表示される
- [ ] 管理者が同じ alias apply を続きから再試行できる導線を UI 上で判断できる

### 品質要件

- [ ] retryable continuation 判定が UI component 内の ad hoc 文字列比較に散らばらず、helper / typed branch / local predicate のいずれかにまとまっている
- [ ] success / validation error / conflict error / retryable continuation の表示が test で区別されている
- [ ] API contract を変更せず、既存の UT-07B route / workflow contract と互換である

### ドキュメント要件

- [ ] UI 表示文言と retryable continuation の扱いが実装タスクの Phase 12 成果物に記録されている
- [ ] API 側の HTTP 202 contract は UT-07B 既存仕様を参照し、重複定義していない

---

## 6. 検証方法

### 実装パス確認

```bash
rg "schema/aliases|backfill_cpu_budget_exhausted|retryable|backfill" apps/web apps/api packages
```

期待: 管理 UI の alias apply 呼び出し箇所、または未実装の場合は追加対象の UI パスが確認できる。

### UI / component 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run
```

期待: HTTP 202 retryable fixture で retryable label が表示され、通常 error fixture では表示されない。

### 型検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

期待: API response の retryable branch が型安全に扱われ、既存 UI 型に regress がない。

### 手動確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

期待: mock / local API で HTTP 202 `backfill_cpu_budget_exhausted` 相当の response を返したとき、管理 UI に retryable back-fill status が表示される。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| HTTP 202 を通常 success と扱い、back-fill 未完了が見えなくなる | 中 | `code` / `retryable` / `backfill.status` の三点で retryable continuation branch を作る |
| UI 文言が通常 error と似すぎて運用者が失敗と誤認する | 中 | 「再試行可能」「続きから処理」など continuation を示す短い label にする |
| API contract を UI タスク内で変更してしまう | 中 | 本タスクは表示のみとし、contract 変更が必要なら UT-07B 派生 API タスクへ分離する |
| retry ボタンが重複送信を誘発する | 低 | 既存 apply の loading / disabled 制御に乗せ、連打防止を test する |

---

## 8. 参照情報

- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-12.md`
- `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/workflows/schemaAliasAssign.ts`

---

## 9. 備考

本タスクは UT-07B schema alias hardening の Phase 12 検出候補「admin UI retry label」を正式化する。API の retryable continuation は UT-07B 本体で扱い、本タスクは管理 UI の小粒度な表示改善に責務を限定する。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-101306-wt-6/docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`
- 症状: API 側では HTTP 202 / `backfill_cpu_budget_exhausted` / `retryable=true` が定義済みだが、管理 UI の表示更新は Phase 12 で対象外となっており、通常エラー表示と retryable continuation 表示の境界が未タスクとして残っている。
- 参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
