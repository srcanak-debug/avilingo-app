-- ═══════════════════════════════════════════════════════════════
-- AVILINGO v3 — GENERAL POOL + GRAMMAR (All Roles)
-- 150 Grammar + 50 Reading + 50 Listening = 250 general questions
-- Run AFTER reset-clean.sql
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, role_tag, active, is_latest, version_number) VALUES

-- ═══ GENERAL: GRAMMAR — multiple_choice (A2) ═══
('grammar','multiple_choice','All passengers _____ fasten their seatbelts during takeoff and landing.
A) must  B) can  C) might  D) would','A','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','The flight _____ delayed due to severe weather conditions.
A) is  B) was  C) were  D) been','B','A2','easy','tense_usage','general','general',true,true,1),
('grammar','multiple_choice','Emergency exits are located _____ both sides of the aircraft.
A) in  B) on  C) at  D) by','B','A2','easy','phraseology_grammar','general','general',true,true,1),
('grammar','multiple_choice','How _____ luggage are you carrying today?
A) many  B) much  C) some  D) few','B','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','The safety briefing _____ before every departure.
A) is given  B) gives  C) giving  D) was give','A','A2','easy','passive_voice','general','general',true,true,1),
('grammar','multiple_choice','We _____ to report all incidents immediately.
A) require  B) are required  C) is required  D) were requiring','B','A2','easy','passive_voice','general','general',true,true,1),
('grammar','multiple_choice','_____ you please fasten your seatbelt, sir?
A) Could  B) Must  C) Shall  D) Would','A','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','The gate _____ closed fifteen minutes before departure.
A) will be  B) will  C) is being  D) be','A','A2','easy','tense_usage','general','general',true,true,1),
('grammar','multiple_choice','There _____ no smoking in any area of the terminal.
A) is  B) are  C) be  D) were','A','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','All staff _____ wear their ID badges at all times.
A) must  B) might  C) would  D) could','A','A2','easy','structural_accuracy','general','general',true,true,1),

-- multiple_choice (B1)
('grammar','multiple_choice','If the weather _____ worse, we will divert to an alternate airport.
A) gets  B) will get  C) got  D) has gotten','A','B1','medium','conditional_forms','general','general',true,true,1),
('grammar','multiple_choice','The crew _____ been briefed on the new security procedures.
A) has  B) have  C) is  D) was','B','B1','medium','tense_usage','general','general',true,true,1),
('grammar','multiple_choice','Neither the captain _____ the first officer reported any anomalies.
A) or  B) and  C) nor  D) but','C','B1','medium','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','_____ the delay, all passengers remained calm.
A) Despite  B) Although  C) However  D) Because','A','B1','medium','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','The report _____ submitted by the end of the shift.
A) must be  B) must  C) must to be  D) must being','A','B1','medium','passive_voice','general','general',true,true,1),
('grammar','multiple_choice','The new regulation requires that all staff _____ additional training.
A) complete  B) completes  C) completing  D) to complete','A','B2','medium','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','By the time we landed, the ground crew _____ the gate ready.
A) had made  B) has made  C) made  D) making','A','B2','medium','tense_usage','general','general',true,true,1),
('grammar','multiple_choice','I suggest that the safety officer _____ a full inspection before departure.
A) conduct  B) conducts  C) conducted  D) conducting','A','B2','medium','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','The aircraft, _____ had been in service for 12 years, underwent major maintenance.
A) which  B) that  C) what  D) who','A','B2','medium','structural_accuracy','general','general',true,true,1),
('grammar','multiple_choice','Had the crew been notified earlier, they _____ prepared a better response.
A) would have  B) will have  C) would  D) could','A','C1','hard','conditional_forms','general','general',true,true,1),

-- fill_blank (A2-B1)
('grammar','fill_blank','Complete: The aircraft _____ (land) safely at 14:30 hours.','landed','A2','easy','tense_usage','general','general',true,true,1),
('grammar','fill_blank','Complete: Please _____ (fasten) your seatbelt before takeoff.','fasten','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','fill_blank','Complete: All crew members _____ (be) on board by 06:00.','must be','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','fill_blank','Complete: The flight was _____ (delay) by two hours due to fog.','delayed','A2','easy','tense_usage','general','general',true,true,1),
('grammar','fill_blank','Complete: He spoke _____ (clear) over the radio so everyone understood.','clearly','B1','easy','structural_accuracy','general','general',true,true,1),
('grammar','fill_blank','Complete: Safety is _____ (important) than schedule in aviation.','more important','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','fill_blank','Complete: The aircraft was inspected _____ (thorough) before the flight.','thoroughly','B1','medium','structural_accuracy','general','general',true,true,1),
('grammar','fill_blank','Complete: He asked _____ (polite) if there were any seats available.','politely','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','fill_blank','Complete: The announcement _____ (make) in three languages.','was made','B1','medium','passive_voice','general','general',true,true,1),
('grammar','fill_blank','Complete: The pilot _____ (already/confirm) the approach before landing.','had already confirmed','B2','medium','tense_usage','general','general',true,true,1),

