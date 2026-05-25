**[実装区分: 実装レビュー / 状態: local_static_pass_browser_pending]**

# UI Sanity Visual Review

## Review Target

`/login` Google OAuth button の left icon を 1-tone `currentColor` から official Google 4-tone SVG asset wrapper へ置換する。

## Review Checklist

| 観点 | 期待 | 状態 |
|---|---|---|
| icon legibility | desktop / mobile で 4-tone G が潰れない | `visual_render_pass_browser_pending` |
| layout stability | button height / gap / label position が regression しない | `visual_render_pass_browser_pending` |
| a11y | wrapper image は decorative (`alt=""`, `aria-hidden="true"`) | `typecheck_pass_browser_pending` |
| token policy | HEX literal は `brand-icons/google.svg` のみに閉じる | `pass` |
