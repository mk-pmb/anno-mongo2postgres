
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
1.  Im Unterverzeichnis `src/ubhd/`:
    1.  Lade alle bestehenden Anno-DOIs runter: `./datacite_dois_download.sh`
    1.  Prüfe die runtergeladene Datei (Name wird angezeigt) auf Plausibilität.
        Wenn gut, benenne sie auf `tmp.datacite_dois_all.json` um.
    1.  `npm run doiex`



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
    * Falls zu wenig RAM, beende vorübergehend Docker oder so.
    * Fehlerprotokoll: `src/tmp.ubhd.dissect.err`
    * Wichtig in der Zusammenfassung am Ende:
      * `unconfirmedAssumptions: false` (statt Fehlerliste)
      * `dupes: false`
      * `remainMaxErr: 1` oder höher
1.  Falls Symlink `by-target/dbinit_structure.gen.mjs` fehlt, verlinke
    `../../anno-server-22/util/pg/dbinit_structure.gen.mjs`
1.  `sudo -u annosrv npm run lrl pg`
    * Übersetzt die aufgespaltenen Annos ins neue Postgres-Format.
    * Fehlerprotokoll: `src/tmp.ubhd.convertDissectedAnnos.err`
    * Ausgabe: `by-target/tmp.*.sql.gz`
    * Wichtig in der Zusammenfassung am Ende: gleiches wie oben
      * Wenn bei `unconfirmedAssumptions` einige Einträge `doiUsed:…`
        sind, fehlen im Dump Annotationen, die eine DOI haben.
1.  Falls du Dienste anhalten musstest wegen zu wenig RAM, starte sie wieder.







