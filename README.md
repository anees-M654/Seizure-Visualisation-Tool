## Project Overview
An intelligence dashboard developed for the **Yorkshire and Humber Regional Organised Crime Unit**. This tool transforms raw seizure spreadsheets into interactive geospatial heatmaps and statistical summaries.

## Core Features
- **Heatmap Visualisation:** Interactive mapping using Leaflet.js.
- **Dynamic Filters:** Temporal, categorical, and spatial filtering.
- **Global Search:** Keyword scanning across all fields (including redacted data).
- **Data Quality Scan:** Automated detection of malformed postcodes/dates.

## Technology Stack
- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **Mapping:** Leaflet.js
- **Data Processing:** SheetJS (XLSX parsing)

- 
 ## Further Explanation  
The Yorkshire and Humber Regional Organised Crime Unit has large amounts of information regarding illegal items ( drugs, weapons etc) seized from operations. This data is stored in spreadsheets in CSV and XLS format, making it difficult for analyst to see a bigger picture or identify trends and patterns. 

The main aim of this project is to build a web based system that acts as a lens, so instead off scrolling through thousands of rows an analyst can upload the file to this system and see a heatmap that indicates any common areas where seizures occurred and a chart of the top 10, showing what city seized the most in terms of illegal items. This will allow them to filter data based on date or location to identify emerging threats and allocate resources.

# Requirements

-	Geographic Visualisation: The system must automatically produce a ‘heat map’ based on location data, specifically using postcodes.

-	Dynamic Filtering: Users must be able to filter visualisations by Date (Monthly, Quarterly, Yearly, and manual ranges), Seizure Category/Sub-category, and Location (Postcode or City).

-	The tool should be able to generate a Top 10 summary of data, such as the most cities frequently seized items

-	Global search a key word function must be available to scan and filter across all data and fields.

-	System must be able to export the visualisation as PDF 

-	The application could be  be run locally, if so no admin rights 

Optional requirements  :
-	(Data quality)-  System should scan for and identify gaps, missing fields or malformed data during import process.
-	
-	(Trend analysis) – Tool should include a time-based scrollbar to animate changes in seizure points on map over a specific period
  
-	Tool should dynamically accept data with additional column and structure from datasets without changing code.




