import { useState, useCallback, useRef } from "react";

const F = {
  head: "'BPdots', 'Courier New', monospace",
  body: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

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
    pcrs:["Nickel Manganese Cobalt Cathode","Graphite Anode","Electrolyte","Separator","Cell Housing","Cell Manufacturing Energy","Pack Housing","Battery Management System","Thermal Management"],
    pcr_count:9, parts:60, weight_kg:373, co2e_kg:4382, pct_of_total:21.7,
    data_quality:"Generic Life Cycle Inventory / Estimate", quality_color:"#e67e22",
    detail:"The battery is the single largest carbon contributor. 15% of vehicle weight but ~22% of supply chain CO₂ equivalent. BMW uses ~50% secondary nickel and 100% secondary cobalt in cells. Cell manufacturing energy (~50-80 kWh per kWh of cells) is a major factor. BMW requires green electricity from cell suppliers." },
  { id:"front_motor", name:"Front Electric Motor + Inverter", position:[1.4,-0.25,0], size:[0.6,0.45,0.7], color:"#3498db",
    pcrs:["Traction Motor (no rare earth)","Power Electronics / Silicon Carbide Inverter","Reduction Gear"],
    pcr_count:3, parts:20, weight_kg:57, co2e_kg:742, pct_of_total:3.7,
    data_quality:"Estimate", quality_color:"#e67e22",
    detail:"BMW 5th gen eDrive — no permanent magnets, no rare earth elements. Excited synchronous motor with copper rotor windings. Silicon Carbide MOSFET inverter. Single-speed reduction gear integrated into motor housing." },
  { id:"rear_motor", name:"Rear Electric Motor + Inverter", position:[-1.4,-0.25,0], size:[0.6,0.45,0.7], color:"#3498db",
    pcrs:["Traction Motor (no rare earth)","Power Electronics / Silicon Carbide Inverter","Reduction Gear"],
    pcr_count:3, parts:20, weight_kg:58, co2e_kg:743, pct_of_total:3.7,
    data_quality:"Estimate", quality_color:"#e67e22",
    detail:"Identical architecture to front motor. Together the dual motors produce 300 kW (408 hp). The power electronics (Silicon Carbide inverters) have very high CO₂ equivalent per kg due to semiconductor fabrication." },
  { id:"body", name:"Body Structure", position:[0,0.1,0], size:[3.6,0.7,1.6], color:"#95a5a6",
    pcrs:["Hot-rolled Steel","Cold-rolled Steel","Galvanized Steel","Advanced High-Strength Steel","Steel Forgings","Steel Tubes","Stainless Steel","Fasteners","Springs","Aluminum Castings","Aluminum Extrusions","Aluminum Sheet","Paint/Coatings","Adhesives","Cavity Wax"],
    pcr_count:15, parts:2000, weight_kg:1050, co2e_kg:5700, pct_of_total:28.2,
    data_quality:"Industry Average / Supplier Environmental Product Declaration", quality_color:"#f1c40f",
    detail:"27% steel/iron + 30% aluminum by weight. The body-in-white is the second largest carbon contributor. The ratio of primary to secondary aluminum is the decisive variable — BMW reports using 30-40% secondary aluminum for some components. Steel suppliers like ArcelorMittal publish facility-specific Environmental Product Declarations." },
  { id:"cfrp_roof", name:"Carbon Fibre Reinforced Polymer Roof Panel", position:[0,0.55,0], size:[1.8,0.05,1.3], color:"#8e44ad",
    pcrs:["Carbon Fibre Reinforced Polymer"],
    pcr_count:1, parts:5, weight_kg:15, co2e_kg:375, pct_of_total:1.9,
    data_quality:"Generic Life Cycle Inventory", quality_color:"#e67e22",
    detail:"Signature BMW iX feature. Carbon fibre production is extremely energy intensive (~25 kg CO₂ equivalent per kg) — polyacrylonitrile precursor pyrolysis at 1000-1500°C. Only 15 kg but contributes almost 2% of supply chain footprint." },
  { id:"wheels", name:"Wheels & Tires", position:[0,-0.6,0], size:[0.1,0.1,0.1], color:"#2ecc71",
    pcrs:["Cast Aluminum Wheels","Pneumatic Tires","Bearings"],
    pcr_count:3, parts:12, weight_kg:96, co2e_kg:596, pct_of_total:3.0,
    data_quality:"Industry Average / Supplier Environmental Product Declaration", quality_color:"#f1c40f",
    detail:"4x large 20-22 inch alloy wheels (~12 kg each). Continental and Bridgestone publish tire-level carbon data. Wheel bearing data from SKF Environmental Product Declarations." },
  { id:"electronics", name:"Electronics & Wiring", position:[0,0.2,0], size:[0.1,0.1,0.1], color:"#e67e22",
    pcrs:["Printed Circuit Boards","Semiconductor Integrated Circuits","Display Panels","Sensors","Small Motors","Wiring Harness","Antenna/Connectivity"],
    pcr_count:7, parts:1800, weight_kg:66, co2e_kg:1006, pct_of_total:5.0,
    data_quality:"Estimate", quality_color:"#c0392b",
    detail:"Only 66 kg but ~5% of carbon footprint. Semiconductors have extreme CO₂ equivalent per kg (>200 kg CO₂e/kg) due to fabrication energy. The iX uses BMW's new zonal electrical architecture with fewer Electronic Control Units but more compute." },
  { id:"interior", name:"Interior (Seats, Trim, Noise/Vibration/Harshness)", position:[0,0.15,0], size:[0.1,0.1,0.1], color:"#1abc9c",
    pcrs:["Polyurethane Foam","Synthetic Textiles","Carpet","Instrument Panel Assembly","Door Trim","Seat Structures","Acoustic Insulation","Audio System"],
    pcr_count:8, parts:400, weight_kg:165, co2e_kg:749, pct_of_total:3.7,
    data_quality:"Generic Life Cycle Inventory / Estimate", quality_color:"#e67e22",
    detail:"BMW moving to 100% vegan interiors — no leather. This reduces carbon by ~80% vs leather per BMW. Extra Noise/Vibration/Harshness insulation needed because electric vehicles have no engine noise to mask road noise." },
  { id:"thermal", name:"Thermal & HVAC System", position:[1.0,0.0,0], size:[0.1,0.1,0.1], color:"#16a085",
    pcrs:["Heat Exchangers","Heat Pump","Coolant","Refrigerant","Rubber Hoses"],
    pcr_count:5, parts:105, weight_kg:48, co2e_kg:311, pct_of_total:1.5,
    data_quality:"Industry Average / Generic Life Cycle Inventory", quality_color:"#f1c40f",
    detail:"More heat exchangers in an electric vehicle than internal combustion engine — battery chiller, motor coolers, cabin system. Heat pump standard on iX, critical for winter range." },
  { id:"suspension", name:"Suspension & Steering", position:[0,-0.35,0], size:[0.1,0.1,0.1], color:"#2980b9",
    pcrs:["Steel Forgings","Aluminum Castings","Air Suspension","Vibration Dampeners","Electric Power Steering System","Bearings"],
    pcr_count:6, parts:220, weight_kg:39, co2e_kg:209, pct_of_total:1.0,
    data_quality:"Industry Average / Estimate", quality_color:"#f1c40f",
    detail:"Air suspension standard on iX — heavier than coil springs but adds compressor, valve block, air springs. Aluminum suspension arms. Electric power steering." },
  { id:"brakes", name:"Brake System", position:[0,-0.45,0], size:[0.1,0.1,0.1], color:"#7f8c8d",
    pcrs:["Cast Iron Rotors","Brake Pads","Brake Calipers","Brake Fluid"],
    pcr_count:4, parts:60, weight_kg:68, co2e_kg:191, pct_of_total:0.9,
    data_quality:"Industry Average", quality_color:"#f1c40f",
    detail:"Less brake wear in electric vehicles due to regenerative braking — the motors slow the car first. Aluminum front calipers, cast iron rotors." },
  { id:"glazing", name:"Glass & Glazing", position:[0,0.4,0], size:[0.1,0.1,0.1], color:"#bdc3c7",
    pcrs:["Laminated Windshield","Tempered Glass","Panoramic Roof Glass"],
    pcr_count:3, parts:11, weight_kg:44, co2e_kg:97, pct_of_total:0.5,
    data_quality:"Industry Average", quality_color:"#27ae60",
    detail:"Large panoramic glass roof with electrochromic Sky Lounge dimming. Head-up display-compatible windshield. Relatively low carbon intensity per kg but significant total weight." },
  { id:"safety", name:"Safety Systems", position:[0,0.3,0], size:[0.1,0.1,0.1], color:"#e74c3c",
    pcrs:["Airbag Systems","Seatbelt Systems"],
    pcr_count:2, parts:45, weight_kg:15, co2e_kg:171, pct_of_total:0.8,
    data_quality:"Estimate", quality_color:"#c0392b",
    detail:"Airbags (front, side, curtain, knee), pretensioners, load limiters. Complex pyrotechnic and textile assemblies. Difficult to get supplier-specific data." },
  { id:"kidney_grille", name:"Kidney Grille ★ Catena-X Verified", position:[1.85,0.15,0], size:[0.15,0.2,0.5], color:"#00ff88",
    pcrs:["Kidney Grille Assembly (Covestro material)"],
    pcr_count:1, parts:3, weight_kg:2, co2e_kg:8, pct_of_total:0.04,
    data_quality:"Primary (Catena-X)", quality_color:"#00ff88",
    detail:"★ THE ONE DATA POINT. In 2024, BMW demonstrated a complete cradle-to-gate Product Carbon Footprint (PCF) for this component using Catena-X. Real CO₂ data flowed from Covestro through the supply chain to BMW's Landshut plant, using Catena-X-certified tools from Siemens. This is the ONLY component in the vehicle with demonstrated primary, facility-level data. 1 out of ~30,000 parts." },
  { id:"charging", name:"Charging System", position:[-1.6,0.1,-0.6], size:[0.1,0.1,0.1], color:"#f39c12",
    pcrs:["Combined Charging System Inlet","Onboard Charger"],
    pcr_count:2, parts:5, weight_kg:3, co2e_kg:24, pct_of_total:0.1,
    data_quality:"Estimate", quality_color:"#e67e22",
    detail:"Combined Charging System (CCS) fast charging up to 200 kW. 10-80% in under 40 minutes. 11 kW onboard alternating current charger." },
  { id:"polymers_misc", name:"Other Polymers & Materials", position:[0,0,0], size:[0.1,0.1,0.1], color:"#9b59b6",
    pcrs:["Polypropylene Components","Polyamide/Nylon","ABS/Polycarbonate Blends","Polyethylene Components","PBT/PET","PMMA/PC Glazing","Rubber Seals","12V Battery","Filters"],
    pcr_count:9, parts:600, weight_kg:186, co2e_kg:689, pct_of_total:3.4,
    data_quality:"Industry Average / Generic Life Cycle Inventory", quality_color:"#f1c40f",
    detail:"The long tail of polymer and miscellaneous components — bumper fascias, wire loom, seal systems, connectors, sensor housings, light lenses, cabin filter. Individually small but collectively ~3.4% of footprint." },
];

