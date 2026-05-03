# Phase 7: AC マトリクス — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 7 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Phase 1〜6 を統合し、AC × evidence path × 検証手段 × DoD を 1 表に集約する。これが本タスクの単一の真実とする。

## AC × Evidence マトリクス

| AC ID | 内容 | evidence path | 検証手段 | DoD |
| --- | --- | --- | --- | --- |
| M-08 | logged-in `/profile` の screenshot（desktop / mobile） | `outputs/phase-11/screenshots/M-08-desktop-{date}.png` `M-08-mobile-{date}.png` | Playwright `page.screenshot()` after `maskPII` | 2 viewport × 1 ファイル / 計 2 ファイル存在、PII redacted |
| M-09 | 編集 form/input/textarea/submit が 0 件 | `outputs/phase-11/dom/M-09-no-form-{desktop,mobile}.json` | Playwright `page.evaluate` + assert all counts === 0 | counts JSON が `{form:0,input:0,textarea:0,submit:0,editLink:0}` |
| M-10 | `/profile?edit=true` でも read-only 維持 | `outputs/phase-11/dom/M-10-edit-query-ignored-{desktop,mobile}.json` + `outputs/phase-11/screenshots/M-10-desktop-{date}.png` | Playwright で `?edit=true` 付きで再アクセス → 同 counts assert | M-09 と同等の counts、screenshot 保存 |
| M-14 | staging Magic Link → /profile 一連 | `outputs/phase-11/screenshots/M-14-flow-{date}.png` | manual + Playwright `--headed` | 1 枚以上、redaction 済 |
| M-15 | staging Google OAuth → /profile | `outputs/phase-11/screenshots/M-15-flow-{date}.png` | manual + Playwright `--headed` | 1 枚以上、redaction 済 |
| M-16 | logout 後 `/profile` が `/login` に redirect | `outputs/phase-11/screenshots/M-16-redirect-{date}.png` | Playwright で sign-out → goto `/profile` → `expect(page.url()).toMatch(/\/login/)` | screenshot + assert PASS |
| AC-S1 | manual-smoke-evidence 該当行が captured 化 | `outputs/phase-11/manual-smoke-evidence.md` | git diff 確認 | placeholder → captured 行が 6 行（M-08〜10 / M-14〜16） |
| AC-S2 | invariant #4 / #5 / #8 / #11 を実画面で実測 | 上記 evidence 群 | DoD 横串 | 4 不変条件すべて assertion or screenshot で記録 |
| AC-S3 | アプリ本体（apps/web/app/profile, apps/api）に変更なし | `git diff main...HEAD --name-only` | grep | 0 件 |
| E-05〜E-07（異常系） | invariant 違反検出時のエスカレーション経路 | `outputs/phase-12/unassigned-task-detection.md` | Phase 6 復旧 runbook | 違反発生時のみ任意、未発生で OK |

## 検証コマンド ↔ AC 対応

| コマンド | カバー AC |
| --- | --- |
| `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging playwright/tests/profile-readonly.spec.ts` | M-08 / M-09 / M-10 / M-16 |
| `bash scripts/capture-profile-evidence.sh ... --markers M-14,M-15` (headed manual) | M-14 / M-15 |
| `git diff outputs/phase-11/manual-smoke-evidence.md` | AC-S1 |
| `git diff main...HEAD --name-only \| rg 'apps/(web/app/profile\|api)'` | AC-S3 |

## サブタスク管理

- [ ] AC × evidence マトリクス確定
- [ ] 検証コマンド ↔ AC マッピング確定
- [ ] outputs/phase-07/main.md にマトリクス転記

## 成果物

| 成果物 | パス |
| --- | --- |
| AC マトリクス | `outputs/phase-07/main.md` |

## 完了条件

- [ ] M-08〜M-10 / M-14〜M-16 / AC-S1〜AC-S3 が表に揃っている
- [ ] 各 AC が evidence path と検証コマンドにマップされている

## タスク100%実行確認

- [ ] AC が抜け落ちていない
- [ ] DoD 列が「主観表現」ではなく「ファイル数 / counts === 0 等の機械検証可能な式」になっている

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスを引き渡す。
