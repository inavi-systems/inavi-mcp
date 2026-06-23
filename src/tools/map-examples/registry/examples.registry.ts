import type { MapExampleMetadata, MapExampleCategory } from './types';
import { DYNAMIC_MAPS_EXAMPLES } from './dynamic-maps.registry';
import { MARKER_EXAMPLES } from './marker.registry';
import { INFOWINDOW_EXAMPLES } from './infowindow.registry';
import { SHAPES_EXAMPLES } from './shapes.registry';

/**
 * Central registry merging all category-specific registries
 *
 * DO NOT add examples directly here.
 * Add examples to respective category files:
 * - dynamic-maps.registry.ts
 * - marker.registry.ts
 * - infowindow.registry.ts
 * - shapes.registry.ts
 *
 * NAMING CONVENTIONS:
 * - id: kebab-case (e.g., "marker-basic")
 * - filename: category/kebab-case-id.html (e.g., "marker/marker-basic.html")
 */
export const MAP_EXAMPLES_REGISTRY: readonly MapExampleMetadata[] = [
  ...DYNAMIC_MAPS_EXAMPLES,
  ...MARKER_EXAMPLES,
  ...INFOWINDOW_EXAMPLES,
  ...SHAPES_EXAMPLES,
] as const;

/**
 * Validates that all example IDs are unique across all categories
 * Throws error at module load time if duplicates are found
 */
function validateUniqueIds(): void {
  const ids = MAP_EXAMPLES_REGISTRY.map((example) => example.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate example IDs found: ${duplicates.join(', ')}. ` +
        'Each example must have a unique ID across all categories.',
    );
  }
}

// Run validation at module load time
validateUniqueIds();

/**
 * Helper function: Get example by ID
 * @param id - Example ID to search for
 * @returns Example metadata or undefined if not found
 */
export function getExampleById(id: string): MapExampleMetadata | undefined {
  return MAP_EXAMPLES_REGISTRY.find((example) => example.id === id);
}

/**
 * Helper function: Get examples by category
 * @param category - Category to filter by (optional)
 * @returns Filtered examples or all examples if no category specified
 */
export function getExamplesByCategory(
  category?: MapExampleCategory,
): readonly MapExampleMetadata[] {
  if (!category) {
    return MAP_EXAMPLES_REGISTRY;
  }
  return MAP_EXAMPLES_REGISTRY.filter((example) => example.category === category);
}

/**
 * Helper function: Get all categories
 * @returns Array of unique categories
 */
export function getAllCategories(): MapExampleCategory[] {
  const categories = new Set(MAP_EXAMPLES_REGISTRY.map((example) => example.category));
  return Array.from(categories).sort();
}
