# Phase 10 — 最終レビュー

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> 本タスクは implemented_local_evidence_captured（VISUAL_ON_EXECUTION）。本フェーズは「Phase 1 で確定した AC-1〜AC-10 が、Phase 2〜9 で確定した設計・データ・spec によって本サイクルで達成可能か」を判定する。
> local実装は完了済みのため、各 AC は **「PASS」** の状態として扱い、達成手段（どの spec / コマンドで充足を証明するか）を確定する。

---

## 1. 受入条件（AC-1〜AC-10）充足判定（implemented_local_evidence_captured 時点）

| AC | 内容（phase-1.md 要約） | 達成手段（Phase 2〜9 の確定設計） | 判定（implemented_local_evidence_captured 時点） |
|----|--------------------------|-----------------------------------|---------------------------|
| AC-1 | TEST-MEM-01..10 の `profile` が表示バリエーション・マトリクス通りに Google Form 31 stable_key を保持 | catalog.ts の per-member profile を STABLE_KEY 経由で拡充。`catalog.spec.ts` が各 member のキー網羅と充填レベル（フル/中/全項目入力/エッジ）を assert | PASS（catalog.spec PASS で充足） |
| AC-2 | 公開掲載 5 件（01,06,07,09,10）が visibility=public 全 29 項目を保持（09 全項目入力・10 エッジ） | catalog の公開掲載 member に 29 public 項目を充填。`catalog.spec` / `contract.spec` が 29 項目存在と 09 の意図的空・10 のエッジ値を assert | PASS |
| AC-3 | member/admin 項目（birthDate/ubmJoinDate/challenges）もデータとして投入（公開非表示） | catalog の profile に member/admin 可視性キーを投入。`catalog.spec` がデータ存在を assert、`contract.spec` が公開 view 非露出を assert | PASS |
| AC-4 | gen 再生成結果が committed seed/cleanup/manifest と byte 一致（drift 0） | `gen-test-accounts-seed.mjs` 再生成 + `git diff --exit-code` / `contract.spec` の byte 一致検証 | PASS |
| AC-5 | in-memory D1 投入後、公開掲載 5 件の公開項目が全取得でき member/admin 項目は公開 view に漏れない | `contract.spec.ts` が setupD1 で seed 適用し公開項目取得 + 二重防御を assert | PASS |
| AC-6 | 公開詳細ページが full/all-fields/edge で全 public 項目を 5 セクション描画、空項目は `—` fallback / 条件付き非表示で破綻しない | `member-detail.spec.ts` + component spec が full/all-fields/edge fixture で描画 + 全項目保持 を assert | PASS（ギャップ発見時は最小修正後に再検証） |
| AC-7 | API endpoint / D1 schema / migration / Form schema を一切追加・変更しない | `git diff` で apps/api/src/routes・migrations(seed 以外)・packages/shared/zod に変更 0 を確認 | PASS（git diff 0） |
| AC-8 | typecheck / lint green。HEX 直書き 0・新規 primitive 0 | Phase 9 の typecheck / lint / verify-design-tokens / grep 手順 | PASS |
| AC-9 | seed → cleanup → seed 冪等（重複適用で件数不変・cleanup 後 0 件） | `contract.spec.ts` が 2 回適用件数比較 + cleanup 後 0 件を assert | PASS |
| AC-10 | （user-gated）staging 適用後 `/members/TEST-MEM-06`(+01/07/09/10) で全 public 項目描画を目視確認しスクリーンショット取得 | Phase 11 手動テスト手順。**user-gated 実行**（implemented_local_evidence_captured 時点では PNG pending） | user-gated（実行後に Phase 11 evidence で充足） |

> AC-1〜AC-9 は今回のlocal実装 1 サイクルで自動検証可能。AC-10 のみ staging D1 apply + authenticated スクリーンショットが必要なため user-gated（CONST_002 / CONST_006）。

---

## 2. blocker 判定

**blocker なし。**

- 新規 D1 schema / migration / API endpoint / Form schema の追加が不要（既存 surface のみ）で、依存追加によるブロックなし。
- 公開詳細 5 セクション描画は commit `66d18af1b` で landed 済み。Lane B は「データを与えて検証」が主で、新規描画基盤の整備待ちがない。
- in-memory D1 テストは既存 `setupD1` + `vitest.d1.config.ts` を再利用。新規テスト基盤の整備待ちがない。
- build-seed-sql は TEST-MEM-01 で全 public 項目描画を成立させており、9 件への汎用展開のリスクは Phase 3 リスクレビューで「最小一般化で対応可能」と確定済み。

---

