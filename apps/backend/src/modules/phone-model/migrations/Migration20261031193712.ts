import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261031193712 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "phone_model" drop constraint if exists "phone_model_slug_unique";`);
    this.addSql(`create table if not exists "phone_model" ("id" text not null, "slug" text not null, "brand" text not null, "name" text not null, "series" text null, "release_year" integer not null, "island_style" text check ("island_style" in ('square', 'pills', 'circle')) not null default 'square', "rank" integer not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "phone_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_phone_model_slug_unique" ON "phone_model" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_phone_model_deleted_at" ON "phone_model" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_phone_model_rank" ON "phone_model" ("rank") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "phone_model" cascade;`);
  }

}
