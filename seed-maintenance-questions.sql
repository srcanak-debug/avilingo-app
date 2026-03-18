-- ═══════════════════════════════════════════════════════════════
-- MAINTENANCE INEXPERIENCED CANDIDATE — TEST QUESTION SET
-- Target: A2–B1 level, aircraft maintenance context
-- Total: 35 questions (15 grammar, 5 reading, 3 writing, 4 speaking, 8 listening)
-- ═══════════════════════════════════════════════════════════════

-- Also ensure the extra columns exist on questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_latest boolean DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS version_number int DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS parent_question_id uuid;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text;

-- ══════════════════════════════════
-- GRAMMAR — 15 questions (A2–B1)
-- ══════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, active, is_latest, version_number) VALUES

-- 1
('grammar', 'multiple_choice',
'The technician _____ the landing gear before the aircraft departed.
A) inspect
B) inspected
C) inspecting
D) has inspect',
'B', 'A2', 'easy', 'tense_usage', 'general', true, true, 1),

-- 2
('grammar', 'multiple_choice',
'All maintenance tasks _____ be completed before the aircraft is released to service.
A) must
B) can
C) might
D) would',
'A', 'B1', 'easy', 'structural_accuracy', 'general', true, true, 1),

-- 3
('grammar', 'multiple_choice',
'The engine oil _____ changed every 500 flight hours.
A) is
B) are
C) were
D) been',
'A', 'A2', 'easy', 'passive_voice', 'engine', true, true, 1),

-- 4
('grammar', 'multiple_choice',
'If the hydraulic pressure _____ too low, the warning light will illuminate.
A) is
B) will be
C) was
D) has been',
'A', 'B1', 'medium', 'conditional_forms', 'hydraulic', true, true, 1),

-- 5
('grammar', 'multiple_choice',
'The mechanic reported that the brake pads _____ worn beyond limits.
A) is
B) was
C) were
D) are',
'C', 'B1', 'medium', 'tense_usage', 'landing_gear', true, true, 1),

-- 6
('grammar', 'multiple_choice',
'Please ensure that all tools _____ returned to the toolbox after use.
A) is
B) are
C) was
D) has been',
'B', 'A2', 'easy', 'passive_voice', 'general', true, true, 1),

-- 7
('grammar', 'multiple_choice',
'The aircraft _____ in the hangar since yesterday morning.
A) is
B) was
C) has been
D) had',
'C', 'B1', 'medium', 'tense_usage', 'general', true, true, 1),

-- 8
('grammar', 'multiple_choice',
'A torque wrench is used _____ tightening bolts to a specific value.
A) to
B) for
C) with
D) by',
'B', 'A2', 'easy', 'phraseology_grammar', 'general', true, true, 1),

-- 9
('grammar', 'multiple_choice',
'Neither the pilot _____ the co-pilot noticed the oil leak during the walk-around.
A) or
B) and
C) nor
D) but',
'C', 'B1', 'medium', 'structural_accuracy', 'general', true, true, 1),

-- 10
('grammar', 'multiple_choice',
'The work order states that the component _____ be replaced within 48 hours.
A) shall
B) will
C) can
D) may',
'A', 'B1', 'medium', 'phraseology_grammar', 'general', true, true, 1),

-- 11
('grammar', 'multiple_choice',
'After _____ the inspection, the engineer signed the release certificate.
A) complete
B) completing
C) completed
D) to complete',
'B', 'B1', 'medium', 'structural_accuracy', 'general', true, true, 1),

-- 12
('grammar', 'multiple_choice',
'The safety wire _____ correctly installed on the drain plug.
A) is not
B) does not
C) not
D) no',
'A', 'A2', 'easy', 'passive_voice', 'general', true, true, 1),

-- 13
('grammar', 'multiple_choice',
'How _____ fuel is remaining in the left wing tank?
A) many
B) much
C) some
D) any',
'B', 'A2', 'easy', 'structural_accuracy', 'fuel_system', true, true, 1),

-- 14
('grammar', 'multiple_choice',
'The corrosion was found _____ the leading edge of the wing.
A) in
B) on
C) at
D) by',
'B', 'A2', 'easy', 'phraseology_grammar', 'airframe', true, true, 1),

-- 15
('grammar', 'multiple_choice',
'The technician asked his supervisor _____ he should use a different sealant.
A) what
B) which
C) whether
D) how',
'C', 'B1', 'medium', 'structural_accuracy', 'general', true, true, 1);


