# 管理者アカウントの /profile 専用 UX - タスク指示書

## メタ情報

```yaml
issue_number: 1192
```

| 項目         | 内容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| タスクID     | task-admin-account-profile-dedicated-ux                                           |
| タスク名     | 管理者アカウントの /profile 専用 UX                                               |
| 分類         | UX設計（要 AC-2 結論）                                                             |
| 対象機能     | 管理者の `/profile` 体験                                                           |
| 優先度       | low                                                                               |
| 見積もり規模 | 小〜中                                                                            |
| ステータス   | deferred_pending_root_cause                                                       |
| 発見元       | profile-session-fetch-failure-investigation Phase 12 unassigned-task-detection    |
| 発見日       | 2026-06-09                                                                        |
| 親タスク     | docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation     |
| タスク種別   | implementation / VISUAL（着手時に再確定）                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親ワークフロー `profile-session-fetch-failure-investigation` は、staging `/profile` で
「ログイン済み（左下アカウント = 万壽本大嗣・管理者）なのに『セッション取得に失敗しました』系バナーが出る」
事象に対し、**調査 + 観測性向上**を実装した。

`/profile` は **member 向けマイページ**であり、内部では `/me` エンドポイントを呼ぶ。
`/me` は `session.user.memberId` を参照する（不変条件 #11）。
管理者アカウントが **member identity / status を持たない** 場合、`/me` は identity / status 不在を理由に
401 を返しうる（`apps/api/src/middleware/session-guard.ts:78-79,89-92`）。
401 は web 側で `/login?redirect=/profile` への redirect になるため、**画像症状（バナー）とは経路が異なる**。

しかしここで浮かび上がるのは別の論点である。すなわち
**「管理者が `/profile` にアクセスしたとき、そもそも何を見せるべきか」という UX が未定義**である、という点だ。
このタスク（C-4）は、今回のバナー事象の修正そのものではなく、
**管理者アカウントの `/profile` 体験そのものの設計**をスコープとする。

### 1.2 問題点・課題

- 管理者アカウント（万壽本大嗣・管理者）が **member identity / status を持つのか持たないのか**が
  データモデル上で未確定。これは親調査の **AC-2（Phase 11 MT-C の D1 read-only 確認 / `member_status`・identity テーブル）**
  の結論が出てからでないと判断できない。
- 管理者が member を持たない場合、`/me` は 401 となり redirect されるため、管理者には
  「マイページに入ろうとすると延々とログイン画面へ戻される」または「自分の情報が一切出ない」体験になりうる。
  この体験に対する **明示的な UX 設計が存在しない**。
- 逆に管理者が member identity を持つ場合は、member プロフィールが表示されるべきだが、
  「管理者である」ことを踏まえた導線（管理画面への戻りなど）が整理されていない。
- いずれにせよ、**「管理者は member なのか」というデータモデル上の前提が未確定**のまま UX を作ると、
  前提が覆ったときに作り直しになる。

### 1.3 放置した場合の影響

- 管理者が `/profile` にアクセスしたときの挙動が「未定義のまま」運用され続け、
  管理者に対して不可解な redirect ループや空表示が出続ける可能性がある。
- 今回のバナー事象（H3/H4/H5 系の真因）と **混同**したまま場当たり対応されると、
  認証境界（fail-closed）や不変条件 #11 を崩す変更が web 表現層に紛れ込むリスクがある。
- AC-2 の D1 read-only 結論を待たずに UX を確定してしまうと、
  「管理者 = member identity を持つ / 持たない」の前提変更で全面手戻りになる。

---

## 2. 何を達成するか（What）

### 2.1 目的

AC-2（管理者の member identity / status 保持・resolver の cookie 解決可否）の結論を前提として、
**管理者アカウントが `/profile` にアクセスしたときの専用 UX を設計・実装**する。
認証判定の所有権は `apps/api` の session-guard に残したまま、**web 表現層に管理者向け分岐**を足す。

### 2.2 最終ゴール

以下のいずれかが、AC-2 の結論に基づいて確定・実装されていること。

