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
        Schema::table('fantasy_team_players', function (Blueprint $table) {
            // Position in the team's lineup (1-5 = starters, 6 = sixth man, 7+ = bench)
            // NULL = not in active lineup (for teams with more than team_size players)
            $table->integer('lineup_position')->nullable()->after('player_id');

            // Index for efficient lineup queries
            $table->index(['fantasy_team_id', 'lineup_position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fantasy_team_players', function (Blueprint $table) {
            $table->dropIndex(['fantasy_team_id', 'lineup_position']);
            $table->dropColumn('lineup_position');
        });
    }
};
