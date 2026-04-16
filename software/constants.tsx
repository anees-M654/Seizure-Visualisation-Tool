
import React from 'react';

// Approximate coordinates for Y&H Postcode areas
export const YORKSHIRE_GEO_MAP: Record<string, { lat: number, lng: number }> = {
  'LS': { lat: 53.8008, lng: -1.5491 }, // Leeds
  'BD': { lat: 53.7941, lng: -1.7519 }, // Bradford
  'HG': { lat: 53.9921, lng: -1.5398 }, // Harrogate
  'WF': { lat: 53.6828, lng: -1.4975 }, // Wakefield
  'HX': { lat: 53.7268, lng: -1.8631 }, // Halifax
  'HD': { lat: 53.6450, lng: -1.7850 }, // Huddersfield
  'YO': { lat: 53.9591, lng: -1.0812 }, // York
  'HU': { lat: 53.7443, lng: -0.3325 }, // Hull
  'DN': { lat: 53.5228, lng: -1.1311 }, // Doncaster
  'S':  { lat: 53.3811, lng: -1.4701 }, // Sheffield
};

export const CATEGORIES = [
  'All',
  'Class A Drugs',
  'Class B Drugs',
  'Firearms',
  'Bladed Weapons',
  'Cash',
  'Tobacco/Alcohol',
  'Other'
];

export const CITIES = [
  'All',
  'Leeds',
  'Sheffield',
  'Bradford',
  'Hull',
  'York',
  'Wakefield',
  'Doncaster',
  'Rotherham',
  'Huddersfield',
  'Halifax',
  'Harrogate',
  'Grimsby',
  'Scunthorpe'
];
