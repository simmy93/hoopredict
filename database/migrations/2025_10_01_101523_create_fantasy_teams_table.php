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
        Schema::create('fantasy_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fantasy_league_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('team_name');
            $table->decimal('budget_spent', 12, 2)->default(0); // Total spent on players
            $table->decimal('budget_remaining', 12, 2); // Remaining budget
            $table->integer('total_points')->default(0); // Accumulated fantasy points
            $table->timestamps();

            $table->unique(['fantasy_league_id', 'user_id']); // One team per user per league
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fantasy_teams');
    }
};
