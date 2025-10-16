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
            $table->boolean('is_paused')->default(false)->after('draft_status');
            $table->timestamp('paused_at')->nullable()->after('is_paused');
            $table->foreignId('paused_by_user_id')->nullable()->constrained('users')->onDelete('set null')->after('paused_at');
            $table->integer('pause_time_remaining')->nullable()->after('paused_by_user_id'); // milliseconds remaining on timer when paused
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fantasy_leagues', function (Blueprint $table) {
            $table->dropForeign(['paused_by_user_id']);
            $table->dropColumn(['is_paused', 'paused_at', 'paused_by_user_id', 'pause_time_remaining']);
        });
    }
};
