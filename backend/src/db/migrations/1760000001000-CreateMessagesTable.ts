import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesTable1760000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL NOT NULL,
        "text" character varying(280) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "messages"');
  }
}
