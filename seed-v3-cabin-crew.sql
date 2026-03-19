-- ═══════════════════════════════════════════════════════════════
-- AVILINGO v3 — CABIN CREW QUESTIONS
-- ~75 questions: all sections and types
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, role_tag, active, is_latest, version_number) VALUES

-- ── GRAMMAR ──
('grammar','multiple_choice','The cabin director _____ passengers to remain seated during turbulence.
A) asked  B) is asking  C) ask  D) has ask','A','A2','easy','phraseology_grammar','general','cabin_crew',true,true,1),
('grammar','multiple_choice','Before take-off, all doors _____ armed and cross-checked.
A) must be  B) must  C) are must  D) should been','A','B1','easy','passive_voice','general','cabin_crew',true,true,1),
('grammar','multiple_choice','The passenger who _____ the aisle seat has asked for an extra pillow.
A) was in  B) is in  C) in  D) are in','B','A2','easy','structural_accuracy','general','cabin_crew',true,true,1),
('grammar','multiple_choice','If a passenger _____ to put their bag in the overhead bin, offer assistance.
A) struggles  B) will struggle  C) struggle  D) struggling','A','B1','medium','conditional_forms','general','cabin_crew',true,true,1),
('grammar','multiple_choice','The special meals _____ loaded correctly for this flight.
A) were not  B) was not  C) had been  D) have be','A','B1','medium','tense_usage','general','cabin_crew',true,true,1),
('grammar','multiple_choice','The child in seat 4B _____ unaccompanied and must be checked regularly.
A) is  B) are  C) being  D) has','A','A2','easy','structural_accuracy','general','cabin_crew',true,true,1),
('grammar','multiple_choice','All cabin crew _____ their positions for landing in the next 10 minutes.
A) should take  B) should taking  C) should taken  D) should to take','A','B1','medium','structural_accuracy','general','cabin_crew',true,true,1),
('grammar','multiple_choice','The duty-free trolley _____ away during turbulence.
A) must be stowed  B) must stow  C) is must  D) stowed itself','A','B1','medium','passive_voice','general','cabin_crew',true,true,1),
('grammar','multiple_choice','By the time the doors opened, all passengers _____ their belongings.
A) had retrieved  B) retrieved  C) have retrieve  D) will have retrieve','A','B2','medium','tense_usage','general','cabin_crew',true,true,1),
('grammar','multiple_choice','It is essential that cabin crew _____ a calm and professional demeanour at all times.
A) maintain  B) maintains  C) maintaining  D) to maintain','A','C1','hard','structural_accuracy','general','cabin_crew',true,true,1),
('grammar','fill_blank','Complete: The emergency exits _____ (locate) at the front and rear of the aircraft.','are located','A2','easy','passive_voice','general','cabin_crew',true,true,1),
('grammar','fill_blank','Complete: The passenger _____ (feel) sick and requested an airsickness bag.','felt','A2','easy','tense_usage','general','cabin_crew',true,true,1),
('grammar','fill_blank','Complete: All overhead bins _____ (close) before takeoff.','must be closed','B1','easy','passive_voice','general','cabin_crew',true,true,1),
('grammar','fill_blank','Complete: She spoke _____ (gentle) to the frightened passenger.','gently','B1','easy','structural_accuracy','general','cabin_crew',true,true,1),
('grammar','fill_blank','Complete: The medical kit _____ (check) by the lead attendant before departure.','was checked','B1','medium','passive_voice','general','cabin_crew',true,true,1),
('grammar','error_correction','Find and correct the error:
"All passenger should remain seated until the seatbelt sign have turned off."','passengers (passenger → passengers) AND has turned off (have → has)','B1','medium','structural_accuracy','general','cabin_crew',true,true,1),
('grammar','error_correction','Find and correct the error:
"If the passenger will need assistance, please alert the cabin director."','needs (will need → needs; first conditional)','B2','medium','conditional_forms','general','cabin_crew',true,true,1),
('grammar','error_correction','Find and correct the error:
"The hand luggage must been stowed before takeoff."','must be stowed (been → be; passive infinitive)','B1','medium','passive_voice','general','cabin_crew',true,true,1),
('grammar','error_correction','Find and correct the error:
"The announcement were made in three languages."','was made (were → was; singular subject "announcement")','B1','easy','tense_usage','general','cabin_crew',true,true,1),
('grammar','short_answer','Rewrite in passive: "The cabin director briefed all crew on emergency procedures."','All crew were briefed on emergency procedures by the cabin director.','B2','medium','passive_voice','general','cabin_crew',true,true,1),

-- ── READING ──
('reading','multiple_choice','Read the passenger safety card:
"In the event of a water ditching: 1. Follow crew instructions 2. Put on life vest when instructed 3. Proceed to the nearest exit 4. Jump into water feet first 5. Move away from the aircraft"

What is the FOURTH step?
A) Put on life vest  B) Jump feet first  C) Follow crew  D) Move away','B','A2','easy','safety_card_reading','general','cabin_crew',true,true,1),
('reading','multiple_choice','Read the medical kit checklist:
"Contents: Aspirin (12 tablets), adrenaline auto-injector (2), blood pressure cuff (1), glucose gel (3 packets), defibrillator (1 if equipped), latex-free gloves (10 pairs). Check quarterly for expiry."

How often should expiry dates be checked?
A) Monthly  B) Weekly  C) Quarterly  D) Annually','C','B1','easy','sop_comprehension','general','cabin_crew',true,true,1),
('reading','multiple_choice','Read the company SOP:
"Unaccompanied minors (UM) between ages 5-11 must be escorted to their seats by cabin crew. A UM form must be completed and signed before boarding. The UM must be handed to ground staff only — never left unattended."

Who CANNOT receive the child at destination?
A) Ground staff  B) The child''s parent waiting at the gate  C) Cabin crew  D) An unrelated adult — UM must be handed to verified ground staff only','D','B2','medium','sop_comprehension','general','cabin_crew',true,true,1),
('reading','true_false','Read the announcement script:
"Ladies and gentlemen, as we begin our descent into landing, please ensure your seat back and folding tables are in the upright position, your seat belt is securely fastened, and all carry-on luggage is stowed."

Statement: Passengers may keep their seats reclined during descent.
Answer TRUE or FALSE.','FALSE — the announcement states seats must be in the UPRIGHT position during descent','A2','easy','sop_comprehension','general','cabin_crew',true,true,1),
('reading','true_false','Read the SOP:
"Doors must be disarmed before opening upon arrival. Failure to disarm will activate the emergency slide."

Statement: It is acceptable to open the door before disarming in an emergency.
TRUE or FALSE?','FALSE for normal operations — in an EMERGENCY, the door may be opened with slide armed intentionally for evacuation (this is an ambiguous scenario — accept: FALSE in normal operations, with explanation)','C1','hard','sop_comprehension','general','cabin_crew',true,true,1),
('reading','short_answer','Read the menu card:
"Halal option (H), Vegetarian option (V), Nut-free meal (N-F), Diabetic meal (D), Child meal (C). Must be pre-ordered 24 hours in advance."

A passenger wants a meal with no nuts. Which code should have been on their booking?','N-F (Nut-free meal)','A2','easy','sop_comprehension','general','cabin_crew',true,true,1),

-- ── LISTENING ──
('listening','multiple_choice','[AUDIO] "Cabin crew, prepare for landing. Thirty minutes to destination. Seatbelt signs are now on."

What should cabin crew do after this announcement?
A) Start serving meals  B) Prepare for landing and ensure passengers are seated  C) Prepare the doors for arrival  D) Make a landing announcement','B','A2','easy','cabin_announcement','general','cabin_crew',true,true,1),
('listening','multiple_choice','[AUDIO] "Red light flashing in galley panel. This is a call from seat 28B. Passenger states they are having an allergic reaction."

What is the priority action?
A) Notify the captain  B) Bring the medical kit immediately  C) Ask the passenger to describe symptoms first  D) Both A and B simultaneously','D','B2','medium','cabin_announcement','general','cabin_crew',true,true,1),
('listening','multiple_choice','[AUDIO] "Ladies and gentlemen, due to unexpected turbulence, we request all passengers return to their seats and fasten their seatbelts. Cabin crew please be seated at your jump seats immediately."

What must the cabin crew do?
A) Continue serving  B) Secure the galley and sit at jump seats  C) Assist passengers to their seats  D) Contact the captain','B','B1','easy','cabin_announcement','general','cabin_crew',true,true,1),
('listening','multiple_choice','[AUDIO] "Attention cabin crew: door 1L has not been armed. Please arm door 1L immediately and call the galley when complete."

Which door needs to be armed?
A) Door 1R  B) Door 2L  C) Door 1L  D) All doors','C','A2','easy','cabin_announcement','general','cabin_crew',true,true,1),
('listening','multiple_choice','[AUDIO] "This is your captain. We have a passenger medical emergency. There is a doctor on board — would they please identify themselves to the nearest crew member. We are assessing a diversion."

What does the crew need to find?
A) The medical kit only  B) A doctor on board  C) ACARS to contact dispatch  D) An AED','B','B1','easy','cockpit_communication','general','cabin_crew',true,true,1),
('listening','ordering','[AUDIO] Listen to the door-arming announcement. Order the steps:
A) Close and lock the door  B) Move the arming lever to ARMED position  C) Confirm cross-check with opposite crew  D) Check slide inflation tube is connected
Correct sequence?','D, B, A, C — Check tube connected → arm lever → close door → cross-check','B1','medium','sop_comprehension','general','cabin_crew',true,true,1),

