# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 設計成果物のみで完結せず、`vitest.config.ts` の編集、`scripts/hooks/block-test-suffix.sh` の新規 bash 実装、`.github/workflows/verify-test-suffix.yml` の新規 workflow 実装、159件の `git mv` rename を伴うため、実装仕様書として要件定義を行う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

Issue #623 の「未解決のまま close された二段階対応」を再着手するにあたり、対象範囲・受入条件・4 条件評価・既存資産インベントリを確定し、Phase 2 設計の手戻りを防ぐ。特に「rename 対象 159 件の正確な分布把握」「CI gate 二層（lefthook + GitHub Actions）の必要性合意」「coverage delta = ±0% を保証する rename 手順」の 3 論点を Phase 1 で確定する。

## 真の論点

issue-623 の本質的な問題は以下の 3 点である。

1. **二段階対応の恒久化を構造的に終わらせる責務**:
   親 #325 の rename 完了後に created された機能タスク群（task-05 error boundary / schema aliases / shared coverage uplift 等）が新規 `*.test.ts(x)` を再混入させ、二段階対応を恒久化させてしまった。本タスクは「rename を一括実施する」だけでは不十分で、「再混入を構造的に block する CI gate」を同時に投入しなければ同じ歴史を繰り返す。CI gate がない状態で rename だけを完了させる中間状態を Phase 3 のタスク分解で許容しない。

2. **CI gate 二層化（pre-commit + GitHub Actions）の必要性**:
   lefthook pre-commit だけでは `--no-verify` 回避や個別開発環境での hook 未配置で漏れる。GitHub Actions だけでは local 開発時のフィードバックループが長い。Phase 1 で「pre-commit による local 即時 reject」と「GitHub Actions による PR / main / dev push の最終 gate」の二層構成を必須要件とすることを承認する。

3. **coverage delta = ±0% を保証する rename 戦略**:
   rename のみで実体は不変なので coverage 数値は理論上動かない。しかし (a) include glob の絞り込みで未 rename 残存ファイルが silent skip される、(b) coverage.exclude 削除タイミングと rename 完了タイミングがずれて test 本体が coverage に混入する、という 2 つの順序リスクがある。Phase 1 で「rename 完了 → vitest.config 編集 → CI gate 追加」の不可逆順序を確定し、Phase 2 設計に申し送る。

## 依存境界と責務

| 種別 | 対象 | 本タスクとの境界 |
| --- | --- | --- |
| 上流 | issue-325-test-suffix-rename-migration | ADR・命名規約の正本。本タスクは ADR の未完成部分を補完 |
| 上流 | unassigned-task/task-issue-325-followup-003 | 原典タスク指示書。Why / What / How の素材 |
| 連携 | task-git-hooks-lefthook-and-post-merge | lefthook.yml の正本管理元。本タスクは追加 command 1 つを差し込む |
| 連携 | verify-indexes workflow | 既存 verify-* workflow との命名・配置・permissions の整合 |
| 対象外 | テスト内容の変更 | rename のみ。assertion / describe / it の改変は対象外 |
| 対象外 | vitest version up | scope 外 |
| 対象外 | `__tests__` ディレクトリ名の変更 | suffix のみ変更 |
| 対象外 | Playwright / Storybook suffix 規約 | 別 runner は対象外 |

## 価値とコスト評価

- **初回提供価値**: ADR と実装の乖離を解消し、リポジトリ全体で「ファイル名から種別が分かる」運用が回復する。新規 `*.test.ts(x)` 追加が CI で即時 reject されるため、AI agent / 開発者の suffix 揺れが構造的に消える。
- **初回に払わないコスト**: vitest 自体の upgrade、reporter 変更、coverage threshold 見直し、`__tests__` ディレクトリ整理、別 runner の規約統一。
- **設計コスト（Phase 2）**: 5 成果物（rename-strategy / vitest-config-diff / lefthook-script-design / verify-workflow-design / adr-update-plan）。設計分量は小〜中規模。
- **実装コスト（Phase 4 以降想定）**: `git mv` 159 件（半自動スクリプト）、vitest.config.ts 編集 1 件、bash script 新規 1 件（30〜60 行）、GitHub Actions workflow 新規 1 件（30〜50 行）、ADR / CLAUDE.md / skill changelog 追記。
- **運用コスト**: ほぼゼロ。CI gate は無人で動作。skill changelog の indexes 再生成のみ 1 回必要。

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | ADR と実装の乖離解消・再混入の構造的防止が運用品質に直結するか | PASS |
| 実現性 | `git mv` + vitest.config 差分 + lefthook + GitHub Actions の組合せで AC-1〜AC-8 を満たせるか | PASS |
| 整合性 | 既存 lefthook commands / 既存 verify-* workflow と命名・実行順が衝突しないか | CONDITIONAL |
| 運用性 | 新規 CI gate が `--no-verify` 等の運用回避なしに維持できるか | PASS |

