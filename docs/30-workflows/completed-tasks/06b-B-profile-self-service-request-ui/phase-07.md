# Phase 7: AC マトリクス — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 7 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

index.md に列挙された AC（5 件）を行に展開し、列に「AC 内容」「実装箇所」「検証テスト ID（Phase 4 由来）」「evidence path（screenshot / E2E log / coverage / static lint）」「status」を持つ AC マトリクスを完成させる。
未カバー AC（ギャップ）と Phase 10 最終レビューゲートへの突入条件を確定する。

## 実行タスク

1. index.md の AC-1..AC-5 を再展開し、Phase 1 の AC-1..AC-7（拡張版）と紐付ける。完了条件: index AC × Phase 1 拡張 AC の対応表が成立する。
2. 各 AC の実装箇所を Phase 2 設計（component / helper）と Phase 5 ランブックの予定パスに紐付ける。完了条件: 全 AC で実装パスが決定論的に 1 件以上特定されている。
3. 各 AC の検証テスト ID（Phase 4 で定義予定の `profile.visibility-request.spec.ts` / `profile.delete-request.spec.ts` / unit `me-requests.test.ts` / a11y axe / static lint grep）を割り当てる。完了条件: 全 AC が最低 1 つの自動検証 ID を持つ。
4. 各 AC の evidence path（`outputs/phase-11/screenshots/*.png` / `outputs/phase-11/e2e/*.log` / `outputs/phase-09/coverage.json` / `outputs/phase-09/lint-grep.txt` 等）を確定する。完了条件: evidence path が `outputs/phase-N/...` 形式で確定している。
5. ギャップ分析（自動化不能 AC / 手動 evidence のみで PASS とする AC）を一覧化する。完了条件: 手動依存 AC が approval gate と紐付く。
6. Phase 10 最終レビューゲートへの突入条件を「全 AC が PASS / MINOR-tracked」に固定する。完了条件: NO-GO 条件が記載される。

## 参照資料

