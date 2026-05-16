# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 の実装設計の妥当性を判定する Phase。GO 判定が出ない限り
> Phase 4 以降の実装に進めない gate。コード変更を伴うため必須。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-02 identity-conflicts merge UI |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | completed |

## 目的

Phase 2 の設計を **PASS / MINOR / MAJOR** で判定し、Phase 4 開始可否（GO / NO-GO）を確定する。

## レビュー観点

### 1. API 契約整合性

- [ ] `POST /api/admin/identity-conflicts/:conflictId/merge` の request body shape が
  inline panel の送信 payload `{ targetMemberId, reason }` と一致しているか
- [ ] 200 response shape (`{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }`) が hook の `T` 型と一致しているか
- [ ] 409 (`ALREADY_MERGED`) / 400 (`TARGET_MEMBER_MISMATCH`) の error shape を hook の
  error parse が網羅しているか
- [ ] `requireAdmin` middleware の 401/403 throw を hook が `FetchAuthedError` に変換できるか

### 2. UI prototype alignment

- [ ] inline panel が `docs/00-getting-started-manual/claude-design-prototype/` の既存
  dialog primitive と一致しているか（新規 primitive 生成 0）
- [ ] form primitive（label / textarea / button）が prototype と整合しているか
- [ ] design token のみで色 / radius / spacing を表現しているか（HEX 直書き / arbitrary value 禁止）

### 3. state 管理

- [ ] `IdentityConflictRow` の `stage` state と reason 入力の受け渡しに無駄が無いか
- [ ] inline 二段階確認 UI が row 内に閉じ、不要な新規 component 分割をしていないか
- [ ] `page.tsx` が server component のままで `IdentityConflictRow` だけ client component の境界を保っているか

### 4. 並行リクエスト防止 / mutation 安全性

- [ ] step-01 hook の `isSubmittingRef` を継承して二重送信防止が効くか
- [ ] inline panel close 中に進行中 mutation がある場合の挙動を設計で明示しているか
  （hook 内 isLoading が true の間は close を許可するか / disable するか）

### 5. a11y

- [ ] textarea label / `role="alert"` / `aria-live` / disabled state が付与されているか
- [ ] keyboard 操作だけで merge-confirm → merge-final → submit / cancel が可能か
- [ ] inline UI hardening 方針が記載されているか

### 6. test 戦略

- [ ] row test で初期表示 / merge-confirm / merge-final / submit / 409・400 / dismiss の網羅
- [ ] coverage Statements/Branches/Functions/Lines >=80% の達成見込み

### 7. simpler alternative 検討

| 代替案 | 検討結果 |
| --- | --- |
| inline form 展開 | 既存UIと整合する → **採用** |
| `useAdminMutation` を改変して identity-conflicts 専用機能を入れる | step-01 共通基盤を壊す → **不採用** |
| `targetMemberId` を operator 手入力 | UX 悪化 / 入力ミス事故 → **不採用** |
| 別 page へ遷移して確認させる | URL / 戻る導線・状態保持が複雑化 → **不採用** |

## 判定マトリクス

| ID | 観点 | 判定（PASS/MINOR/MAJOR） | 戻り先 |
| --- | --- | --- | --- |
| R-01 | API 契約 | TBD | Phase 1 (MAJOR 時) |
| R-02 | prototype alignment | TBD | Phase 2 (MINOR/MAJOR 時) |
| R-03 | state 衝突 / server-client 境界 | TBD | Phase 2 (MAJOR 時) |
| R-04 | 並行防止 / mutation 安全性 | TBD | Phase 2 (MAJOR 時) |
| R-05 | a11y | TBD | Phase 2 (MINOR/MAJOR 時) |
| R-06 | test 戦略 / coverage 見込み | TBD | Phase 2 (MINOR 時) |
| R-07 | `useAdminMutation` 改変回避 | TBD | Phase 1 (MAJOR 時 = 設計やり直し) |

## MINOR 追跡テーブル

