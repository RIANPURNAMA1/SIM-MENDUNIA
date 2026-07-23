<?php

use App\Models\AssessmentCategory;
use App\Models\AssessmentComponent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // LEVEL 1 - HIRAGANA KATAKANA
        $cat1 = AssessmentCategory::firstOrCreate(
            ['level' => '1', 'nama_kategori' => 'HIRAGANA KATAKANA'],
            ['urutan' => 1]
        );
        $existing1 = AssessmentComponent::where('category_id', $cat1->id)->pluck('sub_komponen')->toArray();
        foreach (['Menulis', 'Membaca'] as $idx => $sk) {
            if (!in_array($sk, $existing1)) {
                AssessmentComponent::create(['category_id' => $cat1->id, 'sub_komponen' => $sk, 'urutan' => $idx + 1]);
            }
        }

        // LEVEL 1 - LEVEL 1
        $cat2 = AssessmentCategory::firstOrCreate(
            ['level' => '1', 'nama_kategori' => 'LEVEL 1'],
            ['urutan' => 2]
        );
        $existing2 = AssessmentComponent::where('category_id', $cat2->id)->pluck('sub_komponen')->toArray();
        $urutan = 1;
        foreach (['PR', 'Hafalan', 'Kanji', 'Ulangan', 'Shoukai', 'Translate'] as $sk) {
            if (!in_array($sk, $existing2)) {
                AssessmentComponent::create(['category_id' => $cat2->id, 'sub_komponen' => $sk, 'urutan' => $urutan]);
            }
            $urutan++;
        }

        // LEVEL 2 - LEVEL 2
        $cat3 = AssessmentCategory::firstOrCreate(
            ['level' => '2', 'nama_kategori' => 'LEVEL 2'],
            ['urutan' => 1]
        );
        $existing3 = AssessmentComponent::where('category_id', $cat3->id)->pluck('sub_komponen')->toArray();
        $urutan = 1;
        foreach (['PR', 'Hafalan', 'Kanji', 'Ulangan', 'Shoukai', 'Translate'] as $sk) {
            if (!in_array($sk, $existing3)) {
                AssessmentComponent::create(['category_id' => $cat3->id, 'sub_komponen' => $sk, 'urutan' => $urutan]);
            }
            $urutan++;
        }

        // LEVEL 3 - LEVEL 3
        $cat4 = AssessmentCategory::firstOrCreate(
            ['level' => '3', 'nama_kategori' => 'LEVEL 3'],
            ['urutan' => 1]
        );
        $existing4 = AssessmentComponent::where('category_id', $cat4->id)->pluck('sub_komponen')->toArray();
        $urutan = 1;
        foreach (['Kotoba', 'Kanji', 'Shoukai', 'Translate'] as $sk) {
            if (!in_array($sk, $existing4)) {
                AssessmentComponent::create(['category_id' => $cat4->id, 'sub_komponen' => $sk, 'urutan' => $urutan]);
            }
            $urutan++;
        }

        // LEVEL 4 - LEVEL 4
        $cat5 = AssessmentCategory::firstOrCreate(
            ['level' => '4', 'nama_kategori' => 'LEVEL 4'],
            ['urutan' => 1]
        );
        $existing5 = AssessmentComponent::where('category_id', $cat5->id)->pluck('sub_komponen')->toArray();
        $urutan = 1;
        foreach (['Kotoba', 'Jikoshoukai', 'Simulasi 1', 'Translate'] as $sk) {
            if (!in_array($sk, $existing5)) {
                AssessmentComponent::create(['category_id' => $cat5->id, 'sub_komponen' => $sk, 'urutan' => $urutan]);
            }
            $urutan++;
        }
    }

    public function down(): void
    {
        // Hapus semua kategori dan komponen yang di-seed
        $levels = ['1', '2', '3', '4'];
        foreach ($levels as $level) {
            AssessmentCategory::where('level', $level)->each(function ($cat) {
                AssessmentComponent::where('category_id', $cat->id)->delete();
                $cat->delete();
            });
        }
    }
};
