# Phase 6: テスト追加（fail path・回帰 guard）

## メタ情報

- task_id: `admin-members-timestamp-jst-and-identity-label-clarity`
- 前提: [shared-context.md](shared-context.md)（SSOT）/ [phase-4-test-plan.md](phase-4-test-plan.md) / [phase-5-implementation.md](phase-5-implementation.md)
- 本 Phase の責務: Phase 4 のハッピーパス TC に対し、fail path・境界値・回帰 guard を追加する。特に日時 fail-soft の境界、真偽値の両分岐、英語キー併記の回帰 guard、既存テスト破壊時の更新方針を確定する。

## 追加方針

Phase 4 は主に「正常系の期待値」を定義した。本 Phase は次の 3 系統を補強する:

1. **fail path**: 不正入力で例外を投げず安全に縮退すること（fail-soft の証明）。
2. **境界値**: 日時の TZ 跨ぎ・月日繰り上がり、真偽値の両分岐。
3. **回帰 guard**: 既存テスト（英語キー exact 一致・既存 MembersTable TC）が壊れた場合の更新方針と、壊さないための前提テスト。

---

## A. datetime helper の fail path / 境界（T1 へ追加）

| TC-ID | 入力 | 期待 | 種別 | AC |
| --- | --- | --- | --- | --- |
| TC-DT-08 | `"   "`（空白のみ） | `"   "`（元入力返却・例外なし） | fail-soft | AC-2 |
| TC-DT-09 | `"2026-13-99T99:99:99Z"`（範囲外） | 元入力をそのまま返す（`Number.isNaN` で弾く） | fail-soft | AC-2 |
| TC-DT-10 | `"2026-06-09"`（日付のみ・時刻なし） | `Date` が解釈できる場合は JST 整形、`NaN` なら元入力返却（いずれも throw しない） | 境界 | AC-2 |
| TC-DT-11 | `"2025-12-31T15:30:00Z"` | `"2026年1月1日 00:30:00"` | 年跨ぎ境界（UTC→JST で年が変わる） | AC-2 |
| TC-DT-12 | `"2026-07-31T15:00:00Z"` | `"2026年8月1日 00:00:00"` | 月末→翌月 1 日の繰り上がり | AC-2 |

> TC-DT-10 は `Date` 実装依存（日付のみ文字列の解釈）が分かれるため、**「throw しない」ことのみを必須 assert** とし、出力文字列の exact 一致は assert しない（環境差吸収）。`expect(() => formatJstDateTimeWithSeconds("2026-06-09")).not.toThrow()`。
> fail-soft TC の共通要件: いずれも `expect(...).not.toThrow()` を満たし、戻り値は string 型であること。

## B. 真偽値の両分岐（T2・T4・T5 へ追加 / 既に Phase 4 で網羅・本 Phase で強化）

| TC-ID | 対象 | 入力 | 期待 | AC |
| --- | --- | --- | --- | --- |
| TC-GL-12/13 | `formatBooleanJa` | `true` / `false` | `"はい"` / `"いいえ"`（両分岐・Phase 4 で確定済み。branch 100% の根拠） | AC-4, AC-6 |
| TC-MD-08 | MemberDrawer | `notificationOptOut: false, isDeleted: true` | 「いいえ」「はい」が各 1 件（Phase 4 の TC-MD-05/06 と true/false を反転した補集合。両組合せを担保） | AC-4 |
| TC-DG-08 | DiagnosticsPanel | 3 真偽値すべて `true` | 「はい」が 3 件（`getAllByText("はい").length === 3`）。`"yes"` は 0 件 | AC-6 |
| TC-DG-09 | DiagnosticsPanel | 3 真偽値すべて `false` | 「いいえ」が 3 件。`"no"` は 0 件 | AC-6 |

> TC-MD-08 と Phase 4 TC-MD-05/06 を合わせて「`notificationOptOut`/`isDeleted` の true/false 各組合せ」を担保する。TC-DG-08/09 は DIAGNOSTICS 真偽値 3 箇所が全分岐で日本語化されること（旧 `boolLabel` の yes/no 残存ゼロ）を回帰 guard する。

## C. 英語キー併記の回帰 guard（T4・T5 へ追加）

併記方式の核心 = 「英語キー文字列が DOM に残る」こと。これが崩れると AC-11（既存テスト互換）が破れるため明示 guard する。

