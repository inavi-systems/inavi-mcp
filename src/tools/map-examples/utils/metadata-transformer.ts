import type {
  MapExampleMetadata,
  MapExampleSummary,
  MapExampleFullMetadata,
} from '../registry/types';

/**
 * Transforms full metadata into lightweight summary for listing
 *
 * Transformation rules (Revised - Compromise):
 * 1. Title: Remove provider suffix "(iNavi Maps)" to save tokens
 * 2. Description: Use full description (no splitting)
 * 3. UseCases: Take first 2 use cases for context
 *
 * Target: ~71 tokens per example (285 chars)
 * Trade-off: Slightly over 5,000 token target but better AI discoverability
 *
 * @param metadata - Full metadata from registry
 * @returns Summary with full description and partial useCases
 */
export function toSummary(metadata: MapExampleMetadata): MapExampleSummary {
  const title = metadata.title.replace(/\s*\(iNavi Maps\)\s*$/, '');
  const description = metadata.description;
  const useCases = metadata.useCases.slice(0, 2);

  return {
    id: metadata.id,
    category: metadata.category,
    title,
    description,
    useCases,
  };
}

/**
 * Transforms metadata into full format for detailed view
 *
 * Returns all fields except filename (not needed by AI for template usage)
 *
 * @param metadata - Full metadata from registry
 * @returns Complete metadata for selected example
 */
export function toFullMetadata(metadata: MapExampleMetadata): MapExampleFullMetadata {
  return {
    id: metadata.id,
    category: metadata.category,
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    useCases: metadata.useCases,
    features: metadata.features,
  };
}
