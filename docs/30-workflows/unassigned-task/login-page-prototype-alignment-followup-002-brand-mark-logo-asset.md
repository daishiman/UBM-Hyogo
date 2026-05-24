# login-page brand-mark を UBM 公式ロゴアセットへ差し替え - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | login-page-prototype-alignment-followup-002-brand-mark-logo-asset                               |
| タスク名     | login ページ brand-mark を "兵" 文字暫定から UBM 公式ロゴ画像アセットへ差し替え                 |
| 分類         | 改善 / asset replacement                                                                        |
| 対象機能     | `/login` ページ LoginCard 上部 brand-mark 表示（プロトタイプ pages-member.jsx LoginPage L4-65） |
| 優先度       | 低                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | pending (アセット入稿待ち)                                                                      |
| 発見元       | login-page-prototype-alignment Phase 12 (FU-LOGIN-002)                                          |
| 発見日       | 2026-05-23                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/login-page-prototype-alignment/`
- 親タスク状態: `implemented_local_visual_evidence_captured`
- 検知元 outputs: `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md`（FU-LOGIN-002）
- 関連実装:
  - `apps/web/app/login/_components/LoginCard.tsx` — brand-mark 暫定実装（"兵" 文字 + OKLch tokens）
  - `apps/web/src/styles/auth.css` — brand-mark の rhythm / size token
- プロトタイプ正本:
  - `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` LoginPage L4-65
- post-MVP 候補: 公式ロゴアセット入稿後にスケジュール確定

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

login-page-prototype-alignment では、CLAUDE.md「UI prototype alignment / MVP recovery」不変条件3「プロトタイプ正本順位」に従い、`docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` LoginPage を正本として `/login` ページ全体を `apps/web/app/login/` 配下に再構築した。

プロトタイプ LoginPage L4-65 では、LoginCard 上部に **UBM ブランドを表現する brand-mark**（円形コンテナ内にロゴマーク）を配置するセマンティクスが定義されている。本来このマークは **UBM 兵庫支部会の公式ロゴ画像アセット**を配置すべき箇所だが、ワークフロー実行時点で公式ロゴアセットの入稿が未完了だったため、暫定的に漢字 "兵" 一文字を OKLch token (`--color-brand-primary`) で描画し、視覚的セマンティクスとプロトタイプ alignment を成立させた。

### 1.2 問題点・課題

- "兵" 文字暫定は UBM 兵庫支部会のブランドアイデンティティを完全には反映しない（公式ロゴではない代替表現）
- プロトタイプの brand-mark セマンティクス（画像アセット想定）と実装（テキストノード）に乖離が残る
- 公式ロゴ入稿後に最小差分で差し替え可能な構造になっているかの最終確認が未実施
- a11y 観点で `<img alt="">` 文言が確定していない（テキストノードでは alt 不要、画像化時に alt 文言確定が必要）

### 1.3 放置した場合の影響

- MVP リリース後も "兵" 文字暫定が公開され、UBM ブランドの公式表現と一致しない状態が継続
- 後続のブランディング系タスク（OG image / favicon / メール署名等）と brand-mark の出典が分散し、アセット管理 SSOT が定まらない
- post-MVP で複数ページ（profile / public top 等）に brand-mark を展開する際、暫定実装が分岐の起点になり技術債務化する

---

## 2. 何を達成するか（What）

### 2.1 目的

UBM 公式ロゴ画像アセット入稿後、`/login` ページ LoginCard の brand-mark を "兵" 文字暫定から正式な画像アセットへ差し替え、プロトタイプ正本のセマンティクスと実装を一致させる。

### 2.2 最終ゴール

- `apps/web/public/` 配下に UBM 公式ロゴアセットが配置（ファイル名・形式は入稿仕様で確定）
- `apps/web/app/login/_components/LoginCard.tsx` の brand-mark が `<img>`（または `next/image`）に差し替え済み
- a11y alt 文言が確定し、screen reader で "UBM 兵庫支部会" のブランド表現が伝達される
- `apps/web/src/styles/auth.css` の brand-mark サイズ token と画像アセットの aspect ratio が整合
- Playwright visual snapshot が新 brand-mark を含む baseline に更新済み

### 2.3 スコープ

#### 含むもの

- 画像アセット配置（`apps/web/public/` 配下、ファイル名・形式は入稿時確定）
- `apps/web/app/login/_components/LoginCard.tsx` の "兵" テキストノード → `<img>` / `next/image` 差し替え
- a11y alt 文言の確定（例: `alt="UBM 兵庫支部会"` 等、入稿時にコピーライティングと合わせて確定）
- `apps/web/src/styles/auth.css` の brand-mark サイズ / aspect ratio 調整
- Playwright visual baseline の更新（login-page workflow Phase 11 evidence 再取得）

#### 含まないもの

- **ロゴデザイン自体の制作**（外部入稿スコープ・本タスクの前提条件）
- favicon / OG image / メール署名等の他面ブランドアセット展開（別タスク化）
- profile / public top 等への brand-mark 横展開（post-MVP の別タスク）
- 新規ブランド primitive の追加（CLAUDE.md 不変条件3 違反）

### 2.4 成果物

- `apps/web/public/<logo-asset>` ファイル
- `LoginCard.tsx` の差し替え差分
- `auth.css` の brand-mark token 調整差分（必要時）
- 更新後 Playwright visual snapshot
- 親 workflow Phase 12 の FU-LOGIN-002 を consumed に更新

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 公式ロゴアセット未入稿状態で UI alignment を完了させる必要

login-page-prototype-alignment workflow は MVP recovery スコープの一部であり、公式ロゴアセットの入稿スケジュールに依存せずに UI 構造を確定する必要があった。プロトタイプ正本（pages-member.jsx LoginPage L4-65）は brand-mark を画像セマンティクスとして定義していたが、入稿待ち状態のままワークフローを停止させると MVP recovery 全体のクリティカルパスがブロックされる。

### 3.2 "兵" 文字暫定で MVP を成立させた判断

以下の制約のもと、"兵" 一文字の漢字を OKLch token で描画する暫定実装を採用した:

- **セマンティクス保全**: 円形コンテナ + ブランドカラー + 中央配置という brand-mark の視覚的構造はプロトタイプと完全に一致させる
- **入稿後の差分最小化**: テキストノード → `<img>` への差し替えが LoginCard.tsx 1ファイルの局所変更で完結する構造を維持
- **a11y 暫定対応**: テキストノードのため screen reader は "兵" を読み上げるが、入稿時に `<img alt>` で正式なブランド名表現に切り替え可能
- **token 整合**: `--color-brand-primary` を使用し、画像アセット入稿後も同じ視覚レイヤー（auth.css の brand-mark サイズ token）を再利用可能

### 3.3 入稿後の差分最小化設計

差し替え時に変更が発生する範囲を以下に限定する設計とした:

- `LoginCard.tsx`: brand-mark JSX node のみ（コンポーネント構造・props は変更しない）
- `auth.css`: 既存の brand-mark サイズ token を流用、aspect ratio 微調整のみ
- Playwright snapshot: visual baseline 再生成（spec 自体は変更しない）

ロゴ入稿時にデザインチーム側で aspect ratio / safe area / 最小サイズが確定すれば、上記 3 点の更新のみで本タスクは完了する。

### 3.4 横展開メモ

- 公式ロゴアセット入稿時は、login 以外の面（favicon / OG image / メール署名 / profile / public top）への展開計画を同時に確認し、アセット SSOT を `apps/web/public/` 配下に集約する
- `next/image` 採用時は Cloudflare Workers / OpenNext での image optimization 経路（loader 設定）を確認し、edge runtime での挙動を Phase 11 evidence に含める

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/public/` 配下に UBM 公式ロゴアセットが配置され、ファイル名・形式が入稿仕様と一致
- **AC-2**: `apps/web/app/login/_components/LoginCard.tsx` の brand-mark が "兵" テキストノードから `<img>` または `next/image` に差し替え済み
- **AC-3**: brand-mark の `alt` 属性が確定し、screen reader で UBM 兵庫支部会のブランド表現が伝達される（空 alt は不可）
- **AC-4**: `apps/web/src/styles/auth.css` の brand-mark サイズ token と画像アセット aspect ratio が整合し、プロトタイプ pages-member.jsx LoginPage L4-65 と視覚的に一致（目視レビュー OK）
- **AC-5**: Playwright visual snapshot（login-page workflow Phase 11 evidence）が新 brand-mark を含む baseline に更新済み
- **AC-6**: CLAUDE.md 不変条件3「プロトタイプ正本順位」と OKLch token 正本化（不変条件2）の双方を満たし、HEX 直書きや新規 primitive 追加を行っていない
- **AC-7**: 親 workflow Phase 12 `unassigned-task-detection.md` の FU-LOGIN-002 が consumed に更新済み

---

## 5. 参照資料

- `docs/30-workflows/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` — FU-LOGIN-002 検知元
- `docs/30-workflows/login-page-prototype-alignment/` — 親 workflow（`implemented_local_visual_evidence_captured`）
- `apps/web/app/login/_components/LoginCard.tsx` — brand-mark 暫定実装（"兵" 文字）
- `apps/web/src/styles/auth.css` — brand-mark サイズ / rhythm token
- `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` LoginPage L4-65 — プロトタイプ正本
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション — 不変条件2（OKLch トークン正本化）/ 不変条件3（プロトタイプ正本順位）
- `docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md` — followup フォーマット参考
