# lessons-learned — issue-1007 density-toggle help-hint hardening (2026-05)

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1007-density-toggle-help-hint-hardening` |
| source_issue | #1007 (CLOSED, `Refs #1007` only) |
| status | implemented_local_runtime_pending / implementation / VISUAL |
| recorded_at | 2026-05-30 |

## 範囲

`DensityToggle` のヘルプヒント (`<details data-component="help-hint">`) を堅牢化した実装で得た 6 件の教訓。多重配置時の a11y id 衝突回避 (`useId`)、非制御 native `<details>` への close 操作付与 (Escape / 外側クリック)、`help` アイコンの system 統合、jsdom での `<details>` toggle 非対応に対する test fallback を含む。

## L-DTHH-001 — 多重配置 component の description id は `useId` で namespace 化する

- **Rule**: 同一ページに複数配置されうる component が `aria-describedby` 用の hidden span を持つ場合、id を `density-${value}-desc` のような固定文字列にせず、`useId()` 接頭辞 (`${uid}-density-${value}-desc`) で instance ごとに一意化する。
- **Why**: 固定 id は 2 個目以降の配置で重複し、`aria-describedby` が他 instance の span を指す参照崩れ・スクリーンリーダー誤読を生む。Issue #1007 の根因はまさにこの id 衝突。
- **How to apply**: `const uid = useId(); const descId = (v) => `${uid}-density-${v}-desc``。hidden span の `id` と radio の `describedBy` の双方を同じ `descId(v)` から生成する。回帰は「2/3 instance 配置で全 id が unique」「各 radio の `aria-describedby` が自 instance 内 span を指す」を vitest で assert (TC-1/TC-2/TC-3/TC-11)。

## L-DTHH-002 — disclosure は非制御 native `<details>` + ref 命令 close に倒す

- **Rule**: 開閉 UI は controlled state (`useState(open)`) で全制御せず、native `<details>` の summary toggle 標準挙動を温存したまま、**close 操作だけ** を `detailsRef.current.open = false` で命令的に行う。
- **Why**: 当初の「controlled details」前提が誤り (double-loop)。controlled 化すると summary の native toggle / keyboard / アコーディオン a11y を全部自前再実装する羽目になり複雑化する。open は native 任せ、close だけ上乗せが最小複雑度。
- **How to apply**: `<details ref={detailsRef}>` を非制御で置き、`closeHelp = () => { if (detailsRef.current) detailsRef.current.open = false }` を `useCallback` 化。state を持たないので render 同期問題が構造的に発生しない。

## L-DTHH-003 — document listener は `browserDocument()` guard + mount 寿命 1 本 + unmount 解除

- **Rule**: Escape / 外側クリック close 用の `document` listener は、(a) `browserDocument()`（`../../lib/is-browser`）で SSR 時 `null` 早期 return、(b) mount〜unmount で 1 本だけ張り、(c) handler 内で `detailsRef.current?.open` を直接判定、(d) cleanup で必ず解除、の 4 点セットで実装する。
- **Why**: `process`/`document` 直参照は OpenNext Workers SSR で落ちる。state を closure に閉じ込めると open/close ごとに listener 張り替えが必要になり leak しやすい。ref を handler 内で読めば listener は 1 本で済む。
- **How to apply**: `useEffect(() => { const doc = browserDocument(); if (!doc) return; ...; doc.addEventListener(...); return () => doc.removeEventListener(...) }, [closeHelp])`。依存は `closeHelp`（安定 useCallback）のみ。

## L-DTHH-004 — Escape は summary に focus 復帰、外側クリックは pointerdown + Node contains guard

- **Rule**: Escape close 時は `detailsRef.current?.querySelector("summary")?.focus()` で focus を起点へ戻す。外側クリックは `pointerdown` で拾い、`target instanceof Node && !detailsRef.current.contains(target)` の双方を満たすときのみ close する。
- **Why**: focus を戻さないと keyboard 利用者が context を失う。`contains` guard と `instanceof Node` を欠くと、内部クリックでも閉じる / `target` が非 Node のとき throw する。
- **How to apply**: keydown は `e.key === "Escape" && detailsRef.current?.open` を条件に。pointerdown は contains 判定。両 handler とも `open` のときだけ作用させ無駄 close を避ける。

## L-DTHH-005 — jsdom は `<details>` summary click を native toggle しない → test helper で fallback

- **Rule**: vitest/jsdom 環境では summary の `fireEvent.click` が `<details>` を native open しない。test helper で「click 後 `details.open` が false なら `details.open = true` + `fireEvent(details, new Event("toggle"))` を手動 dispatch」する fallback を 1 箇所に集約する。
- **Why**: jsdom は `<details>`/`<summary>` の interactive toggle を実装していないため、help を開く前提の assertion (term/definition 3 件など) が環境依存で false negative になる。
- **How to apply**: `openHelp(container)` helper を定義し、各 spec はこれ経由で help を開く。実ブラウザ挙動は Phase 11 の screenshot evidence（help-open / help-closed）で別途担保する。

## L-DTHH-006 — icon 追加は 3 点同期（union + glyph case + spec 行）

- **Rule**: 新しい `IconName`（今回 `help`）を足すときは、(1) `apps/web/src/components/ui/icons.ts` の union 型追加、(2) `apps/web/src/components/ui/Icon.tsx` の `iconGlyph` switch case 追加、(3) `docs/00-getting-started-manual/specs/09d-icons.md` の icon 表 1 行追加、の 3 箇所を必ず同一 wave で触る。
- **Why**: union だけ足して glyph case を忘れると exhaustiveness で fall-through、spec 行を忘れると design system 正本と実装が乖離する。`?` テキストから icon への置換は見た目だけでなく `aria-hidden` summary 内表現の正本化でもある。
- **How to apply**: icon 追加 PR の diff レビューでこの 3 点が揃っているか check。glyph の viewBox / stroke-width は 09d-icons.md の値（sm(16) / stroke 2 / `0 0 24 24`）に一致させる。
