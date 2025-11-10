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
        Schema::create('fantasy_team_lineup_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fantasy_team_id')->constrained()->onDelete('cascade');
            $table->integer('round');
            $table->foreignId('fantasy_team_player_id')->constrained()->onDelete('cascade');
            $table->integer('lineup_position')->nullable(); // 1-5 starters, 6 sixth man, 7-10 bench, null = not in lineup
            $table->boolean('is_captain')->default(false);
            $table->timestamps();

            // Ensure unique lineup entry per team, round, and player
            $table->unique(['fantasy_team_id', 'round', 'fantasy_team_player_id'], 'lineup_history_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fantasy_team_lineup_history');
    }
};