## 3. MINOR 指摘（Phase 12 未タスク検出 / unassigned へ送る方針）

実装中に下記の MINOR が顕在化した場合は **Phase 12 unassigned-task-detection.md** へ送り、本サイクルでは扱わない。現時点の baseline / current 候補を列挙する。

| ID | 指摘 | 区分 | 扱い |
|----|------|------|------|
| MINOR-1 | 公開ページへの member/admin 項目（生年月日・UBM参加時期・現在の課題・同意状況）表示追加 | **OOS（ユーザー判断「現状維持」）** | user 判断で公開ページ非表示。**未タスク化しない**（意図的除外）。データは投入済みで別画面確認可能 |
| MINOR-2 | ログイン後 `/profile`（member 可視）/ `/admin`（admin 可視）でのテストアカウント全項目表示確認 | **baseline（将来タスク候補）** | 本タスクは公開詳細ページの目視確認が成果。member/admin 可視項目の `/profile`・`/admin` 表示確認は別画面・別関心。baseline 候補として Phase 12 へ列挙（起票は user 判断） |
| MINOR-3 | member_photos のメタデータ行は投入するが R2 写真バイナリ実体は未投入。photo 描画 e2e は別関心 | **baseline（別関心・スコープ外）** | index.md「含まない」相当。photo 描画 e2e タスクの未タスク候補として Phase 12 へ列挙 |
| MINOR-4 | Lane B でギャップ（表示漏れ）が発見されず作業が「検証 + fixture/spec 追補」に縮退した場合 | **current（正常な verify_existing 帰結）** | ギャップなしは想定内（commit 66d18af1b で網羅済み見込み）。縮退時は Phase 7/9 で「変更行 0 ＝ 維持」を記録し、新規 current タスクは起こさない |
| MINOR-5 | Google Form 実回答（スプレッドシート）の本番 sync 取り込み | **OOS（別関心・既存方式踏襲）** | テストアカウントは form sync を経由せず D1 直接 seed する既存方式。実 messy データ取り込みは別タスク。**未タスク化しない**（明示的除外） |

> baseline 候補（MINOR-2 / MINOR-3）と OOS（MINOR-1 / MINOR-5）の区別: baseline は「将来の別タスクとして妥当だが今回スコープ外」、OOS はユーザー判断 / 既存方式により**そもそも本タスクの対象外**。current（MINOR-4）は本タスクで発生し得る正常な縮退で、新規タスク化を要しない。実際の起票要否は Phase 12 unassigned-task-detection.md で 2 回検証して確定する。

---

## 4. 不変条件遵守の最終確認

- [ ] D1 アクセスは apps/api / scripts に閉じる（apps/web は API 取得のみ・D1 binding 非接触・不変条件 #5）
- [ ] 新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #2）
- [ ] 新規 D1 schema / migration / API endpoint / Form schema 追加 0（不変条件 #3 / AC-7）
- [ ] consent キー `publicConsent` / `rulesConsent`、`responseEmail` は system field（不変条件 #4）
- [ ] OKLch トークンのみ・HEX 直書き 0・新規 primitive 0（不変条件 #5 / AC-8）
- [ ] visibility=public 二重防御維持・member/admin 項目を公開ページに漏らさない（不変条件 #6）
- [ ] stableKey は STABLE_KEY 定数経由（不変条件 #7）
- [ ] production seed apply は CLI 構造で禁止（不変条件 #8 / `--env production` 拒否）

---

## 5. 総合判定

**GO for implementation.**

- AC-1〜AC-9 はすべて Phase 2〜9 の確定設計・spec で「PASS」として自動検証可能。AC-10 のみ user-gated（staging apply + スクリーンショット）。
- blocker なし。MINOR-1〜5 はいずれも OOS（ユーザー判断/別関心）/ baseline（将来候補）/ current（正常縮退）で、本サイクル（CONST_007 1 cycle）の完了を妨げない。
- 不変条件は §4 のとおり全項目が設計上遵守される。
- 次フェーズ: Phase 11 手動テスト（VISUAL_ON_EXECUTION 宣言・implemented_local_evidence_captured ゆえスクリーンショットは user-gated 実行後）。

## 完了条件

- AC-1〜AC-10 の充足判定テーブルを「PASS」状態で確定した（AC-10 のみ user-gated）。blocker なしを確認した。MINOR 指摘（OOS / baseline / current）を Phase 12 unassigned 送り対象として列挙し、baseline 候補（/profile・/admin 表示確認 / photo 描画 e2e）と OOS（公開ページへの member/admin 表示追加 / form sync 取り込み）を区別した。総合判定 GO。Phase 11 へ進む。
