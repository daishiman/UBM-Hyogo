---
task_root: docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/
synced_at: 2026-05-19
state: implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING
related_lessons:
  - lessons-learned-task-10-ui-primitives-2026-05.md
  - lessons-learned-task-10-followup-002-runtime-visual-axe-2026-05.md
  - lessons-learned-parallel-09-ux-cross-cutting-2026-05.md
related_specs:
  - docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md
  - docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md
  - docs/00-getting-started-manual/specs/09b-design-tokens.md
  - docs/00-getting-started-manual/specs/09c-primitives.md
  - docs/00-getting-started-manual/claude-design-prototype/styles.css
follow_ups:
  - UT-DSF-01 parallel-01 globals-css rhythm implementation
  - UT-DSF-02 parallel-03 AppShell layouts implementation
  - UT-DSF-03 parallel-04 shared page chrome implementation
  - UT-DSF-04 serial-05 page routes blueprint binding implementation
  - UT-DSF-05 serial-06 form response binding implementation
  - UT-DSF-06 serial-07 regression evidence implementation
  - UT-DSF-07 visual runtime production-equivalent screenshots
---

# parallel-02 prototype CSS rules port の苦戦箇所と知見

> 対象タスク: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/`
> 同期日: 2026-05-19
> 実装範囲:
> - `apps/web/src/styles/globals.css` の G3-1 / G3-2 / G3-3 marker block（member-card hover / tag-pill selector / data-visibility）
> - `apps/web/src/components/public/MemberFilters.client.tsx` に `data-component="tag-pill"` + `aria-selected` 付与
> - `apps/web/app/visual-harness/[name]/{page.tsx,VisualScenarios.client.tsx}`
> - `apps/web/playwright/tests/visual/parallel-02-css-rules.spec.ts`
> - Phase 11 evidence: 9 screenshot + 5 log（present）+ inventory ledger（pending entries 含む）
> - Phase 12 strict 7 outputs（root + parallel-02 双方）

---

## L-P02-001: 共有 `globals.css` の並列編集 prefix マーカー規約

### 状況

`apps/web/src/styles/globals.css` は全 parallel-XX サブワークフローが触る単一ファイル。
parallel-01（rhythm / spacing） / parallel-02（hover / selector / visibility） / parallel-03（layout） / parallel-04（page chrome）が
同 wave で merge されると、`@layer` 順序や cascade を壊す書き換え事故が起きやすい。

### 採用解

セクションを以下の prefix マーカーで責務分離する:

```css
/* === parallel-02 G3-1 member-card hover (start) === */
... rules ...
/* === parallel-02 G3-1 member-card hover (end) === */
```

- `parallel-XX` + サブ識別子（G3-1 等）+ 意図ラベルを必ず併記
- 先着優先（先にマージされた parallel が cascade 上位を取る）
- マーカーで囲んだ block は他 parallel が書き換え禁止

### なぜ

- `merge=union` を `.gitattributes` で `globals.css` に当てると、CSS の意味的順序（cascade）を壊し、hover / focus / aria-selected の selector specificity が逆転する。
- block 単位の意味的境界を維持するため、union ではなく **block-level 占有 + マーカー prefix** を採用する。

### 再発防止

- `.gitattributes` で `apps/web/src/styles/globals.css` は **明示的に union を当てない**（topic-map / resource-map で周知）。
- 衝突時は parallel-XX マーカー block を単位として手動マージ。
- 新規 parallel が globals.css に block を追加する場合、`parallel-XX <subid> <intent> (start/end)` フォーマットを必ず守る。

---

## L-P02-002: `VISUAL_RUNTIME_PENDING` / `implemented_local_evidence_captured` status vocabulary

### 状況

local Playwright で screenshot は取得済み（`outputs/phase-11/screenshots/*.png` 9 件）。
しかし production-equivalent runtime（Cloudflare Workers staging build + 実 D1 fixture）での再撮影は user-gated。
従来の `VISUAL` / `NON_VISUAL` の 2 値では「local 撮影済みだが production runtime 未確認」状態を表現できなかった。

### 採用解

quick-reference / resource-map / task-workflow-active の status vocabulary に **`VISUAL_RUNTIME_PENDING`** を正式に追加。
組み合わせは `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING`。

| 状態語 | 意味 |
| --- | --- |
| `VISUAL` | local + runtime 双方で visual evidence 取得済み |
| `VISUAL_ON_EXECUTION` | local 撮影済み、CI runtime job 実行で再現可能 |
| `VISUAL_RUNTIME_PENDING` | local 撮影済み、production-equivalent runtime 再撮影が user-gated で残置 |
| `NON_VISUAL` | UI ではなく visual evidence 不要 |

### なぜ

- 「local screenshot ≠ production runtime visual」境界を明示するため。
- user gate（commit / push / PR / staging deploy）を理由とした runtime 未確認を、状態語 1 つで識別できるようにする。

---

## L-P02-003: Phase 11 evidence 表の二層運用（`present` と `pending`）

### 状況

Phase 11 evidence inventory には、物理ファイルとして存在する evidence（local screenshot / typecheck log 等）と、
production runtime 撮影が user-gated で残置されている evidence の両方を記録したい。
しかし `verify-phase11-evidence-existence` validator は `Status=present` 宣言の path のみ物理存在を要求する。

### 採用解

Phase 11 evidence 表を **二層** で運用する:

| Status | 扱い |
| --- | --- |
| `present` | validator が物理存在を要求。欠落すると Phase 12 compliance check FAIL |
| `pending` | inventory ledger 上のみの記録。validator 対象外（user-gated 取得待ち） |

`outputs/phase-11/main.md` の evidence 表に `Status` 列を必ず置き、`present` と `pending` を混在させる。

### なぜ

- pending entry を ledger に残すことで、後続フォロー（UT-DSF-07 など）で何を撮り直すべきかが追跡可能。
- present のみ物理検証することで、user-gated 未完了が原因の false-negative を避ける。

---

## L-P02-004: `globals.css` を `merge=union` 不可ファイルとして明示

### 状況

`.gitattributes` には `docs/30-workflows/LOGS.md` や `.claude/skills/*/SKILL-changelog.md` など、行追加型ログに対し `merge=union` を適用している。
parallel 系で globals.css にも union を当てたい誘惑が出るが、CSS は cascade に意味があるため union は破壊的。

### 採用解

- `.gitattributes` には globals.css を **追加しない**（union 適用外を維持）
- resource-map / topic-map / lessons-learned 上で「globals.css は union 不可」を周知
- sync-merge resolver スクリプト（`pnpm sync:resolve`）の対象からも除外する

### なぜ

- CSS は行追加ではなく `@layer` / selector specificity / 宣言順序が意味の本体。union によって順序が崩れると hover / focus / aria-selected が機能しなくなる。

---

## L-P02-005: `unassigned-task/` 単一ファイル proto-spec から Phase 1-13 spec 昇格パス

### 状況

parallel-02 close-out 時点で 7 件の未タスクが残った（UT-DSF-01〜07）。
これらは `docs/30-workflows/unassigned-task/UT-DSF-NN-*.md` に **単一 markdown ファイル** として起票している。

### 採用解

unassigned-task proto-spec → Phase 1-13 fullspec の昇格パスを以下に固定:

1. proto-spec 起票（`docs/30-workflows/unassigned-task/UT-DSF-NN-<slug>.md` 1 file、acceptance / source / scope のみ）
2. 着手時に `task-specification-creator` skill で Phase 1-13 spec へ展開し、`docs/30-workflows/<slug>/` に昇格
3. 昇格完了後、元 proto-spec を `consumed_to: <path>` でクローズ
4. `references/task-workflow-active.md` と quick-reference に正式エントリ追加

### なぜ

- 7 件まとめての Phase 1-13 fullspec は line budget と context の双方で破綻する。proto-spec で「何が unassigned で誰が後続で取るか」だけ宣言し、必要時に展開する Progressive Disclosure を徹底する。

---

## L-P02-006: design-tokens fallback 併記ルール

### 状況

parallel-02 G3 marker block は `--ubm-dur-fast` / `--ubm-ease-standard` を多用するが、これらは parallel-01（globals-css rhythm）で定義される。
parallel-02 と parallel-01 が同時着手中だと、parallel-01 token 未定義状態で parallel-02 がデプロイされる risk がある。

### 採用解

token 参照には **必ず fallback を併記** する:

```css
transition: background var(--ubm-dur-fast, .15s) var(--ubm-ease-standard, ease);
```

- duration token: `var(--ubm-dur-fast, .15s)` / `var(--ubm-dur-base, .2s)`
- easing token: `var(--ubm-ease-standard, ease)` / `var(--ubm-ease-emphasized, cubic-bezier(.2,0,0,1))`

### なぜ

- parallel-01 と parallel-02 のマージ順序に依存せず単独で動作可能にする。
- parallel-01 完了後も fallback は残置（runtime 影響なし、defensive 保険として継続）。

---

## L-P02-007: canonical 9 headings の root と sub-workflow 本文密度差

### 状況

`verify-phase12-compliance` は root と sub-workflow（parallel-02 等）双方の Phase 12 compliance file に canonical 9 headings を要求する。
ただし root では「1.x 中学生レベル概念説明」を含むのに対し、sub-workflow では同節を簡略化したい場合がある。

### 採用解

canonical heading 一致は SSOT。**ただし本文密度（節内記述量）は workflow 階層で差を許容**する:

- root: 1.x 中学生レベル説明 + technical detail（フルセット）
- sub-workflow: 1.x heading 自体は必須、本文は parent workflow への参照で短縮可（`See root §1.1` 等）

`verify-phase12-compliance` は heading 一致しか見ないため、本文密度差は構造的に許容済み。

### なぜ

- sub-workflow ごとに中学生説明を全展開するとドキュメント爆発が起きる。
- parent への参照リンクで概念説明の SSOT を保ちつつ、heading 規約は守る。

---

## 集約された operations checklist

| OP | 内容 |
| --- | --- |
| OP-P02-1 | globals.css 新規 block 追加時は `/* === parallel-XX <subid> <intent> (start/end) === */` フォーマットを使う |
| OP-P02-2 | status vocabulary に新値を入れたら quick-reference / resource-map / task-workflow-active を同 wave で同期する |
| OP-P02-3 | Phase 11 evidence 表に `Status` 列（`present` / `pending`）を必ず置く |
| OP-P02-4 | `.gitattributes` に globals.css を含めない（union 適用外維持） |
| OP-P02-5 | proto-spec → Phase 1-13 spec 昇格は task-specification-creator 経由で 1 件ずつ展開する |
| OP-P02-6 | CSS の `var(--token-name)` は fallback を併記する |
| OP-P02-7 | sub-workflow Phase 12 compliance file は heading 必須 / 本文密度は parent 参照で短縮可 |

---

## 変更履歴

- 2026-05-19: 新規作成。parallel-02 close-out の苦戦箇所 7 件を体系化。
