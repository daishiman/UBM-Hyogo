# Phase 12: 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-09c-production-deploy-execution-001 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback |
| Wave | 9 |
| Mode | serial（最終 / execution-only） |
| 作成日 | 2026-05-02 |
| 前 Phase | 11 (24h post-release 検証 + 共有) |
| 次 Phase | 13 (PR 作成 / `Refs #353`) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval | REQUIRED（Phase 10 までで取得済み承認の継続管理） |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ |
| 必須ファイル数 | **7 ファイル**（task-specification-creator skill 仕様） |

## 目的

Phase 1-11 で固定した execution evidence（user approval / preflight / D1 migration / deploy / release tag / smoke / GO/NO-GO / 24h post-release）を、**中学生にも分かる Part 1 + 技術者向け Part 2 の implementation-guide** を含む 7 ドキュメント一式に閉じ、正本仕様（`docs/00-getting-started-manual/specs/`）への影響と更新箇所を可視化する。さらに **未タスク検出（0 件でも出力必須）** と **skill feedback（改善点なしでも出力必須）** を実施し、親 09c で発生した「docs-only 仕様作成 PR と production 実行手順の同一 lifecycle 混在」が本タスクで分離された記録を明示する。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] 「production deploy とは何か」を **電車のダイヤ改正** の例え話で説明（時刻表 = 仕様、車両 = アプリ、運行開始 = deploy、試運転 = staging、本番運行 = production、運休 = rollback）
- [ ] **専門用語セルフチェック表** を 5 用語以上掲載（例: deploy / migration / rollback / release tag / runbook / incident / canary / Worker / D1 / Pages）
- [ ] 困りごと（旧版が動き続けると新機能が使えない）と解決後の状態（新版が安全に切替わる）を最初に書く
- [ ] 24h 観測の意味（運行直後はトラブルが起きやすいので一定時間見守る）を例え話で

### Part 2: 開発者・技術者レベル

- [ ] 全コマンド列（`bash scripts/cf.sh whoami` / `d1 migrations list` / `d1 migrations apply` / `secret list` / `pnpm --filter @ubm/api deploy:production` / `pnpm --filter @ubm/web deploy:production` / `git tag` / `git push --tags` / `bash scripts/cf.sh tail`）を Phase 順に記載
- [ ] rollback 経路 5 種（worker / pages / D1 migration / cron / release tag）の手順 + 検証コマンド
- [ ] 24h verification 手順（Workers Analytics / D1 Metrics / 不変条件 #5 #15 SQL）
- [ ] 設定可能な定数（`PRODUCTION_WEB` / `PRODUCTION_API` / `PRODUCTION_D1` / release tag フォーマット `vYYYYMMDD-HHMM`）

## 実行タスク（Phase 12 必須 7 ファイル）

