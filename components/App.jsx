import { useState, useCallback } from "react";

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

function ZoneList({ selectedZone, onZoneClick }) {
  const sorted = [...ZONES].sort((a,b)=>b.co2e_kg-a.co2e_kg);
  return (
    <div style={{ position:"absolute", left:16, top:80, bottom:16, width:260, background:"rgba(8,12,21,0.92)", borderRadius:12, border:"1px solid #1a2a3c", padding:12, overflowY:"auto", zIndex:10, fontFamily:"'Space Grotesk', sans-serif" }}>
      <div style={{ fontSize:10, color:"#556677", letterSpacing:1.5, marginBottom:10, fontWeight:700, textTransform:"uppercase" }}>Vehicle Zones — by CO₂ equivalent</div>
      {sorted.map(z=>(
        <div key={z.id} onClick={()=>onZoneClick(z.id)} style={{ padding:"7px 8px", borderRadius:6, marginBottom:3, cursor:"pointer", background:selectedZone===z.id?"rgba(255,255,255,0.08)":"transparent", border:selectedZone===z.id?`1px solid ${z.color}44`:"1px solid transparent", transition:"all 0.15s" }}>
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

function CarView({ onZoneClick, selectedZone }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [view, setView] = useState("side");

  const VIEWS = [
    { id:"side",  label:"Side"  },
    { id:"front", label:"Front" },
    { id:"back",  label:"Back"  },
    { id:"top",   label:"Top"   },
  ];

  const isActive = (id) => selectedZone === id || hoveredZone === id;
  const isCatena = (id) => id === "kidney_grille";

  const dotProps = (id) => ({
    onClick: () => onZoneClick(id),
    onMouseEnter: () => setHoveredZone(id),
    onMouseLeave: () => setHoveredZone(null),
    style: { cursor: "pointer" },
  });

  const Dot = ({ id, cx, cy }) => {
    const zone = ZONES.find(z => z.id === id);
    if (!zone) return null;
    const active = isActive(id);
    const catena = isCatena(id);
    const r = catena ? 7 : active ? 6 : 4;
    return (
      <g {...dotProps(id)}>
        {catena && <circle cx={cx} cy={cy} r={12} fill="none" stroke="#00ff88" strokeWidth="0.5" opacity="0.4" />}
        <circle
          cx={cx} cy={cy} r={r}
          fill={active ? zone.color+"55" : zone.color+"33"}
          stroke={zone.color}
          strokeWidth={catena ? 1.5 : 1}
          style={{ filter: catena ? `drop-shadow(0 0 6px ${zone.color})` : active ? `drop-shadow(0 0 4px ${zone.color})` : "none", transition:"all 0.15s" }}
        />
        {(active || catena) && (
          <g>
            <rect
              x={cx - 52} y={cy - 28} width={104} height={16} rx={3}
              fill="rgba(2,6,12,0.95)" stroke={zone.color} strokeWidth="0.5" strokeOpacity="0.5"
            />
            <text x={cx} y={cy - 17} textAnchor="middle" fill={zone.color} fontSize="7.5" fontWeight="600" fontFamily="Space Grotesk, sans-serif">
              {catena ? "★ CATENA-X · Only verified footprint" : zone.name}
            </text>
          </g>
        )}
      </g>
    );
  };

  // ── SIDE VIEW SVG ────────────────────────────────────────────────────
  // BMW iX profile: front on right, rear on left
  // ViewBox 0 0 500 240
  const SideView = () => (
    <svg viewBox="0 0 500 240" style={{width:"100%",height:"100%"}}>
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a1010"/>
          <stop offset="60%" stopColor="#8b1a1a"/>
          <stop offset="100%" stopColor="#3a0808"/>
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a3a" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#0a1520" stopOpacity="0.7"/>
        </linearGradient>
        <linearGradient id="wheelGrad" cx="50%" cy="50%" r="50%" fx="35%" fy="35%" gradientUnits="objectBoundingBox" id="wheelG">
          <stop offset="0%" stopColor="#2a2a2a"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </linearGradient>
      </defs>

      {/* ── Body shell outline ── */}
      {/* Main body: tall SUV, flat roofline sloping at rear */}
      <path d={`
        M 55 175
        L 55 155 C 55 148 58 143 64 138
        C 72 131 80 128 88 127
        L 110 122
        C 118 108 130 96 148 90
        L 200 82
        C 220 78 250 76 270 76
        L 330 76
        C 360 76 375 78 385 82
        C 400 86 408 92 412 98
        L 435 98
        C 443 98 448 102 450 108
        L 452 125
        C 454 130 454 135 452 140
        L 450 145
        L 450 175
        Z
      `} fill="url(#bodyGrad)" stroke="#1a0a0a" strokeWidth="1.5"/>

      {/* Lower body sill / rocker */}
      <path d={`M 85 175 L 85 170 L 420 170 L 420 175 Z`} fill="#1a0808" stroke="none"/>

      {/* Windshield — raked, large */}
      <path d={`
        M 148 90 L 200 82 L 270 76 L 270 98 L 200 108 L 162 112 Z
      `} fill="url(#glassGrad)" stroke="#0a1520" strokeWidth="1"/>

      {/* Rear window — small, steeply raked */}
      <path d={`
        M 330 76 L 385 82 L 395 95 L 375 98 L 330 98 Z
      `} fill="url(#glassGrad)" stroke="#0a1520" strokeWidth="1"/>

      {/* Panoramic roof — dark glass panel between pillars */}
      <path d={`M 270 76 L 330 76 L 330 98 L 270 98 Z`} fill="#0d1a24" stroke="#1a2a3a" strokeWidth="0.8"/>
      {/* CFRP roof panel overlay — mesh pattern texture */}
      <path d={`M 278 78 L 322 78 L 322 97 L 278 97 Z`} fill="none" stroke="#1a1a2a" strokeWidth="0.4"/>
      <line x1="285" y1="78" x2="285" y2="97" stroke="#151525" strokeWidth="0.5"/>
      <line x1="293" y1="78" x2="293" y2="97" stroke="#151525" strokeWidth="0.5"/>
      <line x1="301" y1="78" x2="301" y2="97" stroke="#151525" strokeWidth="0.5"/>
      <line x1="309" y1="78" x2="309" y2="97" stroke="#151525" strokeWidth="0.5"/>
      <line x1="317" y1="78" x2="317" y2="97" stroke="#151525" strokeWidth="0.5"/>

      {/* Door handles — flush, horizontal bars */}
      <rect x="195" y="133" width="28" height="5" rx="2.5" fill="#3a1010" stroke="#5a2020" strokeWidth="0.5"/>
      <rect x="290" y="133" width="28" height="5" rx="2.5" fill="#3a1010" stroke="#5a2020" strokeWidth="0.5"/>

      {/* Belt line chrome strip */}
      <path d={`M 148 130 L 410 126`} fill="none" stroke="#c8a060" strokeWidth="1.2" opacity="0.6"/>

      {/* A-pillar */}
      <path d={`M 148 90 L 162 112 L 200 108 L 200 82 Z`} fill="#5a0e0e" stroke="none"/>
      {/* B-pillar */}
      <path d={`M 270 98 L 270 76 L 274 76 L 274 98 Z`} fill="#3a0808" stroke="none"/>
      {/* C-pillar */}
      <path d={`M 330 76 L 330 98 L 338 98 L 340 82 Z`} fill="#4a0c0c" stroke="none"/>
      {/* D-pillar/rear */}
      <path d={`M 385 82 L 395 95 L 415 110 L 412 98 Z`} fill="#3a0808" stroke="none"/>

      {/* Headlights — slim horizontal LED strip left/right of grille on right side */}
      <path d={`M 430 102 L 453 103 L 453 110 L 430 110 Z`} fill="#aaccff" stroke="#6688cc" strokeWidth="0.5" opacity="0.8"/>

      {/* Kidney grille area — front right */}
      <path d={`
        M 448 112 C 448 110 450 108 452 110
        L 456 118 L 456 138 L 452 142 C 450 144 448 142 448 140 Z
      `} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="1"/>

      {/* Taillights — left rear, horizontal LED */}
      <rect x="52" y="128" width="8" height="24" rx="2" fill="#cc2200" stroke="#881100" strokeWidth="0.5" opacity="0.9"/>

      {/* Front wheel arch */}
      <path d={`
        M 395 175 C 395 152 408 138 422 138 C 436 138 450 152 450 175 Z
      `} fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="1"/>
      {/* Front wheel */}
      <circle cx="422" cy="175" r="28" fill="#111" stroke="#1a1a1a" strokeWidth="1.5"/>
      <circle cx="422" cy="175" r="22" fill="none" stroke="#2a2a2a" strokeWidth="1"/>
      <circle cx="422" cy="175" r="8" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1"/>
      {/* Spoke pattern front wheel */}
      {[0,36,72,108,144,180,216,252,288,324].map((a,i) => (
        <line key={i} x1={422+8*Math.cos(a*Math.PI/180)} y1={175+8*Math.sin(a*Math.PI/180)}
          x2={422+22*Math.cos(a*Math.PI/180)} y2={175+22*Math.sin(a*Math.PI/180)}
          stroke="#2a2a2a" strokeWidth="1.5"/>
      ))}
      {/* BMW roundel on front wheel */}
      <circle cx="422" cy="175" r="5" fill="none" stroke="#aaaaaa" strokeWidth="0.8"/>

      {/* Rear wheel arch */}
      <path d={`
        M 55 175 C 55 152 68 138 82 138 C 96 138 110 152 110 175 Z
      `} fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="1"/>
      {/* Rear wheel */}
      <circle cx="82" cy="175" r="28" fill="#111" stroke="#1a1a1a" strokeWidth="1.5"/>
      <circle cx="82" cy="175" r="22" fill="none" stroke="#2a2a2a" strokeWidth="1"/>
      <circle cx="82" cy="175" r="8" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="1"/>
      {[0,36,72,108,144,180,216,252,288,324].map((a,i) => (
        <line key={i} x1={82+8*Math.cos(a*Math.PI/180)} y1={175+8*Math.sin(a*Math.PI/180)}
          x2={82+22*Math.cos(a*Math.PI/180)} y2={175+22*Math.sin(a*Math.PI/180)}
          stroke="#2a2a2a" strokeWidth="1.5"/>
      ))}
      <circle cx="82" cy="175" r="5" fill="none" stroke="#aaaaaa" strokeWidth="0.8"/>

      {/* Ground line */}
      <line x1="30" y1="203" x2="480" y2="203" stroke="#1a2a1a" strokeWidth="0.5" strokeDasharray="2,4"/>

      {/* Underfloor / battery slab */}
      <rect x="112" y="172" width="280" height="6" rx="1" fill="#0a0f1a" stroke="#0f1a2a" strokeWidth="0.5"/>

      {/* ── DOTS ── */}
      {/* Side view: front is RIGHT, rear is LEFT */}
      <Dot id="body"          cx={250} cy={138} />
      <Dot id="glazing"       cx={235} cy={92}  />
      <Dot id="cfrp_roof"     cx={300} cy={82}  />
      <Dot id="interior"      cx={240} cy={102} />
      <Dot id="front_motor"   cx={435} cy={155} />
      <Dot id="rear_motor"    cx={68}  cy={155} />
      <Dot id="wheels"        cx={422} cy={175} />
      <Dot id="brakes"        cx={410} cy={165} />
      <Dot id="suspension"    cx={420} cy={148} />
      <Dot id="battery"       cx={252} cy={178} />
      <Dot id="polymers_misc" cx={250} cy={165} />
      <Dot id="electronics"   cx={445} cy={118} />
    </svg>
  );

  // ── FRONT VIEW SVG ───────────────────────────────────────────────────
  // ViewBox 0 0 400 340
  const FrontView = () => (
    <svg viewBox="0 0 400 340" style={{width:"100%",height:"100%"}}>
      <defs>
        <linearGradient id="fBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a1212"/>
          <stop offset="100%" stopColor="#3a0808"/>
        </linearGradient>
      </defs>

      {/* Outer body — wide SUV stance */}
      <path d={`
        M 60 280
        L 60 220 C 60 210 65 205 72 202
        L 85 198
        C 88 185 96 172 108 166
        L 130 158
        C 140 148 155 142 175 140
        L 200 138
        L 225 140
        C 245 142 260 148 270 158
        L 292 166
        C 304 172 312 185 315 198
        L 328 202
        C 335 205 340 210 340 220
        L 340 280 Z
      `} fill="url(#fBodyGrad)" stroke="#1a0808" strokeWidth="1.5"/>

      {/* Hood — center crease */}
      <path d={`M 120 158 L 200 138 L 280 158 L 260 165 L 200 152 L 140 165 Z`} fill="#6a1010" stroke="#3a0808" strokeWidth="0.5"/>
      <line x1="200" y1="138" x2="200" y2="165" stroke="#3a0808" strokeWidth="1" opacity="0.5"/>

      {/* Windshield */}
      <path d={`M 135 160 L 175 140 L 225 140 L 265 160 L 255 178 L 145 178 Z`} fill="#1a2a3a" stroke="#0a1520" strokeWidth="1" opacity="0.85"/>

      {/* Roof strip */}
      <path d={`M 145 178 L 255 178 L 252 188 L 148 188 Z`} fill="#0d1520" stroke="#1a2530" strokeWidth="0.5"/>

      {/* CFRP roof visible as dark panel top */}
      <path d={`M 148 188 L 252 188 L 250 195 L 150 195 Z`} fill="#0a1018" stroke="#151525" strokeWidth="0.5"/>

      {/* Headlight clusters — wide horizontal, left and right */}
      {/* Left headlight */}
      <path d={`M 75 182 L 118 178 L 120 192 L 78 195 Z`} fill="#0a1020" stroke="#4466aa" strokeWidth="1"/>
      <path d={`M 80 184 L 115 180 L 116 188 L 82 190 Z`} fill="#aaccff" stroke="none" opacity="0.6"/>
      {/* Right headlight */}
      <path d={`M 282 178 L 325 182 L 322 195 L 280 192 Z`} fill="#0a1020" stroke="#4466aa" strokeWidth="1"/>
      <path d={`M 284 180 L 318 184 L 318 190 L 284 188 Z`} fill="#aaccff" stroke="none" opacity="0.6"/>

      {/* Kidney grille — large twin oval, center */}
      {/* Left kidney */}
      <ellipse cx="168" cy="222" rx="38" ry="42" fill="#080808" stroke="#1a1a1a" strokeWidth="1.5"/>
      {/* Right kidney */}
      <ellipse cx="232" cy="222" rx="38" ry="42" fill="#080808" stroke="#1a1a1a" strokeWidth="1.5"/>
      {/* Center bridge */}
      <rect x="196" y="188" width="8" height="18" fill="#6a1010" stroke="none"/>
      {/* Grille mesh lines */}
      {[-32,-22,-12,-2,8,18,28].map((dy,i)=>(
        <line key={i} x1="132" y1={222+dy} x2="268" y2={222+dy} stroke="#1a1a1a" strokeWidth="0.8"/>
      ))}
      {[145,158,170,182,194,206,218,230,242,254].map((dx,i)=>(
        <line key={i} x1={dx} y1="182" x2={dx} y2="262" stroke="#1a1a1a" strokeWidth="0.8"/>
      ))}
      {/* BMW roundel center top of grille */}
      <circle cx="200" cy="180" r="10" fill="#0a0a14" stroke="#888" strokeWidth="1"/>
      <circle cx="200" cy="180" r="8" fill="none" stroke="#666" strokeWidth="0.5"/>
      <path d="M200 172 L200 180 L192 180 Z" fill="#4488cc" opacity="0.8"/>
      <path d="M200 180 L200 188 L208 180 Z" fill="#4488cc" opacity="0.8"/>
      <path d="M192 180 L200 180 L200 188 Z" fill="#eee" opacity="0.8"/>
      <path d="M200 172 L208 180 L200 180 Z" fill="#eee" opacity="0.8"/>

      {/* Front bumper lower */}
      <path d={`M 65 262 L 335 262 L 330 280 L 70 280 Z`} fill="#3a0808" stroke="#2a0606" strokeWidth="1"/>
      {/* Air intake left */}
      <path d={`M 72 252 L 120 248 L 122 262 L 72 262 Z`} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="0.8"/>
      {/* Air intake right */}
      <path d={`M 278 248 L 328 252 L 328 262 L 278 262 Z`} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="0.8"/>

      {/* Side mirrors */}
      <path d={`M 58 198 L 70 196 L 72 206 L 60 208 Z`} fill="#5a1010" stroke="#3a0808" strokeWidth="0.5"/>
      <path d={`M 330 196 L 342 198 L 340 208 L 328 206 Z`} fill="#5a1010" stroke="#3a0808" strokeWidth="0.5"/>

      {/* Front wheels visible at bottom corners */}
      <ellipse cx="102" cy="290" rx="34" ry="14" fill="#111" stroke="#222" strokeWidth="1"/>
      <ellipse cx="298" cy="290" rx="34" ry="14" fill="#111" stroke="#222" strokeWidth="1"/>
      {/* Wheel faces */}
      <circle cx="102" cy="282" r="22" fill="#111" stroke="#1a1a1a" strokeWidth="1"/>
      <circle cx="298" cy="282" r="22" fill="#111" stroke="#1a1a1a" strokeWidth="1"/>
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <line key={i} x1={102+7*Math.cos(a*Math.PI/180)} y1={282+7*Math.sin(a*Math.PI/180)}
          x2={102+20*Math.cos(a*Math.PI/180)} y2={282+20*Math.sin(a*Math.PI/180)}
          stroke="#2a2a2a" strokeWidth="1.2"/>
      ))}
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <line key={i} x1={298+7*Math.cos(a*Math.PI/180)} y1={282+7*Math.sin(a*Math.PI/180)}
          x2={298+20*Math.cos(a*Math.PI/180)} y2={282+20*Math.sin(a*Math.PI/180)}
          stroke="#2a2a2a" strokeWidth="1.2"/>
      ))}

      {/* ── DOTS ── */}
      <Dot id="kidney_grille" cx={200} cy={222} />
      <Dot id="front_motor"   cx={200} cy={268} />
      <Dot id="battery"       cx={200} cy={285} />
      <Dot id="electronics"   cx={96}  cy={186} />
      <Dot id="glazing"       cx={200} cy={162} />
      <Dot id="cfrp_roof"     cx={200} cy={192} />
      <Dot id="body"          cx={85}  cy={235} />
      <Dot id="wheels"        cx={102} cy={282} />
      <Dot id="brakes"        cx={102} cy={275} />
      <Dot id="suspension"    cx={88}  cy={268} />
      <Dot id="polymers_misc" cx={200} cy={272} />
      <Dot id="thermal"       cx={94}  cy={255} />
    </svg>
  );

  // ── BACK VIEW SVG ────────────────────────────────────────────────────
  const BackView = () => (
    <svg viewBox="0 0 400 340" style={{width:"100%",height:"100%"}}>
      <defs>
        <linearGradient id="bBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a1212"/>
          <stop offset="100%" stopColor="#3a0808"/>
        </linearGradient>
      </defs>

      {/* Body */}
      <path d={`
        M 62 280 L 62 225
        C 62 215 67 208 75 204
        L 90 200
        C 95 188 104 178 118 172
        L 145 164 C 162 156 178 152 200 150
        L 222 152 C 238 156 255 164 272 172
        L 282 178 C 296 184 305 194 310 204
        L 325 208
        C 332 212 338 218 338 228 L 338 280 Z
      `} fill="url(#bBodyGrad)" stroke="#1a0808" strokeWidth="1.5"/>

      {/* Rear glass */}
      <path d={`M 140 166 L 200 150 L 260 166 L 252 190 L 148 190 Z`} fill="#1a2a3a" stroke="#0a1520" strokeWidth="1" opacity="0.85"/>

      {/* Roof spoiler / CFRP top strip */}
      <path d={`M 148 190 L 252 190 L 250 200 L 150 200 Z`} fill="#0a0f18" stroke="#151525" strokeWidth="0.5"/>

      {/* Full-width taillight bar — signature iX feature */}
      <path d={`M 72 210 L 328 210 L 328 226 L 72 226 Z`} fill="#1a0000" stroke="#2a0000" strokeWidth="0.5"/>
      {/* Taillight glow segments */}
      <path d={`M 74 212 L 170 212 L 170 224 L 74 224 Z`} fill="#cc1100" stroke="none" opacity="0.85"/>
      <path d={`M 230 212 L 326 212 L 326 224 L 230 224 Z`} fill="#cc1100" stroke="none" opacity="0.85"/>
      {/* Center dark section */}
      <path d={`M 170 212 L 230 212 L 230 224 L 170 224 Z`} fill="#0d0000" stroke="#1a0000" strokeWidth="0.5"/>
      {/* BMW roundel */}
      <circle cx="200" cy="218" r="12" fill="#0a0a14" stroke="#888" strokeWidth="1"/>
      <path d="M200 207 L200 218 L188 218 Z" fill="#4488cc" opacity="0.8"/>
      <path d="M200 218 L200 229 L212 218 Z" fill="#4488cc" opacity="0.8"/>
      <path d="M188 218 L200 218 L200 229 Z" fill="#eee" opacity="0.8"/>
      <path d="M200 207 L212 218 L200 218 Z" fill="#eee" opacity="0.8"/>

      {/* Trunk lid */}
      <path d={`M 135 192 L 265 192 L 262 212 L 138 212 Z`} fill="#5a1010" stroke="#3a0808" strokeWidth="0.5"/>

      {/* Rear bumper */}
      <path d={`M 68 250 L 332 250 L 328 280 L 72 280 Z`} fill="#3a0808" stroke="#2a0606" strokeWidth="1"/>
      {/* Rear diffuser area */}
      <path d={`M 100 262 L 300 262 L 298 278 L 102 278 Z`} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="0.8"/>
      {/* Rear reflectors */}
      <rect x="76" y="264" width="20" height="8" rx="2" fill="#cc4400" opacity="0.7"/>
      <rect x="304" y="264" width="20" height="8" rx="2" fill="#cc4400" opacity="0.7"/>

      {/* Body side panels */}
      <path d={`M 68 226 L 78 226 L 78 252 L 68 252 Z`} fill="#501010" stroke="none"/>
      <path d={`M 322 226 L 332 226 L 332 252 L 322 252 Z`} fill="#501010" stroke="none"/>

      {/* Rear wheels */}
      <ellipse cx="108" cy="292" rx="34" ry="14" fill="#111" stroke="#222" strokeWidth="1"/>
      <ellipse cx="292" cy="292" rx="34" ry="14" fill="#111" stroke="#222" strokeWidth="1"/>
      <circle cx="108" cy="283" r="22" fill="#111" stroke="#1a1a1a" strokeWidth="1"/>
      <circle cx="292" cy="283" r="22" fill="#111" stroke="#1a1a1a" strokeWidth="1"/>
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <line key={i} x1={108+7*Math.cos(a*Math.PI/180)} y1={283+7*Math.sin(a*Math.PI/180)}
          x2={108+20*Math.cos(a*Math.PI/180)} y2={283+20*Math.sin(a*Math.PI/180)}
          stroke="#2a2a2a" strokeWidth="1.2"/>
      ))}
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <line key={i} x1={292+7*Math.cos(a*Math.PI/180)} y1={283+7*Math.sin(a*Math.PI/180)}
          x2={292+20*Math.cos(a*Math.PI/180)} y2={283+20*Math.sin(a*Math.PI/180)}
          stroke="#2a2a2a" strokeWidth="1.2"/>
      ))}

      {/* ── DOTS ── */}
      <Dot id="rear_motor"    cx={200} cy={265} />
      <Dot id="battery"       cx={200} cy={285} />
      <Dot id="glazing"       cx={200} cy={170} />
      <Dot id="cfrp_roof"     cx={200} cy={196} />
      <Dot id="body"          cx={310} cy={238} />
      <Dot id="polymers_misc" cx={200} cy={270} />
      <Dot id="wheels"        cx={108} cy={283} />
      <Dot id="brakes"        cx={110} cy={275} />
      <Dot id="suspension"    cx={90}  cy={268} />
      <Dot id="electronics"   cx={100} cy={218} />
    </svg>
  );

  // ── TOP VIEW SVG ─────────────────────────────────────────────────────
  // Car oriented vertically: front at TOP, rear at BOTTOM
  // ViewBox 0 0 300 480
  const TopView = () => (
    <svg viewBox="0 0 300 480" style={{width:"100%",height:"100%"}}>
      <defs>
        <linearGradient id="tBodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5a1010"/>
          <stop offset="50%" stopColor="#8b1a1a"/>
          <stop offset="100%" stopColor="#5a1010"/>
        </linearGradient>
      </defs>

      {/* Main body outline — pill shape, wider in middle */}
      <path d={`
        M 150 35
        C 175 35 192 42 200 55
        L 215 80
        C 225 95 228 110 228 130
        L 228 340
        C 228 360 225 375 215 390
        L 200 410
        C 192 423 175 430 150 430
        C 125 430 108 423 100 410
        L 85 390
        C 75 375 72 360 72 340
        L 72 130
        C 72 110 75 95 85 80
        L 100 55
        C 108 42 125 35 150 35 Z
      `} fill="url(#tBodyGrad)" stroke="#1a0808" strokeWidth="1.5"/>

      {/* Hood — front section */}
      <path d={`
        M 150 35 C 172 35 188 42 196 52 L 210 75 L 200 80 L 150 82 L 100 80 L 90 75 L 104 52 C 112 42 128 35 150 35 Z
      `} fill="#6a1010" stroke="#3a0808" strokeWidth="0.8"/>
      {/* Hood crease lines */}
      <line x1="150" y1="38" x2="150" y2="80" stroke="#3a0808" strokeWidth="0.8" opacity="0.6"/>
      <path d={`M 150 50 C 160 52 168 58 172 66`} fill="none" stroke="#3a0808" strokeWidth="0.6" opacity="0.4"/>
      <path d={`M 150 50 C 140 52 132 58 128 66`} fill="none" stroke="#3a0808" strokeWidth="0.6" opacity="0.4"/>

      {/* Windshield from top */}
      <path d={`M 108 82 L 192 82 L 200 102 L 100 102 Z`} fill="#1a2a3a" stroke="#0a1520" strokeWidth="0.8" opacity="0.85"/>

      {/* Panoramic glass roof — large center section */}
      <path d={`M 100 102 L 200 102 L 200 260 L 100 260 Z`} fill="#0d1820" stroke="#1a2530" strokeWidth="0.8"/>

      {/* CFRP panel — right portion of roof (as seen in top photo) */}
      <path d={`M 152 160 L 198 160 L 198 255 L 152 255 Z`} fill="#0a0f18" stroke="#151520" strokeWidth="0.5"/>
      {/* CFRP mesh lines */}
      {[168,176,184,192].map((x,i)=>(
        <line key={i} x1={x} y1="160" x2={x} y2="255" stroke="#121218" strokeWidth="0.6"/>
      ))}
      {[175,190,205,220,235,250].map((y,i)=>(
        <line key={i} x1="152" y1={y} x2="198" y2={y} stroke="#121218" strokeWidth="0.6"/>
      ))}

      {/* Rear window from top */}
      <path d={`M 104 260 L 196 260 L 192 285 L 108 285 Z`} fill="#1a2530" stroke="#0a1520" strokeWidth="0.8" opacity="0.8"/>

      {/* Trunk/rear from top */}
      <path d={`M 108 285 L 192 285 L 196 340 L 104 340 Z`} fill="#5a1010" stroke="#3a0808" strokeWidth="0.8"/>

      {/* Body side flanks */}
      <path d={`M 72 130 L 86 130 L 86 340 L 72 340 Z`} fill="#501010" stroke="none"/>
      <path d={`M 214 130 L 228 130 L 228 340 L 214 340 Z`} fill="#501010" stroke="none"/>

      {/* Door handles top view — flush rectangles */}
      <rect x="72" y="200" width="14" height="4" rx="2" fill="#3a1010" stroke="#5a2020" strokeWidth="0.5"/>
      <rect x="214" y="200" width="14" height="4" rx="2" fill="#3a1010" stroke="#5a2020" strokeWidth="0.5"/>
      <rect x="72" y="240" width="14" height="4" rx="2" fill="#3a1010" stroke="#5a2020" strokeWidth="0.5"/>
      <rect x="214" y="240" width="14" height="4" rx="2" fill="#3a1010" stroke="#5a2020" strokeWidth="0.5"/>

      {/* Front-left wheel */}
      <ellipse cx="72" cy="130" rx="16" ry="28" fill="#111" stroke="#1a1a1a" strokeWidth="1.2"/>
      <ellipse cx="72" cy="130" rx="10" ry="20" fill="none" stroke="#2a2a2a" strokeWidth="0.8"/>
      {/* Front-right wheel */}
      <ellipse cx="228" cy="130" rx="16" ry="28" fill="#111" stroke="#1a1a1a" strokeWidth="1.2"/>
      <ellipse cx="228" cy="130" rx="10" ry="20" fill="none" stroke="#2a2a2a" strokeWidth="0.8"/>
      {/* Rear-left wheel */}
      <ellipse cx="72" cy="350" rx="16" ry="28" fill="#111" stroke="#1a1a1a" strokeWidth="1.2"/>
      <ellipse cx="72" cy="350" rx="10" ry="20" fill="none" stroke="#2a2a2a" strokeWidth="0.8"/>
      {/* Rear-right wheel */}
      <ellipse cx="228" cy="350" rx="16" ry="28" fill="#111" stroke="#1a1a1a" strokeWidth="1.2"/>
      <ellipse cx="228" cy="350" rx="10" ry="20" fill="none" stroke="#2a2a2a" strokeWidth="0.8"/>

      {/* Underfloor battery slab visible from top as center strip */}
      <rect x="98" y="108" width="104" height="258" rx="4" fill="none" stroke="#0f1a2a" strokeWidth="0.5" strokeDasharray="3,3"/>

      {/* ── DOTS ── */}
      <Dot id="cfrp_roof"     cx={172} cy={210} />
      <Dot id="glazing"       cx={126} cy={180} />
      <Dot id="interior"      cx={126} cy={220} />
      <Dot id="body"          cx={80}  cy={220} />
      <Dot id="battery"       cx={150} cy={240} />
      <Dot id="front_motor"   cx={150} cy={110} />
      <Dot id="rear_motor"    cx={150} cy={365} />
      <Dot id="wheels"        cx={72}  cy={130} />
      <Dot id="suspension"    cx={72}  cy={118} />
    </svg>
  );

  const renderView = () => {
    switch(view) {
      case "side":  return <SideView />;
      case "front": return <FrontView />;
      case "back":  return <BackView />;
      case "top":   return <TopView />;
      default:      return <SideView />;
    }
  };

  return (
    <div style={{
      position:"absolute", left:290, right:selectedZone?410:16, top:80, bottom:50,
      display:"flex", flexDirection:"column", background:"#000",
    }}>
      {/* View switcher */}
      <div style={{
        display:"flex", gap:6, padding:"8px 12px",
        justifyContent:"center", flexShrink:0,
      }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={()=>setView(v.id)} style={{
            padding:"4px 16px", borderRadius:6, cursor:"pointer",
            fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:600,
            border:`1px solid ${view===v.id?"#4a9eff":"#1a2a3c"}`,
            background: view===v.id?"rgba(74,158,255,0.15)":"transparent",
            color: view===v.id?"#4a9eff":"#445566",
            transition:"all 0.15s",
          }}>{v.label}</button>
        ))}
      </div>

      {/* SVG view */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 16px" }}>
        {renderView()}
      </div>

      {!selectedZone && (
        <div style={{
          textAlign:"center", padding:"4px 0",
          fontSize:10, color:"#2a3a4a",
          fontFamily:"'Space Grotesk',sans-serif", flexShrink:0,
        }}>
          Switch views · Click any dot to explore carbon data
        </div>
      )}
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
    const [showInfo,setShowInfo]=useState(false);
  const handleZoneClick=useCallback((id)=>{setSelectedZone(prev=>prev===id?null:id);},[]);
  return(
    <div style={{ width:"100vw", height:"100vh", background:"#060a10", overflow:"hidden", position:"relative", fontFamily:"'Space Grotesk', sans-serif" }}>
      <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:"linear-gradient(#4a90d9 1px, transparent 1px), linear-gradient(90deg, #4a90d9 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
      <Header />
      <ZoneList selectedZone={selectedZone} onZoneClick={handleZoneClick} />
      <CarView onZoneClick={handleZoneClick} selectedZone={selectedZone} />
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