判定が CONDITIONAL である主要条件:

- 既存 `lefthook.yml` の `pre-commit.commands` に並列追加した際、`main-branch-guard` / `staged-task-dir-guard` との実行順依存がないことを Phase 2 で動作確認する
- `.github/workflows/verify-test-suffix.yml` の命名が既存 `verify-indexes.yml` 等と統一されており、`permissions: contents: read` の最小権限で完結することを Phase 2 で確定する
- `__tests__` 配下に rename 対象がある場合の path 構造保持を Phase 2 rename-strategy で確認する

## 既存資産インベントリ

| 資産 | 確認対象 | 確認方法 |
| --- | --- | --- |
| `vitest.config.ts` | `test.include` (L42-48) / `coverage.exclude` (L57-77) の現状 | リポジトリルートで Read |
| `lefthook.yml` | `pre-commit.commands` の既存 entry（`main-branch-guard` / `staged-task-dir-guard`） | リポジトリルートで Read |
| `scripts/hooks/staged-task-dir-guard.sh` | 並列実行する独立 step の参照実装 | 既存 script を Phase 2 で熟読 |
| `scripts/hooks/main-branch-guard.sh` | bash hook の exit code / fail_text 連動の参照 | 同上 |
| `.github/workflows/verify-indexes.yml` | 既存 verify-* workflow の命名・trigger・permissions の参考 | Phase 2 で参照 |
| `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` | ADR 追記先 | Phase 2 で追記方針確定 |
| `*.test.ts(x)` 残存 159 件分布 | apps/web 83 / apps/api 6 / packages/shared 17 / packages/integrations 11 / scripts 35 / .claude/skills 7 | Phase 2 で `find` 出力を outputs に保存 |
| `CLAUDE.md` | 追記先（「新規 test ファイルは `*.spec.{ts,tsx}` のみ」） | リポジトリルート |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | skill changelog 追記先候補 | Phase 2 で追記対象確定 |
| `.claude/skills/aiworkflow-requirements/indexes/` | rename 影響範囲（skill fixture 7 件） | Phase 4 で indexes 再生成必要 |

## スコープ確定

### 含む

- 既存 `*.test.ts(x)` 159 件の `git mv` 一括 rename
  - apps/web 83 件
  - apps/api 6 件
  - packages/shared 17 件
  - packages/integrations 11 件
  - scripts 35 件
  - .claude/skills 配下フィクスチャ 7 件
- `vitest.config.ts` の include / coverage.exclude 編集
- 新規 CI gate
  - `scripts/hooks/block-test-suffix.sh`
  - `lefthook.yml` の `pre-commit.commands` に `block-test-suffix` 追加
  - `.github/workflows/verify-test-suffix.yml`
- ドキュメント追従
  - `CLAUDE.md` 1 行追記
  - ADR `test-file-suffix-adr.md` 追記
  - skill changelog 追記
  - `.claude/skills/aiworkflow-requirements/indexes/` 再生成（影響時のみ）

### 含まない

- テスト内容の変更
- vitest version up / reporter 変更
- coverage threshold の変更
- `__tests__` ディレクトリ名の変更
- 別 runner（Playwright / Storybook）の suffix 規約
- fixture / mock 等 test 本体以外のファイル名変更

## 受入条件 (AC) 確認

index.md で定義された AC-1〜AC-8 を Phase 1 で正式承認する。それぞれの対応 Phase は以下:

| AC | 対応 Phase | 検証手段 |
| --- | --- | --- |
| AC-1 (`*.test.ts(x)` 残存 0 件) | Phase 4-11 | `find` コマンド結果を Phase 11 evidence に保存 |
| AC-2 (`test.include` 単一化) | Phase 4 / Phase 11 | `grep -E '\{test,spec\}' vitest.config.ts` で 0 hit |
| AC-3 (`coverage.exclude` から test 行削除) | Phase 4 / Phase 11 | 同上 grep + before/after diff |
| AC-4 (`block-test-suffix.sh` 新規) | Phase 4 / Phase 11 | script 実体存在 + dummy commit で exit 1 確認 |
| AC-5 (`lefthook.yml` 新 command 追加) | Phase 4 / Phase 11 | yaml 構文 + 並列実行確認 |
| AC-6 (GitHub Actions workflow 新規) | Phase 4 / Phase 11 | workflow file 存在 + dry-run 結果 |
| AC-7 (`numTotalTests` 不変) | Phase 11 | rename 前後の JSON evidence 一致 |
| AC-8 (CLAUDE.md / ADR 追記) | Phase 12 | diff evidence を Phase 12 outputs に保存 |

