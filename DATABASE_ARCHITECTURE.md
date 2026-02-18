# Database Architecture Documentation for the Incidents System

## Overview
The Incidents System is designed to manage and track incidents in a structured manner. The following documentation outlines the key components of the database architecture including tables, relationships, and data flow.

## Key Entities
1. **Incidents**: Stores all incident records.
   - **Fields**: `incident_id`, `title`, `description`, `status`, `created_at`, `updated_at`

2. **Users**: Contains information about users who report incidents.
   - **Fields**: `user_id`, `name`, `email`, `role`, `created_at`

3. **Categories**: Classifies incidents into various categories.
   - **Fields**: `category_id`, `category_name`, `created_at`

4. **Comments**: Allows users to add comments to incidents for better context and communication.
   - **Fields**: `comment_id`, `incident_id`, `user_id`, `comment`, `created_at`

## Relationships
- **Incidents to Users**: Each incident is reported by a user. (One-to-Many)
- **Incidents to Categories**: Each incident can belong to one category. (Many-to-One)
- **Incidents to Comments**: Each incident can have multiple comments. (One-to-Many)

## Data Flow
1. When a user reports an incident, a new record is created in the `Incidents` table.
2. The user's details are fetched from the `Users` table based on their login.
3. The incident can be categorized by selecting a category from the `Categories` table.
4. Other users can add comments to the incident, creating multiple entries in the `Comments` table linked to the `incident_id`.

## Conclusion
This database architecture supports a robust incidents management system, ensuring efficient data handling and integrity through its structured relationships and entities.