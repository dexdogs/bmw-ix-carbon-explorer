import { useState, useRef, useMemo, useCallback } from "react";

// ============================================================
// DATA LAYER — BMW iX xDrive45 PCR/PCF Dataset
// ============================================================
const VEHICLE_DATA = {
  name: "BMW iX xDrive45",
  year: 2025,
  weight_kg: 2485,
  supply_chain_co2e_t: 20.2,
  lifecycle_co2e_eu_t: 32.9,
  lifecycle_co2e_renew_t: 22.3,
  total_pcrs: 80,
  total_pcfs_est: 3000,
  total_parts_est: 30000,
  primary_data_pct: 0.1,
  supplier_epd_pct: 10,
  industry_avg_pct: 35,
  generic_lci_pct: 37,
  estimate_pct: 18,
};

const ZONES = [
  { id:"battery", name:"HV Battery Pack", position:[0,-0.65,0], size:[2.8,0.35,1.4], color:"#e74c3c",
    pcrs:["NMC Cathode","Graphite Anode","Electrolyte","Separator","Cell Housing","Cell Mfg Energy","Pack Housing","BMS","Thermal Mgmt"],
    pcr_count:9, parts:60, weight_kg:373, co2e_kg:4382, pct_of_total:21.7,
    data_quality:"Generic LCI / Estimate", quality_color:"#e67e22",
    detail:"The battery is the single largest carbon contributor. 15% of vehicle weight but ~22% of supply chain CO2e. BMW uses ~50% secondary nickel and 100% secondary cobalt in cells. Cell manufacturing energy (~50-80 kWh per kWh of cells) is a major factor. BMW requires green electricity from cell suppliers." },
  { id:"front_motor", name:"Front Electric Motor + Inverter", position:[1.4,-0.25,0], size:[0.6,0.45,0.7], color:"#3498db",
    pcrs:["Traction Motor (no rare earth)","Power Electronics / SiC Inverter","Reduction Gear"],
    pcr_count:3, parts:20, weight_kg:57, co2e_kg:742, pct_of_total:3.7,
    data_quality:"Estimate", quality_color:"#e67e22",
    detail:"BMW 5th gen eDrive — no permanent magnets, no rare earth elements. Excited synchronous motor with copper rotor windings. SiC MOSFET inverter. Single-speed reduction gear integrated into motor housing." },
  { id:"rear_motor", name:"Rear Electric Motor + Inverter", position:[-1.4,-0.25,0], size:[0.6,0.45,0.7], color:"#3498db",
    pcrs:["Traction Motor (no rare earth)","Power Electronics / SiC Inverter","Reduction Gear"],
    pcr_count:3, parts:20, weight_kg:58, co2e_kg:743, pct_of_total:3.7,
    data_quality:"Estimate", quality_color:"#e67e22",
    detail:"Identical architecture to front motor. Together the dual motors produce 300 kW (408 hp). The power electronics (SiC inverters) have very high CO2 per kg due to semiconductor fabrication." },
  { id:"body", name:"Body Structure", position:[0,0.1,0], size:[3.6,0.7,1.6], color:"#95a5a6",
    pcrs:["Hot-rolled Steel","Cold-rolled Steel","Galvanized Steel","AHSS","Steel Forgings","Steel Tubes","Stainless Steel","Fasteners","Springs","Al Castings","Al Extrusions","Al Sheet","Paint/Coatings","Adhesives","Cavity Wax"],
    pcr_count:15, parts:2000, weight_kg:1050, co2e_kg:5700, pct_of_total:28.2,
    data_quality:"Industry Average / Supplier EPD", quality_color:"#f1c40f",
    detail:"27% steel/iron + 30% aluminum by weight. The body-in-white is the second largest carbon contributor. The ratio of primary to secondary aluminum is THE decisive variable — BMW reports using 30-40% secondary Al for some components. Steel suppliers like ArcelorMittal publish facility-specific EPDs." },
  { id:"cfrp_roof", name:"CFRP Roof Panel", position:[0,0.55,0], size:[1.8,0.05,1.3], color:"#8e44ad",
    pcrs:["Carbon Fiber Reinforced Polymer"],
    pcr_count:1, parts:5, weight_kg:15, co2e_kg:375, pct_of_total:1.9,
    data_quality:"Generic LCI", quality_color:"#e67e22",
    detail:"Signature BMW iX feature. Carbon fiber production is extremely energy intensive (~25 kg CO2e/kg) — PAN precursor pyrolysis at 1000-1500°C. Only 15 kg but contributes almost 2% of supply chain footprint." },
  { id:"wheels", name:"Wheels & Tires", position:[0,-0.6,0], size:[0.1,0.1,0.1], color:"#2ecc71",
    pcrs:["Cast Aluminum Wheels","Pneumatic Tires","Bearings"],
    pcr_count:3, parts:12, weight_kg:96, co2e_kg:596, pct_of_total:3.0,
    data_quality:"Industry Average / Supplier EPD", quality_color:"#f1c40f",
    detail:"4x large 20-22 inch alloy wheels (~12 kg each). Continental and Bridgestone publish tire-level carbon data. Wheel bearing data from SKF EPDs." },
  { id:"electronics", name:"Electronics & Wiring", position:[0,0.2,0], size:[0.1,0.1,0.1], color:"#e67e22",
    pcrs:["PCBs","Semiconductor ICs","Display Panels","Sensors","Small Motors","Wiring Harness","Antenna/Connectivity"],
    pcr_count:7, parts:1800, weight_kg:66, co2e_kg:1006, pct_of_total:5.0,
    data_quality:"Estimate", quality_color:"#c0392b",
    detail:"Only 66 kg but ~5% of carbon footprint. Semiconductors have extreme CO2 per kg (>200 kg CO2e/kg) due to fab energy. The iX uses BMW's new zonal electrical architecture with fewer ECUs but more compute. 12.3\" + 14.9\" curved display (iDrive 8)." },
  { id:"interior", name:"Interior (Seats, Trim, NVH)", position:[0,0.15,0], size:[0.1,0.1,0.1], color:"#1abc9c",
    pcrs:["PU Foam","Synthetic Textiles","Carpet","IP Assembly","Door Trim","Seat Structures","Acoustic Insulation","Audio System"],
    pcr_count:8, parts:400, weight_kg:165, co2e_kg:749, pct_of_total:3.7,
    data_quality:"Generic LCI / Estimate", quality_color:"#e67e22",
    detail:"BMW moving to 100% vegan interiors — no leather. This reduces carbon by ~80% vs leather per BMW. Extra NVH insulation needed because EVs have no engine noise to mask road noise. Harman Kardon audio up to 18 speakers." },
  { id:"thermal", name:"Thermal & HVAC System", position:[1.0,0.0,0], size:[0.1,0.1,0.1], color:"#16a085",
    pcrs:["Heat Exchangers","Heat Pump","Coolant","Refrigerant","Rubber Hoses"],
    pcr_count:5, parts:105, weight_kg:48, co2e_kg:311, pct_of_total:1.5,
    data_quality:"Industry Average / Generic LCI", quality_color:"#f1c40f",
    detail:"More heat exchangers in EV than ICE — battery chiller, motor coolers, cabin system. Heat pump standard on iX, critical for winter range. Multiple coolant loops with more total coolant than ICE vehicles." },
  { id:"suspension", name:"Suspension & Steering", position:[0,-0.35,0], size:[0.1,0.1,0.1], color:"#2980b9",
    pcrs:["Steel Forgings","Al Castings","Air Suspension","Vibration Dampeners","EPS System","Bearings"],
    pcr_count:6, parts:220, weight_kg:39, co2e_kg:209, pct_of_total:1.0,
    data_quality:"Industry Average / Estimate", quality_color:"#f1c40f",
    detail:"Air suspension standard on iX — heavier than coil springs but adds compressor, valve block, air springs. Aluminum suspension arms. Electric power steering." },
  { id:"brakes", name:"Brake System", position:[0,-0.45,0], size:[0.1,0.1,0.1], color:"#7f8c8d",
    pcrs:["Cast Iron Rotors","Brake Pads","Brake Calipers","Brake Fluid"],
    pcr_count:4, parts:60, weight_kg:68, co2e_kg:191, pct_of_total:0.9,
    data_quality:"Industry Average", quality_color:"#f1c40f",
    detail:"Less brake wear in EVs due to regenerative braking — the motors slow the car first. But the hardware is still there for safety. Aluminum front calipers, cast iron rotors." },
  { id:"glazing", name:"Glass & Glazing", position:[0,0.4,0], size:[0.1,0.1,0.1], color:"#bdc3c7",
    pcrs:["Laminated Windshield","Tempered Glass","Panoramic Roof Glass"],
    pcr_count:3, parts:11, weight_kg:44, co2e_kg:97, pct_of_total:0.5,
    data_quality:"Industry Average", quality_color:"#27ae60",
    detail:"Large panoramic glass roof with electrochromic Sky Lounge dimming. HUD-compatible windshield with projection layer. Relatively low carbon intensity per kg but significant total weight." },
  { id:"safety", name:"Safety Systems", position:[0,0.3,0], size:[0.1,0.1,0.1], color:"#e74c3c",
    pcrs:["Airbag Systems","Seatbelt Systems"],
    pcr_count:2, parts:45, weight_kg:15, co2e_kg:171, pct_of_total:0.8,
    data_quality:"Estimate", quality_color:"#c0392b",
    detail:"Airbags (front, side, curtain, knee), pretensioners, load limiters. Complex pyrotechnic and textile assemblies. Difficult to get supplier-specific data." },
  { id:"kidney_grille", name:"Kidney Grille ★ CATENA-X", position:[1.85,0.15,0], size:[0.15,0.2,0.5], color:"#00ff88",
    pcrs:["Kidney Grille Assembly (Covestro material)"],
    pcr_count:1, parts:3, weight_kg:2, co2e_kg:8, pct_of_total:0.04,
    data_quality:"Primary (Catena-X)", quality_color:"#00ff88",
    detail:"★ THE ONE DATA POINT. In 2024, BMW demonstrated a complete cradle-to-gate PCF for this component using Catena-X. Real CO2 data flowed from Covestro through the supply chain to BMW's Landshut plant, using Catena-X-certified tools from Siemens. This is the ONLY component in the vehicle with demonstrated primary, facility-level data. 1 out of ~30,000 parts." },
  { id:"charging", name:"Charging System", position:[-1.6,0.1,-0.6], size:[0.1,0.1,0.1], color:"#f39c12",
    pcrs:["CCS Charging Inlet","Onboard Charger"],
    pcr_count:2, parts:5, weight_kg:3, co2e_kg:24, pct_of_total:0.1,
    data_quality:"Estimate", quality_color:"#e67e22",
    detail:"CCS fast charging up to 200 kW. 10-80% in under 40 minutes. 11 kW onboard AC charger." },
  { id:"polymers_misc", name:"Other Polymers & Materials", position:[0,0,0], size:[0.1,0.1,0.1], color:"#9b59b6",
    pcrs:["PP Components","PA/Nylon","ABS/PC Blends","PE Components","PBT/PET","PMMA/PC Glazing","Rubber Seals","12V Battery","Filters"],
    pcr_count:9, parts:600, weight_kg:186, co2e_kg:689, pct_of_total:3.4,
    data_quality:"Industry Average / Generic LCI", quality_color:"#f1c40f",
    detail:"The long tail of polymer and misc components — bumper fascias, wire loom, seal systems, connectors, sensor housings, light lenses, cabin filter. Individually small but collectively ~3.4% of footprint." },
];

