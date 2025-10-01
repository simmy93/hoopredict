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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique();
            $table->string('name');
            $table->string('position'); // Guard, Forward, Center
            $table->integer('jersey_number')->nullable();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->string('photo_url')->nullable();
            $table->string('country')->nullable();
            $table->decimal('price', 10, 2)->default(1000000); // Fantasy price in budget mode
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
