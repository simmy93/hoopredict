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
        Schema::table('round_processing_status', function (Blueprint $table) {
            $table->boolean('lineups_snapshotted')->default(false)->after('players_updated');
            $table->timestamp('lineups_snapshotted_at')->nullable()->after('lineups_snapshotted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('round_processing_status', function (Blueprint $table) {
            $table->dropColumn(['lineups_snapshotted', 'lineups_snapshotted_at']);
        });
    }
};
