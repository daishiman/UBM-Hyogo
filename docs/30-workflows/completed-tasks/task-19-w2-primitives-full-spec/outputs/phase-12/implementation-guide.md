# Implementation Guide

## Part 1: 中学生レベル

### なぜこの作業が必要なの？

たとえば、料理本を書くときに「玉ねぎ」「にんじん」など材料の名前と切り方を最初に決めずに、いきなりレシピを書き始めたらどうなるでしょうか。途中で「玉ねぎ」と「タマネギ」が混ざったり、誰かが違う野菜を持ってきたりして、できあがる料理がバラバラになってしまいます。

UBM 兵庫支部会のサイトも同じで、画面ごとに違うボタンや違う色を使うと、利用者が混乱してしまいます。それを防ぐために、画面で何度も使う部品（これを primitive と呼びます）の作り方を 1 冊のカタログにまとめる必要があるのです。

### 何が変わるか

このカタログ（`09c-primitives.md`）ができたことで、後から React で実装する人は、自分の感覚で部品を作るのではなく、必ずこのカタログを正本として読みに来ます。たとえば「ボタンの角は何ピクセル丸める」「文字の大きさはトークン（色見本帳のような共有ルール）を使う」といった決まりを 1 箇所で確認できます。

カタログに「色の数字」や「ピクセル数」を直接書いてしまうと、後でデザインを変えたいときに全部書き直しになってしまうので、専用のチェックスクリプト（`scripts/verify-09c-no-visual-values.sh`）で「直接書きが 0 件」を機械的に確認するしくみも置きました。これが const taxonomy（部品名のルール）と placeholder token gate（仮の名前を残さない関門）の意義です。

このタスク自体はドキュメントだけを更新する NON_VISUAL タスクなので、画面のスクリーンショットは作りません。次の task-10（実際に React で primitive を実装するタスク）が、このカタログを唯一の正本として読みに来ます。

### 今回作ったもの

- `docs/00-getting-started-manual/specs/09c-primitives.md`（17 個の primitive を 1172 行にまとめたカタログ）
- `scripts/verify-09c-no-visual-values.sh`（HEX / oklch / px / placeholder の混入を 0 件に保つ機械的ゲート）
- aiworkflow-requirements の indexes / changelog / references に task-19 の入口を追加（後から検索でたどれるようにするため）

## Part 2: 技術者レベル

### 概要

task-19 は docs-only / NON_VISUAL タスクで、`docs/00-getting-started-manual/specs/09c-primitives.md` を canonical primitives spec として確立する。primary deliverable は 09c 本体・Phase 11 evidence・aiworkflow discoverability エントリ。実装コード（React component）は本タスクのスコープ外であり、task-10 で実体化される。

### 変更ファイル一覧

- `docs/00-getting-started-manual/specs/09c-primitives.md`（1172 行 / 17 JSX excerpts / 21 numbered headings / §99 含む）
- `scripts/verify-09c-no-visual-values.sh`（新規 / placeholder token と visual value の deterministic gate）
- `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md`（discoverability 追記）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（task-19 entry 追記）
- `docs/30-workflows/completed-tasks/task-19-w2-primitives-full-spec/` workflow 一式（artifacts.json / phase-01..13.md / outputs/phase-01..13/）

### TypeScript 型定義

本タスクは仕様 doc タスクで実装コードを伴わないため、09c-primitives.md に記述された primitive schema を TypeScript の `interface` / `type` 表現に正規化したものを以下に置く。task-10 の React 実装はこの型を契約として遵守する。

```ts
// 09c-primitives.md §1 から抽出した primitive 識別子集合
export type PrimitiveId =
  | "Chip"
  | "Avatar"
  | "Button"
  | "IconBtn"
  | "Switch"
  | "Segmented"
  | "Field"
  | "Input"
  | "Textarea"
  | "Select"
  | "Search"
  | "Drawer"
  | "Modal"
  | "Toast"
  | "KVList"
  | "LinkPills"
  | "ZoneTone";

// 09c-primitives.md の各 §X.1〜X.6 サブセクション schema
export interface PrimitiveSpec {
  id: PrimitiveId;
  section: number;            // §2..§17
  jsxExcerpt: string;         // primitives.jsx からの転記（凍結正本）
  tokens: string[];           // 09b へ link する token 名のみ（HEX/oklch/px は禁止）
  ariaContract: AriaContract; // §X.4 アクセシビリティ契約
  variants: string[];         // §X.2 variant 列挙
  links: PrimitiveLinks;      // §X.6 / 09a/09b/09e/09f/09g への参照
}

export interface AriaContract {
  role?: string;              // 例: "dialog"
  ariaLabelRequired?: boolean; // icon-only Button / IconBtn は true
  ariaModal?: boolean;         // dialog / drawer / modal は true
  focusTrap?: boolean;         // dialog / drawer / modal は true
  escClose?: boolean;          // dialog / drawer / modal は true
}

export interface PrimitiveLinks {
  parent: "09a";
  tokens: "09b";
  related: Array<"09e" | "09f" | "09g">;
}
```

