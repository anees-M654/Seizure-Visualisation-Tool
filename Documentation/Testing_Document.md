# Testing Document - Coursework 2

## Cover Page
**Team ID:** [Insert Team Name, Number, and Flag]
**Members List:** 
- [Full Name], [UoB#], [UoB email address]
- [Full Name], [UoB#], [UoB email address]
- [Full Name], [UoB#], [UoB email address]
**Project Choice:** Yorkshire & Humber ROCU Seizure Lens Dashboard

---

## 1. Acceptance Testing (A.1)

Based on the functional specifications and testing criteria formulated in CW1, the following acceptance tests were conducted to ensure the final product meets the client's expectations under real-world usage scenarios.

| Test ID | Requirement Mapped | Test Scenario | Expected Outcome / Acceptance Criteria | Actual Outcome | Result | Justification / Explanation |
|---|---|---|---|---|---|---|
| **AT-01** | Performance (1) | Upload a standard CSV file and select a city filter. | Visuals must refresh in < 3 seconds. | Visuals refresh instantly (< 1s) upon filter application. | **Pass** | The system utilises efficient React state management. Data filtering is processed directly in memory on the client-side, meeting the System Responsiveness requirements. |
| **AT-02** | Usability (2) | Navigate from the default landing page to the Map/Heatmap view. | Must be achieved in 3 clicks or less. | Achieved in exactly 1 click. | **Pass** | Navigation is streamlined directly from the primary UI dashboard layout, ensuring rapid access to critical visualisations per the usability criteria. |
| **AT-03** | Security (3) | Monitor the network tab (DevTools) during a data upload of a CSV file. | Zero data packets must be sent to external servers. | Local processing confirmed via browser DevTools; no external payload sent. | **Pass** | Built to run strictly locally via a React Single Page Application (SPA); guarantees data confidentiality without requiring administrative rights. |
| **AT-04** | Accessibility (4) | View the heatmap component. | Intensity must be distinguishable via opacity/shading, not just hue. | Heatmap gradient employs diverse luminance steps and opacity layers. | **Pass** | Adheres to accessibility requirements, ensuring analysts with colour vision deficiencies can still interpret threat density maps. |
| **AT-05** | Robustness (5) | Upload a file containing 10% malformed postcodes or missing data fields. | System must notify the user of the error but still render the valid points. | Data Quality alert panel updates with missing field counts, but valid items continue to map successfully. | **Pass** | Fulfills robustness criteria under malformed or redacted intelligence data inputs without crashing the application. |
| **AT-06** | Export (6) | Apply temporal and spatial filters, then click "Export PDF". | The generated PDF must contain only the filtered data, and a success alert must appear. | PDF downloads correctly containing exclusively the current filtered state. | **Pass** | The export mechanism explicitly pulls from the `filteredData` state variable, guaranteeing the exported report matches what the analyst sees on screen. |

---

## 2. Unit Testing & Code Inspection (A.2)

Since our software is built using a modern frontend stack (React, TypeScript, Vite) instead of a traditional Object-Oriented backend (like Java), our "units" refer to utility functions and isolated React components. We utilized **Vitest** (the native Vite testing framework) alongside **jsdom**.

### Target Tested: `dataProcessor.ts`
The data processor handles the core business logic of interpreting loosely structured CSV data, geocoding it, and formatting it into our internal `SeizureRecord` format.

#### Test Cases Covered:
1. **`generateMockData` Unit:**
   - *Test:* `should generate the correct number of records`
   - *Test:* `should include required fields in generated data`
2. **`parseRawData` Unit:**
   - *Test:* `should process empty data array` - Ensures the system does not break when an empty file is processed.
   - *Test:* `should map flat object data to SeizureRecord schema` - Tests the mapping logic to ensure column structures are successfully extracted and assigned (e.g., matching a `Postcode` string to the correct object property).

**Justification:** Assuring data integrity is the most critical function of this intelligence platform. By isolating the `dataProcessor` utility with mock data inputs, we guarantee that the complex parsing logic and batch processing algorithms are structurally sound before they interact with any UI rendering components. 

---

## 3. Code Inspection Reports (A.3)

Code inspection was conducted using a combination of static automated analysis tools and rigorous manual peer review.

### Automated Inspection Tools
- **TypeScript Compiler (`tsc`):** We execute `tsc --noEmit` as our primary static analysis step. This scans the entire codebase for type safety violations, missing variables, or incorrect parameters. This proactively eliminates runtime null reference errors. 
- **Code Enforcement Outcome:** Running the linter successfully compiled without any type errors, confirming the codebase's structural integrity.

### Manual Code Inspection
We manually reviewed key architectural files including `App.tsx` and `dataProcessor.ts` based on the principles discussed in the lecture notes:

1. **Structure:** The codebase exhibits excellent separation of concerns. The complex UI logic is extracted into distinct, focused React components (e.g., `TimeSeriesChart.tsx`, `HeatMap.tsx`) housed inside the `/components` directory.
2. **Control Flow:** `App.tsx` conditionally renders either the dashboard or a simple empty-state fallback based on data presence, actively preventing empty arrays from causing infinite rendering loops.
3. **Logic / Correctness:** The data parsing functions explicitly check for empty inputs (`if (!dateVal) trackMissing('Date')`) to gracefully handle invalid data rather than throwing uncaught exceptions.
4. **Consistency:** The standard naming conventions strictly apply camelCase for variables/functions and PascalCase for React component definitions, conforming to modern JavaScript standards.

---

## 4. Peer-Review (A.4)

*Use the table below to score the contribution of each team member based on tasks allocated and achievements.*

| Student Name | Student Number | Tasks Allocated | Achievements | Score (0 - 10) |
|---|---|---|---|---|
| [Name 1] | [Number] | [e.g. Lead Frontend, UI design] | [e.g. Built React architecture, integrated charts] | [Score] |
| [Name 2] | [Number] | [e.g. Testing, Documentation] | [e.g. Set up Vitest, formulated Acceptance tests] | [Score] |
| [Name 3] | [Number] | [e.g. Logic, Data pipelines] | [e.g. Built dataProcessor.ts, PDF exports] | [Score] |

*(Provide brief explanations for the scores assigned if needed)*
