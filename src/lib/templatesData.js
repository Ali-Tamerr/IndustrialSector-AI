export const PETROCHEMICAL_TEMPLATE = {
  machines: [
    {
      id: "MCH-201",
      name: "Crude Transfer Pump Alpha",
      location: "Bay 5 - Hydrocracking",
      status: "Operational",
      critical_thresholds: { temperature: 95.0, vibration: 8.5, pressure: 12.0, current: 40.0, required_part_id: "PART-203" },
      components: [
        { id: "PART-203", name: "Petrochemical Centrifugal Impeller", health: 85 },
        { id: "PART-202", name: "Fluorosilicone High-Pressure Gasket", health: 92 }
      ]
    },
    {
      id: "MCH-202",
      name: "Gas Combustion Turbine Beta",
      location: "Bay 9 - Power Generation",
      status: "Operational",
      critical_thresholds: { temperature: 110.0, vibration: 12.0, pressure: 16.5, current: 85.0, required_part_id: "PART-201" },
      components: [
        { id: "PART-201", name: "Extreme Heat Gas Turbine Valve", health: 78 },
        { id: "PART-202", name: "Fluorosilicone High-Pressure Gasket", health: 88 }
      ]
    },
    {
      id: "MCH-203",
      name: "Heavy Heat Exchanger Fan",
      location: "Bay 2 - Cooling Complex",
      status: "Operational",
      critical_thresholds: { temperature: 85.0, vibration: 9.0, pressure: 4.5, current: 18.0, required_part_id: "PART-204" },
      components: [
        { id: "PART-204", name: "Exchanger Fan 3-Phase Rotor Winding", health: 95 },
        { id: "PART-201", name: "Extreme Heat Gas Turbine Valve", health: 90 }
      ]
    }
  ],
  inventory: [
    { part_id: "PART-201", part_name: "Extreme Heat Gas Turbine Valve", stock_level: 2, reorder_point: 5, cost: 2450.00, location: "Warehouse C - Aisle 1" },
    { part_id: "PART-202", part_name: "Fluorosilicone High-Pressure Gasket", stock_level: 25, reorder_point: 10, cost: 85.00, location: "Warehouse A - Aisle 9" },
    { part_id: "PART-203", part_name: "Petrochemical Centrifugal Impeller", stock_level: 1, reorder_point: 3, cost: 1450.00, location: "Warehouse C - Aisle 3" },
    { part_id: "PART-204", part_name: "Exchanger Fan 3-Phase Rotor Winding", stock_level: 8, reorder_point: 2, cost: 720.00, location: "Warehouse B - Aisle 7" }
  ],
  nodes: [
    { id: "PART-201", name: "Extreme Heat Gas Turbine Valve", type: "Part", risk: 0, email: "" },
    { id: "PART-202", name: "Fluorosilicone High-Pressure Gasket", type: "Part", risk: 0, email: "" },
    { id: "PART-203", name: "Petrochemical Centrifugal Impeller", type: "Part", risk: 0, email: "" },
    { id: "PART-204", name: "Exchanger Fan 3-Phase Rotor Winding", type: "Part", risk: 0, email: "" },
    { id: "SUP-201", name: "GE Power Systems Logistics", type: "Supplier", risk: 0.08, email: "logistics@gepower.com" },
    { id: "SUP-202", name: "Chevron Seals Houston", type: "Supplier", risk: 0.04, email: "houston.sales@chevronseals.com" },
    { id: "SUP-203", name: "Sulzer Gothenburg", type: "Supplier", risk: 0.12, email: "procurement@sulzer.se" },
    { id: "SUP-204", name: "VarnishTech Graz", type: "Supplier", risk: 0.20, email: "sales@varnishwtech.at" },
    { id: "MAT-201", name: "Superalloy Nickel Base Bar", type: "Material", risk: 0.15, email: "" },
    { id: "MAT-202", name: "NBR Rubber Compound", type: "Material", risk: 0.05, email: "" }
  ],
  links: [
    { id: 1, source: "SUP-201", target: "PART-201", relationship: "SUPPLIES", transit: 4, price: 3200.00 },
    { id: 2, source: "SUP-202", target: "PART-202", relationship: "SUPPLIES", transit: 1, price: 95.00 },
    { id: 3, source: "SUP-203", target: "PART-203", relationship: "SUPPLIES", transit: 12, price: 1750.00 },
    { id: 4, source: "SUP-204", target: "PART-204", relationship: "SUPPLIES", transit: 6, price: 850.00 },
    { id: 5, source: "SUP-201", target: "PART-203", relationship: "SUPPLIES", transit: 26, price: 1250.00 },
    { id: 6, source: "SUP-203", target: "MAT-201", relationship: "SUPPLIES", transit: 4, price: 600.00 },
    { id: 7, source: "MAT-201", target: "PART-201", relationship: "USED_IN", transit: 3, price: 900.00 },
    { id: 8, source: "SUP-202", target: "MAT-202", relationship: "SUPPLIES", transit: 2, price: 40.00 },
    { id: 9, source: "MAT-202", target: "PART-202", relationship: "USED_IN", transit: 1, price: 20.00 }
  ],
  anomalyMachineId: "MCH-203"
};

