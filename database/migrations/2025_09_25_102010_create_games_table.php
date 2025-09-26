<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->foreignId('home_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->constrained('teams')->onDelete('cascade');
            $table->datetime('scheduled_at');
            $table->enum('status', ['scheduled', 'live', 'finished', 'postponed', 'cancelled'])->default('scheduled');
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->integer('round')->nullable(); // EuroLeague round number
            $table->string('external_id')->nullable(); // For scraping reference
            $table->timestamps();

            $table->index(['championship_id', 'scheduled_at']);
            $table->index(['status', 'scheduled_at']);
            $table->index('external_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};