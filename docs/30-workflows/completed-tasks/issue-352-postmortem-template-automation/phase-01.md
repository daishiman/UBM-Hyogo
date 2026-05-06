# Phase 1: 要件定義 — issue-352-postmortem-template-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-09c-postmortem-template-automation-001 |
| phase | 1 / 13 |
| wave | 09c-fu |
| mode | parallel（実依存は serial: 09c → 本タスク） |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| priority | low |
| scale | small |
| GitHub Issue | #352 |

## 目的

incident / rollback 発生時に、09c Phase 11 evidence と release metadata を入力にして **blame を含まない postmortem markdown を自動生成する** ための要件、受入条件、入出力契約、approval gate を確定する。

template 見出しを timeline / impact / detection / response / root cause / prevention / follow-up issues に**限定**し、構造的に blame 表現が混入できない形にする（S1）。runbook 本文の置換は行わず（S3）、本タスクは postmortem 生成スクリプトと runbook README、template の追加に責務を絞る。

## 実行タスク

1. 既存 09c Phase 11 evidence の構造を確定する。完了条件: 必須 evidence ファイル一覧（main.md / discovered-issues.md / production-smoke-runbook.md / post-release-24h-evidence.md など）が列挙される。
2. CLI 入出力契約（必須引数 / 任意引数 / 失敗時 exit code）を定義する。完了条件: AC-1..AC-10 と evidence path が 1:1 対応する。
3. template の固定見出し 7 種（S1）を確定する。完了条件: 各見出しの目的・記入者責務（人が埋める / スクリプトが埋める）の区分が記載される。
4. 09c Phase 11 evidence path の必須性（S2）と、runbook 責務分離（S3）を本仕様書全 phase に転記する受け渡し責務を明示する。
5. P50 チェック（既存類似スクリプト・テンプレートが無いことの確認）を実施する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| 09c Phase 6 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-06.md` | rollback 4 種（worker / pages / D1 / cron） |
| 09c Phase 11 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md` | manual evidence 仕様 |
| 09c Phase 11 outputs | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` | evidence 実体 |
| 未割当タスク登録 | `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` | 本タスク発見元 |
| Phase テンプレ core | `.claude/skills/task-specification-creator/references/phase-template-core.md` | Phase 共通骨格 |
| Phase 1 テンプレ | `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | P50 チェック |
| 既存 cf ラッパー | `scripts/cf.sh` | rollback CLI ラッパー（参照のみ） |
| 既存 Node 系 script | `scripts/coverage-guard.ts` `scripts/skill-logs-append.ts` | 構成参考 |

## 実行手順

### 0. P50: 既存類似資産の確認（必須）

```bash
# 同等スクリプトが存在しないこと
git log --all --oneline -- 'scripts/postmortem/**' 'scripts/**postmortem**' || true
rg -n "postmortem" scripts/ docs/30-workflows/runbooks/ 2>/dev/null || true

# template が存在しないこと
test ! -e docs/30-workflows/runbooks/postmortem/template.md && echo "OK: template absent"
test ! -e docs/30-workflows/runbooks/postmortem/README.md  && echo "OK: README absent"

# 09c phase-11 evidence の構造を把握
ls docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/
```

期待: 既存 postmortem スクリプト / template が無いこと、09c Phase 11 evidence の主要ファイルが列挙できること。

### 1. ユーザーシナリオ（U1..U5）

- **U1**: production rollback 直後、担当者が `pnpm postmortem:generate` を 1 コマンド実行し、雛形 markdown を取得する。
- **U2**: 生成された markdown には 7 見出しが空欄付きで並び、人がタイムライン・root cause を記入できる。
- **U3**: `--evidence` に存在しない path を渡したとき、コマンドは即時失敗し、stderr に欠落 path を表示する（S2）。
- **U4**: 同一入力で 2 回叩いた場合、出力 markdown は完全一致する（S4 冪等性）。
- **U5**: README に従って `gh issue create` で follow-up issue を起票できる（templated issue body）。

### 2. 受入条件（AC）

| ID | 条件 | evidence |
| --- | --- | --- |
| AC-1 | `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <path> --rollback-evidence <path> --out <path>` が exit code 0 で markdown 出力 | Phase 11 CLI smoke |
| AC-2 | 出力 markdown に 7 見出し（timeline / impact / detection / response / root cause / prevention / follow-up issues）が順序通り含まれる | unit + Phase 11 |
| AC-3 | 出力 markdown / template / スクリプトに blame 表現（人名・"責任" "blame" "fault"）が含まれない（grep gate） | Phase 5 grep gate |
| AC-4 | `--evidence` 不在 path で exit code 非 0 + stderr エラー出力 | unit |
| AC-5 | release / commit の形式バリデーション失敗で exit code 非 0 | unit |
| AC-6 | `generatePostmortem(input)` は副作用なしの pure 関数 | unit |
| AC-7 | 同一入力 2 回実行で完全一致（冪等性） | unit |
| AC-8 | runbook README に follow-up issue 作成手順（`gh issue create`）が記載 | docs review |
| AC-9 | runbook README から既存 incident response runbook 本文への参照リンクのみで、本文置換していない（grep gate） | Phase 5 grep gate |
| AC-10 | unit line 80%+ / branch 60%+、CLI smoke 1 件以上合格 | Phase 9 |

### 3. CLI 入出力契約

