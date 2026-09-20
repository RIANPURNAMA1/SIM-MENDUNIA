<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case configuration class by default. A common pattern is to extend the base test case
| (Tests\TestCase) and use the `uses` function to make it available to your tests.
|
*/

uses(Tests\TestCase::class)->in('Feature')->in('Unit');
