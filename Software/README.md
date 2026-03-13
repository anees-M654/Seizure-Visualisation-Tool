<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Yorkshire and Humber ROCU Seizure Tool

## Project Overview
This specialized analytical "lens" was developed for the **Yorkshire and Humber Regional Organised Crime Unit (ROCU)**. The system transforms large, fragmented datasets of illegal item seizures (drugs, weapons, cash, etc.) into actionable intelligence through interactive visualization.

Analysts can upload CSV or XLS spreadsheets to immediately identify emerging threats, geographic hotspots, and temporal patterns without requiring specialized GIS software or administrative rights.

## Core Features
- **Geographic Visualisation (Heatmap):** Automatically generates an interactive density map using postcode-to-coordinate mapping. Includes automatic focus/zoom when filtering.
- **Dynamic Filtering:** Multi-dimensional filtering by:
  - **Date:** Monthly, Quarterly, Yearly, and manual ranges.
  - **Classification:** Seizure Category and Sub-category.
  - **Location:** Specific Postcode sectors or City-wide views.
- **Temporal Trend Analysis:** A time-based playback scrollbar that allows analysts to animate the accumulation of seizures over a specific period to identify shifting patterns.
- **Top 10 Intelligence Summary:** Real-time generation of charts showing the most frequently seized items and the cities with the highest seizure volumes.
- **Global Keyword Search:** A unified search bar that scans across every field in the dataset (including dynamic columns).
- **Data Quality Assessment:** Automatic scanning during the import process to identify missing fields or malformed records.
- **Export Capabilities:** Support for exporting filtered visualizations to **PDF** (for briefings) and **CSV** (for further data processing).

## Methodology: Evolutionary Development
This project followed an **Evolutionary Development** methodology. 
1. **Initial Phase:** Focused on core geographic visualization and spreadsheet parsing.
2. **Iterative Refinement:** Implemented complex filtering and the Top 10 logic.
3. **Advanced Features:** Added the Trend Analysis scrollbar and dynamic column handling to allow the tool to accept future dataset variations without code changes.

## Technical Specifications
- **Framework:** React 19 with TypeScript (Type-safe development).
- **Styling:** Tailwind CSS (Professional "Dark Mode" Dashboard aesthetic).
- **Mapping Engine:** Leaflet.js with the Leaflet-Heat plugin.
- **Data Visualization:** Recharts for analytical bar charts.
- **Icons:** Lucide-React for clean UI affordance.
- **Security:** Built with
 a **Client-Side Architecture**. No data is ever sent to a server; all parsing and visualization happen entirely within the browser's memory, ensuring sensitive ROCU data remains localized and secure.

## Operational Security & Data Privacy
This tool is designed to be run as a standalone web application. 
- **No Database:** Data is volatile and exists only for the duration of the session.
- **Privacy by Design:** All geocoding jitter logic ensures that specific addresses are abstracted into density clusters, protecting specific operational locations while maintaining tactical awareness.

## Installation & Usage
1. **Zero-Installation:** The tool can be run by opening the `index.html` in any modern web browser.
2. **Local Execution:** Requires no administrative privileges, making it compatible with restricted-environment police workstations.
3. **Data Import:** Simply click "Choose File" and select any seizure spreadsheet containing 'Date' and 'Postcode' columns.

---
