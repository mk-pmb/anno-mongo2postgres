
<!--#echo json="package.json" key="name" underline="=" -->
anno-mongo2postgres
===================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
!! DEPRECATED !! Tools for converting anno-backend MongoDB dumps.
<!--/#echo -->



Deprecated
----------

* This tool is now deprecated.
* It is no longer required for properly installing `anno-server-22`.
* The old versions of `anno-mongo2postgres`
  are no longer compatible with stable versions of `anno-server-22`.
* If you think you have an edge case where you'd still need it,
  please contact me: I can probably recommend better options.
* The experimental branch is in zombie mode. See its readme for details.



Zombie mode
-----------

#### ⚠ Unsupported

This branch is no longer meant to be useful for general audiences,
nor is it supported. It exists merely for a specific interim situation
at the Heidelberg University Library.


#### ⚠ Confusing/misleading code

Nowadays, lots of the code in this repo is confusing and/or misleading
because we changed the definitions of some of the technical terms in our
other annotation software.
We tried retrofitting the new vocabulary onto `anno-mongo2postgres`,
but the concepts don't always match. Clarifying them wouldn't be worth
the effort, because hopefully no-one else will ever need this tool.






<!--#toc stop="scan" -->


&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
MIT
<!--/#echo -->
