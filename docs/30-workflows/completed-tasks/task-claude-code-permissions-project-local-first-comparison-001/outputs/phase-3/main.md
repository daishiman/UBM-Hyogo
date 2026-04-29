# Phase 3 Output: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 2 |
| 下流 | Phase 4（テスト設計） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. レビュー結論サマリ

| 観点 | 判定 |
| --- | --- |
| R-1: 4 層責務表の整合性 | PASS（公式仕様の優先順位と一致、表内に矛盾なし） |
| R-2: project-local-first 単独の再発防止可否 | **再発する**（`.claude/settings.local.json` が gitignore のため新 worktree で再生成されず、`defaultMode` が default に戻る） |
| R-3: 案 A 採用時の他プロジェクト副作用 | 件数 + 一覧を `impact-analysis.md` に記録（CONDITIONAL ACCEPT） |
| R-4: シナリオ A〜D 対応 | A / B は両案差なし、C / D で差が出る（採否の分かれ目） |
| R-5: ハイブリッド案フォールバック条件 | R-2 が「再発する」と判定されたため **ハイブリッドを採用候補に格上げ** |
| Phase 4 Go/No-Go | **GO（条件付き）** — `task-claude-code-permissions-deny-bypass-verification-001` 結果未着の場合は alias 強化を含む案を保留 |

## 1. R-1: 4 層責務表の整合性

| 確認項目 | 判定 | 根拠 |
| --- | --- | --- |
| 4 層優先順位仮説（`project.local > project > global.local > global`）が公式 docs と一致 | PASS | `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` §1 と Anthropic 公式 docs（settings 階層）に一致 |
| 各層の「想定利用者 / 変更頻度 / git 管理可否」がブレなく記述 | PASS | `outputs/phase-2/layer-responsibility-table.md` 表内で重複・矛盾なし |
| 担当キーの置き場所が層責務に従っている | PASS | 共有要件は project、個人要件は project.local、機微値は `*.local` 系のみ |

## 2. R-2: project-local-first の再発防止可否

| 確認項目 | 判定 | 根拠 |
| --- | --- | --- |
| 公式 docs で `defaultMode` 未指定時の組み込み default が文書化 | 部分的 — Anthropic 公式 docs では未指定時は対話的 prompt（`acceptEdits` 系の挙動）が default | 公式 docs 引用 |
| fresh プロジェクトで起動時 prompt 復帰が起きるか | **YES（再発する）** | project.local が gitignore のため新 worktree では未配置、global の `defaultMode` 未設定時は default 挙動に戻る |
| `.claude/settings.local.json` を gitignore する運用が新 worktree で正しく作用するか | YES（仕様通り） | `scripts/new-worktree.sh` は当該設定をコピーしないため fresh 状態を生む |
| **結論** | **project-local-first 単独では新規プロジェクト・新 worktree で再発する** | 上記より |

> 影響: 案 B 単独採用は「個人開発時に毎回 worktree で `.claude/settings.local.json` を再配置する手間」を伴う。これを避けるには (a) `scripts/new-worktree.sh` にテンプレ配置を組み込む or (b) ハイブリッドで global fallback を持つ、いずれかが必要。

## 3. R-3: 案 A 採用時の影響分析（要約）

詳細は `impact-analysis.md` を参照。

| 確認項目 | 結果 |
| --- | --- |
| `~/dev` 配下で `defaultMode` 明示しているリポジトリ件数 | grep メタ情報のみ記録（値は転記しない） |
| `scripts/cf.sh` 経由 Cloudflare CLI 運用への副作用 | 直接の評価経路に該当なし。ただし global の `permissions.deny` に `Bash(wrangler *)` を新たに混入させない |
| `op run --env-file=.env` 注入経路への副作用 | settings 階層と独立。直接副作用なし |
| 他 worktree の権限評価への副作用 | global の `defaultMode` 変更は全 worktree の最終値に反映される（project.local 未配置時） |
| `cc` alias に `--dangerously-skip-permissions` 追加 | shell 全体に波及。`cc` を呼ぶ全プロジェクトで `permissions.deny` が無効化される **可能性あり**（deny 検証タスク待ち） |

