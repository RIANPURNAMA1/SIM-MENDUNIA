<?php

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
         $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

         $middleware->api(prepend: [
             \Illuminate\Http\Middleware\HandleCors::class,
         ]);

         $middleware->api(append: [
             \Illuminate\Session\Middleware\StartSession::class,
         ]);

         $middleware->web(append: [
             \App\Http\Middleware\ApplyMailSettings::class,
         ]);

         $middleware->api(prepend: [
             \App\Http\Middleware\ApplyMailSettings::class,
         ]);

         $middleware->validateCsrfTokens(except: [
             'api/*',
         ]);
     })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
