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
        Schema::create('round_processing_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->integer('round_number');
            $table->timestamp('processed_at');
            $table->integer('total_games')->default(0); // Total games in this round
            $table->integer('finished_games')->default(0); // Finished games when processed
            $table->integer('players_updated')->default(0); // Players with price updates
            $table->timestamps();

            // Ensure one record per championship per round
            $table->unique(['championship_id', 'round_number']);

            // Index for querying latest processed round
            $table->index(['championship_id', 'round_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('round_processing_status');
    }
};
