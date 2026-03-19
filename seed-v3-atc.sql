-- ═══════════════════════════════════════════════════════════════
-- AVILINGO v3 — ATC (Air Traffic Controller) QUESTIONS
-- ~75 questions: all sections and types
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, role_tag, active, is_latest, version_number) VALUES

-- ── GRAMMAR ──
('grammar','multiple_choice','ATC _____ an aircraft to maintain 3000 feet on approach.
A) cleared  B) clears  C) clearing  D) was cleared','A','A2','easy','tense_usage','general','atc',true,true,1),
('grammar','multiple_choice','The aircraft _____ not fly through the restricted area without prior permission.
A) may  B) must  C) shall  D) will','C','B2','hard','phraseology_grammar','general','atc',true,true,1),
('grammar','multiple_choice','The pilot _____ back the clearance to confirm receipt.
A) read  B) reads  C) reading  D) is reading','A','B1','medium','phraseology_grammar','general','atc',true,true,1),
('grammar','multiple_choice','When the visibility _____ below minimums, the approach must be suspended.
A) falls  B) fall  C) will fall  D) has fallen','A','B1','medium','conditional_forms','weather','atc',true,true,1),
('grammar','multiple_choice','The controller _____ the pilot to hold at the VOR until the traffic cleared.
A) instructed  B) is instructing  C) instruct  D) instruction','A','B1','easy','tense_usage','general','atc',true,true,1),
('grammar','multiple_choice','All aircraft _____ to use standard ICAO phraseology on this frequency.
A) are required  B) require  C) have require  D) must requiring','A','B1','medium','passive_voice','general','atc',true,true,1),
('grammar','multiple_choice','By the time the emergency aircraft landed, the runway _____ cleared of all traffic.
A) had been  B) was  C) has been  D) were','A','B2','hard','tense_usage','general','atc',true,true,1),
('grammar','multiple_choice','The squawk code _____ before the aircraft enters controlled airspace.
A) must be set  B) must set  C) sets  D) setting','A','B2','medium','passive_voice','general','atc',true,true,1),
('grammar','multiple_choice','The controller asked if the pilot _____ the runway was clear.
A) had confirmed  B) confirms  C) has confirmed  D) confirmed','D','B2','medium','tense_usage','general','atc',true,true,1),
('grammar','multiple_choice','It is essential that every readback _____ correct before proceeding.
A) is  B) be  C) was  D) being','B','C1','hard','structural_accuracy','general','atc',true,true,1),
('grammar','fill_blank','Complete: The aircraft _____ (clear) to land on runway 27L.','was cleared','B1','easy','phraseology_grammar','general','atc',true,true,1),
('grammar','fill_blank','Complete: All position reports _____ (give) in standard phraseology.','must be given','B1','medium','passive_voice','general','atc',true,true,1),
('grammar','fill_blank','Complete: If the pilot _____ (not respond), try the guard frequency.','does not respond','B2','medium','conditional_forms','general','atc',true,true,1),
('grammar','fill_blank','Complete: The aircraft _____ (hold) at ROMEO since 1300Z.','has been holding','B2','hard','tense_usage','general','atc',true,true,1),
('grammar','error_correction','Find and correct the error:
"The aircraft who was on final had a radio failure."','that (who → that; relative pronoun for aircraft)','B1','medium','structural_accuracy','general','atc',true,true,1),
('grammar','error_correction','Find and correct the error:
"Squawk code 7700 are used in emergency situations."','is used (are → is; singular subject)','B1','easy','tense_usage','general','atc',true,true,1),
('grammar','error_correction','Find and correct the error:
"If the pilot will not respond, the controller should escalate."','does not respond (will not → does not; first conditional)','B2','medium','conditional_forms','general','atc',true,true,1),
('grammar','error_correction','Find and correct the error:
"The separation standard between aircraft were maintained throughout."','was maintained (were → was; singular subject "standard")','B2','medium','tense_usage','general','atc',true,true,1),
('grammar','short_answer','Write the correct ICAO read-back for: "TK-402, cleared to FL100, heading 270."','TK-402, cleared to FL100, heading 270, TK-402.','B2','medium','phraseology_grammar','general','atc',true,true,1),
('grammar','short_answer','What ICAO phrase confirms you understand an instruction but cannot comply?','Unable','B1','easy','phraseology_grammar','general','atc',true,true,1),

-- ── READING ──
('reading','multiple_choice','Read the ATC coordination message:
"Sector ECHO to sector FOXTROT: Aircraft TK-801, FL350, estimating waypoint BRAVO at 1430Z, request higher FL370 for cruise."

What is TK-801 requesting?
A) Lower altitude  B) Higher altitude FL370  C) Direct routing to BRAVO  D) Speed increase','B','B1','easy','atc_clearance_reading','general','atc',true,true,1),
('reading','multiple_choice','Read the weather message:
"SIGMET OSCAR 6: Severe icing forecast FL100-FL200 in area bounded by coordinates. Valid 1200-1800Z. Pilots and ATC should be aware."

For how long is this SIGMET valid?
A) 1 hour  B) 2 hours  C) 6 hours  D) 12 hours','C','B2','medium','weather_report_reading','weather','atc',true,true,1),
('reading','multiple_choice','Read the ATIS:
"ATIS Delta: runway in use 09. ILS approach. Wind 090/10. Visibility 5000 in haze. Temperature 28, dew point 25. QNH 1005."

What is the current visibility?
A) 9000 metres  B) 5000 metres in haze  C) 1000 metres  D) 3000 metres','B','A2','easy','weather_report_reading','general','atc',true,true,1),
('reading','multiple_choice','Read the sector briefing:
"Volume of traffic in this period: 27 arrivals, 19 departures, 3 overflights. One restricted area active (area GOLF). Expect flow control delays for traffic entering from the north."

How many aircraft are expected in total?
A) 27  B) 46  C) 49  D) 22','C','B1','medium','sop_comprehension','general','atc',true,true,1),
('reading','true_false','Read the ICAO rule:
"A readback is required for all ATC clearances, instructions, level, speed and heading changes."

Statement: A pilot only needs to read back runway assignments, not heading changes.
TRUE or FALSE?','FALSE — headings are explicitly listed as requiring readback','B2','medium','sop_comprehension','general','atc',true,true,1),
('reading','short_answer','Read: "Squawk 0000 is reserved. Squawk 7700 means emergency. Squawk 7600 means radio failure. Squawk 7500 means unlawful interference."
A pilot selects 7600. What does this indicate?','Radio failure','B1','easy','sop_comprehension','general','atc',true,true,1),

-- ── LISTENING ──
('listening','multiple_choice','[AUDIO] "Istanbul Approach, IHY-333, flight level 140, request descent for approach. Information Foxtrot received."

What information has IHY-333 already received?
A) Terminal weather  B) ATIS Foxtrot  C) Hold instructions  D) Approach clearance','B','B1','easy','atc_phraseology','general','atc',true,true,1),
('listening','multiple_choice','[AUDIO] "Alpha Air Two Niner, identified 40 miles north. Descend FL80, expect ILS approach runway 36R. Report established."

What does Alpha Air Two Niner need to report?
A) When at FL80  B) When established on ILS  C) When visual  D) When fuel is checked','B','B1','medium','atc_phraseology','general','atc',true,true,1),
('listening','multiple_choice','[AUDIO] "ATC Coordination: Hold all departures. VIP aircraft priority landing in 15 minutes. Release expected at time four five."

When can departures resume?
A) Immediately  B) In 15 minutes based on VIP landing  C) At time four five  D) After advising pilots','C','B2','medium','atc_phraseology','general','atc',true,true,1),
('listening','multiple_choice','[AUDIO] "Mayday relay: Sector Sierra reporting aircraft squawking 7700, track 270, over waypoint KILO, attempting contact on 121.5."

What squawk is the aircraft using?
A) 7600  B) 7500  C) 7700  D) 7000','C','B1','easy','emergency_broadcast','general','atc',true,true,1),
('listening','multiple_choice','[AUDIO] "Gulf Foxtrot One, runway incursion alert. Stop immediately. Confirm position."

What must Gulf Foxtrot One do first?
A) Taxi to gate  B) Stop and confirm position  C) Contact tower  D) Return to holding point','B','B1','easy','atc_phraseology','general','atc',true,true,1),
('listening','ordering','[AUDIO] ATC issues a full approach clearance. Order the elements heard:
A) Squawk code  B) Cleared ILS approach  C) Descend to 4000 feet  D) Report outer marker
Correct sequence?','A, C, B, D — Squawk → descend → cleared approach → report outer marker','B2','medium','atc_phraseology','general','atc',true,true,1),