1. `outputs/phase-12/implementation-guide.md` 作成（Part 1 中学生 + Part 2 技術者）
2. `outputs/phase-12/system-spec-update-summary.md` 作成（正本仕様への影響 / 更新箇所一覧 / Step 1-A/B/C / Step 2 判定）
3. `outputs/phase-12/documentation-changelog.md` 作成（更新履歴）
4. `outputs/phase-12/unassigned-task-detection.md` 作成（**0 件でも出力必須**）
5. `outputs/phase-12/skill-feedback-report.md` 作成（**改善点なしでも出力必須**）
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` 作成（compliance 表 / 不変条件 #1-#15）
7. `outputs/artifacts.json` 不在ケースを root `artifacts.json` 単独正本として確認し、`phase12-task-spec-compliance-check.md` に逐語テンプレで記録

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-01.md ... phase-11.md | 実行 evidence の正本 |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/ | 親 7 ドキュメント（template） |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/skill-feedback-report.md | 親 skill-feedback の指摘事項 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 7 ファイル仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | implementation-guide 構成 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | spec 更新候補（runbook） |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | production deploy / smoke / 24h verification 更新候補 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 24h 無料枠閾値の正本 |

## 実行手順

### ステップ 1: implementation-guide.md（Part 1 + Part 2）

- Part 1: ダイヤ改正例え話 + 専門用語セルフチェック表（最低 5 用語）+ 困りごと/解決後
- Part 2: 全コマンド列 + rollback 5 経路 + 24h verification 手順 + 設定可能定数
- 親 09c の implementation-guide.md を template に、execution-only の実コマンドを反映

### ステップ 2: system-spec-update-summary.md（Step 1-A/B/C + Step 2）

- **Step 1-A: 影響分析** — 正本仕様への影響候補（15-infrastructure-runbook / 08-free-database / 02-auth）
- **Step 1-B: 更新箇所一覧** — file path × section × 提案理由（execution evidence ベース）
- **Step 1-C: 反映方針** — 本タスクで反映する / 別 PR に分離する / spec 化見送り の判定

| 提案 | 対象 spec | 理由 | 反映方針 |
| --- | --- | --- | --- |
| production deploy 実行 13 ステップを runbook 章に正本化 | 15-infrastructure-runbook.md | 実行 evidence ベースで確定 | 別 PR（spec 専用） |
| release tag フォーマット `vYYYYMMDD-HHMM` を正本化 | 15-infrastructure-runbook.md | Phase 8 で確定 | 別 PR |
| 24h post-release verify チェックリスト追加 | 15-infrastructure-runbook.md | Phase 11 evidence ベース | 別 PR |
| MVP リリース完了報告テンプレ追加 | 15-infrastructure-runbook.md | post-release-summary を昇格 | 実行後 close-out wave |
| Cloudflare CLI wrapper（`scripts/cf.sh`）の唯一性を spec に追記 | 15-infrastructure-runbook.md | CLAUDE.md secret 管理ルール準拠 | 別 PR |

### ステップ 3: documentation-changelog.md

- 09c-production-deploy-execution-001 で追加: `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / `outputs/phase-{01..13}/...`
- 更新提案: 上位 `docs/30-workflows/README.md`（execution 半身を Wave 9 完了として明記）
- 削除: なし

### ステップ 4: unassigned-task-detection.md（0 件でも出力必須）

| 課題 | 取り扱い | 担当 task spec |
| --- | --- | --- |
| 24h verify の自動 dashboard 化（GitHub Actions schedule） | existing formal task | `task-09c-post-release-dashboard-automation-001.md` |
| release tag → GitHub Releases の自動連携 | existing formal task | `task-09c-github-release-tag-automation-001.md` |
| incident response runbook の Slack bot 自動配信 | existing formal task | `task-09c-incident-runbook-slack-delivery-001.md` |
| 1 週間 / 1 ヶ月後の継続観測 | existing formal task | `task-09c-long-term-production-observation-001.md` |
| Cloudflare Analytics の長期保存（CSV export） | existing formal task | `task-09c-cloudflare-analytics-export-001.md` |
| postmortem の自動テンプレ生成 | existing formal task | `task-09c-postmortem-template-automation-001.md` |

> **0 件の場合も「該当なし」と明記して出力する**（skill 仕様: 出力必須）。本タスクでは 6 件が既に formal task file として存在することを確認し、新規作成は行わない。

### ステップ 5: skill-feedback-report.md（改善点なしでも出力必須）

- **親 09c からの引き継ぎ指摘**:
  - 親で「docs-only 仕様作成 PR と production 実行手順が同一 lifecycle に混在」していた
  - 親 Phase 13 PR 作成前に production deploy 済みと読める時系列ミスがあった
- **本タスクでの分離**:
  - 本タスク（execution-only）が親（docs-only）から完全分離された
  - Issue は #353（CLOSED）を `Refs` で参照、`Closes` は使用しない
  - 別 PR / 別 task spec dir / 別 artifacts.json で lifecycle 完全分離
- **本タスクで得たノウハウ**:
  - production mutation を含む task は taskType=implementation で 3 段 user_approval を必須化
  - Cloudflare 操作は `bash scripts/cf.sh` のみ（`wrangler` 直実行禁止）を Phase 全体で徹底
  - rollback payload は merge 前/後を分離保存し上書き禁止
  - 24h 観測中の新規 deploy 凍結ルール（hotfix 例外のみ）
