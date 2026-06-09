# Issue #1077 follow-up 002: authenticated staging visual の admin 画面横展開 - タスク指示書

## メタ情報

```yaml
issue_number: 1127
task_id: task-issue-1077-followup-002-authenticated-staging-visual-admin-screens-expansion
task_name: authenticated staging visual 基盤の他 admin 画面（schema / requests / audit 等）への横展開
category: 改善
target_feature: apps/web /admin/* authenticated staging visual regression
priority: 低
scale: 中規模
status: consumed
canonical_workflow: docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/
consumed_by: issue-1127-authenticated-staging-visual-admin-screens-expansion
consumed_date: 2026-06-07
source_phase: issue-1077-bulk-tag-authenticated-staging-visual Phase 12 detection B-2 / skill-feedback-report 再利用パターン
created_date: 2026-06-03
dependencies: [issue-1077-bulk-tag-authenticated-staging-visual]
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `task-issue-1077-followup-002-authenticated-staging-visual-admin-screens-expansion` |
| タスク名 | authenticated staging visual 基盤の他 admin 画面（schema / requests / audit 等）への横展開 |
| 分類 | 改善 / visual regression coverage 拡張 |
| 対象機能 | `apps/web` `/admin/*` authenticated staging visual regression |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | `consumed_by_issue_1127` |
| 発見元 | issue-1077-bulk-tag-authenticated-staging-visual Phase 12 detection B-2 / skill-feedback-report 再利用パターン |
| 発見日 | 2026-06-03 |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/` |
| canonical workflow | `docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/` |

> **Consumed trace (2026-06-07)**: 本未タスクは issue #1127 canonical workflow として消費済み。
> 5 Playwright spec の local 実装は完了し、`staging-visual-authenticated --list` で認識確認済み。
> authenticated staging capture / baseline snapshot 生成 / commit / push / PR は user-gated のため
> canonical workflow 側の `implemented_local_runtime_pending` 境界で管理する。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #1077 で、staging 環境に admin 認証を通した状態で実 UI を開いて screenshot を撮る authenticated staging visual 基盤が確立された。具体的には `staging-visual-authenticated` Playwright project、`apps/web/playwright/tests/visual-staging-authenticated/` の spec 配置、admin storageState を mint する `mint-staging-storage-state.ts`、専用 CI `playwright-staging-visual-authenticated.yml` が landed している。

ただし issue-1077 本体のスコープは `/admin/members` の bulk tag picker 1 機能に絞られていた。基盤自体（storageState mint + authenticated project + CI）は機能非依存で汎用的に再利用できることが Phase 12 detection B-2 および skill-feedback-report の再利用パターン候補として識別された。

### 1.2 問題点・課題

現状、authenticated staging visual 回帰検出が効くのは bulk tag picker 系の限られた画面のみで、`/admin/schema`・`/admin/requests`・`/admin/audit`・`/admin/identity-conflicts` といった他の admin 画面は staging 認証付きの visual baseline を持たない。これらは認証境界・実 D1 レスポンス・Cloudflare Workers runtime を通した実描画の回帰を検出できない状態にある。

### 1.3 放置した場合の影響

- 他 admin 画面のレイアウト崩れ・トークン回帰・認証境界の描画差分が staging 実機で検出されないまま残る。
- 既に確立済みの汎用基盤が 1 機能だけに使われ、横展開コストが低いにもかかわらず coverage 拡張が進まない。
- 画面ごとの read-only / mutation の副作用境界判定を後回しにすると、誤った staging mutation を誘発するリスクが温存される。

---

## 2. 何を達成するか（What）

### 2.1 目的

issue-1077 で確立した authenticated staging visual 基盤を再利用し、他の admin 画面へ read-only visual baseline を横展開して、staging 実機での authenticated visual 回帰検出範囲を広げる。

### 2.2 最終ゴール

- `/admin/schema`・`/admin/requests`・`/admin/audit`・`/admin/identity-conflicts` 等の read-only 表示画面が `staging-visual-authenticated` project の spec として capture される。
- 各画面は 1 画面 1 spec として独立追加され、並列着手・段階追加が可能になっている。
- 既存 CI `playwright-staging-visual-authenticated.yml` が追加 spec を追加設定なしに認識・実行する。
- 各 spec は mutation を伴わない read-only 表示状態のみを capture し、共有 staging D1 へ破壊的副作用を残さない。

### 2.3 スコープ

#### 含むもの

- `staging-visual-authenticated` project への read-only admin 画面 spec の追加（1 画面 1 spec）。
- 横展開候補画面（`/admin/schema`・`/admin/requests`・`/admin/audit`・`/admin/identity-conflicts`・`/admin/tags`・`/admin/meetings` 等）から read-only 表示が中心の画面を優先選定。
- 既存 `mint-staging-storage-state.ts` の admin storageState 再利用。
- 画面ごとの read-only / mutation 副作用境界の判定と記録。

#### 含まないもの

- mutation を伴う画面（bulk tag result 等）の baseline 取得（C-1 系の別タスクに委ねる）。
- 新規 Playwright project / 新規 CI workflow の追加（既存基盤を再利用する）。
- apps/web / apps/api のコード・schema 変更。
- production 環境での visual capture。
- commit / push / PR 作成。

### 2.4 成果物

- 横展開対象 admin 画面ごとの read-only authenticated staging visual spec。
- 画面選定と副作用境界判定の記録（read-only 確定 / mutation 除外の根拠）。
- capture command / 対象 URL / auth method の実行ログ。
- Phase 11 / 12 evidence ledger への screenshot / log path 同期差分。

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- issue-1077 の `staging-visual-authenticated` project と `mint-staging-storage-state.ts` が landed 済みである。
- staging admin storageState を mint できる。
- 横展開対象画面が staging 上で admin 認証で表示できる。
- 各画面の read-only / mutation 副作用境界が事前に確定している。

### 3.2 依存タスク

- 親 workflow: `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/`
- 副作用を伴う result baseline は別タスク（C-1 系 mutation baseline）へ委ねる。

### 3.3 必要な知識

- `staging-visual-authenticated` Playwright project と project 認識の仕組み。
- `mint-staging-storage-state.ts` による admin storageState minting。
- 各 admin 画面の read-only 表示と mutation トリガーの DOM 上の区別。
- staging 共有 D1 への副作用境界の判断基準。

### 3.4 推奨アプローチ

既存 spec `admin-members-bulk-tag-authenticated.spec.ts`（admin 認証 → 実画面 → screenshot のパターン）を雛形として、1 画面ずつ独立 spec を追加する。各 spec は admin storageState を読み込み、対象画面へ遷移し、read-only 表示状態を screenshot する。mutation を伴う操作（保存・削除・bulk 実行）は spec から呼ばず、read-only 表示の capture に限定する。画面選定では mutation 副作用の有無を最初に判定し、read-only 確定画面から段階追加する。

---

## 4. 実行手順

### Phase構成

1. 横展開対象画面の選定と副作用境界判定。
2. read-only authenticated staging spec の追加 / 実行。
3. evidence 同期と coverage 記録。

### Phase 1: 横展開対象画面の選定と副作用境界判定

#### 目的

候補画面から read-only で capture できる画面を確定し、mutation 画面を除外する。

#### 手順

1. 横展開候補（`/admin/schema`・`/admin/requests`・`/admin/audit`・`/admin/identity-conflicts`・`/admin/tags`・`/admin/meetings` 等）を列挙する。
2. 各画面の read-only 表示 / mutation トリガーを区別し、read-only 確定画面を優先選定する。
3. mutation 副作用がある画面は除外し、C-1 系へ trace する。

#### 成果物

- 横展開対象画面リスト。
- read-only / mutation 副作用境界の判定記録。

#### 完了条件

- read-only 確定画面と除外画面が根拠付きで確定している。

### Phase 2: read-only authenticated staging spec の追加 / 実行

#### 目的

選定画面の read-only 表示を `staging-visual-authenticated` project の独立 spec として capture する。

#### 手順

1. `admin-members-bulk-tag-authenticated.spec.ts` を雛形に 1 画面 1 spec を `apps/web/playwright/tests/visual-staging-authenticated/` へ追加する。
2. admin storageState を mint / 読み込みし、対象画面へ遷移する。
3. read-only 表示状態の screenshot を取得する。
4. project が追加 spec を認識することを `--list` で確認する。
5. command / URL / auth method / screenshot path をログへ記録する。

#### 成果物

- 横展開対象画面ごとの read-only spec。
- screenshot baseline。
- execution log。

#### 完了条件

- 追加 spec が `staging-visual-authenticated` project で認識・実行され、read-only screenshot が取得されている。

### Phase 3: evidence 同期と coverage 記録

#### 目的

横展開した coverage を evidence ledger と同期し、副作用境界判定を文書化する。

#### 手順

1. 取得 screenshot / log path を Phase 11 evidence へ記録する。
2. read-only / mutation 副作用境界の判定を docs に残す。
3. implementation-guide / artifacts ledger と canonical 名を同期する。

#### 成果物

- coverage / evidence 記録差分。
- 副作用境界判定ドキュメント。

#### 完了条件

- screenshot / log path が evidence ledger と一致し、除外画面の trace 先が明記されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 選定した read-only admin 画面が `staging-visual-authenticated` project の独立 spec として追加されている。
- [ ] 追加 spec が CI `playwright-staging-visual-authenticated.yml` で追加設定なしに認識・実行される。
- [ ] 各画面の read-only screenshot が取得され、capture command / URL / auth method が実行ログに残っている。

### 品質要件

- [ ] 追加 spec は read-only 表示のみを capture し、mutation を伴う操作を含まない。
- [ ] 共有 staging D1 へ破壊的副作用を残していない。
- [ ] 既存基盤（storageState mint / project / CI）を再利用し、新規 project / workflow を増やしていない。

### ドキュメント要件

- [ ] 横展開対象 / 除外画面が read-only / mutation 副作用境界の根拠付きで記録されている。
- [ ] Phase 11 evidence ledger に screenshot / log path が記録されている。
- [ ] mutation baseline が C-1 系の別タスクへ trace されていることが明記されている。

---

## 6. 検証方法

### テストケース

- project 認識: 追加 spec が `staging-visual-authenticated` project に列挙される。
- read-only capture: 選定画面が admin 認証付きで開き、read-only 表示が screenshot される。
- 副作用境界: mutation を伴う画面が spec から呼ばれていない。

### 検証手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list
```

期待: `staging-visual-authenticated` project が認識され、横展開した read-only spec が一覧に表示される。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| read-only と判断した画面が実は mutation を誘発し staging D1 へ副作用を残す | 高 | 中 | Phase 1 で各画面の DOM 上の mutation トリガーを判定し、read-only 表示状態の capture のみに限定する |
| staging admin storageState が mint できず screenshot が撮れない | 中 | 中 | 既存 `mint-staging-storage-state.ts` を再利用し、認証手順が変わる場合は user-gated evidence として明記する |
| 画面数が多く 1 サイクルで全画面を取得しようとして scope が肥大化する | 中 | 中 | 1 画面 1 spec の独立追加とし、read-only 確定画面から段階的に並列着手する |
| 横展開 spec の screenshot 名が既存 ledger と drift する | 低 | 中 | canonical 名を Phase 11 / implementation-guide / artifacts ledger で同一 wave 同期する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/`
- `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-12/skill-feedback-report.md`

### 参考資料

- `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`
- `apps/web/playwright/tests/visual-staging-authenticated/mint-staging-storage-state.ts`
- `.github/workflows/playwright-staging-visual-authenticated.yml`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | issue-1077 は bulk tag picker 1 機能に絞って authenticated staging visual を実装したため、他 admin 画面（schema / requests / audit / identity-conflicts 等）が staging 認証付き visual baseline を持たない |
| 原因 | issue-1077 で確立した基盤（storageState mint + authenticated project + CI）は汎用的で他画面へ再利用できると skill-feedback-report で識別されたが、本体スコープは 1 機能に限定されていた |
| 対応 | 横展開は画面ごとに read-only / mutation の副作用境界判定が必要なため、画面選定を伴う独立タスクとして切り出した |
| 再発防止 | 汎用基盤確立タスクでは「基盤の再利用範囲」と「本体スコープ」を区別し、横展開候補を未タスク detection と skill-feedback-report の再利用パターンへ明示記録する |

### レビュー指摘の原文（該当する場合）

```text
issue-1077 Phase 12 detection B-2: staging-visual-authenticated 基盤は機能非依存で他 admin 画面へ低コストで横展開できる。ただし mutation 副作用を伴う画面は read-only capture から分離し、画面選定を伴う改善タスクとして切り出すこと。
```

### 補足事項

横展開は read-only 表示画面を優先し、mutation を伴う result baseline は C-1 系の別タスクへ委ねる。commit / push / PR 作成はユーザー指示があるまで実行しない。