## 4. R-4: シナリオ A〜D 対応

| シナリオ | 状況 | 案 A 最終 `defaultMode` | 案 B 最終 `defaultMode` | 許容可否 |
| --- | --- | --- | --- | --- |
| A | 全層配置済み | bypassPermissions（project.local 勝ち） | bypassPermissions | 案 A / 案 B 共に変化なし |
| B | project.local のみ配置 | bypassPermissions | bypassPermissions | 同上 |
| C | global / project のみ配置（fresh worktree） | bypassPermissions（global 経由） | default 挙動（再発） | **採否の分かれ目** |
| D | global のみ配置 | bypassPermissions | default 挙動 | 同上 |

> シナリオ C / D が採用案を分ける本質。fresh 環境で bypass を維持したいなら案 A or ハイブリッドが必要、worktree 単位で明示的に bypass 配置するなら案 B で足りる。

## 5. R-5: ハイブリッド案フォールバック条件

R-2 が「再発する」と判定されたため、**ハイブリッド（B を default、A を fallback）を採用候補に格上げ**。fallback 発動条件は以下のいずれか:

- 新 worktree 起動時に `<project>/.claude/settings.local.json` が未配置
- fresh プロジェクトで全層に `defaultMode` 未設定

ただし、global を変更する案 A 部分は `task-claude-code-permissions-deny-bypass-verification-001` の deny 実効性結果を待たずには alias 強化（`--dangerously-skip-permissions`）を含めない。

## 6. 暫定優劣

| 順位 | 案 | 採用根拠 |
| --- | --- | --- |
| 1 | ハイブリッド（B を default、A を fresh fallback） | R-2 で再発が判定された以上、B 単独は不可。A 全面採用は影響半径が広すぎる |
| 2 | 案 B（project-local-first） | `scripts/new-worktree.sh` にテンプレ配置を組み込めば再発は手作業で抑止可能（apply タスクで判断） |
| 3 | 案 A（global + alias 強化） | deny 実効性未確認のため alias 強化は保留。global のみの変更も影響半径が広い |

最終確定は Phase 5 で行う。

## 7. 落とし穴の対応状況

| パターン | 状態 |
| --- | --- |
| グローバル設定変更が他プロジェクトに silent 波及 | R-3 で `~/dev` 配下の grep を `impact-analysis.md` に記録 |
| 公式 docs で `defaultMode` 未指定時挙動が未文書化 | 公式 docs を主、読み取り専用観測を補助として記録 |
| `.claude/settings.local.json` の gitignore と `scripts/new-worktree.sh` の不整合 | シナリオ C として明示し apply タスクへ |
| `--dangerously-skip-permissions` で deny 無効化リスク | `task-claude-code-permissions-deny-bypass-verification-001` の結果待ち。未着なら alias 強化案は除外 |

## 8. Phase 4 Go/No-Go 判定

**GO（条件付き）**:

- R-1〜R-4 は PASS / 結論記録済み
- R-5 によりハイブリッドが採用候補に格上げされた
- alias 強化（`--dangerously-skip-permissions`）は deny 実効性結果未着なら除外する条件付きで進める

## 9. 完了条件チェック

- [x] R-2 の再発判定を 1 結論として記録
- [x] `impact-analysis.md` に他プロジェクト副作用を件数 + 一覧で記録
- [x] Phase 4 Go/No-Go を明示

## 10. 次 Phase へのハンドオフ

- Phase 4: TC-01〜TC-04 の検証シナリオ作成。R-2 結論を TC-01 の前提に組み込む
- Phase 5: ハイブリッドを第一候補として比較表 Section 6 に書く。alias 強化部分は条件付き
- apply タスクへ: `scripts/new-worktree.sh` テンプレ配置の検討依頼を `unassigned-task-detection.md` で残す候補

## 11. 参照資料

- `phase-03.md`
- `outputs/phase-2/`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`
