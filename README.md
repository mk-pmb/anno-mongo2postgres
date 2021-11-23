
<!--#echo json="package.json" key="name" underline="=" -->
anno-mongo2postgres
===================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Tools for converting anno-backend MongoDB dumps
<!--/#echo -->



Usage
-----

```bash
smart-less-pmb -e eval '
  TLA_SKIP=0 TLA_LIMIT=800 nodejs flatten.mjs <dumps/latest.jsonld >tmp.flat.json
  '
```


<!--#toc stop="scan" -->



Known issues
------------

* Needs more/better tests and docs.




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
MIT
<!--/#echo -->
