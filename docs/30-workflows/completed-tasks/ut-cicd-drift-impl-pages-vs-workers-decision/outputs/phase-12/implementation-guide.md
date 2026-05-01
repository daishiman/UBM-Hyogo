# Phase 12 成果物: implementation-guide

## Part 1: 中学生レベル概念

### なぜ必要か

このタスクが必要だった理由は、Web アプリをどの Cloudflare 方式で配るかが文書ごとにずれていたからです。

### なぜこのタスクが必要だったの？

お店に例えると、「お店の入口の看板（CLAUDE.md）」と「実際の厨房レイアウト（wrangler.toml）」と「配達伝票（web-cd.yml）」が、それぞれちょっとずつ違うことを言っていました。

- 看板は「Workers でやっています」と書いてある
- 厨房レイアウトは「Workers の厨房」になっていた
- 配達伝票だけはまだ「Pages の配達ルート」のまま

このままだと、誰かが新しく入ってきた時に「結局どっちなの？」と混乱します。今回は、その「決め事の正本」となる文書（ADR と呼ばれる「決定の議事録」）を作って、3 つを合わせる方針を残しました。

### 何を決めたの？

「Workers のやり方に揃える（cutover）」と決めました。理由はシンプルで、厨房レイアウトはすでに Workers になっているからです。配達伝票だけ取り残されている状態なので、それを Workers 用に書き換える指示は、別タスク（既に起票済み）に任せます。

### 何をするか

ADR-0001 を正本として置き、正本仕様を更新し、残った配達伝票にあたる `web-cd.yml` の修正を後続タスクへ渡します。

### どう守るの？

- ADR が「正本」になる。今後「Pages がいい？ Workers がいい？」と迷ったら ADR を読む。
- 「Web UI は D1 データベースに直接アクセスしない」というルール（不変条件 #5）は、Workers になっても絶対守る。
- 関連する別タスクと役割が重ならないよう、お互い「これは私の担当・あれは別タスクの担当」と明記する。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| ADR-0001 | Pages / Workers の決定根拠 |
| 正本仕様更新 | `wrangler.toml = Workers`、`web-cd.yml = Pages 残` の current facts |
| migration task 更新 | 残作業を `web-cd.yml` / Cloudflare side / smoke に寄せる |

---

## Part 2: 技術者レベル

### ADR 配置先 / ファイル名規約

```
docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md
```

- 採番: `0001` から開始（ADR 番号体系新規導入）
- ファイル名: `<NNNN>-<kebab-case-title>.md`
- セクション: Status / Context / Decision / Consequences / Related の 5 セクション（MADR 準拠）
- 現在状態: 作成済み。Status = `Accepted (2026-05-01)`、Decision = Workers cutover

### TypeScript 型定義

本タスクは docs-only ADR のため実 TypeScript 実装はない。後続 task で扱う deploy decision の論理型は以下。

```ts
type DeployTarget = "cloudflare-workers-opennext";

interface PagesVsWorkersDecision {
  status: "accepted";
  decidedAt: "2026-05-01";
  target: DeployTarget;
  remainingWork: Array<"web-cd-yml" | "cloudflare-side-cutover" | "smoke">;
}
```

### CLIシグネチャ

```bash
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision --phase 12
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision --json
```

### 使用例

```bash
rg -n "ADR-0001|pages-vs-workers|OpenNext Workers" \
  docs/00-getting-started-manual/specs/adr \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
```

### エラーハンドリング

| エラー | 対応 |
| --- | --- |
| ADR ファイルが無い | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` を復元する |
| `artifacts.json` parity が崩れる | root と `outputs/` の両方を同じ Phase 11/12 outputs に戻す |
| `apps/web/wrangler.toml` に D1 binding が入る | 不変条件 #5 違反として差し戻す |

### エッジケース

| ケース | 判定 |
| --- | --- |
| ADR は Accepted だが `web-cd.yml` は Pages deploy | 正常な残作業。`task-impl-opennext-workers-migration-001` で扱う |
| Cloudflare side 切替が未完了 | 同じ migration task の runbook / AC として扱う |
| `@opennextjs/cloudflare` major update | baseline 再評価対象 |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| ADR path | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` |
| canonical target | `Cloudflare Workers + @opennextjs/cloudflare` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

### テスト構成

| 検証 | 期待 |
| --- | --- |
| ADR existence | ADR-0001 file exists |
| artifacts parity | `cmp -s artifacts.json outputs/artifacts.json` = 0 |
| D1 guard | `rg` 出力なし |
| Phase 12 guide validator | JSON `ok=true` |

### deployment-cloudflare.md 判定表更新差分

| 列 | 旧 | 新 |
| --- | --- | --- |
| 現状 (2026-04-29 → 2026-05-01) | wrangler.toml = Pages 形式（誤記） | wrangler.toml = Workers 形式 / web-cd.yml = Pages 形式（drift 残） |
| 将来 | TBD | Workers 形式に統一（cutover）— ADR-0001 |
| 根拠リンク | — | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` |
| 更新日 | — | 2026-05-01 |

### CLAUDE.md 更新差分（base case = cutover）

cutover 採択のため CLAUDE.md スタック表（L19 / L37）は Workers 表記維持で **変更不要**。任意脚注（「→ ADR-0001 参照」）の追加可。

### 不変条件 #5 維持の Consequences 明記

ADR Consequences セクションに以下を必須記載:

> Workers 形式 cutover 後も `apps/web/wrangler.toml` への `[[d1_databases]]` 追加は禁止。D1 binding は `apps/api` 側のみに閉じる（不変条件 #5）。

### `@opennextjs/cloudflare` バージョン互換確認結果

実測（2026-05-01）: `apps/web/package.json` で `@opennextjs/cloudflare@1.19.4` / `wrangler@4.85.0` / `next@16.2.4`。Workers 形式起動可能な構成揃い済。v2.x+ メジャーバージョン更新時の互換性再評価は baseline B-1（Phase 10）として将来トリガ。

### 関連タスク責務分離表

| タスク | 責務 | 本 ADR との関係 |
| --- | --- | --- |
| ADR-0001（本タスク） | deploy target 決定根拠 | source of truth |
| `task-impl-opennext-workers-migration-001`（unassigned） | 実 cutover（web-cd.yml / Cloudflare side / smoke。wrangler.toml は Workers 形式維持） | blocks（ADR 採択後に着手） |
| `UT-GOV-006-web-deploy-target-canonical-sync`（completed） | canonical sync ガバナンス | related（ADR-0001 を sync 対象 list に追加） |

## 視覚証跡

UI/UX変更なしのため Phase 11 スクリーンショット不要。

代替証跡:
- `outputs/phase-11/manual-smoke-log.md`: ADR 正本 / artifacts parity / D1 guard の NON_VISUAL smoke
- `outputs/phase-11/manual-test-result.md`: Phase 4 検証コマンド 5 種の再実行結果 + ADR レビューチェックリスト走査結果
- `outputs/phase-11/link-checklist.md`: 同 wave 8 ファイル死活確認
- `outputs/phase-11/ui-sanity-visual-review.md`: WEEKGRD-03 NON_VISUAL 宣言

## 完了確認

- [x] Part 1（中学生レベル）: 日常例え / 専門用語回避 / なぜ→何を→どう守る
- [x] Part 2（技術者）: ADR 配置 / 判定表差分 / CLAUDE.md / 不変条件 #5 / バージョン / 責務分離
- [x] 視覚証跡 NON_VISUAL 固定文
