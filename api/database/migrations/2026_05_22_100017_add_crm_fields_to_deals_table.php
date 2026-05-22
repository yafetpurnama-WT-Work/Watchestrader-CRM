<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->uuid('customer_id')->nullable()->after('contact_id');
            $table->uuid('lead_id')->nullable()->after('customer_id');
            $table->uuid('product_id')->nullable()->after('lead_id');

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('lead_id')->references('id')->on('leads')->onDelete('set null');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['lead_id']);
            $table->dropForeign(['product_id']);
            $table->dropColumn(['customer_id', 'lead_id', 'product_id']);
        });
    }
};