export const AUTOMOTIVE_TEMPLATE = {
  machines: [
    {
      id: "MCH-301",
      name: "6-Axis Welder Robot Joint",
      location: "Bay 1 - Welding Cell",
      status: "Operational",
      critical_thresholds: { temperature: 80.0, vibration: 15.0, pressure: 5.0, current: 30.0, required_part_id: "PART-301" },
      components: [
        { id: "PART-301", name: "Harmonic Welder Gear Box Drive", health: 80 },
        { id: "PART-304", name: "Welder Copper Cable Core", health: 95 }
      ]
    },
    {
      id: "MCH-302",
      name: "Main Assembly Conveyor Drive",
      location: "Bay 6 - Painting Line",
      status: "Operational",
      critical_thresholds: { temperature: 75.0, vibration: 8.0, pressure: 6.0, current: 22.0, required_part_id: "PART-302" },
      components: [
        { id: "PART-302", name: "3-Phase Drive Motor Brushless", health: 88 }
      ]
    },
    {
      id: "MCH-303",
      name: "Fleet Pneumatic Compressor Main",
      location: "Bay 14 - Assembly Main",
      status: "Operational",
      critical_thresholds: { temperature: 90.0, vibration: 9.5, pressure: 9.0, current: 50.0, required_part_id: "PART-303" },
      components: [
        { id: "PART-303", name: "Pneumatic Double Solenoid Valve", health: 92 }
      ]
    }
  ],
  inventory: [
    { part_id: "PART-301", part_name: "Harmonic Welder Gear Box Drive", stock_level: 0, reorder_point: 2, cost: 3850.00, location: "Warehouse D - Aisle 3" },
    { part_id: "PART-302", part_name: "3-Phase Drive Motor Brushless", stock_level: 5, reorder_point: 2, cost: 950.00, location: "Warehouse B - Aisle 1" },
    { part_id: "PART-303", part_name: "Pneumatic Double Solenoid Valve", stock_level: 2, reorder_point: 8, cost: 140.00, location: "Warehouse A - Aisle 2" },
    { part_id: "PART-304", part_name: "Welder Copper Cable Core", stock_level: 12, reorder_point: 5, cost: 220.00, location: "Warehouse B - Aisle 9" }
  ],
  nodes: [
    { id: "PART-301", name: "Harmonic Welder Gear Box Drive", type: "Part", risk: 0, email: "" },
    { id: "PART-302", name: "3-Phase Drive Motor Brushless", type: "Part", risk: 0, email: "" },
    { id: "PART-303", name: "Pneumatic Double Solenoid Valve", type: "Part", risk: 0, email: "" },
    { id: "PART-304", name: "Welder Copper Cable Core", type: "Part", risk: 0, email: "" },
    { id: "SUP-301", name: "Yaskawa Motoman Logistics", type: "Supplier", risk: 0.05, email: "logistics@yaskawa.com" },
    { id: "SUP-302", name: "SMC Pneumatics Cleveland", type: "Supplier", risk: 0.03, email: "orders@smcpneumatics.com" },
    { id: "SUP-303", name: "Siemens Munich", type: "Supplier", risk: 0.10, email: "logistics@siemens.de" },
    { id: "SUP-304", name: "CopperWorks Ohio", type: "Supplier", risk: 0.10, email: "orders@copperworksohio.com" },
    { id: "MAT-301", name: "High-Grade Copper Core", type: "Material", risk: 0.10, email: "" },
    { id: "MAT-302", name: "Harmonic Steel Castings", type: "Material", risk: 0.08, email: "" }
  ],
  links: [
    { id: 1, source: "SUP-301", target: "PART-301", relationship: "SUPPLIES", transit: 7, price: 4200.00 },
    { id: 2, source: "SUP-302", target: "PART-303", relationship: "SUPPLIES", transit: 2, price: 120.00 },
    { id: 3, source: "SUP-303", target: "PART-302", relationship: "SUPPLIES", transit: 5, price: 1100.00 },
    { id: 4, source: "SUP-304", target: "PART-304", relationship: "SUPPLIES", transit: 3, price: 195.00 },
    { id: 5, source: "SUP-303", target: "PART-301", relationship: "SUPPLIES", transit: 29, price: 3900.00 },
    { id: 6, source: "SUP-304", target: "MAT-301", relationship: "SUPPLIES", transit: 3, price: 90.00 },
    { id: 7, source: "MAT-301", target: "PART-304", relationship: "USED_IN", transit: 1, price: 100.00 },
    { id: 8, source: "SUP-301", target: "MAT-302", relationship: "SUPPLIES", transit: 4, price: 800.00 },
    { id: 9, source: "MAT-302", target: "PART-301", relationship: "USED_IN", transit: 3, price: 1200.00 }
  ],
  anomalyMachineId: "MCH-301"
};

