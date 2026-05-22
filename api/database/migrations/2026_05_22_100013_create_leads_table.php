<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('assigned_to')->nullable();
            $table->uuid('source_id')->nullable();
            $table->string('status')->default('cold');
            $table->string('title');
            $table->text('notes')->nullable();
            $table->decimal('value', 15, 2)->default(0);
            $table->uuid('company_id')->nullable();
            $table->uuid('outlet_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('source_id')->references('id')->on('lead_sources')->onDelete('set null');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            $table->index('status');
            $table->index('assigned_to');
            $table->index('company_id');
            $table->index('outlet_id');
            $table->index('source_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
