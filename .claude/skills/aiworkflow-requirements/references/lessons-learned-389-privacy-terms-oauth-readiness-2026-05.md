# task-389: Privacy / Terms public URL OAuth readiness 実装の苦戦箇所

> 対象タスク: `docs/30-workflows/completed-tasks/task-389-privacy-terms-pages-impl/`
> 同期日: 2026-05-03
> 実装範囲: `apps/web/app/{privacy,terms}/page.tsx` Server Component + metadata、`apps/web/app/{privacy,terms}/__tests__/page.test.tsx` semantic render test
> 関連 Issue: #389 (CLOSED → `Refs #389`)、#385 (web build regression、deploy ブロッカー)

---

## L-389-001: metadata canonical / robots を Server Component に固定する

### 苦戦点

Google OAuth consent screen の verification 要件は単に HTTP 200 で privacy / terms ページが返るだけでなく、
- 検索エンジンに index される（noindex 不可）
- canonical URL が production と一致する
- `<title>` / `<meta description>` が日本語で意味的に正しい
を満たす必要がある。Next.js App Router の `Metadata` API を Server Component で `export const metadata` する形を採らないと、
client component 化や middleware 注入になり、SSR build で metadata が prerender されず空 head になりうる。

### 採用解

`apps/web/app/{privacy,terms}/page.tsx` を **明示的に Server Component（`"use client"` なし）** とし、
`export const metadata: Metadata = { title, description, alternates: { canonical }, robots: { index: true, follow: true } }`
を export。`__tests__/page.test.tsx` で semantic render と metadata indexability を併せて固定する。

### 教訓

- OAuth verification 系の公開ページは Server Component + 静的 metadata 固定がデフォルト。client 化したくなる UI は別 island に切り出す
- robots `index: true, follow: true` を test で assertion することで、後続の noindex 誤設定 regression を検知できる
- canonical URL は production base URL を環境変数経由で参照し、staging / production で drift しないこと

---

## L-389-002: Google Form 連絡先 href を環境別参照化する

### 苦戦点

法務本文中の「お問い合わせ先」は本プロジェクトの canonical contact である Google Form (`responderUrl`) を指すべきだが、
ハードコードすると formId rotation 時に privacy / terms 双方を直接編集する必要が生じる。
また OAuth verification 担当者からは「連絡経路が機能していること」のスクリーンショット evidence を求められうる。

### 採用解

CLAUDE.md の「フォーム固定値」表（`responderUrl`）を SSOT として、privacy / terms 双方の連絡先 href を**同一の URL 定数**で参照する。
本実装では暫定として両ページに同 URL を直接埋めたが、formId rotation 時は CLAUDE.md と両ページの 3 箇所を同 wave で更新する不変条件として記録する。

### 教訓

- フォーム由来の連絡先は CLAUDE.md SSOT を一次正本に維持し、コード側は受信側として揃える
- formId rotation runbook には「privacy / terms / CLAUDE.md の 3 箇所同期」を明記する
- 連絡経路の機能確認は OAuth verification の同 wave で実施する（form の 200 レスポンスと一緒に）

---

## L-389-003: semantic render test で必須セクションの intent を固定する

### 苦戦点

privacy / terms 本文は法務最終文言が確定するまで暫定版のまま運用する必要があり、
テキストの細部を test で固定すると本文 churn のたびに test が壊れる。
一方で「Cookie / Analytics 記載」「反社条項」「制定日 / 最終改定日」のような **OAuth verification と国内法務の双方が要求する必須セクション** は欠落させてはならない。

### 採用解

`__tests__/page.test.tsx` は **必須セクション見出し（heading）と Google Form contact href の存在のみ** を assertion する。
本文の長文や具体的な日付は test で固定しない（render snapshot にもしない）。
これにより法務文言更新で test が頻繁に壊れず、構造的な regression（セクション欠落 / contact 削除 / metadata 漏れ）だけ検知できる。

### 教訓

- 法務 / 規約系の文書テストは「intent capture」レベル（必須セクション・必須リンク・metadata indexability）で止める
- snapshot test は legal text の churn と相性が悪いので避ける
- 文言の最終 PR は legal review 完了後に別 wave で当てる前提を unassigned-task または external blocker に分離する

---

## L-389-004: web build #385 regression と OAuth deploy のブロック依存

### 苦戦点

#385 (web build prerender failure) は GitHub 上で CLOSED だが、本タスク中に regression が再発し、
`pnpm --filter @ubm-hyogo/web build` が失敗する状態でも privacy / terms 「local 実装」は完了できてしまう。
このとき Phase 11 VISUAL evidence（staging / production HTTP 200・OAuth consent screenshot）を実測した気で
PASS にしてしまうと、deploy 後に runtime 404 / OAuth verification 拒否が顕在化する。

### 採用解

artifact 分類を `implementation / VISUAL_ON_EXECUTION` とし、Phase 11 を「web build green + user approval 後」に明確に委譲。
Phase 12 main.md と system-spec-update-summary.md の双方に
- web build blocked by #385
- staging / production HTTP 200 と OAuth consent screenshot は pending
- Phase 13 PR / commit / push / deploy は user-gated
を明記。`task-workflow-active.md` でも `implemented-local / web build blocked / Phase 13 blocked_until_user_approval` の status string で固定する。

### 教訓

- 「local 実装完了」と「OAuth verification 完了」は別ゲート。同一 task で両方を PASS 主張しない
- CLOSED Issue でも regression 再発時は `Refs #N` で参照し、deploy blocker として明示的に external blocker に積む
- VISUAL_ON_EXECUTION の Phase 11 は build green を前提条件として artifact 分類に含めると、後続レビューで gate を見落とさない

---

## OP-389-1: Phase 12 strict 7 ファイル + artifacts.json parity

`outputs/phase-12/` 配下 7 ファイル（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を必ず実体として作成し、
root `artifacts.json` と `outputs/artifacts.json` の parity（同 file list / 同 status）を Phase 12 完了主張前に確認する。本タスクでは `unassigned-task-detection.md` を 0 件記録（既存 `task-05a-privacy-terms-pages-001.md` を input として consume、新規追加なし）として明文化した。

## OP-389-2: unassigned-task の formalize と consume

本タスクは `docs/30-workflows/unassigned-task/task-05a-privacy-terms-pages-001.md` を historical input として consume し、`docs/30-workflows/completed-tasks/task-05a-privacy-terms-pages-001.md` へ移動する形で formalize した。同様の「unassigned が 1 件 → completed 1 root に吸収される」ケースでは、unassigned 側を物理削除せず completed-tasks/ への移動で履歴を保つ。
