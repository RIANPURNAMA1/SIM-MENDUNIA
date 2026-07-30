<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $template = DB::table('notification_templates')
            ->where('key', 'payment_verified_wa')
            ->first();

        if ($template) {
            $variables = is_string($template->variables)
                ? json_decode($template->variables, true)
                : ($template->variables ?? []);

            if (!in_array('link_grup', $variables)) {
                $variables[] = 'link_grup';
            }

            $body = $template->body;
            if (!str_contains($body, '{link_grup}')) {
                $body = rtrim($body, "\n");
                $body .= "\n\n{link_grup}";
            }

            DB::table('notification_templates')
                ->where('key', 'payment_verified_wa')
                ->update([
                    'variables' => json_encode($variables),
                    'body' => $body,
                ]);
        }
    }

    public function down(): void
    {
        $template = DB::table('notification_templates')
            ->where('key', 'payment_verified_wa')
            ->first();

        if ($template) {
            $variables = is_string($template->variables)
                ? json_decode($template->variables, true)
                : ($template->variables ?? []);
            $variables = array_values(array_filter($variables, fn($v) => $v !== 'link_grup'));

            $body = $template->body;
            $body = preg_replace('/\n*\{link_grup\}/', '', $body);

            DB::table('notification_templates')
                ->where('key', 'payment_verified_wa')
                ->update([
                    'variables' => json_encode($variables),
                    'body' => $body,
                ]);
        }
    }
};
