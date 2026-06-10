# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| taskType | VISUAL |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

AC-1〜AC-8 の充足を、各 AC を担保するタスク・テスト・検査・調査手順と対応付けて最終確認し、blocker の有無を判定する。本サイクルは `implemented_local_evidence_captured`（仕様書作成段階）のため、判定列は「実装/調査時に満たすべき条件」と「充足エビデンス（実行時に取得・pending）」を分離して記録する。AC-1 / AC-2 は staging 実機調査で確定する性質のため、本 Phase では「確定手段が Phase 11 に定義されていること」を充足条件とする。

## 実行タスク

### 10.1 AC 充足チェック表

| AC | 内容（要約） | 担保タスク / 手段 | 充足エビデンス | 判定（implemented_local_evidence_captured） |
|----|--------------|------------------|----------------|------|
| AC-1 | staging 実機で `/me` HTTP status と web error code を確定し H1〜H5 のいずれかへ収束した結論を `phase-11/manual-test-result.md` に根拠付き記録 | Phase 11 手動テスト（DevTools Network / 診断スクリプト / D1 read-only） | MT-A（status 確定）/ MT-D（H 収束判定） | pending（staging 実機・user-gated。確定手段は Phase 11 に定義済） |
| AC-2 | 管理者（万壽本大嗣・管理者）が member identity/status を保持するか、resolver が staging で cookie を解決できるかを read-only 確認し、管理者 `/profile` の期待挙動を結論化 | Phase 11 手動テスト（D1 read-only `member_status` / resolver 応答確認） | MT-C（D1 read-only）/ MT-D（結論） | pending（同上） |
| AC-3 | `/profile` エラー分岐が `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` を区別し原因コードを `data-*`/ログで可視化。401→redirect・404→再ログイン CTA は回帰なし | T01 | PF-1〜PF-5（page）/ SE-1〜SE-4（SectionError） | pending（PASS・NO-GO 対象=401/404 回帰） |
| AC-4 | `/me` 取得失敗時に server-side で `status`/`code`/`path` を構造化ログ出力（memberId 非露出・技術文字列を画面非露出） | T02 | SF-1〜SF-4（safe-fetch） | pending（PASS） |
| AC-5 | 診断スクリプト `scripts/diagnose-profile-session.sh`（read-only・冪等）が存在し、`/me` status 確認・env/secret parity・deploy 版数確認を 1 本で再現 | T03 | Phase 11 MT-B（スクリプト実行） | PASS（script present; staging execution user-gated） |
| AC-6 | `/me` shape・path・status 体系、D1 schema、Google Form 仕様、認証境界（fail-closed）を一切変更しない（**apps/api 非接触**） | T01/T02/T03 | Q-4（apps/api diff 空）/ §9.4 | PASS（apps/api diff empty） |
| AC-7 | 区別分岐・ログ・診断の挙動を `*.spec.{ts,tsx}` で固定し typecheck/lint/対象 vitest 全 PASS | T01/T02/T03 | L-1 / L-2 / L-3a〜L-3c（Phase 9） | pending（PASS） |
| AC-8 | 真因確定後に必要な本格修正を Phase 12 で未タスク化し配置先・実施時期・依存を明記（0 件にしない） | Phase 12 unassigned-task-detection | current 4 件 formalize（410/5xx/transport/管理者 UX） | **充足（本 Phase で確認）** implemented_local_evidence_captured で確定可能 |

### 10.2 blocker 判定

| 観点 | blocker か | 根拠 |
|------|-----------|------|
| 調査の網羅性（AC-1/AC-2） | 非 blocker | H1〜H6 マトリクスで症状（非404・非redirect）から候補を H3/H4/H5 へ絞り込み済。確定手段（status 確認 / D1 read-only / 診断スクリプト）が Phase 11 に定義済 |
| 観測性変更の実現性（AC-3/AC-4） | 非 blocker | 既存 `SectionError` props 拡張 + `safe-fetch.ts` 既存 `normalizeError` へのログ挿入のみ。新規 primitive・新規 endpoint なし |
| AC-6（apps/api 非接触・NO-GO 条件） | 実装時に要厳格確認 | API surface を変更すれば blocker。Q-4（diff 空）/ §9.4 で検知し、崩れた場合は該当変更を revert |
| AC-3 の 401/404 回帰（NO-GO 条件） | 実装時に要厳格確認 | 401→redirect・404→再ログイン CTA が崩れたら blocker。PF-3/PF-4 で検知 |
| 本格修正の合意未済（CONST_007 例外①） | 非 blocker | 真因確定まで方針を決められないため Phase 12 で未タスク化（先送りでなく仕様分岐の合意待ち）。current 4 件で 0 件回避 |

判定: **blocker なし**。実装/調査着手後は AC-6（apps/api 非接触）と AC-3 の 401/404 回帰を最優先で監視し、L-1〜L-3 全 PASS かつ Q-1〜Q-5 違反 0 をもって AC-7 充足、Phase 11 の真因収束で AC-1/AC-2 充足とする。

### 10.3 MINOR 追跡テーブル

| ID | MINOR 指摘 | 区分 | 追跡 |
|----|-----------|------|------|
| — | （Phase 3-10 で blocker 未満の MINOR 指摘） | N/A | **0 件**。設計レビュー（Phase 3）の不変条件評価は全 PASS。観測性変更は既存 primitive 拡張に留まり代替案の不採用理由も確定済のため、MINOR として残る指摘は検出されない。本格修正（410/5xx/transport/管理者 UX）は MINOR ではなく Phase 12 で current 未タスクとして formalize する（§10.1 AC-8） |

> MINOR 0 件の理由を N/A 行として残す（空欄にしない）。

### 10.4 VISUAL エビデンス取扱い

- T01 は `/profile` のエラーバナー表示（区別文言 + `data-*` 原因コード可視化）を変更する（VISUAL_ON_EXECUTION）。
- 現象 screenshot は**ユーザー提供済み**（staging `/profile` の「時間をおいて再読み込み」バナー）。Phase 11 で文中参照する。
- 診断後の static UI contract screenshot（410/5xx/FAILED 区別バナー）は実装時に取得する計画。staging 認証 runtime screenshot は認証必須のため user-gated。
- ローカルでの描画担保は PF-1〜PF-5 / SE-1〜SE-4（jsdom render）で代替する。

## 完了条件

- [x] AC-1〜AC-8 を担保タスク・手段・充足エビデンスと対応付け（pending / 充足を分離）
- [x] blocker 判定（blocker なし）と NO-GO 監視対象（AC-6 apps/api 非接触 / AC-3 401・404 回帰）を明示
- [x] MINOR 追跡テーブルを設置し 0 件の N/A 理由を記載
- [x] VISUAL エビデンスの現象 screenshot（ユーザー提供）/ 診断後 static / staging runtime user-gated の三段取扱いを記録

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | AC-2 / AC-3 の 401/410 境界根拠 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | AC-6 の shape / path 不変基準 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 境界（AC-2 解決根拠） |

- `_shared-context.md` §2（H1-H6）/ §4（AC-1〜8 正本）
- `outputs/phase-6/phase-6.md`（テストケース）
- `outputs/phase-9/phase-9.md`（L-1〜L-3 / Q-1〜Q-5 / apps/api 非接触）

## 統合テスト連携

AC-1 / AC-2（真因収束）を担保する Phase 11 の手動テスト（DevTools Network status / 診断スクリプト / D1 read-only）が調査結論の正本。AC-3〜AC-7 の自動テスト PASS と合わせ、Phase 12 で実装ガイド・SSOT 同期・未タスク化（AC-8）・compliance へ引き継ぐ。