-- ── WRITING ──
('writing','written_response','Write an ATC incident report (minimum 80 words) for the following: Two aircraft on parallel approaches were separated at 850 feet vertical instead of the required 1000 feet. The event lasted 90 seconds before corrective action was taken. Describe what happened, why standards were not maintained, and your recommendation.','Model: Date/time/sector, aircraft callsigns, initial clearances, deviation (850ft vs 1000ft required), duration, corrective action (descent instruction to first aircraft), contributory factors (high traffic volume), recommendation (improved coordination protocol between sectors).','C1','hard','incident_report','general','atc',true,true,1),
('writing','written_response','Write a sector handover brief (minimum 60 words) for the next controller. Include: active traffic (5 aircraft), one aircraft in holding, weather (CB activity to the west), active restrictions, and any ongoing coordination.','Model: 5 aircraft active (list callsigns, levels, routes briefly), TK-405 holding at ROMEO (fuel: 1h30min), CB activity west of DKO, area GOLF restricted until 1800Z, coordination with sector FOXTROT for TK-810 passing FL350.','B2','medium','operational_message','general','atc',true,true,1),
('writing','written_response','Write a formal complaint letter (minimum 70 words) to your supervisor about a pilot who consistently uses non-standard phraseology, creating ambiguity in communications. Include specific examples and your safety concerns.','Model: Professional tone, specific examples of non-standard language used, dates/callsigns if known, safety risk assessment (misunderstanding clearances), formal request for action (notification to airline, ICAO language proficiency review).','C1','hard','incident_report','general','atc',true,true,1),