const QUALITY_LEGEND = [
  { label: "Primary (Catena-X)", color: "#00ff88", pct: "~0.1%" },
  { label: "Supplier EPD", color: "#3498db", pct: "~10%" },
  { label: "Industry Average", color: "#f1c40f", pct: "~35%" },
  { label: "Generic LCI", color: "#e67e22", pct: "~37%" },
  { label: "Estimate / Proxy", color: "#c0392b", pct: "~18%" },
];

// ============================================================
// 3D CAR COMPONENT — Low-poly BMW iX style SUV
// ============================================================
function CarBody({ onZoneClick, hoveredZone, selectedZone }) {
  const groupRef = useRef();

  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#1a2332",
    transparent: true,
    opacity: 0.25,
    roughness: 0.3,
    metalness: 0.8,
    side: THREE.DoubleSide,
  }), []);

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#4a90d9",
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.2,
    side: THREE.DoubleSide,
  }), []);

  const getZoneMaterial = useCallback((zone) => {
    const isHovered = hoveredZone === zone.id;
    const isSelected = selectedZone === zone.id;
    const opacity = isSelected ? 0.9 : isHovered ? 0.7 : 0.45;
    const emissiveIntensity = isSelected ? 0.6 : isHovered ? 0.4 : 0.15;

    return new THREE.MeshPhysicalMaterial({
      color: zone.color,
      transparent: true,
      opacity,
      roughness: 0.4,
      metalness: 0.3,
      emissive: zone.color,
      emissiveIntensity,
    });
  }, [hoveredZone, selectedZone]);

  return (
    <group ref={groupRef} rotation={[0, -0.3, 0]} position={[0, 0, 0]}>
      {/* Main body shell - SUV shape */}
      {/* Lower body */}
      <mesh material={bodyMaterial} position={[0, -0.15, 0]}>
        <boxGeometry args={[4.2, 0.6, 1.7]} />
      </mesh>
      {/* Upper cabin */}
      <mesh material={bodyMaterial} position={[0, 0.35, 0]}>
        <boxGeometry args={[2.8, 0.55, 1.6]} />
      </mesh>
      {/* Front slope */}
      <mesh material={bodyMaterial} position={[1.1, 0.25, 0]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.8, 0.15, 1.55]} />
      </mesh>
      {/* Rear slope */}
      <mesh material={bodyMaterial} position={[-1.05, 0.3, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.7, 0.15, 1.55]} />
      </mesh>

      {/* Glass */}
      <mesh material={glassMaterial} position={[0, 0.55, 0]}>
        <boxGeometry args={[2.2, 0.03, 1.4]} />
      </mesh>
      <mesh material={glassMaterial} position={[0.85, 0.45, 0]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.7, 0.03, 1.45]} />
      </mesh>
      <mesh material={glassMaterial} position={[-0.8, 0.47, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.6, 0.03, 1.45]} />
      </mesh>

      {/* Wheels - 4 corners */}
      {[[1.35, -0.55, 0.85], [1.35, -0.55, -0.85], [-1.25, -0.55, 0.85], [-1.25, -0.55, -0.85]].map((pos, i) => (
        <group key={`wheel-${i}`} position={pos}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.22, 16]} />
            <meshPhysicalMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.24, 8]} />
            <meshPhysicalMaterial color="#555" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Headlights */}
      {[0.7, -0.7].map((z, i) => (
        <mesh key={`hl-${i}`} position={[2.05, 0.05, z]}>
          <boxGeometry args={[0.08, 0.1, 0.25]} />
          <meshPhysicalMaterial color="#e0e8ff" emissive="#4a7aff" emissiveIntensity={0.5} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Tail lights - full width bar */}
      <mesh position={[-2.08, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.06, 1.5]} />
        <meshPhysicalMaterial color="#ff2020" emissive="#ff0000" emissiveIntensity={0.4} transparent opacity={0.8} />
      </mesh>

      {/* CLICKABLE ZONES */}
      {/* Battery pack */}
      <mesh
        position={[0, -0.55, 0]}
        onClick={(e) => { e.stopPropagation(); onZoneClick("battery"); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[3.0, 0.22, 1.4]} />
        <meshPhysicalMaterial
          color={ZONES[0].color}
          transparent opacity={selectedZone === "battery" ? 0.85 : hoveredZone === "battery" ? 0.65 : 0.4}
          emissive={ZONES[0].color}
          emissiveIntensity={selectedZone === "battery" ? 0.5 : hoveredZone === "battery" ? 0.3 : 0.1}
        />
      </mesh>

      {/* Front motor */}
      <mesh
        position={[1.5, -0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onZoneClick("front_motor"); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[0.5, 0.35, 0.6]} />
        <meshPhysicalMaterial
          color="#3498db" transparent
          opacity={selectedZone === "front_motor" ? 0.85 : hoveredZone === "front_motor" ? 0.65 : 0.4}
          emissive="#3498db"
          emissiveIntensity={selectedZone === "front_motor" ? 0.5 : 0.1}
        />
      </mesh>

      {/* Rear motor */}
      <mesh
        position={[-1.5, -0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onZoneClick("rear_motor"); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[0.5, 0.35, 0.6]} />
        <meshPhysicalMaterial
          color="#3498db" transparent
          opacity={selectedZone === "rear_motor" ? 0.85 : hoveredZone === "rear_motor" ? 0.65 : 0.4}
          emissive="#3498db"
          emissiveIntensity={selectedZone === "rear_motor" ? 0.5 : 0.1}
        />
      </mesh>

      {/* Kidney grille - THE CATENA-X POINT */}
      <mesh
        position={[2.1, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onZoneClick("kidney_grille"); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[0.08, 0.22, 0.55]} />
        <meshPhysicalMaterial
          color="#00ff88" transparent
          opacity={selectedZone === "kidney_grille" ? 0.95 : 0.7}
          emissive="#00ff88"
          emissiveIntensity={selectedZone === "kidney_grille" ? 0.8 : 0.5}
        />
      </mesh>

      {/* CFRP Roof */}
      <mesh
        position={[0, 0.62, 0]}
        onClick={(e) => { e.stopPropagation(); onZoneClick("cfrp_roof"); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[2.0, 0.04, 1.35]} />
        <meshPhysicalMaterial
          color="#8e44ad" transparent
          opacity={selectedZone === "cfrp_roof" ? 0.85 : hoveredZone === "cfrp_roof" ? 0.65 : 0.35}
          emissive="#8e44ad"
          emissiveIntensity={selectedZone === "cfrp_roof" ? 0.5 : 0.15}
        />
      </mesh>

      {/* Clickable overlay zones for other systems - invisible geometry */}
      {ZONES.filter(z => !["battery","front_motor","rear_motor","kidney_grille","cfrp_roof"].includes(z.id)).map(zone => (
        <mesh
          key={zone.id}
          position={zone.position}
          visible={false}
          onClick={(e) => { e.stopPropagation(); onZoneClick(zone.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        >
          <sphereGeometry args={[0.3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}

      {/* Grid floor */}
      <gridHelper args={[8, 20, "#1a3a5c", "#0a1520"]} position={[0, -0.9, 0]} />
    </group>
  );
}

// ============================================================
// SIMPLE ORBIT CAMERA (no OrbitControls available)
// ============================================================
function CameraRig() {
  const ref = useRef();
  const [angle, setAngle] = useState(-0.3);

  return null; // using default camera
}

// ============================================================
// DATA PANEL
// ============================================================
function DataPanel({ zone, onClose }) {
  if (!zone) return null;
  const z = ZONES.find(zn => zn.id === zone);
  if (!z) return null;

  const isCatenaX = z.id === "kidney_grille";

  return (
    <div style={{
      position: "absolute", right: 16, top: 80, bottom: 16, width: 380,
      background: "rgba(8,12,21,0.95)", borderRadius: 12,
      border: `1px solid ${isCatenaX ? "#00ff88" : "#1a3a5c"}`,
      padding: 20, overflowY: "auto", zIndex: 10,
      boxShadow: isCatenaX ? "0 0 30px rgba(0,255,136,0.15)" : "0 0 20px rgba(0,0,0,0.5)",
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      <button onClick={onClose} style={{
        position:"absolute", top:12, right:12, background:"none", border:"none",
        color:"#556", fontSize:18, cursor:"pointer", padding:4,
      }}>✕</button>

      {isCatenaX && (
        <div style={{
          background:"rgba(0,255,136,0.08)", border:"1px solid #00ff8844", borderRadius:6,
          padding:"8px 12px", marginBottom:12, fontSize:10, color:"#00ff88", letterSpacing:1,
          textTransform:"uppercase", fontWeight:700,
        }}>★ Catena-X Verified Data Point</div>
      )}

      <div style={{ fontSize:15, fontWeight:700, color: z.color, marginBottom:4 }}>{z.name}</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
        {[
          [z.pcr_count, "PCRs"],
          [z.parts.toLocaleString(), "Parts"],
          [`${z.weight_kg} kg`, "Weight"],
          [`${z.co2e_kg.toLocaleString()} kg`, "CO₂e"],
        ].map(([val, label], i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"8px 10px" }}>
            <div style={{ fontSize:18, fontWeight:700, color:"#e0e6ed" }}>{val}</div>
            <div style={{ fontSize:9, color:"#556677", textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:12, padding:"8px 10px", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize:9, color:"#556677", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>
          % of Vehicle Supply Chain CO₂e
        </div>
        <div style={{ height:6, background:"#0a1520", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min(z.pct_of_total * 3, 100)}%`, background:z.color, borderRadius:3 }} />
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"#e0e6ed", marginTop:4 }}>{z.pct_of_total}%</div>
      </div>

      <div style={{ marginTop:12, padding:"8px 10px", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize:9, color:"#556677", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>
          Data Quality
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:z.quality_color }} />
          <div style={{ fontSize:12, color:z.quality_color, fontWeight:600 }}>{z.data_quality}</div>
        </div>
      </div>

      <div style={{ marginTop:12 }}>
        <div style={{ fontSize:9, color:"#556677", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>
          Product Category Rules
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {z.pcrs.map((pcr, i) => (
            <span key={i} style={{
              fontSize:10, padding:"3px 7px", borderRadius:4,
              background:"rgba(255,255,255,0.05)", color:"#8899aa", border:"1px solid #1a2a3c",
            }}>{pcr}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop:12, fontSize:11, lineHeight:1.6, color:"#8899aa" }}>
        {z.detail}
      </div>
    </div>
  );
}

// ============================================================
// ZONE LIST PANEL
// ============================================================
function ZoneList({ selectedZone, onZoneClick }) {
  const sorted = [...ZONES].sort((a, b) => b.co2e_kg - a.co2e_kg);

  return (
    <div style={{
      position: "absolute", left: 16, top: 80, bottom: 16, width: 260,
      background: "rgba(8,12,21,0.92)", borderRadius: 12, border: "1px solid #1a2a3c",
      padding: 12, overflowY: "auto", zIndex: 10,
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    }}>
      <div style={{ fontSize:10, color:"#556677", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10, fontWeight:700 }}>
        Vehicle Zones — by CO₂e
      </div>
      {sorted.map(z => (
        <div
          key={z.id}
          onClick={() => onZoneClick(z.id)}
          style={{
            padding:"7px 8px", borderRadius:6, marginBottom:3, cursor:"pointer",
            background: selectedZone === z.id ? "rgba(255,255,255,0.08)" : "transparent",
            border: selectedZone === z.id ? `1px solid ${z.color}44` : "1px solid transparent",
            transition: "all 0.15s",
          }}
        >
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:z.color, flexShrink:0 }} />
              <span style={{ fontSize:10, color: selectedZone === z.id ? "#e0e6ed" : "#778899", fontWeight: selectedZone === z.id ? 600 : 400 }}>
                {z.id === "kidney_grille" ? "★ " : ""}{z.name}
              </span>
            </div>
            <span style={{ fontSize:9, color:"#556", fontWeight:600 }}>{z.co2e_kg >= 1000 ? `${(z.co2e_kg/1000).toFixed(1)}t` : `${z.co2e_kg}kg`}</span>
          </div>
          <div style={{ marginTop:3, height:3, background:"#0a1520", borderRadius:2, overflow:"hidden", marginLeft:12 }}>
            <div style={{ height:"100%", width:`${Math.min(z.pct_of_total * 3.5, 100)}%`, background:z.color, opacity:0.6, borderRadius:2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// HEADER BAR
// ============================================================
function Header() {
  return (
    <div style={{
      position:"absolute", top:0, left:0, right:0, height:72, zIndex:20,
      background:"rgba(8,12,21,0.95)", borderBottom:"1px solid #1a2a3c",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 24px",
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    }}>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:"#e0e6ed", letterSpacing:0.5 }}>
          BMW iX xDrive45 — Carbon Data Layer
        </div>
        <div style={{ fontSize:10, color:"#556677", marginTop:2 }}>
          Source: BMW Vehicle Footprint Report (March 2025) · TÜV Rheinland verified · ISO 14040/44
        </div>
      </div>
      <div style={{ display:"flex", gap:24, alignItems:"center" }}>
        {[
          [VEHICLE_DATA.total_pcrs, "PCRs"],
          [`~${(VEHICLE_DATA.total_pcfs_est/1000).toFixed(0)}K`, "PCFs"],
          [`${VEHICLE_DATA.supply_chain_co2e_t}t`, "CO₂e cradle-to-gate"],
        ].map(([val, label], i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:700, color: i === 2 ? "#e74c3c" : "#4a9eff" }}>{val}</div>
            <div style={{ fontSize:8, color:"#556677", textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
          </div>
        ))}
        <div style={{ textAlign:"center", borderLeft:"1px solid #1a2a3c", paddingLeft:20 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#00ff88" }}>1</div>
          <div style={{ fontSize:8, color:"#00ff88", textTransform:"uppercase", letterSpacing:1 }}>Catena-X verified</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QUALITY LEGEND
// ============================================================
function QualityLegend() {
  return (
    <div style={{
      position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)", zIndex:20,
      display:"flex", gap:16, alignItems:"center",
      background:"rgba(8,12,21,0.9)", borderRadius:8, padding:"8px 16px",
      border:"1px solid #1a2a3c",
      fontFamily:"'JetBrains Mono', monospace",
    }}>
      <span style={{ fontSize:8, color:"#556677", textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>Data Quality:</span>
      {QUALITY_LEGEND.map((q, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:q.color }} />
          <span style={{ fontSize:9, color:"#778899" }}>{q.label}</span>
          <span style={{ fontSize:9, color:"#445566", fontWeight:600 }}>{q.pct}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SIMPLE 3D CANVAS (using raw Three.js since R3F may not be available)
// ============================================================
function Simple3DView({ onZoneClick, selectedZone }) {
  const containerRef = useRef(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  // Since we can't guarantee React Three Fiber availability,
  // render a stylized 2D representation with the 3D data
  return (
    <div ref={containerRef} style={{
      position:"absolute", left:290, right: selectedZone ? 410 : 16, top:80, bottom:50,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    }}>
      {/* SVG-based car visualization */}
      <svg viewBox="-250 -120 500 240" style={{ width:"100%", height:"100%", maxHeight:"100%" }}>
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3050" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0a1520" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a90d9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a3050" stopOpacity="0.15" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Ground line */}
        <line x1="-220" y1="75" x2="220" y2="75" stroke="#1a2a3c" strokeWidth="0.5" />

        {/* Wheels */}
        {[-145, 130].map((x, i) => (
          <g key={`w${i}`}>
            <circle cx={x} cy={62} r={28} fill="#0a0a0a" stroke="#333" strokeWidth="1.5" />
            <circle cx={x} cy={62} r={19} fill="none" stroke="#555" strokeWidth="1" />
            {[0,60,120,180,240,300].map(a => (
              <line key={a} x1={x} y1={62} x2={x + 15*Math.cos(a*Math.PI/180)} y2={62 + 15*Math.sin(a*Math.PI/180)} stroke="#444" strokeWidth="0.8" />
            ))}
          </g>
        ))}

        {/* Lower body */}
        <path d="M-190,35 L-190,-5 Q-190,-15 -180,-15 L180,-15 Q190,-15 190,-5 L190,35 Z" fill="url(#bodyGrad)" stroke="#1a3a5c" strokeWidth="0.8" />

        {/* Upper cabin */}
        <path d="M-110,-15 L-95,-60 Q-90,-70 -80,-70 L90,-70 Q95,-70 100,-65 L125,-15 Z" fill="url(#bodyGrad)" stroke="#1a3a5c" strokeWidth="0.8" />

        {/* Glass */}
        <path d="M-100,-17 L-88,-58 Q-85,-63 -78,-63 L88,-63 Q92,-63 95,-58 L118,-17 Z" fill="url(#glassGrad)" stroke="#4a90d966" strokeWidth="0.5" />

        {/* BATTERY PACK — main clickable zone */}
        <rect
          x={-150} y={32} width={300} height={22} rx={4}
          fill={selectedZone === "battery" ? "#e74c3c55" : hoveredZone === "battery" ? "#e74c3c33" : "#e74c3c18"}
          stroke={selectedZone === "battery" ? "#e74c3c" : "#e74c3c66"}
          strokeWidth={selectedZone === "battery" ? 2 : 1}
          style={{ cursor:"pointer" }}
          filter={selectedZone === "battery" ? "url(#glow)" : undefined}
          onClick={() => onZoneClick("battery")}
          onMouseEnter={() => setHoveredZone("battery")}
          onMouseLeave={() => setHoveredZone(null)}
        />
        <text x={0} y={47} textAnchor="middle" fill={selectedZone === "battery" ? "#e74c3c" : "#e74c3c99"} fontSize="7" fontFamily="monospace" fontWeight="600" style={{pointerEvents:"none"}}>HV BATTERY PACK · 373 kg · 4,382 kg CO₂e</text>

        {/* FRONT MOTOR */}
        <rect
          x={140} y={-5} width={40} height={30} rx={4}
          fill={selectedZone === "front_motor" ? "#3498db55" : hoveredZone === "front_motor" ? "#3498db33" : "#3498db18"}
          stroke={selectedZone === "front_motor" ? "#3498db" : "#3498db66"}
          strokeWidth={selectedZone === "front_motor" ? 2 : 1}
          style={{ cursor:"pointer" }}
          filter={selectedZone === "front_motor" ? "url(#glow)" : undefined}
          onClick={() => onZoneClick("front_motor")}
          onMouseEnter={() => setHoveredZone("front_motor")}
          onMouseLeave={() => setHoveredZone(null)}
        />
        <text x={160} y={14} textAnchor="middle" fill="#3498db99" fontSize="5" fontFamily="monospace" style={{pointerEvents:"none"}}>FRONT</text>
        <text x={160} y={20} textAnchor="middle" fill="#3498db99" fontSize="5" fontFamily="monospace" style={{pointerEvents:"none"}}>MOTOR</text>

        {/* REAR MOTOR */}
        <rect
          x={-180} y={-5} width={40} height={30} rx={4}
          fill={selectedZone === "rear_motor" ? "#3498db55" : hoveredZone === "rear_motor" ? "#3498db33" : "#3498db18"}
          stroke={selectedZone === "rear_motor" ? "#3498db" : "#3498db66"}
          strokeWidth={selectedZone === "rear_motor" ? 2 : 1}
          style={{ cursor:"pointer" }}
          filter={selectedZone === "rear_motor" ? "url(#glow)" : undefined}
          onClick={() => onZoneClick("rear_motor")}
          onMouseEnter={() => setHoveredZone("rear_motor")}
          onMouseLeave={() => setHoveredZone(null)}
        />
        <text x={-160} y={14} textAnchor="middle" fill="#3498db99" fontSize="5" fontFamily="monospace" style={{pointerEvents:"none"}}>REAR</text>
        <text x={-160} y={20} textAnchor="middle" fill="#3498db99" fontSize="5" fontFamily="monospace" style={{pointerEvents:"none"}}>MOTOR</text>

        {/* CFRP ROOF */}
        <rect
          x={-80} y={-72} width={170} height={6} rx={2}
          fill={selectedZone === "cfrp_roof" ? "#8e44ad55" : hoveredZone === "cfrp_roof" ? "#8e44ad33" : "#8e44ad18"}
          stroke={selectedZone === "cfrp_roof" ? "#8e44ad" : "#8e44ad66"}
          strokeWidth={selectedZone === "cfrp_roof" ? 2 : 0.8}
          style={{ cursor:"pointer" }}
          onClick={() => onZoneClick("cfrp_roof")}
          onMouseEnter={() => setHoveredZone("cfrp_roof")}
          onMouseLeave={() => setHoveredZone(null)}
        />
        <text x={5} y={-76} textAnchor="middle" fill="#8e44ad99" fontSize="5" fontFamily="monospace" style={{pointerEvents:"none"}}>CFRP ROOF</text>

        {/* KIDNEY GRILLE — THE CATENA-X POINT */}
        <rect
          x={186} y={-13} width={10} height={26} rx={3}
          fill={selectedZone === "kidney_grille" ? "#00ff8877" : "#00ff8844"}
          stroke="#00ff88"
          strokeWidth={selectedZone === "kidney_grille" ? 2.5 : 1.5}
          style={{ cursor:"pointer" }}
          filter="url(#glowStrong)"
          onClick={() => onZoneClick("kidney_grille")}
          onMouseEnter={() => setHoveredZone("kidney_grille")}
          onMouseLeave={() => setHoveredZone(null)}
        />
        {/* Catena-X label with arrow */}
        <line x1={196} y1={-20} x2={210} y2={-35} stroke="#00ff88" strokeWidth="0.8" strokeDasharray="2,2" />
        <text x={212} y={-37} fill="#00ff88" fontSize="6" fontFamily="monospace" fontWeight="700" style={{pointerEvents:"none"}}>★ CATENA-X</text>
        <text x={212} y={-30} fill="#00ff8899" fontSize="4.5" fontFamily="monospace" style={{pointerEvents:"none"}}>Only verified PCF</text>

        {/* BODY STRUCTURE — click on outline */}
        <path
          d="M-190,35 L-190,-5 Q-190,-15 -180,-15 L-110,-15 L-95,-60 Q-90,-70 -80,-70 L90,-70 Q95,-70 100,-65 L125,-15 L180,-15 Q190,-15 190,-5 L190,35 Z"
          fill="transparent"
          stroke={selectedZone === "body" ? "#95a5a6" : "transparent"}
          strokeWidth={selectedZone === "body" ? 2 : 0}
          style={{ cursor:"pointer" }}
          onClick={() => onZoneClick("body")}
          onMouseEnter={() => setHoveredZone("body")}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Headlights */}
        <rect x={186} y={-7} width={6} height={9} rx={1} fill="#4a7aff44" stroke="#4a7aff" strokeWidth="0.5" />
        <rect x={186} y={5} width={6} height={9} rx={1} fill="#4a7aff44" stroke="#4a7aff" strokeWidth="0.5" />

        {/* Tail light bar */}
        <rect x={-193} y={-5} width={4} height={30} rx={1} fill="#ff202033" stroke="#ff2020" strokeWidth="0.5" />

        {/* Clickable zone indicators for other systems */}
        {[
          { id:"electronics", x:10, y:-45, label:"ELECTRONICS" },
          { id:"interior", x:-40, y:-35, label:"INTERIOR" },
          { id:"thermal", x:100, y:-2, label:"THERMAL" },
          { id:"suspension", x:-145, y:{}, label:"SUSPENSION" },
          { id:"brakes", x:130, y:50, label:"BRAKES" },
          { id:"glazing", x:10, y:-65, label:"GLAZING" },
          { id:"safety", x:-50, y:-50, label:"SAFETY" },
          { id:"wheels", x:130, y:62, label:"WHEELS" },
          { id:"charging", x:-175, y:{}, label:"CHARGE" },
          { id:"polymers_misc", x:60, y:15, label:"POLYMERS" },
        ].map(item => {
          const y = typeof item.y === "number" ? item.y : 30;
          const zone = ZONES.find(z => z.id === item.id);
          if (!zone) return null;
          const isActive = selectedZone === item.id || hoveredZone === item.id;
          return (
            <g key={item.id}
              style={{ cursor:"pointer" }}
              onClick={() => onZoneClick(item.id)}
              onMouseEnter={() => setHoveredZone(item.id)}
              onMouseLeave={() => setHoveredZone(null)}
            >
              <circle cx={item.x} cy={y} r={isActive ? 5 : 3.5}
                fill={isActive ? zone.color + "44" : zone.color + "22"}
                stroke={zone.color} strokeWidth={isActive ? 1.2 : 0.6}
              />
              {isActive && (
                <text x={item.x} y={y - 8} textAnchor="middle" fill={zone.color} fontSize="5" fontFamily="monospace" fontWeight="600">
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {!selectedZone && (
        <div style={{
          position:"absolute", bottom:60, left:"50%", transform:"translateX(-50%)",
          fontSize:11, color:"#445566", fontFamily:"monospace",
          textAlign:"center",
        }}>
          Click any zone to explore its PCRs, PCFs, and data quality
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [selectedZone, setSelectedZone] = useState(null);

  const handleZoneClick = useCallback((id) => {
    setSelectedZone(prev => prev === id ? null : id);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#060a10", overflow: "hidden", position: "relative",
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    }}>
      {/* Background grid pattern */}
      <div style={{
        position:"absolute", inset:0, opacity:0.03,
        backgroundImage:"linear-gradient(#4a90d9 1px, transparent 1px), linear-gradient(90deg, #4a90d9 1px, transparent 1px)",
        backgroundSize:"40px 40px",
      }} />

      <Header />
      <ZoneList selectedZone={selectedZone} onZoneClick={handleZoneClick} />
      <Simple3DView onZoneClick={handleZoneClick} selectedZone={selectedZone} />
      <DataPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
      <QualityLegend />

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}
