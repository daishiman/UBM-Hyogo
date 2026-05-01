# DevTools Snippets

## snippet-no-form.js

```js
const sel = 'form, input, textarea, button[type=submit]';
const list = document.querySelectorAll(sel);
console.log(JSON.stringify({
  url: location.pathname + location.search,
  selector: sel,
  count: list.length,
  outerHTML_first: list[0]?.outerHTML ?? null,
  timestamp: new Date().toISOString()
}, null, 2));
```

禁止: `location.href`、Cookie、localStorage、sessionStorage、Authorization header の出力。
