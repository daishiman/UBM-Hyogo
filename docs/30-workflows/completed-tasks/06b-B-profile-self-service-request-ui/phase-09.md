# Phase 9: 品質保証 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 9 / 13 |
| wave | 06b-fu |
| mode | parallel（実依存は serial: 06b-A → 06b-B → 06b-C） |
| 作成日 | 2026-05-02 |
| taskType | feature（UI 実装スペック） |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

typecheck / lint / unit / integration / e2e / a11y(axe) / coverage 80% / Lighthouse / security review の各 gate を本タスク固有の対象範囲で定義し、合格基準・実行コマンド・evidence 保存先を確定する。
未実測 / 未実装を PASS として扱わない gate 運用を明文化する。

## 実行タスク

1. 各品質 gate の対象範囲（本タスクで触る web component / helper / e2e spec）と合格基準を確定する。完了条件: gate ごとに対象パスと閾値が記録される。
2. 実行コマンド（`mise exec --` 経由）と evidence 保存先を確定する。完了条件: 全 gate のコマンドが手で再現可能になっている。
3. Lighthouse / Web Vitals 対象画面と閾値の要否を判定する。完了条件: 対象画面と閾値、または「対象外」の根拠が記録される。
4. security review（XSS / CSRF / PII）の点検観点を確定する。完了条件: 各観点に対する対策と evidence が紐付く。
5. evidence list と保存先を一覧化する。完了条件: 全 gate の evidence path が `outputs/phase-09/` 配下で確定する。
6. gate 不合格時の戻り先（Phase 4 / Phase 5 / Phase 6 / Phase 8）を記録する。完了条件: 戻り先決定木が存在する。

## 参照資料

| 資料名 | パス | 用途 |
| --- | --- | --- |
| Phase 4 テスト戦略 | `outputs/phase-04/main.md` | テスト ID と coverage 範囲 |
| Phase 7 AC マトリクス | `outputs/phase-07/main.md` | gate と AC の対応 |
| Phase 8 DRY 化 | `outputs/phase-08/main.md` | 回帰対象 |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 強制経路 |
| quality-gates | `.claude/skills/task-specification-creator/references/quality-gates.md` | PII redact / Secrets vs Variables |
| CLAUDE.md シークレット管理 | `CLAUDE.md` | Cloudflare Secrets / GitHub Variables 区分 |

## 実行手順

### 1. 品質 gate 一覧と本タスク固有対象

| gate | 対象範囲 | 合格基準 | 実行コマンド | evidence |
| --- | --- | --- | --- | --- |
| typecheck | repo 全体 + 特に `apps/web/{app/profile,src/lib/api}` | 緑（0 error） | `mise exec -- pnpm typecheck` | `outputs/phase-09/typecheck.log` |
| lint | 同上 | 緑（0 error / 0 warn-as-error） | `mise exec -- pnpm lint` | `outputs/phase-09/lint.log` |
| unit | `apps/web` 内 `me-requests.test.ts` / `VisibilityRequestDialog.test.tsx` / `DeleteRequestDialog.test.tsx` / `RequestActionPanel.test.tsx` / `RequestErrorMessage.test.tsx` | 全テスト緑、union 全網羅 | `mise exec -- pnpm --filter @ubm/web test -- me-requests Request` | `outputs/phase-09/unit.log` |
| coverage | 上記 unit 対象ファイル | line / branch / function / statement すべて 80%+ | `mise exec -- pnpm --filter @ubm/web test:coverage` | `outputs/phase-09/coverage.json` / `outputs/phase-09/coverage-summary.txt` |
| integration | `apps/api` 既存 `/me/visibility-request` `/me/delete-request` route test（実装済み）の retest | 100% 緑 | `mise exec -- pnpm --filter @ubm/api test -- me/index` | `outputs/phase-09/integration.log` |
| e2e | `e2e/profile.visibility-request.spec.ts` / `e2e/profile.delete-request.spec.ts` / `e2e/profile.a11y.spec.ts` | 正常系 100% / 異常系 80%+ | `mise exec -- pnpm --filter @ubm/web test:e2e -- profile.visibility-request profile.delete-request profile.a11y` | `outputs/phase-09/e2e.log` |
| a11y (axe) | `/profile` の dialog open / closed / error 状態 | serious 以上の violation 0 件 | `mise exec -- pnpm --filter @ubm/web test:e2e -- profile.a11y` | `outputs/phase-09/axe-report.json` |
| static grep（#4 本文編集禁止） | `apps/web/app/profile/_components/Request*.tsx` | 0 hit | `rg -n 'name="(displayName\|email\|kana\|phone\|address)"' apps/web/app/profile/_components/Request*.tsx` | `outputs/phase-09/lint-grep-no-body-edit.txt` |
| static grep（#5 D1 直接禁止） | `apps/web/` 配下全域 | 0 hit | `rg -n 'cloudflare:d1\|D1Database' apps/web/` | `outputs/phase-09/lint-grep-no-d1.txt` |
| static grep（#11 self-service 境界） | `apps/web/src/lib/api/me-requests.ts` | `/me/visibility-request` / `/me/delete-request` の 2 path のみ | `rg -n 'fetchAuthed\("/me/' apps/web/src/lib/api/me-requests.ts` | `outputs/phase-09/lint-grep-self-service.txt` |
| static grep（#7 responseId 漏洩） | `apps/web/app/profile/_components/Request*.tsx` | 0 hit | `rg -n 'responseId' apps/web/app/profile/_components/Request*.tsx` | `outputs/phase-09/lint-grep-no-responseid.txt` |

