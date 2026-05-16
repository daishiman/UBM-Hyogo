# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | profile mutation 成功後の RequestPendingBanner 即時反映 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / VISUAL |
| 実装区分 | ui-bugfix |
| 実装区分 判定根拠 | Phase 1〜11 で完成した dialog 2 ファイル修正 + spec 2 ファイル追加 + Playwright screenshot を、aiworkflow-requirements skill / task-specification-creator skill / 親 workflow ui-prototype-alignment-mvp-recovery 配下のドキュメントへ正本として引き継ぐ Phase。strict 7 outputs を作成する。 |

---

## 目的

Phase 1〜11 の成果物（コード差分 + Playwright evidence）を 6 必須タスク（strict 7 outputs）として正本同期する。本タスクは UI client component の小規模 bugfix のため、`docs/00-getting-started-manual/specs/*.md` への直接編集はなし（Step 2 は条件付きスキップ）。

---

## なぜ正本同期が必要か（中学生レベル）

「玄関のチャイムが鳴った直後に、宅配の到着お知らせカードがすぐに玄関ボードに貼り出される」ように直したのが本タスク。

Phase 12 では「**家族共有の取扱説明書のどこに何を書いたか / 後片付けは誰がやるか**」を確定する。

- 取扱説明書（aiworkflow-requirements skill）: 今回は新しい仕組みを足したわけではないので「修正済」と一言だけメモして終わる
- 改修日誌（documentation-changelog）: 「2026-05-15 マイページの即時反映バグ修正」と書く
- 未割当タスクの付箋（unassigned-task-detection）: 今回は新たに見つけた付箋はない
- スキルへのフィードバック（skill-feedback-report）: spec 作成スキルに改善ネタがあれば書く

---

## 必須 outputs（strict 7）

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## 12-1. implementation-guide.md（Phase 13 PR 本文に直接転記される）

### Part 1 — 中学生レベル概念説明

| 概念 | 例え |
| --- | --- |
| dialog | ボタンを押すと前面に出てくる「お知らせカード」 |
| mutation | サーバーに「これお願い」と頼む手紙 |
| router.refresh() | ページ全体を作り直すのではなく、サーバー側のデータだけ最新に取り直すボタン |
| pendingRequests | 「申請が今並んでいるよ」とサーバーから返ってくるリスト |
| RequestPendingBanner | 申請中の人に「あなたの申請、受け取ったよ」と画面上に出す札 |
| 呼び出し順序固定 | 札を出す前に「家を片付ける」のではなく「先に札を貼って、後で家を片付ける」順を守る |

### Part 2 — 技術契約

| 項目 | 契約 |
| --- | --- |
| 変更対象 | `apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog}.tsx` の `onSubmit` success branch のみ |
| import 追加 | `import { useRouter } from "next/navigation";`（既存 `RequestActionPanel.tsx` と同一） |
| 宣言位置 | 関数 component 冒頭、`useId` 群の直後に `const router = useRouter();` |
| 呼び出し順序 | `router.refresh() → onSubmitted(res.accepted) → onClose()` の 3 段固定 |
| failure branch | 変更なし。`else` / `catch` で refresh を呼ばない |
| 重複 refresh | Phase 10 で `RequestActionPanel` 側 refresh を削除し、accepted response bridge state に再構成済み |
| 既存 API | `apps/api` への変更なし。`POST /api/me/visibility-request` / `POST /api/me/delete-request` のシグネチャ不変 |
| D1 / OKLch | 変更なし |
| テスト追加 | `*.component.spec.tsx` に「success → refresh 1 回 called」「409 → refresh not called」を 2 dialog 分追加 |

