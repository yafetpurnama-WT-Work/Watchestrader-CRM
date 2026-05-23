<?php

$models = [
    'Contact',
    'Customer',
    'Lead',
    'Product',
    'Deal',
    'Company',
    'Outlet',
    'Tag',
    'Pipeline',
    'CustomerStatus',
    'LeadSource',
    'Automation',
    'MessageTemplate',
    'Broadcast',
    'CustomField'
];

foreach ($models as $model) {
    $path = __DIR__ . '/api/app/Models/' . $model . '.php';
    if (!file_exists($path)) {
        echo "Not found: $model\n";
        continue;
    }
    
    $content = file_get_contents($path);
    
    if (strpos($content, 'use App\Models\Traits\Auditable;') !== false) {
        echo "Already has trait: $model\n";
        continue;
    }
    
    // Add import statement
    $content = preg_replace(
        '/(use Illuminate\\\\Database\\\\Eloquent\\\\Model;)/',
        "$1\nuse App\\Models\\Traits\\Auditable;",
        $content
    );
    
    // Add use trait inside class
    if (preg_match('/use HasFactory, HasUuids;/', $content)) {
        $content = preg_replace('/use HasFactory, HasUuids;/', 'use HasFactory, HasUuids, Auditable;', $content);
    } else if (preg_match('/use HasFactory;/', $content)) {
        $content = preg_replace('/use HasFactory;/', 'use HasFactory, Auditable;', $content);
    } else if (preg_match('/use HasUuids;/', $content)) {
        $content = preg_replace('/use HasUuids;/', 'use HasUuids, Auditable;', $content);
    } else {
        // Just inject it after the class opening brace
        $content = preg_replace('/(class '.$model.' extends Model\s*\{)/', "$1\n    use Auditable;\n", $content);
    }
    
    // Add fillable if not exists, but models already have them. We don't strictly need fillable for boot events if we modify directly, but it's safe. Actually let's not touch fillable to avoid issues.
    
    file_put_contents($path, $content);
    echo "Patched: $model\n";
}
