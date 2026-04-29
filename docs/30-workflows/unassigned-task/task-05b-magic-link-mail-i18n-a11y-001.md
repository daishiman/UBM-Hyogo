# Magic Link メール本文 i18n / a11y 改善 - タスク指示書

## メタ情報

| 項目         | 内容                                                  |
| ------------ | ----------------------------------------------------- |
| タスクID     | task-05b-magic-link-mail-i18n-a11y-001                |
| タスク名     | Magic Link メール本文 i18n / a11y 改善                |
| 分類         | UX / アクセシビリティ                                 |
| 対象機能     | `apps/api` mailer / `apps/web` `/login` 文言          |
| 優先度       | 低                                                    |
| 見積もり規模 | 中規模                                                |
| ステータス   | 未実施                                                |
| 発見元       | 05b Phase 12 unassigned-task-detection U-10           |
| 発見日       | 2026-04-29                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05b では Magic Link 認証の MVP として、`apps/api/src/services/mail/magic-link-mailer.ts` に「日本語固定 + plaintext fallback あり」の最小メール本文を実装した。Resend HTTP API を直接呼び出す最小実装とし、HTML テンプレートエンジン・locale 切替・mjml 風レイアウトは導入していない。これは provider 抽象化（不変条件 #5）と mail 失敗時 rollback テスト（F-11）に 05b のスコープを集中させるためである。

### 1.2 問題点・課題

- 文面が `buildMagicLinkMessage` 関数内のハードコード文字列で構成され、locale 切替経路が存在しない。
- HTML 側に screen reader 向けの aria 属性 / リンクの目的説明が無く、`<a href>` のラベルが URL 文字列そのものになっている。
- TTL（15 分）と再送導線の文言が `apps/web` の `/login` UI と二重管理になっており、文言ドリフトのリスクがある。
- subject が固定文字列で、英語ユーザー向けの分岐が無い。

### 1.3 放置した場合の影響

- 英語話者会員に対するアクセシビリティが落ち、MVP 後の会員拡張時に対応コストが累積する。
- screen reader 利用者にとって「何のリンクか」が読み上げ時点で曖昧になり、フィッシング誤認の余地が残る。
- 文言更新時に mailer / `/login` UI / docs の 3 箇所を個別に直す運用が固定化する。

---

## 2. 何を達成するか（What）

### 2.1 目的

Magic Link メール本文を「locale 切替可能」かつ「screen reader / plaintext クライアント双方で目的・期限・再送導線が明確」な状態に拡張し、`/login` UI 文言と単一の正本辞書から派生させる。

### 2.2 最終ゴール

- `buildMagicLinkMessage` が `locale: 'ja' | 'en'` を受け取り、対応する subject / text / html を返す。
- HTML 版に `lang` 属性、`<title>`、リンクの目的を説明するテキストノード、`aria-label` 相当のラベルが付与されている。
- plaintext 版が HTML 版と同等の情報（目的・URL・TTL・再送手順・問い合わせ先）を持つ。
- `apps/web` `/login` の文言と mailer の文言が同じ正本辞書から派生する、もしくは正本辞書の参照関係が明示されている。

### 2.3 スコープ

#### 含むもの

- `magic-link-mailer.ts` の i18n 化（ja/en の 2 locale）
- HTML テンプレートの a11y 改善（`lang`, `<title>`, リンク説明、十分なコントラストの最小スタイル）
- plaintext fallback の同等情報化
- locale 選択ロジック（リクエストヘッダ or ユーザー設定）の決定とドキュメント化
- `/login` 文言と mailer 文言の整合確認

#### 含まないもの

- 3 言語以上への拡張（ja/en のみ）
- mjml / react-email 等の本格テンプレートエンジン導入（plain string テンプレ + locale dictionary で完結させる）
- メールクライアント別レンダリング検証（Outlook 等の旧 client 個別対応）
- Magic Link 以外の通知メール（リマインダ等）の i18n 化

### 2.4 成果物

- `apps/api/src/services/mail/magic-link-mailer.ts` の差分（locale 引数追加）
- `apps/api/src/services/mail/locales/ja.ts` `en.ts`（または同等の dictionary）
- 単体テスト（locale ごとの subject / text / html スナップショット、a11y 必須属性の存在検査）
- `/login` 文言との整合チェック結果
- `magic-link-mailer.ts` 冒頭コメントの方針更新

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 05b（Magic Link provider + auth-gate state）が main にマージされている
- Resend HTTP API 経路の F-11 rollback テストが緑である
- `/login` UI の状態文言が確定している

### 3.2 依存タスク

- 05b 取り込み（必須前提）
- `apps/web` `/login` 状態 UI の文言確定

### 3.3 必要な知識

- Resend HTTP API のメール送信仕様
- HTML メールにおける a11y 制約（`<title>`, `lang`, インライン CSS の限界）
- 不変条件 #5（provider 抽象化）/ #10（失敗時 rollback）
- locale 選択戦略（Accept-Language vs ユーザー保存設定 vs 招待時の固定値）

### 3.4 推奨アプローチ

