<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indonesia_provinces', function (Blueprint $table) {
            $table->id();
            $table->char('code', 2)->unique();
            $table->string('name');
        });

        Schema::create('indonesia_cities', function (Blueprint $table) {
            $table->id();
            $table->char('province_code', 2)->index();
            $table->char('code', 4)->unique();
            $table->string('name');
            $table->string('type');
        });

        Schema::create('indonesia_districts', function (Blueprint $table) {
            $table->id();
            $table->char('city_code', 4)->index();
            $table->char('code', 7)->unique();
            $table->string('name');
        });

        Schema::create('indonesia_villages', function (Blueprint $table) {
            $table->id();
            $table->char('district_code', 7)->index();
            $table->char('code', 10)->unique();
            $table->string('name');
            $table->string('postal_code', 5)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indonesia_villages');
        Schema::dropIfExists('indonesia_districts');
        Schema::dropIfExists('indonesia_cities');
        Schema::dropIfExists('indonesia_provinces');
    }
};
