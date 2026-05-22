# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 名称 | ドキュメント更新 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

task-specification-creator skill が定める **6 必須タスク**を実行し、最低 7 ファイルを実体出力する。本タスクは `implementation` であり、apps/web 実コード変更と Phase 11 local evidence を同一サイクルで取得済みのため、workflow root は `implemented-local` に昇格する。Phase 13 の commit・push・PR は user approval 待ちとして分離する。

## 6 必須タスク

### Task 12-1. 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md` を作成。

#### Part 1（中学生レベル）

> 学校の掲示物を作るとき、クラスごとに好きな色ペンを使うと見た目がばらばらになります。先に「見出しはこの色」「注意はこの色」「紙の角はこの丸さ」と決め、みんなが同じ道具箱から道具を取れるようにすると、早くきれいに作れます。
>
> このタスクでは、Web 画面で使う色・丸さ・影・文字の大きさを同じ道具箱に入れます。開発者は色番号を毎回書かず、`bg-accent` のような短い名前で使えます。古いブラウザ向けの予備色も、決められた場所だけに置きます。
>
> 用語セルフチェック: Tailwind = 見た目の道具を作る仕組み、token = 道具箱の中の名前付き道具、OKLch = 色の決め方、fallback = 予備、bridge = 別の名前で使えるようにする橋。

#### Part 2（技術者レベル）

- `apps/web` に Tailwind v4 build pipeline を確立
- 09b 正本の `--ubm-*` OKLch tokens を `tokens.css` に転記
- `globals.css` の `@theme inline` で `--color-*` / `--radius-*` / `--shadow-*` / `--font-*` 名前空間に bridge
- `tailwind.config.ts` は v4 CSS-first 原則に従い `content` glob のみ
- `apps/web/app/styles.css`（400 行・prototype 写経物）を撤去、layout reset のみ `globals.css @layer base` に移植
- Cloudflare Workers (`@opennextjs/cloudflare`) ビルド互換性を Phase 9/11 で確認
- 後続 task-10..17 は `bg-accent` / `text-info` / `border-warn` 等を直接使用可
- 型/設定シグネチャ: `postcss.config.mjs` は `{ plugins: { "@tailwindcss/postcss": {} } }`、`tailwind.config.ts` は `Config` 型で `content` glob のみ、`tokens.test.ts` は CSS ファイルを `readFileSync` して token / bridge / fallback を検証する
- 使用例: `className="bg-accent text-accent-ink rounded-md shadow-sm"` は `globals.css @theme inline` 経由で 09b token に解決される
- エラーハンドリング: build 失敗時は Tailwind v4.0.x patch 範囲で pin を調整し、HEX gate 失敗時は fallback ブロック外の直書きを token 参照へ置換する
- エッジケース: OKLch 非対応ブラウザは `@supports not (color: oklch(...))` 内の sRGB fallback のみ許可し、`apps/api/**` 差分は AC-12 で fail とする
- 設定可能パラメータ/定数: `tailwindcss@~4.0.0`、`@tailwindcss/postcss@~4.0.0`、`--ubm-*` token 名、`@theme inline` bridge 名、`content` glob、HEX grep 対象 path

### Task 12-2. システム仕様書更新（Step 1-A/B/C）

#### Step 1-A: `docs/00-getting-started-manual/specs/` 配下の更新候補

| 対象 | 内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md`（task-08 成果物） | 「実装側 bridge は `apps/web/src/styles/globals.css` の `@theme inline` で完結する」追記 |
| `docs/00-getting-started-manual/specs/00-overview.md` | UI build pipeline 章（あれば）に Tailwind v4 採用と OKLch tokens bridge を追記 |

#### Step 1-B: `CLAUDE.md` の更新候補

「### `apps/web` env アクセス不変条件」セクションの直後 or「## UI prototype alignment / MVP recovery」セクションに、以下を追記候補として提示:

```markdown
### Tailwind v4 + OKLch tokens（task-09 成果物）

