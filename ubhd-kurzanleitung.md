
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
    1.  Prüfe/bearbeite DataCite-Server und DOI-Präfix in `facts.mjs`.
    1.  Lade alle bestehenden Anno-DOIs runter: `./datacite_dois_download.sh`
    1.  Prüfe die runtergeladene Datei (Name wird angezeigt) auf Plausibilität.
        Wenn gut, benenne sie auf `tmp.datacite_dois_all.json` um.
    1.  `npm run doiex`



DataCite DOI URLs updaten
-------------------------

1.  `./src/ubhd/datacite_dois_update_urls.sh`
1.  Lies und prüfe die Missionsvorschau.
1.  Stelle sicher, dass die Shell lange genug überlebt (Zeitvorschau sollte
    dagestanden haben) – im Fall von SSH könnte `screen` o.ä. nötig sein.
1.  Wenn Anpassungen nötig sind, brich ab (Strg+C),
    setze genannte Umgebungsvariablen, wiederhole.
1.  Wenn die Mission so passt, gib den DataCite-Login ein.



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
1.  Falls Symlink `by-target/dbinit_structure.gen.mjs` fehlt, verlinke
    `../../anno-server-22/util/pg/dbinit_structure.gen.mjs`
1.  Lege MongoDB-Dump nach `dumps/latest.anno.jsonld`
1.  Prüfe ob alle URLs auf https:// umgeschrieben sind, für die wir das
    sicher "dürfen" (mindestens unsere eigenen): `cd dumps; ./http_urls.sh`
1.  Falls die Annos auf einen Test-Server importiert werden sollen,
    muss der URL-Namespace entsprechend umgeschreiben werden,
    sonst beschwert sich der Anno-Server
    `Currently, only local anno IDs are supported.`
    Füge dazu im nächste Schritt vor `npm` noch sowas ein wie:
    `REWRITE_BASEURL=https://anno.ub.uni-heidelberg.de/anno-test/`
1.  `sudo -u annosrv npm run lrl dis`
    * Spaltet die alten Annos auf in Haupt-Anno und Antwort-Annos.
    * Falls zu wenig RAM, beende vorübergehend Docker oder so.
    * Fehlerprotokoll: `src/tmp.ubhd.dissect.err`
    * Wichtig in der Zusammenfassung am Ende:
      * `unconfirmedAssumptions: false` (statt Fehlerliste)
      * `dupes: false`
      * `remainMaxErr: 1` oder höher
1.  `sudo -u annosrv npm run lrl pg`
    * Übersetzt die aufgespaltenen Annos ins neue Postgres-Format.
    * Fehlerprotokoll: `src/tmp.ubhd.convertDissectedAnnos.err`
    * Ausgabe: `by-target/tmp.*.sql.gz`
    * Wichtig in der Zusammenfassung am Ende: gleiches wie oben
      * Wenn bei `unconfirmedAssumptions` einige Einträge `doiUsed:…`
        sind, fehlen im Dump Annotationen, die eine DOI haben.
1.  Falls du Dienste anhalten musstest wegen zu wenig RAM, starte sie wieder.







