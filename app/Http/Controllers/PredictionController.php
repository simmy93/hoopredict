<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\League;
use App\Models\Prediction;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PredictionController extends Controller
{
    use AuthorizesRequests;

    public function store(Request $request)
    {
        $request->validate([
            'game_id' => 'required|exists:games,id',
            'league_id' => 'required|exists:leagues,id',
            'home_score_prediction' => 'required|integer|min:50|max:150',
            'away_score_prediction' => 'required|integer|min:50|max:150'
        ]);

        // Check that scores are not equal (no ties allowed)
        if ($request->home_score_prediction == $request->away_score_prediction) {
            throw ValidationException::withMessages([
                'away_score_prediction' => 'Basketball games cannot end in a tie. Scores must be different.'
            ]);
        }

        $game = Game::findOrFail($request->game_id);
        $league = League::findOrFail($request->league_id);

        // Check if user is member of this league
        if (!$league->hasUser(auth()->user())) {
            throw ValidationException::withMessages([
                'league_id' => 'You are not a member of this league.'
            ]);
        }

        // Check if game is still accepting predictions
        if (!$game->canAcceptPredictions()) {
            throw ValidationException::withMessages([
                'game_id' => 'Predictions for this game are no longer accepted.'
            ]);
        }

        // Create or update prediction
        $prediction = Prediction::updateOrCreate(
            [
                'user_id' => auth()->id(),
                'league_id' => $request->league_id,
                'game_id' => $request->game_id
            ],
            [
                'home_score_prediction' => $request->home_score_prediction,
                'away_score_prediction' => $request->away_score_prediction,
                'predicted_at' => now()
            ]
        );

        return back()->with('success', 'Prediction saved successfully!');
    }

    public function destroy(Prediction $prediction)
    {
        $this->authorize('delete', $prediction);

        if (!$prediction->canEdit()) {
            return back()->withErrors(['error' => 'This prediction can no longer be deleted.']);
        }

        $prediction->delete();

        return back()->with('success', 'Prediction deleted successfully.');
    }

    public function index()
    {
        $userPredictions = Prediction::with(['game.homeTeam', 'game.awayTeam', 'league'])
            ->where('user_id', auth()->id())
            ->whereHas('game', function ($query) {
                $query->where('scheduled_at', '>', now()->subDays(7));
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Predictions/Index', [
            'predictions' => $userPredictions
        ]);
    }
}