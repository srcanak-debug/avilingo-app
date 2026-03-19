-- ═══════════════════════════════════════════════════════════════
-- AVILINGO v3 — GROUND STAFF QUESTIONS
-- ~60 questions: all sections and types
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, role_tag, active, is_latest, version_number) VALUES

-- ── GRAMMAR ──
('grammar','multiple_choice','Passengers _____ escorted to the gate if they need assistance.
A) must be  B) must  C) should been  D) needed','A','A2','easy','passive_voice','general','ground_staff',true,true,1),
('grammar','multiple_choice','The check-in system _____ offline for 20 minutes this morning.
A) was  B) were  C) is  D) be','A','A2','easy','tense_usage','general','ground_staff',true,true,1),
('grammar','multiple_choice','If a passenger _____ angry, stay calm and listen before responding.
A) becomes  B) will become  C) become  D) becoming','A','B1','medium','conditional_forms','general','ground_staff',true,true,1),
('grammar','multiple_choice','All baggage _____ for security before being placed on the belt.
A) is screened  B) screened  C) screens  D) must screening','A','B1','medium','passive_voice','general','ground_staff',true,true,1),
('grammar','multiple_choice','The departure time _____ delayed by 35 minutes due to late connecting passengers.
A) has been  B) have been  C) is having  D) was being','A','B1','easy','tense_usage','general','ground_staff',true,true,1),
('grammar','multiple_choice','Neither the gate agent _____ the supervisor had the override code.
A) nor  B) or  C) and  D) not','A','B2','medium','structural_accuracy','general','ground_staff',true,true,1),
('grammar','multiple_choice','By the time boarding completed, 12 passengers _____ not yet arrived at the gate.
A) had  B) have  C) has  D) were','A','B2','medium','tense_usage','general','ground_staff',true,true,1),
('grammar','multiple_choice','The offloaded bags _____ returned to passengers at the carousel.
A) will be  B) will  C) are being to  D) be','A','B1','medium','passive_voice','general','ground_staff',true,true,1),
('grammar','fill_blank','Complete: The passenger _____ (already/check in) when the system went down.','had already checked in','B2','medium','tense_usage','general','ground_staff',true,true,1),
('grammar','fill_blank','Complete: Unaccompanied minors _____ (hand over) only to authorized adults.','must be handed over','B1','medium','passive_voice','general','ground_staff',true,true,1),
('grammar','fill_blank','Complete: The wheelchair passenger _____ (assist) at every stage of their journey.','must be assisted','A2','easy','passive_voice','general','ground_staff',true,true,1),
('grammar','error_correction','Find and correct the error:
"All departure gates is now showing on screen three."','are (is → are; plural subject "all departure gates")','A2','easy','structural_accuracy','general','ground_staff',true,true,1),
('grammar','error_correction','Find and correct the error:
"The passenger were inform that their bag was on a later flight."','was informed (were inform → was informed; passive voice, singular)','B1','medium','passive_voice','general','ground_staff',true,true,1),
('grammar','error_correction','Find and correct the error:
"If the flight will be overbooked, some passengers may be rerouted."','is overbooked (will be → is; first conditional)','B2','medium','conditional_forms','general','ground_staff',true,true,1),
('grammar','short_answer','What is the correct short form for a passenger needing a wheelchair at the airport?','WCHR (Wheelchair Required)','A2','easy','phraseology_grammar','general','ground_staff',true,true,1),
('grammar','short_answer','Rewrite in passive: "The gate agent processed the boarding passes."','The boarding passes were processed by the gate agent.','B2','medium','passive_voice','general','ground_staff',true,true,1),

-- ── READING ──
('reading','multiple_choice','Read the ground operations bulletin:
"All vehicles on the apron must observe a speed limit of 25 km/h. Within 15 metres of aircraft, the limit is 5 km/h. Drivers must always yield to aircraft towing operations. Flashing orange light on vehicle must be active at all times."

What is the speed limit within 15 metres of an aircraft?
A) 25 km/h  B) 10 km/h  C) 15 km/h  D) 5 km/h','D','A2','easy','sop_comprehension','general','ground_staff',true,true,1),
('reading','multiple_choice','Read the dangerous goods notice:
"Passengers may carry lithium batteries in cabin baggage only if they do not exceed 100Wh per battery. Batteries between 100-160Wh require airline approval. Batteries above 160Wh are prohibited."

A passenger has a 120Wh battery. What rule applies?
A) Permitted in cabin  B) Requires airline approval  C) Must go in hold luggage  D) Prohibited entirely','B','B2','medium','sop_comprehension','general','ground_staff',true,true,1),
('reading','multiple_choice','Read the customer service policy:
"In the event of a flight cancellation, passengers must be offered: 1) A full refund, or 2) Rerouting on the earliest available flight. In addition, for delays over 3 hours, refreshment vouchers must be provided."

A flight is cancelled. A passenger wants to travel as soon as possible. What must you offer?
A) Refund only  B) Rerouting at their own expense  C) Rerouting on the earliest available flight  D) Vouchers and rerouting','C','B1','medium','sop_comprehension','general','ground_staff',true,true,1),
('reading','true_false','Read the security notice:
"Zone 3 (airside) requires a valid ID AND a valid airside pass with Zone 3 access. Personnel with Zone 2 access cannot enter Zone 3 unescorted."

Statement: A person with Zone 2 access can enter Zone 3 alone if they have valid ID.
TRUE or FALSE?','FALSE — Zone 3 requires a specific Zone 3 access pass; Zone 2 does not grant unescorted access to Zone 3','B1','medium','sop_comprehension','general','ground_staff',true,true,1),
('reading','short_answer','Read: "Connecting passengers with less than 45 minutes MCT (Minimum Connection Time) on domestic connections must be assisted immediately."
A passenger arrives with 30 minutes to their domestic connection. Do they qualify for immediate assistance?','Yes — 30 minutes is below the 45-minute MCT threshold','B1','easy','sop_comprehension','general','ground_staff',true,true,1),

-- ── LISTENING ──
('listening','multiple_choice','[AUDIO] "Gate B12 announcement: Boarding for Flight TK-204 to Ankara will commence in 10 minutes. Priority boarding is now open for passengers needing extra time, families with young children, and business class. All other passengers please wait for your group call."

Who should board right now?
A) Economy class group A  B) Business class and families with children  C) Children only  D) Nobody yet','B','A2','easy','cabin_announcement','general','ground_staff',true,true,1),
('listening','multiple_choice','[AUDIO] "Attention gate agents: flight TK-306 is weight-restricted today by 320 kg. We have 3 volunteers needed for a later flight. Compensation: vouchers plus rerouting. Please ask for volunteers at check-in."

Why are volunteers needed?
A) Aircraft overbooked  B) Weight restriction  C) Weather delay  D) Ground crew shortage','B','B1','easy','ground_ops_radio','general','ground_staff',true,true,1),
('listening','multiple_choice','[AUDIO] "Ground to all staff: ramp safety check in 5 minutes. Parkway between Stands 3 and 5 is blocked by maintenance vehicle. Route 6 diverted via Charlie taxiway. Update your manifests."

What is blocked?
A) Check-in desks  B) Parkway between Stands 3 and 5  C) Taxiway Alpha  D) Gate B12','B','B1','medium','ground_ops_radio','general','ground_staff',true,true,1),
('listening','multiple_choice','[AUDIO] "Lost and found: A grey laptop bag with initials S.K. was found at gate 14 after the Istanbul departure. Please log in the system and contact operations for passenger detail check."

Where was the bag found?
A) Check-in counter  B) Security gate  C) Gate 14  D) Baggage carousel','C','A2','easy','ground_ops_radio','general','ground_staff',true,true,1),
('listening','multiple_choice','[AUDIO] "Terminal management: All check-in counters for flights departing after 21:00 will move to Zone C starting tomorrow. Agents should update their zones and brief passengers proactively."

When does the change start?
A) Today  B) Tonight after 21:00  C) Tomorrow  D) After zone update','C','A2','easy','cabin_announcement','general','ground_staff',true,true,1),
('listening','ordering','[AUDIO] Listen to the boarding procedure sequence. Order the steps:
A) Start general boarding by group  B) Announce final boarding  C) Priority boarding (WCHR, families)  D) Close flight and issue no-show list
Correct sequence?','C, A, B, D — Priority → General groups → Final call → Close flight','A2','easy','sop_comprehension','general','ground_staff',true,true,1),