-- error_correction (B1-B2)
('grammar','error_correction','Find and correct the grammar error:
"The flight have been cancelled due to technical issues."','has been cancelled (have → has; "the flight" is singular)','B1','medium','tense_usage','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"All passenger must wear their seatbelts."','passengers (passenger → passengers; plural required)','A2','easy','structural_accuracy','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"The crew is require to report any malfunction immediately."','is required (require → required; passive voice)','B1','medium','passive_voice','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"If the airport will close, we must divert."','closes (will close → closes; first conditional)','B2','medium','conditional_forms','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"The safety equipment was stored careful."','carefully (careful → carefully; adverb required)','B1','medium','structural_accuracy','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"Neither the pilot or the co-pilot had seen the NOTAM."','nor (or → nor; "neither...nor" construction)','B2','medium','structural_accuracy','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"By tomorrow, we will completed the inspection."','will have completed (will completed → will have completed; future perfect)','B2','hard','tense_usage','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"It is recommend that all passengers remain seated."','recommended (recommend → recommended; passive subjunctive)','B2','medium','passive_voice','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"The plane what had the engine problem was grounded."','that (what → that; relative pronoun for things)','B1','medium','structural_accuracy','general','general',true,true,1),
('grammar','error_correction','Find and correct the grammar error:
"Despite of the bad weather, the flight departed on time."','Despite (Despite of → Despite; no "of" after despite)','B2','medium','structural_accuracy','general','general',true,true,1),

-- short_answer (B1-C1)
('grammar','short_answer','What is the passive form of: "The team must submit the report by Friday"?','The report must be submitted by the team by Friday','B2','medium','passive_voice','general','general',true,true,1),
('grammar','short_answer','Complete with the correct conditional form: "If it ___ (snow) heavily, the runway would be closed."','snowed','B1','medium','conditional_forms','general','general',true,true,1),
('grammar','short_answer','Rewrite in reported speech: She said "I will check the weather report."','She said that she would check the weather report.','B2','medium','structural_accuracy','general','general',true,true,1),
('grammar','short_answer','Write the past perfect form of "arrive" in a sentence about a delayed crew.','The crew had arrived before the flight was cancelled. (any correct past perfect sentence)','B2','medium','tense_usage','general','general',true,true,1),
('grammar','short_answer','Add the correct article: "___ ILS system on runway 05 is unserviceable."','The','A2','easy','structural_accuracy','general','general',true,true,1),

-- ═══ GENERAL: READING ═══
('reading','multiple_choice','Read the safety notice:
"IMPORTANT: In the event of a cabin depressurization, oxygen masks will drop automatically from the panel above your seat. Pull the mask towards you, place it over your nose and mouth, and breathe normally. Secure your own mask before assisting others."

What should you do FIRST when oxygen masks drop?
A) Help the person next to you  B) Pull the mask towards you and put it on  C) Call a flight attendant  D) Move to the nearest exit','B','A2','easy','safety_card_reading','general','general',true,true,1),
('reading','multiple_choice','Read the NOTAM:
"NOTAM B0412/26 — ILS RWY 05 unserviceable from 20 MAR to 22 MAR 2026. VOR/DME approach available. Contact tower on 118.1 for updated approach information."

Which approach system is NOT working?
A) VOR/DME  B) ILS for Runway 05  C) Tower communications  D) All approach systems','B','B1','medium','notam_interpretation','general','general',true,true,1),
('reading','multiple_choice','Read the METAR:
"METAR LTBA 180900Z 33012KT 9999 FEW040 SCT100 18/08 Q1015 NOSIG"

What is the visibility?
A) 3300 metres  B) 9999 metres (10km+)  C) 1800 metres  D) 4000 metres','B','B2','hard','weather_report_reading','general','general',true,true,1),
('reading','multiple_choice','Read the regulation:
"All aviation personnel must report any incident, no matter how minor, within 24 hours using the Safety Reporting System. Failure to report may result in disciplinary action. All reports are treated confidentially."

Within what timeframe must incidents be reported?
A) Immediately  B) Within 24 hours  C) Within 48 hours  D) By end of week','B','A2','easy','sop_comprehension','general','general',true,true,1),
('reading','multiple_choice','Read the memo:
"Due to runway construction at Gate B, all departures between 0600-1400 local will use Taxiway Charlie instead of Taxiway Alpha. Ground crews must verify routing with ATC before each pushback. Effective 19 March to 5 April 2026."

When does this change end?
A) 19 March  B) 5 April 2026  C) When construction ends  D) After 1400 local','B','B1','medium','sop_comprehension','general','general',true,true,1),
('reading','true_false','Read the text:
"Aviation security regulations state that all liquids in carry-on baggage must be in containers of 100ml or less, placed in a clear plastic bag of maximum 1 litre capacity. Only one such bag is allowed per passenger."

Statement: Passengers may carry unlimited liquids if each container is under 100ml.
Answer TRUE or FALSE and explain why.','FALSE — passengers are limited to one 1-litre clear plastic bag; the number of containers is restricted by the bag size','B1','medium','sop_comprehension','general','general',true,true,1),
('reading','true_false','Read the NOTAM:
"NOTAM A1223/26: Aerodrome beacon unserviceable 21 MAR from 2000Z to 2200Z. Visual approaches only during this period."

Statement: Instrument approaches are unaffected by this NOTAM.
Answer TRUE or FALSE.','FALSE — only visual approaches are permitted during the stated period, so instrument approaches are restricted','B2','medium','notam_interpretation','general','general',true,true,1),
('reading','true_false','Read the safety card instruction:
"In the event of a water landing, locate the nearest exit, inflate your life vest only AFTER leaving the aircraft, and proceed to the assembly point."

Statement: You should inflate your life vest before exiting the aircraft.
Answer TRUE or FALSE.','FALSE — the instruction clearly states to inflate the vest AFTER leaving the aircraft to avoid getting trapped','A2','easy','safety_card_reading','general','general',true,true,1),
('reading','short_answer','Read the ATIS message:
"ATIS Information Golf. Runway in use 18. Wind 190/08. Visibility 6000. Cloud broken 2500 feet. Temperature 12, dewpoint 10. QNH 1013. Advise you have information Golf."

What is the active runway according to this ATIS?','Runway 18','B1','easy','atc_clearance_reading','general','general',true,true,1),
('reading','short_answer','Read the regulation excerpt:
"Personnel must hold a valid airside pass before entering any restricted area. Passes expire annually and must be renewed 30 days before the expiry date."

How many days before expiry must a pass be renewed?','30 days','A2','easy','sop_comprehension','general','general',true,true,1),

-- ═══ GENERAL: LISTENING ═══
('listening','multiple_choice','[AUDIO] "Attention all staff. This is a reminder that the mandatory fire safety drill will take place tomorrow at 1400 hours in the main hangar. All personnel must attend. Please wear your safety equipment. The drill will last approximately 30 minutes."

When is the fire drill?
A) Today at 1400  B) Tomorrow at 1400  C) Tomorrow at 1300  D) Next week','B','A2','easy','emergency_broadcast','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "Ground, Alpha 7 request taxi to runway 18 via taxiway Bravo. Information Echo received."

What runway is Alpha 7 requesting to taxi to?
A) Runway 7  B) Runway 18  C) Runway 8  D) Runway 17','B','B1','medium','atc_phraseology','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "Ladies and gentlemen, we regret to inform you that this flight has been delayed by approximately one hour due to a technical inspection. Refreshments will be provided at Gate 12. We apologize for the inconvenience."