`buildMagicLinkMessage` の引数に `locale` を追加し、locale ごとの dictionary を `locales/{ja,en}.ts` で純粋関数として export する。テンプレートエンジンは導入せず、template literal + dictionary の最小構成に留める。a11y は HTML に `<title>`、`lang`、リンク前後の説明文、URL を画面読み上げで認識可能なテキストとして併記する形で対応する。`/login` 文言との整合は dictionary を `apps/api` 内で正本化し、`apps/web` 側は同義のメッセージ ID を独立に持つ運用とする（`apps/web` から `apps/api` を import しない）。

---

## 4. 実行手順

### Phase構成

1. 既存実装と文言の棚卸し
2. locale dictionary 設計
3. mailer i18n 化と a11y 拡張
4. テストと整合検証

### Phase 1: 既存実装と文言の棚卸し

#### 目的

mailer / `/login` UI / docs に散らばる文言を一覧化し、i18n 対象を確定する。

#### 手順

1. `magic-link-mailer.ts` 内のハードコード文字列を抽出
2. `apps/web` `/login` の状態別文言を抽出
3. 文言の意味単位で対応表を作成

#### 成果物

文言対応表（key → ja/en 文）

#### 完了条件

mailer / `/login` の全文言が key 化候補として一覧化されている

### Phase 2: locale dictionary 設計

#### 目的

`locales/ja.ts` `en.ts` の I/O とキー命名を確定する。

#### 手順

1. dictionary の型定義（`MagicLinkMailDictionary`）を設計
2. `buildMagicLinkMessage` の引数に `locale` を追加する API 変更を確定
3. locale fallback ルール（未対応 locale は ja に fallback）を決定

#### 成果物

dictionary 仕様メモ + 型定義案

#### 完了条件

ja/en dictionary が同じ key 集合を持ち、欠落時の fallback が定義されている

### Phase 3: mailer i18n 化と a11y 拡張

#### 目的

`buildMagicLinkMessage` を locale 対応にし、HTML / plaintext 双方の a11y を確保する。

#### 手順

1. `locales/ja.ts` `en.ts` を新規作成
2. `buildMagicLinkMessage` を locale 対応に変更
3. HTML 側に `lang` 属性、`<title>`、リンクの目的説明、TTL・再送導線を追加
4. plaintext 側に HTML と同等の情報（目的・URL・TTL・再送・無視時の案内）を追加
5. `magic-link-mailer.ts` 冒頭コメントの方針を「i18n 段階導入済み」に更新

#### 成果物

mailer 差分 + locale dictionary 実装

#### 完了条件

`buildMagicLinkMessage({ locale: 'en', ... })` が英語 subject / text / html を返し、HTML が `lang="en"` を持つ

### Phase 4: テストと整合検証

#### 目的

locale ごとの出力安定性と a11y 必須属性、`/login` 文言整合を保証する。

#### 手順

1. ja/en それぞれの subject / text / html スナップショットテスト
2. HTML に `lang` / `<title>` / リンク説明テキストが含まれることを assertion
3. plaintext に URL / TTL / 再送導線が含まれることを assertion
4. `/login` 文言と mailer 文言の意味整合を手動で確認

#### 成果物

テスト追加差分 + 整合確認ログ

#### 完了条件

全テスト緑かつ ja/en 双方で a11y 必須属性が検出される

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `buildMagicLinkMessage` が `locale: 'ja' | 'en'` を受け取る
- [ ] ja/en dictionary が同じ key 集合を持つ
- [ ] HTML に `lang` 属性 / `<title>` / リンク目的説明が含まれる
- [ ] plaintext に URL / TTL / 再送導線が含まれる
- [ ] 未対応 locale は ja に fallback する

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] mailer 単体テスト緑
- [ ] F-11 rollback テストが i18n 化後も緑

### ドキュメント要件

- [ ] `magic-link-mailer.ts` 冒頭コメントの方針が「i18n 段階導入済み」に更新されている
- [ ] locale 選択戦略が docs に明記されている
- [ ] `/login` 文言との対応関係が記録されている

---

## 6. 検証方法

### テストケース

- ja locale で日本語 subject / text / html が返る
- en locale で英語 subject / text / html が返り `lang="en"` が含まれる
- 未対応 locale で ja にフォールバックする
- HTML に `<title>` とリンク目的説明が含まれる
- plaintext に URL / TTL / 再送導線が含まれる

### 検証手順

```bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api lint
mise exec -- pnpm --filter @repo/api test src/services/mail
```

---

## 7. リスクと対策

| リスク                                                                  | 影響度 | 発生確率 | 対策                                                             |
| ----------------------------------------------------------------------- | ------ | -------- | ---------------------------------------------------------------- |
| locale 選択ロジックが Accept-Language とユーザー設定で揺れる            | 中     | 中       | Phase 2 で fallback 順序を docs に明示し、テストで境界を固定     |
| HTML メール a11y が一部メールクライアントで崩れる                       | 中     | 中       | インライン CSS 最小化と semantic 要素優先。client 個別対応はスコープ外 |
| `apps/web` `/login` 文言と mailer 文言がドリフトする                    | 中     | 中       | dictionary key 命名を共通化し、整合チェックを Phase 4 に組み込む |
| F-11 rollback テストが i18n 化で破損                                    | 高     | 低       | snapshot を locale 別に分離し、F-11 経路は ja で固定             |
| en 翻訳の品質劣化                                                       | 低     | 中       | en は MVP 範囲に絞り、レビュー時に native check を依頼           |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/unassigned-task-detection.md`（U-10）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`
- `apps/api/src/services/mail/magic-link-mailer.ts`