-- ══════════════════════════════════
-- READING — 5 questions (A2–B1)
-- ══════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, active, is_latest, version_number) VALUES

-- 1
('reading', 'multiple_choice',
'Read the following maintenance instruction:

"CAUTION: Before removing the fuel filter, ensure that the fuel supply valve is in the CLOSED position. Failure to close the valve may result in fuel spillage and fire hazard. Use only approved containers for collecting residual fuel."

According to the instruction, what must be done FIRST before removing the fuel filter?
A) Collect residual fuel in a container
B) Close the fuel supply valve
C) Check for fire hazards
D) Open the fuel filter housing',
'B', 'A2', 'easy', 'technical_manual', 'fuel_system', true, true, 1),

-- 2
('reading', 'multiple_choice',
'Read the following work order excerpt:

"Task: Replace left main landing gear tire. Reference: AMM 32-45-11. Priority: Routine. Due: Before next flight. Notes: Tire pressure was found at 145 psi (minimum limit: 150 psi). New tire part number: GY-2847-3. Ensure correct torque value of 300 in-lbs on wheel bolts per AMM specification."

Why does the tire need to be replaced?
A) It has reached its flight hour limit
B) The tire pressure is below the minimum limit
C) The tread depth is insufficient
D) The wheel bolts are damaged',
'B', 'B1', 'medium', 'sop_comprehension', 'landing_gear', true, true, 1),

-- 3
('reading', 'multiple_choice',
'Read the following safety notice:

"NOTICE TO ALL MAINTENANCE PERSONNEL
Effective immediately, all personnel working in the fuel tank area must wear anti-static clothing and use non-sparking tools. Mobile phones and electronic devices are strictly prohibited within 15 metres of open fuel tanks. Violations will result in immediate removal from the work area."

What is NOT allowed near open fuel tanks?
A) Anti-static clothing
B) Non-sparking tools
C) Mobile phones
D) Safety goggles',
'C', 'A2', 'easy', 'safety_card_reading', 'fuel_system', true, true, 1),

-- 4
('reading', 'multiple_choice',
'Read the following NOTAM:

"NOTAM A0234/26 — Runway 09L/27R closed for resurfacing from 18 MAR to 25 MAR 2026. All departures and arrivals to use Runway 09R/27L. Taxiway Bravo between intersections B3 and B5 also closed. Follow ATC instructions for alternative taxi routes."

Which taxiway section is affected by the closure?
A) Taxiway Alpha between A1 and A3
B) Taxiway Bravo between B3 and B5
C) Taxiway Charlie between C1 and C4
D) All taxiways are closed',
'B', 'B1', 'medium', 'notam_interpretation', 'general', true, true, 1),

-- 5
('reading', 'multiple_choice',
'Read the following excerpt from the Aircraft Maintenance Manual:

"5.2 Lubrication Schedule
The nose landing gear steering mechanism shall be lubricated with MIL-G-81322 grease at intervals not exceeding 200 flight hours or 90 calendar days, whichever occurs first. Apply grease through the fitting located on the upper torque link until fresh grease appears at the lower bearing seal."

How often should the nose gear steering be lubricated?
A) Every 200 flights
B) Every 200 flight hours or 90 days, whichever is first
C) Every 90 flights
D) Only when grease appears at the bearing seal',
'B', 'B1', 'medium', 'technical_manual', 'landing_gear', true, true, 1);


-- ══════════════════════════════════
-- WRITING — 3 questions (A2–B1)
-- ══════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, active, is_latest, version_number) VALUES

-- 1
('writing', 'written_response',
'You are an aircraft maintenance technician. During a routine inspection of a Boeing 737, you discovered a small crack (approximately 3 cm) on the left wing leading edge near the fuel vent. Write a brief maintenance log entry describing what you found, its location, and what action you recommend.

Write at least 40 words.',
'Model answer: During the routine inspection of aircraft B737 registration TC-ABC, a crack of approximately 3 cm was discovered on the left wing leading edge, located near the fuel vent area at Wing Station 245. The crack appears to be surface-level but requires further NDT inspection. I recommend grounding the aircraft until structural engineering assessment is completed per SRM Chapter 57.',
'B1', 'medium', 'maintenance_log', 'airframe', true, true, 1),

