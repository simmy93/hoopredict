<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FantasyLeague extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'championship_id',
        'mode',
        'budget',
        'team_size',
        'invite_code',
        'is_active',
        'is_private',
        'max_members',
        'draft_date',
        'draft_status',
        'current_pick',
        'pick_started_at',
        'pick_time_limit',
        'is_paused',
        'paused_at',
        'paused_by_user_id',
        'pause_time_remaining',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'is_active' => 'boolean',
            'is_private' => 'boolean',
            'is_paused' => 'boolean',
            'draft_date' => 'datetime',
            'pick_started_at' => 'datetime',
            'paused_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function championship(): BelongsTo
    {
        return $this->belongsTo(Championship::class);
    }

    public function teams(): HasMany
    {
        return $this->hasMany(FantasyTeam::class);
    }

    public function draftPicks(): HasMany
    {
        return $this->hasMany(DraftPick::class);
    }

    public function draftActions(): HasMany
    {
        return $this->hasMany(DraftAction::class);
    }

    public function pausedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paused_by_user_id');
    }

    public function isFull(): bool
    {
        return $this->teams()->count() >= $this->max_members;
    }

    public function hasUser(User $user): bool
    {
        return $this->teams()->where('user_id', $user->id)->exists();
    }

    public function getInviteUrl(): string
    {
        return url("/fantasy/leagues/join/{$this->invite_code}");
    }

    public function generateDraftOrder(): void
    {
        $teams = $this->teams()->get()->shuffle();

        foreach ($teams as $index => $team) {
            $team->update(['draft_order' => $index + 1]);
        }

        $this->update([
            'draft_status' => 'in_progress',
            'current_pick' => 1,
            'pick_started_at' => now(),
        ]);
    }

    public function getCurrentDraftTeam(): ?FantasyTeam
    {
        if ($this->draft_status !== 'in_progress') {
            return null;
        }

        $totalTeams = $this->teams()->count();
        $currentRound = (int)ceil($this->current_pick / $totalTeams);

        // Snake draft: even rounds go in reverse
        if ($currentRound % 2 === 0) {
            $positionInRound = $totalTeams - (($this->current_pick - 1) % $totalTeams);
        } else {
            $positionInRound = (($this->current_pick - 1) % $totalTeams) + 1;
        }

        return $this->teams()->where('draft_order', $positionInRound)->first();
    }

    public function isDraftComplete(): bool
    {
        $totalPicks = $this->teams()->count() * $this->team_size;
        return $this->current_pick > $totalPicks;
    }

    public function getTimeRemaining(): ?int
    {
        if (!$this->pick_started_at || $this->draft_status !== 'in_progress') {
            return null;
        }

        // Use millisecond-based calculation to avoid timezone issues
        $pickStartedAtMs = $this->pick_started_at->valueOf();
        $nowMs = now()->valueOf();
        $elapsedSeconds = ($nowMs - $pickStartedAtMs) / 1000;
        $remaining = $this->pick_time_limit - $elapsedSeconds;

        return max(0, (int) $remaining);
    }

    public function isPickExpired(): bool
    {
        $remaining = $this->getTimeRemaining();
        return $remaining !== null && $remaining <= 0;
    }

    /**
     * Pause the draft
     */
    public function pauseDraft(User $user): bool
    {
        if ($this->draft_status !== 'in_progress' || $this->is_paused) {
            return false;
        }

        // Calculate time remaining when paused
        $timeRemaining = $this->getTimeRemaining();

        $this->update([
            'is_paused' => true,
            'paused_at' => now(),
            'paused_by_user_id' => $user->id,
            'pause_time_remaining' => $timeRemaining,
        ]);

        // Log the pause action
        DraftAction::log(
            fantasyLeagueId: $this->id,
            actionType: 'pause',
            userId: $user->id,
            details: ['time_remaining' => $timeRemaining]
        );

        // Broadcast pause event
        broadcast(new \App\Events\DraftPaused($this, $user, $timeRemaining ?? 0));

        return true;
    }

    /**
     * Resume the draft
     */
    public function resumeDraft(User $user): bool
    {
        if ($this->draft_status !== 'in_progress' || !$this->is_paused) {
            return false;
        }

        // Reset the pick started time based on remaining time
        $newPickStartedAt = now()->subSeconds($this->pick_time_limit - ($this->pause_time_remaining ?? 0));

        $this->update([
            'is_paused' => false,
            'paused_at' => null,
            'paused_by_user_id' => null,
            'pause_time_remaining' => null,
            'pick_started_at' => $newPickStartedAt,
        ]);

        // Log the resume action
        DraftAction::log(
            fantasyLeagueId: $this->id,
            actionType: 'resume',
            userId: $user->id
        );

        // Broadcast resume event
        broadcast(new \App\Events\DraftResumed($this, $user));

        return true;
    }

    /**
     * Check if user can pause/resume (must be league owner)
     */
    public function canUserPauseResume(User $user): bool
    {
        return $this->owner_id === $user->id;
    }
}
