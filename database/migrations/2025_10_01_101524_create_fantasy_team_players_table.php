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
        Schema::create('fantasy_team_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fantasy_team_id')->constrained()->onDelete('cascade');
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->decimal('purchase_price', 10, 2); // Price when bought (budget mode)
            $table->integer('points_earned')->default(0); // Points earned by this player for this team
            $table->timestamp('acquired_at');
            $table->timestamps();

            $table->unique(['fantasy_team_id', 'player_id']); // Can't buy same player twice
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fantasy_team_players');
    }
};
