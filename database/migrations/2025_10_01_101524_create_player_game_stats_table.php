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
        Schema::create('player_game_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->integer('minutes_played')->default(0);
            $table->integer('points')->default(0);
            $table->integer('rebounds')->default(0);
            $table->integer('assists')->default(0);
            $table->integer('steals')->default(0);
            $table->integer('blocks')->default(0);
            $table->integer('turnovers')->default(0);
            $table->decimal('fantasy_points', 8, 2)->default(0); // Calculated fantasy points
            $table->timestamps();

            $table->unique(['player_id', 'game_id']); // One stat entry per player per game
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_game_stats');
    }
};
