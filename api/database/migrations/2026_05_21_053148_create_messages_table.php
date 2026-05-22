<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->string('sender_type');
            $table->uuid('sender_id')->nullable();
            $table->string('content_type');
            $table->text('content_text')->nullable();
            $table->string('media_url')->nullable();
            $table->string('template_name')->nullable();
            $table->string('message_id')->nullable();
            $table->string('status')->default('sent');
            $table->uuid('reply_to_message_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