-- ── WRITING ──
('writing','written_response','A passenger missed their connection due to a 2-hour delay in your terminal. They are very upset. Write an email (minimum 60 words) to the duty manager explaining the situation, what steps were taken, and what needs to happen next.','Model: Describe delay length, passenger circumstances (connecting flight missed), steps taken (rebooking onto next available, meal voucher provided), what is outstanding (hotel room request pending, claim form submitted), recommendation for supervisor action.','B1','medium','passenger_complaint','general','ground_staff',true,true,1),
('writing','written_response','Write a ground incident report (minimum 70 words) for the following: At 1320, a baggage tug drove past the safety line near Stand 8A while an aircraft was arriving on stand. The driver did not stop when the stand marshal signalled. No collision or injury occurred.','Model: Time/date, location (Stand 8A), description of tug driver''s non-compliance, stand marshal action, near-miss severity, no injury but potential hazard, recommendation (CCTV review, driver ID, refresher on apron driving protocols).','B2','medium','incident_report','general','ground_staff',true,true,1),
('writing','written_response','Write a shift briefing note (minimum 50 words) for your team working the morning peak (0500-1300). Include: number of departures expected (12), a delayed flight (TK-208, 45 mins late), VIP on flight TK-106 (special escort required), and today''s stand changes.','Model: 12 departures 0500-1300, TK-208 delayed 45min (original 0720 → now 0805), TK-106 VIP escort required (coordinate security and CIP lounge), stand changes: all 777 aircraft moved from A-pier to B-pier today.','B1','medium','operational_message','general','ground_staff',true,true,1),

-- ── SPEAKING ──
('speaking','audio_response','An angry passenger is yelling at you because their checked bag did not arrive. Demonstrate how you would handle this situation professionally. Include how you greet them, what you say, and what actions you take.
Speak for at least 45 seconds.','Calm greeting, acknowledge frustration, apologise, take baggage claim details, check system, open PIR (Property Irregularity Report), give them the reference number, explain the process and timeline, offer compensation (toiletry kit, delivery).','B2','medium','passenger_instruction','general','ground_staff',true,true,1),
('speaking','audio_response','Explain the boarding process for a flight to a new colleague. Include priority boarding, group boarding, what to do with overhand baggage issues, and final boarding call.
Speak for at least 50 seconds.','Priority boarding first (WCHR, families, business), then economy groups in order, guide passengers with oversized bags (gate check), final boarding call 10 min before departure, close flight and send no-show list.','B1','medium','ground_communication','general','ground_staff',true,true,1),
('speaking','audio_response','Describe the dangerous goods regulations for a lithium battery in plain language that a passenger could understand. What can they carry, and what is prohibited?
Speak for at least 40 seconds.','Under 100Wh: allowed in cabin, freely. 100-160Wh: cabin only with airline approval. Over 160Wh: prohibited entirely. No lithium batteries in checked hold baggage unless in devices. Spare batteries must be in cabin.','B2','medium','passenger_instruction','general','ground_staff',true,true,1);
