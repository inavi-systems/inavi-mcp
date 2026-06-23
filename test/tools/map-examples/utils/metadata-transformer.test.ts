import { describe, it, expect } from 'vitest';
import { toSummary, toFullMetadata } from '@/tools/map-examples/utils/metadata-transformer';
import type { MapExampleMetadata } from '@/tools/map-examples/registry/types';

describe('metadata-transformer', () => {
  const mockMetadata: MapExampleMetadata = {
    id: 'test-example',
    category: 'marker',
    title: 'Test Example (iNavi Maps)',
    description: 'This is a test example. It demonstrates transformation functionality.',
    filename: 'test/example.html',
    keywords: ['test', 'example', 'marker', 'demo', 'showcase', 'map', 'display'],
    useCases: ['Test use case', 'Example usage', 'Demo scenario', 'Showcase feature'],
    features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
  };

  describe('toSummary', () => {
    it('should remove provider suffix from title', () => {
      const result = toSummary(mockMetadata);
      expect(result.title).toBe('Test Example');
      expect(result.title).not.toContain('iNavi Maps');
    });

    it('should use full description without splitting', () => {
      const result = toSummary(mockMetadata);
      expect(result.description).toBe(mockMetadata.description);
      expect(result.description).toContain('This is a test example');
      expect(result.description).toContain('It demonstrates transformation functionality');
    });

    it('should include first 2 use cases', () => {
      const result = toSummary(mockMetadata);
      expect(result.useCases).toHaveLength(2);
      expect(result.useCases[0]).toBe('Test use case');
      expect(result.useCases[1]).toBe('Example usage');
    });

    it('should preserve id and category', () => {
      const result = toSummary(mockMetadata);
      expect(result.id).toBe(mockMetadata.id);
      expect(result.category).toBe(mockMetadata.category);
    });

    it('should not include tags field', () => {
      const result = toSummary(mockMetadata);
      expect(result).not.toHaveProperty('tags');
    });

    it('should meet revised token efficiency target (~71 tokens per example)', () => {
      const result = toSummary(mockMetadata);
      const json = JSON.stringify(result, null, 2);
      const chars = json.length;
      const estimatedTokens = Math.ceil(chars / 4);
      expect(estimatedTokens).toBeLessThan(100); // Revised target with some buffer
    });

    it('should still achieve significant reduction from original', () => {
      const original = {
        id: mockMetadata.id,
        category: mockMetadata.category,
        title: mockMetadata.title,
        description: mockMetadata.description,
        keywords: mockMetadata.keywords,
        useCases: mockMetadata.useCases,
        features: mockMetadata.features,
      };
      const summary = toSummary(mockMetadata);

      const originalSize = JSON.stringify(original, null, 2).length;
      const summarySize = JSON.stringify(summary, null, 2).length;
      const reductionPercentage = ((originalSize - summarySize) / originalSize) * 100;

      expect(reductionPercentage).toBeGreaterThan(50); // At least 50% reduction
    });
  });

  describe('toFullMetadata', () => {
    it('should preserve all fields except filename', () => {
      const result = toFullMetadata(mockMetadata);
      expect(result).toMatchObject({
        id: mockMetadata.id,
        category: mockMetadata.category,
        title: mockMetadata.title,
        description: mockMetadata.description,
        keywords: mockMetadata.keywords,
        useCases: mockMetadata.useCases,
        features: mockMetadata.features,
      });
    });

    it('should not include filename field', () => {
      const result = toFullMetadata(mockMetadata);
      expect(result).not.toHaveProperty('filename');
    });

    it('should return all keywords unchanged', () => {
      const result = toFullMetadata(mockMetadata);
      expect(result.keywords).toEqual(mockMetadata.keywords);
      expect(result.keywords).toHaveLength(mockMetadata.keywords.length);
    });

    it('should return all useCases unchanged', () => {
      const result = toFullMetadata(mockMetadata);
      expect(result.useCases).toEqual(mockMetadata.useCases);
      expect(result.useCases).toHaveLength(mockMetadata.useCases.length);
    });

    it('should return all features unchanged', () => {
      const result = toFullMetadata(mockMetadata);
      expect(result.features).toEqual(mockMetadata.features);
      expect(result.features).toHaveLength(mockMetadata.features.length);
    });
  });

  describe('integration - real-world example', () => {
    const realExample: MapExampleMetadata = {
      id: 'marker-basic',
      category: 'marker',
      title: 'Display Markers on Map (iNavi Maps)',
      description:
        'Display markers on a map at specific positions. ' +
        'Ideal for showing geocoding results, POI locations, or user-specified coordinates.',
      filename: 'marker/marker-basic.html',
      keywords: [
        'marker',
        'pin',
        'location',
        'geocoding',
        'poi',
        'position',
        'show marker',
        'display location',
        'mark position',
        'pin on map',
      ],
      useCases: [
        'Display geocoding results',
        'Show POI search results',
        'Mark user-specified coordinates',
        'Display single location',
      ],
      features: [
        'Map initialization',
        'Marker creation with position settings',
        'Custom marker icon configuration',
        'Info window support',
      ],
    };

    it('should transform real example to efficient summary', () => {
      const summary = toSummary(realExample);

      expect(summary.id).toBe('marker-basic');
      expect(summary.category).toBe('marker');
      expect(summary.title).toBe('Display Markers on Map');
      expect(summary.description).toBe(realExample.description);
      expect(summary.useCases).toHaveLength(2);
      expect(summary.useCases[0]).toBe('Display geocoding results');
      expect(summary.useCases[1]).toBe('Show POI search results');

      // Verify token efficiency (revised target)
      const json = JSON.stringify(summary, null, 2);
      const estimatedTokens = Math.ceil(json.length / 4);
      expect(estimatedTokens).toBeLessThan(100); // Revised target
    });

    it('should transform real example to complete metadata', () => {
      const fullMetadata = toFullMetadata(realExample);

      expect(fullMetadata.title).toBe('Display Markers on Map (iNavi Maps)');
      expect(fullMetadata.description).toContain('Display markers on a map');
      expect(fullMetadata.keywords).toHaveLength(10);
      expect(fullMetadata.useCases).toHaveLength(4);
      expect(fullMetadata.features).toHaveLength(4);
      expect(fullMetadata).not.toHaveProperty('filename');
    });
  });
});
