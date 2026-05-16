[実装区分: 実装仕様書]

# Phase 12: 正本同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | PARALLEL-01-NAV admin sidebar logo→/ 戻り動線 + members drawer→tags link |
| タスクID | PARALLEL-01-NAV |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 正本同期 |
| 前 Phase | 11 (VISUAL evidence) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | completed |
| taskType | implementation |
| visualEvidence | VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 1〜11 で実装した admin sidebar logo link / members drawer tags link を、aiworkflow-requirements skill / ui-prototype-alignment-mvp-recovery workflow / 完了タスク台帳に正本同期する Phase。strict 7 outputs 必須。 |

---

## 目的

Phase 1〜11 で確定した UI 動線（sidebar logo→`/` / drawer→tags）と Phase 11 で取得した VISUAL evidence を、以下の正本群へ同期する:

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` workflow 配下の Phase 1〜3 出力
- `aiworkflow-requirements` skill の references（必要なら）
- 完了タスク台帳（`completed-tasks/`）への移動準備
- PR 本文（Phase 13）への直接転記元データ

---

## なぜ正本同期が必要か（中学生レベル）

「家のリビングと玄関に新しい案内札（『ホームに戻る』『タグ管理へ』）を貼った」だけでは、家族や来客が
「あれ、この札いつ貼ったんだっけ？ なぜここにあるんだっけ？」と数ヶ月後に混乱する。

Phase 12 では「**案内札の意図と場所を取扱説明書の決まったページに書き加える作業**」を行う。

- 取扱説明書（`improvements/parallel-01-navigation/spec.md`）には設計判断と再現手順を記録
- ワークフロー進捗表（`completed-tasks/` 配下）に「PARALLEL-01-NAV 完了」を移動
- 取扱説明書の索引（aiworkflow-requirements skill の keywords / topic-map）に新しい案内札の話題を追記

---

## 必須 outputs（strict 7）

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須） |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須・テンプレ / ワークフロー / ドキュメント 3 観点固定） |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## 12-1. main.md（要点）

`outputs/phase-12/main.md` の目次:

1. 本 Phase 完了サマリ（実装 + リファクタ判定 + VISUAL evidence + 正本同期）
2. strict 7 outputs 一覧と相互リンク
3. 完了条件と DoD
4. Phase 13 への申し送り（PR タイトル / base / 設計判断 4 件）

---

## 12-2. implementation-guide.md（Phase 13 PR 本文に直接転記される）

`outputs/phase-12/implementation-guide.md` を Part 1〜11 構成で記述する。

### Part 1 — 中学生レベル概念説明

| 概念 | 例え |
| --- | --- |
| admin sidebar logo link | 「お店の入口に貼った『TOP に戻る』看板」。管理作業中でも 1 クリックで公開トップに戻れる |
| MemberDrawer tags link | 「会員カードの裏面に貼った『タグ管理ページへ』案内」。drawer を閉じずに該当会員のタグ管理画面へワープできる |
| `focusMemberId` searchParam | 「タグ管理ページが受け取る『今回は誰のタグを見るか』を伝えるメモ書き」。URL の `?memberId=...` に書かれる |
| `encodeURIComponent` | 「メモ書きに `/` や `@` のような特殊な文字が混ざっても壊れないように、安全な形に変換する作業」 |
| `next/link` の page transition | 「ドアを開けるとき、自動で前の部屋の電気を消してくれる仕組み」。drawer は遷移時に自動 unmount される |

### Part 2 — 技術契約

| 項目 | 契約 |
| --- | --- |
| AdminSidebar logo link | `<Link href="/" aria-label="ホームに戻る">` を `<nav aria-label="管理メニュー">` 直下、items ul の上部に配置 |
| MemberDrawer tags link | `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` を drawer footer area に配置 |
| 既存 API endpoint surface | 変更なし。`/admin/tags/page.tsx` の `focusMemberId` 既存 contract をそのまま使う |
| D1 schema 変更 | なし |
| Google Form 仕様変更 | なし |
| 色 / token | `var(--ubm-color-accent)` / `var(--ubm-color-border-default)` / `var(--ubm-color-accent)` を `apps/web/src/styles/tokens.css` 経由で参照 |
| a11y | logo link は `aria-label` 必須 / focus-visible outline。drawer link は text label 「タグ管理へ」で intent 明確化 |

### Part 3 — 変更ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `apps/web/src/components/layout/AdminSidebar.tsx` | `<Link href="/">` を sidebar 上部に追加 |
| 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | drawer footer に `/admin/tags?memberId=...` link を追加 |
| 参照のみ | `apps/web/app/(admin)/layout.tsx` | grid layout 確認用、変更なし |
| 参照のみ | `apps/web/src/app/(admin)/admin/tags/page.tsx` | `focusMemberId` 既存実装を維持 |
| 編集 | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | logo link 存在 / a11y assertion |
| 新規 | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | tags link 存在 / encode assertion |

### Part 4 — 主要関数シグネチャ

```ts
// apps/web/src/components/layout/AdminSidebar.tsx
export function AdminSidebar(): JSX.Element; // シグネチャ不変

