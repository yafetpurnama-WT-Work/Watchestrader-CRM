<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_status_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('from_status_id')->nullable();
            $table->uuid('to_status_id')->nullable();
            $table->uuid('changed_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('from_status_id')->references('id')->on('customer_statuses')->onDelete('set null');
            $table->foreign('to_status_id')->references('id')->on('customer_statuses')->onDelete('set null');
            $table->foreign('changed_by')->references('id')->on('users')->onDelete('set null');

            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_status_history');
    }
};
