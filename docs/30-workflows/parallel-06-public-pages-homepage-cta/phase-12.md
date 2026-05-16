# Phase 12: ドキュメント / 振り返り

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 前 Phase | 11 |
| 次 Phase | 13 |
| 状態 | completed |

## 中学生レベル概念説明 (Part 1)

### 何をしたか

ウェブサイトのトップページの一番下に、「メンバー登録の Google フォームに飛べる目立つボタン」を追加しました。
ボタンは黒っぽい背景に、目立つ色で配置し、押すと別タブで Google フォームが開くようにします。

### なぜしたか

サイトの「設計図 (プロトタイプ)」には元々この目立つ案内ブロックがありましたが、実際に動いているサイトでは
作り忘れていました。会員になりたい人がフォームに辿り着きやすくするため、設計図通りに合わせました。

### どうやって作ったか

1. `CallToActionCTA` という小さな部品（コンポーネント）を新しく作りました
2. その部品を、トップページの一番下に置きました
3. フォームの URL は何度も書かないよう、`FORM_RESPONDER_URL` という名前で一箇所にまとめました

### 気をつけたこと

- 色は「token」と呼ばれる共通のパレットから選ぶルール（色コードを直接書かない）
- 別タブで開くリンクには、セキュリティ対策の `rel="noopener noreferrer"` を付ける
- スマホでも PC でも見やすいレイアウトにする

## 技術者レベル説明 (Part 2)

### 実装ガイド

- 新規: `apps/web/src/components/public/CallToActionCTA.tsx` + `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` + snapshot
- 編集: `apps/web/app/page.tsx`（CTA 追加）、`(public)/register/page.tsx`（fallback 統一）、`app/login/_components/LoginStatus.tsx`（fallback 統一）、`lib/constants.ts`（`FORM_RESPONDER_URL` export）、`vitest.config.ts`（既存 seed syntax suffix drift 補正）
- テスト: 新規 `CallToActionCTA.component.spec.tsx` の snapshot / axe a11y / external link / token assertion、既存 page spec の条件付き順序 assertion 追加
- Phase 11: desktop / mobile screenshot 4 件と typecheck / lint / test / build / grep / token gate 証跡を取得済

### システム仕様書更新サマリー

- `CLAUDE.md`「フォーム固定値」セクションは変更なし（値は同一、コード側で定数化）
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` は既に FOR MEMBERS CTA contract を持つため本文変更なし

### ドキュメント更新履歴

- 本ワークフロー `docs/30-workflows/parallel-06-public-pages-homepage-cta/` 新規追加（Phase 1-13 仕様書 + implemented-local evidence）
- `outputs/artifacts.json` と `outputs/phase-12/` strict 7 files を追加し、Phase 12 compliance の物理成果物を揃える
- `outputs/phase-11/` に screenshot / command evidence / canonical manifest を追加
- 親 `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-06-public-pages/spec.md` の DoD と本タスクを紐付け（Phase 13 PR 本文に記載）

### 未タスク検出レポート

- 該当なし（監査結果で `/register`, `/privacy`, `/terms` は OK 判定。法務確認後の `/privacy` / `/terms` 暫定→正式版は別タスクとして既存）。今回検出した `spec_created` 誤分類、Phase 11 未取得、URL literal 重複、AC-6 test 不足は同一サイクルで修正済。

### スキルフィードバックレポート

| 観点 | 内容 |
| --- | --- |
| テンプレ改善 | 小規模 UI コンポーネント追加タスクは Phase 7（performance/security）・Phase 10（deploy）の記述量が薄くなりがち。サイズ別テンプレ分岐の余地あり。 |
| ワークフロー改善 | 実 worktree に apps 差分がある場合は `spec_created` close-out ではなく implemented-local へ再分類する既存ルールを適用。追加 skill patch は不要。 |
| ドキュメント改善 | prototype 行番号（136-149）が変更されると spec drift する。prototype の section アンカー（`data-component` 等）で参照するのが理想。 |

### タスク仕様書コンプライアンスチェック

- index.md AC-1 〜 AC-10 と Phase 1-13 の整合: `implemented_local_evidence_captured`
- 実装区分明記: `implementation / VISUAL`。すべての Phase で `[実装区分: 実装仕様書]` 明記済
- CONST_005 必須項目: `apps/web` 実装差分、Phase 11 screenshot、local command evidence を反映済
- Phase 12 strict 7: `completed`。`outputs/phase-12/` に 7 ファイルを配置済み

## 完了条件

- 上記 6 セクションすべて記載
- Phase 11 evidence と本ドキュメントの記載が整合