-- 2
('writing', 'written_response',
'A new apprentice technician has joined your team. Write a short email (at least 40 words) to your supervisor explaining:
- The apprentice''s name (you can make one up)
- What tasks you plan to assign to them this week
- What safety training they still need to complete',
'Model answer: Subject: New Apprentice Onboarding - Week 1 Plan. Dear Mr. Yilmaz, I am writing to inform you that our new apprentice, Mehmet Kaya, started today. This week, I plan to assign him basic visual inspection tasks on the airframe exterior and familiarization with our tool inventory system. He still needs to complete the Hangar Safety Induction, FOD Awareness, and Hazardous Materials Handling modules before he can work independently. I will supervise him at all times until these trainings are completed. Best regards.',
'B1', 'medium', 'operational_message', 'general', true, true, 1),

-- 3
('writing', 'written_response',
'You found that a colleague left tools inside an aircraft engine cowling after maintenance. This is a serious FOD (Foreign Object Damage) risk. Write a short incident report (at least 40 words) describing:
- What happened
- Where the tools were found
- What you did about it',
'Model answer: FOD Incident Report — Date: 18 March 2026. During a post-maintenance walk-around inspection of aircraft TC-XYZ (A320), I discovered a socket wrench and two screwdriver bits inside the right engine cowling area. The items were not logged on the tool control sheet. I immediately removed the tools, reported the finding to the shift supervisor, and initiated a full tool inventory check. The engine was re-inspected for any damage before being cleared for service.',
'A2', 'easy', 'incident_report', 'engine', true, true, 1);


-- ══════════════════════════════════
-- SPEAKING — 4 questions (A2–B1)
-- ══════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, active, is_latest, version_number) VALUES

-- 1
('speaking', 'audio_response',
'Describe the steps you would follow to perform a daily pre-flight visual inspection of an aircraft. Talk about at least 3 areas you would check and explain why each is important.

Speak for at least 30 seconds.',
'Expected: Candidate should mention checking the airframe exterior for damage/cracks, checking tires for wear/pressure, checking fluid levels (oil, hydraulic), checking control surfaces for freedom of movement, and checking for any leaks or loose fasteners. Clear structure and basic aviation vocabulary expected.',
'B1', 'medium', 'oral_briefing', 'general', true, true, 1),

-- 2
('speaking', 'audio_response',
'Your supervisor asks you: "What safety precautions do you take when working near aircraft fuel systems?"

Respond as if you are speaking to your supervisor. Mention at least 3 safety precautions.

Speak for at least 30 seconds.',
'Expected: Candidate should mention anti-static clothing, non-sparking tools, no electronic devices, fire extinguisher nearby, fuel spill containment, proper ventilation. Should use appropriate vocabulary and show awareness of fuel safety procedures.',
'A2', 'easy', 'ground_communication', 'fuel_system', true, true, 1),

-- 3
('speaking', 'audio_response',
'Roleplay: You are calling the parts department to order a replacement brake assembly for an Airbus A320. Explain what part you need, why you need it, and ask about availability.

Speak for at least 30 seconds.',
'Expected: Candidate should identify themselves, state the aircraft type and registration, describe the part needed (brake assembly), explain the reason (worn beyond limits during inspection), ask about delivery timeline. Professional tone and clear communication expected.',
'B1', 'medium', 'roleplay_emergency', 'landing_gear', true, true, 1),

-- 4
('speaking', 'audio_response',
'Explain in simple terms what FOD (Foreign Object Damage) means and why it is dangerous in aviation maintenance. Give one example of how FOD can be prevented.

Speak for at least 30 seconds.',
'Expected: Candidate should define FOD, explain that foreign objects in engines or on runways can cause serious damage or accidents, and mention prevention measures such as tool control, clean work areas, FOD walks, and proper storage of materials.',
'A2', 'easy', 'oral_briefing', 'general', true, true, 1);


-- ══════════════════════════════════
-- LISTENING — 8 questions (A2–B1)
-- (Note: audio_url is null — you can upload audio files later via admin panel)
-- ══════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, active, is_latest, version_number) VALUES

-- 1
('listening', 'multiple_choice',
'Listen to the ground crew communication:

[Audio transcript for testing — replace with actual audio later]
"Maintenance Control, this is Hangar 3. We have completed the engine oil change on aircraft TC-FLY. Oil quantity is 12 quarts. Ready for engine run-up test. Requesting permission to proceed."

What has the hangar crew completed?
A) A tire change
B) An engine oil change
C) A fuel system check
D) A hydraulic test',
'B', 'A2', 'easy', 'ground_ops_radio', 'engine', true, true, 1),

