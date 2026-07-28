<?php

namespace Database\Seeders;

use App\Models\NotificationTemplate;
use App\Http\Controllers\NotificationTemplateController;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = NotificationTemplateController::getDefaultTemplates();

        foreach ($defaults as $key => $tmpl) {
            NotificationTemplate::updateOrCreate(
                ['key' => $key],
                [
                    'name' => $tmpl['name'],
                    'description' => $tmpl['description'],
                    'channel' => $tmpl['channel'],
                    'subject' => $tmpl['subject'],
                    'body' => $tmpl['body'],
                    'variables' => $tmpl['variables'] ?? [],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Notification templates seeded successfully!');
    }
}
