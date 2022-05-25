
<!--#echo json="package.json" key="name" underline="=" -->
anno-mongo2postgres
===================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Tools for converting anno-backend MongoDB dumps
<!--/#echo -->



Usage
-----

Please try and make sense of [`by-target/lrl.sh`](by-target/lrl.sh).

I usually run it like this:

1.  Place my MongoDB dump in `dumps/yyyymmdd.jsonld`
1.  Symlink `dumps/latest.jsonld` &rarr; `yyyymmdd.jsonld`
1.  `cd by-target`
1.  `./lrl.sh dis` —
    Dissect the legacy hierarchical version history into one record per
    revision.
    * It currently uses a quick and dirty approach to reading the input stream,
      which is to buffer __all of the input__ in memory, and some conversion
      steps make __additional__ copies.
      Thus, for the first few seconds of runtime, you'll need enough free RAM
      to hold about 3 times the size of your dump file, plus a little more.
    * For my debug convenience, additionally to the main output file,
      the dissector also creates a separate JSON file for each record.
      You'll want to run this on a storage device that can quickly create
      millions of tiny files.
    * Dissecting our ~33k revisions takes about half a minute once the
      file system has warmed up.
1.  `./lrl.sh pg` — Convert the dissected records to a postgres command file.
    * Converting our ~33k revisions takes about one minute if the file system
      is still warm from dissecting.
1.  Login to postgres via
    [adminer](https://github.com/TimWolla/docker-adminer)
    and import `by-target/tmp.pg.anno_combo.sql.gz`.
    * ⚠ Drops the previous tables if they exist. ⚠
    * Usually takes a few minutes.
1.  `./lrl.sh clean` — Optionally remove temporary files.




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