export const STEEL_TEMPLATE = {
  machines: [
    {
      id: "MCH-001",
      name: "Rotary Gear Pump A",
      location: "Bay 3 - Fluids Processing",
      status: "Operational",
      critical_thresholds: { temperature: 90.0, vibration: 8.0, pressure: 6.5, current: 15.0, required_part_id: "PART-001" },
      components: [
        { id: "PART-001", name: "Heavy-Duty Bearing Assembly", health: 85 },
        { id: "PART-003", name: "Centrifugal Pump Impeller", health: 90 }
      ]
    },
    {
      id: "MCH-002",
      name: "High-Speed Industrial Fan B",
      location: "Bay 7 - Ventilation and Exhaust",
      status: "Operational",
      critical_thresholds: { temperature: 80.0, vibration: 10.0, pressure: 3.0, current: 20.0, required_part_id: "PART-004" },
      components: [
        { id: "PART-004", name: "3-Phase Electric Motor Winding", health: 75 }
      ]
    },
    {
      id: "MCH-003",
      name: "Heavy-Duty Compressor C",
      location: "Bay 12 - Pneumatics & Air Power",
      status: "Operational",
      critical_thresholds: { temperature: 95.0, vibration: 7.5, pressure: 8.5, current: 25.0, required_part_id: "PART-002" },
      components: [
        { id: "PART-002", name: "High-Pressure Hydraulic Seal", health: 82 }
      ]
    }
  ],
  inventory: [
    { part_id: "PART-001", part_name: "Heavy-Duty Bearing Assembly", stock_level: 15, reorder_point: 5, cost: 120.50, location: "Warehouse A - Aisle 4" },
    { part_id: "PART-002", part_name: "High-Pressure Hydraulic Seal", stock_level: 3, reorder_point: 10, cost: 45.00, location: "Warehouse A - Aisle 6" },
    { part_id: "PART-003", part_name: "Centrifugal Pump Impeller", stock_level: 8, reorder_point: 2, cost: 350.00, location: "Warehouse B - Aisle 2" },
    { part_id: "PART-004", part_name: "3-Phase Electric Motor Winding", stock_level: 1, reorder_point: 3, cost: 850.00, location: "Warehouse B - Aisle 5" }
  ],
  nodes: [
    { id: "PART-001", name: "Heavy-Duty Bearing Assembly", type: "Part", risk: 0, email: "" },
    { id: "PART-002", name: "High-Pressure Hydraulic Seal", type: "Part", risk: 0, email: "" },
    { id: "PART-003", name: "Centrifugal Pump Impeller", type: "Part", risk: 0, email: "" },
    { id: "PART-004", name: "3-Phase Electric Motor Winding", type: "Part", risk: 0, email: "" },
    { id: "SUP-001", name: "Siemens Shanghai", type: "Supplier", risk: 0.70, email: "procurement@siemens.cn" },
    { id: "SUP-002", name: "SKF Munich", type: "Supplier", risk: 0.15, email: "logistics@skf.de" },
    { id: "SUP-003", name: "CopperWorks Ohio", type: "Supplier", risk: 0.10, email: "orders@copperworksohio.com" },
    { id: "SUP-004", name: "VarnishTech Graz", type: "Supplier", risk: 0.20, email: "sales@varnishtech.at" },
    { id: "SUP-005", name: "Parker Hannifin Cleveland", type: "Supplier", risk: 0.05, email: "orders@parkerhannifin.com" },
    { id: "SUP-006", name: "Sulzer Gothenburg", type: "Supplier", risk: 0.12, email: "procurement@sulzer.se" },
    { id: "MAT-001", name: "High-Conductivity Copper Wire", type: "Material", risk: 0.10, email: "" },
    { id: "MAT-002", name: "High-Temperature Insulating Varnish", type: "Material", risk: 0.20, email: "" },
    { id: "MAT-003", name: "NBR Rubber Compound", type: "Material", risk: 0.05, email: "" },
    { id: "MAT-004", name: "Stainless Steel Casting", type: "Material", risk: 0.12, email: "" }
  ],
  links: [
    { id: 1, source: "SUP-002", target: "PART-001", relationship: "SUPPLIES", transit: 5, price: 450.00 },
    { id: 2, source: "SUP-005", target: "PART-002", relationship: "SUPPLIES", transit: 2, price: 35.00 },
    { id: 3, source: "SUP-006", target: "PART-003", relationship: "SUPPLIES", transit: 14, price: 250.00 },
    { id: 4, source: "SUP-001", target: "PART-004", relationship: "SUPPLIES", transit: 28, price: 850.00 },
    { id: 5, source: "SUP-002", target: "PART-004", relationship: "SUPPLIES", transit: 5, price: 1200.00 },
    { id: 6, source: "SUP-003", target: "MAT-001", relationship: "SUPPLIES", transit: 3, price: 300.00 },
    { id: 7, source: "MAT-001", target: "PART-004", relationship: "USED_IN", transit: 3, price: 400.00 },
    { id: 8, source: "SUP-004", target: "MAT-002", relationship: "SUPPLIES", transit: 4, price: 150.00 },
    { id: 9, source: "MAT-002", target: "PART-004", relationship: "USED_IN", transit: 2, price: 600.00 },
    { id: 10, source: "SUP-003", target: "MAT-003", relationship: "SUPPLIES", transit: 3, price: 10.00 },
    { id: 11, source: "MAT-003", target: "PART-002", relationship: "USED_IN", transit: 1, price: 15.00 },
    { id: 12, source: "SUP-003", target: "MAT-004", relationship: "SUPPLIES", transit: 5, price: 80.00 },
    { id: 13, source: "MAT-004", target: "PART-003", relationship: "USED_IN", transit: 4, price: 120.00 }
  ],
  anomalyMachineId: "MCH-001"
};

