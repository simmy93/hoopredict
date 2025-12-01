<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Player;
use App\Models\FantasyLeague;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserPlayerWatchlistTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_add_a_player_to_their_watchlist()
    {
        $user = User::factory()->create();
        $player = Player::factory()->create();

        $this->actingAs($user)
            ->post(route('watchlist.toggle', $player));

        $this->assertDatabaseHas('user_player_watchlist', [
            'user_id' => $user->id,
            'player_id' => $player->id,
        ]);
    }

    public function test_a_user_can_remove_a_player_from_their_watchlist()
    {
        $user = User::factory()->create();
        $player = Player::factory()->create();
        $user->watchlist()->attach($player);

        $this->actingAs($user)
            ->post(route('watchlist.toggle', $player));

        $this->assertDatabaseMissing('user_player_watchlist', [
            'user_id' => $user->id,
            'player_id' => $player->id,
        ]);
    }

    public function test_a_user_can_view_their_watchlist()
    {
        $user = User::factory()->create();
        $player = Player::factory()->create();
        $user->watchlist()->attach($player);

        $this->actingAs($user)
            ->get(route('watchlist.index'))
            ->assertInertia(fn ($page) => $page
                ->component('Watchlist/Index')
                ->has('watchlistPlayers', 1)
            );
    }

    public function test_watchlist_is_passed_to_the_fantasy_players_index_view()
    {
        $user = User::factory()->create();
        $league = FantasyLeague::factory()->create();
        $user->leagues()->attach($league, ['is_admin' => true]);
        $team = $user->teams()->where('fantasy_league_id', $league->id)->first();
        $player = Player::factory()->create(['team_id' => $team->id]);
        $user->watchlist()->attach($player);


        $this->actingAs($user)
            ->get(route('fantasy-leagues.players.index', $league))
            ->assertInertia(fn ($page) => $page
                ->component('Fantasy/Players/Index')
                ->has('watchlist', 1)
            );
    }
}
