<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->char('province_code', 2)->nullable();
            $table->char('city_code', 4)->nullable();
            $table->char('district_code', 7)->nullable();
            $table->char('village_code', 10)->nullable();
            $table->string('rt', 5)->nullable();
            $table->string('rw', 5)->nullable();
            $table->string('postal_code', 5)->nullable();
            $table->uuid('company_id')->nullable();
            $table->uuid('outlet_id')->nullable();
            $table->uuid('assigned_sales_id')->nullable();
            $table->uuid('status_id')->nullable();
            $table->string('source')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('set null');
            $table->foreign('assigned_sales_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('status_id')->references('id')->on('customer_statuses')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            $table->index('phone');
            $table->index('email');
            $table->index('name');
            $table->index('company_id');
            $table->index('outlet_id');
            $table->index('assigned_sales_id');
            $table->index('status_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
