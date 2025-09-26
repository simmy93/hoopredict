<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('league_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->integer('home_score_prediction');
            $table->integer('away_score_prediction');
            $table->integer('points_earned')->nullable(); // Calculated after game finishes
            $table->string('scoring_method')->nullable(); // exact_score, exact_difference, within_5, within_10, winner_only
            $table->datetime('predicted_at')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'league_id', 'game_id']);
            $table->index(['league_id', 'game_id']);
            $table->index(['user_id', 'league_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};