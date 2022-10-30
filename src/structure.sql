-- -*- coding: UTF-8, tab-width: 2 -*-
-- Adminer 4.8.1 PostgreSQL 14.0 dump

DROP TABLE IF EXISTS "anno_data";
DROP SEQUENCE IF EXISTS anno_pg_row_id_seq;
CREATE SEQUENCE anno_pg_row_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."anno_data" (
    "pg_row_id" integer DEFAULT nextval('anno_pg_row_id_seq') NOT NULL,
    "mongo_doc_id" character varying,
    "doi" character varying,
    "anno_id" character varying NOT NULL,
    "revision_id" smallint NOT NULL,
    "time_created" timestamptz NOT NULL,
    "author_local_userid" character varying NOT NULL,
    "debug_doi_verified" character varying,
    "debug_replyto" character varying,
    "details" json NOT NULL,
    CONSTRAINT "anno_details_anno_id_revision_id" UNIQUE ("anno_id", "revision_id"),
    CONSTRAINT "anno_pkey" PRIMARY KEY ("pg_row_id")
) WITH (oids = false);

CREATE INDEX "anno_author_local_userid" ON "public"."anno_data" USING btree ("author_local_userid");

CREATE INDEX "anno_mongo_doc_id" ON "public"."anno_data" USING btree ("mongo_doc_id");


DROP TABLE IF EXISTS "anno_links";
DROP SEQUENCE IF EXISTS anno_targets_pg_row_id_seq;
CREATE SEQUENCE anno_targets_pg_row_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."anno_links" (
    "pg_row_id" integer DEFAULT nextval('anno_targets_pg_row_id_seq') NOT NULL,
    "anno_id" character varying NOT NULL,
    "revision_id" smallint NOT NULL,
    "rel" character varying NOT NULL,
    "url" character varying NOT NULL,
    CONSTRAINT "anno_links_anno_id_revision_id_rel" UNIQUE ("anno_id", "revision_id", "rel"),
    CONSTRAINT "anno_targets_pkey" PRIMARY KEY ("pg_row_id")
) WITH (oids = false);

CREATE INDEX "anno_targets_target_type_target_url" ON "public"."anno_links" USING btree ("rel", "url");
