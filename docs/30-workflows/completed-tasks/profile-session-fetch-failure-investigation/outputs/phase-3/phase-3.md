# Phase 3: 設計レビュー

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation（VISUAL） |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 1/2 で確定した調査 lane（Lane1/2/3）と観測性向上設計（D1/D2/D3）について、調査網羅性・観測性変更が不変条件を侵さないかをレビューし、Phase 4（I/O 契約）へ進めるか判定する（PASS/MINOR/MAJOR）。あわせて **Phase 11 が「staging 実機での `/me` status 切り分け」に特化する旨を宣言**する。

## 実行タスク

### 3.1 モジュール俯瞰（想定変更ファイル）

| タスク | 変更/新規ファイル | 種別 |
|--------|-------------------|------|
| T01（D1） | `apps/web/app/(member)/profile/page.tsx` | 編集（デフォルト分岐を 410/5xx族/FAILED で区別 + `data-*`） |
| T01（D1） | `apps/web/src/components/member/SectionError.tsx` | 編集（`data-error-code` 等の `data-*` 属性付与・既存 props 範囲） |
| T01（D1） | `apps/web/app/(member)/profile/page.spec.tsx` | 編集（410/5xx/FAILED 各分岐テスト追加） |
| T02（D2） | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集（失敗時 `status`/`code`/`path` 構造化ログ） |
| T02（D2） | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 新規 or 編集（ログ出力テスト） |
| T03（D3） | `scripts/diagnose-profile-session.sh` | 新規（read-only 診断スクリプト） |

### 3.2 調査網羅性レビュー

| 観点 | 判定 | 根拠 |
|------|------|------|
| H3（410）の証拠取得 | ✅ | Lane1（`/me` status=410）+ Lane3（`member_status.is_deleted` read-only SELECT）の二重確認。`session-guard.ts:95-100` |
| H4（5xx）の証拠取得 | ✅ | Lane1（`/me` status=5xx）+ API worker ログ。session-resolver / D1 例外の経路を参照 |
| H5（transport FAILED）の証拠取得 | ✅ | Lane1（service-binding 応答可否）+ Lane2（`MEMBER_SESSION_FAILED` か `_410`/`_5xx` か）。`transport.ts:27,40-42` / `safe-fetch.ts:11-19` |
| H1（版数）の確認 | ✅ | Lane1 / D3 で staging deploy 版数を確認 |
| H2（401）・404 の除外妥当性 | ✅ | 401 は redirect（`page.tsx:46-47`）、404 は再ログイン CTA（`page.tsx:53-63`）で画像症状（再読み込みバナー）と矛盾。一次除外が妥当 |
| AC-1〜8 のカバレッジ | ✅ | AC-1=Lane1+phase-11 結論 / AC-2=Lane3 管理者 identity・status / AC-3=D1 / AC-4=D2 / AC-5=D3 / AC-6=非接触 / AC-7=spec / AC-8=Phase 12 未タスク化 |

### 3.3 不変条件 非侵襲レビュー（観測性変更が境界を侵さないか）

| 不変条件 | 侵さない根拠 | 判定 |
|------|------|------|
| 既存 API surface 不変（`/me` path・shape・status 体系） | D1/D2 は `apps/web` のみ。`apps/api` は read-only 参照のみで diff 空（AC-6） | ✅ |
| fail-closed（認証境界） | `/me` 認証判定は `session-guard` 所有のまま不変。web は表示と観測のみで認証を再判定しない（401→redirect 不変。`page.tsx:46-47`） | ✅ |
| memberId 非露出（#11） | D2 ログは `status`/`code`/`path` のみ出力し memberId を出さない。D1 の `data-*` は error code のみで個人情報を含めない | ✅ |
| OKLch トークン正本（HEX 直書き禁止） | D1 の表示変更は `SectionError` props と `data-*` 属性のみ。色は既存 token 経由・HEX 直書きなし | ✅ |
| 新規 primitive 禁止 | `SectionError`（`section-error` primitive）の既存 props 拡張に留め、新規コンポーネントを作らない | ✅ |
| D1 直接アクセスは `apps/api` に閉じる（#5） | Lane3 の D1 参照は `bash scripts/cf.sh d1` 経由の read-only SELECT。`apps/web` から D1 binding を張らない | ✅ |
| `wrangler` 直叩き禁止 / secret 非転記 | D3 は `scripts/cf.sh` ラッパー経由。secret は有無の parity 確認のみで実値を出力しない | ✅ |