-- 2
('listening', 'multiple_choice',
'Listen to the safety briefing:

[Audio transcript]
"Attention all personnel. Due to the thunderstorm warning, all outdoor maintenance activities are suspended effective immediately. All aircraft on the ramp must be secured with additional tie-downs. Personnel must move to indoor locations. Resume work only after the all-clear is announced."

What must happen to aircraft on the ramp?
A) They should be moved to the hangar
B) They should be secured with extra tie-downs
C) They should be fueled immediately
D) Nothing, they are already safe',
'B', 'A2', 'easy', 'emergency_broadcast', 'general', true, true, 1),

-- 3
('listening', 'multiple_choice',
'Listen to the shift handover:

[Audio transcript]
"Okay, here is the status for the night shift. Aircraft TC-SUN in Bay 2 needs a left main gear tire change — the parts are already in the staging area. TC-AIR in Bay 5 is waiting for a hydraulic pump from stores, expected by midnight. And TC-FLY in the paint shop is not our responsibility tonight."

Which aircraft is waiting for a part from stores?
A) TC-SUN
B) TC-AIR
C) TC-FLY
D) All of them',
'B', 'B1', 'medium', 'cockpit_communication', 'general', true, true, 1),

-- 4
('listening', 'multiple_choice',
'Listen to the radio communication:

[Audio transcript]
"Ground, this is Maintenance Tug 7. Requesting permission to tow aircraft TC-JET from Gate 14 to Hangar 2 via Taxiway Alpha. We have wing walkers in position."

Where is the aircraft being towed to?
A) Gate 14
B) Hangar 2
C) Taxiway Alpha
D) The runway',
'B', 'A2', 'easy', 'ground_ops_radio', 'general', true, true, 1),

-- 5
('listening', 'multiple_choice',
'Listen to the maintenance supervisor:

[Audio transcript]
"Team, we have an AOG situation on TC-BIRD. The right engine starter motor has failed and the airline needs this aircraft by 0600 tomorrow. I need two experienced technicians on this immediately. Everyone else, continue with your scheduled tasks."

What does AOG mean in this context?
A) Aircraft On Ground — the plane cannot fly until repaired
B) Aircraft Operating Good — no issues
C) Arrival On Gate — the plane just arrived
D) All Operations Go — everything is normal',
'A', 'B1', 'medium', 'cockpit_communication', 'engine', true, true, 1),

-- 6
('listening', 'multiple_choice',
'Listen to the parts coordinator:

[Audio transcript]
"The replacement hydraulic actuator for TC-SUN has arrived from Istanbul. Part number HYD-4421-B. It is currently in Receiving and needs to be inspected by Quality before you can install it. Estimated release time is 1400 local."

When will the part be available for installation?
A) Immediately
B) After quality inspection, around 1400
C) Tomorrow morning
D) It has not arrived yet',
'B', 'B1', 'medium', 'ground_ops_radio', 'hydraulic', true, true, 1),

-- 7
('listening', 'multiple_choice',
'Listen to the training instructor:

[Audio transcript]
"When you lock-wire a bolt, always ensure the wire pulls in the tightening direction. Use 0.032-inch diameter wire for standard applications. The wire must pass through the hole in the bolt head and be twisted with pliers — minimum 6 twists per inch. Never reuse lock wire."

What is the minimum number of twists per inch for lock wire?
A) 3 twists
B) 4 twists
C) 6 twists
D) 8 twists',
'C', 'B1', 'medium', 'passenger_instruction', 'general', true, true, 1),

-- 8
('listening', 'multiple_choice',
'Listen to the announcement:

[Audio transcript]
"Attention maintenance staff: The calibration lab will be closed this Friday for equipment upgrades. All torque wrenches and test equipment due for calibration this week must be submitted by Thursday end of shift. Late submissions will be scheduled for the following week."

By when must equipment be submitted for calibration?
A) Friday morning
B) Thursday end of shift
C) Next Monday
D) Immediately',
'B', 'A2', 'easy', 'cabin_announcement', 'general', true, true, 1);


-- ═══════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════
SELECT section, cefr_level, difficulty, count(*) 
FROM questions 
WHERE active = true AND is_latest = true
GROUP BY section, cefr_level, difficulty
ORDER BY section, cefr_level, difficulty;
