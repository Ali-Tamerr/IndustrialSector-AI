-- ============================================================================
-- Industrial AI System: Predictive Maintenance (PdM) & Supply Chain Schema
-- Optimized for PostgreSQL
-- ============================================================================

-- Enable UUID extension if needed (good practice for distributed microservices)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to ensure clean initialization
DROP TABLE IF EXISTS supplier_edges CASCADE;
DROP TABLE IF EXISTS supplier_graph CASCADE;
DROP TABLE IF EXISTS maintenance_orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sensor_telemetry CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS machine_reports CASCADE;
DROP TABLE IF EXISTS admin_accounts CASCADE;

-- 1. MACHINES TABLE
-- Stores metadata and critical operating thresholds for each piece of equipment.
CREATE TABLE machines (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Operational', -- e.g., 'Operational', 'Degraded', 'Critical', 'Maintenance'
    critical_thresholds JSONB NOT NULL,                 -- e.g., {"temperature": 90.0, "vibration": 8.0, ...}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize JSONB search queries for critical thresholds (GIN index)
CREATE INDEX idx_machines_critical_thresholds ON machines USING gin (critical_thresholds);

-- Optimize status lookups for fleet dashboard filtering
CREATE INDEX idx_machines_status ON machines (status);


-- 2. SENSOR TELEMETRY TABLE
-- Time-series telemetry tracking real-time sensor measurements from active machinery.
CREATE TABLE sensor_telemetry (
    id BIGSERIAL PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,  -- in Celsius
    vibration DOUBLE PRECISION NOT NULL,    -- in mm/s (velocity RMS)
    pressure DOUBLE PRECISION NOT NULL,     -- in Bar
    current DOUBLE PRECISION NOT NULL,      -- in Amperes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL TIME-SERIES OPTIMIZATION:
-- Composite index for hyper-fast querying of the latest telemetry points for any machine.
-- This prevents table scans when polling real-time dashboards or executing PdM alert rules.
CREATE INDEX idx_sensor_telemetry_machine_time ON sensor_telemetry (machine_id, timestamp DESC);

-- B-tree index for global time-range scans (e.g. daily/weekly aggregation reports)
CREATE INDEX idx_sensor_telemetry_timestamp ON sensor_telemetry (timestamp DESC);


-- 3. INVENTORY TABLE
-- Tracks spare parts levels, unit costs, and warehouse locations.
CREATE TABLE inventory (
    part_id VARCHAR(50) PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    stock_level INT NOT NULL CHECK (stock_level >= 0),
    reorder_point INT NOT NULL CHECK (reorder_point >= 0),
    cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
    location VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize stock replenishment audits (finding parts that are below reorder thresholds)
CREATE INDEX idx_inventory_stock_reorder ON inventory (stock_level, reorder_point);


-- 4. MAINTENANCE ORDERS TABLE
-- Records maintenance tickets, root causes, priorities, and assigned technicians.
CREATE TABLE maintenance_orders (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(50) NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    priority VARCHAR(20) NOT NULL,                  -- e.g., 'Low', 'Medium', 'High', 'Critical'
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',   -- Must be Pending, Approved, Dispatched, Pending_Sourcing, Dispatched_Sourcing_Active
    root_cause TEXT,
    assigned_technician VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_maintenance_status CHECK (status IN ('Pending', 'Approved', 'Dispatched', 'Pending_Sourcing', 'Dispatched_Sourcing_Active'))
);

-- Optimize active ticket tracking for dispatching and scheduling
CREATE INDEX idx_maintenance_orders_status_priority ON maintenance_orders (status, priority);

-- Optimize lookups by machine for historical audit queries
CREATE INDEX idx_maintenance_orders_machine_id ON maintenance_orders (machine_id);


-- 5. SUPPLIER GRAPH NODE TABLE
-- Stores nodes in the supply chain graph (Suppliers, Materials, and Parts).
CREATE TABLE supplier_graph (
    node_id VARCHAR(50) PRIMARY KEY,
    node_name VARCHAR(100) NOT NULL,
    node_type VARCHAR(20) NOT NULL CHECK (node_type IN ('Supplier', 'Material', 'Part')),
    risk_rating DOUBLE PRECISION CHECK (risk_rating >= 0.0 AND risk_rating <= 1.0), -- 0.0 (low) to 1.0 (high)
    contact_email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize graph lookups
CREATE INDEX idx_supplier_graph_type ON supplier_graph (node_type);
CREATE INDEX idx_supplier_graph_name ON supplier_graph (node_name);


-- 6. SUPPLIER EDGES TABLE
-- Stores directed edges linking suppliers to materials/parts, or raw materials to finished parts.
CREATE TABLE supplier_edges (
    edge_id SERIAL PRIMARY KEY,
    from_node VARCHAR(50) NOT NULL REFERENCES supplier_graph(node_id) ON DELETE CASCADE,
    to_node VARCHAR(50) NOT NULL REFERENCES supplier_graph(node_id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL, -- e.g., 'SUPPLIES', 'USED_IN'
    transit_time_days INT NOT NULL CHECK (transit_time_days >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize edge traversal queries
CREATE INDEX idx_supplier_edges_from_to ON supplier_edges (from_node, to_node);


-- 7. ADMIN ACCOUNTS TABLE
-- Stores administrative account credentials and matching link IDs.
CREATE TABLE admin_accounts (
    id VARCHAR(8) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- Seed default mockup admin account
INSERT INTO admin_accounts (id, email, password)
VALUES ('ADM-8A9F', 'admin@industrial.ai', 'password123')
ON CONFLICT (email) DO NOTHING;


-- 8. MACHINE REPORTS TABLE
-- Stores reports submitted by devices connected to the control tower.
CREATE TABLE machine_reports (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(8) REFERENCES admin_accounts(id) ON DELETE CASCADE,
    machine_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    temperature DOUBLE PRECISION,
    vibration DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    current DOUBLE PRECISION,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved BOOLEAN DEFAULT FALSE
);

