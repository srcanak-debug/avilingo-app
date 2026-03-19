-- ═══════════════════════════════════════════════════════════════
-- AVILINGO v3 — MAINTENANCE (AME) QUESTIONS
-- ~75 questions: all sections and types
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, role_tag, active, is_latest, version_number) VALUES

-- ── GRAMMAR ──
('grammar','multiple_choice','The engine oil must _____ before each scheduled flight.
A) be checked  B) check  C) checking  D) been checked','A','A2','easy','passive_voice','engine','maintenance',true,true,1),
('grammar','multiple_choice','The torque value _____ exceeded during installation.
A) must not be  B) must not  C) cannot  D) was','A','B1','medium','passive_voice','engine','maintenance',true,true,1),
('grammar','multiple_choice','If the hydraulic pressure _____ below 2000 PSI, isolate the system.
A) drops  B) will drop  C) dropped  D) dropping','A','B2','medium','conditional_forms','hydraulic','maintenance',true,true,1),
('grammar','multiple_choice','The work order _____ signed off by an authorized certifying staff.
A) must be  B) must  C) should been  D) will','A','B1','medium','passive_voice','general','maintenance',true,true,1),
('grammar','multiple_choice','The aircraft _____ returned to service until all open defects are cleared.
A) must not be  B) cannot  C) may not be  D) must','C','B2','medium','passive_voice','general','maintenance',true,true,1),
('grammar','multiple_choice','The technician who _____ the engine inspection submitted the report.
A) performed  B) performs  C) performing  D) perform','A','B1','easy','tense_usage','engine','maintenance',true,true,1),
('grammar','multiple_choice','All tools _____ accounted for before closing any maintenance panel.
A) must be  B) must  C) ought  D) should been','A','B1','medium','passive_voice','general','maintenance',true,true,1),
('grammar','multiple_choice','By the time the aircraft _____ by the inspection team, the defect had already been found.
A) was checked  B) checked  C) is checked  D) had checked','A','C1','hard','tense_usage','general','maintenance',true,true,1),
('grammar','multiple_choice','The AMM procedure requires that the lock wire _____ replaced after every removal.
A) be  B) is  C) was  D) been','A','C1','hard','structural_accuracy','general','maintenance',true,true,1),
('grammar','multiple_choice','Neither the brake _____ the tire showed signs of excessive wear.
A) or  B) nor  C) and  D) not','B','B2','medium','structural_accuracy','landing_gear','maintenance',true,true,1),
('grammar','fill_blank','Complete: The component _____ (replace) according to the task card instructions.','was replaced','B1','easy','passive_voice','general','maintenance',true,true,1),
('grammar','fill_blank','Complete: The fuel samples _____ (analyse) for contamination before release.','must be analysed','B1','medium','passive_voice','fuel_system','maintenance',true,true,1),
('grammar','fill_blank','Complete: If corrosion _____ (find), it must be reported immediately.','is found','B1','medium','conditional_forms','airframe','maintenance',true,true,1),
('grammar','fill_blank','Complete: The landing gear _____ (retract/test) before the aircraft was returned to service.','was tested for retraction','B2','hard','tense_usage','landing_gear','maintenance',true,true,1),
('grammar','fill_blank','Complete: The mechanic spoke _____ (technical) but clearly during the debrief.','technically','B1','easy','structural_accuracy','general','maintenance',true,true,1),
('grammar','error_correction','Find and correct the error:
"The engine oil were changed at the correct interval."','was changed (were → was; "oil" is uncountable singular)','B1','easy','tense_usage','engine','maintenance',true,true,1),
('grammar','error_correction','Find and correct the error:
"The torque value must not exceeded the manufacturer limit."','must not exceed (exceeded → exceed; modal verb takes base form)','B2','medium','passive_voice','engine','maintenance',true,true,1),
('grammar','error_correction','Find and correct the error:
"If the brake pad will worn more than 50%, replace immediately."','is worn (will worn → is worn; present simple in conditional)','B2','medium','conditional_forms','landing_gear','maintenance',true,true,1),
('grammar','error_correction','Find and correct the error:
"The work order what was completed should be stamped."','that (what → that; relative pronoun for things)','B1','medium','structural_accuracy','general','maintenance',true,true,1),
('grammar','short_answer','Rewrite in passive: "The technician must inspect the fuel filter."','The fuel filter must be inspected by the technician.','B2','medium','passive_voice','fuel_system','maintenance',true,true,1),

-- ── READING ──
('reading','multiple_choice','Read the AMM task card:
"Task 72-21-00-001: Engine Oil Change (Interval: Every 400 flight hours or 6 months, whichever occurs first). Materials required: MIL-PRF-23699 oil, O-rings (Part: 3256-A), calibrated torque wrench. WARNING: Allow engine to cool 30 minutes before opening drain plug."

What is the maximum interval between oil changes?
A) 400 hours only  B) 6 months only  C) 400 hours or 6 months whichever comes first  D) 12 months','C','B1','medium','technical_manual','engine','maintenance',true,true,1),
('reading','multiple_choice','Read the MEL (Minimum Equipment List) entry:
"Item 29-11: Hydraulic System A Pump — ONE may be inoperative provided System B is operative and flights are limited to destinations within 60 minutes flight time."

How many System A pumps may be inoperative?
A) Two  B) Zero  C) One  D) All if System B works','C','B2','medium','technical_manual','hydraulic','maintenance',true,true,1),
('reading','multiple_choice','Read the SRM (Structural Repair Manual) instruction:
"Do not repair any crack exceeding 50mm in length without engineering review and approval. Damage beyond limits must be referred to manufacturer."

A technician finds a 65mm crack. What is the correct action?
A) Repair it using standard procedure  B) Grind it out and fill with sealant  C) Refer to manufacturer/engineering  D) Apply a patch immediately','C','B1','medium','technical_manual','airframe','maintenance',true,true,1),
('reading','true_false','Read the safety procedure:
"Two-person sign-off is required for all fuel system components after maintenance. One technician performs the work; a second independent inspector must verify before return to service."

Statement: One technician can both perform the work and sign off on it.
TRUE or FALSE?','FALSE — two independent personnel are required for fuel system sign-off','B2','medium','sop_comprehension','fuel_system','maintenance',true,true,1),
('reading','true_false','Read the toolbox instruction:
"Tool Control Policy: All tools must be signed out and signed back in. A tool count must be completed before closing any access panel. Any tool found missing must be reported to the supervisor immediately."

Statement: A missing tool can be reported after the shift ends.
TRUE or FALSE?','FALSE — missing tools must be reported IMMEDIATELY','B1','easy','sop_comprehension','general','maintenance',true,true,1),
('reading','short_answer','Read the safety warning:
"WARNING: Do not open system under pressure. Relieve pressure to zero PSI before disconnecting any hydraulic line."

What must be done before disconnecting a hydraulic line?','Pressure must be relieved to zero PSI','A2','easy','technical_manual','hydraulic','maintenance',true,true,1),

-- ── LISTENING ──
('listening','multiple_choice','[AUDIO] "Attention hangar crew: the aircraft at stand 4 has an AOG (Aircraft on Ground) situation. Hydraulic fluid found in the wheel well. All other maintenance is secondary until this is resolved. Lead technician report to stand 4 immediately."

What is the priority situation?
A) Tire change  B) Hydraulic fluid in wheel well  C) Engine oil check  D) Routine inspection overdue','B','B1','easy','sop_comprehension','hydraulic','maintenance',true,true,1),
('listening','multiple_choice','[AUDIO] "Shift safety brief: Remember, all work on fuel systems requires PPE including chemical resistant gloves and protective eyewear. Nitrile gloves are NOT rated for fuel exposure. Use only neoprene or butyl rubber."

Which gloves are approved for fuel system work?
A) Nitrile  B) Neoprene or butyl rubber  C) Latex  D) Any chemical-resistant type','B','B2','medium','sop_comprehension','fuel_system','maintenance',true,true,1),
('listening','multiple_choice','[AUDIO] "The wire bundle replacement in the wheel well must follow the AMM 20-10-12. Route cables above existing harness. Do NOT route near hydraulic lines. Use tie-wraps at intervals not exceeding 15cm."

What is the maximum spacing for tie-wraps?
A) 10cm  B) 20cm  C) 15cm  D) 25cm','C','B1','medium','technical_manual','airframe','maintenance',true,true,1),
('listening','multiple_choice','[AUDIO] "Quality Control report: The aircraft TC-JAA passed C-Check with two deferred defects on the MEL — neither is safety critical. Aircraft is cleared for return to service following crew acceptance."

Is TC-JAA cleared to fly?
A) No, deferred defects prevent release  B) Yes, cleared for return to service  C) Conditional clearance — captain must inspect  D) Only cleared for local flights','B','B2','medium','sop_comprehension','general','maintenance',true,true,1),
('listening','multiple_choice','[AUDIO] "Torque check reminder: all fasteners on the main landing gear trunnion must be torqued to 450 inch-pounds ±10%. If a torque wrench reads above 500 or below 400 inch-pounds, reject and report."

What is the acceptable torque range?
A) 450-500  B) 400-450  C) 405-495  D) 400-500','C','B2','hard','technical_manual','landing_gear','maintenance',true,true,1),
('listening','ordering','[AUDIO] A lead technician describes the engine inspection sequence. Order the steps:
A) Sign and return task cards  B) Inspect combustion section  C) Check borescope findings  D) Record any defects in Logbook
Correct sequence?','B, C, D, A — Inspect → borescope → record defects → sign task cards','B1','medium','sop_comprehension','engine','maintenance',true,true,1),