### APIシグネチャ

本タスクは仕様 doc 提供のため、ランタイム API ではなく「09c lookup 手順」と「verify script CLI」を契約として定義する。

```ts
// 09c-primitives.md からの primitive lookup（task-10 以降で参照する擬似 API）
export function lookupPrimitive(id: PrimitiveId): PrimitiveSpec;
export function listPrimitives(): PrimitiveSpec[];

// 09c の構造を機械的に検証する CLI（実装は scripts/verify-09c-no-visual-values.sh）
// 戻り値: exit code 0 = PASS / 非 0 = FAIL
export type VerifyResult = {
  hex: number;                  // 必ず 0
  oklch: number;                // 必ず 0
  px: number;                   // 必ず 0
  bgBracket: number;            // 必ず 0
  placeholderTokenSized: number;     // 必ず 0
  placeholder09bTokenValue: number;  // 必ず 0
  placeholderTokenMix: number;       // 必ず 0
  numberedHeadings: number;     // 21 を期待
  section99: number;            // 1 を期待
  jsxBlocks: number;            // 17 を期待
};
export function validate09cPrimitivesSpec(): VerifyResult;
```

### 使用例

09c-primitives.md を正本として参照するときの代表的な手順を bash / ts で示す。

```bash
# 1. primitive のサブセクションを grep で引く（例: Button §4.4 アクセシビリティ）
grep -n "^### 4.4" docs/00-getting-started-manual/specs/09c-primitives.md

# 2. 09c に visual value 混入がないかを機械的に検証
bash scripts/verify-09c-no-visual-values.sh
# expected: exit code 0 / "OK" 出力

# 3. §99 不採用 primitive 列挙の確認
grep -nE "TweaksPanel|data-theme switcher|AvatarStoreProvider#localStorage" \
  docs/00-getting-started-manual/specs/09c-primitives.md
```

```ts
// task-10 React 実装側の利用イメージ（型契約の参照）
import type { PrimitiveSpec, PrimitiveId } from "@/types/primitives";

const buttonSpec: PrimitiveSpec = lookupPrimitive("Button");
// buttonSpec.tokens は "color.fg.primary" のような token 名のみで、
// HEX/oklch/px は含まれない（09b 側の正本で値解決する）。
```

### エラーハンドリング

仕様 doc タスクでは「ランタイム例外」ではなく「gate failure」をエラーとして扱う。

| エラー種別 | 検出箇所 | 期待挙動 |
|------------|----------|----------|
| HEX / oklch / px / `bg-[` を 09c 本体に直書きした | `scripts/verify-09c-no-visual-values.sh` | grep カウントが 1 件以上で exit 非 0 / Phase 11 FAIL |
| placeholder token (`token-sized` / `09b-token-value` / `token-mix`) が残置 | 同上 | exit 非 0 / Phase 11 FAIL |
| numbered heading 数が 21 から逸脱 | 同上の heading-count | AC-2 違反として FAIL |
| §99 から TweaksPanel / data-theme switcher / AvatarStoreProvider#localStorage のいずれかが脱落 | 同上 | AC-7 違反として FAIL |
| primitives.jsx の凍結正本に逆編集が入った | レビュー / git diff | AC-9 違反 / 仕様破綻として revert 必須 |

run-time における recover 戦略はなく、いずれも spec 修正で解消する。`pnpm sync:check` および CI gate `verify-indexes-up-to-date` は別系統で aiworkflow indexes drift を検出する。

### エッジケース

