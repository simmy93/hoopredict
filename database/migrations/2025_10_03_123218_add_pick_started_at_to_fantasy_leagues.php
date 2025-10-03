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
        Schema::table('fantasy_leagues', function (Blueprint $table) {
            $table->timestamp('pick_started_at')->nullable()->after('current_pick');
            $table->integer('pick_time_limit')->default(90)->after('pick_started_at'); // seconds
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fantasy_leagues', function (Blueprint $table) {
            $table->dropColumn(['pick_started_at', 'pick_time_limit']);
        });
    }
};