### 2. Lighthouse / Web Vitals

| 対象画面 | 計測必要性 | 閾値 |
| --- | --- | --- |
| `/profile`（dialog 閉じ） | 推奨（既存タスク 06b の baseline 維持） | Performance 80+ / Accessibility 95+ / Best Practices 90+ / SEO 対象外（authenticated 画面） |
| `/profile`（dialog 開き） | 任意 | Performance 計測対象外（client only state 変化）/ Accessibility 95+ |

- 実行: `mise exec -- pnpm --filter @ubm/web test:e2e -- profile.lighthouse`（既存 task 06b に lighthouse spec があれば共通化、無ければ Phase 11 手動 evidence で代替）
- 本タスクで新規導入はせず、06b baseline と同等であることのみ確認（**MINOR で計測未実施でも GO 可**。理由: dialog 追加は client side 描画のみで Server レンダリングには影響しない）

### 3. security review

#### 3.1 XSS

| 観点 | 対策 | evidence |
| --- | --- | --- |
| dialog 内 reason 表示 | React の text node のみで描画。`dangerouslySetInnerHTML` 不使用 | `rg -n 'dangerouslySetInnerHTML' apps/web/app/profile/_components/Request*.tsx` → 0 hit を `outputs/phase-09/lint-grep-no-dangerous-html.txt` に保存 |
| エラーメッセージ表示 | 辞書の固定文言のみ。API レスポンスの自由文を画面に出さない | `RequestErrorMessage.test.tsx::no-server-message-rendered` |
| reason の最大長 | client zod で 500 字制限（API zod と同一）| unit `me-requests.test.ts::reason-max-length` |

#### 3.2 CSRF

- Auth.js cookie ベースの既存 session（`session-token`）を `fetchAuthed` 経由で送信
- 既存 API middleware の `sessionGuard` + same-site cookie + Origin チェックで担保（API 側既実装）
- 本タスクでは新規 cookie / state を導入しない。CSRF token を独自に追加しない（既存方針継承）
- evidence: `outputs/phase-09/security-review.md` に「既存 Auth.js cookie 体制を継承し新規 token を発行しない」旨を記録

#### 3.3 PII

| 観点 | 対策 | evidence |
| --- | --- | --- |
| 退会申請の reason 自由記述に PII（メール / 電話 / 住所）が混入する可能性 | UI 上の placeholder で「個人情報を含めないでください」と明示。500 字制限を保持。API 側はそのまま admin queue に保存し公開しない | placeholder 文言の SS / `outputs/phase-11/screenshots/delete-step1.png` |
| ログ / metrics に reason / email / responseId が出ない | API 側は WAE に reason を載せない（既実装）。client は console.log / Sentry breadcrumbs に reason を載せない | `rg -n 'console\.(log\|info\|debug)' apps/web/app/profile/_components/Request*.tsx` 確認、`outputs/phase-09/lint-grep-no-console-pii.txt` |
| 申請 type だけが分析に流れる | `requestVisibilityChange` / `requestDelete` の成功時 telemetry は `{ type, status }` のみ。`queueId` は hash 化または送らない | `me-requests.test.ts::telemetry-no-pii` |
| Secrets vs Variables 確認 | quality-gates.md の表に従い、`AUTH_SECRET` / `AUTHJS_SESSION_SECRET` 等が Cloudflare Secrets に格納されていること、本タスクで新規 secret を追加しないこと | `outputs/phase-09/security-review.md` に明記 |

### 4. evidence list（`outputs/phase-09/` 保存先）

| ファイル | 内容 |
| --- | --- |
| `typecheck.log` | typecheck 出力 |
| `lint.log` | lint 出力 |
| `unit.log` | unit テスト出力 |
| `coverage.json` / `coverage-summary.txt` | coverage レポート |
| `integration.log` | API integration 再実行ログ |
| `e2e.log` | E2E 出力 |
| `axe-report.json` | axe a11y レポート |
| `lint-grep-no-body-edit.txt` | 不変条件 #4 grep 結果（0 hit） |
| `lint-grep-no-d1.txt` | 不変条件 #5 grep 結果（0 hit） |
| `lint-grep-self-service.txt` | 不変条件 #11 grep 結果 |
| `lint-grep-no-responseid.txt` | 不変条件 #7 grep 結果（0 hit） |
| `lint-grep-no-dangerous-html.txt` | XSS grep 結果（0 hit） |
| `lint-grep-no-console-pii.txt` | PII redact grep 結果 |
| `security-review.md` | XSS / CSRF / PII / Secrets vs Variables の点検記録 |
| `quality-report.md` | 全 gate の集計と判定（PASS / MINOR / MAJOR） |

