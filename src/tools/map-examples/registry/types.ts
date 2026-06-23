/**
 * Map example category types
 * Categorizes examples by primary functionality
 */
export type MapExampleCategory = 'dynamic-maps' | 'marker' | 'infowindow' | 'shapes';

/**
 * Lightweight summary metadata for discovery (Tier 1)
 * Used by list_map_examples to minimize token usage while preserving discoverability
 *
 * Compromise: Full description + 2 useCases
 * Target: ~71 tokens per example, 7,100 tokens for 100 examples (62% reduction)
 */
export interface MapExampleSummary {
  /** Unique identifier for the example (kebab-case) */
  id: string;

  /** Category this example belongs to */
  category: MapExampleCategory;

  /** Concise title without provider suffix */
  title: string;

  /** Full description of what the example demonstrates (no splitting) */
  description: string;

  /** Primary use cases (top 2 for context) */
  useCases: string[];
}

/**
 * Complete metadata with all details (Tier 2)
 * Used by get_map_example when user selects a specific example
 *
 * Includes full description, use cases, features, and keywords
 */
export interface MapExampleFullMetadata {
  /** Unique identifier for the example (kebab-case) */
  id: string;

  /** Category this example belongs to */
  category: MapExampleCategory;

  /** Full title with provider information */
  title: string;

  /** Detailed description of what the example demonstrates */
  description: string;

  /** Complete list of search keywords for comprehensive discoverability */
  keywords: string[];

  /** Common use cases for this example */
  useCases: string[];

  /** Features demonstrated in this example */
  features: string[];
}

/**
 * Map example metadata (registry storage format)
 * This is the canonical storage format in registry files
 *
 * Tools transform this into MapExampleSummary or MapExampleFullMetadata as needed
 */
export interface MapExampleMetadata {
  /** Unique identifier for the example (kebab-case) */
  id: string;

  /** Category this example belongs to */
  category: MapExampleCategory;

  /** Human-readable title */
  title: string;

  /** Detailed description of what the example demonstrates */
  description: string;

  /** HTML filename in public/ directory */
  filename: string;

  /** Search keywords for better discoverability */
  keywords: string[];

  /** Common use cases for this example */
  useCases: string[];

  /** Features demonstrated in this example */
  features: string[];
}

/**
 * Registry type with readonly array
 * Ensures immutability and compile-time type checking
 */
export type MapExamplesRegistry = readonly MapExampleMetadata[];
