import type { MapExampleMetadata } from './types';

/**
 * Registry of dynamic-maps examples
 *
 * Add new dynamic-maps examples to this array.
 * Each example MUST have a unique ID across ALL categories.
 */
export const DYNAMIC_MAPS_EXAMPLES: readonly MapExampleMetadata[] = [
  {
    id: 'dynamic-basic',
    category: 'dynamic-maps',
    title: 'Create Interactive Map (iNavi Maps)',
    description:
      'Create a basic interactive map display with center coordinates and zoom level configuration. ' +
      'Demonstrates fundamental map initialization.',
    filename: 'dynamic-maps/dynamic-basic.html',
    keywords: [
      'map',
      'basic',
      'interactive',
      'initialization',
      'center',
      'zoom',
      'show map',
      'create map',
      'display map',
      'map view',
    ],
    useCases: [
      'Display basic map view',
      'Center map at specific coordinates',
      'Configure initial zoom level',
      'Basic map container setup',
    ],
    features: [
      'Map container setup',
      'Map initialization',
      'Center coordinate configuration',
      'Zoom level setting',
    ],
  },
  {
    id: 'dynamic-map-info',
    category: 'dynamic-maps',
    title: 'Display Map Information (iNavi Maps)',
    description:
      'Display current map information including zoom level, center coordinates, and bounds. ' +
      'Click the button to retrieve and display real-time map state information.',
    filename: 'dynamic-maps/dynamic-map-info.html',
    keywords: [
      'map info',
      'zoom level',
      'center',
      'bounds',
      'getZoom',
      'getCenter',
      'getBounds',
      'map state',
      'map information',
      'retrieve info',
      'display info',
    ],
    useCases: [
      'Display current map zoom level and coordinates',
      'Show map boundary information',
      'Monitor map state changes interactively',
      'Retrieve real-time map information',
    ],
    features: [
      'Map information retrieval via button click',
      'Display zoom level, center coordinates, and bounds',
      'Real-time map state query using iNavi Maps API methods',
      'Interactive information display',
    ],
  },
  {
    id: 'dynamic-distance-calculation',
    category: 'dynamic-maps',
    title: 'Calculate Distance Between Two Points (iNavi Maps)',
    description:
      'Select two points on the map by clicking to calculate and visualize the straight-line distance between them. ' +
      'Uses Turf.js for precise distance calculation. Click the calculate button to display a polyline and label showing the distance.',
    filename: 'dynamic-maps/dynamic-distance-calculation.html',
    keywords: [
      'distance',
      'calculation',
      'interactive',
      'click',
      'marker',
      'polyline',
      'label',
      'turf.js',
      'measurement',
      'two points',
      'calculate distance',
      'measure distance',
    ],
    useCases: [
      'Calculate distance between two locations on map',
      'Measure straight-line distance interactively',
      'Visualize distance with polyline and label',
      'Compare distances between different point pairs',
    ],
    features: [
      'Interactive point selection by clicking map',
      'Distance calculation using Turf.js library',
      'Visual polyline connecting two points',
      'Label displaying calculated distance',
      'Reset functionality for recalculation',
    ],
  },
  {
    id: 'dynamic-map-type',
    category: 'dynamic-maps',
    title: 'Switch Map Style Dynamically (iNavi Maps)',
    description:
      'Dynamically switch between different map styles using interactive buttons. ' +
      'Supports five map types: Normal, Satellite, Hybrid, DEM Normal, and DEM Hybrid. ' +
      'Each button dynamically changes the map style by loading external style URLs.',
    filename: 'dynamic-maps/dynamic-map-type.html',
    keywords: [
      'map style',
      'map type',
      'switch style',
      'change type',
      'normal',
      'satellite',
      'hybrid',
      'dem',
      'terrain',
      'setStyle',
      'style change',
      'map view',
      'style selection',
    ],
    useCases: [
      'Switch between different map styles',
      'Provide users with multiple map view options',
      'Toggle between terrain and standard views',
      'Allow satellite imagery view',
      'Enable hybrid map visualization',
    ],
    features: [
      'Dynamic button generation for style switching',
      'Five map style options (Normal, Satellite, Hybrid, DEM Normal, DEM Hybrid)',
      'External style URL loading',
      'Interactive style change via button clicks',
      'Real-time map style transformation',
    ],
  },
  {
    id: 'dynamic-flyto',
    category: 'dynamic-maps',
    title: 'Map FlyTo Animation',
    description:
      'Cycles through multiple coordinates with smooth animations using the flyTo method. ' +
      'Each location transitions naturally with adjustable zoom levels. ' +
      'Click the button to smoothly fly to different locations on the map.',
    filename: 'dynamic-maps/dynamic-flyto.html',
    keywords: [
      'flyTo',
      'animation',
      'smooth transition',
      'coordinate',
      'zoom',
      'cycle',
      'location',
      'navigate',
      'move map',
      'fly animation',
      'animated transition',
      'camera movement',
      'pan zoom',
    ],
    useCases: [
      'Smoothly navigate between multiple locations',
      'Create animated map tours',
      'Transition between different zoom levels',
      'Cycle through predefined coordinates',
      'Build interactive location showcases',
    ],
    features: [
      'FlyTo method for smooth animated transitions',
      'Multiple coordinate cycling with array',
      'Button-triggered location transitions',
      'Individual zoom level per location',
      'Automatic coordinate cycling with modulo index',
    ],
  },
] as const;
