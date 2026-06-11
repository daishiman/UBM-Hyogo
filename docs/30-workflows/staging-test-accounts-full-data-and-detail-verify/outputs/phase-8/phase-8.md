# Phase 8 — リファクタリング

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> 本フェーズは今回のlocal実装が実コードを書く際に従うべき「重複削減・命名整合・navigation drift」の確定方針である。
> 本タスクの編集は catalog.ts の `profile` データ拡充（10 メンバー × 最大 31 stable_key）が主であり、リファクタは **catalog の profile データ重複の括り出し** と **fixture の DRY 化** に限定する。Lane B のギャップ修正が発生した場合のみ adapter/component の最小整理を追加する。

---

## 1. 重複削減

10 メンバー × 最大 31 stable_key の `profile` を手書きすると、ダミー値（URL の `https://example.com/...` パターン、共通の地名・職種文言、SNS URL 群の繰り返し）が構造的に重複する。以下を重複削減対象として確定する。

| 対象 | Before（重複の発生源） | After（集約後） | 理由 |
|------|------------------------|-----------------|------|
| 共通ダミー SNS URL 群 | 各 member の `profile` に `urlWebsite`..`urlLinkedin` の 10 種類を `https://example.com/<member>` 形式で個別に 10 回手書き | `buildSnsUrls(slug: string)` ヘルパ（catalog 内ローカル）を 1 つ定義し、フル充填 member は `...buildSnsUrls("roku")` で展開。全項目入力（09）は spread 後に必要キーだけ `delete` せず**最初から個別指定**（下記トレードオフ参照） | フル充填 5 member の SNS URL 群は構造が同一。slug だけ差し替える helper に括ることで `example.com` ドメイン・URL 形式の不整合を構造的に排除し、SNS 追加時の修正箇所を 1 箇所に集約する |
| 共通の「中程度」充填パターン | 非掲載 5 件（02,03,04,05,08）の profile を必須 + 主要 optional で個別に手書き | `MEDIUM_PROFILE_KEYS`（必須 + 主要 optional の stable_key 集合）を定数化し、`pickMediumProfile(base)` で base から該当キーのみ抽出 | 「中程度」の充填レベル定義が member ごとにブレると表示バリエーション意図が崩れる。充填レベルの境界を 1 定数で固定する |
| consent / system field の既定値 | 各 member で `publicConsent` / `rulesConsent` を都度リテラル指定 | 既存実装どおり member_status 生成側（build-seed-sql）で扱う。`profile` には混ぜない（不変条件 #4） | consent キーは system 側の責務。profile データ重複削減の対象外として境界を明示し、二重管理を防ぐ |
| fixture の full/all-fields/edge 共通項 | `public-member-profile.ts` で full/all-fields/edge fixture を 3 つ全部フルに手書き | `baseProfileFixture`（フル）を 1 つ定義し、partial は `{ ...baseProfileFixture, motto: "", hobbies: "", ... }`、edge は `{ ...baseProfileFixture, fullName: "<長文/絵文字>", ... }` の **override 差分**で導出 | fixture 3 形態の共通フィールドを base に集約し、partial/edge は「base からの差分」だけを表現。差分が明示されることで「何を検証したい fixture か」（全項目入力 / エッジ）が読み取りやすくなる |

### 既存資産との関係（新規ヘルパはローカルに置く）

- `buildSnsUrls` / `pickMediumProfile` は `catalog.ts` 内のローカルヘルパに閉じ、catalog 以外から参照させない。汎用ユーティリティ化は YAGNI 抵触のため行わない。
- build-seed-sql.ts に member 固有のハードコードが残っていた場合（Phase 5 の確認結果次第）、profile 全キーを回す形へ**最小一般化**する。これは新規抽象の導入ではなく、既存の TEST-MEM-01 専用ロジックを 10 member 汎用へ広げる範囲に留める。
- fixture の base は `apps/web/src/fixtures/public-member-profile.ts` 内に置く。adapter/component spec が参照する単一 fixture モジュールに集約し、spec ごとに別 fixture を量産しない。

---

## 2. トレードオフ（データの可読性優先で過剰共通化しない）

profile データは「テストアカウントが staging でどう表示されるか」を人が読んで確認する資産でもある。過剰な helper 化はデータの可読性・意図の伝達性を損なうため、以下の境界を守る。

