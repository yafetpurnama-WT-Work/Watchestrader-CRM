<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $tables = [
        'contacts',
        'customers',
        'leads',
        'products',
        'deals',
        'companies',
        'outlets',
        'tags',
        'pipelines',
        'customer_statuses',
        'lead_sources',
        'automations',
        'message_templates',
        'broadcasts',
        'custom_fields'
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                $hasCreatedBy = Schema::hasColumn($tableName, 'created_by');
                $hasUpdatedBy = Schema::hasColumn($tableName, 'updated_by');

                if (!$hasCreatedBy || !$hasUpdatedBy) {
                    Schema::table($tableName, function (Blueprint $table) use ($hasCreatedBy, $hasUpdatedBy) {
                        if (!$hasCreatedBy) {
                            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
                        }
                        if (!$hasUpdatedBy) {
                            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
                        }
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'updated_by')) {
                        $table->dropConstrainedForeignId('updated_by');
                    }
                    if (Schema::hasColumn($tableName, 'created_by')) {
                        $table->dropConstrainedForeignId('created_by');
                    }
                });
            }
        }
    }
};
