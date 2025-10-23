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
            $table->string('lineup_type')->nullable()->after('team_name'); // e.g., '2-2-1', '3-1-1', etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fantasy_teams', function (Blueprint $table) {
            $table->dropColumn('lineup_type');
        });
    }
};