-- ── WRITING ──
('writing','written_response','A passenger was rude and verbally abusive to your colleague during a meal service. Write a crew incident report (minimum 70 words) describing the incident, the passenger behaviour, how it was handled, and your recommendation.','Model: Date/time/flight, seat number, description of verbal behaviour, crew response (calm de-escalation, involving cabin director), outcome (passenger apologised/warning issued), recommendation (flag passenger in system, notify ground staff at arrival).','B2','medium','incident_report','general','cabin_crew',true,true,1),
('writing','written_response','Write a professional passenger announcement (minimum 40 words) for beginning descent into Istanbul. Include seatbelt instruction, seats upright, tray tables, and estimated arrival time (25 minutes).','Model: Ladies and gentlemen, we are beginning our descent into Istanbul Airports. Please return your seat to the upright position, stow your tray tables and ensure your seatbelt is securely fastened. We expect to land in approximately 25 minutes. Local time is [X].','A2','easy','cabin_announcement','general','cabin_crew',true,true,1),
('writing','written_response','A passenger left behind personal items (laptop, jacket) after disembarkation. Write a short notification email (minimum 50 words) to the lost and found department describing the items and where they were found.','Model: Subject: Found Items — Flight TK-XXX, Date. Hi team, following the arrival of flight TK-XXX, I found a grey laptop bag and blue jacket at seat 22A. Items have been handed to ground staff at Gate 7. Passenger name unknown. Please process accordingly.','B1','medium','operational_message','general','cabin_crew',true,true,1),
('writing','written_response','Write a detailed handover note (80+ words) for the next cabin crew team covering: number of passengers, any special passengers (UM, WCHR), medical situation during flight, duty-free inventory discrepancy, and any damaged interior items.','Model: Total PAX 187/210. 2 UM (seats 12A/12B, forms signed). One WCHR passenger at 5A (needs ground assistance). Medical: passenger 28B had BP episode, recovered, given water, captain notified. Duty-free: cologne item inventory short by 1. Seat 34C tray table hinge broken.','C1','hard','operational_message','general','cabin_crew',true,true,1),

