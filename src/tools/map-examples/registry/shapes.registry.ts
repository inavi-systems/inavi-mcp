import type { MapExampleMetadata } from './types';

/**
 * Registry of shapes map examples
 *
 * Add new shapes examples to this array.
 * Each example MUST have a unique ID across ALL categories.
 */
export const SHAPES_EXAMPLES: readonly MapExampleMetadata[] = [
  {
    id: 'shapes-circle',
    category: 'shapes',
    title: 'Display Circle on Map (iNavi Maps)',
    description:
      'Display a circle shape on a map at a specific position with customizable radius and style. ' +
      'Ideal for showing coverage areas, proximity zones, or highlighting circular regions.',
    filename: 'shapes/shapes-circle.html',
    keywords: [
      'circle',
      'shape',
      'radius',
      'area',
      'coverage',
      'zone',
      'region',
      'proximity',
      'round',
      'fillColor',
      'fillOpacity',
      'feature',
      '피처',
    ],
    useCases: [
      'Display coverage area around a location',
      'Show proximity zone or service radius',
      'Highlight circular region on map',
      'Visualize distance-based boundaries',
    ],
    features: [
      'Circle creation with position and radius',
      'Custom fill color and opacity',
      'Outline color configuration',
    ],
  },
  {
    id: 'shapes-polygon',
    category: 'shapes',
    title: 'Display Polygon on Map (iNavi Maps)',
    description:
      'Display a polygon shape on a map defined by a series of coordinate points. ' +
      'Ideal for showing boundaries, zones, or custom-shaped areas.',
    filename: 'shapes/shapes-polygon.html',
    keywords: [
      'polygon',
      'shape',
      'area',
      'boundary',
      'zone',
      'region',
      'path',
      'vertices',
      'fillColor',
      'fillOpacity',
      'feature',
      '피처',
    ],
    useCases: [
      'Display administrative boundaries',
      'Show custom-shaped zones or regions',
      'Highlight specific areas on map',
      'Visualize property or land boundaries',
    ],
    features: [
      'Polygon creation with coordinate path',
      'Custom fill color and opacity',
      'Outline color configuration',
    ],
  },
  {
    id: 'shapes-multi-polygon',
    category: 'shapes',
    title: 'Display Multi-Polygon with Hole on Map (iNavi Maps)',
    description:
      'Display a multi-polygon shape with an inner hole (cutout) on a map. ' +
      'The outer polygon defines the boundary while the inner polygon creates a transparent hole. ' +
      'Ideal for showing areas with exclusion zones or donut-shaped regions.',
    filename: 'shapes/shapes-multi-polygon.html',
    keywords: [
      'multi-polygon',
      'multipolygon',
      'polygon',
      'hole',
      'cutout',
      'donut',
      'exclusion',
      'inner',
      'outer',
      'shape',
      'area',
      'boundary',
      'feature',
      '피처',
    ],
    useCases: [
      'Display areas with exclusion zones',
      'Show donut-shaped regions',
      'Visualize boundaries with inner cutouts',
      'Highlight areas excluding specific regions',
    ],
    features: [
      'Multi-polygon creation with outer and inner paths',
      'Inner hole (cutout) support',
      'Custom fill color and opacity',
      'Outline color configuration',
    ],
  },
  {
    id: 'shapes-style',
    category: 'shapes',
    title: 'Dynamic Shape Styling (iNavi Maps)',
    description:
      'Dynamically change shape styles using setStyle() method. ' +
      'Demonstrates how to update fill color, opacity, and outline color at runtime. ' +
      'The setStyle() method works identically for Circle, Polygon, and Multi-Polygon shapes.',
    filename: 'shapes/shapes-style.html',
    keywords: [
      'style',
      'setStyle',
      'dynamic',
      'color',
      'fillColor',
      'fillOpacity',
      'fillOutlineColor',
      'circle',
      'polygon',
      'multi-polygon',
      'change style',
      'update style',
      'runtime',
      'feature',
      '피처',
    ],
    useCases: [
      'Change shape colors dynamically based on user input',
      'Update shape styles at runtime',
      'Interactive shape styling with color picker',
      'Apply consistent styling to Circle, Polygon, and Multi-Polygon',
    ],
    features: [
      'setStyle() method for dynamic style updates',
      'Color picker integration for interactive styling',
      'Works with Circle, Polygon, and Multi-Polygon',
      'Fill color, opacity, and outline configuration',
    ],
  },
  {
    id: 'shapes-polyline',
    category: 'shapes',
    title: 'Display Polyline with Traffic Colors on Map (iNavi Maps)',
    description:
      'Display polylines on a map with traffic-colored segments. ' +
      'Uses hardcoded sample data that mirrors the iNavi Route API response structure. ' +
      'Replace sample data with actual route API data to visualize real navigation routes.',
    filename: 'shapes/shapes-polyline.html',
    keywords: [
      'polyline',
      'line',
      'path',
      'route',
      'traffic',
      'navigation',
      'directions',
      'segment',
      'lineColor',
      'lineWidth',
      'show on map',
      'display route',
      'visualize',
      'feature',
      '피처',
    ],
    useCases: [
      'Visualize route data as colored polylines on a map',
      'Display traffic conditions along a path',
      'Render polyline paths with different colored segments',
      'Show driving directions with traffic-colored segments',
    ],
    features: [
      'Polyline creation with coordinate path',
      'Traffic-colored segment rendering',
      'Outline polyline for visual emphasis',
      'Auto-fit map bounds to polyline',
    ],
  },
] as const;
