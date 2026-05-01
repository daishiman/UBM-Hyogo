# ut-06b-profile-logged-in-visual-evidence — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-06b-profile-logged-in-visual-evidence |
| ディレクトリ | docs/30-workflows/ut-06b-profile-logged-in-visual-evidence |
| Issue | #278 |
| 親タスク | 06b-parallel-member-login-and-profile-pages |
| Wave | 6 (follow-up) |
| 実行種別 | sequential (single-task close-out) |
| 作成日 | 2026-04-30 |
| 担当 | qa-visual-evidence |
| 状態 | spec_created |
| タスク種別 | implementation / VISUAL |

## purpose

06b `/profile` の logged-in visual evidence（M-08〜M-10、M-14〜M-16）を取得し、不変条件 #4 / #5 / #8 / #11 を人の目で恒久確認する。2026-04-29 review 時点では `/login` 5 状態 screenshot と未ログイン redirect curl は取得済みだが、実 session / API fixture が未準備のため `/profile` logged-in screenshot は **未取得（pending）** であり、本タスクで closure する。

## scope in / out

### scope in

- `outputs/phase-11/evidence/screenshot/M-08-profile.png` 取得（logged-in `/profile` 表示確認）
- `outputs/phase-11/evidence/screenshot/M-09-no-form.png` 取得（form / input / textarea / submit button が 0 件であることを DevTools で証跡化）
- `outputs/phase-11/evidence/screenshot/M-10-edit-query-ignored.png` 取得（`/profile?edit=true` でも read-only 維持）
- staging deploy 後の M-14〜M-16 screenshot / 補助 DevTools evidence 取得
- `manual-smoke-evidence.md` の該当行 `pending` → `captured` 更新
- session 確立手順（local fixture / staging）と `/me` `/me/profile` モック・実データ確保手順
- 不変条件 #4 / #5 / #8 / #11 の visual 観測ガイド

### scope out

- `/profile` route の実装変更（既に 06b で完了済）
- `/me` `/me/profile` API 実装変更（04b で完了済）
- session 機構（Auth.js / magic link）の実装変更（05a/05b で完了済）
- E2E 自動化（08b の責務、本タスクは manual smoke のみ）
- production deploy（09a/09b の責務）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04b `/me` `/me/profile` API | logged-in 表示に必要なデータ供給 |
| 上流 | 05a/05b session 機構 | local / staging で session 確立可能 |
| 上流 | 06b `/profile` page 実装 | 観測対象の UI そのもの |
| 上流 | 06b 既存 `manual-smoke-evidence.md` | M-08〜M-16 行の存在 |
| external gate | 09a staging deploy smoke | M-14〜M-16 は staging deploy 後でないと completed 化不可 |
| 並列 | UT-06B-MAGIC-LINK-RETRY-AFTER / UT-06B-NEXT-PROXY-MIGRATION | 06b follow-up 群（独立）|

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | `/profile` 仕様（read-only 境界） |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | session / AuthGateState |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #4 / #5 / #8 / #11 |
| legacy summary | docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md | 旧単票。正本は本 workflow root |
| 必須 | docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/ | 親 workflow（M-XX 行所在） |
| 参考 | docs/00-getting-started-manual/specs/02-auth.md | 認証設計 |

## AC（Acceptance Criteria）