const QUALITY_LEGEND = [
  { label: "Primary (Catena-X)", color: "#00ff88", pct: "~0.1%" },
  { label: "Supplier Environmental Product Declaration (EPD)", color: "#3498db", pct: "~10%" },
  { label: "Industry Average", color: "#f1c40f", pct: "~35%" },
  { label: "Generic Life Cycle Inventory (LCI)", color: "#e67e22", pct: "~37%" },
  { label: "Estimate / Proxy", color: "#c0392b", pct: "~18%" },
];

const GLOSSARY = [
  { term: "PCR", full: "Product Category Rule", def: "A standardised rulebook defining how to calculate the carbon footprint of a specific product category — e.g. all steel sheets, or all lithium-ion battery cells. Without a Product Category Rule, two companies measuring the same component would get different numbers. The BMW iX has ~80 PCRs governing its ~30,000 parts." },
  { term: "PCF", full: "Product Carbon Footprint", def: "The total greenhouse gas emissions across a product's supply chain, from raw material extraction to factory gate (cradle-to-gate) or end of life (cradle-to-grave). Expressed in kg or tonnes of CO₂ equivalent (CO₂e). The iX has ~3,000 estimated Product Carbon Footprints — only 1 is verified primary data." },
  { term: "LCA", full: "Life Cycle Assessment", def: "A methodology for quantifying the environmental impact of a product across its entire life — extraction, manufacturing, use, and disposal. BMW's published Life Cycle Assessment for the iX is TUV Rheinland verified, following ISO 14040/44." },
  { term: "CO₂e", full: "CO₂ equivalent", def: "A unit expressing all greenhouse gases (CO₂, methane, nitrous oxide, etc.) in terms of the equivalent warming effect of CO₂. The iX has a 32.9t CO₂ equivalent lifecycle footprint on the EU grid, of which 20.2t is the supply chain (embodied carbon)." },
  { term: "EPD", full: "Environmental Product Declaration", def: "A standardised, third-party-verified document disclosing the environmental impact of a product including its carbon footprint. Steel suppliers like ArcelorMittal publish facility-specific Environmental Product Declarations. ~10% of the iX supply chain is traceable to named supplier EPDs." },
  { term: "LCI", full: "Life Cycle Inventory", def: "The data collection phase of a Life Cycle Assessment — cataloguing all inputs (energy, materials) and outputs (emissions, waste) for each supply chain process. Generic Life Cycle Inventory databases (ecoinvent, GaBi) are used when supplier-specific data is unavailable. ~37% of the iX dataset uses generic LCI data." },
  { term: "Catena-X", full: "Catena-X Automotive Network", def: "An industry-wide data ecosystem for the automotive sector enabling secure, standardised exchange of supply chain data. In 2024, BMW used Catena-X to get a verified Product Carbon Footprint for the iX kidney grille — real emissions data flowing from Covestro to BMW's Landshut plant, verified by Siemens-certified tooling. The only primary data point in this dataset." },
  { term: "NMC", full: "Nickel Manganese Cobalt", def: "The cathode chemistry used in the BMW iX battery cells. BMW sources ~50% secondary (recycled) nickel and 100% secondary cobalt, reducing the battery's carbon footprint by ~0.5t CO₂ equivalent vs virgin materials." },
  { term: "CFRP", full: "Carbon Fibre Reinforced Polymer", def: "Lightweight composite used for the iX's signature roof panel. Extremely energy-intensive to produce (~25 kg CO₂e per kg) due to high-temperature polyacrylonitrile precursor pyrolysis. The 15 kg roof contributes ~375 kg CO₂ equivalent — nearly 2% of the entire supply chain footprint." },
  { term: "dMRV", full: "Digital Monitoring, Reporting & Verification", def: "Use of digital sensors, continuous data streams, and cryptographic verification to replace manual, sampled emissions reporting. The Carbon Computer (dexdogs) builds digital MRV infrastructure for industrial facilities — closing the same data quality gap visible in this dataset." },
  { term: "TUV", full: "Technischer Uberwachungsverein", def: "German independent testing and certification body. BMW's iX Life Cycle Assessment is TUV Rheinland verified — meaning methodology and data have been audited by a third party. This is the gold standard for automotive Life Cycle Assessment credibility." },
  { term: "ISO 14040/44", full: "ISO Life Cycle Assessment Standards", def: "International standards governing how Life Cycle Assessments must be conducted and reported. ISO 14040 sets the framework; ISO 14044 adds requirements for critical review. BMW's iX LCA is declared compliant with both." },
  { term: "BMS", full: "Battery Management System", def: "The electronic system monitoring and managing a battery pack — tracking cell voltages, temperatures, and state of charge. Critical for safety and longevity of the high-voltage battery in electric vehicles." },
  { term: "NVH", full: "Noise, Vibration & Harshness", def: "A measure of the quality of sound and vibration felt inside a vehicle. Electric vehicles require additional NVH insulation because the absence of engine noise makes road and tyre noise more perceptible." },
];

