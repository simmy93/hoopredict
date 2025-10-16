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
        Schema::create('draft_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fantasy_league_id')->constrained()->onDelete('cascade');
            $table->foreignId('fantasy_team_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('player_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action_type'); // 'pick', 'auto_pick', 'pause', 'resume', 'start', 'complete'
            $table->integer('pick_number')->nullable();
            $table->integer('round_number')->nullable();
            $table->text('details')->nullable(); // JSON field for additional details
            $table->timestamp('action_at');
            $table->timestamps();

            $table->index(['fantasy_league_id', 'action_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draft_actions');
    }
};
