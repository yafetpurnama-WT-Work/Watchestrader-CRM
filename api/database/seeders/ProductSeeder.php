<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'brand' => 'ROLEX', 'model' => 'Datejust II 41mm', 'reference_number' => '126331-0016',
                'description' => 'Datejust II 41mm, st/rg, Wimbledon dial, Jubilee Bracelet',
                'year' => 2025, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel / Rose Gold', 'case_size' => '41mm',
                'dial_color' => 'Wimbledon', 'strap_material' => 'Jubilee Bracelet', 'bezel_type' => 'Fluted',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 315000000, 'currency' => 'IDR',
                'image_url' => 'https://worldtechno.net/web/uploads/item/9915_0_1779421645_web.png',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Datejust 31mm', 'reference_number' => '278271-0004',
                'description' => 'Datejust 31mm, st/rg, Choco VI diam dial, Jubilee Bracelet',
                'year' => 2026, 'condition' => 'unworn', 'category' => 'ladies',
                'movement_type' => 'Automatic', 'case_material' => 'Steel / Rose Gold', 'case_size' => '31mm',
                'dial_color' => 'Chocolate VI Diamond', 'strap_material' => 'Jubilee Bracelet', 'bezel_type' => 'Fluted',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 358000000, 'discount_price' => 354420000, 'discount_percent' => 1, 'currency' => 'IDR',
                'image_url' => 'https://worldtechno.net/web/uploads/item/9878_0_1779074255_web.png',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Datejust 31mm', 'reference_number' => '278274-0002',
                'description' => 'Datejust 31mm, st/wg, Black Roman dial, Jubilee Bracelet',
                'year' => 2026, 'condition' => 'unworn', 'category' => 'ladies',
                'movement_type' => 'Automatic', 'case_material' => 'Steel / White Gold', 'case_size' => '31mm',
                'dial_color' => 'Black Roman', 'strap_material' => 'Jubilee Bracelet', 'bezel_type' => 'Fluted',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 215000000, 'currency' => 'IDR',
                'image_url' => 'https://worldtechno.net/web/uploads/item/9874_0_1779074148_web.png',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Datejust II 41mm', 'reference_number' => '126300-0002',
                'description' => 'Datejust II 41mm, Steel, Blue Tab dial, Domed bezel, Oyster Bracelet',
                'year' => 2025, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '41mm',
                'dial_color' => 'Blue Tab', 'strap_material' => 'Oyster Bracelet', 'bezel_type' => 'Domed',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 175000000, 'currency' => 'IDR',
                'image_url' => 'https://worldtechno.net/web/uploads/item/9870_0_1779133052_web.png',
            ],
            [
                'brand' => 'PATEK PHILIPPE', 'model' => 'Aquanaut Travel Time', 'reference_number' => '5164R-001',
                'description' => 'Aquanaut Travel Time, RG, Brown dial, Brown rubber',
                'year' => 2019, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Rose Gold', 'case_size' => '40.8mm',
                'dial_color' => 'Brown', 'strap_material' => 'Rubber', 'bezel_type' => 'Smooth',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 2185000000, 'currency' => 'IDR',
                'image_url' => 'https://worldtechno.net/web/uploads/item/9906_0_1779334365_web.png',
            ],
            [
                'brand' => 'AUDEMARS PIGUET', 'model' => 'Royal Oak Offshore Lady Chrono 37mm', 'reference_number' => '26048SK.ZZ.D010CA.01',
                'description' => 'Royal Oak Offshore Lady Chrono 37mm, Steel, White dial, Diamond bezel, White rubber',
                'year' => null, 'condition' => 'pre_owned', 'category' => 'ladies',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '37mm',
                'dial_color' => 'White', 'strap_material' => 'Rubber', 'bezel_type' => 'Diamond',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 330000000, 'currency' => 'IDR',
                'image_url' => 'https://worldtechno.net/web/uploads/item/9919_0_1779422183_web.png',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Submariner Date', 'reference_number' => '126610LN-0001',
                'description' => 'Submariner Date 41mm, Steel, Black dial, Black Cerachrom bezel',
                'year' => 2024, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '41mm',
                'dial_color' => 'Black', 'strap_material' => 'Oyster Bracelet', 'bezel_type' => 'Cerachrom',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 245000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Daytona', 'reference_number' => '116500LN-0001',
                'description' => 'Cosmograph Daytona 40mm, Steel, White dial, Black Cerachrom bezel',
                'year' => 2023, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '40mm',
                'dial_color' => 'White Panda', 'strap_material' => 'Oyster Bracelet', 'bezel_type' => 'Cerachrom',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 450000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'PATEK PHILIPPE', 'model' => 'Nautilus', 'reference_number' => '5711/1A-010',
                'description' => 'Nautilus 40mm, Steel, Blue dial, Steel bracelet',
                'year' => 2021, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '40mm',
                'dial_color' => 'Blue', 'strap_material' => 'Steel Bracelet', 'bezel_type' => 'Smooth',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 2800000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'AUDEMARS PIGUET', 'model' => 'Royal Oak', 'reference_number' => '15500ST.OO.1220ST.01',
                'description' => 'Royal Oak 41mm, Steel, Blue dial, Steel bracelet',
                'year' => 2022, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '41mm',
                'dial_color' => 'Blue', 'strap_material' => 'Steel Bracelet', 'bezel_type' => 'Octagonal',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 850000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'RICHARD MILLE', 'model' => 'RM 011', 'reference_number' => 'RM011-03',
                'description' => 'RM 011 Automatic Flyback Chronograph, Titanium, Skeleton dial',
                'year' => 2020, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Titanium', 'case_size' => '50mm x 40mm',
                'dial_color' => 'Skeleton', 'strap_material' => 'Rubber', 'bezel_type' => 'Tonneau',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 3500000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'HUBLOT', 'model' => 'Big Bang', 'reference_number' => '301.SB.131.RX',
                'description' => 'Big Bang 44mm, Steel/Ceramic, Black dial, Rubber strap',
                'year' => 2023, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel / Ceramic', 'case_size' => '44mm',
                'dial_color' => 'Black', 'strap_material' => 'Rubber', 'bezel_type' => 'Ceramic',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 265000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'VACHERON CONSTANTIN', 'model' => 'Overseas', 'reference_number' => '4500V/110A-B483',
                'description' => 'Overseas 41mm, Steel, Blue dial, Steel bracelet',
                'year' => 2022, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '41mm',
                'dial_color' => 'Blue', 'strap_material' => 'Steel Bracelet', 'bezel_type' => 'Smooth',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 680000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'PANERAI', 'model' => 'Luminor Marina', 'reference_number' => 'PAM01312',
                'description' => 'Luminor Marina 44mm, Steel, Blue dial, Leather strap',
                'year' => 2024, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '44mm',
                'dial_color' => 'Blue', 'strap_material' => 'Leather', 'bezel_type' => 'Smooth',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 165000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'GMT-Master II', 'reference_number' => '126710BLNR-0003',
                'description' => 'GMT-Master II 40mm, Steel, Black dial, Batman bezel, Jubilee',
                'year' => 2024, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '40mm',
                'dial_color' => 'Black', 'strap_material' => 'Jubilee Bracelet', 'bezel_type' => 'Cerachrom Batman',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 295000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Day-Date 36mm', 'reference_number' => '128238-0069',
                'description' => 'Day-Date 36mm, Yellow Gold, Champagne dial, President bracelet',
                'year' => 2025, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Yellow Gold', 'case_size' => '36mm',
                'dial_color' => 'Champagne', 'strap_material' => 'President Bracelet', 'bezel_type' => 'Fluted',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 750000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'F.P.JOURNE', 'model' => 'Chronometre Bleu', 'reference_number' => 'CB-TN-BL',
                'description' => 'Chronometre Bleu 39mm, Tantalum, Blue dial, Leather strap',
                'year' => 2021, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Manual', 'case_material' => 'Tantalum', 'case_size' => '39mm',
                'dial_color' => 'Blue', 'strap_material' => 'Leather', 'bezel_type' => 'Smooth',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 1250000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'JACOB & CO', 'model' => 'Astronomia Tourbillon', 'reference_number' => 'AT100.40.AA.AA.A',
                'description' => 'Astronomia Tourbillon 47mm, Rose Gold, Skeleton dial',
                'year' => 2020, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Manual', 'case_material' => 'Rose Gold', 'case_size' => '47mm',
                'dial_color' => 'Skeleton', 'strap_material' => 'Leather', 'bezel_type' => 'Smooth',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 5800000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Sky-Dweller', 'reference_number' => '326934-0006',
                'description' => 'Sky-Dweller 42mm, st/wg, Blue dial, Jubilee Bracelet',
                'year' => 2024, 'condition' => 'pre_owned', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel / White Gold', 'case_size' => '42mm',
                'dial_color' => 'Blue', 'strap_material' => 'Jubilee Bracelet', 'bezel_type' => 'Fluted Command',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 425000000, 'currency' => 'IDR',
            ],
            [
                'brand' => 'ROLEX', 'model' => 'Explorer II', 'reference_number' => '226570-0002',
                'description' => 'Explorer II 42mm, Steel, White dial, Oyster Bracelet',
                'year' => 2025, 'condition' => 'unworn', 'category' => 'man',
                'movement_type' => 'Automatic', 'case_material' => 'Steel', 'case_size' => '42mm',
                'dial_color' => 'White Polar', 'strap_material' => 'Oyster Bracelet', 'bezel_type' => 'Fixed 24h',
                'documentation' => 'Full Set', 'availability' => 'ready_stock',
                'price' => 195000000, 'currency' => 'IDR',
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['reference_number' => $product['reference_number']],
                array_merge($product, ['source_type' => 'manual'])
            );
        }
    }
}