| 資料名 | パス | 用途 |
| --- | --- | --- |
| index.md AC | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/index.md` | AC 5 件の正本 |
| Phase 1 拡張 AC | `outputs/phase-01/main.md` | AC-1..AC-7 の evidence 詳細 |
| Phase 2 設計 | `outputs/phase-02/main.md` | 実装箇所マッピング元 |
| Phase 3 レビュー | `outputs/phase-03/main.md` | NO-GO / MINOR 取扱 |
| Phase 4 テスト戦略 | `outputs/phase-04/main.md` | テスト ID 定義 |
| 仕様書 | `docs/00-getting-started-manual/specs/{05-pages,07-edit-delete,09-ui-ux}.md` | 不可逆性・ダイアログ規範 |
| 現行 UI / API | `apps/web/app/profile/page.tsx` / `apps/api/src/routes/me/index.ts` | 実装着地点 |

## 実行手順

### 1. index AC ↔ Phase 1 拡張 AC マッピング

| index AC | Phase 1 拡張 AC | 備考 |
| --- | --- | --- |
| AC-1 公開停止/再公開申請を送れる | AC-1（停止）/ AC-2（再公開） | `desiredState` 引数で 1 endpoint を兼用 |
| AC-2 退会申請を送れる | AC-3 | 二段確認必須 |
| AC-3 二重申請 409 を表示 | AC-4 | duplicate banner + button disabled |
| AC-4 本文編集 UI 追加禁止（negative） | AC-5 / 不変条件 #4 | static grep で 0 hit |
| AC-5 申請 UI のスクリーンショット/E2E 保存 | Phase 11 evidence | `outputs/phase-11/` 配下 |
| （補強）a11y / D1 直接禁止 | AC-6 / AC-7 | 不変条件 #5 と axe |

### 2. AC マトリクス本体

| AC ID | 内容 | 実装箇所（予定パス） | 自動検証テスト ID | 静的検証 / lint | evidence path | status |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | `/profile` から公開停止申請が送信でき 202 後に pending banner が表示される | `apps/web/app/profile/_components/RequestActionPanel.tsx` / `VisibilityRequestDialog.tsx` / `apps/web/src/lib/api/me-requests.ts#requestVisibilityChange` | E2E `e2e/profile.visibility-request.spec.ts::S1-hidden` / unit `me-requests.test.ts::visibility-202` | — | `outputs/phase-11/screenshots/visibility-hidden-202.png` / `outputs/phase-11/e2e/visibility-request.log` | TBD（Phase 11 で確定） |
| AC-2 | `publishState=hidden` の本人だけに「再公開を申請する」ボタンが表示され、押下→確認→202→banner | 同上（`desiredState=public`） | E2E `profile.visibility-request.spec.ts::S2-public` / visual diff `RequestActionPanel.hidden.png` vs `.public.png` | — | `outputs/phase-11/screenshots/visibility-public-202.png` / `outputs/phase-11/visual-diff/RequestActionPanel-hidden-vs-public.png` | TBD |
| AC-3 | `/profile` から退会申請が二段確認後にのみ送信され 202 後に pending banner | `apps/web/app/profile/_components/DeleteRequestDialog.tsx` / `me-requests.ts#requestDelete` | E2E `e2e/profile.delete-request.spec.ts::S3-confirmed` / unit `me-requests.test.ts::delete-202` / unit `DeleteRequestDialog.test.tsx::two-step-confirm` | — | `outputs/phase-11/screenshots/delete-step1.png` / `delete-step2.png` / `delete-202.png` / `outputs/phase-11/e2e/delete-request.log` | TBD |
| AC-4 | 同種 pending 申請存在時の再 submit が 409 を返し、banner + button disabled になる | `RequestActionPanel.tsx`（disabled 表示）/ `RequestErrorMessage.tsx`（DUPLICATE_PENDING_REQUEST） | E2E `profile.visibility-request.spec.ts::S4-duplicate` / E2E `profile.delete-request.spec.ts::S4-duplicate` / unit `me-requests.test.ts::409-duplicate` | — | `outputs/phase-11/screenshots/duplicate-409-banner.png` / `outputs/phase-11/e2e/duplicate-request.log` | TBD |
| AC-5 (negative) | profile 本文編集 UI（氏名/メール/かな等の `<input>` `<textarea>`）が追加されない | `apps/web/app/profile/_components/Request*.tsx` 配下に該当 input が存在しないこと | static grep gate（CI / Phase 9 で実行） | `rg -n 'name="(displayName\|email\|kana\|phone\|address)"' apps/web/app/profile/_components/Request*.tsx` → 0 hit | `outputs/phase-09/lint-grep-no-body-edit.txt` | TBD |
| AC-6 | 申請 UI のスクリーンショットと E2E ログが保存される | `outputs/phase-11/screenshots/` / `outputs/phase-11/e2e/` | Phase 11 runbook 完走 | — | 上記 AC-1..AC-4 の evidence 群を集約した `outputs/phase-11/main.md` の evidence 一覧 | TBD |
| AC-7 (補強) | a11y: dialog `role=dialog`+`aria-modal`+focus trap+esc close、エラー `role=alert` | `VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx` / `RequestErrorMessage.tsx` | unit `*.test.tsx::a11y-roles` / axe scan `e2e/profile.a11y.spec.ts` | — | `outputs/phase-09/axe-report.json` / `outputs/phase-11/screenshots/dialog-focus-trap.png` | TBD |
| AC-8 (補強) | apps/web から D1 直接 import が無い（不変条件 #5） | `apps/web/` 配下全域 | static grep gate | `rg -n 'cloudflare:d1\|D1Database' apps/web/` → 0 hit | `outputs/phase-09/lint-grep-no-d1.txt` | TBD |

> status は本タスク（仕様書整備）時点では `TBD`。Phase 9 / Phase 11 の実測時に `PASS` / `MINOR` / `MAJOR` に書き換える。

### 3. ギャップ分析（未カバー / 手動依存 AC）

