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
        Schema::create('fantasy_team_round_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fantasy_team_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('round');
            $table->decimal('points', 10, 2)->default(0);
            $table->timestamps();

            // Ensure one record per team per round
            $table->unique(['fantasy_team_id', 'round']);

            // Index for fast lookups by round
            $table->index(['round', 'points']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fantasy_team_round_points');
    }
};
