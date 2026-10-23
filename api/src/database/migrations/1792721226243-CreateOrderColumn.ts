import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderColumn1792721226243 implements MigrationInterface {
    name = 'CreateOrderColumn1792721226243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled', 'failed')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" uuid, "agentId" uuid, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "pickupAddress" character varying(500) NOT NULL, "pickupLocation" geography(Point,4326), "deliveryAddress" character varying(500) NOT NULL, "deliveryLocation" geography(Point,4326), "orderNumber" character varying(50) NOT NULL, "notes" text, "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "deliveryFee" numeric(10,2) NOT NULL DEFAULT '0', "totalAmount" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'NPR', "confirmedAt" TIMESTAMP WITH TIME ZONE, "assignedAt" TIMESTAMP WITH TIME ZONE, "pickedUpAt" TIMESTAMP WITH TIME ZONE, "deliveredAt" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "customerName" character varying(100), "customerPhone" character varying(20), "customer_id" uuid, "agent_id" uuid, CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143" UNIQUE ("orderNumber"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_agent" ON "orders"  ("agentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_orders_customer" ON "orders"  ("customerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders"  ("status") `);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_f94f2f59fd8a736781ce5c2159c" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_f94f2f59fd8a736781ce5c2159c"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_customer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_agent"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}