| 引数 | 必須 | 例 | 説明 |
| --- | --- | --- | --- |
| `--release` | ✓ | `v0.3.1` | リリースタグ。形式 `v\d+\.\d+\.\d+` |
| `--commit` | ✓ | `abc1234` | デプロイ commit sha。形式 `[0-9a-f]{7,40}` |
| `--evidence` | ✓ | `docs/30-workflows/completed-tasks/09c-.../outputs/phase-11/` | 09c Phase 11 evidence ディレクトリ。実在チェック必須（S2） |
| `--rollback-evidence` | ✓ | `outputs/incident/2026-05-05/rollback.md` | rollback 実施記録の path（無い場合も path を空ファイルでも与える運用） |
| `--occurred-at` | ✓ | `2026-05-05T10:00:00Z` | incident 発生時刻（ISO8601）。冪等性確保のため明示入力（S4） |
| `--detected-at` | 任意 | `2026-05-05T10:05:00Z` | 検知時刻 |
| `--resolved-at` | 任意 | `2026-05-05T11:00:00Z` | 復旧時刻 |
| `--severity` | 任意 | `sev2` | 任意の severity ラベル |
| `--out` | 任意 | `outputs/incident/2026-05-05/postmortem.md` | 省略時は標準出力 |

| 終了コード | 意味 |
| --- | --- |
| 0 | 正常生成 |
| 1 | 入力バリデーション失敗（release / commit 形式不正、evidence path 不在） |
| 2 | I/O エラー（`--out` 指定先 write 失敗） |

### 4. template 見出し（S1: blame 排除構造）

| # | 見出し | 記入主体 | 内容 |
| --- | --- | --- | --- |
| 1 | Header | スクリプト | release / commit / occurred-at / detected-at / resolved-at / severity / evidence link |
| 2 | Timeline | 人 | 時刻順イベント（誰が、ではなく "何が起きた / 何をした"） |
| 3 | Impact | 人 | 影響範囲・影響を受けたユーザー数・機能 |
| 4 | Detection | 人 | どの signal で気づいたか（dashboard / alert / user report） |
| 5 | Response | 人 | rollback / hotfix の選択理由と実行ステップ |
| 6 | Root Cause | 人 | 技術的原因（人ではなくコード / 構成 / プロセスを主語に） |
| 7 | Prevention | 人 | 再発防止のための監視追加 / テスト追加 / runbook 更新 |
| 8 | Follow-up Issues | 人 | gh CLI で起票する follow-up issue 一覧（タイトル・概要・owner placeholder） |

「Who is responsible」「Whose fault」「責任者」等の見出し・列を**追加禁止**（S1）。

### 5. approval gate / 自走禁止操作

- 09c が completed-tasks に移動済みであることを前提とする（Phase 11 evidence path が固定）。
- 本タスク仕様書段階では実装コード作成・commit / push / PR 作成を行わない。Phase 5（実装ランブック）以降で user 明示承認後に限り実行する。
- 本仕様書では `apps/api` / `apps/web` のコード変更を含まないため deploy 不要。

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニット Line | 80%+ | Phase 9 |
| ユニット Branch | 60%+ | Phase 9 |
| 結合（CLI smoke） | 1 件以上 | Phase 9 / Phase 11 |
| E2E | 不要（NON_VISUAL / 運用 CLI） | - |

## 多角的チェック観点

- **S1**: blame 表現が template / スクリプト出力に混入しないか（grep gate を Phase 5 で固定）。
- **S2**: 09c Phase 11 evidence path が必須入力として強制されているか（不在時 exit 1）。
- **S3**: 既存 incident response runbook 本文を編集していないか（diff で確認）。
- **S4**: 出力に `Date.now()` / `Math.random()` 等の非決定要素が混入していないか。
- **S5**: `package.json` の scripts に `postmortem:generate` が追加され、Node 24 / pnpm 10 / mise 経由で実行できるか。
- 不変条件: `apps/api` / `apps/web` への変更なし（本タスクは scripts/ + docs/ のみ）。

## サブタスク管理

- [ ] P50: 既存スクリプト / template 不存在を確認
- [ ] U1..U5 シナリオを記載
- [ ] AC-1..AC-10 を evidence と 1:1 紐付け
- [ ] CLI 引数表 / 終了コード表を確定
- [ ] template 見出し 7 種を確定（blame 列なし）
- [ ] 苦戦箇所 S1-S5 を全 phase 引き渡し対象として明記
- [ ] artifacts.json の `visualEvidence: NON_VISUAL` を確定
- [ ] `outputs/phase-01/main.md` 作成

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `outputs/phase-01/main.md` | ユーザーシナリオ / AC / CLI 契約 / template 見出し / approval gate |

## 完了条件

- [ ] U1..U5 が記載されている
- [ ] AC-1..AC-10 が evidence path と対応
- [ ] CLI 引数 / 終了コード仕様が固定
- [ ] template 7 見出しが固定（blame 列なし）
- [ ] 09c Phase 11 evidence 必須性（S2）が明記
- [ ] runbook 責務分離（S3）が明記
- [ ] artifacts.json の `visualEvidence` が `NON_VISUAL` で確定
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] メタ情報 10 行が埋まっている
- [ ] 09c の復活ではなく未割当タスクの正式昇格であることが明記
- [ ] runbook 本文置換が scope out として明記
- [ ] 実装、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC-1..AC-10、CLI 入出力契約表、template 7 見出し、09c Phase 11 evidence 必須性（S2）、runbook 責務分離（S3）、苦戦箇所 S1-S5 を渡す。
