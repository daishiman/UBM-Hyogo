# Phase 12: implementation-guide.md

日付: 2026-04-28

## Part 1: 中学生にも分かる説明

### なぜ必要か

たとえば、学校の部活動で「道具を片付ける係」を決めたのに、その理由が黒板、ノート、先生のメモに分かれていたら、次の人は迷う。今回の Git hook（作業前後に自動で確認する仕組み）も同じで、`lefthook` を使い `husky` を使わない理由が複数の作業記録に分かれていた。

そこで、将来の人が「なぜこの道具を選んだのか」を1つの紙で読めるように、ADR（大事な決定の記録）としてまとめた。

### 今回作ったもの

| 区分 | ファイル | 内容 |
| --- | --- | --- |
| 新規 | `doc/decisions/0001-git-hook-tool-selection.md` | `lefthook` 採用と `husky` 不採用の理由をまとめた ADR-0001 |
| 新規 | `doc/decisions/README.md` | ADR の置き場、命名規約、一覧 |
| 追記 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | ADR-0001 への戻り道 |
| 追記 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | ADR-0001 への戻り道 |
| 新規 | `docs/30-workflows/unassigned-task/task-adr-template-standardization.md` | 次に ADR を作る前にテンプレートを整える未タスク |

### 何が変わるか

- hook ツールの判断理由は ADR-0001 を読めば分かる。
- `doc/decisions/README.md` から既存 ADR を探せる。
- 派生元 workflow outputs から ADR-0001 へ移動できる。
- UI 画面は変わらないため、スクリーンショットは作らない。

## Part 2: 開発者向け詳細

### インターフェースと型定義

```ts
type AdrStatus = "Proposed" | "Accepted" | "Deprecated" | `Superseded by ADR-${string}`;

interface ArchitectureDecisionRecord {
  id: `ADR-${string}`;
  fileName: `${string}-${string}.md`;
  status: AdrStatus;
  requiredSections: [
    "Status",
    "Context",
    "Decision",
    "Consequences",
    "Alternatives Considered",
    "References",
  ];
  references: string[];
}
```

### CLIシグネチャ

```bash
# ADR 本体と index の存在確認
ls doc/decisions/0001-git-hook-tool-selection.md doc/decisions/README.md

# 必須セクション確認
grep -E '^## (Status|Context|Decision|Consequences|Alternatives Considered|References)' \
  doc/decisions/0001-git-hook-tool-selection.md

# Phase 12 implementation guide 検証
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow docs/30-workflows/completed-tasks/task-husky-rejection-adr --json

# Phase 11 NON_VISUAL 証跡検証
node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js \
  --workflow docs/30-workflows/completed-tasks/task-husky-rejection-adr --json
```

### 使用例

```bash
# 派生元 phase-2 backlink の解決
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo phase-2 OK )

# 関連タスクリンクの解決
test -f docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md
test -f docs/30-workflows/unassigned-task/task-adr-template-standardization.md
```

### エラーハンドリング

| エラー | 対応 |
| --- | --- |
| ADR backlink が切れる | 相対パスを `outputs/phase-*` 起点で再計算し、Phase 11 `link-checklist.md` を更新する |
| 関連タスクファイルが存在しない | ADR References と Phase 11 link checklist の両方を実在パスへ修正する |
| Phase 12 guide validator が失敗する | Part 1 / Part 2、型定義、CLI例、エラー、エッジケース、設定表を補う |

### エッジケース

- ADR-0001 は Accepted のため、将来方針を変える場合は本文を直接書き換えず、後続 ADR を作って `Superseded by ADR-NNNN` にする。
- `task-verify-indexes-up-to-date-ci` は `completed-tasks/` 配下にあるが本文ステータスは未実施なので、ADR では「関連タスク」として扱う。
- 本タスクは `docs-only` / `NON_VISUAL` なので `apps/desktop/`、`apps/backend/`、`packages/shared/` には実装差分を入れない。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| ADR directory | `doc/decisions/` |
| ADR ID | `ADR-0001` |
| ADR file | `doc/decisions/0001-git-hook-tool-selection.md` |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| Phase 11 evidence | `main.md` / `manual-smoke-log.md` / `link-checklist.md` |

### テスト構成

| 観点 | 検証 |
| --- | --- |
| ADR 構造 | 必須6セクションと Alternatives 3節を grep で確認 |
| リンク | ADR、README、backlink、関連タスクを `test -f` で確認 |
| Phase 11 | `validate-phase11-screenshot-coverage.js --workflow ... --json` |
| Phase 12 | `validate-phase12-implementation-guide.js --workflow ... --json` |
| コード影響 | `git status` で apps/backend/shared 差分なしを確認 |
