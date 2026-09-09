import type { MapExampleMetadata } from './types';

/**
 * Registry of InfoWindow map examples
 *
 * Add new InfoWindow examples to this array.
 * Each example MUST have a unique ID across ALL categories.
 */
export const INFOWINDOW_EXAMPLES: readonly MapExampleMetadata[] = [
  {
    id: 'infowindow-basic',
    category: 'infowindow',
    title: 'Basic InfoWindow Usage (iNavi Maps)',
    description:
      'Show and hide an InfoWindow by hovering a marker. ' +
      'A single InfoWindow instance is attached to the marker and retrieved with Marker#getInfoWindow(), ' +
      'then shown on mouseenter and hidden on mouseleave.',
    filename: 'infowindow/infowindow-basic.html',
    keywords: [
      'infowindow',
      'popup',
      'marker info',
      'tooltip',
      'info popup',
      'marker popup',
      'display info',
      'show info',
      'info window',
      'marker details',
    ],
    useCases: [
      'Display marker information in a popup',
      'Show location details while hovering a marker',
      'Show and hide an InfoWindow without a close button',
    ],
    features: [
      'InfoWindow creation with custom HTML content',
      'Attaching an InfoWindow to a marker and reading it back with Marker#getInfoWindow()',
      'Show on mouseenter, hide on mouseleave',
      'closeButton disabled (hover drives visibility)',
    ],
  },
  {
    id: 'infowindow-clustered-markers',
    category: 'infowindow',
    title: 'InfoWindow with Clustered Markers (iNavi Maps)',
    description:
      'Use this example when MarkerClusterer and InfoWindow are both required — do not split into separate marker-cluster and infowindow-basic examples. ' +
      'Renders many markers grouped into marker clusters at low zoom levels; hovering an individual declustered marker opens an InfoWindow popup with its details. ' +
      'Clicking a marker cluster zooms in to expand it.',
    filename: 'infowindow/infowindow-clustered-markers.html',
    keywords: [
      'infowindow',
      'cluster',
      'marker cluster',
      'clustered markers',
      'MarkerClusterer',
      'cluster click',
      'zoom on cluster',
      'many markers',
      'marker group',
      'cluster popup',
      'clustering with infowindow',
      'large dataset with popup',
      'multiple markers with info popup',
      'combined clustering and infowindow',
    ],
    useCases: [
      'Display a large number of markers with both automatic marker clustering and per-marker InfoWindow popups',
      'Combine MarkerClusterer and InfoWindow in one template instead of merging two separate examples',
      'Manage many markers efficiently with marker clustering',
      'Show marker details when hovering individual declustered markers',
    ],
    features: [
      'MarkerClusterer integration',
      'Marker cluster click handling (zoom in to expand)',
      'Individual marker hover handling (show InfoWindow)',
      'Shared single InfoWindow instance for performance',
      'Marker id index-based matching',
      'Automatic marker clustering and declustering',
    ],
  },
] as const;