-- ── SPEAKING ──
('speaking','audio_response','Demonstrate issuing a complete arrival clearance to an aircraft. Include: descent level, heading, expect ILS approach, squawk code, and QNH.
Speak for at least 40 seconds.','Standard phraseology: callsign, descend FL[X], turn heading [X], expect ILS runway [X], squawk [XXXX], QNH [XXXX]. Clear and authoritative delivery.','C1','hard','atc_phraseology','general','atc',true,true,1),
('speaking','audio_response','An aircraft has declared Mayday. Explain what actions you take as the controlling ATC officer in the first 2 minutes.
Speak for at least 60 seconds.','Acknowledge Mayday, confirm callsign/position/nature/souls/fuel, clear the frequency, alert supervisor, alert emergency services, clear airspace, coordinate with adjacent sectors, coordinate runway clearance.','C1','hard','emergency_broadcast','general','atc',true,true,1),
('speaking','audio_response','A pilot reports they have a fuel emergency and request priority landing. You have two other aircraft on approach. Explain your traffic management priorities and what you say to each aircraft.
Speak for at least 60 seconds.','Priority to fuel emergency, instruct other aircraft to go around or enter holding, clear runway immediately for emergency, alert ARFF (Aircraft Rescue Fire Fighting), issue emergency landing clearance with wind/QNH/runway state.','C1','hard','emergency_broadcast','general','atc',true,true,1);