- **改善提案**:
  - task-specification-creator の Phase 12 strict 7 filenames を使用し、旧別名（`system-spec-update.md` / `doc-update-history.md` / `outputs/phase-12/artifacts.json`）を使わない
  - production mutation task では `spec_created` と実行済み evidence を混同しない approval-gated 表現を Phase 12 compliance に固定する

### ステップ 6: phase12-task-spec-compliance-check.md

- strict 7 files の実体確認結果を記録する。
- `outputs/artifacts.json` は本ワークフローでは作成しないため、root `artifacts.json` が唯一正本であることを記録する。
- `spec_created` / approval-gated / VISUAL evidence deferred の境界を PASS 条件に含める。
- aiworkflow-requirements same-wave sync は「09c execution spec formalization として登録予定。実 production 実測値の正本反映は Phase 13 / 実行後 close-out wave で実施」とし、実測前の PASS 断言を禁止する。
  - production deploy runbook を `.github/runbooks/` に置き spec から参照
  - share-evidence の Slack post URL を `gh` CLI で取得できる手順を別 task で
- **不要だった作業**: なし

> **改善点が「なし」の場合も「改善点なし」と明記して出力する**（skill 仕様: 出力必須）

### ステップ 6: phase12-task-spec-compliance-check.md

不変条件 #1-#15 すべてを **execution evidence ベース** で点検する計画を固定する。現時点では production execution が未実行のため、Phase 9 / 11 の reserved evidence path は runtime PASS ではなく `PENDING_EXECUTION` と扱う。

| 不変条件 | spec 計画 | runtime 判定（execution evidence） |
| --- | --- | --- |
| #1 schema を固定しすぎない | PLANNED | PENDING_EXECUTION: production sync 後 schema_versions / code grep で確認 |
| #2 consent キー統一 | PLANNED | PENDING_EXECUTION: Phase 9 smoke で `publicConsent` / `rulesConsent` 確認 |
| #3 responseEmail は system field | PLANNED | PENDING_EXECUTION: production member_responses で system field 確認 |
| #4 本人本文を D1 override しない | PLANNED | PENDING_EXECUTION: Phase 9 で `/profile` 編集 form 不在 screenshot |
| #5 apps/web → D1 直接禁止 | PLANNED | PENDING_EXECUTION: Phase 11 `rg D1Database apps/web/.open-next/` 0 hit |
| #6 GAS prototype 昇格しない | PLANNED | PENDING_EXECUTION: Phase 11 Cloudflare Triggers screenshot で GAS 不在 |
| #7 responseId と memberId を混同しない | PLANNED | PENDING_EXECUTION: Phase 9 smoke の UI 表示 |
| #8 localStorage を正本にしない | PLANNED | PENDING_EXECUTION: Phase 9 smoke で localStorage 依存なし |
| #9 /no-access 専用画面に依存しない | PLANNED | PENDING_EXECUTION: Phase 9 で AuthGateState 出し分け |
| #10 Cloudflare 無料枠 | PLANNED | PENDING_EXECUTION: Phase 11 24h Workers req < 5k / D1 < 10% |
| #11 admin は本人本文を直接編集できない | PLANNED | PENDING_EXECUTION: Phase 9 admin UI screenshot |
| #12 admin_member_notes を view model に混ぜない | PLANNED | PENDING_EXECUTION: Phase 9 API response 確認 |
| #13 tag は admin queue 経由 | PLANNED | PENDING_EXECUTION: Phase 9 admin queue UI 確認 |
| #14 schema 変更は /admin/schema | PLANNED | PENDING_EXECUTION: production sync API 経由のみ |
| #15 meeting attendance 重複防止 | PLANNED | PENDING_EXECUTION: Phase 11 SQL 0 行 |

### ステップ 7: root artifacts.json Phase status parity 確認

- root `docs/30-workflows/09c-production-deploy-execution-001/artifacts.json` を唯一正本として確認
- spec_created / VISUAL / implementation のフラグ整合性を **明示的に check**
- `outputs/artifacts.json` を root `artifacts.json` と同期し、parity を `outputs/phase-12/phase12-task-spec-compliance-check.md` に記録
- 各 phase の status（spec_created）が root artifacts.json と index.md で一致しているか確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR body に 7 ドキュメントへのリンクを含める / implementation-guide 主要見出しを反映 |
| 親 09c Phase 12 | parent-template-parity を `system-spec-update-summary.md` 内で言及 |
| 上位 README | `documentation-changelog.md` を「Wave 9 execution spec formalized」として通知 |