### 参考資料

- 不変条件 #5（provider 抽象化）
- 不変条件 #10（mail 失敗時 token rollback）
- Resend HTTP API: https://resend.com/docs/api-reference/emails/send-email

---

## 9. 実装課題と解決策（lessons-learned 対応）

> 本セクションは `lessons-learned-05b-magic-link-auth-gate-2026-04.md` の該当 lesson を引用し、
> 「実装時に同様の課題が再発する可能性」と「事前に確認すべき設計判断」を整理する。

### 9.1 対応する lesson

| Lesson ID  | 教訓要旨                                                                                                                            | 本タスクへの影響                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-05B-003  | mail provider 失敗後に token 行が残ると送れていない Magic Link が後から使える。development/test の no-op success と production の fail-closed を区別して記録する | i18n 拡張で `buildMagicLinkMessage` の戻り値構造を変える際、F-11 rollback 経路（送信失敗 → token 削除 → 502）を破壊してはいけない。dev/test no-op と prod fail-closed の log 区別もそのまま維持する |

### 9.2 再発する可能性

- locale dictionary 化に伴って mailer の戻り値型 (`{ subject, text, html }`) を変更すると、F-11 rollback テストの assertion が境界条件で破損するリスクがある。snapshot の locale 別分離を Phase 4 の最初に整える
- `/login` UI の文言と mailer の文言を「単一の dictionary」で正本化したくなるが、不変条件 #5（`apps/web` から `apps/api` を import 禁止）に抵触する。**dictionary は `apps/api` 内で正本化し、`apps/web` 側は同義のメッセージ ID を独立に持つ** ことを Phase 2 の設計時に明記する
- en 翻訳の品質が低いまま MVP に含めると、screen reader 読み上げ時のフィッシング誤認リスクが新たに生まれる。MVP 範囲を ja のみとし、en は段階導入する判断を Phase 0 で固定する

### 9.3 事前に確認すべき設計判断

- locale 選択戦略の優先順位: 「招待時固定値 > ユーザー保存設定 > Accept-Language > ja fallback」のいずれを正本にするかを Phase 2 で確定する。05b では未定のまま MVP 着地している
- a11y 必須属性 (`lang`, `<title>`, リンク目的説明) のテスト assertion を locale 横断で 1 ヶ所にまとめ、locale 追加時の漏れを構造的に防ぐ
- F-11 rollback テストは ja で固定し、i18n 化後も snapshot 経路が壊れないことを Phase 4 で確認する。dev/test の no-op success と prod fail-closed の log 区別を i18n 化で曖昧にしない

---

## 10. 備考

### 苦戦箇所【記入必須】

> 05b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | Magic Link メール本文が日本語ハードコードのみで、locale 切替・HTML テンプレート・mjml 風 layout・screen reader 向け a11y が未整備のまま 05b を完了せざるを得なかった                                                                                                                                  |
| 原因     | 05b で provider 抽象化（不変条件 #5）と mail 失敗時 rollback（F-11）のテスト整備にスコープを集中させたため、template engine 選定 / locale fallback 戦略 / a11y チェックを同時に行うと F-11 rollback の検証コストが膨らむと判断した。結果として Resend HTTP API を直接呼ぶ最小 plaintext + 簡易 HTML 実装に絞った |
| 対応     | MVP では「最小可読 plaintext + 簡易 HTML（日本語固定）」に留め、i18n / a11y は本フォローアップタスクで段階導入する方針とした。`magic-link-mailer.ts` 冒頭コメントに「テンプレート化は別 wave で行う」旨を残し、本タスクで dictionary 方式（template engine 不導入）にて段階導入する                  |
| 再発防止 | メール送信機能は MVP 段階では「最小可読 plaintext + locale 単一」に固定し、i18n / a11y / template engine は別タスクとして必ず unassigned-task に登録する運用を 05b lessons-learned に正本化済。本タスク完了時に dictionary key 集合と locale fallback 規約を docs に残し、次回新メール追加時の参照点とする |

### レビュー指摘の原文（該当する場合）

```
05b Phase 12 unassigned-task-detection.md U-10:
Magic Link メール本文の i18n / a11y 拡張
日本語固定 + plaintext fallback で MVP 充足 / 優先度 Low
```

### 補足事項

本タスクは 05b 単独でのスコープ外であり、provider 抽象化と rollback テストの安定後に着手するのが最小コストとなる。dictionary 方式に留めることで、将来 3 言語以上への拡張や本格的なテンプレートエンジン導入は更に別タスクへ切り出すことができ、段階導入の粒度を保てる。