| 共通化する | 共通化しない（可読性優先で展開のまま残す） |
|-----------|------------------------------------------|
| 構造が完全に同一で slug だけ違う SNS URL 群（`buildSnsUrls`） | **各 member の人物像を表す文言**（businessOverview / selfIntroduction / occupation / hobbies 等）。member ごとに異なる現実的ダミーで、共通化するとテストデータの「読んで分かる」価値が消える |
| 充填レベルの境界定義（`MEDIUM_PROFILE_KEYS`） | **09（全項目入力）/ 10（エッジ）の意図的な特異値**。空にするキー・長文/絵文字/特殊文字は「何を検証する fixture か」を示すため、helper で隠さず member 定義の中で**明示的に空文字 / 特異リテラル**として見えるようにする |
| fixture の共通ベース（`baseProfileFixture`） | full/all-fields/edge の**差分そのもの**。override で「何が違うか」を露出させ、抽象の裏に畳まない |

> 原則: **「構造の重複（URL 形式・列順・充填レベル境界）」は括る／「内容の多様性（人物像・全項目入力・エッジ値）」は展開のまま残す**。テストデータの SSOT 性（catalog から決定論的に再生成）と、人が読んで表示形態を理解できる可読性を両立させる。過剰共通化で 09/10 の検証意図が読めなくなることを最大の劣化として避ける。

---

## 3. 命名整合

| 観点 | 規約 | 根拠 |
|------|------|------|
| stable_key 参照 | `STABLE_KEY` 定数経由（`[STABLE_KEY.nickname]` 等）。文字列リテラル直書き禁止 | 不変条件 #7 / lint-stablekey-literal |
| member ID | `TEST-MEM-NN`（2 桁ゼロ埋め）。catalog literal type `TEST-MEM-${string}` | index.md 命名規則 |
| ローカルヘルパ名 | `buildSnsUrls` / `pickMediumProfile` / `baseProfileFixture`。動詞 + 目的語 or 名詞で副作用なしを表明 | 純粋関数 / 定数であることを名前で示す（drift guard 再実行可能性の担保） |
| fixture 名 | `baseProfileFixture` / `partialProfileFixture` / `edgeProfileFixture`。充填形態を名前で表現 | spec から「どの表示バリエーションの検証か」を読み取れる |
| test ファイル | `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止） | 不変条件 #2 / lefthook block-test-suffix |
| consent キー | `publicConsent` / `rulesConsent` | 不変条件 #4 |

---

## 4. navigation drift

**該当なし。**

理由: 本タスクは公開詳細ページの**既存導線・既存セクション構造を変更しない**（commit 66d18af1b で確定済みの 5 セクション描画を、データを与えて検証するのみ）。Lane B のギャップ修正が発生した場合も、既存 adapter のセクション割当 / 既存 primitives の範囲に閉じ、新規ルート・新規ヘッダ/フッタ/サイドバー導線・新規 primitive を作らない（不変条件 #5: 新規 primitive 禁止）。よって navigation drift（既存導線とプロトタイプ正本の乖離）は構造的に発生しない。プロトタイプ正本（`docs/00-getting-started-manual/claude-design-prototype/`）との照合も、本タスクが既存構造を保つ限り対象外。

---

## 5. ゲート（今回のlocal実装確認用）

- [ ] フル充填 member の SNS URL 群が `buildSnsUrls` 経由に集約され、`https://example.com/...` の手書き反復が残っていない
- [ ] 「中程度」充填の境界が `MEDIUM_PROFILE_KEYS` で 1 箇所定義され、非掲載 5 件で再利用されている
- [ ] **09 の空キー・10 のエッジ値は helper に隠さず member 定義で明示的に見える**（可読性優先のトレードオフ遵守）
- [ ] fixture が `baseProfileFixture` + override 差分で導出され、full/all-fields/edge の違いが読み取れる
- [ ] stable_key が全箇所 `STABLE_KEY` 定数経由（リテラル直書き 0）
- [ ] consent / system field を `profile` に混ぜていない（build-seed-sql 側の責務に留めた・不変条件 #4）
- [ ] navigation 変更 0・新規 primitive 0（UI 構造ファイルの導線差分なし）

## 完了条件

- catalog の profile データ重複（共通 SNS URL 群・充填レベル境界）と fixture の DRY 化方針を helper/定数へ括る形で確定した。同時に「データの可読性優先で過剰共通化しない」トレードオフ（人物像・09 全項目入力・10 エッジ値は展開のまま残す）を明記した。命名整合・navigation drift（該当なし）を確認した。Phase 9 品質保証へ進む。
