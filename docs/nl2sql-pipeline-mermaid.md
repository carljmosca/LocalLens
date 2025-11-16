# NL2SQL Pipeline (Mermaid Diagram)

```mermaid
flowchart TD
    A[User Input (Natural Language Query)] --> B[NLP Analysis (lmService)\nPrompt FLAN-T5-small, extract types/intent]
    B --> C[Template Selection (lmService)\nChoose SQL template based on intent]
    C --> D[SQL Generation (lmService)\nPopulate template with extracted types]
    D --> E[SQL Validation (queryService)\nCheck for DML/DDL, injection, read-only]
    E -->|Valid| F[SQL Execution (sqliteService)\nRun query on in-memory SQLite (sql.js)]
    F --> G[Result Transformation (queryService)\nGroup/format SQL rows as POI objects]
    G --> H[UI Rendering (ResultsDisplay)\nShow results, distances, map links]
    E -- Invalid --> I[Error Handling\nShow user-friendly error]
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
