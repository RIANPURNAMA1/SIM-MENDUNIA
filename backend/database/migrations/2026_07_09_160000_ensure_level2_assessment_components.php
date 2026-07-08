<?php

use App\Models\AssessmentCategory;
use App\Models\AssessmentComponent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $cat = AssessmentCategory::firstOrCreate(
            ['level' => '2', 'nama_kategori' => 'LEVEL 2'],
            ['urutan' => 1]
        );

        $existingComponents = AssessmentComponent::where('category_id', $cat->id)->pluck('sub_komponen')->toArray();

        $components = ['PR', 'Hafalan', 'Kanji', 'Ulangan', 'Shoukai', 'Translate'];
        $urutan = 1;

        foreach ($components as $sk) {
            if (!in_array($sk, $existingComponents)) {
                AssessmentComponent::create([
                    'category_id' => $cat->id,
                    'sub_komponen' => $sk,
                    'urutan' => $urutan,
                ]);
            }
            $urutan++;
        }
    }

    public function down(): void
    {
        AssessmentCategory::where('level', '2')->each(function ($cat) {
            AssessmentComponent::where('category_id', $cat->id)->delete();
            $cat->delete();
        });
    }
};