### Part 3 — 変更ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | `useRouter` import / 宣言 / success branch に `router.refresh()` 先頭追加 |
| 編集 | `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | 同上 |
| 編集 | `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | `useRouter` mock + TC-RR-01 / TC-RR-02 追加 |
| 編集 | `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | `useRouter` mock + TC-RR-03 / TC-RR-04 追加 |
| 編集 | `apps/web/app/profile/_components/RequestActionPanel.tsx` | `router.refresh()` を削除し、`QueueAccepted` bridge state で banner を即時表示 |
| 確認 | `apps/web/app/profile/page.tsx` | `dynamic = "force-dynamic"` + `revalidate = 0` の維持確認 |

### Part 4 — 主要関数シグネチャ

```ts
// VisibilityRequestDialog.tsx (success branch のみ抜粋)
import { useRouter } from "next/navigation";

export function VisibilityRequestDialog({ ... }: VisibilityRequestDialogProps) {
  const router = useRouter();
  // ...
  const onSubmit = async () => {
    // ...
    if (res.ok) {
      router.refresh();        // 1)
      onSubmitted(res.accepted); // 2)
      onClose();                 // 3)
    }
    // ...
  };
}
```

`DeleteRequestDialog.tsx` も同一パターン。

### Part 5 — 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `VisibilityRequestDialog.onSubmit` | reason, desiredState | void | success 時に `router.refresh()` で `/me/profile` 再 fetch / `onSubmitted` 経由 parent state 更新 / `onClose` 経由 unmount |
| `DeleteRequestDialog.onSubmit` | reason, confirmed | void | 同上（`requestDelete` 経由） |

### Part 6 — テスト方針

| テストレイヤ | 対象 | 想定ケース |
| --- | --- | --- |
| unit (component) | VisibilityRequestDialog | TC-RR-01: success → refresh 1 回 / TC-RR-02: 409 → refresh not called / 既存 6 ケース non-regression |
| unit (component) | DeleteRequestDialog | TC-RR-03: success → refresh 1 回 / TC-RR-04: 409 → refresh not called / 既存ケース non-regression |
| unit (component) | RequestActionPanel | 既存 12 ケース non-regression |
| e2e (Playwright) | /profile | mutation 後 banner 即時表示の screenshot 5 枚取得 |

### Part 7 — ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- VisibilityRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- DeleteRequestDialog
mise exec -- pnpm --filter @ubm-hyogo/web test -- RequestActionPanel
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile
```

### Part 8 — 設計判断

| 判断 | 理由 |
| --- | --- |
| dialog ローカルで `useRouter` を呼ぶ | dialog の成功要件として banner 反映を内包し parent 依存を減らす |
| 順序を refresh → onSubmitted → onClose に固定 | unmount 後の navigation API 警告を回避（race condition 回避） |
| failure では refresh を呼ばない | 不要な server 往復を抑え 429 risk を増やさない |
| 重複 refresh を削除 | de-duplicate 保証に依存せず、dialog local refresh + parent bridge state に一本化 |
| optimistic update は採用しない | spec.md S1「server state を正本にする」方針に従う |

### Part 9 — 検証手順

ローカル:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- profile
```

手動（テストアカウント `manju.manju.03.28@gmail.com`）:

1. `/profile` 遷移 → banner 非表示確認
2. 公開停止 → dialog → 申請送信 → banner 即時表示確認
3. （任意）退会申請も同様

### Part 10 — ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| コード | `git revert <commit_hash>` で 4 ファイルを元に戻す |
| 副作用 | サーバー側 / D1 / Cloudflare 設定への変更なし。コード revert のみで完全ロールバック |

### Part 11 — DoD（Definition of Done）

- [ ] VisibilityRequestDialog.tsx success branch で `router.refresh() → onSubmitted → onClose` 順
- [ ] DeleteRequestDialog.tsx success branch で同様
- [ ] failure branch で refresh が呼ばれない
- [ ] 新規 4 テストケース（TC-RR-01〜04）green
- [ ] 既存テスト non-regression（VisibilityRequestDialog 6 / Delete 既存 / RequestActionPanel 12）green
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @ubm-hyogo/web test` PASS
- [ ] Playwright screenshot 5 枚取得（外部実施可）
- [ ] PR 本文に screenshot 参照を含む

