CREATE TABLE `cao_fila` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome_cao` text NOT NULL,
	`nome_tutor` text NOT NULL,
	`telefone_tutor` text NOT NULL,
	`altura_cm` integer NOT NULL,
	`comprimento_cm` integer NOT NULL,
	`status` text DEFAULT 'aguardando' NOT NULL,
	CONSTRAINT "cao_status_valido" CHECK("cao_fila"."status" IN ('aguardando', 'em_montagem', 'entregue')),
	CONSTRAINT "cao_medidas_positivas" CHECK("cao_fila"."altura_cm" > 0 AND "cao_fila"."comprimento_cm" > 0)
);
--> statement-breakpoint
CREATE TABLE `material_estoque` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome_material` text NOT NULL,
	`categoria_material` text NOT NULL,
	`saldo_disponivel` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "saldo_nao_negativo" CHECK("material_estoque"."saldo_disponivel" >= 0)
);
