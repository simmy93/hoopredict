<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leagues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_private')->default(false);
            $table->string('invite_code')->unique();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->integer('max_members')->default(50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('invite_code');
            $table->index(['owner_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leagues');
    }
};
