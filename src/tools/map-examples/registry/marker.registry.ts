import type { MapExampleMetadata } from './types';

/**
 * Registry of marker map examples
 *
 * Add new marker examples to this array.
 * Each example MUST have a unique ID across ALL categories.
 */
export const MARKER_EXAMPLES: readonly MapExampleMetadata[] = [
  {
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
    ],
  },
  {
    id: 'marker-movable',
    category: 'marker',
    title: 'Movable Marker (iNavi Maps)',
    description:
      'Create an interactive marker that can be moved using click or drag. ' +
      'Toggle between click mode (click anywhere on map to reposition) and drag mode (drag the marker directly). ' +
      'Both modes can be active simultaneously for maximum flexibility.',
    filename: 'marker/marker-movable.html',
    keywords: [
      'marker',
      'movable',
      'interactive',
      'click',
      'drag',
      'reposition',
      'location picker',
      'click to move',
      'drag to move',
      'draggable',
    ],
    useCases: [
      'Flexible location selection with multiple input methods',
      'Interactive marker positioning for address forms',
      'User-friendly location picker',
      'Mark delivery or meeting points interactively',
    ],
    features: [
      'Click mode: Click anywhere on map to move marker',
      'Drag mode: Drag marker directly to new position',
      'Toggle buttons for mode activation',
      'Simultaneous mode activation support',
    ],
  },
  {
    id: 'marker-cluster',
    category: 'marker',
    title: 'Display Multiple Markers with Clustering (iNavi Maps)',
    description:
      'Efficiently display many markers using automatic marker clustering. ' +
      'Markers group together at low zoom levels and separate when zooming in. ' +
      'Ideal for large numbers of markers. ' +
      'If InfoWindow popups are also needed on individual markers, use the infowindow-clustered-markers example instead.',
    filename: 'marker/marker-cluster.html',
    keywords: [
      'cluster',
      'markers',
      'multiple',
      'poi',
      'many',
      'group',
      'aggregate',
      'show multiple markers',
      'display many locations',
      'cluster markers',
    ],
    useCases: [
      'Display multiple POI search results',
      'Show store locations',
      'Visualize sensor data points',
      'Display large datasets efficiently',
    ],
    features: [
      'MarkerClusterer integration',
      'Automatic clustering/declustering',
      'Zoom-based marker grouping',
      'Performance optimization for many markers',
    ],
  },
  {
    id: 'marker-cluster-grid-size',
    category: 'marker',
    title: 'Set Marker Cluster Grid Size (iNavi Maps)',
    description:
      'Configure the clustering distance for MarkerClusterer. ' +
      'Dynamically adjust the grid size parameter to control when markers are grouped into clusters. ' +
      'Includes an input control to test different grid size values in real-time.',
    filename: 'marker/marker-cluster-grid-size.html',
    keywords: [
      'marker',
      'cluster',
      'grid-size',
      'clustering',
      'distance',
      'dynamic',
      'configuration',
      'setGridSize',
      'MarkerClusterer',
    ],
    useCases: [
      'Adjust clustering sensitivity for better visualization',
      'Test optimal cluster distance for different zoom levels',
      'Create user-configurable cluster settings',
    ],
    features: [
      'MarkerClusterer with configurable grid size',
      'Real-time grid size adjustment via input control',
      'Dynamic marker addition on map click',
      '38 sample markers for testing',
    ],
  },
  {
    id: 'marker-numbering',
    category: 'marker',
    title: 'Display Numbered Markers on Map (iNavi Maps)',
    description:
      'Display multiple markers with sequential numbers on a map. ' +
      'Each marker shows its order number, making it ideal for visualizing routes, delivery sequences, or ordered locations.',
    filename: 'marker/marker-numbering.html',
    keywords: [
      'marker',
      'number',
      'numbered',
      'sequence',
      'order',
      'sequential',
      'route',
      'delivery',
      'numbering',
      'custom marker',
      'label',
    ],
    useCases: [
      'Display delivery route with stop numbers',
      'Show ordered waypoints or itinerary',
      'Visualize sequential locations',
      'Mark numbered checkpoints',
    ],
    features: [
      'Custom numbered marker creation',
      'Sequential numbering (1, 2, 3...)',
      'Automatic font size adjustment for large numbers',
      'Customizable marker styling',
    ],
  },
  {
    id: 'marker-colored',
    category: 'marker',
    title: 'Display Colored Markers on Map (iNavi Maps)',
    description:
      'Display markers with custom colors on a map. ' +
      'Each marker can have a different color using dynamic SVG generation, ideal for categorizing locations or distinguishing between different data types.',
    filename: 'marker/marker-colored.html',
    keywords: [
      'marker',
      'color',
      'colored',
      'custom color',
      'marker style',
      'svg',
      'dynamic',
      'category',
      'distinguish',
      'custom marker',
    ],
    useCases: [
      'Categorize locations by type with different colors',
      'Distinguish vehicle routes with unique colors',
      'Color-code POI results by category',
      'Highlight specific locations with custom colors',
    ],
    features: [
      'Dynamic SVG marker generation',
      'Custom color support via Hex codes',
      'White border preserved for visibility',
      'Lightweight marker creation',
    ],
  },
] as const;
