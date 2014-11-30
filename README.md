clink
=====

A surprisingly versatile command-line interface for all kinds of node modules.

Use
---


```
clink [ -r modulename -p path.within.returned.object arg arg arg ] [ ... ]
```

the `[]` are literal there. Each argument group constructs an object, which is made into a stream as best as possible.

stdin will be piped to the first, into the second, and so on, to stdout.