Why is the flight delayed?
A) Bad weather  B) Air traffic congestion  C) Technical inspection  D) Crew shortage','C','A2','easy','cabin_announcement','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "All ramp staff, please be advised: wind has increased to 35 knots gusting 50. All ground equipment must be secured immediately. No pushback operations until further notice."

What should ramp staff do FIRST?
A) Stop all flights  B) Secure ground equipment  C) Evacuate the ramp  D) Contact the tower','B','B1','medium','ground_ops_radio','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "This is the cabin crew director. The passenger in seat 14A has reported feeling unwell. A doctor has been requested. Please prepare the medical kit and advise the captain."

What has been done to help the passenger?
A) The flight has been diverted  B) A doctor has been requested  C) The passenger was moved  D) An ambulance called','B','A2','easy','cockpit_communication','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "Operations to all ground handlers: aircraft TC-JFA at stand 7 is ready for pushback in 10 minutes. Confirm fuel upload complete and all doors closed before proceeding."

What must be confirmed before pushback?
A) Boarding complete  B) Fuel upload and all doors closed  C) Cargo loaded  D) Cleaning finished','B','B1','medium','ground_ops_radio','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "Mayday, Mayday, Mayday. Sierra 5, engine failure, request immediate return. Five souls on board. Fuel one hour."