## 多角的チェック観点（不変条件）

- 不変条件 #1〜#15 を `phase12-task-spec-compliance-check.md` で全 15 項目チェック
- production 文脈での #4 / #5 / #6 / #10 / #11 / #15 が Phase 9 / Phase 11 evidence で裏付けられているか
- spec 更新提案が runbook と整合するか
- 親 09c skill-feedback 指摘の lifecycle 分離が `skill-feedback-report.md` に明記されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1 + Part 2） | 12 | spec_created | 中学生レベル + 技術者レベル |
| 2 | system-spec-update-summary.md（Step 1-A/B/C + Step 2） | 12 | spec_created | 影響分析 / 更新一覧 / 反映方針 |
| 3 | documentation-changelog.md | 12 | spec_created | 追加 / 更新 / 削除 |
| 4 | unassigned-task-detection.md | 12 | spec_created | **0 件でも出力必須** |
| 5 | skill-feedback-report.md | 12 | spec_created | **改善点なしでも出力必須** / 親 lifecycle 分離記録 |
| 6 | phase12-task-spec-compliance-check.md | 12 | spec_created | 不変条件 #1-#15 |
| 7 | root/outputs artifacts.json parity 確認 | 12 | spec_created | root と outputs mirror の一致 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1 中学生 + Part 2 技術者 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | 正本仕様への影響と更新箇所 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 更新履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出（0 件でも必須） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback（改善点なしでも必須） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 compliance |
| メタ | artifacts.json (root) | 唯一正本として確認済 |
| メタ（補助） | outputs/phase-12/phase12-task-spec-compliance-check.md | root/outputs artifacts parity 検証 |
| メタ | artifacts.json (root) | Phase 12 を completed に更新 |

## 完了条件

- [ ] **必須 7 ファイル** すべて作成（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
- [ ] implementation-guide に Part 1（ダイヤ改正例え話 + 専門用語 5 用語以上）と Part 2（全コマンド列 + rollback 5 経路 + 24h 手順）が含まれている
- [ ] unassigned-task-detection は 0 件でも出力済み
- [ ] skill-feedback-report は改善点なしでも出力済み + **親 09c lifecycle 分離記録** が明記
- [ ] phase12-task-spec-compliance-check で不変条件 15 件 PASS（runtime evidence ベース）
- [ ] root artifacts.json が唯一正本であることを確認済
- [ ] spec_created / VISUAL / implementation のフラグ整合性が一致
- [ ] artifacts.json の Phase 12 を completed に更新

## タスク100%実行確認【必須】

- 全 7 ファイル作成済
- 不変条件 15 項目 PASS
- artifacts.json parity 確認済
- 親 09c skill-feedback 指摘事項（lifecycle 混在）の分離記録あり
- artifacts.json の phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成 / `Refs #353`)
- 引き継ぎ事項: 7 ドキュメント / implementation-guide 主要見出し / artifacts parity 結果
- ブロック条件: 7 ファイルいずれかが欠ける、または不変条件 1 件でも違反があれば次 Phase に進まない

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Part 1 の例え話が不明瞭 | 初学者の理解妨害 | 専門用語セルフチェック表 5 用語以上を強制、ダイヤ改正の例え話を Phase 全体で 1 本筋に |
| spec 更新提案を本 PR に混ぜる | 本 PR が docs-only 提案で肥大化 | Step 1-C で「別 PR」と明示、本 PR は execution evidence のみ |
| unassigned-task が 0 件で記載省略 | skill 仕様違反 | 0 件でも「該当なし」と明記して出力（必須） |
| 親 09c lifecycle 分離記録の漏れ | 同じ混在を再発 | skill-feedback-report.md の冒頭セクションに明示、本タスク `Refs #353` 採用と紐付ける |
| artifacts.json parity ずれ | Phase 13 PR で status 不整合 | parity check を補助ファイルで evidence 化、不一致時は両側を再生成 |