---

## 12-2. system-spec-update-summary.md（要点）

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md` 末尾に「実装は `docs/30-workflows/parallel-02-state-sync-router-refresh/` で完了」とクロスリンク追記 |
| Step 1-B | 実装状況 | `implemented_local_visual_evidence_captured` / visual screenshots captured / Phase 13 user-gated |
| Step 1-C | 関連タスク | UI prototype alignment workflow 配下の他 parallel タスク（parallel-01, parallel-03 等）は独立。影響なし |
| Step 2 | システム仕様反映 | `docs/00-getting-started-manual/specs/*.md` への編集は **なし**。本タスクは既存仕様に対する内部実装の bugfix で、契約は変わらない。aiworkflow-requirements skill の references / indexes への追記も不要 |

---

## 12-3. documentation-changelog.md（要点）

| 日付 | 範囲 | 内容 |
| --- | --- | --- |
| 2026-05-15 | docs/30-workflows/parallel-02-state-sync-router-refresh/ 配下新規 | Phase 1-13 仕様書 + artifacts.json |
| 実装日 | apps/web/app/profile/_components/ 内 4 ファイル | `router.refresh()` 追加 / `useRouter` mock テスト追加 |
| 実装日 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md | クロスリンク追記のみ |

---

## 12-4. unassigned-task-detection.md（要点）

- 本サイクルで新たに発見した unassigned task: **なし**
- 親 workflow (ui-prototype-alignment-mvp-recovery) との独立性: 他 parallel 改善とは完全に独立（責務分離）
- Phase 10 で `RequestActionPanel` 側 refresh を削除済み。新規 unassigned task なし

---

## 12-5. skill-feedback-report.md（要点）

- task-specification-creator skill: VISUAL bugfix で小規模 (4 ファイル ±66 行) のテンプレ運用は機能した。phase 10 が空に近くなる小規模タスクでも 13 phase 全てを揃える運用方針は維持
- aiworkflow-requirements skill: 本タスクでは references 直接編集なし。skill 参照のクエリも発生せず、改善提案なし

---

## 12-6. phase12-task-spec-compliance-check.md（要点）

| 4 条件 | 充足状況 |
| --- | --- |
| 価値性 | 充足（mutation 後 banner 即時反映） |
| 実現性 | 充足（既存 API / page directive で実現） |
| 整合性 | 充足（不変条件 7 件 PASS） |
| 運用性 | 充足（failure path で refresh しない） |

| 30 種コンプライアンス（compact） | 状態 |
| --- | --- |
| 変更ファイル一覧 (CONST_005) | あり |
| 関数シグネチャ | あり |
| 入出力・副作用 | あり |
| テスト方針 | あり |
| ローカルコマンド | あり |
| 設計判断 | あり |
| 検証手順 | あり |
| ロールバック | あり |
| DoD | あり |
| 中学生レベル説明 (Part 1) | あり |
| ... 他 20 項目 | strict 7 outputs に含まれる範囲で充足 |

---

## 完了条件

- [ ] strict 7 outputs が `outputs/phase-12/` に配置されている
- [ ] `implementation-guide.md` に Part 1〜11 が揃っている
- [ ] `system-spec-update-summary.md` に Step 1-A / 1-B / 1-C / Step 2 の判定が明記されている（Step 2 はスキップ判定）
- [ ] `unassigned-task-detection.md` に独立性確認が記録されている

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13 (PR・振り返り)
- 引き継ぎ:
  - `implementation-guide.md` Part 3 + 8 + 9 + 10 → PR 本文「変更ファイル / 設計判断 / 検証手順 / ロールバック」
  - `outputs/phase-11/screenshots/` → PR 本文スクリーンショット参照
- ブロック条件: strict 7 outputs に欠落、または `apps/api` への変更混入が検出された場合は実行しない

---

## 参照

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md`（原典）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-12.md`（フォーマット参考）
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs ルール）