## 用語集

| 用語 | 意味 |
| --- | --- |
| 二段階対応 | vitest.config の `test.include` / `coverage.exclude` が `*.{test,spec}.{ts,tsx}` で両 suffix を許容している過渡的状態 |
| spec 単一収斂 | 上記を `*.spec.{ts,tsx}` のみに絞り、`*.test.*` を完全に廃止すること |
| `block-test-suffix` | 本タスクで新規追加する lefthook pre-commit command 名（固定） |
| `verify-test-suffix` | 本タスクで新規追加する GitHub Actions workflow 名（固定） |
| coverage delta | rename 前後で計測される coverage 数値の差分。本タスクでは ±0% が要件 |
| silent skip | include glob の絞り込みにより、ファイルは存在するが vitest が discovery しない状態。`numTotalTests` 減少で検知する |
| `git mv` | git の rename 検出を効かせるための rename コマンド。本タスクで履歴保持のため必須 |

## 実行タスク

- [ ] index.md / 原典 `task-issue-325-followup-003-vitest-spec-suffix-convergence.md` を読み前提を確認
- [ ] `*.test.ts(x)` 残存分布（159 件）を `find` で再計測し outputs/phase-01/requirements.md に記録
- [ ] 真の論点 3 点（恒久化終結 / CI gate 二層化 / coverage delta ±0% 保証）を文書化
- [ ] スコープ（含む/含まない）を確定
- [ ] AC-1〜AC-8 を Phase 1 で正式承認
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件を記録
- [ ] 既存資産インベントリ（vitest.config / lefthook.yml / hooks scripts / verify workflows / ADR）を洗い出し
- [ ] `outputs/phase-01/requirements.md` を作成

## 統合テスト連携

本 Phase は要件定義のみで、コード変更・rename 実施・CI gate 実装は行わない。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 2 設計 | rename-strategy / config diff / hook script / verify workflow / ADR 追記方針 | 本 Phase の論点・AC・インベントリを入力として渡す |
| Phase 4〜 実装 | `git mv` 実施・vitest.config 編集・CI gate 投入 | 本 Phase で確定した順序制約を申し送る |
| Phase 11 evidence | `*.test.*` 残存 0 件・`numTotalTests` 不変・CI gate 動作確認 | 検証観点を Phase 2 で具体化 |

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト命名・配置規約の参照（存在する場合） |
| `.claude/skills/aiworkflow-requirements/indexes/` | skill 配下フィクスチャ rename 後の indexes 再生成必要性確認 |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期ルール |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/index.md | タスク概要・AC・不変条件 |
| 必須 | docs/30-workflows/completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md | 原典タスク仕様（consumed） |
| 必須 | docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md | ADR 追記先 |
| 必須 | vitest.config.ts | 編集対象 |
| 必須 | lefthook.yml | 追記対象 |
| 必須 | scripts/hooks/staged-task-dir-guard.sh | 参照実装 |
| 参考 | .github/workflows/verify-indexes.yml | 既存 verify workflow の参考 |
| 参考 | CLAUDE.md | 追記先 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（論点・スコープ・AC・4 条件評価・既存資産インベントリ・用語集） |

## 完了条件

- [ ] 真の論点 3 点が文書化されている
- [ ] 4 条件評価が記録され CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-8 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが記録されている
- [ ] `*.test.ts(x)` 残存 159 件の分布が記録されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全仕様化タスクが `spec_created` として整合し、実装タスクは Phase 4 以降の計画として残っている
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（rename 中の merge conflict / `--no-verify` 利用 / `__tests__` 配下の path 構造変化）を確認済み
- 次 Phase への引き継ぎ事項を記述

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 真の論点 3 点・AC-1〜AC-8・スコープ・4 条件評価の CONDITIONAL 解消条件・既存資産インベントリ・159 件分布・順序制約（rename → vitest.config → CI gate）を Phase 2 設計の入力として渡す
- ブロック条件: `outputs/phase-01/requirements.md` が未作成、または CONDITIONAL 解消条件が未記録の場合は Phase 2 に進まない
