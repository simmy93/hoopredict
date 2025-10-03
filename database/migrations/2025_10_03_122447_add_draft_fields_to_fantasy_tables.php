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
        // Add draft fields to fantasy_leagues
        Schema::table('fantasy_leagues', function (Blueprint $table) {
            $table->enum('draft_status', ['pending', 'in_progress', 'completed'])->default('pending')->after('draft_date');
            $table->integer('current_pick')->default(1)->after('draft_status');
        });

        // Add draft_order to fantasy_teams
        Schema::table('fantasy_teams', function (Blueprint $table) {
            $table->integer('draft_order')->nullable()->after('team_name');
        });

        // Create draft_picks table
        Schema::create('draft_picks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fantasy_league_id')->constrained()->onDelete('cascade');
            $table->foreignId('fantasy_team_id')->constrained()->onDelete('cascade');
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->integer('pick_number');
            $table->integer('round');
            $table->timestamp('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draft_picks');

        Schema::table('fantasy_teams', function (Blueprint $table) {
            $table->dropColumn('draft_order');
        });

        Schema::table('fantasy_leagues', function (Blueprint $table) {
            $table->dropColumn(['draft_status', 'current_pick']);
        });
    }
};
