-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "reference_id" VARCHAR(255) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "service_type" VARCHAR(100) NOT NULL,
    "agent_id" UUID NOT NULL,
    "gateway_url" TEXT,
    "callback_url" TEXT,
    "notification_url" TEXT,
    "payment_details" JSONB,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transaction_id_key" ON "payment_transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_reference_id_key" ON "payment_transactions"("reference_id");

-- CreateIndex
CREATE INDEX "payment_transactions_agent_id_idx" ON "payment_transactions"("agent_id");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_payment_method_idx" ON "payment_transactions"("payment_method");

-- CreateIndex
CREATE INDEX "payment_transactions_service_type_idx" ON "payment_transactions"("service_type");

-- CreateIndex
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions"("created_at");

-- CreateIndex
CREATE INDEX "payment_transactions_transaction_id_idx" ON "payment_transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_transactions_reference_id_idx" ON "payment_transactions"("reference_id");

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
