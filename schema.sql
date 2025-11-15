CREATE TABLE poi_types (
    -- Primary key for the type.
    type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- The type name itself (e.g., 'museum', 'hospital').
    type_name TEXT UNIQUE NOT NULL
);

CREATE TABLE pois (
    -- The original unique identifier from the JSON.
    id TEXT PRIMARY KEY,
    -- The name of the Point of Interest.
    name TEXT NOT NULL,
    -- Foreign key linking to the poi_types table.
    type_id INTEGER NOT NULL,
    -- The full street address.
    address TEXT NOT NULL,
    -- Latitude of the location.
    latitude REAL NOT NULL,
    -- Longitude of the location.
    longitude REAL NOT NULL,
    
    -- Constraint to enforce the foreign key relationship.
    FOREIGN KEY (type_id) REFERENCES poi_types(type_id)
);

CREATE TABLE attributes (
    -- Auto-incrementing primary key for the attribute.
    attribute_id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- The attribute text itself (e.g., 'southern', 'italian').
    attribute_name TEXT UNIQUE NOT NULL
);

CREATE TABLE poi_attributes (
    -- Foreign key linking to the POI (restaurant).
    poi_id TEXT NOT NULL,
    -- Foreign key linking to the attribute.
    attribute_id INTEGER NOT NULL,
    -- Composite primary key to ensure unique pairs.
    PRIMARY KEY (poi_id, attribute_id),
    
    -- Constraints to enforce foreign key relationships.
    FOREIGN KEY (poi_id) REFERENCES pois(id),
    FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id)
);
