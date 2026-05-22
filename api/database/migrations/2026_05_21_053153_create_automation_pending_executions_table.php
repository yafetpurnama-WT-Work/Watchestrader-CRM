<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('automation_pending_executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('automation_id')->constrained('automations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->uuid('log_id')->nullable();
            $table->uuid('parent_step_id')->nullable();
            $table->string('branch')->nullable();
            $table->integer('next_step_position')->default(0);
            $table->json('context')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('run_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('automation_pending_executions');
    }
};