-- ── SPEAKING ──
('speaking','audio_response','A passenger is panicking about turbulence and is very scared. Demonstrate how you would speak to and calm this passenger. Be empathetic but professional.
Speak for at least 40 seconds.','Approach calmly, acknowledge fear, normalize turbulence, explain aircraft is designed for it, offer reassurance, remain seated and close. Empathetic language, not dismissive.','B2','medium','passenger_instruction','general','cabin_crew',true,true,1),
('speaking','audio_response','Demonstrate the safety demonstration for an Airbus A320/B737: brace position, seatbelt, oxygen mask, life vest, exits.
Speak for at least 60 seconds.','All 5 elements covered clearly: brace position described, seatbelt demonstrated (fasten/tighten/release), oxygen mask (pull, cover, breathe), life vest (under seat, stole, blow), exit locations (nearest may be behind).','B1','medium','passenger_instruction','general','cabin_crew',true,true,1),
('speaking','audio_response','A passenger has a severe peanut allergy and is concerned about other passengers consuming peanut products. What do you tell them, and what actions do you take?
Speak for at least 40 seconds.','Acknowledge seriousness, confirm meal loading (check nut-free meal), announce on PA requesting peanut avoidance in vicinity, keep medical kit ready, reassure passenger, document in report.','B2','medium','passenger_instruction','general','cabin_crew',true,true,1);
