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
        Schema::create('player_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->integer('round_number'); // 1-38 for EuroLeague regular season
            $table->decimal('price', 12, 2)->nullable(); // Price after this round (null if didn't play)
            $table->decimal('average_fantasy_points', 8, 2)->nullable(); // Avg FP used for calculation
            $table->integer('games_used')->default(0); // How many games used (1-5)
            $table->integer('games_played_in_round')->default(0); // Games played in this specific round
            $table->timestamps();

            // Ensure one record per player per round
            $table->unique(['player_id', 'round_number']);

            // Index for querying player history
            $table->index(['player_id', 'round_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_price_histories');
    }
};