// apps/web/src/features/admin/components/_members/MemberDrawer.tsx
export interface MemberDrawerProps {
  readonly memberId: string;
  readonly onClose: () => void;
}
export function MemberDrawer(props: MemberDrawerProps): JSX.Element; // シグネチャ不変
```

### Part 5 — 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `AdminSidebar()` | (props なし) | sidebar JSX | logo link 経由で `/` への navigation（next/link） |
| `MemberDrawer({ memberId, onClose })` | memberId, onClose | drawer JSX | tags link 経由で `/admin/tags?memberId={encoded}` への navigation。drawer は page transition で自動 unmount |

### Part 6 — テスト方針

| テストレイヤ | 対象 | 想定ケース |
| --- | --- | --- |
| unit | AdminSidebar.component.spec.tsx | logo link 存在 / `aria-label` / focus-visible |
| unit | MemberDrawer.spec.tsx | tags link 存在 / 特殊文字 memberId の percent-encoded href |
| e2e | admin-smoke | 9 admin routes 全て open / drawer → tags 遷移成功 / focusMemberId 反映 |
| static | typecheck / lint | 型整合 / lint PASS |
| visual | Playwright screenshot 2 枚 | sidebar logo link / drawer tags link の描画 |

### Part 7 — ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-smoke parallel-01-nav
```

### Part 8 — 設計判断

| 判断 | 理由 |
| --- | --- |
| 既存 API endpoint surface を変更しない | CLAUDE.md「UI prototype alignment」不変条件 1。`/admin/tags` の `focusMemberId` 既存 contract をそのまま利用 |
| logo link を独立 component に切り出さない | Phase 10 リファクタ判定で本タスク 1 箇所のみ使用のため YAGNI。将来 variant が増えた時点で followup 起票 |
| drawer link の onClose 手動呼び出しを行わない | next/link の page transition で drawer が自動 unmount されるため。明示呼び出しは race condition リスクを増やす |
| `encodeURIComponent` を必須化 | memberId は ULID 想定だが、将来 free-form id を扱う際の安全余白として強制 |

### Part 9 — 検証手順

ローカル:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test parallel-01-nav --update-snapshots
```

staging（外部実施）:

1. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
2. staging URL の `/admin` → sidebar logo クリック → `/` 到達確認
3. staging `/admin/members` → drawer → tags link → `/admin/tags?memberId=...` 到達確認
4. `focusMemberId` が TagQueuePanel に反映されていることを目視確認

### Part 10 — ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| デプロイ | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env <env>` |
| コード | `AdminSidebar.tsx` の `<Link href="/">` ブロックを削除 / `MemberDrawer.tsx` の tags link ブロックを削除 → 再 deploy |
| token / API | 変更なし（追加 secrets / endpoint なし） |

### Part 11 — DoD

- [ ] Phase 3〜7 実装 PR がローカル PASS
- [ ] Phase 9 AC 6 件全 [x]
- [ ] Phase 10 リファクタ判定マトリクスが文書化 / token grep 0 件
- [ ] Phase 11 mock fallback screenshot 2 枚 + canonical-paths.json + evidence 5 ログ配置（real screenshot は runtime pending）
- [ ] strict 7 outputs が `outputs/phase-12/` に配置
- [ ] PR 本文（Phase 13）が implementation-guide.md Part 3 / 8 / 9 / 10 を漏れなく転記している

---

## 12-3. system-spec-update-summary.md（要点）

