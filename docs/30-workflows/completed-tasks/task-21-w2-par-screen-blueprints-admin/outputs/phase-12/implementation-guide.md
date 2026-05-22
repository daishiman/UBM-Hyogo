# Phase 12 implementation guide

## Part 1: 中学生レベル

なぜ必要かというと、管理画面を作る人が別々に判断すると、同じ「確認」でも画面ごとに言葉や順番がずれてしまうから。
何をするかというと、先に 1 冊の案内図を作り、後から画面を作る人が同じ順番と同じ呼び出し先を見られるようにする。

これは、学校の文化祭で使う「係ごとの案内図」を作る作業に近い。たとえば、受付係、案内係、会計係がそれぞれ勝手に紙を作ると、言葉や順番がばらばらになって来た人が迷う。

管理画面も同じで、会員管理、タグ確認、開催日、申請、監査ログなどがばらばらに作られると、後で画面を作る人が毎回悩む。そこで 09g という 1 冊の案内図に「どの画面に何を置くか」「押したら何が起きるか」「どこへつなぐか」を先にまとめる。

### 今回作ったもの

| 作ったもの | 説明 |
| --- | --- |
| 09g 管理画面案内図 | 管理 8 画面と共通メニューの設計図 |
| 確認用の道具 | 行数、章数、古い呼び出し先、色や大きさの直書きを調べる script |
| 記録一式 | Phase 11 / Phase 12 の確認結果と、後続 task への渡し先 |

専門用語の言い換え:

| 用語 | 言い換え |
| --- | --- |
| blueprint | 画面を作る前の設計図 |
| API | 画面が情報を取りに行く窓口 |
| token | 色や形の名前札 |
| primitive | 画面部品 |
| a11y | 誰でも使いやすくする約束 |

## Part 2: 技術者レベル

### 型定義相当

```ts
type AdminBlueprintSection = {
  route: string;
  api: string[];
  states: string[];
  a11y: string[];
  references: ["09a", "09b", "09c", "09d"];
};
```

### APIシグネチャ

| 区分 | 内容 |
| --- | --- |
| current contract | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` の current admin contract を参照する |
| target delta | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` に AdminSidebar + 管理 8 routes の画面構造を固定する |
| code delta | なし。`apps/` / `packages/` は変更しない |
| screenshot | なし。`visualEvidence=NON_VISUAL` かつ画面実装変更なしのため、`outputs/phase-11/docs-walkthrough.md` を代替証跡にする |

旧 KPI 分割、tag direct approve/reject、schema direct apply、identity generic resolve は使わない。

CLIシグネチャ:

```bash
bash scripts/verify-09g-screen-blueprints-admin.sh
```

### 使用例

task-15 は §2 / §3、task-16 は §4 / §5 / §7、task-17 は §6 / §8 / §9 を入力にして apps/web 実装を進める。

```bash
bash scripts/verify-09g-screen-blueprints-admin.sh
sed -n '1,120p' docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
```

### エラーハンドリング

verify script が line count、section count、derived marker、mermaid、visual literal、stale endpoint を検出し、FAIL 時は Phase 05 へ戻す。

### エッジケース

| case | 扱い |
| --- | --- |
| Sidebar の `/admin/dashboard/attendance` | 既存 route への導線として維持するが、task-21 の管理 8 route blueprint 対象には含めない |
| prototype にある stale endpoint | 09g §99 で不採用にし、verify script で残存を FAIL にする |
| visual token literal | 09b / 09c に委譲し、09g では literal を持たない |
| root / outputs artifacts drift | `cmp -s artifacts.json outputs/artifacts.json` を実測し、差分がある場合は Phase 12 FAIL とする |

### 設定項目と定数一覧

| key | value |
| --- | --- |
| `taskType` | `docs-only` |
| `visualEvidence` | `NON_VISUAL` |
| `workflow_state` | `spec_created` |
| `verify` | `bash scripts/verify-09g-screen-blueprints-admin.sh` |

### テスト構成

| test | evidence |
| --- | --- |
| 09g structure / stale endpoint grep | `outputs/phase-07/automated-checks.log` |
| NON_VISUAL docs walkthrough | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` |
| Phase 12 strict outputs | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifacts parity | `cmp -s artifacts.json outputs/artifacts.json` |
