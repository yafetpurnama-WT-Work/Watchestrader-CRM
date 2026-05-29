<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Insert default statuses
        $statuses = [
            ['id' => Str::uuid(), 'name' => 'Junk', 'slug' => 'junk', 'color' => '#6B7280', 'position' => 1, 'is_default' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid(), 'name' => 'Cold', 'slug' => 'cold', 'color' => '#3B82F6', 'position' => 2, 'is_default' => true, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid(), 'name' => 'MQL', 'slug' => 'mql', 'color' => '#8B5CF6', 'position' => 3, 'is_default' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid(), 'name' => 'Hot', 'slug' => 'hot', 'color' => '#EF4444', 'position' => 4, 'is_default' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid(), 'name' => 'Deal Won', 'slug' => 'deal-won', 'color' => '#10B981', 'position' => 5, 'is_default' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid(), 'name' => 'Deal Lost', 'slug' => 'deal-lost', 'color' => '#EF4444', 'position' => 6, 'is_default' => false, 'created_at' => now(), 'updated_at' => now()],
        ];
        
        DB::table('lead_statuses')->insert($statuses);

        // 2. Add status_id to leads
        Schema::table('leads', function (Blueprint $table) {
            $table->uuid('status_id')->nullable()->after('source_id');
            $table->foreign('status_id')->references('id')->on('lead_statuses')->nullOnDelete();
        });

        // 3. Migrate data
        $leads = DB::table('leads')->get();
        foreach ($leads as $lead) {
            $slug = strtolower($lead->status);
            if ($slug == 'deal won') $slug = 'deal-won';
            if ($slug == 'deal lost') $slug = 'deal-lost';
            
            $statusRow = DB::table('lead_statuses')->where('slug', $slug)->first();
            if ($statusRow) {
                DB::table('leads')->where('id', $lead->id)->update(['status_id' => $statusRow->id]);
            } else {
                $cold = DB::table('lead_statuses')->where('slug', 'cold')->first();
                if ($cold) {
                    DB::table('leads')->where('id', $lead->id)->update(['status_id' => $cold->id]);
                }
            }
        }

        // 4. Drop old status
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('status')->default('cold')->after('source_id');
        });

        // Try to revert data
        $leads = DB::table('leads')->get();
        foreach ($leads as $lead) {
            if ($lead->status_id) {
                $statusRow = DB::table('lead_statuses')->where('id', $lead->status_id)->first();
                if ($statusRow) {
                    $val = $statusRow->name;
                    DB::table('leads')->where('id', $lead->id)->update(['status' => $val]);
                }
            }
        }

        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->dropColumn('status_id');
        });
        
        DB::table('lead_statuses')->truncate();
    }
};