| 項目 | 状況 | 緩和策 |
| --- | --- | --- |
| pending banner の reload 後の永続性 | 自動 E2E では検証不能（API 側 `pendingRequestTypes` 未提供のため） | Phase 3 MINOR-1 として記録、Phase 12 follow-up へ |
| 429 RATE_LIMITED の UI 文言 | rate limit 窓値依存で安定再現困難 | Phase 11 で API mock を使った visual SS のみ取得（手動 evidence） |
| 退会の不可逆性表記の心理的妥当性 | 自動検証外 | Phase 11 で screenshot を保存し、Phase 10 レビュー時に user 確認 |
| `RULES_CONSENT_REQUIRED` panel 非表示 | 401 と異なり middleware 由来で再現に DB 状態操作が必要 | Phase 4 で fixture 整備、E2E 1 ケースに限定 |

### 4. Phase 10 突入条件 / NO-GO

| 条件 | 内容 |
| --- | --- |
| GO | 全 AC が `PASS` または MINOR で Phase 12 follow-up 起票済み |
| NO-GO | AC-1..AC-4 / AC-5 / AC-7 / AC-8 のいずれかが `MAJOR` または未実測 |
| 戻り先 | 設計起因 → Phase 2、テスト起因 → Phase 4、実装起因 → Phase 5 |

## 統合テスト連携

| 判定項目 | 基準 | 確認 Phase |
| --- | --- | --- |
| ユニットテスト Line / Branch | 80% / 80% | Phase 9 |
| 結合テスト（既存 /me API） | 100% 成功 | Phase 9 |
| E2E 正常系（S1/S2/S3） | 100% | Phase 11 |
| E2E 異常系（S4/S5） | 80%+ | Phase 11 |
| static grep（#4 / #5 / #11） | 0 hit | Phase 9 |
| axe a11y | 重大 violation 0 件 | Phase 9 |

- 上流: 04b /me self-service API / 06b profile page / 06b-A Auth.js session resolver
- 下流: 06b-C profile logged-in visual evidence / 08b profile E2E full execution

## 多角的チェック観点

- 不変条件 #4 / #5 / #11 を AC として明示し、static grep 0 hit を gate にしているか
- AC-5 のような negative AC を「実装が無いこと」の evidence で PASS にできているか（grep 出力を保存）
- 未実装 / 未実測の AC を `TBD` として残し、`PASS` と扱っていないか
- 06b-A 完了 gate を Phase 7 でも確認し、Phase 11 開始判断と整合させているか
- Phase 12 follow-up（pending 永続化）が MINOR として記録されているか

## サブタスク管理

- [ ] index AC × Phase 1 拡張 AC の対応表を完成させる
- [ ] AC-1..AC-8 の実装箇所 / テスト ID / evidence path を埋める
- [ ] ギャップ分析（手動依存 AC）を一覧化する
- [ ] Phase 10 突入 GO / NO-GO 条件を確定する
- [ ] `outputs/phase-07/main.md` を作成する

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| AC マトリクス | `outputs/phase-07/main.md` | AC-1..AC-8 を行に持つマトリクス + ギャップ分析 + GO/NO-GO 条件 |

## 完了条件

- [ ] index.md AC 5 件と Phase 1 拡張 AC 7 件の対応表が記録されている
- [ ] AC マトリクスの全行で「実装箇所」「テスト ID」「evidence path」が確定している
- [ ] negative AC（AC-5）が static grep 0 hit という形で検証可能になっている
- [ ] ギャップ分析がされ、手動依存 AC は Phase 11 evidence と紐付いている
- [ ] Phase 10 突入条件と NO-GO 条件が記載されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] AC が evidence path と 1:1 で対応している
- [ ] 完了済み本体タスクの復活ではなく未反映 UI の AC 整理になっている
- [ ] 06b-A 依存 gate が Phase 7 でも継承されている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクス、ギャップ一覧、GO/NO-GO 条件、Phase 11 evidence path 一覧を渡す。
