import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAgentColumn1792646758036 implements MigrationInterface {
    name = 'CreateAgentColumn1792646758036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."agents_status_enum" AS ENUM('offline', 'available', 'busy', 'break', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "location" geography(Point,4326), "locationUpdatedAt" TIMESTAMP WITH TIME ZONE, "status" "public"."agents_status_enum" NOT NULL DEFAULT 'offline', "isOnline" boolean NOT NULL DEFAULT false, "vehicleType" character varying(50), "vehiclePlate" character varying(20), "maxConcurrentOrders" smallint NOT NULL DEFAULT '1', "currentOrderId" uuid, "heading" real, "speed" real, "deviceToken" character varying(255), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_57ee94c84a8e570e362af59dcea" UNIQUE ("user_id"), CONSTRAINT "REL_57ee94c84a8e570e362af59dce" UNIQUE ("user_id"), CONSTRAINT "CHK_f2de8db75d7415f9d6e9b8c661" CHECK ("speed" IS NULL OR "speed" >= 0), CONSTRAINT "CHK_5ce5b7e3c6bb1e35b1f0b0e388" CHECK ("heading" IS NULL OR ("heading" >= 0 AND "heading" < 360)), CONSTRAINT "CHK_7bf96d19eacbb9fedbe2904c60" CHECK ("maxConcurrentOrders" >= 1), CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_agents_location" ON "agents" USING gist ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_agents_status" ON "agents"  ("status") `);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_57ee94c84a8e570e362af59dcea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_57ee94c84a8e570e362af59dcea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agents_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agents_location"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`DROP TYPE "public"."agents_status_enum"`);
    }

}