### 3.4 Phase 11 の特化宣言

> **Phase 11（手動テスト）は「staging 実機での `/me` status 切り分け」に特化する。** 具体的には (1) DevTools Network で `/profile` SSR 経路 / web proxy `/api/me` の `/me` HTTP status を観測、(2) `bash scripts/diagnose-profile-session.sh`（read-only）で staging `/me` の status・env/secret parity・deploy 版数を取得、(3) `bash scripts/cf.sh d1` の read-only SELECT で当該 member の `member_status.is_deleted` / identity・status 整合を確認する。これらにより H1〜H5 のいずれかへ真因を収束させ、確定結論を `outputs/phase-11/manual-test-result.md` に根拠付きで記録する（AC-1/AC-2）。現象 screenshot はユーザー提供済みを文中参照し、診断後の static UI contract screenshot は実装時に取得、staging 認証 runtime screenshot は user-gated とする。

### 3.5 4条件評価（設計レビュー判定）

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | 「ログイン済みなのにマイページが出ない」真因を観測可能化し、診断不能ループ（B1）を断つ。以後同種事象を即座に切り分け可能 |
| 実現性 | PASS | 既存 `SectionError` props 拡張 + `safe-fetch.ts` ログ追加 + read-only スクリプト新規のみ。新規依存・API 変更なし。1 サイクルで実装可能 |
| 整合性 | PASS | API は read-only・認証判定不変、web は表示と観測のみ。責務境界が閉じる。`/me` shape・status 体系・D1・Form 不変 |
| 運用性 | PASS | D3 診断スクリプトで再現的に切り分け可能。D2 構造化ログで次回以降の真因が server ログに残る |

判定: **Phase 4 へ進む（PASS）**。

### 3.6 MINOR 指摘の追跡

- MINOR 指摘: **0 件**。
- 理由: 調査 lane は H3/H4/H5 を二重以上の経路（Lane1 status + Lane3 D1 / Lane2 code）で証拠化しており網羅的、観測性変更（D1/D2/D3）はいずれも `apps/web` + `scripts/` に閉じて §3.3 の全不変条件を侵さない。本格修正（410 復帰 / 5xx 根治 / transport 運用 / 管理者 UX）は CONST_007 例外①で Phase 12 未タスク化済みであり、本サイクルの設計に未解決の懸念は残らないため MINOR ゼロが妥当（0 件にした理由を明示）。

## 完了条件

- [x] 想定変更ファイル群を俯瞰（D1/D2/D3）
- [x] 調査網羅性（H3/H4/H5 の証拠取得・H2/404 除外妥当性・AC カバレッジ）をレビュー
- [x] 観測性変更が不変条件（API surface 不変・fail-closed・memberId 非露出・OKLch トークン・新規 primitive 禁止・D1 #5）を侵さないことを確認
- [x] Phase 11 を staging 実機切り分けに特化する旨を宣言
- [x] 4条件評価で Phase 4 進行可否を判定（PASS）/ MINOR 0 件の理由を記載

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 参照資料

- `outputs/phase-1/phase-1.md`（真因仮説・AC）
- `outputs/phase-2/phase-2.md`（調査 lane / D1・D2・D3 / 状態所有権）
- `apps/api/src/middleware/session-guard.ts`（401/410 判定の所有・読み取り基準）
- `_shared-context.md`（SSOT §3 不変条件 / §7 Phase 構成）

## 統合テスト連携

Phase 4 で本方針を `/me` status × web error code 対応表 / 診断スクリプト I/O / 区別分岐・ログのテスト期待値（RED 観点）へ確定し、Phase 5 の task-01..03 へ展開する。
