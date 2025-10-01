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
        Schema::create('fantasy_leagues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->enum('mode', ['budget', 'draft'])->default('budget'); // budget or draft
            $table->decimal('budget', 12, 2)->default(100000000); // Default 100M budget for budget mode
            $table->integer('team_size')->default(10); // Max players per team
            $table->string('invite_code', 6)->unique();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_private')->default(false);
            $table->integer('max_members')->default(20);
            $table->timestamp('draft_date')->nullable(); // For draft mode
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fantasy_leagues');
    }
};