- **(a) 管理画面へ誘導**: 管理者は member プロフィールの対象外として、`/profile` アクセス時に
  管理画面（`/admin`）へ案内する導線を表示する。
- **(b) member プロフィール表示**: 管理者も member identity を持つ前提で、通常の member プロフィールを表示しつつ
  「管理者」ロールに応じた補助導線（管理画面への戻りなど）を添える。
- **(c) profile 非対象の明示**: 管理者は profile を持たない旨を明示する専用画面（空表示でも redirect ループでもない）を出す。

### 2.3 スコープ

#### 含む

- AC-2 の結論（管理者の member identity / status 保持・resolver の cookie 解決可否）を**着手前提として読む**こと
- 管理者かどうかを web 表現層で判定するための **既存 session 情報の参照点の整理**（新規認証判定は持ち込まない）
- 分岐案 (a)(b)(c) のいずれを採るかを AC-2 結論に基づいて確定すること
- `apps/web` 表現層への **管理者専用分岐**の実装（`/profile` 画面の管理者向け表示）
- 着手時の VISUAL 種別の再確定（管理者向け画面の見た目を伴う変更になる想定）

#### 含まない

- **今回のバナー事象（H3/H4/H5 系の真因）の修正そのもの** — これは親調査・別タスクの責務であり、C-4 とは独立
- `/me` の status 体系（identity / status の付与ロジック・enum）の変更
- 認証境界の web 移管（認証判定の所有権は `apps/api/src/middleware/session-guard.ts` に残す）
- D1 schema 変更 / Google Form 仕様変更
- member（非管理者）側の `/profile` UX 変更

---

## 3. どう実現するか（How）

### 3.1 着手前提（必ず先行）

このタスクは **AC-2 の結論が前提**である。着手前に以下を確認する。

1. 親調査の `outputs/phase-11/manual-test-result.md`（および MT-C）で
   **管理者アカウントが member identity / status を保持するか**の D1 read-only 結論を確認する。
2. `_shared-context.md` の AC-2 定義で、resolver が cookie から管理者を解決できる範囲を確認する。
3. 結論が未確定（read-only 確認が未実施 / 不確定）の場合は **着手しない**。
   前提が覆ると UX 設計が作り直しになるため、ここを越えてから設計に入る。

### 3.2 分岐の判断ステップ

AC-2 の結論に応じて、§2.2 の (a)(b)(c) を選ぶ。

| AC-2 の結論 | 採る分岐 | 設計方針 |
| --- | --- | --- |
| 管理者は member identity / status を**持たない** | (a) または (c) | `/me` は 401 → redirect になる前に、web 側で管理者を判別し管理画面誘導 (a) または profile 非対象の明示 (c) を出す |
| 管理者も member identity / status を**持つ** | (b) | 通常の member プロフィールを表示しつつ、管理者ロールに応じた補助導線を添える |
| resolver が cookie から管理者を解決**できない** | 設計保留 | AC-2 の resolver 側論点に差し戻し、解決可否が確定してから (a)/(b)/(c) を選ぶ |

### 3.3 web 表現層への管理者分岐実装方針

- 管理者判定は **web で新規に認証ロジックを書かない**。既存 session の情報（ロール / identity 有無）を参照点として読むのみ。
  認証判定の所有権は `apps/api/src/middleware/session-guard.ts` に残す（fail-closed を崩さない）。
- 不変条件 #11 を維持し、`memberId` をログ / レスポンス / 画面に露出させない。
- 分岐は `apps/web/app/(member)/profile/page.tsx`（または同等の profile 表示コンポーネント）に閉じ、
  member（非管理者）側の既存表示挙動を変えない。
- (a)/(c) を採る場合、401 → redirect の前段で管理者向け表示を返すため、
  「管理者が `/profile` に来たとき redirect ループに陥らない」ことを完了条件にする。

---

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/middleware/session-guard.ts` / `outputs/phase-11/manual-test-result.md`（AC-2 結論）
- 症状: **そもそも「管理者は member なのか」というデータモデル上の前提が未確定**。
  AC-2 の D1 read-only 結論（`member_status` / identity テーブルの read-only 確認）が出る前に UX を作ると、
  「管理者 = member identity を持つ / 持たない」の前提が覆ったときに全面作り直しになる。
  管理者 = member identity を持つかどうかを read-only で確認してから設計に入ること。
- 参照: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/_shared-context.md` AC-2

