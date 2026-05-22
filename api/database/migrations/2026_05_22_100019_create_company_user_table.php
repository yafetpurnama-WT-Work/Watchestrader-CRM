<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('company_id');
            $table->timestamps();

            $table->unique(['user_id', 'company_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });

        // Set UUID default for the id column (same pattern as role_permissions fix)
        DB::statement("ALTER TABLE `company_user` MODIFY `id` char(36) NOT NULL DEFAULT (UUID())");
    }

    public function down(): void
    {
        Schema::dropIfExists('company_user');
    }
};
