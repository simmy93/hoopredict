<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('league_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('league_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->datetime('joined_at')->useCurrent();
            $table->enum('role', ['member', 'admin', 'owner'])->default('member');
            $table->timestamps();

            $table->unique(['league_id', 'user_id']);
            $table->index(['league_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('league_members');
    }
};