- AC-1: `outputs/phase-11/evidence/screenshot/M-08-profile.png` が取得され、logged-in 表示の主要要素（プロフィール表示・read-only 表記）が画面に存在することを目視可能
- AC-2: `outputs/phase-11/evidence/screenshot/M-09-no-form.png` が取得され、DevTools で `document.querySelectorAll('form, input, textarea, button[type=submit]').length === 0` の出力が同 png に同梱（または `M-09-no-form.devtools.txt` に保存）
- AC-3: `outputs/phase-11/evidence/screenshot/M-10-edit-query-ignored.png` が取得され、`/profile?edit=true` でも form/input/textarea/submit が 0 件である DevTools 出力を同梱
- AC-4: staging deploy 後に M-14〜M-16 の screenshot と必要な補助 DevTools evidence が `outputs/phase-11/evidence/screenshot/` に取得済み
- AC-5: `manual-smoke-evidence.md` の該当行（M-08〜M-10、M-14〜M-16）が `pending` から `captured` に更新済み
- AC-6: 不変条件 #4 / #5 / #8 / #11 が evidence 上で人の目で確認できる（observation ノート付）
- AC-7: 取得手順が `outputs/phase-05/runbook.md` に再現可能な形で記述され、Auth token / 機密値が evidence 内に**含まれない**ことが secret-hygiene check で確認済み

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（local vs staging 取得順）と AC-1〜7 確定 |
| 2 | 設計 | phase-02.md | session 確立フロー、screenshot 取得チェーン、DevTools snippet、evidence 命名規約 |
| 3 | 設計レビュー | phase-03.md | alternative 3 案（local fixture / staging only / Playwright trace）、PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | manual smoke matrix、evidence チェックリスト、不変条件 → 観測項目マッピング |
| 5 | 実装ランブック | phase-05.md | session 確立 + screenshot 取得 + DevTools 実行 runbook（secret hygiene 含む） |
| 6 | 異常系検証 | phase-06.md | session 不成立 / API 500 / `?edit=true` で form 出現 / production secret 漏洩などの failure case |
| 7 | AC マトリクス | phase-07.md | AC × evidence 成果物 × 不変条件のトレース |
| 8 | DRY 化 | phase-08.md | DevTools snippet と命名規約の helper 化（runbook 内集約） |
| 9 | 品質保証 | phase-09.md | secret hygiene（token 非記録）、a11y（read-only ラベル）、無料枠（staging session 単発） |
| 10 | 最終レビュー | phase-10.md | GO / NO-GO（依存 04b/05a/05b/06b の AC 充足確認） |
| 11 | 手動 smoke | phase-11.md | 実 evidence 取得（VISUAL）と `manual-smoke-evidence.md` 更新 |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update-summary / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/session-flow.mmd
outputs/phase-02/evidence-naming.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/evidence-checklist.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-05/devtools-snippets.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/screenshot/M-08-profile.png
outputs/phase-11/evidence/screenshot/M-09-no-form.png
outputs/phase-11/evidence/screenshot/M-09-no-form.devtools.txt
outputs/phase-11/evidence/screenshot/M-10-edit-query-ignored.png
outputs/phase-11/evidence/screenshot/M-10-edit-query-ignored.devtools.txt
outputs/phase-11/evidence/screenshot/M-14-staging-profile.png
outputs/phase-11/evidence/screenshot/M-15-edit-cta.png
outputs/phase-11/evidence/screenshot/M-16-localstorage-ignored.png
outputs/phase-11/evidence/screenshot/M-16-localstorage-ignored.devtools.txt
outputs/phase-11/evidence/manual-smoke-evidence-update.diff
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| ブラウザ | Chromium / DevTools console | local & staging | screenshot + querySelectorAll 観測 |
| session | Auth.js magic link | local fixture or staging | token 値は evidence に**残さない** |
| API | `/me`, `/me/profile` | apps/api | 04b 既存 |
| Secrets | （新規導入なし） | — | session token は揮発、evidence からマスク |

## invariants touched

- **#4** session 必須（logged-in でのみ `/profile` を表示できる）
- **#5** 公開 / 会員 / 管理 3 層分離（member 層境界の人目確認）
- **#8** read-only 境界（form / input / textarea / submit が 0 件）
- **#11** 管理者・本人含め本文直接編集なし（`?edit=true` でも form 不出現）

## completion definition

- Phase 1〜10 が completed、Phase 11 で AC-1〜6 の evidence 取得済み。M-14〜M-16 が未取得の場合は partial で、root completed 不可
- AC-1〜7 が Phase 7 マトリクスで完全トレース
- 4 条件評価（価値 / 実現 / 整合 / 運用）が Phase 1 / Phase 12 で整合
- 不変条件 #4 / #5 / #8 / #11 が evidence 上で観測済み
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| planned | 本 workflow と runbook が作成済み、実 evidence 未取得 | 不可 |
| ready | local / staging session と `/me` `/me/profile` データが利用可能 | 不可 |
| captured | M-08〜M-10 と M-14〜M-16 の screenshot / DevTools txt / diff が全て存在 | Phase 11 完了可 |
| partial | local または staging の一部 evidence のみ存在。特に 09a gate 未達で M-14〜M-16 不在 | root completed 不可。必要に応じて staging follow-up を materialize |
| completed | captured evidence、Phase 12 same-wave sync、Phase 13 user approval gate が全て完了 | 可 |