export const generateBaselines = (machineId) => {
  const baselines = {
    "MCH-001": { temp: 55.0, vib: 1.8, pres: 5.2, cur: 8.2 },
    "MCH-002": { temp: 48.0, vib: 2.1, pres: 2.0, cur: 11.0 },
    "MCH-003": { temp: 62.0, vib: 2.4, pres: 7.0, cur: 17.5 },
    "MCH-201": { temp: 65.0, vib: 2.0, pres: 8.2, cur: 22.0 },
    "MCH-202": { temp: 75.0, vib: 3.5, pres: 10.5, cur: 45.0 },
    "MCH-203": { temp: 42.0, vib: 1.5, pres: 2.5, cur: 8.5 },
    "MCH-301": { temp: 45.0, vib: 3.0, pres: 3.2, cur: 12.0 },
    "MCH-302": { temp: 40.0, vib: 1.2, pres: 4.0, cur: 9.8 },
    "MCH-303": { temp: 58.0, vib: 2.0, pres: 6.5, cur: 28.0 }
  };
  return baselines[machineId] || { temp: 50.0, vib: 2.0, pres: 5.0, cur: 12.0 };
};

export function seedWorkspaceData(type, templateId, customMachinesInput) {
  let machinesToSeed = [];
  let inventoryToSeed = [];
  let supplierNodesToSeed = [];
  let supplierEdgesToSeed = [];
  let anomalyMachineId = null;

  if (type === "template") {
    if (templateId === "petrochemical") {
      machinesToSeed = JSON.parse(JSON.stringify(PETROCHEMICAL_TEMPLATE.machines));
      inventoryToSeed = JSON.parse(JSON.stringify(PETROCHEMICAL_TEMPLATE.inventory));
      supplierNodesToSeed = JSON.parse(JSON.stringify(PETROCHEMICAL_TEMPLATE.nodes));
      supplierEdgesToSeed = JSON.parse(JSON.stringify(PETROCHEMICAL_TEMPLATE.links));
      anomalyMachineId = PETROCHEMICAL_TEMPLATE.anomalyMachineId;
    } else if (templateId === "automotive") {
      machinesToSeed = JSON.parse(JSON.stringify(AUTOMOTIVE_TEMPLATE.machines));
      inventoryToSeed = JSON.parse(JSON.stringify(AUTOMOTIVE_TEMPLATE.inventory));
      supplierNodesToSeed = JSON.parse(JSON.stringify(AUTOMOTIVE_TEMPLATE.nodes));
      supplierEdgesToSeed = JSON.parse(JSON.stringify(AUTOMOTIVE_TEMPLATE.links));
      anomalyMachineId = AUTOMOTIVE_TEMPLATE.anomalyMachineId;
    } else if (templateId === "blank") {
      machinesToSeed = [];
      inventoryToSeed = [];
      supplierNodesToSeed = [];
      supplierEdgesToSeed = [];
      anomalyMachineId = null;
    } else {
      machinesToSeed = JSON.parse(JSON.stringify(STEEL_TEMPLATE.machines));
      inventoryToSeed = JSON.parse(JSON.stringify(STEEL_TEMPLATE.inventory));
      supplierNodesToSeed = JSON.parse(JSON.stringify(STEEL_TEMPLATE.nodes));
      supplierEdgesToSeed = JSON.parse(JSON.stringify(STEEL_TEMPLATE.links));
      anomalyMachineId = STEEL_TEMPLATE.anomalyMachineId;
    }
    const getVal = (v, fallback) => {
      if (v === undefined || v === null || v === "") return fallback;
      const parsed = parseFloat(v);
      return isNaN(parsed) ? fallback : parsed;
    };
    const inputList = (customMachinesInput && customMachinesInput.length > 0) 
      ? customMachinesInput 
      : [{ id: "MCH-101", name: "Custom Compressor Alpha", location: "Main Facility Block", thresholds: { temperature: 90, vibration: 8, pressure: 6.5, current: 15, required_part_id: "PART-001" }, sensors: [] }];
      
    machinesToSeed = inputList.map((m, idx) => ({
      id: m.id || `MCH-10${idx + 1}`,
      name: (m.name && m.name.trim()) ? m.name.trim() : `Custom Asset ${idx + 1}`,
      location: (m.location && m.location.trim()) ? m.location.trim() : "Main Facility Block",
      status: "Operational",
      critical_thresholds: {
        temperature: getVal(m.thresholds?.temperature, 90.0),
        vibration: getVal(m.thresholds?.vibration, 8.0),
        pressure: getVal(m.thresholds?.pressure, 6.5),
        current: getVal(m.thresholds?.current, 15.0),
        required_part_id: m.thresholds?.required_part_id || "PART-001"
      },
      sensors: m.sensors || []
    }));
    inventoryToSeed = [];
    supplierNodesToSeed = [];
    supplierEdgesToSeed = [];
    anomalyMachineId = null;
  }

  const now = new Date();
  const pointsToGenerate = 15;
  const telemetry = {};
  
  machinesToSeed.forEach(m => {
    const mTelemetry = [];
    
    // For custom machines, check if they have dynamic sensors defined
    if (m.sensors && m.sensors.length > 0) {
      for (let i = 0; i < pointsToGenerate; i++) {
        const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (pointsToGenerate - i));
        const reading = { timestamp: timestamp.toISOString() };
        
        m.sensors.forEach(s => {
          // Standardize telemetry fields by key mapping or dynamic names
          const nameLower = s.name.toLowerCase();
          const dev = (s.max - s.min) * 0.05 || 1.0;
          const val = s.current + (Math.random() * dev * 2 - dev);
          const clampedVal = parseFloat(Math.max(s.min, Math.min(s.max, val)).toFixed(2));
          
          if (nameLower.includes("temp")) {
            reading.temperature = clampedVal;
          } else if (nameLower.includes("vib")) {
            reading.vibration = clampedVal;
          } else if (nameLower.includes("pres")) {
            reading.pressure = clampedVal;
          } else if (nameLower.includes("cur") || nameLower.includes("amp")) {
            reading.current = clampedVal;
          } else {
            // Store extra dynamic properties
            reading[s.name] = clampedVal;
          }
        });
        
        // Ensure defaults exist so components don't crash
        if (reading.temperature === undefined) reading.temperature = 0;
        if (reading.vibration === undefined) reading.vibration = 0;
        if (reading.pressure === undefined) reading.pressure = 0;
        if (reading.current === undefined) reading.current = 0;
        
        mTelemetry.push(reading);
      }
    } else {
      const metrics = generateBaselines(m.id);
      for (let i = 0; i < pointsToGenerate; i++) {
        const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (pointsToGenerate - i));
        const temp = metrics.temp + (Math.random() * 2 - 1);
        const vib = metrics.vib + (Math.random() * 0.4 - 0.2);
        const pres = metrics.pres + (Math.random() * 0.2 - 0.1);
        const cur = metrics.cur + (Math.random() * 0.6 - 0.3);
        mTelemetry.push({
          timestamp: timestamp.toISOString(),
          temperature: parseFloat(temp.toFixed(2)),
          vibration: parseFloat(vib.toFixed(2)),
          pressure: parseFloat(pres.toFixed(2)),
          current: parseFloat(cur.toFixed(2))
        });
      }
    }
    telemetry[m.id] = mTelemetry;
  });

  const orders = [];

  if (anomalyMachineId) {
    const activeMachine = machinesToSeed.find(m => m.id === anomalyMachineId);
    if (activeMachine) {
      const thresholds = activeMachine.critical_thresholds;
      const badTemp = thresholds.temperature * 1.05;
      const badVib = thresholds.vibration * 1.15;
      const badPres = thresholds.pressure * 0.45;
      const badCur = thresholds.current * 1.35;
      
      const timestamp = new Date();
      if (telemetry[anomalyMachineId]) {
        telemetry[anomalyMachineId].push({
          timestamp: timestamp.toISOString(),
          temperature: parseFloat(badTemp.toFixed(2)),
          vibration: parseFloat(badVib.toFixed(2)),
          pressure: parseFloat(badPres.toFixed(2)),
          current: parseFloat(badCur.toFixed(2))
        });
      }
      
      activeMachine.status = "Critical";
      
      const rootCause = `Automated Predictive Maintenance Alert: Thermal & mechanical degradation thresholds breached on ${activeMachine.name}. ` +
        `Vibration reading of ${badVib.toFixed(2)} mm/s exceeded the limit of ${thresholds.vibration} mm/s. ` +
        `Winding temperature spiked to ${badTemp.toFixed(1)}°C. Automatic RAG parts audit initiated for replacement components. Sourcing active.\n\n` +
        `Subject: URGENT: Autonomous Sourcing Bypass Route for ${activeMachine.id}\n` +
        `To: logistics@skf.de\n` +
        `From: ai-orchestrator@industrial-tower.internal\n` +
        `Date: ${new Date().toUTCString()}\n\n` +
        `Dear SKF Munich Logistics Team,\n\n` +
        `This is an automated purchase request dispatched by the Autonomic Industrial Control Tower.\n\n` +
        `Our predictive maintenance models have flagged a critical bearing degradation event on ${activeMachine.name} (${activeMachine.id}). To bypass catastrophic line failure and avoid $22,000/minute downtime penalties, our multi-agent sourcing router has initiated emergency procurement of a 3-Phase Electric Motor Winding (PART-004).\n\n` +
        `Supply Chain Path Resilience Scoring Model Summary:\n` +
        `- Selected Supplier: SKF Munich (DDP Air freight, 5-day lead-time)\n` +
        `- Alternate Evaluated: Siemens Shanghai (Maritime transit delay bottleneck, 28-day penalty)\n` +
        `- Path Sourcing Optimization Resilience Score: 59.50 (Approved)\n\n` +
        `Please dispatch one unit to fluids bay processing location immediately.\n\n` +
        `Best regards,\n` +
        `Autonomous Procurement Agent`;
        
      orders.push({
        id: 1,
        machine_id: anomalyMachineId,
        priority: 'Critical',
        status: 'Pending_Sourcing',
        root_cause: rootCause,
        assigned_technician: 'Sarah Jenkins (PdM Lead)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  return {
    machines: machinesToSeed,
    inventory: inventoryToSeed,
    telemetry: telemetry,
    maintenance_orders: orders,
    graph: {
      nodes: supplierNodesToSeed,
      links: supplierEdgesToSeed
    }
  };
}