const INFO_SECTIONS = [
  { title: "What is this dataset?", content: "This is a Phase 1 carbon data layer for the BMW iX xDrive45 — an electric SUV with a TUV-verified lifecycle footprint of 32.9 tonnes CO₂ equivalent on the EU electricity grid. The dataset maps ~80 Product Category Rules (PCRs) to 15 vehicle zones, estimates ~3,000 individual Product Carbon Footprints (PCFs), and anchors everything to BMW's own published Vehicle Footprint Report, verified to ISO 14040/44." },
  { title: "Why does the Catena-X data point matter?", content: "In 2024, BMW and Covestro demonstrated a complete, verified Product Carbon Footprint (PCF) for the iX kidney grille using the Catena-X automotive data network — real emissions data flowing from material supplier to BMW's Landshut plant, verified by Siemens-certified tooling. That is 1 component out of ~30,000 parts. 1 verified carbon footprint out of ~3,000 estimated ones. The kidney grille glows green because it is the single data point that proves the gap." },
  { title: "What does the data quality breakdown mean?", content: "Each zone is rated by how its carbon estimate was derived. Primary (Catena-X) means facility-level, cryptographically verified data — the gold standard. Supplier Environmental Product Declaration (EPD) means a third-party-verified declaration from a named supplier. Industry Average means published sectoral averages. Generic Life Cycle Inventory (LCI) means database proxies from ecoinvent or GaBi. Estimate means engineering judgement with no supplier data. The battery pack — the largest carbon contributor at ~22% of supply chain emissions — sits at Generic LCI / Estimate." },
  { title: "Why does this matter for carbon markets?", content: "Carbon credits and corporate net-zero claims are only as credible as the underlying measurement data. The iX is arguably the most data-intensive consumer product on the planet — yet 90% of its supply chain carbon is still estimated from industry averages. If a BMW iX has this problem, every industrial facility, every traded product, and every carbon credit has the same problem. The solution is not better software — it is better measurement infrastructure at the source. That is what the Carbon Computer (dexdogs) is building." },
];

