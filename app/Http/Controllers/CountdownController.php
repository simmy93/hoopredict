<?php

namespace App\Http\Controllers;

use App\Events\CountdownStarted;
use Illuminate\Http\Request;

class CountdownController extends Controller
{
    public function start(Request $request)
    {
        $duration = (int) ($request->input('duration', 60)); // seconds
        $endTimeMs = now()->addSeconds($duration)->valueOf();

        // broadcast the event (queued by default)
        broadcast(new CountdownStarted($endTimeMs));

        return back();
    }
}