-- ── WRITING ──
('writing','written_response','Write a technical defect log entry (minimum 80 words) for the following issue: During pre-flight inspection of aircraft TC-JET, a hydraulic fluid leak was found at the left main gear actuator seal area. Approximately 100ml of fluid on the hangar floor. Describe the defect, location, quantity, and proposed action.','Model: Date/time, aircraft ID/registration, defect location (LH main gear actuator seal), observed quantity (approx. 100ml pool), photo evidence reference, isolate system, contact tech support, reference AMM 29-21-00, do not release aircraft until seal inspected and repacked.','C1','hard','maintenance_log','hydraulic','maintenance',true,true,1),
('writing','written_response','Write a handover note (minimum 70 words) for the night shift maintenance team. Include: aircraft registration, current open tasks and status, safety precautions in place, tools left on aircraft (access panels open), and priority for next shift.','Model: Aircraft TC-ABC, open tasks: engine borescope (70% complete), 2 panels open — do not close until inspection signed, tool listed on open card (17" wrench), priority: complete borescope then nose gear retraction test, no hydraulic pressure on system B.','B2','medium','operational_message','general','maintenance',true,true,1),
('writing','written_response','Write a safety concern email (minimum 60 words) to your supervisor reporting that a colleague skipped the two-person verification step on a fuel system repair. Include what you observed, the risk, and what should be done.','Model: Formal report, specific observation (name/date/task), risk (un-verified fuel system component creates leak/contamination risk), recommendation (immediate re-inspection with qualified inspector, refresher training, SOP reinforcement).','C1','hard','incident_report','fuel_system','maintenance',true,true,1),

-- ── SPEAKING ──
('speaking','audio_response','Explain the tool control procedure at your hangar. Why is it important in aviation maintenance, and what do you do if a tool goes missing before closing an access panel?
Speak for at least 45 seconds.','Importance of tool control (preventing FOD), sign-out/sign-in procedure, count before closing panels, missing tool = immediate report to supervisor, aircraft not released, search commenced.','C1','hard','sop_comprehension','general','maintenance',true,true,1),
('speaking','audio_response','Describe a situation where you (or someone) found a defect during a pre-flight check that was not previously recorded. Walk through the steps you took from discovery to aircraft release.','Discovery → record in technical log → assess against MEL → determine flight category (GO/NO-GO) → contact engineering if needed → corrective action → re-inspection → release or reject.','C1','hard','maintenance_log','general','maintenance',true,true,1),
('speaking','audio_response','Explain the difference between a C-check and an A-check in terms of scope, interval, and typical work performed.
Speak for at least 50 seconds.','A-check: light check ~500-600 hours, takes ~8-12 hours, routine inspections. C-check: heavy structural check every ~18-24 months or ~6000 hours, major systems inspected, components replaced, takes days.','C1','hard','technical_manual','general','maintenance',true,true,1);
