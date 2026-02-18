# Database Architecture Documentation for the Incidents System

## Overview
This document outlines the complete database architecture for the incidents system, describing all essential components, including tables, relationships, and features, along with diagrams and testing protocols.

---

## Tables
### 1. Incidents
- **Table Name**: incidents  
- **Columns**:  
  - `id`: Unique identifier for each incident  
  - `title`: Brief description of the incident  
  - `description`: Detailed description of the incident  
  - `status`: Current status of the incident (open, resolved, etc.)  
  - `created_at`: Timestamp for when the incident was reported  
  - `updated_at`: Timestamp for when the incident was last updated  

### 2. Incident Evidence
- **Table Name**: incident_evidence  
- **Columns**:  
  - `id`: Unique identifier for evidence  
  - `incident_id`: Foreign key linking to incidents  
  - `evidence_type`: Type of evidence (image, document, etc.)  
  - `evidence_description`: Description of the evidence  
  - `created_at`: Timestamp for when evidence was added  

### 3. Incident Responses
- **Table Name**: incident_responses  
- **Columns**:  
  - `id`: Unique identifier for each response  
  - `incident_id`: Foreign key linking to incidents  
  - `response_text`: Text of the response  
  - `responded_at`: Timestamp for when the response was made  

### 4. Incident Moderation Log
- **Table Name**: incident_moderation_log  
- **Columns**:  
  - `id`: Unique identifier for each moderation entry  
  - `incident_id`: Foreign key linking to incidents  
  - `moderator_action`: Action taken by the moderator  
  - `moderated_at`: Timestamp for when moderation occurred  

### 5. Contact Persons
- **Table Name**: contact_persons  
- **Columns**:  
  - `id`: Unique identifier for contact person  
  - `incident_id`: Foreign key linking to incidents  
  - `name`: Name of the contact person  
  - `email`: Email address for follow-ups  
  - `phone`: Phone number of the contact person  

---

## Entity-Relationship Diagram (ERD)
[Insert ERD here]

---

## Privacy Features
- Data Encryption: All sensitive data is encrypted at rest and in transit.
- Access Control: Role-based access control ensures that only authorized personnel can access sensitive information.
- Data Anonymization: Personally identifiable information is anonymized where applicable.

---

## Workflow Diagrams
[Insert workflow diagrams here]

---

## Testing Checklist
1. Validate database schema against the requirements.
2. Test data integrity and relationships between tables.
3. Verify access controls and data privacy measures.
4. Test for performance under load.

---

This documentation aims to serve as a comprehensive guide to understanding and utilizing the database architecture for the incidents system. Please ensure that any updates to the system are reflected in this documentation.