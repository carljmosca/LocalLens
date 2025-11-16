# NL2SQL Pipeline (Mermaid Diagram)

```mermaid
flowchart TD
    A[User Input: Natural Language Query] --> B[NLP Analysis: lmService, FLAN-T5-small, extract types/intent]
    B --> C[Template Selection: lmService, choose SQL template]
    C --> D[SQL Generation: lmService, fill template]
    D --> E[SQL Validation: queryService, check for DML/DDL, injection, read-only]
    E -->|Valid| F[SQL Execution: sqliteService, run on in-memory SQLite]
    F --> G[Result Transformation: queryService, group/format SQL rows]
    G --> H[UI Rendering: ResultsDisplay, show results, distances, map links]
    E -- Invalid --> I[Error Handling: show user-friendly error]
```

---

## Step Details

- **NLP Analysis**: Uses FLAN-T5-small to extract types and intent from the user's query.
- **Template Selection**: Picks the correct SQL template (proximity, type, fallback) based on intent.
- **SQL Generation**: Fills in the template with extracted types and parameters.
- **SQL Validation**: Ensures only safe, read-only SELECT statements are executed.
- **SQL Execution**: Runs the validated SQL against the in-memory SQLite database.
- **Result Transformation**: Converts SQL rows into grouped POI objects for display.
- **UI Rendering**: Displays results, distances, and map links to the user.
- **Error Handling**: Catches and displays errors if validation fails.