詳細は `outputs/phase-12/system-spec-update-summary.md` を参照。

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/` を完了サイクル後に `completed-tasks/` 配下へ移動する手順を記載 |
| Step 1-B | 実装状況 | `spec_created` → `implementation_completed` → external ops (staging deploy) 完了で `completed` |
| Step 1-C | 関連タスク | UI prototype alignment / MVP recovery workflow の他 improvements (parallel-02..N) と独立 |
| Step 2 | システム仕様反映 | `improvements/parallel-01-navigation/spec.md` を本 Phase の最終形にロックし、追記が必要な場合は `documentation-changelog.md` に差分を記録 |

---

## 12-4. documentation-changelog.md（要点）

`outputs/phase-12/documentation-changelog.md` には以下を記録:

- 親仕様 `improvements/parallel-01-navigation/spec.md` への追記差分（なければ「変更なし」と明示）
- Phase 9 AC 受入結果 / Phase 10 リファクタ判定 / Phase 11 screenshot 取得結果のサマリ
- `aiworkflow-requirements` skill references への追記の必要性判定（本タスクは UI 動線のみで skill 追記不要、と判定の場合もその旨を明記）

---

## 12-5. unassigned-task-detection.md（要点）

詳細は `outputs/phase-12/unassigned-task-detection.md` を参照。**0 件でも出力必須**。

- 本サイクルで新たに発見した unassigned task の有無を判定
- 候補: (a) logo link 独立 component 化 followup（Phase 10 判定で不採用、将来切り出し条件記録済み） / (b) Playwright auth fixture 整備（Phase 11 mock 採用時のみ）
- 親 ui-prototype-alignment-mvp-recovery workflow の他 parallel-* improvements との独立性確認

---

## 12-6. skill-feedback-report.md（要点）

詳細は `outputs/phase-12/skill-feedback-report.md` を参照。**改善点なしでも出力必須**。3 観点固定:

| 観点 | 内容 |
| --- | --- |
| テンプレ | task-specification-creator skill の Phase 1〜13 テンプレが本タスク（小規模 UI 動線追加）に過不足なくフィットしたか |
| ワークフロー | improvements/parallel-01-navigation/spec.md の親仕様 → Phase 9〜13 展開の整合性 |
| ドキュメント | CLAUDE.md「UI prototype alignment」不変条件群が本タスクで遵守できたか |

---

## 12-7. phase12-task-spec-compliance-check.md（要点）

`outputs/phase-12/phase12-task-spec-compliance-check.md` には以下を記録:

- strict 7 outputs 全配置確認チェック
- implementation-guide.md Part 1〜11 全 part 存在チェック
- CONST_005（変更ファイル一覧 / シグネチャ / 入出力 / テスト / コマンド / DoD）違反なしの確認
- `apps/web` 不変条件（既存 API のみ接続 / OKLch tokens / D1 直接アクセス禁止）違反なしの確認

---

## 完了条件

- [ ] strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が `outputs/phase-12/` に配置
- [ ] implementation-guide.md に Part 1〜11 が揃っている
- [ ] system-spec-update-summary.md に Step 1-A / 1-B / 1-C / Step 2 が明記
- [ ] unassigned-task-detection.md に 0 件でも判定結果が記録
- [ ] skill-feedback-report.md に 3 観点（テンプレ / ワークフロー / ドキュメント）が記録
- [ ] phase12-task-spec-compliance-check.md に CONST_005 / 不変条件チェック結果が記録

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13 (PR・振り返り)
- 引き継ぎ:
  - `implementation-guide.md` Part 3 + 8 + 9 + 10 → PR 本文「変更ファイル / 設計判断 / 検証手順 / ロールバック」
  - `documentation-changelog.md` → PR 本文「Summary」
  - `unassigned-task-detection.md` → post-merge アクション
- ブロック条件: strict 7 outputs に欠落 / `apps/web` 不変条件違反混入 / `apps/api` への副作用混入

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 親仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md（存在する場合） | strict 7 outputs ルール |
| 必須 | CLAUDE.md「UI prototype alignment」 | 不変条件 |
| 参考 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-12.md | フォーマット参考 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| strict 7 | outputs/phase-12/main.md | 要点サマリ |
| strict 7 | outputs/phase-12/implementation-guide.md | PR 本文転記元（Part 1〜11） |
| strict 7 | outputs/phase-12/system-spec-update-summary.md | Step 1-A / 1-B / 1-C / Step 2 |
| strict 7 | outputs/phase-12/documentation-changelog.md | 仕様追記差分 |
| strict 7 | outputs/phase-12/unassigned-task-detection.md | unassigned task 判定（0 件でも出力） |
| strict 7 | outputs/phase-12/skill-feedback-report.md | 3 観点 feedback（改善点なしでも出力） |
| strict 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | CONST_005 / 不変条件チェック |
| メタ | artifacts.json | phase-12 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] strict 7 outputs 全配置
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-12 を completed に更新

---

作成日: 2026-05-15
