<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('league_leaderboards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('league_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('total_points')->default(0);
            $table->integer('total_predictions')->default(0);
            $table->integer('correct_predictions')->default(0);
            $table->integer('exact_score_predictions')->default(0);
            $table->integer('exact_difference_predictions')->default(0);
            $table->integer('within_5_predictions')->default(0);
            $table->integer('within_10_predictions')->default(0);
            $table->integer('winner_only_predictions')->default(0);
            $table->decimal('accuracy_percentage', 5, 2)->default(0);
            $table->timestamps();

            $table->unique(['league_id', 'user_id']);
            $table->index(['league_id', 'total_points']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('league_leaderboards');
    }
};