| TC-ID | 対象 | 検証 | AC |
| --- | --- | --- | --- |
| TC-MD-09 | MemberDrawer IDENTITY | `memberId` / `responseEmail` / `notificationOptOut` / `isDeleted` の 4 英語キーが**すべて** DOM テキストに存在する（`getByText("memberId")` 等が各 1 件で取得可） | AC-11 |
| TC-DG-10 | DiagnosticsPanel | `matched response` / `response fields` / `public visible` / `H3 hidden` / `H4 missing fields` の 5 英語ラベルが**すべて** DOM に存在する | AC-11 |
| TC-MD-10 | MemberDrawer | 日本語ラベルと英語キーが**同一行（同一 dt 内）に共存**することを `within(dtElement)` で検証（併記が分離していないことの guard） | AC-3, AC-11 |

> TC-MD-10 の取得方法: 日本語ラベルで `getByText("会員ID")` した要素の `closest("dt")` を起点に `within(...).getByText("memberId")` を assert。これにより「日本語ラベルと英語キーが別の場所に飛んでいない」ことを保証する。

## D. 既存テスト破壊時の更新方針（AC-11 の運用ルール）

Phase 5 Step 0 の grep で既存テスト/Playwright の英語キー exact 一致が見つかった場合の対応:

| 状況 | 方針 |
| --- | --- |
| 既存テストが `getByText("memberId")`（exact:true デフォルト）を使用 | 併記でも `memberId` は単独テキストノード（`<span>` 内）として残るため**原則通る**。`<span>memberId</span>` の中身が `memberId` 単体ならば `getByText("memberId")` は一致する。壊れない |
| 既存テストが「英語キーが値と同じ要素にある」前提で `getByText("memberId")` した dt の中身を `memberId: xxx` 等で取得 | 併記で dt 構造が変わるため壊れる可能性。テスト側を新構造（日本語主 + `<span>` 英語）に合わせて更新。**英語キーの存在検証は維持**しつつ取得方法のみ更新する |
| 既存テストが見出し `"identity (system field)"` / `"diagnostics"` を exact 検証 | 見出しは日本語化されるため**必ず壊れる**。テスト側を `"本人情報（システム項目）"` / `"診断情報"` に更新（AC-8 と整合） |
| Playwright が英語キー/見出しの strict セレクタを使用 | 併記により英語キーは残るが見出しは日本語化。見出し依存のセレクタを日本語へ更新。`text=memberId` が複数一致で strict 違反になる場合は role/testid ベースの具体セレクタへ変更 |

> 原則: **テキストの意味的検証（英語キーの存在・日本語ラベルの追加）は強める方向に更新**し、安易に削除しない。見出し日本語化のように仕様変更で必然的に壊れる箇所のみ期待値を新仕様へ更新する。更新差分は本タスクの 10 ファイル範囲内（既存 spec の編集は許容、apps/api は不可）。

## E. MembersTable 既存 TC 非破壊の前提 guard（T3）

| TC-ID | 検証 | 理由 |
| --- | --- | --- |
| 既存 TC-MT-01〜05 | 変更せず全 PASS のまま | `mkMember` のデフォルト `lastSubmittedAt` を変更しない。追記 TC は `overrides` で個別指定（Phase 4 明記） |
| TC-MT-LM-03（追加・任意） | デフォルト `lastSubmittedAt: "2026-05-01T00:00:00.000Z"` の member で JST 表示 `"2026年5月1日 09:00:00"` が出る | デフォルト値も整形されることの確認（既存 mkMember 経由のレンダリングが壊れていない保証） |

---

## 追加 TC ↔ AC トレーサビリティ

| AC | 追加 TC |
| --- | --- |
| AC-2（fail-soft 境界） | TC-DT-08〜12 |
| AC-4（IDENTITY 真偽値両分岐） | TC-MD-08 |
| AC-6（DIAGNOSTICS 真偽値両分岐） | TC-DG-08, TC-DG-09 |
| AC-11（英語キー併記回帰 guard） | TC-MD-09, TC-MD-10, TC-DG-10 + D 節の更新方針 |
| AC-1（一覧 JST・デフォルト値経路） | TC-MT-LM-03 |

## 完了条件（Phase 6）

- 日時 fail-soft の境界 TC（空白・範囲外・TZ 跨ぎ・年月繰り上がり）を追加した。
- 真偽値の両分岐を IDENTITY/DIAGNOSTICS 双方で網羅する補集合 TC を追加した。
- 英語キー併記の回帰 guard（DOM 残存・同一 dt 共存）を追加した。
- 既存テスト/Playwright 破壊時の更新方針（AC-11 運用ルール）を確定した。