function DataPanel({ zone, onClose }) {
  if (!zone) return null;
  const z = ZONES.find(zn => zn.id === zone);
  if (!z) return null;
  const isCatenaX = z.id === "kidney_grille";
  return (
    <div style={{ position:"absolute", right:16, top:80, bottom:16, width:380, background:"rgba(8,12,21,0.95)", borderRadius:12, border:`1px solid ${isCatenaX?"#00ff88":"#1a3a5c"}`, padding:20, overflowY:"auto", zIndex:10, boxShadow:isCatenaX?"0 0 30px rgba(0,255,136,0.15)":"0 0 20px rgba(0,0,0,0.5)", fontFamily:"'Space Grotesk', sans-serif" }}>
      <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", color:"#556", fontSize:18, cursor:"pointer", padding:4 }}>✕</button>
      {isCatenaX && <div style={{ background:"rgba(0,255,136,0.08)", border:"1px solid #00ff8844", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:10, color:"#00ff88", letterSpacing:1, textTransform:"uppercase", fontWeight:700 }}>★ Catena-X Verified Data Point</div>}
      <div style={{ fontSize:15, fontWeight:700, color:z.color, marginBottom:4 }}>{z.name}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
        {[[z.pcr_count,"Product Category Rules (PCRs)"],[z.parts.toLocaleString(),"Parts"],[`${z.weight_kg} kg`,"Weight"],[`${z.co2e_kg.toLocaleString()} kg`,"CO₂ equivalent"]].map(([val,label],i)=>(
          <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"8px 10px" }}>
            <div style={{ fontSize:18, fontWeight:700, color:"#e0e6ed" }}>{val}</div>
            <div style={{ fontSize:9, color:"#556677", letterSpacing:0.5 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, padding:"8px 10px", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize:9, color:"#556677", letterSpacing:0.5, marginBottom:4 }}>% of Vehicle Supply Chain CO₂ equivalent</div>
        <div style={{ height:6, background:"#0a1520", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min(z.pct_of_total*3,100)}%`, background:z.color, borderRadius:3 }} />
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"#e0e6ed", marginTop:4 }}>{z.pct_of_total}%</div>
      </div>
      <div style={{ marginTop:12, padding:"8px 10px", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize:9, color:"#556677", letterSpacing:0.5, marginBottom:4 }}>Data Quality</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:z.quality_color }} />
          <div style={{ fontSize:12, color:z.quality_color, fontWeight:600 }}>{z.data_quality}</div>
        </div>
      </div>
      <div style={{ marginTop:12 }}>
        <div style={{ fontSize:9, color:"#556677", letterSpacing:0.5, marginBottom:6 }}>Product Category Rules (PCRs) governing this zone</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {z.pcrs.map((pcr,i)=>(<span key={i} style={{ fontSize:10, padding:"3px 7px", borderRadius:4, background:"rgba(255,255,255,0.05)", color:"#8899aa", border:"1px solid #1a2a3c" }}>{pcr}</span>))}
        </div>
      </div>
      <div style={{ marginTop:12, fontSize:12, lineHeight:1.7, color:"#8899aa" }}>{z.detail}</div>
    </div>
  );
}


function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const subject = encodeURIComponent(`[BMW iX Carbon Explorer] ${type.charAt(0).toUpperCase()+type.slice(1)} Feedback`);
    const body = encodeURIComponent(`Name: ${name||"Anonymous"}\nType: ${type}\n\n${message}`);
    window.open(`mailto:ankur@dexdogs.earth?subject=${subject}&body=${body}`);
    setOpen(false);
    setName(""); setMessage(""); setType("general");
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid #1a2a3c",
    borderRadius:6, padding:"7px 10px", color:"#ccd6e0", fontSize:11,
    fontFamily:"'Space Grotesk',sans-serif", outline:"none", boxSizing:"border-box",
  };

  return (
    <>
      <button onClick={()=>setOpen(v=>!v)} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${open?"#4a9eff":"#1a2a3c"}`, background:open?"rgba(74,158,255,0.1)":"rgba(8,12,21,0.9)", color:open?"#4a9eff":"#556677", cursor:"pointer", fontSize:13 }} title="Feedback">✉</button>

      {open && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, bottom:0,
          background:"rgba(0,0,0,0.6)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center",
        }} onClick={()=>setOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:340, background:"rgba(8,12,21,0.98)", border:"1px solid #1a2a3c",
            borderRadius:12, padding:24, fontFamily:"'Space Grotesk',sans-serif",
            boxShadow:"0 20px 60px rgba(0,0,0,0.8)",
          }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#ccd6e0" }}>Info & Feedback</div>
                <div style={{ fontSize:10, color:"#445566", marginTop:2 }}>BMW iX Carbon Data Layer · dexdogs</div>
              </div>
              <button onClick={()=>setOpen(false)} style={{ background:"none", border:"none", color:"#445566", cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
            </div>

            {/* dexdogs link */}
            <div style={{ background:"rgba(74,158,255,0.06)", border:"1px solid #1a2a3c", borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#4a9eff", fontWeight:600, marginBottom:4 }}>dexdogs.earth</div>
              <div style={{ fontSize:10, color:"#556677", marginBottom:10 }}>Environmental data infrastructure for carbon markets and industrial decarbonization.</div>
              <a href="https://dexdogs.earth" target="_blank" rel="noreferrer" style={{ fontSize:10, color:"#4a9eff", textDecoration:"none", fontWeight:600 }}>Visit site →</a>
            </div>

            {/* Feedback form */}
            <div style={{ fontSize:11, fontWeight:600, color:"#778899", marginBottom:12 }}>Send Feedback</div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:"#445566", marginBottom:4 }}>Name (optional)</div>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:"#445566", marginBottom:6 }}>Type</div>
              <div style={{ display:"flex", gap:6 }}>
                {["general","bug","data","feature"].map(t => (
                  <button key={t} onClick={()=>setType(t)} style={{
                    flex:1, padding:"5px 0", borderRadius:6, cursor:"pointer", fontSize:9, fontWeight:600,
                    border:`1px solid ${type===t?"#4a9eff":"#1a2a3c"}`,
                    background: type===t?"rgba(74,158,255,0.15)":"transparent",
                    color: type===t?"#4a9eff":"#445566",
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:"#445566", marginBottom:4 }}>Message</div>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Your feedback..." rows={4} style={{...inputStyle, resize:"vertical"}} />
            </div>

            <button onClick={handleSend} disabled={!message.trim()} style={{
              width:"100%", padding:"9px 0", borderRadius:8, cursor:message.trim()?"pointer":"not-allowed",
              border:"1px solid #1a3a5c", background:message.trim()?"rgba(74,158,255,0.15)":"transparent",
              color:message.trim()?"#4a9eff":"#334455", fontSize:11, fontWeight:600,
              fontFamily:"'Space Grotesk',sans-serif",
            }}>Send via Email — ankur@dexdogs.earth</button>
          </div>
        </div>
      )}
    </>
  );
}

