# BhumiSetu: System Architecture & API Specification
**Intelligent Land Record Digitization, Validation, and Spatial Governance System**  
*Aligned with SIH Problem Statement 26018, DILRMP, and Government of India ULPIN (Bhu-Aadhaar) Standards*

---

## Table of Contents
1. [Executive Summary & Problem Context](#1-executive-summary--problem-context)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
   - [2.1 Architectural Pillars](#21-architectural-pillars)
   - [2.2 High-Level Architecture Diagram](#22-high-level-architecture-diagram)
   - [2.3 Dual-Mode Ingestion Pipeline](#23-dual-mode-ingestion-pipeline)
   - [2.4 Asynchronous Worker Ingestion Sequence Diagram](#24-asynchronous-worker-ingestion-sequence-diagram)
   - [2.5 Human-in-the-Loop (HITL) Review Flow Sequence Diagram](#25-human-in-the-loop-hitl-review-flow-sequence-diagram)
   - [2.6 Document Lifecycle State Machine](#26-document-lifecycle-state-machine)
3. [Database Architecture & Data Models](#3-database-architecture--data-models)
   - [3.1 PostgreSQL + PostGIS Entity-Relationship Diagram](#31-postgresql--postgis-entity-relationship-diagram)
   - [3.2 Data Dictionary & Schema Specification](#32-data-dictionary--schema-specification)
4. [Core Algorithmic Engines](#4-core-algorithmic-engines)
   - [4.1 Multi-Region Land Unit Normalization Engine](#41-multi-region-land-unit-normalization-engine)
   - [4.2 Provisional ULPIN (Bhu-Aadhaar) Generator](#42-provisional-ulpin-bhu-aadhaar-generator)
   - [4.3 Explainable Confidence & Review Priority Scorer](#43-explainable-confidence--review-priority-scorer)
   - [4.4 Cadastral GIS & Spatial Topology Engine](#44-cadastral-gis--spatial-topology-engine)
   - [4.5 Tamper-Evident SHA-256 Hash Chained Audit Ledger](#45-tamper-evident-sha-256-hash-chained-audit-ledger)
5. [Complete API Route Directory & Endpoint Specifications](#5-complete-api-route-directory--endpoint-specifications)
   - [5.1 Summary Matrix of All Endpoints](#51-summary-matrix-of-all-endpoints)
   - [5.2 System & Health Endpoints](#52-system--health-endpoints)
   - [5.3 Authentication & Session Management (`/api/v1/auth`)](#53-authentication--session-management-apiv1auth)
   - [5.4 Document Management & Ingestion (`/api/v1/documents`)](#54-document-management--ingestion-apiv1documents)
   - [5.5 Land Records Directory & Search (`/api/v1/records`)](#55-land-records-directory--search-apiv1records)
   - [5.6 Human-in-the-Loop Review Queue (`/api/v1/review`)](#56-human-in-the-loop-review-queue-apiv1review)
   - [5.7 GIS & Spatial Cadastral Operations (`/api/v1/gis`)](#57-gis--spatial-cadastral-operations-apiv1gis)
   - [5.8 Tamper-Evident Audit Ledger (`/api/v1/audit`)](#58-tamper-evident-audit-ledger-apiv1audit)
6. [Client-Side Edge Preprocessor (Web/Mobile SDK)](#6-client-side-edge-preprocessor-webmobile-sdk)
7. [Environment Configuration & Deployment Topology](#7-environment-configuration--deployment-topology)
8. [Automated Verification & Test Suite](#8-automated-verification--test-suite)

---

## 1. Executive Summary & Problem Context

In India, legacy land records (RoR/Khatauni, Jamabandi, Fard, Khasra) are predominantly archived as degraded physical paper documents across thousands of Tehsil record rooms. The digitization and validation of these records under the **Digital India Land Records Modernization Programme (DILRMP)** encounter severe operational bottlenecks:
1. **Document Degradation**: Decades-old paper scans suffer from faded ink, ink bleed-through, varying resolutions, and non-standard orientations.
2. **Regional Unit Fragmentation**: Land areas are documented in diverse non-metric units with localized definitions (e.g., *Pucca Bigha* vs. *Kuccha Bigha* in Uttar Pradesh/Rajasthan, *Katha*, *Guntha*, *Kanal*, *Cent*, *Marla*, *Biswa*).
3. **Absence of Unified Geocoding**: Disconnect between textual ownership records and spatial cadastral maps, hindering rollout of the 14-digit **ULPIN** (*Unique Land Parcel Identification Number* / *Bhu-Aadhaar*).
4. **Server Compute Bottlenecks**: Transmitting uncompressed 50MB TIFF/PNG scans directly through application servers causes memory exhaustion and server crashes.
5. **Lack of Verifiable Trust**: Modifications and human approvals lack mathematical immutability, creating vulnerability to administrative fraud and boundary disputes.

**BhumiSetu** solves these challenges by combining:
- **Client-Side Edge Optimization & Direct S3 Presigned Upload**: Zero-memory footprint on the Node.js API server.
- **Asynchronous Pipeline (BullMQ + Redis)**: Decoupled vision-language OCR inference, image denoising via Sharp, and deterministic rule validation.
- **Explainable Multi-Factor Confidence Scoring**: Automatically categorizes extracted fields into `MATCH`, `UNCERTAIN`, and `CONFLICT`, prioritizing human inspection.
- **Multi-Region Unit Normalizer**: Dynamically standardizes regional customary units into metric Square Meters ($m^2$) and Hectares ($ha$) using State LGD codes.
- **Spatial Topology Engine (PostGIS + Turf.js)**: Verifies polygon validity (zero self-intersections/kinks), computes geodesic areas, and flags parcel overlaps/encroachments.
- **Cryptographic Audit Ledger**: An immutable, blockchain-inspired SHA-256 hash-chained log guaranteeing non-repudiation for every manual correction and verification.

---

## 2. End-to-End System Architecture

### 2.1 Architectural Pillars

```
+---------------------------------------------------------------------------------------------------+
|                                          BHUMISETU SYSTEM                                         |
+---------------------------------------------------------------------------------------------------+
|  [Edge Tier]      Web Browser / Mobile App (Canvas 2D Downscaling, SHA-256 Hash, Direct S3 PUT)   |
|  [Gateway Tier]   Express.js REST API (Helmet, CORS, JWT Auth, Redis Sliding Session, RBAC)       |
|  [Queue Tier]     BullMQ + Redis 7 (Decoupled Job Queue with Exponential Retry & In-Process Fallback)|
|  [Worker Tier]    Node.js Pipeline (Sharp libvips Denoising, HF TrOCR/Donut, LGD Validation)      |
|  [Spatial Tier]   PostgreSQL 16 + PostGIS 3.4 (ST_* Cadastral Geometry, GIST Spatial Indexes)     |
|  [Ledger Tier]    SHA-256 Cryptographic Block Ledger (Deterministic Canonical JSON Delta Chaining)|
+---------------------------------------------------------------------------------------------------+
```

### 2.2 High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Web / Mobile)"]
        Client["Browser Client / Mobile App"]
        EdgeProcessor["Edge Preprocessor<br/>(Downscale to 300 DPI, Grayscale, SHA-256)"]
        Client --> EdgeProcessor
    end

    subgraph StorageLayer["Object Storage (MinIO / AWS S3)"]
        S3Bucket[("S3 Bucket: bhumisetu-documents<br/>raw/ and preprocessed/")]
    end

    subgraph APILayer["API Gateway (Express.js)"]
        AuthMiddleware["JWT & Redis Session Guard"]
        RBAC["RBAC Middleware<br/>(ADMIN, TEHSILDAR, PATWARI, CITIZEN)"]
        DocController["Document Controller"]
        RecordController["Record Controller"]
        ReviewController["Review Controller"]
        GISController["GIS Controller"]
        AuditController["Audit Controller"]
    end

    subgraph QueueBroker["Message Broker (Redis 7)"]
        RedisSession[("Redis: User Sessions & Refresh Tokens")]
        BullQueue[("BullMQ Queue: document-processing")]
    end

    subgraph WorkerPool["Asynchronous Worker Tier"]
        Worker["BullMQ Worker (document.worker.js)"]
        SharpEngine["Sharp libvips<br/>(Normalize, Denoise, Grayscale)"]
        HFClient["Hugging Face AI Client<br/>(TrOCR / Vision Model / Mock)"]
        UnitConv["Multi-Region Unit Converter<br/>(State LGD Rules)"]
        ULPINGen["Provisional ULPIN Generator<br/>(14-char Bhu-Aadhaar)"]
        RulesEngine["Legal Rules & Shares Validator"]
        Scorer["Explainable Confidence Scorer<br/>(MATCH / UNCERTAIN / CONFLICT)"]
    end

    subgraph DataTier["Data Tier (PostgreSQL 16 + PostGIS)"]
        PrismaORM["Prisma Client ORM"]
        PostgresDB[("PostgreSQL 16")]
        PostGIS["PostGIS Spatial Extension<br/>(parcel_geometries, GIST Index)"]
        AuditLedger[("Tamper-Evident Audit Ledger<br/>(SHA-256 Hash Chain)")]
    end

    EdgeProcessor -- "1. Request Presigned Slot" --> DocController
    DocController -- "2. Presigned Upload URL" --> EdgeProcessor
    EdgeProcessor -- "3. Direct PUT Scan" --> S3Bucket
    EdgeProcessor -- "4. Complete Upload Webhook" --> DocController
    DocController -- "5. Push Job" --> BullQueue
    BullQueue --> Worker

    Worker -- "Fetch Raw Buffer" --> S3Bucket
    Worker --> SharpEngine
    SharpEngine -- "Store Clean Scan" --> S3Bucket
    Worker --> HFClient
    Worker --> UnitConv
    Worker --> ULPINGen
    Worker --> RulesEngine
    Worker --> Scorer
    Worker --> PrismaORM

    AuthMiddleware <--> RedisSession
    DocController --> PrismaORM
    RecordController --> PrismaORM
    ReviewController --> PrismaORM
    GISController --> PostGIS
    AuditController --> AuditLedger
    PrismaORM --> PostgresDB
```

---

### 2.3 Dual-Mode Ingestion Pipeline

To accommodate heterogeneous production and edge environments, BhumiSetu implements two ingestion pathways:
1. **Production Blueprint (Direct-to-S3 Presigned Flow)**:
   - The client invokes `computeClientSHA256()` on the raw document.
   - The client calls `POST /api/v1/documents/request-upload`. If the hash already exists in PostgreSQL, the server responds with `{ isDuplicate: true }` instantly, skipping upload and saving bandwidth.
   - If novel, the server issues a pre-authenticated S3 Presigned `PUT` URL.
   - The browser streams the binary payload directly into S3/MinIO. Node.js memory consumption remains at $0\text{ MB}$.
   - The browser calls `POST /api/v1/documents/:id/complete-upload` to dispatch the BullMQ background job.
2. **Standard Buffered Fallback (`/api/v1/documents/upload`)**:
   - Designed for low-power legacy clients, automated scripts, and test suites.
   - Uses `multer.memoryStorage()` with a $30\text{ MB}$ limit, hashing in memory and streaming to S3.

---

### 2.4 Asynchronous Worker Ingestion Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Field Officer / Citizen
    participant Client as Web/Mobile Client (Edge SDK)
    participant API as Express API Server
    participant S3 as MinIO / AWS S3 Storage
    participant Redis as Redis 7 (BullMQ)
    participant Worker as BullMQ Worker Pipeline
    participant HF as Hugging Face AI Endpoint
    participant DB as PostgreSQL + PostGIS

    User->>Client: Selects Scanned Deed / Map (TIFF/PDF/JPG)
    Client->>Client: Downscale to 300 DPI (max 2400px), Compute SHA-256
    Client->>API: POST /api/v1/documents/request-upload (Filename, SHA-256, LGD)
    API->>DB: Check for duplicate SHA-256
    alt Document already exists
        API-->>Client: 200 OK (isDuplicate: true, document: existingRecord)
    else Novel document
        API->>DB: INSERT INTO documents (status: 'UPLOADED')
        API->>S3: Generate S3 Presigned PUT URL (15 min TTL)
        API-->>Client: 201 Created (presignedUploadUrl, s3Key, docId)
        Client->>S3: HTTP PUT [Binary Scan Payload]
        S3-->>Client: 200 OK (S3 ETag confirmed)
        Client->>API: POST /api/v1/documents/:id/complete-upload
        API->>Redis: Enqueue BullMQ Job 'process-scan'
        API-->>Client: 200 OK (Processing enqueued)
    end

    Note over Worker: Background Asynchronous Processing
    Redis->>Worker: Consume 'process-scan' Job
    Worker->>DB: UPDATE documents SET status = 'PREPROCESSING'
    Worker->>S3: GET s3Key (Raw Buffer)
    Worker->>Worker: Sharp libvips: Denoise, Grayscale, Contrast Normalization
    Worker->>S3: PUT preprocessed/{id}_clean.jpg
    Worker->>DB: UPDATE documents SET status = 'INFERENCE', preprocessedS3Key
    Worker->>HF: POST Image to Hugging Face Vision-Language Model
    HF-->>Worker: Extracted JSON (Survey No, Area, Unit, Owners, BBoxes)
    Worker->>DB: UPDATE documents SET status = 'VALIDATING'
    Worker->>Worker: Multi-Region Unit Normalization (e.g. Bigha -> m², ha)
    Worker->>Worker: Generate Provisional 14-char ULPIN (Bhu-Aadhaar)
    Worker->>Worker: Run Rules: Owners Share = 100%, Survey format check
    Worker->>Worker: Score confidence: AI logits + Image quality + Rule validity
    Worker->>DB: INSERT INTO land_records, field_extractions
    Worker->>DB: Append Genesis SHA-256 Block to audit_logs
    Worker->>DB: UPDATE documents SET status = 'READY_FOR_REVIEW'
```

---

### 2.5 Human-in-the-Loop (HITL) Review Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Revenue Officer (Patwari / Tehsildar)
    participant Client as Officer Review Workbench
    participant API as Express API Server
    participant Redis as Redis Session Store
    participant DB as PostgreSQL + PostGIS Ledger

    Officer->>Client: Open Officer Portal
    Client->>API: GET /api/v1/review/queue?villageLgd=123456
    API->>DB: SELECT land_records WHERE status IN ('PENDING_REVIEW','IN_REVIEW') ORDER BY reviewPriorityScore DESC
    DB-->>API: Prioritized List (High Risk / Low Confidence First)
    API-->>Client: 200 OK (Queue items with document details)

    Officer->>Client: Selects record to inspect
    Client->>API: POST /api/v1/review/:recordId/lock
    API->>DB: Check optimistic lock (locked_by, locked_at within 15 min lease)
    alt Record locked by another officer
        API-->>Client: 409 Conflict ("Currently locked by another officer")
    else Lock available
        API->>DB: UPDATE land_records SET locked_by = userId, locked_at = NOW(), review_status = 'IN_REVIEW'
        API-->>Client: 200 OK (Lock acquired)
    end

    Client->>API: GET /api/v1/records/:recordId
    API->>DB: Fetch record, fieldExtractions, bounding boxes, S3 download URL
    DB-->>API: Full Record Details
    API-->>Client: 200 OK (Render split-screen UI: scan on left, fields on right)

    Officer->>Client: Inspects fields, corrects mismatched owner name / area unit
    Officer->>Client: Clicks "Approve & Sign Digitally"
    Client->>API: POST /api/v1/review/:recordId/submit (fieldDecisions, finalStatus: 'VERIFIED', manualArea)
    
    rect rgb(240, 248, 255)
        Note over API,DB: PostgreSQL ACID Transaction
        API->>DB: UPDATE field_extractions (status, human_verified_value, correctionReason)
        API->>DB: Recalculate normalized area if unit adjusted
        API->>DB: UPDATE land_records SET review_status = 'VERIFIED', verified_by = userId, locked_by = NULL
        API->>DB: Compute SHA-256 (prevHash, recordId, actorId, canonicalDelta, timestamp)
        API->>DB: INSERT INTO audit_logs (sequence_number, prev_hash, curr_hash, delta)
    end
    DB-->>API: Transaction Committed
    API-->>Client: 200 OK (Record approved & signed into immutable ledger)
```

---

### 2.6 Document Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> UPLOADED: Upload Initialized (Direct S3 / Buffered)
    UPLOADED --> PREPROCESSING: Worker picks up BullMQ Job
    PREPROCESSING --> INFERENCE: Sharp cleaning complete & clean scan stored
    PREPROCESSING --> FAILED: Invalid image format or corrupted buffer
    INFERENCE --> VALIDATING: HF Model emits raw textual / structured fields
    INFERENCE --> FAILED: AI Endpoint timeout or fatal inference failure
    VALIDATING --> READY_FOR_REVIEW: Unit converted, ULPIN assigned, fields scored
    VALIDATING --> FAILED: Database constraint violation
    READY_FOR_REVIEW --> IN_REVIEW: Revenue Officer acquires 15-minute lock
    IN_REVIEW --> READY_FOR_REVIEW: Lock expired or manually released
    IN_REVIEW --> VERIFIED: Officer validates and approves all fields
    IN_REVIEW --> REJECTED: Officer rejects fraudulent or invalid record
    VERIFIED --> [*]
    REJECTED --> [*]
    FAILED --> [*]
```

---

## 3. Database Architecture & Data Models

### 3.1 PostgreSQL + PostGIS Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ documents : "uploadedBy"
    users ||--o{ land_records : "lockedBy"
    users ||--o{ land_records : "verifiedBy"
    users ||--o{ audit_logs : "actor"
    documents ||--o{ land_records : "contains"
    land_records ||--o{ field_extractions : "has"
    land_records ||--o{ parcel_geometries : "spatialGeom"
    land_records ||--o{ audit_logs : "trackedIn"

    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR name
        VARCHAR role "ADMIN | TEHSILDAR | PATWARI | CITIZEN"
        VARCHAR department
        VARCHAR state_lgd_code
        VARCHAR district_lgd_code
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    documents {
        UUID id PK
        VARCHAR original_filename
        VARCHAR mime_type
        BIGINT file_size_bytes
        VARCHAR sha256_hash UK
        VARCHAR s3_key
        VARCHAR preprocessed_s3_key
        VARCHAR status "UPLOADED|PREPROCESSING|INFERENCE|VALIDATING|READY_FOR_REVIEW|VERIFIED|REJECTED|FAILED"
        TEXT error_message
        UUID uploaded_by FK
        JSONB metadata
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    land_records {
        UUID id PK
        UUID document_id FK
        VARCHAR state_lgd
        VARCHAR district_lgd
        VARCHAR subdistrict_lgd
        VARCHAR village_lgd
        VARCHAR village_name
        VARCHAR survey_number
        VARCHAR subdivision_number
        VARCHAR ulpin "14-char Bhu-Aadhaar"
        NUMERIC raw_area
        VARCHAR raw_unit
        NUMERIC normalized_area_sqm
        NUMERIC normalized_area_hectares
        JSONB unit_conversion_metadata
        VARCHAR land_classification
        JSONB owners
        NUMERIC overall_confidence
        NUMERIC review_priority_score
        VARCHAR review_status "PENDING_REVIEW|IN_REVIEW|VERIFIED|REJECTED"
        UUID locked_by FK
        TIMESTAMPTZ locked_at
        UUID verified_by FK
        TIMESTAMPTZ verified_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    field_extractions {
        UUID id PK
        UUID record_id FK
        VARCHAR field_name
        TEXT ai_extracted_value
        NUMERIC ai_confidence
        JSONB bounding_box
        VARCHAR rule_validation_status "PASS | WARNING | FAIL"
        TEXT rule_validation_message
        TEXT human_verified_value
        VARCHAR status "UNVERIFIED | ACCEPTED | CORRECTED | REJECTED"
        TEXT correction_reason
        TIMESTAMPTZ created_at
    }

    parcel_geometries {
        UUID id PK
        UUID record_id FK
        GEOMETRY geom "MULTIPOLYGON, SRID 4326"
        NUMERIC calculated_area_sqm
        BOOLEAN is_valid_geometry
        BOOLEAN overlap_warning
        JSONB properties
        TIMESTAMPTZ created_at
    }

    audit_logs {
        UUID id PK
        BIGSERIAL sequence_number UK
        UUID record_id FK
        VARCHAR action
        UUID actor_id FK
        VARCHAR actor_role
        VARCHAR prev_hash "64-char SHA-256"
        VARCHAR curr_hash "64-char SHA-256"
        JSONB delta "Canonical Sorted JSON"
        TIMESTAMPTZ timestamp
    }
```

### 3.2 Data Dictionary & Schema Specification

| Table Name | Primary Purpose | Indexing Strategy | Partitioning / Storage Notes |
| :--- | :--- | :--- | :--- |
| `users` | Revenue administration & citizen identities | Unique B-tree on `email` | Passwords hashed using bcrypt (10 rounds) |
| `documents` | Metadata for ingested scanned deeds & maps | Unique B-tree on `sha256_hash` | Prevents redundant S3 storage and compute |
| `land_records` | Standardized DILRMP land title record | Composite on `(village_lgd, survey_number)`, B-tree on `review_priority_score DESC` | Primary entity for search, review, and verification |
| `field_extractions` | Fine-grained AI bounding boxes and confidence | Foreign Key on `record_id` | Stores pixel bounding box `[ymin, xmin, ymax, xmax]` |
| `parcel_geometries` | PostGIS spatial boundaries of land plots | **GIST Index** on `geom` column (`SRID 4326`) | Enables sub-millisecond spatial queries via `ST_Intersects` |
| `audit_logs` | Cryptographic tamper-evident append-only chain | Unique on `sequence_number`, Index on `record_id` | Enforces mathematical continuity via SHA-256 chaining |

---

## 4. Core Algorithmic Engines

### 4.1 Multi-Region Land Unit Normalization Engine

Indian land deeds employ regional customary units that vary significantly across state boundaries. BhumiSetu maps each unit based on the official 2-digit State LGD (Local Government Directory) code:

| State | LGD Code | Local Unit Name | Multiplier to Square Meters ($m^2$) | Official Customary Definition |
| :--- | :---: | :--- | :--- | :--- |
| **National Metric** | Standard | Hectare | $10,000.0000\text{ }m^2$ | SI Metric Standard |
| **National Imperial** | Standard | Acre | $4,046.8564\text{ }m^2$ | $43,560\text{ sq ft}$ |
| **Uttar Pradesh** | `09` | Pucca Bigha | $2,529.2853\text{ }m^2$ | $3,025\text{ sq yd} = 20\text{ Biswa}$ |
| **Uttar Pradesh** | `09` | Kuccha Bigha | $843.0951\text{ }m^2$ | $1/3\text{ of Pucca Bigha}$ |
| **Uttar Pradesh** | `09` | Biswa | $126.4643\text{ }m^2$ | $1/20\text{ of Pucca Bigha}$ |
| **Uttar Pradesh** | `09` | Biswansi | $6.3232\text{ }m^2$ | $1/20\text{ of Biswa}$ |
| **Bihar** | `10` | Bigha | $2,528.8000\text{ }m^2$ | $20\text{ Katha}$ |
| **Bihar** | `10` | Katha | $126.4400\text{ }m^2$ | $20\text{ Dhur}$ |
| **West Bengal** | `19` | Bigha | $1,337.8038\text{ }m^2$ | $14,400\text{ sq ft} = 20\text{ Katha}$ |
| **West Bengal** | `19` | Chatak | $4.1806\text{ }m^2$ | $45\text{ sq ft}$ |
| **Maharashtra** | `27` | Guntha | $101.1714\text{ }m^2$ | $1,089\text{ sq ft} = 1/40\text{ Acre}$ |
| **Karnataka** | `29` | Cent | $40.4686\text{ }m^2$ | $435.6\text{ sq ft} = 1/100\text{ Acre}$ |
| **Punjab / Haryana**| `03`/`06`| Kanal | $505.8571\text{ }m^2$ | $5,445\text{ sq ft} = 20\text{ Marla}$ |
| **Punjab / Haryana**| `03`/`06`| Marla | $25.2929\text{ }m^2$ | $272.25\text{ sq ft} = 9\text{ Sarsahi}$ |

> [!IMPORTANT]
> **Disambiguation Policy**: When an ambiguous unit string like `"Bigha"` is extracted in Uttar Pradesh or Rajasthan without specifying *Pucca* or *Kuccha*, the engine defaults to *Pucca Bigha*, sets `isAmbiguous = true`, and returns the `disambiguationOptions` array containing both calculations. This immediately elevates the record's priority in the revenue officer queue for human confirmation.

---

### 4.2 Provisional ULPIN (Bhu-Aadhaar) Generator

The **Unique Land Parcel Identification Number (ULPIN)** is the official 14-character alphanumeric identification system mandated by the Government of India.
- **Alphabet**: Crockford Base32 subset (`0123456789BCDFGHJKLMNPQRSTVWXYZ`), omitting confusing characters `I`, `O`, and `U`.
- **Structure**:
  1. Characters 1–4: Base36-encoded normalized latitude of parcel centroid.
  2. Characters 5–8: Base36-encoded normalized longitude of parcel centroid.
  3. Characters 9–12: Last 4 digits of the village LGD code.
  4. Character 13: MD5 hash-derived character representing the Khasra/Survey number.
  5. Character 14: **Luhn mod-32 Check Digit** computed across the first 13 characters for tamper protection.

$$\text{CheckDigit} = (N - (\sum \text{Addend} \pmod N)) \pmod N \quad \text{where } N = 32$$

---

### 4.3 Explainable Confidence & Review Priority Scorer

BhumiSetu rejects opaque AI decisions. Every extracted field receives an explainable multi-factor composite score:

$$\text{Composite Score} = 0.50 \cdot C_{\text{AI}} + 0.25 \cdot Q_{\text{image}} + 0.25 \cdot V_{\text{rule}}$$

Where:
- $C_{\text{AI}} \in [0, 1]$: Logit confidence output by the Hugging Face vision-language model.
- $Q_{\text{image}} \in [0, 1]$: Image sharpness, dynamic range, and resolution metric from Sharp preprocessing.
- $V_{\text{rule}} \in \{0.0, 1.0\}$: Binary legal syntax and cross-field validation flag.

#### Field Classification Tiers
- **MATCH** ($\text{Composite} \ge 0.85$ and $V_{\text{rule}} = 1$): High confidence, syntax verified.
- **UNCERTAIN** ($0.65 \le \text{Composite} < 0.85$): Moderate confidence, visual inspection advised.
- **CONFLICT** ($\text{Composite} < 0.65$ or $V_{\text{rule}} = 0$): Rule failure (e.g. owner shares $\ne 100\%$, ambiguous unit, or degraded scan).

$$\text{Review Priority Score} = 1.0 - \text{Composite Score}$$

Records in the revenue officer review queue are sorted by `reviewPriorityScore DESC`, guaranteeing that problematic deeds receive immediate administrative scrutiny.

---

### 4.4 Cadastral GIS & Spatial Topology Engine

```mermaid
flowchart TD
    InGeo[Input GeoJSON Polygon] --> KinkCheck{Turf.js Kinks Check}
    KinkCheck -- Kinks > 0 --> InvPoly[Flag: Self-Intersecting Polygon]
    KinkCheck -- Kinks == 0 --> GeoArea[Compute Geodesic Area via turf.area in m²]
    GeoArea --> Centroid[Calculate Centroid & Bounding Box]
    Centroid --> PostGISTest{PostGIS ST_Intersects Check}
    PostGISTest -- Intersection Area > 0.5 m² --> Encroach[Flag: Parcel Overlap / Encroachment Alert]
    PostGISTest -- No Intersection --> CleanParcel[Persist MultiPolygon into parcel_geometries]
    CleanParcel --> VillMap[Expose to Leaflet / MapLibre FeatureCollection]
```

- **Geodesic Calculations**: Computes true ellipsoidal surface area ($m^2$ and $ha$) on WGS84 (`EPSG:4326`).
- **Discrepancy Threshold**: Cross-checks deed area against GIS polygon area. If deviation $> 5\%$, sets `SPATIAL_AREA_DISCREPANCY` flag.
- **Boundary Collisions**: Uses `turf.booleanOverlap` and `ST_Intersection` to identify overlaps and boundary disputes between adjacent landowners.

---

### 4.5 Tamper-Evident SHA-256 Hash Chained Audit Ledger

Every modification, AI extraction, and human approval creates an immutable cryptographic block in `audit_logs`:

```mermaid
flowchart LR
    subgraph Block0["Genesis Block (Seq 0)"]
        H0["curr_hash:<br/>00000000... (GENESIS)"]
    end

    subgraph Block1["Block 1: AI Digitize"]
        P1["prev_hash: GENESIS"]
        D1["recordId: rec-123<br/>actorRole: SYSTEM_AI<br/>action: RECORD_DIGITIZED_BY_AI<br/>delta: { survey: '101/A', area: 2.5 }<br/>timestamp: 2026-10-15T10:00:00Z"]
        C1["curr_hash: 7a8f9c..."]
        P1 --- D1 --- C1
    end

    subgraph Block2["Block 2: Patwari Verification"]
        P2["prev_hash: 7a8f9c..."]
        D2["recordId: rec-123<br/>actorRole: PATWARI<br/>action: HUMAN_VERIFIED_AND_APPROVED<br/>delta: { fieldChanges: [...], area: 2.5 }<br/>timestamp: 2026-10-15T11:30:00Z"]
        C2["curr_hash: 3b1e4d..."]
        P2 --- D2 --- C2
    end

    Block0 --> Block1
    Block1 --> Block2
```

#### Deterministic Canonical Formula
To eliminate JSON serialization discrepancies across different runtime engines, key ordering in `delta` is alphabetically sorted before hashing:

$$\text{CanonicalDelta} = \text{JSON.stringify}(\delta, \text{Object.keys}(\delta).\text{sort}())$$

$$\text{curr\_hash} = \text{SHA-256}(\text{prev\_hash} \parallel \text{record\_id} \parallel \text{actor\_id} \parallel \text{action} \parallel \text{CanonicalDelta} \parallel \text{timestamp})$$

The endpoint `GET /api/v1/audit/verify-chain` executes this mathematical verification across every block in the ledger. If even a single character in the database is modified post-signature, the algorithm isolates the exact sequence number where the cryptographic link was broken.

---

## 5. Complete API Route Directory & Endpoint Specifications

### 5.1 Summary Matrix of All Endpoints

| # | HTTP Method | Endpoint URL | Auth / RBAC Role | Controller Method | Description |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `GET` | `/api/v1/health` | Public | Inline | Service health, uptime, environment, and AI mode |
| **2** | `GET` | `/api/v1/documents/raw/:key` | Public | Inline | Streaming raw uploaded scans from local storage fallback |
| **3** | `POST` | `/api/v1/auth/login` | Public | `login` | Authenticate with email/password; issue JWT + refresh token |
| **4** | `POST` | `/api/v1/auth/register` | `ADMIN` | `register` | Administrative creation of revenue officers and users |
| **5** | `POST` | `/api/v1/auth/refresh` | Public | `refresh` | Rotate refresh token and obtain new 15-minute access token |
| **6** | `POST` | `/api/v1/auth/logout` | Authenticated | `logout` | Revoke current device session in Redis |
| **7** | `POST` | `/api/v1/auth/logout-all` | Authenticated | `logoutAll` | Revoke all sessions across all devices for current user |
| **8** | `GET` | `/api/v1/auth/sessions` | Authenticated | `listSessions` | List active device sessions (IP, User-Agent, Last Active) |
| **9** | `GET` | `/api/v1/auth/profile` | Authenticated | `getProfile` | Return decoded JWT claims and profile of current user |
| **10** | `POST` | `/api/v1/documents/request-upload` | Authenticated | `requestUploadSlot` | **Blueprint Step 1**: Request S3 Presigned URL + instant deduplication |
| **11** | `POST` | `/api/v1/documents/:id/complete-upload` | Authenticated | `finalizeUpload` | **Blueprint Step 2**: Finalize direct S3 upload & dispatch BullMQ job |
| **12** | `POST` | `/api/v1/documents/upload` | Authenticated | `uploadDocument` | Fallback single-step multipart/form-data upload |
| **13** | `GET` | `/api/v1/documents` | Authenticated | `getDocumentsList` | Paginated list of ingested document scans |
| **14** | `GET` | `/api/v1/documents/:id` | Authenticated | `getDocument` | Get document details and presigned download URLs |
| **15** | `GET` | `/api/v1/records` | Authenticated | `findRecords` | Search normalized land records with village/status filters |
| **16** | `GET` | `/api/v1/records/:id` | Authenticated | `getRecord` | Full land record title, extractions, geometries & audit history |
| **17** | `GET` | `/api/v1/review/queue` | `PATWARI`, `TEHSILDAR`, `ADMIN` | `getQueue` | High-priority revenue review queue (highest risk first) |
| **18** | `POST` | `/api/v1/review/:recordId/lock` | `PATWARI`, `TEHSILDAR`, `ADMIN` | `lockRecord` | Acquire exclusive 15-minute optimistic review lock |
| **19** | `POST` | `/api/v1/review/:recordId/unlock` | `PATWARI`, `TEHSILDAR`, `ADMIN` | `unlockRecord` | Release acquired review lock back to pending pool |
| **20** | `POST` | `/api/v1/review/:recordId/submit` | `PATWARI`, `TEHSILDAR`, `ADMIN` | `submitDecision` | Submit human verification decisions, area adjustments & sign |
| **21** | `POST` | `/api/v1/gis/analyze-polygon` | Authenticated | `analyzePolygon` | Validate GeoJSON, compute geodesic area, kinks & centroid |
| **22** | `POST` | `/api/v1/gis/check-overlap` | Authenticated | `verifyOverlap` | Detect parcel boundary collisions & encroachment areas |
| **23** | `POST` | `/api/v1/gis/parcel/:recordId` | Authenticated | `attachParcelGeometry` | Persist verified cadastral polygon into PostGIS (`EPSG:4326`) |
| **24** | `GET` | `/api/v1/gis/village/:villageLgd` | Authenticated | `getVillageMapData` | Fetch all village parcels as GeoJSON FeatureCollection |
| **25** | `GET` | `/api/v1/audit/record/:recordId` | Authenticated | `getRecordAuditHistory` | Fetch sequential audit trail blocks for a specific record |
| **26** | `GET` | `/api/v1/audit/verify-chain` | `ADMIN`, `TEHSILDAR` | `verifyFullLedgerChain` | Verify full ledger SHA-256 chain integrity & detect tampering |

---

### 5.2 System & Health Endpoints

#### `GET /api/v1/health`
- **Description**: Returns operational status of the service, uptime, runtime environment, and active Hugging Face inference mode.
- **Authentication**: None (Public)
- **Response `200 OK`**:
```json
{
  "status": "UP",
  "project": "BhumiSetu Backend (SIH PS 26018)",
  "environment": "development",
  "uptimeSeconds": 142.53,
  "timestamp": "2026-10-15T12:00:00.000Z",
  "aiMode": "MOCK_INFERENCE",
  "hfEndpoint": "https://api-inference.huggingface.co/models/microsoft/trocr-base-stage1"
}
```
- **Example cURL**:
```bash
curl -X GET http://localhost:5000/api/v1/health
```

---

#### `GET /api/v1/documents/raw/:key`
- **Description**: Streams a raw document scan directly from the local disk fallback repository.
- **Authentication**: None (Public)
- **Parameters**: `key` (path, required) - filename of the document.
- **Response**: Binary image stream or `404 Not Found`.

---

### 5.3 Authentication & Session Management (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
- **Description**: Authenticates user credentials, registers a sliding session in Redis, and issues dual tokens: a short-lived access JWT ($15\text{ min}$) and a persistent rotation-enabled refresh token ($7\text{ days}$).
- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "email": "patwari@bhumisetu.gov.in",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "4a82df31c7784f1837bc4498ecb812f80879e64e8361093121081682390aef69d41e73998f45a0b7",
  "sessionId": "b47c9451-2dc7-4ef8-b223-9189ef949df2",
  "expiresIn": "15m",
  "user": {
    "id": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
    "sessionId": "b47c9451-2dc7-4ef8-b223-9189ef949df2",
    "email": "patwari@bhumisetu.gov.in",
    "name": "Ramesh Kumar Sharma",
    "role": "PATWARI",
    "department": "Revenue & Land Records",
    "stateLgd": "09",
    "districtLgd": "140"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `{"success": false, "error": "Email and password are required"}`
  - `401 Unauthorized`: `{"success": false, "error": "Invalid email or password"}`
- **Example cURL**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patwari@bhumisetu.gov.in","password":"Password123!"}'
```

---

#### `POST /api/v1/auth/register`
- **Description**: Creates a new officer or citizen account. Enforces Role-Based Access Control: only an authenticated `ADMIN` can provision accounts.
- **Authentication**: Bearer JWT (`ADMIN` role required)
- **Request Body**:
```json
{
  "email": "tehsildar.lucknow@gov.in",
  "password": "SecurePassword#2026",
  "name": "Ananya Verma",
  "role": "TEHSILDAR",
  "department": "Department of Revenue",
  "stateLgd": "09",
  "districtLgd": "140"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "user": {
    "id": "7f1396a8-7bf1-482a-a9e9-d75756d1f057",
    "email": "tehsildar.lucknow@gov.in",
    "name": "Ananya Verma",
    "role": "TEHSILDAR",
    "department": "Department of Revenue",
    "stateLgdCode": "09",
    "districtLgdCode": "140",
    "createdAt": "2026-10-15T12:05:00.000Z"
  }
}
```
- **Error Responses**:
  - `403 Forbidden`: Role is not `ADMIN`.
  - `400 Bad Request`: Email already registered or invalid fields.

---

#### `POST /api/v1/auth/refresh`
- **Description**: Token Rotation endpoint. Invalidates the supplied refresh token in Redis and issues a fresh access token and fresh refresh token to protect against replay attacks.
- **Authentication**: None (Token passed in body)
- **Request Body**:
```json
{
  "refreshToken": "4a82df31c7784f1837bc4498ecb812f80879e64e8361093121081682390aef69d41e73998f45a0b7"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Token rotated successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "9e1c4568da903271bc9842f109bc489aef098234710298a873491bc90a8274198273641298ab",
  "expiresIn": "15m",
  "user": {
    "id": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
    "sessionId": "b47c9451-2dc7-4ef8-b223-9189ef949df2",
    "email": "patwari@bhumisetu.gov.in",
    "role": "PATWARI"
  }
}
```

---

#### `POST /api/v1/auth/logout`
- **Description**: Revokes the active session ID from Redis, instantly invalidating the current JWT access token and refresh token.
- **Authentication**: Bearer JWT
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logged out successfully; session revoked in Redis"
}
```

---

#### `POST /api/v1/auth/logout-all`
- **Description**: Security revocation endpoint. Revokes all active session keys for the calling user across all devices (mobile, tablet, desktop).
- **Authentication**: Bearer JWT
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "All active sessions revoked across all devices"
}
```

---

#### `GET /api/v1/auth/sessions`
- **Description**: Retrieves all currently active device sessions for the authenticated user from Redis.
- **Authentication**: Bearer JWT
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 2,
  "sessions": [
    {
      "sessionId": "b47c9451-2dc7-4ef8-b223-9189ef949df2",
      "userId": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0",
      "ip": "103.21.124.5",
      "createdAt": "2026-10-15T09:30:00.000Z",
      "lastRefreshedAt": "2026-10-15T11:45:00.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/auth/profile`
- **Description**: Returns the active authenticated user's profile and decoded session attributes.
- **Authentication**: Bearer JWT
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
    "sessionId": "b47c9451-2dc7-4ef8-b223-9189ef949df2",
    "email": "patwari@bhumisetu.gov.in",
    "name": "Ramesh Kumar Sharma",
    "role": "PATWARI",
    "department": "Revenue & Land Records",
    "stateLgd": "09",
    "districtLgd": "140"
  }
}
```

---

### 5.4 Document Management & Ingestion (`/api/v1/documents`)

#### `POST /api/v1/documents/request-upload`
- **Description**: **Step 1 of Production Direct-to-S3 Flow**. Checks SHA-256 deduplication before file transmission. If novel, creates a document record in PostgreSQL with status `UPLOADED` and returns an S3 presigned PUT URL.
- **Authentication**: Bearer JWT
- **Request Body**:
```json
{
  "originalFilename": "khatauni_sample_plot_101.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 2451920,
  "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "stateLgd": "09",
  "districtLgd": "140"
}
```
- **Response `201 Created` (Novel Scan)**:
```json
{
  "success": true,
  "isDuplicate": false,
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "khatauni_sample_plot_101.jpg",
    "status": "UPLOADED",
    "createdAt": "2026-10-15T12:10:00.000Z"
  },
  "s3Key": "raw/1760527800000_a1b2c3d4.jpg",
  "presignedUploadUrl": "http://localhost:9000/bhumisetu-documents/raw/1760527800000_a1b2c3d4.jpg?X-Amz-Algorithm=...",
  "uploadMethod": "PUT",
  "uploadHeaders": {
    "Content-Type": "image/jpeg"
  }
}
```
- **Response `200 OK` (Duplicate Scan Detected)**:
```json
{
  "success": true,
  "isDuplicate": true,
  "message": "This document scan has already been uploaded previously.",
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "khatauni_sample_plot_101.jpg",
    "status": "READY_FOR_REVIEW",
    "createdAt": "2026-10-10T08:00:00.000Z"
  }
}
```

---

#### `POST /api/v1/documents/:id/complete-upload`
- **Description**: **Step 2 of Production Direct-to-S3 Flow**. Called by the client once binary data has been successfully streamed to S3. Dispatches the background BullMQ processing job.
- **Authentication**: Bearer JWT
- **Parameters**: `id` (path, required) - Document UUID
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Direct upload acknowledged; document processing enqueued to BullMQ worker",
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "queueStatus": {
    "mode": "async_queued",
    "jobId": "42"
  }
}
```

---

#### `POST /api/v1/documents/upload`
- **Description**: Single-step multipart buffered upload (Express fallback). Reads file into memory buffer, computes SHA-256, uploads to S3, and dispatches BullMQ worker job.
- **Authentication**: Bearer JWT
- **Request Headers**: `Content-Type: multipart/form-data`
- **Form Fields**:
  - `document` (binary file, required)
  - `stateLgd` (text, optional, default: user state or `'09'`)
  - `districtLgd` (text, optional, default: user district or `'140'`)
- **Response `202 Accepted`**:
```json
{
  "success": true,
  "message": "Document uploaded and processing enqueued",
  "isDuplicate": false,
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "fard_scan.pdf",
    "status": "UPLOADED",
    "createdAt": "2026-10-15T12:12:00.000Z"
  },
  "queueStatus": {
    "mode": "async_queued",
    "jobId": "43"
  }
}
```

---

#### `GET /api/v1/documents`
- **Description**: Fetches paginated list of uploaded documents with processing status.
- **Authentication**: Bearer JWT
- **Query Parameters**:
  - `limit` (integer, default: 20)
  - `offset` (integer, default: 0)
  - `status` (string, optional: `UPLOADED`, `PREPROCESSING`, `INFERENCE`, `VALIDATING`, `READY_FOR_REVIEW`, `VERIFIED`, `REJECTED`, `FAILED`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 1,
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalFilename": "khatauni_sample_plot_101.jpg",
      "mimeType": "image/jpeg",
      "fileSizeBytes": 2451920,
      "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "s3Key": "raw/1760527800000_a1b2c3d4.jpg",
      "preprocessedS3Key": "preprocessed/550e8400-e29b-41d4-a716-446655440000_clean.jpg",
      "status": "READY_FOR_REVIEW",
      "createdAt": "2026-10-15T12:10:00.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/documents/:id`
- **Description**: Returns full document record including associated land record titles, along with presigned S3 download URLs for both raw and preprocessed images.
- **Authentication**: Bearer JWT
- **Parameters**: `id` (path, required) - Document UUID
- **Response `200 OK`**:
```json
{
  "success": true,
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "khatauni_sample_plot_101.jpg",
    "mimeType": "image/jpeg",
    "fileSizeBytes": 2451920,
    "status": "READY_FOR_REVIEW",
    "downloadUrl": "http://localhost:9000/bhumisetu-documents/raw/1760527800000_a1b2c3d4.jpg?X-Amz-Signature=...",
    "preprocessedUrl": "http://localhost:9000/bhumisetu-documents/preprocessed/550e8400..._clean.jpg?X-Amz-Signature=...",
    "landRecords": [
      {
        "id": "660f9511-f30c-52e5-b827-557766551111",
        "surveyNumber": "101/A",
        "reviewStatus": "PENDING_REVIEW",
        "reviewPriorityScore": 0.8500
      }
    ]
  }
}
```

---

### 5.5 Land Records Directory & Search (`/api/v1/records`)

#### `GET /api/v1/records`
- **Description**: Searches normalized land records by survey number, ULPIN, or village name. Supports filtering by village LGD and review status.
- **Authentication**: Bearer JWT
- **Query Parameters**:
  - `query` (string, optional: matches survey number, ULPIN, or village name)
  - `villageLgd` (string, optional)
  - `status` (string, optional: `PENDING_REVIEW`, `IN_REVIEW`, `VERIFIED`, `REJECTED`)
  - `limit` (integer, default: 20)
  - `offset` (integer, default: 0)
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 1,
  "records": [
    {
      "id": "660f9511-f30c-52e5-b827-557766551111",
      "surveyNumber": "101/A",
      "villageName": "Bakshi Ka Talab",
      "villageLgd": "140012",
      "ulpin": "268480940012A3",
      "rawArea": "2.5000",
      "rawUnit": "Pucca Bigha",
      "normalizedAreaHectares": "0.632321",
      "owners": [
        { "name": "Ram Prasad", "sharePercent": 50.0 },
        { "name": "Shyam Prasad", "sharePercent": 50.0 }
      ],
      "reviewStatus": "PENDING_REVIEW",
      "reviewPriorityScore": "0.7850",
      "createdAt": "2026-10-15T12:10:30.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/records/:id`
- **Description**: Returns complete title details for a single land record, including associated document keys, all extracted fields with pixel bounding boxes, PostGIS parcel geometries, and sequential audit log hashes.
- **Authentication**: Bearer JWT
- **Parameters**: `id` (path, required) - Record UUID
- **Response `200 OK`**:
```json
{
  "success": true,
  "record": {
    "id": "660f9511-f30c-52e5-b827-557766551111",
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "stateLgd": "09",
    "districtLgd": "140",
    "villageLgd": "140012",
    "villageName": "Bakshi Ka Talab",
    "surveyNumber": "101/A",
    "subdivisionNumber": "1",
    "ulpin": "268480940012A3",
    "rawArea": "2.5000",
    "rawUnit": "Pucca Bigha",
    "normalizedAreaSqm": "6323.2132",
    "normalizedAreaHectares": "0.632321",
    "landClassification": "Agricultural",
    "owners": [
      { "name": "Ram Prasad", "sharePercent": 50.0 },
      { "name": "Shyam Prasad", "sharePercent": 50.0 }
    ],
    "overallConfidence": "0.8920",
    "reviewPriorityScore": "0.2150",
    "reviewStatus": "PENDING_REVIEW",
    "document": {
      "originalFilename": "khatauni_sample_plot_101.jpg",
      "s3Key": "raw/1760527800000_a1b2c3d4.jpg",
      "preprocessedS3Key": "preprocessed/550e8400..._clean.jpg"
    },
    "fieldExtractions": [
      {
        "id": "880a1122-a41e-63f6-c938-668877662222",
        "fieldName": "survey_number",
        "aiExtractedValue": "101/A",
        "aiConfidence": "0.9400",
        "boundingBox": [120, 45, 145, 120],
        "ruleValidationStatus": "PASS",
        "status": "UNVERIFIED"
      }
    ],
    "parcelGeometries": [],
    "auditLogs": [
      {
        "sequenceNumber": 1,
        "action": "RECORD_DIGITIZED_BY_AI",
        "actorRole": "SYSTEM_AI",
        "prevHash": "0000000000000000000000000000000000000000000000000000000000000000",
        "currHash": "4e1a6b0c95353c7c251d18227e7d6928e3b328a6fcf79ffb4a68297eef98c92a",
        "delta": { "surveyNumber": "101/A" },
        "timestamp": "2026-10-15T12:10:35.000Z"
      }
    ]
  }
}
```

---

### 5.6 Human-in-the-Loop Review Queue (`/api/v1/review`)

#### `GET /api/v1/review/queue`
- **Description**: Returns land records awaiting human verification. Enforces sorting by `reviewPriorityScore DESC` (highest conflict/risk records at the top).
- **Authentication**: Bearer JWT (`PATWARI`, `TEHSILDAR`, or `ADMIN`)
- **Query Parameters**:
  - `villageLgd` (string, optional)
  - `limit` (integer, default: 20)
  - `offset` (integer, default: 0)
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 1,
  "queue": [
    {
      "id": "660f9511-f30c-52e5-b827-557766551111",
      "surveyNumber": "101/A",
      "reviewPriorityScore": "0.8500",
      "reviewStatus": "PENDING_REVIEW",
      "document": {
        "originalFilename": "khatauni_sample_plot_101.jpg"
      }
    }
  ]
}
```

---

#### `POST /api/v1/review/:recordId/lock`
- **Description**: Acquires an optimistic 15-minute lease on a record. Prevents concurrent edits by different revenue officers.
- **Authentication**: Bearer JWT (`PATWARI`, `TEHSILDAR`, or `ADMIN`)
- **Parameters**: `recordId` (path, required)
- **Response `200 OK`**:
```json
{
  "success": true,
  "recordId": "660f9511-f30c-52e5-b827-557766551111",
  "lockedBy": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
  "lockedAt": "2026-10-15T12:15:00.000Z"
}
```
- **Error `409 Conflict`**: Record is currently locked by another officer.

---

#### `POST /api/v1/review/:recordId/unlock`
- **Description**: Releases an acquired lock, returning the record to `PENDING_REVIEW`.
- **Authentication**: Bearer JWT (`PATWARI`, `TEHSILDAR`, or `ADMIN`)
- **Parameters**: `recordId` (path, required)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Review lock released"
}
```

---

#### `POST /api/v1/review/:recordId/submit`
- **Description**: Records officer verification decisions in a single database transaction. Updates field statuses, recalculates normalized area if modified, updates title review status to `VERIFIED` or `REJECTED`, and appends an immutable block to the audit ledger.
- **Authentication**: Bearer JWT (`PATWARI`, `TEHSILDAR`, or `ADMIN`)
- **Parameters**: `recordId` (path, required)
- **Request Body**:
```json
{
  "finalStatus": "VERIFIED",
  "notes": "Verified survey number and corrected owner name against Tehsil physical registry.",
  "fieldDecisions": [
    {
      "fieldId": "880a1122-a41e-63f6-c938-668877662222",
      "status": "CORRECTED",
      "verifiedValue": "101/A-1",
      "reason": "Subdivision mark missing in OCR"
    }
  ],
  "manualArea": {
    "rawValue": 2.5,
    "rawUnit": "Pucca Bigha"
  }
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Review decision recorded and digitally signed",
  "record": {
    "id": "660f9511-f30c-52e5-b827-557766551111",
    "reviewStatus": "VERIFIED",
    "verifiedById": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
    "verifiedAt": "2026-10-15T12:20:00.000Z"
  },
  "auditBlock": {
    "id": "990b2233-b52f-74a7-d049-779988773333",
    "sequenceNumber": 2,
    "prevHash": "4e1a6b0c95353c7c251d18227e7d6928e3b328a6fcf79ffb4a68297eef98c92a",
    "currHash": "8f3d91c0e2b4512984a9c689127e4b9012cd34ef56ab78901234567890abcdef",
    "timestamp": "2026-10-15T12:20:00.000Z"
  }
}
```

---

### 5.7 GIS & Spatial Cadastral Operations (`/api/v1/gis`)

#### `POST /api/v1/gis/analyze-polygon`
- **Description**: Validates a GeoJSON polygon feature using Turf.js. Calculates geodesic area in $m^2$ and $ha$, detects self-intersections (kinks), and computes the centroid coordinates and bounding box.
- **Authentication**: Bearer JWT
- **Request Body**:
```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [80.9400, 26.8400],
        [80.9410, 26.8400],
        [80.9410, 26.8409],
        [80.9400, 26.8409],
        [80.9400, 26.8400]
      ]
    ]
  }
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "analysis": {
    "isValid": true,
    "kinkCount": 0,
    "calculatedAreaSqm": 9936.85,
    "calculatedAreaHectares": 0.993685,
    "centroid": {
      "latitude": 26.84045,
      "longitude": 80.9405
    },
    "bbox": [80.9400, 26.8400, 80.9410, 26.8409]
  }
}
```

---

#### `POST /api/v1/gis/check-overlap`
- **Description**: Compares two cadastral parcel polygons to identify boundary encroachments or overlapping deeds.
- **Authentication**: Bearer JWT
- **Request Body**:
```json
{
  "poly1": {
    "type": "Polygon",
    "coordinates": [[[80.9400, 26.8400], [80.9410, 26.8400], [80.9410, 26.8410], [80.9400, 26.8410], [80.9400, 26.8400]]]
  },
  "poly2": {
    "type": "Polygon",
    "coordinates": [[[80.9405, 26.8405], [80.9415, 26.8405], [80.9415, 26.8415], [80.9405, 26.8415], [80.9405, 26.8405]]]
  }
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "doesOverlap": true,
  "intersectionAreaSqm": 2484.21,
  "hasEncroachment": true
}
```

---

#### `POST /api/v1/gis/parcel/:recordId`
- **Description**: Attaches a verified spatial parcel geometry to a land record and persists it in PostGIS with spatial SRID 4326.
- **Authentication**: Bearer JWT
- **Parameters**: `recordId` (path, required)
- **Request Body**:
```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[80.9400, 26.8400], [80.9410, 26.8400], [80.9410, 26.8409], [80.9400, 26.8409], [80.9400, 26.8400]]]
  },
  "properties": {
    "landUse": "Agricultural",
    "soilClassification": "Alluvial"
  }
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "parcel": {
    "id": "110c3344-c63f-85b8-e150-880099884444",
    "record_id": "660f9511-f30c-52e5-b827-557766551111",
    "calculated_area_sqm": 9936.85,
    "is_valid_geometry": true
  }
}
```

---

#### `GET /api/v1/gis/village/:villageLgd`
- **Description**: Returns all cadastral parcel geometries in a village formatted as a standard GeoJSON `FeatureCollection` for direct rendering in Leaflet, MapLibre GL, or OpenLayers.
- **Authentication**: Bearer JWT
- **Parameters**: `villageLgd` (path, required) - 6-digit village LGD code
- **Response `200 OK`**:
```json
{
  "success": true,
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[80.9400, 26.8400], [80.9410, 26.8400], [80.9410, 26.8409], [80.9400, 26.8409], [80.9400, 26.8400]]]]
      },
      "properties": {
        "recordId": "660f9511-f30c-52e5-b827-557766551111",
        "surveyNumber": "101/A",
        "owners": [{ "name": "Ram Prasad", "sharePercent": 50.0 }],
        "areaSqm": "6323.2132",
        "reviewStatus": "VERIFIED"
      }
    }
  ]
}
```

---

### 5.8 Tamper-Evident Audit Ledger (`/api/v1/audit`)

#### `GET /api/v1/audit/record/:recordId`
- **Description**: Retrieves the complete sequence of cryptographic audit blocks for a specific land record, ordered chronologically.
- **Authentication**: Bearer JWT
- **Parameters**: `recordId` (path, required)
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 2,
  "auditLogs": [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "sequence_number": "1",
      "record_id": "660f9511-f30c-52e5-b827-557766551111",
      "action": "RECORD_DIGITIZED_BY_AI",
      "actor_id": null,
      "actor_role": "SYSTEM_AI",
      "prev_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "curr_hash": "4e1a6b0c95353c7c251d18227e7d6928e3b328a6fcf79ffb4a68297eef98c92a",
      "delta": { "surveyNumber": "101/A" },
      "timestamp": "2026-10-15T12:10:35.000Z",
      "actor_name": null,
      "actor_email": null
    },
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000002",
      "sequence_number": "2",
      "record_id": "660f9511-f30c-52e5-b827-557766551111",
      "action": "HUMAN_VERIFIED_AND_APPROVED",
      "actor_id": "e98e2193-27ab-4348-9366-eb5e6e3ad5d1",
      "actor_role": "PATWARI",
      "prev_hash": "4e1a6b0c95353c7c251d18227e7d6928e3b328a6fcf79ffb4a68297eef98c92a",
      "curr_hash": "8f3d91c0e2b4512984a9c689127e4b9012cd34ef56ab78901234567890abcdef",
      "delta": { "finalStatus": "VERIFIED" },
      "timestamp": "2026-10-15T12:20:00.000Z",
      "actor_name": "Ramesh Kumar Sharma",
      "actor_email": "patwari@bhumisetu.gov.in"
    }
  ]
}
```

---

#### `GET /api/v1/audit/verify-chain`
- **Description**: Verifies the entire ledger by iteratively computing SHA-256 signatures across all recorded blocks. Detects if any historical title, owner, or status has been tampered with directly in the database.
- **Authentication**: Bearer JWT (`ADMIN` or `TEHSILDAR` role required)
- **Response `200 OK` (Chain Valid & Intact)**:
```json
{
  "success": true,
  "totalBlocks": 142,
  "isTamperFree": true,
  "verifiedBlockCount": 142
}
```
- **Response `200 OK` (Tampering Detected)**:
```json
{
  "success": true,
  "totalBlocks": 142,
  "isTamperFree": false,
  "invalidSequence": 47,
  "reason": "Hash mismatch at sequence 47. Block payload has been tampered with!"
}
```

---

## 6. Client-Side Edge Preprocessor (Web/Mobile SDK)

Located at [`backend/src/utils/clientEdgePreprocessor.js`](file:///c:/Users/hndan/OneDrive/Desktop/SIH/backend/src/utils/clientEdgePreprocessor.js), this client SDK enables web and mobile clients to eliminate backend CPU/RAM bottlenecks.

### Key Capabilities
1. **Client SHA-256 Hashing**: Uses browser `crypto.subtle.digest` to calculate document signatures before transmission.
2. **Dynamic Canvas Optimization**: Downscales 600+ DPI scans to optimal 300 DPI (max 2400px) and converts 24-bit color scans to 8-bit grayscale WebP. Reduces a $40\text{ MB}$ raw scan to $\sim 1.5\text{ MB}$ without compromising OCR accuracy.
3. **Automated Direct S3 Pipeline**: Manages the three-way negotiation between client, API gateway, and S3.

### Integration Example in React / Vue / Vanilla JS
```javascript
import { uploadDocumentDirectToS3 } from './utils/clientEdgePreprocessor.js';

async function handleFileUpload(file) {
  try {
    const result = await uploadDocumentDirectToS3({
      file,
      apiBaseUrl: 'http://localhost:5000/api/v1',
      authToken: 'eyJhbGciOiJIUzI1Ni...',
      stateLgd: '09', // Uttar Pradesh
      districtLgd: '140', // Lucknow
      onProgress: (status) => {
        console.log(`[UPLOAD_PROGRESS] ${status.stage}: ${status.percent}%`);
      },
    });

    if (result.isDuplicate) {
      alert(`Document already exists in system with ID: ${result.document.id}`);
    } else {
      console.log(`Document processing enqueued! Document ID: ${result.documentId}`);
      console.log(`Compressed from ${result.optimizationStats.originalSizeBytes} to ${result.optimizationStats.optimizedSizeBytes} bytes`);
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
}
```

---

## 7. Environment Configuration & Deployment Topology

### 7.1 Environment Variables Reference (`.env`)

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | HTTP port for the Express application server |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`) |
| `DATABASE_URL` | **Yes** | `postgresql://bhumisetu_user:bhumisetu_password@localhost:5432/bhumisetu_db` | PostgreSQL connection string |
| `REDIS_URL` | **Yes** | `redis://localhost:6379` | Redis connection URL for BullMQ and session storage |
| `HUGGINGFACE_API_KEY` | No | `""` | Hugging Face Hub User Access Token |
| `HUGGINGFACE_ENDPOINT_URL` | No | `https://api-inference.huggingface.co/models/microsoft/trocr-base-stage1` | Dedicated Inference Endpoint or Model Hub URL |
| `USE_HF_MOCK` | No | `true` | When `true`, uses deterministic mock OCR inference for offline testing |
| `S3_ENDPOINT` | No | `http://localhost:9000` | MinIO or AWS S3 endpoint URL |
| `S3_REGION` | No | `us-east-1` | AWS S3 region |
| `S3_ACCESS_KEY` | No | `minioadmin` | S3 / MinIO access key |
| `S3_SECRET_KEY` | No | `minioadmin` | S3 / MinIO secret key |
| `S3_BUCKET` | No | `bhumisetu-documents` | Destination S3 bucket name |
| `S3_FORCE_PATH_STYLE` | No | `true` | Required for MinIO / local S3 emulators |
| `JWT_SECRET` | **Yes** | `bhumisetu-production-secret-key...` | Cryptographic secret for signing JWT access tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Lifetime of JWT access token |
| `JWT_REFRESH_EXPIRES_IN`| No | `7d` | Lifetime of refresh token |
| `SESSION_TTL_SECONDS` | No | `604800` | Redis session expiration TTL ($7\text{ days}$) |

### 7.2 Docker Compose Services (`docker-compose.yml`)

The repository includes a ready-to-deploy Docker Compose stack:
```bash
cd backend
docker-compose up -d
```
1. **`postgres`**: Image `postgis/postgis:16-3.4-alpine` on port `5432`. Automatically executes initial DDL schema and LGD seeds.
2. **`redis`**: Image `redis:7-alpine` on port `6379`. Provides in-memory queues and token stores.
3. **`minio`**: Image `minio/minio:RELEASE.2024-01-18T22-51-28Z` on port `9000` (API) and `9001` (Web Console).

---

## 8. Automated Verification & Test Suite

The test suite covers unit logic, security boundaries, and integration flows across all 26 endpoints.

### Executing Tests
```bash
cd backend
npm test
```

### Test Suite Structure
- **Integration API Suite** ([`backend/tests/integration/api.test.js`](file:///c:/Users/hndan/OneDrive/Desktop/SIH/backend/tests/integration/api.test.js)):
  - Health check verification
  - Authentication, password validation, token rotation, and single/all session revocation
  - RBAC enforcement (`ADMIN`-only registration, `PATWARI`/`TEHSILDAR`-only review queue)
  - Document ingestion routes and deduplication checks
  - GIS polygon analysis and overlap detection
  - Tamper-evident audit chain access permissions
- **Cryptographic Audit Ledger Suite** ([`backend/tests/integration/auditLedger.test.js`](file:///c:/Users/hndan/OneDrive/Desktop/SIH/backend/tests/integration/auditLedger.test.js)):
  - Deterministic hashing across identical payloads
  - Multi-block chain verification from Genesis hash
  - Fraudulent tampering detection when database payloads are forged post-signature
- **Spatial GIS Topology Suite** ([`backend/tests/integration/gis.test.js`](file:///c:/Users/hndan/OneDrive/Desktop/SIH/backend/tests/integration/gis.test.js)):
  - Geodesic polygon area computation
  - Self-intersection (bowtie/kink) detection
  - Boundary encroachment detection using Turf.js
- **Unit Logic Suites**:
  - `confidenceScorer.test.js`: Composite scoring and explainable review priority calculations
  - `rulesEngine.test.js`: Ownership share 100% summation and survey number formatting
  - `unitConverter.test.js`: Multi-state LGD customary unit conversions (Pucca vs. Kuccha Bigha, Guntha, Cent, Kanal)
  - `session.test.js`: Redis sliding session management and token rotation
