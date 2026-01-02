// js/courses.js
// Master Training Catalog (120+ courses)

window.TRAINING_COURSES = [

    /* =====================================================
       STCW & CORE SAFETY
    ===================================================== */
    { id: "bst", label: "Basic Safety Training (BST)" },
    { id: "aff", label: "Advanced Fire Fighting (AFF)" },
    { id: "pscrb", label: "Proficiency in Survival Craft & Rescue Boats (PSCRB)" },
    { id: "crowd", label: "Crowd Management" },
    { id: "security_aw", label: "Ship Security Awareness" },
    { id: "security_duties", label: "Ship Security Duties" },
    { id: "medical_aid", label: "Medical First Aid" },
    { id: "medical_care", label: "Medical Care Onboard Ship" },
    { id: "pdsd", label: "Personal Safety & Social Responsibilities (PSSR)" },
    { id: "refresher_stcw", label: "STCW Refresher Training" },

    /* =====================================================
       FIRE, EMERGENCY & SAFETY OPERATIONS
    ===================================================== */
    { id: "fire_team", label: "Fire Team Leader Training" },
    { id: "fire_instructor", label: "Firefighting Instructor" },
    { id: "emergency_response", label: "Emergency Response & Crisis Management" },
    { id: "damage_control", label: "Damage Control & Flooding Response" },
    { id: "abandon_ship", label: "Abandon Ship Command Training" },
    { id: "search_rescue", label: "Search & Rescue Operations" },
    { id: "first_responder", label: "First Responder Onboard" },
    { id: "h2s", label: "H2S Awareness & Safety" },
    { id: "oil_spill", label: "Oil Spill Response & Containment" },
    { id: "lifeboat_commander", label: "Lifeboat Commander" },

    /* =====================================================
       ELECTRICAL / ETO / AUTOMATION
    ===================================================== */
    { id: "stcw_eto", label: "STCW Electro-Technical Officer (ETO)" },
    { id: "hv_basic", label: "High Voltage Safety (Basic)" },
    { id: "hv_authorised", label: "High Voltage Authorised Person" },
    { id: "hv_switching", label: "High Voltage Switching Operations" },
    { id: "ups", label: "UPS & Emergency Power Systems" },
    { id: "generator_protection", label: "Generator Protection Systems" },
    { id: "plc_basic", label: "PLC Fundamentals" },
    { id: "plc_adv", label: "Advanced PLC Diagnostics" },
    { id: "automation_marine", label: "Marine Automation Systems" },
    { id: "scada", label: "SCADA Systems Operation" },
    { id: "power_management", label: "Power Management Systems (PMS)" },
    { id: "vfd", label: "Variable Frequency Drives (VFD)" },
    { id: "switchgear", label: "Marine Switchgear Maintenance" },
    { id: "alarm_monitoring", label: "Alarm & Monitoring Systems" },

    /* =====================================================
       ENGINE ROOM / TECHNICAL
    ===================================================== */
    { id: "erm", label: "Engine Room Resource Management (ERM)" },
    { id: "pms", label: "Planned Maintenance Systems (PMS)" },
    { id: "condition_monitoring", label: "Condition Monitoring & Diagnostics" },
    { id: "vibration", label: "Vibration Analysis" },
    { id: "lub_oil", label: "Lubrication Oil Management" },
    { id: "fuel_systems", label: "Fuel Oil Systems & Treatment" },
    { id: "cooling", label: "Cooling Water Systems" },
    { id: "hydraulics", label: "Marine Hydraulics" },
    { id: "pneumatics", label: "Marine Pneumatics" },
    { id: "compressors", label: "Air Compressors & Control Air Systems" },
    { id: "boilers", label: "Auxiliary Boilers & Steam Systems" },

    /* =====================================================
       DP / OFFSHORE / SPECIALIZED
    ===================================================== */
    { id: "dp_induction", label: "Dynamic Positioning Induction" },
    { id: "dp_basic", label: "Dynamic Positioning Basic" },
    { id: "dp_advanced", label: "Dynamic Positioning Advanced" },
    { id: "dp_maintenance", label: "DP Maintenance & Troubleshooting" },
    { id: "dp_electrical", label: "DP Electrical & Control Systems" },
    { id: "dp_trials", label: "DP Trials & FMEA" },
    { id: "offshore_safety", label: "Offshore Safety Induction" },
    { id: "jackup", label: "Jack-Up Rig Familiarization" },
    { id: "drilling_control", label: "Drilling Control Systems" },

    /* =====================================================
       NAVIGATION / BRIDGE / CARGO
    ===================================================== */
    { id: "ecdis", label: "ECDIS Operation & Awareness" },
    { id: "radar_arpa", label: "Radar / ARPA Operation" },
    { id: "bridge_resource", label: "Bridge Resource Management (BRM)" },
    { id: "cargo_ops", label: "Cargo Operations & Safety" },
    { id: "cargo_tank_clean", label: "Cargo Tank Cleaning Operations" },
    { id: "ballast", label: "Ballast Water Management Systems (BWMS)" },
    { id: "stability", label: "Ship Stability & Stress" },
    { id: "mooring", label: "Mooring Operations & Safety" },

    /* =====================================================
       PERMIT, RISK & COMPLIANCE
    ===================================================== */
    { id: "permit_work", label: "Permit to Work Systems" },
    { id: "risk_assessment", label: "Risk Assessment & Job Safety Analysis (JSA)" },
    { id: "loto", label: "Lock Out / Tag Out (LOTO)" },
    { id: "confined_space", label: "Confined Space Entry" },
    { id: "work_aloft", label: "Working Aloft & Over the Side" },
    { id: "hot_work", label: "Hot Work Safety" },
    { id: "toolbox", label: "Toolbox Talks & Safety Briefings" },
    { id: "incident_reporting", label: "Incident & Near Miss Reporting" },

    /* =====================================================
       IT / CYBER / DIGITAL
    ===================================================== */
    { id: "cyber_aw", label: "Maritime Cyber Security Awareness" },
    { id: "ics_security", label: "Industrial Control Systems (ICS) Security" },
    { id: "network_basic", label: "Shipboard Network Fundamentals" },
    { id: "network_adv", label: "Advanced Shipboard Networking" },
    { id: "satcom", label: "Maritime Satellite Communications" },
    { id: "cmms", label: "Computerized Maintenance Management Systems (CMMS)" },
    { id: "data_logging", label: "Operational Data Logging & Analysis" },

    /* =====================================================
       MANAGEMENT / HUMAN FACTORS
    ===================================================== */
    { id: "helm", label: "Human Element, Leadership & Management (HELM)" },
    { id: "leadership", label: "Leadership & Team Management" },
    { id: "mentoring", label: "Mentoring & Coaching Onboard" },
    { id: "fatigue", label: "Fatigue Management" },
    { id: "communication", label: "Effective Communication at Sea" },
    { id: "conflict", label: "Conflict Resolution" },
    { id: "cultural_aw", label: "Cultural Awareness Onboard" },
    { id: "stress", label: "Stress Management & Wellbeing" }

];