What is the nature of the emergency?
A) Fire on board  B) Medical emergency  C) Engine failure  D) Loss of communication','C','B2','medium','emergency_broadcast','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "This is your captain speaking. We are currently flying at an altitude of 37,000 feet. Our estimated arrival time in Istanbul is 14 hours 30 minutes local time. The weather at our destination is clear with a temperature of 22 degrees."

What is the estimated arrival time?
A) 13:30  B) 14:30  C) 15:30  D) 14:00','B','A2','easy','cabin_announcement','general','general',true,true,1),
('listening','multiple_choice','[AUDIO] "All airlines operating from terminal two: please note that check-in counters for all flights departing after 1800 will move to terminal three starting from Monday. Passengers should be informed accordingly."

When does the terminal change take effect?
A) Today  B) This weekend  C) From Monday  D) Tomorrow','C','A2','easy','cabin_announcement','general','general',true,true,1),
('listening','ordering','[AUDIO] Listen to the safety demonstration and put the steps in the correct order:
Step A: Locate the nearest exit  Step B: Put on the life vest  Step C: Pull the red tab to inflate  Step D: Leave the aircraft
What is the correct sequence?','A, B, D, C — locate exit, put on vest, leave aircraft, then inflate (vest inflated AFTER exiting)','B1','medium','safety_card_reading','general','general',true,true,1),

-- ═══ GENERAL: WRITING ═══
('writing','written_response','Write a short email (at least 50 words) to your colleague explaining that tomorrow morning briefing has been moved from 0800 to 0900 due to a schedule change. Include the reason and ask them to confirm receipt.','Model: Subject: Briefing Time Change. Hi [Name], Tomorrow morning's briefing has been rescheduled from 0800 to 0900 due to an updated shift rotation. Please arrive by 0855. Could you confirm receipt of this message? Thank you.','A2','easy','operational_message','general','general',true,true,1),
('writing','written_response','You witnessed an unsafe situation at work — a vehicle driving too fast on the airport ramp near aircraft. Write a safety report (minimum 60 words) describing what you saw, when and where it happened, and what action should be taken.','Model answer: Date/time, location details, description of vehicle speed and proximity, risk assessment, recommended corrective action (CCTV review, training refresher).','B1','medium','safety_report','general','general',true,true,1),
('writing','written_response','A passenger has complained that their special meal was not loaded on the flight. Write a professional response letter (minimum 60 words) apologizing and explaining what steps will be taken.','Model: Formal apology, acknowledgement of error, explanation of corrective action (improved meal loading checks), goodwill gesture offered.','B1','medium','passenger_complaint','general','general',true,true,1),
('writing','written_response','Write a handover note (minimum 50 words) for the next shift, summarizing what was completed, what is pending, and any critical information they need to know.','Model: Completed tasks, pending items with priority, any outstanding issues, special notes for next team.','A2','easy','operational_message','general','general',true,true,1),
('writing','written_response','Your team must work overtime this weekend due to increased flight schedules. Write an email (minimum 60 words) informing team members about overtime, the reason, and compensation details.','Model: Clear overtime schedule, operational reason, compensation information, request for confirmation of attendance.','B2','medium','operational_message','general','general',true,true,1),

-- ═══ GENERAL: SPEAKING ═══
('speaking','audio_response','Introduce yourself as if at a job interview for an aviation position. Include your name, experience, why you chose aviation, and your key skills.
Speak for at least 45 seconds.','Clear introduction, relevant experience, aviation motivation, key professional skills. Professional tone throughout.','B1','medium','oral_briefing','general','general',true,true,1),
('speaking','audio_response','Describe what you would do if you noticed a fire in your work area at the airport. Explain the steps you would take in order.
Speak for at least 30 seconds.','Alert others, activate alarm, use extinguisher if safe, evacuate, call emergency services. Clear sequence.','A2','easy','roleplay_emergency','general','general',true,true,1),
('speaking','audio_response','Your colleague is new and asks: "What are the most important safety rules at the airport?" Explain at least 4 safety rules.
Speak for at least 40 seconds.','PPE requirements, FOD awareness, vehicle safety, restricted areas, emergency procedures, communication protocols.','B1','medium','ground_communication','general','general',true,true,1),
('speaking','audio_response','Make a passenger announcement for a 45-minute delay. Include the reason (technical check) and what the airline will provide (refreshments).
Speak for at least 30 seconds.','Professional tone, clear delay information, empathy, solution offered (vouchers/refreshments).','B2','medium','cabin_announcement','general','general',true,true,1),
('speaking','audio_response','Describe a time when you had to deal with a difficult situation at work. What happened, what did you do, and what was the result?
Speak for at least 60 seconds.','Clear narrative structure: situation, action taken, outcome, lesson learned.','B2','medium','oral_briefing','general','general',true,true,1);
