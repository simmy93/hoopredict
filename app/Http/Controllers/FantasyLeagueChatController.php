<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Models\FantasyLeague;
use App\Models\FantasyLeagueMessage;
use Illuminate\Http\Request;

class FantasyLeagueChatController extends Controller
{
    /**
     * Get messages for a fantasy league
     */
    public function index(FantasyLeague $league)
    {
        // Verify user is in the league
        if (!$league->hasUser(auth()->user())) {
            abort(403, 'You are not a member of this league.');
        }

        $messages = $league->messages()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->reverse()
            ->values();

        return response()->json($messages);
    }

    /**
     * Send a message to a fantasy league
     */
    public function store(Request $request, FantasyLeague $league)
    {
        // Verify user is in the league
        if (!$league->hasUser(auth()->user())) {
            abort(403, 'You are not a member of this league.');
        }

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = $league->messages()->create([
            'user_id' => auth()->id(),
            'message' => $validated['message'],
            'is_system' => false,
        ]);

        $message->load('user:id,name');

        // Broadcast the message to all league members
        broadcast(new MessageSent($league, $message))->toOthers();

        return response()->json($message, 201);
    }

    /**
     * Send a system message (for automated events)
     */
    public static function sendSystemMessage(FantasyLeague $league, string $message): void
    {
        $systemMessage = $league->messages()->create([
            'user_id' => $league->owner_id, // Use owner as sender for system messages
            'message' => $message,
            'is_system' => true,
        ]);

        $systemMessage->load('user:id,name');

        // Broadcast the system message
        broadcast(new MessageSent($league, $systemMessage));
    }
}
