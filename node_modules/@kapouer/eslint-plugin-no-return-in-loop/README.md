eslint-plugin-no-return-in-loop
===============================

This plugin reports an error when there is an empty `return` in a loop:

Not okay:

```js
for (const n of [1, 2, 3]) {
 if (n === 2) return; /* this was surely meant to be `break` or `continue`
}
```

Okay:
```js
for (const n of [1, 2, 3]) {
 if (n === 2) return true;
}
```

Install:

```sh
npm install @kapouer/eslint-plugin-no-return-in-loop
```

Configure:

```json
"plugins": [
 "@babel",
 "@kapouer/no-return-in-loop"
],
"rules": {
 "@kapouer/no-return-in-loop/no-return-in-loop": "error"
}
```
