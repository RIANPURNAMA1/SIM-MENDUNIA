<?php

namespace Database\Seeders;

use App\Models\AssessmentCategory;
use App\Models\AssessmentComponent;
use Illuminate\Database\Seeder;

class AssessmentLevelSeeder extends Seeder
{
    public function run(): void
    {
        // LEVEL 1 - HIRAGANA KATAKANA
        $cat1 = AssessmentCategory::firstOrCreate(
            ['level' => '1', 'nama_kategori' => 'HIRAGANA KATAKANA'],
            ['urutan' => 1]
        );

        if ($cat1->wasRecentlyCreated) {
            AssessmentComponent::create(['category_id' => $cat1->id, 'sub_komponen' => 'Menulis', 'urutan' => 1]);
            AssessmentComponent::create(['category_id' => $cat1->id, 'sub_komponen' => 'Membaca', 'urutan' => 2]);
        }

        // LEVEL 1 - LEVEL 1
        $cat2 = AssessmentCategory::firstOrCreate(
            ['level' => '1', 'nama_kategori' => 'LEVEL 1'],
            ['urutan' => 2]
        );

        if ($cat2->wasRecentlyCreated) {
            $urutan = 1;
            foreach (['PR', 'Hafalan', 'Kanji', 'Ulangan', 'Shoukai', 'Translate'] as $sk) {
                AssessmentComponent::create(['category_id' => $cat2->id, 'sub_komponen' => $sk, 'urutan' => $urutan++]);
            }
        }

        // LEVEL 2 - LEVEL 2
        $cat3 = AssessmentCategory::firstOrCreate(
            ['level' => '2', 'nama_kategori' => 'LEVEL 2'],
            ['urutan' => 1]
        );

        if ($cat3->wasRecentlyCreated) {
            $urutan = 1;
            foreach (['PR', 'Hafalan', 'Kanji', 'Ulangan', 'Shoukai', 'Translate'] as $sk) {
                AssessmentComponent::create(['category_id' => $cat3->id, 'sub_komponen' => $sk, 'urutan' => $urutan++]);
            }
        }

        // LEVEL 3 - LEVEL 3
        $cat4 = AssessmentCategory::firstOrCreate(
            ['level' => '3', 'nama_kategori' => 'LEVEL 3'],
            ['urutan' => 1]
        );

        if ($cat4->wasRecentlyCreated) {
            $urutan = 1;
            foreach (['Kotoba', 'Kanji', 'Shoukai', 'Translate'] as $sk) {
                AssessmentComponent::create(['category_id' => $cat4->id, 'sub_komponen' => $sk, 'urutan' => $urutan++]);
            }
        }

        // LEVEL 4 - LEVEL 4
        $cat5 = AssessmentCategory::firstOrCreate(
            ['level' => '4', 'nama_kategori' => 'LEVEL 4'],
            ['urutan' => 1]
        );

        if ($cat5->wasRecentlyCreated) {
            $urutan = 1;
            foreach (['Kotoba', 'Jikoshoukai', 'Simulasi 1', 'Translate'] as $sk) {
                AssessmentComponent::create(['category_id' => $cat5->id, 'sub_komponen' => $sk, 'urutan' => $urutan++]);
            }
        }
    }
}
