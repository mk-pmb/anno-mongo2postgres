
Kurzanleitung für UBHD
======================


Zu erwartende Fehler
--------------------

#### FATAL ERROR: […] Allocation failed - JavaScript heap out of memory

Bei knappem RAM ein Glücksspiel. Einfach noch 2-3 mal versuchen.


Installation
------------

Alles als Benutzer `annosrv`:

1.  `git clone …`
1.  `cd -- $REPO`
1.  `npm install .`


Benutzer konvertieren
---------------------

1.  Lege Kopie der alten `users.yml` nach `dumps/latest.users.yaml`
    (⚠ standardkonforme Dateinamenserweiterung)
1.  `sudo -u annosrv npm run users`
    * Protokoll: `src/ubhd/tmp.userConv.log`
    * Ausgabe: `src/ubhd/tmp.as22users.yaml`
    * Zwischenprodukt "Autoren-Blob": `src/ubhd/tmp.author_identities.json`



Annotationen umwandeln
----------------------

1.  Benötigt "Autoren-Blob" (siehe oben).
1.  Lege MongoDB-Dump nach `dumps/latest.anno.jsonld`
1.  `sudo -u annosrv npm run lrl dis`
    * Spaltet die alten Annos auf in Haupt-Anno und Antwort-Annos.
    * Fehlerprotokoll: `src/tmp.ubhd.dissect.err`
    * Liste der unverifizierten DOIs: `by-target/tmp.unverifiedDois.json`
1.  Falls Symlink `by-target/dbinit_structure.gen.mjs` fehlt, verlinke
    `../../anno-server-22/util/pg/dbinit_structure.gen.mjs`
1.  `sudo -u annosrv npm run lrl pg`
    * Übersetzt die aufgespaltenen Annos ins neue Postgres-Format.
    * Fehlerprotokoll: `src/tmp.ubhd.convertDissectedAnnos.err`
    * Ausgabe: `by-target/tmp.*.sql.gz`








