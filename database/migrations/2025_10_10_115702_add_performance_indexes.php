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
        Schema::table('fantasy_teams', function (Blueprint $table) {
            // Index for finding teams in a league
            $table->index('fantasy_league_id');
            // Index for finding a user's team
            $table->index('user_id');
            // Composite index for finding a specific user's team in a league
            $table->index(['fantasy_league_id', 'user_id']);
        });

        Schema::table('draft_picks', function (Blueprint $table) {
            // Index for finding all picks in a league
            $table->index('fantasy_league_id');
            // Index for finding a specific pick number in a league
            $table->index(['fantasy_league_id', 'pick_number']);
            // Index for checking if a player has been drafted
            $table->index('player_id');
            // Index for finding all picks by a team
            $table->index('fantasy_team_id');
        });

        Schema::table('players', function (Blueprint $table) {
            // Index for filtering active players
            $table->index('is_active');
            // Index for finding players by team
            $table->index('team_id');
            // Composite index for active players by team
            $table->index(['is_active', 'team_id']);
        });

        Schema::table('fantasy_team_players', function (Blueprint $table) {
            // Index for finding players on a team
            $table->index('fantasy_team_id');
            // Index for finding teams that have a player
            $table->index('player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fantasy_teams', function (Blueprint $table) {
            $table->dropIndex(['fantasy_league_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['fantasy_league_id', 'user_id']);
        });

        Schema::table('draft_picks', function (Blueprint $table) {
            $table->dropIndex(['fantasy_league_id']);
            $table->dropIndex(['fantasy_league_id', 'pick_number']);
            $table->dropIndex(['player_id']);
            $table->dropIndex(['fantasy_team_id']);
        });

        Schema::table('players', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['team_id']);
            $table->dropIndex(['is_active', 'team_id']);
        });

        Schema::table('fantasy_team_players', function (Blueprint $table) {
            $table->dropIndex(['fantasy_team_id']);
            $table->dropIndex(['player_id']);
        });
    }
};
