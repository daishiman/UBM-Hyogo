# タスク仕様書: Issue #350 — 1週間 / 1か月 production 継続観測の仕様化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-350-long-term-production-observation |
| 元 task_id | task-09c-long-term-production-observation-001 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/350 (CLOSED) |
| 起票元 source | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 配置先 | `docs/30-workflows/issue-350-long-term-production-observation/` |
| 作成日 | 2026-05-06 |
| ブランチ | `docs/issue-350-long-term-production-observation` |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — 「観測閾値の仕様化」だけでは「期日忘れ」リスクを構造的に解消できない。Issue body にある「reminder または Issue checklist を作成する」を実効化するため、`.github/workflows/post-release-observation-reminder.yml`（GitHub Actions 定期実行）と Cloudflare 側 metrics 取得用の補助スクリプトを併設する。Cloudflare 無料 cron 枠（3 本）は満杯のため、新規 Workers cron は追加せず GitHub Actions scheduled で吸収する。runbook（docs）と SSOT（`.claude/skills/aiworkflow-requirements/references/`）も同 cycle で同期する。 |
| 親 Issue 状態維持 | CLOSED のまま運用（ユーザー指示）。本仕様書は historical traceability の後追いドキュメント化であり、再オープンしない。 |
| 優先度 | 中 |
| 規模 | 中規模 |
| 想定 PR 数 | 1 |
| coverage AC | `scripts/observation/` 新規ファイルの branch / line ≥ 80% |

## 目的

09c は production release 後の 24h verification を定義しているが、1週間（D+7）・1か月（D+30）の継続観測は未割当である。24h の正常性だけでは、cron drift / D1 read-write 増加 / traffic 増 / cost 上昇など遅延型の問題を検出できない。本タスクで以下を確定する:

1. D+7 / D+30 の **観測指標 / 閾値 / evidence path** を 09c の 24h baseline と整合する形で固定
2. 異常時の **escalation / rollback / postmortem 分岐** を明文化
3. **GitHub Actions scheduled workflow** で D+7 / D+30 reminder Issue を自動起票し、期日忘れを構造的に防止
4. SSOT (`aiworkflow-requirements`) の operations / deployment 参照導線を更新
5. 09c Phase 12 unassigned 行を consumed trace へ書き換え

## スコープ

### 含む（今回 cycle 完了）

- `.github/workflows/post-release-observation-reminder.yml` 新規（D+7 / D+30 trigger）
- `scripts/observation/create-reminder-issue.sh` 新規（reminder Issue 本文生成 + `gh issue create`）
- `scripts/observation/check-thresholds.md` 新規（手動 checklist スクリプト指針 — bash/awk のみ）
- `docs/runbooks/post-release-long-term-observation.md` 新規（observation runbook 正本）
- `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` 新規（SSOT）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` の該当エントリ追加
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` の該当行を consumed trace に更新

### 含まない（明確な根拠つきで先送り — CONST_007 例外）

- 24h verification 本体の改修（09c の責務）
- 有料 APM / Datadog / 外部 SaaS 導入（コスト判断別途・ユーザー承認必要）
- D+7/D+30 reminder Issue を実際に閉じる運用 PR（runtime 運用フェーズ）
- production runtime evidence の取得（user 認証ゲート — Phase 11 で `PENDING_RUNTIME_EVIDENCE` のまま close-out）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 09c-serial-production-deploy-and-post-release-verification | 24h baseline 閾値の参照元 |
| 上流 | `.github/workflows/post-release-dashboard.yml` | 既存 post-release scheduled workflow と命名整合 |
| 下流 | aiworkflow-requirements operations 参照 | SSOT 反映 |
| 下流 | runbook ハブ (`docs/runbooks/`) | observation runbook 配置 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| 09c Phase 12 が存在 | `ls docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/` |
| `.github/workflows/post-release-dashboard.yml` が存在 | `ls .github/workflows/post-release-dashboard.yml` |
| `.claude/skills/aiworkflow-requirements/references/` 書込可 | `test -w .claude/skills/aiworkflow-requirements/references` |
| `gh` CLI 利用可 | `gh --version` |

## Phase 構成

| Phase | 概要 | 主要成果物 |
| --- | --- | --- |
| Phase 1 | 要件定義 / 観測指標確定 | `outputs/phase-1/phase-1.md` |
| Phase 2 | アーキテクチャ設計（GH Actions vs Workers cron 判断含む） | `outputs/phase-2/phase-2.md` |
| Phase 3 | タスク分解 / ファイル変更計画 | `outputs/phase-3/phase-3.md` |
| Phase 4 | 実装方針（reminder workflow / runbook 構造） | `outputs/phase-4/phase-4.md` |
| Phase 5 | 詳細設計（YAML / shell / SSOT スキーマ） | `outputs/phase-5/phase-5.md` |
| Phase 6 | テスト戦略（NON_VISUAL: actionlint + shellcheck + dry-run） | `outputs/phase-6/phase-6.md` |
| Phase 7 | コード実装手順 | `outputs/phase-7/phase-7.md` |
| Phase 8 | テスト実装手順 | `outputs/phase-8/phase-8.md` |
| Phase 9 | 統合検証（GitHub Actions dry-run / `act` / workflow_dispatch） | `outputs/phase-9/phase-9.md` |
| Phase 10 | ドキュメント反映（runbook / SSOT / 09c trace） | `outputs/phase-10/phase-10.md` |
| Phase 11 | NON_VISUAL evidence（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`） | `outputs/phase-11/phase-11.md` |
| Phase 12 | 実装ガイド / 履歴 / 未タスク / skillFB / コンプライアンス | `phase-12.md`, `outputs/phase-12/*.md` |
| Phase 13 | PR 作成（G1-G4 ゲート遵守） | `outputs/phase-13/phase-13.md` |

## DoD（Definition of Done — 仕様書全体）

- [ ] Phase 1〜13 の仕様書が全て生成済
- [ ] 各仕様書冒頭に **[実装区分: 実装仕様書]** が明記されている
- [ ] CONST_005 必須項目（変更対象ファイル / シグネチャ / 入出力 / テスト / コマンド / DoD）が全 phase に揃っている
- [ ] 09c Phase 12 unassigned 行を consumed trace に書き換える指示が Phase 10 に含まれている
- [ ] 後続実行者が本仕様書群のみで実装着手できる粒度

## 参照

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- `.github/workflows/post-release-dashboard.yml`