function ZoneList({ selectedZone, onZoneClick, onZoneHover }) {
  const sorted = [...ZONES].sort((a,b)=>b.co2e_kg-a.co2e_kg);
  return (
    <div style={{ position:"absolute", left:16, top:80, bottom:16, width:260, background:"rgba(8,12,21,0.92)", borderRadius:12, border:"1px solid #1a2a3c", padding:12, overflowY:"auto", zIndex:10, fontFamily:"'Space Grotesk', sans-serif" }}>
      <div style={{ fontSize:10, color:"#556677", letterSpacing:1.5, marginBottom:10, fontWeight:700, textTransform:"uppercase" }}>Vehicle Zones — by CO₂ equivalent</div>
      {sorted.map(z=>(
        <div key={z.id} onClick={()=>onZoneClick(z.id)} onMouseEnter={()=>onZoneHover&&onZoneHover(z.id)} onMouseLeave={()=>onZoneHover&&onZoneHover(null)} style={{ padding:"7px 8px", borderRadius:6, marginBottom:3, cursor:"pointer", background:selectedZone===z.id?"rgba(255,255,255,0.08)":"transparent", border:selectedZone===z.id?`1px solid ${z.color}44`:"1px solid transparent", transition:"all 0.15s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:z.color, flexShrink:0 }} />
              <span style={{ fontSize:10, color:selectedZone===z.id?"#e0e6ed":"#778899", fontWeight:selectedZone===z.id?600:400 }}>{z.id==="kidney_grille"?"★ ":""}{z.name}</span>
            </div>
            <span style={{ fontSize:9, color:"#556", fontWeight:600, fontFamily:"monospace" }}>{z.co2e_kg>=1000?`${(z.co2e_kg/1000).toFixed(1)}t`:`${z.co2e_kg}kg`}</span>
          </div>
          <div style={{ marginTop:3, height:3, background:"#0a1520", borderRadius:2, overflow:"hidden", marginLeft:12 }}>
            <div style={{ height:"100%", width:`${Math.min(z.pct_of_total*3.5,100)}%`, background:z.color, opacity:0.6, borderRadius:2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Header() {
  return (
    <div style={{ position:"absolute", top:0, left:0, right:0, height:72, zIndex:20, background:"rgba(8,12,21,0.95)", borderBottom:"1px solid #1a2a3c", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", fontFamily:"'Space Grotesk', sans-serif" }}>
      <div>
        <div style={{ fontSize:16, fontWeight:700, color:"#e0e6ed", letterSpacing:0.5 }}>BMW iX xDrive45 — Carbon Data Layer</div>
        <div style={{ fontSize:10, color:"#556677", marginTop:2 }}>Source: BMW Vehicle Footprint Report · TÜV Rheinland verified · ISO 14040/44</div>
      </div>
      <div style={{ display:"flex", gap:24, alignItems:"center" }}>
        {[
          ["~30,000","Total Parts"],
          [VEHICLE_DATA.total_pcrs,"Product Category Rules (PCRs)"],
          [`~${VEHICLE_DATA.total_pcfs_est.toLocaleString()}`,"Product Carbon Footprints (PCFs)"],
          [`${VEHICLE_DATA.supply_chain_co2e_t}t`,"CO₂ equivalent, cradle-to-gate"],
        ].map(([val,label],i)=>(
          <div key={i} style={{ textAlign:"center", maxWidth:130 }}>
            <div style={{ fontSize:18, fontWeight:700, color:i===2?"#e74c3c":"#4a9eff" }}>{val}</div>
            <div style={{ fontSize:9, color:"#556677", lineHeight:1.3 }}>{label}</div>
          </div>
        ))}
        <div style={{ textAlign:"center", borderLeft:"1px solid #1a2a3c", paddingLeft:20 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#00ff88" }}>1</div>
          <div style={{ fontSize:9, color:"#00ff88", lineHeight:1.3 }}>Catena-X verified component</div>
        </div>
      </div>
    </div>
  );
}

function QualityLegend() {
  return (
    <div style={{ position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)", zIndex:20, display:"flex", gap:10, alignItems:"center", background:"rgba(8,12,21,0.9)", borderRadius:8, padding:"8px 14px", border:"1px solid #1a2a3c", fontFamily:"'Space Grotesk', sans-serif", flexWrap:"wrap", maxWidth:"90vw" }}>
      <span style={{ fontSize:8, color:"#556677", textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>Data Quality:</span>
      {QUALITY_LEGEND.map((q,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:q.color }} />
          <span style={{ fontSize:8, color:"#778899" }}>{q.label}</span>
          <span style={{ fontSize:8, color:"#445566", fontWeight:600 }}>{q.pct}</span>
        </div>
      ))}
    </div>
  );
}

function CarView({ onZoneClick, selectedZone, hoveredZone: externalHover }) {
  const [view, setView] = useState("front_angle");
  const [clicking, setClicking] = useState(false);
  const [clickResult, setClickResult] = useState(null);
  const [clickPos, setClickPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef(null);

  const VIEWS = [
    { id:"front_angle", label:"Front", src:"/images/bmw-ix-front-angle.jpg",
      desc:"Front three-quarter angle. Front-left of car visible. Kidney grille prominent front-left. Hood, windshield, A-pillar, front wheel, headlights, front bumper, side mirror all visible. Right side body and rear wheel also visible." },
    { id:"back_angle",  label:"Rear",  src:"/images/bmw-ix-back-angle.jpg",
      desc:"Rear three-quarter angle. Rear-left of car visible. Full-width taillight bar prominent. Rear bumper, diffuser, rear glass, CFRP roof panel, rear wheel well, rear quarter panel visible. Right side body and front wheel also visible." },
  ];

  const handlePhotoClick = async (e) => {
    if (loading) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width)  * 100);
    const yPct = Math.round(((e.clientY - rect.top)  / rect.height) * 100);
    setClickPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setLoading(true);
    setClickResult(null);

    const currentView = VIEWS.find(v => v.id === view);

    try {
      const pcrResp = await fetch("/pcr_data.json");
      const pcrData = await pcrResp.json();

      const prompt = `You are an expert in automotive carbon accounting for the BMW iX xDrive45.

The user clicked on a photo of the BMW iX at position x=${xPct}%, y=${yPct}% (percentage of image width/height, origin top-left).

Photo description: ${currentView.desc}

Based on this click position, identify what part or component of the car the user most likely clicked on. Consider the 3D geometry of the car from this angle.

Here is the full PCR (Product Category Rules) dataset for this vehicle — 80 entries:
${JSON.stringify(pcrData)}

Return ONLY a JSON object with this exact structure, no markdown, no explanation:
{
  "clicked_part": "short name of what was clicked (e.g. Kidney Grille, Front Wheel, Hood, Battery Pack)",
  "confidence": "high|medium|low",
  "reasoning": "one sentence explaining why",
  "matching_pcrs": [
    {
      "id": "PCR-XXX",
      "name": "...",
      "category": "...",
      "zone": "...",
      "components": "...",
      "pcf_kg": 000,
      "quality": "...",
      "weight_kg": 000,
      "relevance": "one sentence why this PCR matches"
    }
  ]
}

Return 2-5 most relevant PCRs. matching_pcrs must be actual entries from the dataset above.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setClickResult(parsed);
    } catch(err) {
      setClickResult({ error: "Could not identify part. Try clicking again." });
    }
    setLoading(false);
  };

  const qualityColor = (q) => {
    if (!q) return "#445566";
    if (q.includes("Catena")) return "#00ff88";
    if (q.includes("Supplier")) return "#4a9eff";
    if (q.includes("Industry")) return "#f39c12";
    if (q.includes("Generic")) return "#e67e22";
    return "#e74c3c";
  };

  return (
    <div style={{
      position:"absolute", left:290, right:selectedZone?410:16, top:80, bottom:50,
      display:"flex", flexDirection:"column", background:"#000",
    }}>
      {/* View switcher */}
      <div style={{ display:"flex", gap:8, padding:"6px 12px", justifyContent:"center", flexShrink:0 }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={()=>{ setView(v.id); setClickResult(null); setClickPos(null); }} style={{
            padding:"4px 28px", borderRadius:6, cursor:"pointer",
            fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600,
            border:`1px solid ${view===v.id?"#4a9eff":"#1a2a3c"}`,
            background: view===v.id?"rgba(74,158,255,0.15)":"transparent",
            color: view===v.id?"#4a9eff":"#445566",
            transition:"all 0.15s",
          }}>{v.label}</button>
        ))}
      </div>

      {/* Photo + result row */}
      <div style={{ flex:1, display:"flex", minHeight:0, gap:0 }}>

        {/* Photo */}
        <div style={{ flex: clickResult ? "0 0 55%" : "1", position:"relative", cursor: loading ? "wait" : "crosshair", transition:"flex 0.3s" }}
          onClick={handlePhotoClick}
        >
          <img
            ref={imgRef}
            key={view}
            src={VIEWS.find(v=>v.id===view).src}
            alt={"BMW iX " + view}
            style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block" }}
          />

          {/* Click marker */}
          {clickPos && (
            <div style={{
              position:"absolute",
              left: clickPos.x - 8, top: clickPos.y - 8,
              width:16, height:16, borderRadius:"50%",
              border:"2px solid white",
              background: loading ? "rgba(74,158,255,0.4)" : "rgba(255,255,255,0.2)",
              pointerEvents:"none",
              transition:"background 0.2s",
            }}/>
          )}

          {/* Loading spinner overlay */}
          {loading && (
            <div style={{
              position:"absolute", inset:0,
              background:"rgba(0,0,0,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
              pointerEvents:"none",
            }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                border:"2px solid #1a2a3c",
                borderTop:"2px solid #4a9eff",
                animation:"spin 0.8s linear infinite",
              }}/>
            </div>
          )}

          {/* Instruction hint */}
          {!clickResult && !loading && (
            <div style={{
              position:"absolute", bottom:12, left:0, right:0,
              textAlign:"center", pointerEvents:"none",
            }}>
              <div style={{
                display:"inline-block",
                background:"rgba(2,5,12,0.8)",
                border:"1px solid #1a2a3c",
                borderRadius:6, padding:"5px 14px",
                fontSize:10, color:"#445566",
                fontFamily:"'Space Grotesk',sans-serif",
              }}>
                Click anywhere on the car to identify the part &amp; its carbon data
              </div>
            </div>
          )}
        </div>

        {/* Result panel */}
        {clickResult && !clickResult.error && (
          <div style={{
            flex:"0 0 45%", overflowY:"auto",
            background:"#020508", borderLeft:"1px solid #0d1a2a",
            padding:"14px 12px",
          }}>
            {/* Part identified */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:"#2a4a6a", fontFamily:"'Space Grotesk',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>
                Part Identified
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:"#e0eeff", fontFamily:"'Space Grotesk',sans-serif" }}>
                {clickResult.clicked_part}
              </div>
              <div style={{ fontSize:9, color:"#334455", fontFamily:"'Space Grotesk',sans-serif", marginTop:3 }}>
                {clickResult.reasoning}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
                <div style={{
                  fontSize:8, fontWeight:600, padding:"2px 7px", borderRadius:3,
                  background: clickResult.confidence==="high"?"rgba(0,255,136,0.1)":clickResult.confidence==="medium"?"rgba(74,158,255,0.1)":"rgba(231,76,60,0.1)",
                  color: clickResult.confidence==="high"?"#00ff88":clickResult.confidence==="medium"?"#4a9eff":"#e74c3c",
                  border:`1px solid ${clickResult.confidence==="high"?"#00ff8833":clickResult.confidence==="medium"?"#4a9eff33":"#e74c3c33"}`,
                  fontFamily:"'Space Grotesk',sans-serif", textTransform:"uppercase", letterSpacing:"0.08em",
                }}>
                  {clickResult.confidence} confidence
                </div>
                <div style={{ fontSize:8, color:"#2a3a4a", fontFamily:"'Space Grotesk',sans-serif" }}>
                  {clickResult.matching_pcrs?.length} PCRs matched
                </div>
              </div>
            </div>

            <div style={{ borderTop:"1px solid #0d1a2a", marginBottom:10 }}/>

            {/* Matched PCRs */}
            <div style={{ fontSize:9, color:"#2a4a6a", fontFamily:"'Space Grotesk',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
              Matched Product Category Rules
            </div>
            {(clickResult.matching_pcrs || []).map((pcr, i) => (
              <div key={i} style={{
                marginBottom:8, padding:"8px 10px",
                background:"rgba(4,10,20,0.8)",
                border:"1px solid #0d1a2a",
                borderRadius:5,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:3 }}>
                  <div style={{ fontSize:8, color:"#2a4a6a", fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{pcr.id}</div>
                  <div style={{
                    fontSize:7, padding:"1px 5px", borderRadius:2, fontWeight:600,
                    color: qualityColor(pcr.quality),
                    background: qualityColor(pcr.quality) + "18",
                    border:`1px solid ${qualityColor(pcr.quality)}33`,
                    fontFamily:"'Space Grotesk',sans-serif",
                  }}>{pcr.quality}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#c0d8f0", fontFamily:"'Space Grotesk',sans-serif", marginBottom:2 }}>{pcr.name}</div>
                <div style={{ fontSize:8, color:"#334455", fontFamily:"'Space Grotesk',sans-serif", marginBottom:5 }}>{pcr.category}</div>
                <div style={{ display:"flex", gap:10, marginBottom:5 }}>
                  <div>
                    <div style={{ fontSize:7, color:"#2a3a4a", fontFamily:"'Space Grotesk',sans-serif" }}>PCF</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#e0eeff", fontFamily:"'Space Grotesk',sans-serif" }}>
                      {pcr.pcf_kg >= 1000 ? (pcr.pcf_kg/1000).toFixed(1)+"t" : pcr.pcf_kg+"kg"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:7, color:"#2a3a4a", fontFamily:"'Space Grotesk',sans-serif" }}>Weight</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#e0eeff", fontFamily:"'Space Grotesk',sans-serif" }}>{pcr.weight_kg}kg</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:7, color:"#2a3a4a", fontFamily:"'Space Grotesk',sans-serif" }}>Zone</div>
                    <div style={{ fontSize:9, color:"#4a6a8a", fontFamily:"'Space Grotesk',sans-serif" }}>{pcr.zone}</div>
                  </div>
                </div>
                <div style={{ fontSize:8, color:"#2a4a6a", fontFamily:"'Space Grotesk',sans-serif", fontStyle:"italic" }}>{pcr.relevance}</div>
              </div>
            ))}

            <button onClick={()=>{ setClickResult(null); setClickPos(null); }} style={{
              width:"100%", marginTop:4, padding:"6px",
              background:"transparent", border:"1px solid #0d1a2a",
              borderRadius:4, color:"#334455", fontSize:9,
              fontFamily:"'Space Grotesk',sans-serif", cursor:"pointer",
            }}>
              ← Click another part
            </button>
          </div>
        )}

        {clickResult?.error && (
          <div style={{ flex:"0 0 45%", display:"flex", alignItems:"center", justifyContent:"center", color:"#e74c3c", fontSize:11, fontFamily:"'Space Grotesk',sans-serif", padding:20, textAlign:"center" }}>
            {clickResult.error}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function InfoPanel({ selectedZone }) {
  return(
    <div style={{ position:"absolute", top:130, right:selectedZone?412:18, width:340, maxHeight:"calc(100vh - 160px)", overflowY:"auto", zIndex:25, background:"rgba(8,12,21,0.97)", border:"1px solid #00ff8833", borderRadius:12, padding:20, fontFamily:"'Space Grotesk', sans-serif" }}>
      <div style={{ fontSize:12, color:"#00ff88", fontWeight:700, letterSpacing:1, marginBottom:16, textTransform:"uppercase" }}>About this dataset</div>
      {INFO_SECTIONS.map((s,i)=>(
        <div key={i} style={{ marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#e0e6ed", marginBottom:6 }}>{s.title}</div>
          <div style={{ fontSize:12, color:"#8899aa", lineHeight:1.7 }}>{s.content}</div>
        </div>
      ))}
      <div style={{ borderTop:"1px solid #1a2a3c", paddingTop:16, marginTop:4 }}>
        <div style={{ fontSize:12, color:"#556677", fontWeight:700, letterSpacing:1, marginBottom:12, textTransform:"uppercase" }}>Glossary</div>
        {GLOSSARY.map((g,i)=>(
          <div key={i} style={{ marginBottom:10, padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"1px solid #1a2a3c" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#4a9eff" }}>{g.term}</span>
              <span style={{ fontSize:10, color:"#556677" }}>{g.full}</span>
            </div>
            <div style={{ fontSize:11, color:"#778899", lineHeight:1.6 }}>{g.def}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:16, padding:"10px 12px", borderRadius:8, background:"rgba(0,255,136,0.04)", border:"1px solid #00ff8822" }}>
        <div style={{ fontSize:10, color:"#00ff88aa", lineHeight:1.6 }}>Built by dexdogs · BMW Vehicle Footprint Report · TÜV Rheinland verified · ISO 14040/44 · Catena-X Product Carbon Footprint Rulebook v2.0</div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedZone,setSelectedZone]=useState(null);
  const [hoveredZone,setHoveredZone]=useState(null);
    const [showInfo,setShowInfo]=useState(false);
  const handleZoneClick=useCallback((id)=>{setSelectedZone(prev=>prev===id?null:id);},[]);
  return(
    <div style={{ width:"100vw", height:"100vh", background:"#060a10", overflow:"hidden", position:"relative", fontFamily:"'Space Grotesk', sans-serif" }}>
      <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:"linear-gradient(#4a90d9 1px, transparent 1px), linear-gradient(90deg, #4a90d9 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
      <Header />
      <ZoneList selectedZone={selectedZone} onZoneClick={handleZoneClick} onZoneHover={setHoveredZone} />
      <CarView onZoneClick={handleZoneClick} selectedZone={selectedZone} hoveredZone={hoveredZone} />
      <DataPanel zone={selectedZone} onClose={()=>setSelectedZone(null)} />
      <QualityLegend />
      <div style={{ position:"absolute", top:82, right:selectedZone?412:18, zIndex:30 }}>
        <button onClick={()=>setShowInfo(v=>!v)} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${showInfo?"#00ff88":"#1a2a3c"}`, background:showInfo?"rgba(0,255,136,0.1)":"rgba(8,12,21,0.9)", color:showInfo?"#00ff88":"#556677", cursor:"pointer", fontSize:16 }} title="Dataset info & glossary">ⓘ</button>
      <a href="/BMW_iX_PCR_PCF_Dataset_Phase1.xlsx" download="BMW_iX_PCR_PCF_Dataset_Phase1.xlsx" style={{ width:36, height:36, borderRadius:8, border:"1px solid #1a2a3c", background:"rgba(8,12,21,0.9)", color:"#556677", cursor:"pointer", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontFamily:"'Space Grotesk',sans-serif" }} title="Export dataset">Export</a>
      <FeedbackButton />
      </div>
      {showInfo&&<InfoPanel selectedZone={selectedZone} />}
    </div>
  );
}