### 5. gate 不合格時の戻り先

| 不合格 gate | 戻り先 | 理由 |
| --- | --- | --- |
| typecheck / lint | Phase 5（実装） | 実装起因 |
| unit | Phase 6（テスト追加 / 修正） | テスト起因 |
| coverage 未達 | Phase 6 | テスト追加 |
| integration / e2e | Phase 5 / Phase 6 | 実装か fixture |
| a11y axe serious+ | Phase 2 設計 | 構造起因（role / aria 設計） |
| static grep 1+ hit | Phase 5（即修正） / Phase 2（設計起因なら戻る） | 構造または実装 |
| security review | Phase 2 / Phase 5 | 設計または実装 |
| Lighthouse | MINOR として記録、Phase 12 follow-up | 既存 baseline 同等で許容 |

## 統合テスト連携

| 判定項目 | 基準 | 確認 |
| --- | --- | --- |
| ユニット line / branch | 80% / 80% | `coverage.json` |
| 結合（既存 /me） | 100% | `integration.log` |
| E2E 正常系 | 100% | `e2e.log` |
| E2E 異常系 | 80%+ | `e2e.log` |
| static grep | 0 hit（#4 / #5 / #7） | `lint-grep-*.txt` |
| axe | serious+ 0 件 | `axe-report.json` |

- 上流: Phase 7 AC マトリクス / Phase 8 DRY 化
- 下流: Phase 10 最終レビュー / Phase 11 evidence 取得（手動 smoke）

## 多角的チェック観点

- 全 gate に実行コマンドと evidence path が紐付いているか
- 未実装 / 未実測の gate を PASS にしていないか
- Lighthouse の MINOR 許容理由（dialog 追加が SSR に影響しない）が記録されているか
- PII redact チェックが reason / email / queueId / responseId を網羅しているか
- Secrets vs Variables 区分が CLAUDE.md / quality-gates.md と整合しているか
- gate 不合格時の戻り先が決定論的に記録されているか
- 不変条件 #4 / #5 / #7 / #11 の static grep gate がすべて 0 hit を gate にしているか

## サブタスク管理

- [ ] 品質 gate 一覧表（typecheck / lint / unit / integration / e2e / a11y / coverage / static grep）を完成
- [ ] Lighthouse 対象 / 対象外の判定を記録
- [ ] security review（XSS / CSRF / PII / Secrets vs Variables）を完成
- [ ] evidence list を `outputs/phase-09/` 配下のファイル名で固定
- [ ] gate 不合格時の戻り先決定木を記録
- [ ] `outputs/phase-09/main.md` を作成

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 品質 gate 定義書 | `outputs/phase-09/main.md` | 全 gate の対象 / 閾値 / コマンド / evidence / 戻り先 |
| security review 雛形 | `outputs/phase-09/security-review.md`（実行時生成） | XSS / CSRF / PII / Secrets vs Variables の点検記録 |
| 品質レポート雛形 | `outputs/phase-09/quality-report.md`（実行時生成） | 全 gate の集計と判定 |

## 完了条件

- [ ] 品質 gate 一覧が typecheck / lint / unit / coverage / integration / e2e / a11y / static grep 4 種で網羅されている
- [ ] 全 gate の `mise exec --` 経由実行コマンドが明記されている
- [ ] coverage 80% 強制経路が明記されている（line / branch / function / statement）
- [ ] Lighthouse の対象 / MINOR 許容判定が記録されている
- [ ] security review（XSS / CSRF / PII / Secrets vs Variables）が独立セクションで記述されている
- [ ] evidence list が `outputs/phase-09/` 配下のファイル名で確定している
- [ ] gate 不合格時の戻り先決定木が記録されている
- [ ] 本 Phase 内の全タスクを 100% 実行完了

## タスク 100% 実行確認【必須】

- [ ] 未実測 / 未実装を PASS として扱う記述が無い
- [ ] PII redact の対象が reason / email / queueId / responseId / metrics_json を網羅している
- [ ] Secrets vs Variables の使い分けが quality-gates.md と整合している
- [ ] 不変条件 #4 / #5 / #7 / #11 が static grep gate で構造的に守られている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 最終レビューゲートへ、AC マトリクス（Phase 7）/ DRY 結果（Phase 8）/ 全 gate 判定（本 Phase）/ evidence path 一覧 / 戻り先決定木を渡す。
