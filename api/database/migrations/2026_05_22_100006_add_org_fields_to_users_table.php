<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('avatar_url');
            $table->uuid('role_id')->nullable()->after('role');
            $table->uuid('company_id')->nullable()->after('role_id');
            $table->uuid('outlet_id')->nullable()->after('company_id');
            $table->uuid('supervisor_id')->nullable()->after('outlet_id');
            $table->string('status')->default('active')->after('supervisor_id');

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('set null');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('set null');
            $table->foreign('supervisor_id')->references('id')->on('users')->onDelete('set null');

            $table->index('role_id');
            $table->index('company_id');
            $table->index('outlet_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['company_id']);
            $table->dropForeign(['outlet_id']);
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn(['phone', 'role_id', 'company_id', 'outlet_id', 'supervisor_id', 'status']);
        });
    }
};
