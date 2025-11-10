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
            $table->boolean('is_captain')->default(false)->after('lineup_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fantasy_team_players', function (Blueprint $table) {
            $table->dropColumn('is_captain');
        });
    }
};