- `apps/web` のスタイルは Tailwind v4 + `--ubm-*` prefix の OKLch tokens で構成
- token 正本: `apps/web/src/styles/tokens.css`（task-08 値を写したもの）
- bridge: `apps/web/src/styles/globals.css` の `@theme inline { --color-*: var(--ubm-*) }`
- HEX 直書き禁止（task-18 verify-design-tokens で CI gate）
- token 値変更は task-08 (`specs/09b-design-tokens.md`) を更新してから tokens.css に反映する一方向同期
```

#### Step 1-C: `.claude/skills/aiworkflow-requirements/` 同期

- `indexes/quick-reference.md` / `indexes/resource-map.md` / `references/task-workflow-active.md` / changelog / artifact inventory に task-09 の current workflow を登録
- `topic-map.md` / `keywords.json` は generator 管理のため本 wave では手編集しない。generator 実行は実装 wave の Phase 12 で再実施

### Task 12-3. ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md` に以下を canonical absolute path で列挙:

- `docs/00-getting-started-manual/specs/09b-design-tokens.md`（更新有無）
- `CLAUDE.md`（追記有無）
- `apps/web/package.json` / `apps/web/postcss.config.mjs` / `apps/web/tailwind.config.ts` / `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` / `apps/web/app/layout.tsx` / `apps/web/app/styles.css`（削除） / `apps/web/tsconfig.json` / `apps/web/src/__tests__/tokens.test.ts` / `apps/web/src/__tests__/build-output.test.ts` / `apps/web/src/__tests__/__fixtures__/utility-probe.tsx`
- `pnpm-lock.yaml`
- `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/index.md` + phase-1〜13.md
- `outputs/phase-*/main.md` 一式

### Task 12-4. 未タスク検出レポート作成（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` に以下を記載（4 必須セクション）:

| 候補 | 苦戦箇所 | リスクと対策 | 検証方法 | スコープ |
| --- | --- | --- | --- | --- |
| TASK-W3-DARK-MODE-VALUE-DETERMINATION | dark OKLch 値決定 | デザイナー判断必要 / placeholder のまま運用継続 | 視覚検証（dark スクリーンショット）+ コントラスト比 ≥ 4.5:1 | task-08 延長 |
| TASK-W3-VERIFY-DESIGN-TOKENS-CI-GATE | CI gate 化 | 既存 task-18 で扱う / 本タスクではローカル shell のみ | task-18 仕様書に従う | 別 workflow |

該当タスクがない時も「該当なし」と明記して空ではないファイルを出力。

### Task 12-5. スキルフィードバックレポート作成（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を 3 章固定で作成:

- **テンプレ改善**: VISUAL_ON_EXECUTION の Phase 11 evidence セクション例として `preview-curl.log` + `generated-css-with-bridge.log` の 2 点セット運用を提案
- **ワークフロー改善**: build pipeline タスク（postcss / tailwind config）では Phase 4 RED に「生成 CSS 含有 grep」を含める運用を提案
- **ドキュメント改善**: 改善点なし（または具体提案）

### Task 12-6. タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下を確認:

- [ ] CONST_004: 実装区分が「実装仕様書」と明記
- [ ] CONST_005: 変更対象ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD すべて具備
- [ ] CONST_007: 1 サイクル完了スコープ（先送りなし。warm/cool 追加値決定は task-08 既存範囲、CI gate 化は task-18 既存範囲として duplicate 判定）
- [ ] Phase 1-13 全 13 ファイル + index.md が実体存在
- [ ] visualEvidence = VISUAL_ON_EXECUTION が一貫
- [ ] AC-1〜AC-12 が index と各 Phase で整合

## 状態語彙の更新

| レイヤ | フィールド | 値 |
| --- | --- | --- |
| workflow root | `metadata.workflow_state` / `index.md`「状態」 | `implemented-local`（実コード反映 + local PASS 証跡取得済み）。Phase 13 は user approval 待ち |
| Phase 別 | `phases[].status` | 各 phase 完了時に `completed` |

> 実装済みローカル状態として `implemented-local` を正本にする。commit・push・PR は Phase 13 の user approval 後にのみ実行する。

## 完了条件

- [ ] 6 必須タスクの 7 ファイルが実体出力されている
- [ ] documentation-changelog.md に canonical absolute path が列挙されている
- [ ] system spec 更新（Step 1-A/B/C）が完了 or no-op 判定が記録されている
- [ ] phase12-task-spec-compliance-check.md で CONST_004 / 005 / 007 すべて pass

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
