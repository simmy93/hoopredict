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
        Schema::table('draft_picks', function (Blueprint $table) {
            // Ensure each pick number is unique within a league (prevents duplicate picks)
            $table->unique(['fantasy_league_id', 'pick_number'], 'unique_league_pick_number');

            // Ensure each player can only be drafted once per league
            $table->unique(['fantasy_league_id', 'player_id'], 'unique_league_player');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('draft_picks', function (Blueprint $table) {
            $table->dropUnique('unique_league_pick_number');
            $table->dropUnique('unique_league_player');
        });
    }
};