- **JSX inline 転記の保持**: prototype excerpt をそのまま記述することで visual spec が token 名へ正規化されているか機械的に検査できる（AC-10 / AC-11）。エッジ: token に解決できない一過性 literal がある場合は §99 に隔離する。
- **EDITMODE 専用 primitive**: 本仕様から除外し §99 に列挙する（AC-13）。混入時は verify script ではなく review で検出する。
- **隣接ブランチ差分**: 本ワークツリーには `apps/api/src/repository/identity-conflict.ts` の STABLE_KEY 改善が同居しているが、task-19 primary deliverable とは独立した branch diff として記録のみ行う（docs-only 境界は破られていない）。
- **outputs/artifacts.json の二重管理**: validator が root と outputs の同期を要求するため、本タスクでは Phase 13 経路で root を正本にコピーする運用とする。
- **markdownlint CLI 未導入**: リポジトリで `markdownlint-cli` が未配備のため、AC-16 は構造的 gate（heading-count + fenced-code imbalance check）で代替する。完全な lint ルール網羅は N/A。

### 設定項目と定数一覧

| 設定 / 定数 | 値 | 出典 | 意味 |
|------------|----|------|------|
| `MIN_LINES` | 600 | artifacts.json `primary_deliverable.min_lines` | 09c 本体の下限行数 |
| `MAX_LINES` | 1200 | artifacts.json `primary_deliverable.max_lines` | 09c 本体の上限行数 |
| `actual_lines` | 1172 | artifacts.json `metadata.validation.lines` | 実測行数 |
| `numbered_headings` | 21 | verify script 実測 | §1〜§18 + §99 + 内訳整合 |
| `section99` | 1 | verify script 実測 | §99 不採用 primitive 列挙の存在 |
| `jsx_blocks` | 17 | verify script 実測 | primitive JSX excerpt 数 |
| `HEX` / `oklch` / `px` / `bgBracket` | すべて 0 | verify script 実測 | visual literal 直書き禁止 |
| `placeholder-token-sized` / `placeholder-09b-token-value` / `placeholder-token-mix` | すべて 0 | verify script 実測 | placeholder 残置禁止 |
| `taskType` | `docs-only` | artifacts.json `metadata.taskType` | NON_VISUAL 判定の正本 |
| `visualEvidence` | `NON_VISUAL` | artifacts.json `metadata.visualEvidence` | screenshot 要件免除 |
| `coverage_ac_applicability` | `exempt` | artifacts.json | CONST_004 例外条件 |
| `const_refs` | `["CONST_005", "CONST_007", "CONST_004_exception"]` | artifacts.json | 適用 governance const |

### テスト構成

実装コードを持たないため `vitest` ユニットテストは無く、以下の deterministic gate を「テスト構成」として正本化する。

| レイヤ | 実体 | 期待結果 | 保存先 |
|--------|------|----------|--------|
| grep gate | `bash scripts/verify-09c-no-visual-values.sh` | exit 0 / "OK" / HEX=oklch=px=bgBracket=placeholder*=0 | `outputs/phase-11/evidence/grep-gate.log` |
| heading 構造 | heading-count（同 script 内 / 補助計測） | numbered=21 / §99=1 / jsx=17 | `outputs/phase-11/evidence/heading-count.log` |
| markdown 構造 lint | fenced-code imbalance check（構造的 gate） | imbalance 0 | `outputs/phase-11/evidence/markdown-lint.log` |
| 隣接コード回帰 | `pnpm exec vitest run apps/api/src/repository/__tests__/identity-conflict.test.ts apps/api/src/routes/admin/identity-conflicts.test.ts` | 2 files / 10 tests PASS | `outputs/phase-11/evidence/adjacent-code-test.log` |
| Phase output validator | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js <workflow>` | exit 0 | CI ローカル実行 |
| Phase 12 guide validator | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow <workflow>` | exit 0 | 同上 |
| Phase 11 coverage validator | `node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js --workflow <workflow>` | NON_VISUAL warning のみで PASS | 同上 |

### 後続タスクへの前提条件

- task-10 ui-primitives: 09c-primitives.md の 17 primitives を React 実装の唯一の正本とする。primitives.jsx は参考扱い。
- task-11..17 screens: primitives 群を組み合わせる。新規 primitive を生やさない。
- task-06 contract index: 09-ui-ux.md から 09c への詳細 link は task-06 側の責務。09a/09b/09e/09f/09g の実体ファイル名解決も task-06 で行う。
