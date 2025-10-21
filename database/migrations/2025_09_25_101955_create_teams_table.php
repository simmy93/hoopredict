<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('championship_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('short_name')->nullable();
            $table->string('logo')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->string('external_id')->nullable(); // For scraping reference
            $table->timestamps();

            $table->index(['championship_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
