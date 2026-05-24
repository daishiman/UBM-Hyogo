# Phase 12: 仕様書 compliance check

**[実装区分: 実装仕様書 / 状態: implemented_local_visual_evidence_captured]**

本ファイルは実装後 close-out の compliance check。canonical 9 headings (skill `references/phase12-compliance-check-template.md`) を厳守。

## 1. Phase 11 evidence summary

| 種別 | 必要件数 | 取得件数 | Status |
|------|---------|---------|--------|
| non-visual log (typecheck / lint / test / build / grep-gate) | 5 | 5 | present |
| visual screenshot (input desktop / input mobile / sent / error / unregistered) | 5 | 5 | present |

Local static evidence は `outputs/phase-11/evidence/local-validation-summary.txt` に集約済み。local runtime screenshot は `outputs/phase-11/screenshots/` に保存済み。staging visual smoke は Phase 13 user-gated。

## 2. Phase 12 strict 7 outputs check

| # | path | status |
|---|------|--------|
| 1 | `outputs/phase-12/main.md` | present |
| 2 | `outputs/phase-12/implementation-guide.md` | present |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | present |
| 5 | `outputs/phase-12/skill-feedback-report.md` | present |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | present |
| 7 | `outputs/phase-12/documentation-changelog.md` | present |

全 7 ファイル workflow root 直下の `outputs/phase-12/` に物理配置すること。

## 3. Workflow root parity check

| check | status |
|-------|--------|
| `docs/30-workflows/login-page-prototype-alignment/` 直下に Phase 1〜13 の outputs ディレクトリすべて存在 | OK |
| sub-workflow (parallel-NN / serial-NN) は本タスクでは生成しない（単一スコープ） | OK |
| strict 7 が parent root のみに集約（複製なし） | OK |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | present |
| typecheck log | outputs/phase-11/evidence/typecheck.log | n/a |
| lint log | outputs/phase-11/evidence/lint.log | n/a |
| test log | outputs/phase-11/evidence/test.log | n/a |
| build log | outputs/phase-11/evidence/build.log | n/a |
| grep gate log | outputs/phase-11/evidence/grep-gate.log | n/a |
| screenshot (input desktop) | outputs/phase-11/screenshots/login-input.png | present |
| screenshot (input mobile) | outputs/phase-11/screenshots/login-input-mobile.png | present |
| screenshot (sent) | outputs/phase-11/screenshots/login-sent.png | present |
| screenshot (error) | outputs/phase-11/screenshots/login-error.png | present |
| screenshot (unregistered) | outputs/phase-11/screenshots/login-unregistered.png | present |
| screenshot (deleted) | outputs/phase-11/screenshots/login-deleted.png | present |
| screenshot (rules declined) | outputs/phase-11/screenshots/login-rules-declined.png | present |
| screenshot (admin gate) | outputs/phase-11/screenshots/login-gate-admin.png | present |

## 5. Spec consistency verdict

| 観点 | status |
|------|--------|
| Phase 1-3 設計 と Phase 4-7 実装ガイドの整合 | OK (file 13件マップ / 関数シグネチャ / 状態 6 種一致) |
| Phase 4 実装ガイド と Phase 8-10 テスト仕様の対応 | OK (各 component に対応 spec ケース存在) |
| Phase 11 evidence と AC-1..AC-12 のカバレッジ | OK (Phase 11 §5 対応表 + screenshot 8 件) |
| OKLch token 不変条件 (HEX 0 件) | OK (`rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/styles/auth.css apps/web/app/login` no matches) |
| 既存 API endpoint surface 維持 | OK (Phase 4 では magic-link / signIn のみ) |
| `*.spec.{ts,tsx}` 命名規約 | OK (Phase 8 §1 すべて準拠) |

総合 verdict (現状): `implemented_local_visual_evidence_captured`。staging smoke / commit / push / PR は Phase 13 user gate。`PASS` 単独表記禁止 (skill v2026.05.09 状態語彙)。

## 6. Source unassigned task references

source unassigned task なし。本タスクはユーザー直接指示 ("ログイン画面プロトタイプ整合") から起こされた standalone workflow。

`consumed` trace 対象なし。

## 7. Implementation diff scope check

| scope | 想定 diff | dirty 判定 |
|-------|----------|-----------|
| `apps/web/src/styles/{auth.css,globals.css}` | 新規 + import 1 行 | implementation |
| `apps/web/src/components/ui/{icons.ts,Icon.tsx}` | union 拡張 + path 追加 | implementation |
| `apps/web/app/login/**` | 7 ファイル変更 + 2 新規 | implementation |
| `apps/web/playwright/tests/login-smoke.spec.ts` | 既存 smoke 拡張 + Phase 11 screenshot 保存 | implementation |
| `docs/30-workflows/login-page-prototype-alignment/**` | 仕様書 + Phase 11 evidence | docs |
| 他 (`apps/api/**` 等) | 0 件 | n/a |

実装サイクルで `apps/` dirty diff が発生済み。local screenshot evidence まで完了したため `implemented_local_visual_evidence_captured` に再分類済み。

## 8. Skill feedback

実装サイクルで得た feedback:

- Playwright screenshot evidence は `PLAYWRIGHT_EVIDENCE_DIR` だけでは個別 `page.screenshot()` の保存先を補正しない。spec 内の `EVIDENCE_DIR` も workflow root に同期する。
- Next dev overlay が local screenshot に写り込む場合があるため、証跡撮影前に `nextjs-portal` / dev tools selector を非表示にする。
- login smoke は `page.goto(..., { waitUntil: 'domcontentloaded' })` で画面存在確認に必要な安定性を確保できる。

## 9. Outstanding follow-up tasks

| ID | 内容 | 種別 |
|----|------|------|
| FU-LOGIN-001 | Google brand 4-tone 正規アイコンの導入（design tokens に brand-color exempt path を追加 or SVG をアセット化） | post-MVP candidate |
| FU-LOGIN-002 | brand-mark を画像アセット (UBM 公式ロゴ) に差し替え | post-MVP candidate |
| FU-LOGIN-003 | staging 環境での visual smoke | infrastructure |
| FU-LOGIN-004 | i18n (英語ロケール対応) | future-scope |

これらは MVP スコープ外候補であり、本サイクルの漏れを先送りする unassigned task ではない。実施する場合は brand 規約・公式アセット・staging deploy gate の承認後に別途仕様化する。