- 対象: 親調査の真因（H3/H4/H5）と本タスクの関係
- 症状: 401（identity / status 不在）は `/login?redirect=/profile` へ **redirect される**ため、
  画像症状（「セッション取得に失敗しました」バナー）とは **別経路**である。
  C-4 を「今回のバナー事象の修正」と混同すると、真因修正と UX 設計が混ざり、
  認証境界（fail-closed）や不変条件 #11 を崩す変更が web 表現層に紛れ込む。
  C-4 は「管理者の `/profile` 体験そのものの設計」であり、真因（H3/H4/H5）とは **独立**（ただし AC-2 結論に依存）。
- 参照: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md`

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| AC-2 結論が出る前に UX を確定し、前提が覆って手戻りする | 高 | §3.1 着手前提。AC-2 の D1 read-only 結論が確定するまで着手しない |
| 今回のバナー事象（真因 H3/H4/H5）と混同して場当たり修正する | 高 | §2.3 含まない・苦戦箇所②。C-4 は管理者 `/profile` 体験の設計に限定し、真因修正は別タスクの責務とする |
| 認証判定を web 表現層に持ち込み fail-closed を崩す | 高 | 認証判定の所有権は `session-guard.ts` に残す。web は既存 session 情報の参照のみ |
| `memberId` を画面 / ログ / レスポンスへ露出させる | 高 | 不変条件 #11 を維持。管理者分岐でも `memberId` を出さない |
| 管理者向け (a)/(c) 表示が redirect ループになる | 中 | 401 → redirect の前段で管理者向け表示を返す設計とし、ループしないことを完了条件にする |
| member（非管理者）側の既存 `/profile` 挙動を巻き込む | 中 | 分岐を profile 表示コンポーネントに閉じ、非管理者経路の表示を変えない |

---

## 検証方法

### 着手前提の検証（AC-2 結論確認）

```bash
# AC-2 の管理者 identity/status 結論を確認
sed -n '/AC-2/,/AC-3/p' docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/_shared-context.md

# Phase 11 MT-C の D1 read-only 結論を確認
grep -nEi "AC-2|MT-C|member_status|identity" \
  docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md
```

期待: 管理者が member identity / status を保持するか否かが read-only 結論として明記されている

### D1 read-only で管理者 identity / status を確認（着手時・read-only のみ）

```bash
# 管理者アカウントの member_status / identity を read-only で確認（書き込み禁止）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "SELECT 1" --json   # ← 実 SELECT は AC-2 の対象列に合わせて着手時に確定（read-only のみ）
```

期待: 管理者アカウントの identity / status の有無が SELECT で確認できる（INSERT / UPDATE / DELETE を行わない）

### 実装後の検証（分岐確定後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待:
- typecheck / lint 全 PASS
- web に新規の認証判定ロジックが入っていない（`session-guard.ts` 所有権を維持）
- `memberId` が画面 / ログ / レスポンスへ露出していない（不変条件 #11）
- 管理者が `/profile` にアクセスしたとき、選択した分岐 (a)/(b)/(c) の表示になり redirect ループしない

---

## 4. 関連リンク

| 種別 | パス | 用途 |
| --- | --- | --- |
| 親タスク | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/` | 親調査ワークフロー（真因・観測性向上の正本） |
| 着手前提（AC-2 結論） | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md` | 管理者の member identity / status 保持の read-only 結論 |
| AC-2 定義 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/_shared-context.md` | AC-2（管理者 identity / status・resolver の cookie 解決可否） |
| 未タスク検出 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md` | 本未タスク（C-4）の発見元・分離根拠（CONST_007 例外①） |
| 実装対象 | `apps/web/app/(member)/profile/page.tsx` | 管理者専用分岐を足す web 表現層 |
| 認証境界 | `apps/api/src/middleware/session-guard.ts` | `/me` の identity / status 401 判定（所有権は api 側・web へ移管しない） |
