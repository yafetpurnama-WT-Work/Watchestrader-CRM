<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('brand');
            $table->string('model');
            $table->string('reference_number')->nullable();
            $table->text('description')->nullable();
            $table->integer('year')->nullable();
            $table->string('condition')->default('pre_owned');
            $table->string('category')->default('man');
            $table->string('movement_type')->nullable();
            $table->string('case_material')->nullable();
            $table->string('case_size')->nullable();
            $table->string('dial_color')->nullable();
            $table->string('strap_material')->nullable();
            $table->string('bezel_type')->nullable();
            $table->string('documentation')->nullable();
            $table->string('availability')->default('ready_stock');
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('discount_price', 15, 2)->nullable();
            $table->integer('discount_percent')->nullable();
            $table->string('currency')->default('IDR');
            $table->string('image_url')->nullable();
            $table->uuid('outlet_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('source_type')->default('manual');
            $table->string('erp_item_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            $table->index('brand');
            $table->index('condition');
            $table->index('category');
            $table->index('availability');
            $table->index('outlet_id');
            $table->index('source_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
