import { NextResponse } from "next/server";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

// Manually load the root .env file to get DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/(^['"]|['"]$)/g, "");
          process.env[key.trim()] = value;
        }
      });
      databaseUrl = process.env.DATABASE_URL;
    }
  } catch (err) {
    console.error("Failed to read root .env file:", err);
  }
}

const cleanDatabaseUrl = databaseUrl ? databaseUrl.split("?")[0] : databaseUrl;
const pool = new Pool({
  connectionString: cleanDatabaseUrl,
  ssl: cleanDatabaseUrl && cleanDatabaseUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
});

export async function POST(req) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  let client;
  try {
    client = await pool.connect();
    const body = await req.json();
    const { type, templateId, customMachines } = body;

    // A. Drop or clear the database tables in correct relational order
    await client.query("BEGIN;");
    await client.query("TRUNCATE TABLE supplier_edges, supplier_graph, maintenance_orders, sensor_telemetry, machines, inventory RESTART IDENTITY CASCADE;");

    let machinesToSeed = [];
    let inventoryToSeed = [];
    let supplierNodesToSeed = [];
    let supplierEdgesToSeed = [];
    let anomalyMachineId = null;

    if (type === "template") {
      if (templateId === "petrochemical") {
        // Preset Petrochemical Template
        machinesToSeed = [
          {
            id: "MCH-201",
            name: "Crude Transfer Pump Alpha",
            location: "Bay 5 - Hydrocracking",
            status: "Operational",
            thresholds: { temperature: 95.0, vibration: 8.5, pressure: 12.0, current: 40.0 }
          },
          {
            id: "MCH-202",
            name: "Gas Combustion Turbine Beta",
            location: "Bay 9 - Power Generation",
            status: "Operational",
            thresholds: { temperature: 110.0, vibration: 12.0, pressure: 16.5, current: 85.0 }
          },
          {
            id: "MCH-203",
            name: "Heavy Heat Exchanger Fan",
            location: "Bay 2 - Cooling Complex",
            status: "Operational",
            thresholds: { temperature: 85.0, vibration: 9.0, pressure: 4.5, current: 18.0 }
          }
        ];

        inventoryToSeed = [
          ["PART-201", "Extreme Heat Gas Turbine Valve", 2, 5, 2450.00, "Warehouse C - Aisle 1"], // Needs reorder
          ["PART-202", "Fluorosilicone High-Pressure Gasket", 25, 10, 85.00, "Warehouse A - Aisle 9"],
          ["PART-203", "Petrochemical Centrifugal Impeller", 1, 3, 1450.00, "Warehouse C - Aisle 3"], // Needs reorder
          ["PART-204", "Exchanger Fan 3-Phase Rotor Winding", 8, 2, 720.00, "Warehouse B - Aisle 7"]
        ];

        supplierNodesToSeed = [
          ["SUP-201", "GE Power Systems Logistics", "Supplier", 0.08, "logistics@gepower.com"],
          ["SUP-202", "Chevron Seals Houston", "Supplier", 0.04, "houston.sales@chevronseals.com"],
          ["SUP-203", "Sulzer Gothenburg", "Supplier", 0.12, "procurement@sulzer.se"],
          ["SUP-204", "VarnishTech Graz", "Supplier", 0.20, "sales@varnishwtech.at"],
          ["PART-201", "Extreme Heat Gas Turbine Valve", "Part", null, null],
          ["PART-202", "Fluorosilicone High-Pressure Gasket", "Part", null, null],
          ["PART-203", "Petrochemical Centrifugal Impeller", "Part", null, null],
          ["PART-204", "Exchanger Fan 3-Phase Rotor Winding", "Part", null, null],
          ["MAT-201", "Superalloy Nickel Base Bar", "Material", null, null],
          ["MAT-202", "NBR Rubber Compound", "Material", null, null]
        ];

        supplierEdgesToSeed = [
          ["SUP-201", "PART-201", "SUPPLIES", 4, 3200.00],
          ["SUP-202", "PART-202", "SUPPLIES", 1, 95.00],
          ["SUP-203", "PART-203", "SUPPLIES", 12, 1750.00],
          ["SUP-204", "PART-204", "SUPPLIES", 6, 850.00],
          ["SUP-201", "PART-203", "SUPPLIES", 26, 1250.00], // Alternate with bottleneck (26 days)
          ["SUP-203", "MAT-201", "SUPPLIES", 4, 600.00],
          ["MAT-201", "PART-201", "USED_IN", 3, 900.00],
          ["SUP-202", "MAT-202", "SUPPLIES", 2, 40.00],
          ["MAT-202", "PART-202", "USED_IN", 1, 20.00]
        ];

        anomalyMachineId = "MCH-203"; // Exchanger fan is critical on startup!
      } else if (templateId === "automotive") {
        // Preset Automotive Template
        machinesToSeed = [
          {
            id: "MCH-301",
            name: "6-Axis Welder Robot Joint",
            location: "Bay 1 - Welding Cell",
            status: "Operational",
            thresholds: { temperature: 80.0, vibration: 15.0, pressure: 5.0, current: 30.0 }
          },
          {
            id: "MCH-302",
            name: "Main Assembly Conveyor Drive",
            location: "Bay 6 - Painting Line",
            status: "Operational",
            thresholds: { temperature: 75.0, vibration: 8.0, pressure: 6.0, current: 22.0 }
          },
          {
            id: "MCH-303",
            name: "Fleet Pneumatic Compressor Main",
            location: "Bay 14 - Assembly Main",
            status: "Operational",
            thresholds: { temperature: 90.0, vibration: 9.5, pressure: 9.0, current: 50.0 }
          }
        ];

        inventoryToSeed = [
          ["PART-301", "Harmonic Welder Gear Box Drive", 0, 2, 3850.00, "Warehouse D - Aisle 3"], // Needs reorder
          ["PART-302", "3-Phase Drive Motor Brushless", 5, 2, 950.00, "Warehouse B - Aisle 1"],
          ["PART-303", "Pneumatic Double Solenoid Valve", 2, 8, 140.00, "Warehouse A - Aisle 2"], // Needs reorder
          ["PART-304", "Welder Copper Cable Core", 12, 5, 220.00, "Warehouse B - Aisle 9"]
        ];

        supplierNodesToSeed = [
          ["SUP-301", "Yaskawa Motoman Logistics", "Supplier", 0.05, "logistics@yaskawa.com"],
          ["SUP-302", "SMC Pneumatics Cleveland", "Supplier", 0.03, "orders@smcpneumatics.com"],
          ["SUP-303", "Siemens Munich", "Supplier", 0.10, "logistics@siemens.de"],
          ["SUP-304", "CopperWorks Ohio", "Supplier", 0.10, "orders@copperworksohio.com"],
          ["PART-301", "Harmonic Welder Gear Box Drive", "Part", null, null],
          ["PART-302", "3-Phase Drive Motor Brushless", "Part", null, null],
          ["PART-303", "Pneumatic Double Solenoid Valve", "Part", null, null],
          ["PART-304", "Welder Copper Cable Core", "Part", null, null],
          ["MAT-301", "High-Grade Copper Core", "Material", null, null],
          ["MAT-302", "Harmonic Steel Castings", "Material", null, null]
        ];

        supplierEdgesToSeed = [
          ["SUP-301", "PART-301", "SUPPLIES", 7, 4200.00],
          ["SUP-302", "PART-303", "SUPPLIES", 2, 120.00],
          ["SUP-303", "PART-302", "SUPPLIES", 5, 1100.00],
          ["SUP-304", "PART-304", "SUPPLIES", 3, 195.00],
          ["SUP-303", "PART-301", "SUPPLIES", 29, 3900.00], // Alternated long maritime bottleneck
          ["SUP-304", "MAT-301", "SUPPLIES", 3, 90.00],
          ["MAT-301", "PART-304", "USED_IN", 1, 100.00],
          ["SUP-301", "MAT-302", "SUPPLIES", 4, 800.00],
          ["MAT-302", "PART-301", "USED_IN", 3, 1200.00]
        ];

        anomalyMachineId = "MCH-301"; // Welding joint anomaly on startup!
      } else {
        // Default Steel Mill Template (matches init_db.py)
        machinesToSeed = [
          {
            id: "MCH-001",
            name: "Rotary Gear Pump A",
            location: "Bay 3 - Fluids Processing",
            status: "Operational",
            thresholds: { temperature: 90.0, vibration: 8.0, pressure: 6.5, current: 15.0 }
          },
          {
            id: "MCH-002",
            name: "High-Speed Industrial Fan B",
            location: "Bay 7 - Ventilation and Exhaust",
            status: "Operational",
            thresholds: { temperature: 80.0, vibration: 10.0, pressure: 3.0, current: 20.0 }
          },
          {
            id: "MCH-003",
            name: "Heavy-Duty Compressor C",
            location: "Bay 12 - Pneumatics & Air Power",
            status: "Operational",
            thresholds: { temperature: 95.0, vibration: 7.5, pressure: 8.5, current: 25.0 }
          }
        ];

        inventoryToSeed = [
          ["PART-001", "Heavy-Duty Bearing Assembly", 15, 5, 120.50, "Warehouse A - Aisle 4"],
          ["PART-002", "High-Pressure Hydraulic Seal", 3, 10, 45.00, "Warehouse A - Aisle 6"], // Needs reorder
          ["PART-003", "Centrifugal Pump Impeller", 8, 2, 350.00, "Warehouse B - Aisle 2"],
          ["PART-004", "3-Phase Electric Motor Winding", 1, 3, 850.00, "Warehouse B - Aisle 5"] // Needs reorder
        ];

        supplierNodesToSeed = [
          ["SUP-001", "Siemens Shanghai", "Supplier", 0.70, "procurement@siemens.cn"],
          ["SUP-002", "SKF Munich", "Supplier", 0.15, "logistics@skf.de"],
          ["SUP-003", "CopperWorks Ohio", "Supplier", 0.10, "orders@copperworksohio.com"],
          ["SUP-004", "VarnishTech Graz", "Supplier", 0.20, "sales@varnishtech.at"],
          ["SUP-005", "Parker Hannifin Cleveland", "Supplier", 0.05, "orders@parkerhannifin.com"],
          ["SUP-006", "Sulzer Gothenburg", "Supplier", 0.12, "procurement@sulzer.se"],
          ["PART-001", "Heavy-Duty Bearing Assembly", "Part", null, null],
          ["PART-002", "High-Pressure Hydraulic Seal", "Part", null, null],
          ["PART-003", "Centrifugal Pump Impeller", "Part", null, null],
          ["PART-004", "3-Phase Electric Motor Winding", "Part", null, null],
          ["MAT-001", "High-Conductivity Copper Wire", "Material", null, null],
          ["MAT-002", "High-Temperature Insulating Varnish", "Material", null, null],
          ["MAT-003", "NBR Rubber Compound", "Material", null, null],
          ["MAT-004", "Stainless Steel Casting", "Material", null, null]
        ];

        supplierEdgesToSeed = [
          ["SUP-002", "PART-001", "SUPPLIES", 5, 450.00],
          ["SUP-005", "PART-002", "SUPPLIES", 2, 35.00],
          ["SUP-006", "PART-003", "SUPPLIES", 14, 250.00],
          ["SUP-001", "PART-004", "SUPPLIES", 28, 850.00],
          ["SUP-002", "PART-004", "SUPPLIES", 5, 1200.00],
          ["SUP-003", "MAT-001", "SUPPLIES", 3, 300.00],
          ["MAT-001", "PART-004", "USED_IN", 3, 400.00],
          ["SUP-004", "MAT-002", "SUPPLIES", 4, 150.00],
          ["MAT-002", "PART-004", "USED_IN", 2, 600.00],
          ["SUP-003", "MAT-003", "SUPPLIES", 3, 10.00],
          ["MAT-003", "PART-002", "USED_IN", 1, 15.00],
          ["SUP-003", "MAT-004", "SUPPLIES", 5, 80.00],
          ["MAT-004", "PART-003", "USED_IN", 4, 120.00]
        ];

        anomalyMachineId = "MCH-001"; // Pump A critical winding degradation
      }
    } else {
      // Custom Fleet from Scratch
      machinesToSeed = customMachines.map((m, idx) => ({
        id: m.id || `MCH-10${idx + 1}`,
        name: m.name || `Asset ${idx + 1}`,
        location: m.location || `Bay ${idx + 1} Assembly`,
        status: "Operational",
        thresholds: {
          temperature: parseFloat(m.thresholds?.temperature) || 90.0,
          vibration: parseFloat(m.thresholds?.vibration) || 8.0,
          pressure: parseFloat(m.thresholds?.pressure) || 6.5,
          current: parseFloat(m.thresholds?.current) || 15.0
        }
      }));

      // Default inventory setup so RAG and sourcing algorithms have fallback structures
      inventoryToSeed = [
        ["PART-001", "Heavy-Duty Bearing Assembly", 15, 5, 120.50, "Warehouse A - Aisle 4"],
        ["PART-002", "High-Pressure Hydraulic Seal", 3, 10, 45.00, "Warehouse A - Aisle 6"],
        ["PART-003", "Centrifugal Pump Impeller", 8, 2, 350.00, "Warehouse B - Aisle 2"],
        ["PART-004", "3-Phase Electric Motor Winding", 1, 3, 850.00, "Warehouse B - Aisle 5"]
      ];

      supplierNodesToSeed = [
        ["SUP-001", "Siemens Shanghai", "Supplier", 0.70, "procurement@siemens.cn"],
        ["SUP-002", "SKF Munich", "Supplier", 0.15, "logistics@skf.de"],
        ["SUP-003", "CopperWorks Ohio", "Supplier", 0.10, "orders@copperworksohio.com"],
        ["SUP-004", "VarnishTech Graz", "Supplier", 0.20, "sales@varnishwtech.at"],
        ["SUP-005", "Parker Hannifin Cleveland", "Supplier", 0.05, "orders@parkerhannifin.com"],
        ["SUP-006", "Sulzer Gothenburg", "Supplier", 0.12, "procurement@sulzer.se"],
        ["PART-001", "Heavy-Duty Bearing Assembly", "Part", null, null],
        ["PART-002", "High-Pressure Hydraulic Seal", "Part", null, null],
        ["PART-003", "Centrifugal Pump Impeller", "Part", null, null],
        ["PART-004", "3-Phase Electric Motor Winding", "Part", null, null]
      ];

      supplierEdgesToSeed = [
        ["SUP-002", "PART-001", "SUPPLIES", 5, 450.00],
        ["SUP-005", "PART-002", "SUPPLIES", 2, 35.00],
        ["SUP-006", "PART-003", "SUPPLIES", 14, 250.00],
        ["SUP-001", "PART-004", "SUPPLIES", 28, 850.00],
        ["SUP-002", "PART-004", "SUPPLIES", 5, 1200.00]
      ];

      anomalyMachineId = machinesToSeed[0]?.id; // Degrade the first machine manually
    }

    // 1. Seed Machines
    for (const m of machinesToSeed) {
      await client.query(
        `INSERT INTO machines (id, name, location, status, critical_thresholds)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, location = EXCLUDED.location, 
             status = EXCLUDED.status, critical_thresholds = EXCLUDED.critical_thresholds;`,
        [m.id, m.name, m.location, m.status, JSON.stringify(m.thresholds)]
      );
    }

    // 2. Seed Inventory
    for (const inv of inventoryToSeed) {
      await client.query(
        `INSERT INTO inventory (part_id, part_name, stock_level, reorder_point, cost, location)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (part_id) DO UPDATE
         SET part_name = EXCLUDED.part_name, stock_level = EXCLUDED.stock_level,
             reorder_point = EXCLUDED.reorder_point, cost = EXCLUDED.cost, location = EXCLUDED.location;`,
        inv
      );
    }

    // 3. Seed Nodes
    for (const node of supplierNodesToSeed) {
      await client.query(
        `INSERT INTO supplier_graph (node_id, node_name, node_type, risk_rating, contact_email)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (node_id) DO UPDATE
         SET node_name = EXCLUDED.node_name, node_type = EXCLUDED.node_type,
             risk_rating = EXCLUDED.risk_rating, contact_email = EXCLUDED.contact_email;`,
        node
      );
    }

    // 4. Seed Edges
    for (const edge of supplierEdgesToSeed) {
      await client.query(
        `INSERT INTO supplier_edges (from_node, to_node, relationship, transit_time_days, price)
         VALUES ($1, $2, $3, $4, $5);`,
        edge
      );
    }

    // 5. Generate 24 hours of stable baseline telemetry for all machines
    const now = new Date();
    const pointsToGenerate = 15; // Latest 15 points per machine is ample for instant dashboard rendering
    const baselines = {
      "MCH-001": { temp: 55.0, vib: 1.8, pres: 5.2, cur: 8.2 },
      "MCH-002": { temp: 48.0, vib: 2.1, pres: 2.0, cur: 11.0 },
      "MCH-003": { temp: 62.0, vib: 2.4, pres: 7.0, cur: 17.5 },
      "MCH-201": { temp: 65.0, vib: 2.0, pres: 8.2, cur: 22.0 },
      "MCH-202": { temp: 75.0, vib: 3.5, pres: 10.5, cur: 45.0 },
      "MCH-203": { temp: 42.0, vib: 1.5, pres: 2.5, cur: 8.5 },
      "MCH-301": { temp: 45.0, vib: 3.0, pres: 3.2, cur: 12.0 },
      "MCH-302": { temp: 40.0, vib: 1.2, pres: 4.0, cur: 9.8 },
      "MCH-303": { temp: 58.0, vib: 2.0, pres: 6.5, cur: 28.0 },
    };

    for (const m of machinesToSeed) {
      const metrics = baselines[m.id] || { temp: 50.0, vib: 2.0, pres: 5.0, cur: 12.0 };
      for (let i = 0; i < pointsToGenerate; i++) {
        const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (pointsToGenerate - i));
        const temp = metrics.temp + (Math.random() * 2 - 1);
        const vib = metrics.vib + (Math.random() * 0.4 - 0.2);
        const pres = metrics.pres + (Math.random() * 0.2 - 0.1);
        const cur = metrics.cur + (Math.random() * 0.6 - 0.3);

        await client.query(
          `INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [m.id, timestamp.toISOString(), temp, vib, pres, cur]
        );
      }
    }

    // 6. Inject Anomaly/Degradation for one machine to kickstart AI Orchestration alerts!
    if (anomalyMachineId) {
      const activeMachine = machinesToSeed.find(m => m.id === anomalyMachineId);
      if (activeMachine) {
        const thresholds = activeMachine.thresholds;
        
        // Elevate telemetry point to critical threshold levels
        const badTemp = thresholds.temperature * 1.05;
        const badVib = thresholds.vibration * 1.15;
        const badPres = thresholds.pressure * 0.45; // Caveat pressure drop
        const badCur = thresholds.current * 1.35; // Motor strain
        
        const timestamp = new Date();
        await client.query(
          `INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [anomalyMachineId, timestamp.toISOString(), badTemp, badVib, badPres, badCur]
        );

        // Update status in Database
        await client.query(
          `UPDATE machines SET status = 'Critical', updated_at = NOW() WHERE id = $1;`,
          [anomalyMachineId]
        );

        // Create the automated maintenance ticket
        const rootCause = `Automated Predictive Maintenance Alert: Thermal & mechanical degradation thresholds breached on ${activeMachine.name}. ` +
          `Vibration reading of ${badVib.toFixed(2)} mm/s exceeded the limit of ${thresholds.vibration} mm/s. ` +
          `Winding temperature spiked to ${badTemp.toFixed(1)}°C. Automatic RAG parts audit initiated for replacement components. Sourcing active.`;

        await client.query(
          `INSERT INTO maintenance_orders (machine_id, priority, status, root_cause, assigned_technician)
           VALUES ($1, $2, $3, $4, $5);`,
          [anomalyMachineId, 'Critical', 'Pending_Sourcing', rootCause, 'Sarah Jenkins (PdM Lead)']
        );
      }
    }

    await client.query("COMMIT;");
    return NextResponse.json({ success: true, seededCount: machinesToSeed.length });

  } catch (err) {
    if (client) await client.query("ROLLBACK;");
    console.error("[API] Setup configuration failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