| MINOR ID | 内容 | 解決予定Phase | 解決確認Phase |
| --- | --- | --- | --- |
| TBD | TBD | Phase 6 or 7 | Phase 9 / 10 |

## NO-GO 条件

- 上記レビュー観点に MAJOR が 1 件でもある
- `IdentityConflictRow` 型に `candidateTargetMemberId` が含まれず、shared schema 拡張が必要と判明
  （→ scope 外 / 親ワークフローへエスカレート）
- 新規 primitive 生成が必要と判明（今回の existing-ui-hardening から逸脱）
- `useAdminMutation` の signature 改変が必要と判明（→ step-01 へ差し戻し）
- toast library / `FetchAuthedError` 型の依存先が未特定

## GO 条件

- 全観点が PASS or MINOR（MINOR は解決予定 Phase が確定）
- simpler alternative が文書化済
- coverage AC 達成見込みが test 戦略から説明可能

## Phase 4 開始 gate / Phase 13 blocked 条件

- **Phase 4 開始 gate**: 本 Phase の `outputs/phase-03/gate-decision.md` で `GO` 判定が
  記録されていること
- **Phase 13 blocked 条件**: ユーザー承認待ち（PR・振り返り フェーズ）

## 実行タスク

- [ ] レビュー観点 1-7 を `outputs/phase-03/review-result.md` に記録
- [ ] PASS / MINOR / MAJOR 判定を全観点に対して付与
- [ ] MAJOR があれば該当 Phase に戻る指示を記載
- [ ] simpler alternative 検討結果を記録
- [ ] GO / NO-GO を `outputs/phase-03/gate-decision.md` に確定

## 参照資料

- Phase 1 成果物 (`outputs/phase-01/*`)
- Phase 2 成果物 (`outputs/phase-02/*`)
- 原典 spec: `step-02-identity-conflicts-merge/spec.md`
- step-01 成果（hook signature）

## 実行手順

1. Phase 2 成果物 4 件を読み込み
2. レビュー観点 1-7 に対し PASS / MINOR / MAJOR を付与
3. MAJOR 検出時は戻り先 Phase を明記して停止指示
4. MINOR 検出時は追跡テーブルへ登録
5. GO / NO-GO を gate-decision.md に確定し、GO のみ Phase 4 へ進む

## 統合テスト連携

Phase 8 統合テスト着手前に本 Phase の GO 判定が必要。GO 判定なしで Phase 4 以降に進んだ場合は
Phase 8 / Phase 9 でロールバックする。

## 多角的チェック観点（AIが判断）

- API contract と UI 送信 payload の 1:1 整合
- step-01 hook の境界を破らないか
- a11y / focus trap の網羅
- prototype primitive の流用が実在確認済か

## サブタスク管理

| ID | 内容 | 完了基準 |
| --- | --- | --- |
| P3-T1 | review-result.md 作成 | 全 R-01..R-07 に判定付与 |
| P3-T2 | gate-decision.md 作成 | GO / NO-GO 明記 |
| P3-T3 | MINOR 追跡テーブル更新 | MINOR ありなら全行埋まる |

## 成果物

- `outputs/phase-03/review-result.md`
- `outputs/phase-03/gate-decision.md`

## 完了条件

- [ ] 全レビュー観点に判定済
- [ ] gate-decision.md に GO / NO-GO 明記
- [ ] MINOR があれば追跡テーブル埋まっている
- [ ] coverage AC（Statements/Branches/Functions/Lines >=80%）変更なしを確認
- [ ] `bash scripts/coverage-guard.sh` exit 0 を Phase 6 / 9 / 11 完了条件に紐づけている

## タスク100%実行確認【必須】

- [ ] レビュー成果物 2 件 commit-ready
- [ ] GO 判定の場合のみ Phase 4 へ進める
- [ ] NO-GO 時は戻り先 Phase が明記されている

## 次Phase

Phase 4 (タスク分解): GO 判定後、実装サブタスク T1..Tn に分解する。
