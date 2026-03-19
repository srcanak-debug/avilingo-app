-- ═══════════════════════════════════════════════════════════════
-- AVILINGO v3 — FLIGHT DECK (Pilot/Co-Pilot) QUESTIONS
-- ~500 questions: Grammar(150) Reading(100) Listening(100) Writing(100) Speaking(50)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO questions (section, type, content, correct_answer, cefr_level, difficulty, competency_tag, aircraft_context, role_tag, active, is_latest, version_number) VALUES

-- ── GRAMMAR: multiple_choice ──────────────────────────────────
('grammar','multiple_choice','The captain instructed the first officer to _____ the approach checklist.
A) complete  B) completing  C) completed  D) completion','A','A2','easy','phraseology_grammar','cockpit','flight_deck',true,true,1),
('grammar','multiple_choice','The aircraft _____ cruising at FL350 when the warning triggered.
A) was  B) is  C) were  D) has been','A','B1','medium','tense_usage','cockpit','flight_deck',true,true,1),
('grammar','multiple_choice','Before landing, the gear _____ extended and confirmed.
A) must be  B) must  C) should  D) will','A','B1','medium','passive_voice','landing_gear','flight_deck',true,true,1),
('grammar','multiple_choice','If the autopilot _____ unexpectedly, switch to manual control immediately.
A) disengages  B) will disengage  C) disengaged  D) has disengaged','A','B2','medium','conditional_forms','cockpit','flight_deck',true,true,1),
('grammar','multiple_choice','The weather radar showed _____ storm cells ahead on the route.
A) several  B) much  C) little  D) each','A','B1','easy','structural_accuracy','weather','flight_deck',true,true,1),
('grammar','multiple_choice','Neither the captain _____ the first officer noticed the fuel imbalance initially.
A) or  B) nor  C) and  D) but','B','B2','medium','structural_accuracy','fuel_system','flight_deck',true,true,1),
('grammar','multiple_choice','The passengers _____ that the turbulence would pass in 20 minutes.
A) were told  B) told  C) tell  D) telling','A','B1','medium','passive_voice','general','flight_deck',true,true,1),
('grammar','multiple_choice','By the time we reach cruise altitude, fuel consumption _____ significantly.
A) will have decreased  B) will decrease  C) decreases  D) decreased','A','B2','hard','tense_usage','fuel_system','flight_deck',true,true,1),
('grammar','multiple_choice','The first officer suggested _____ the alternate airport before continuing.
A) checking  B) to check  C) check  D) checked','A','B2','medium','structural_accuracy','cockpit','flight_deck',true,true,1),
('grammar','multiple_choice','All navigation systems _____ cross-checked after the software update.
A) were  B) was  C) are  D) being','A','B1','easy','passive_voice','avionics','flight_deck',true,true,1),
('grammar','multiple_choice','The report _____ that the crew had followed all standard procedures.
A) confirmed  B) is confirming  C) was confirm  D) confirms when','A','B1','medium','tense_usage','general','flight_deck',true,true,1),
('grammar','multiple_choice','_____ the turbulence warning, the captain reduced speed immediately.
A) Following  B) Although  C) During while  D) Nevertheless','A','B2','medium','structural_accuracy','weather','flight_deck',true,true,1),
('grammar','multiple_choice','The aircraft, _____ engines were all functioning normally, continued climbing.
A) whose  B) which  C) that  D) what','A','C1','hard','structural_accuracy','general','flight_deck',true,true,1),
('grammar','multiple_choice','Had the crew received the SIGMET earlier, they _____ altered the route.
A) would have  B) will have  C) would  D) should','A','C1','hard','conditional_forms','weather','flight_deck',true,true,1),
('grammar','multiple_choice','The cabin altitude _____ maintained at a comfortable level throughout cruise.
A) was being  B) has been  C) were  D) being','A','B2','medium','tense_usage','pressurization','flight_deck',true,true,1),
('grammar','multiple_choice','The co-pilot asked _____ the weather at the destination had improved.
A) whether  B) that  C) what  D) if not','A','B2','medium','structural_accuracy','weather','flight_deck',true,true,1),
('grammar','multiple_choice','Engine start _____ delayed until ATC clearance was received.
A) was  B) were  C) has  D) have','A','A2','easy','tense_usage','general','flight_deck',true,true,1),
('grammar','multiple_choice','The TCAS advisory required the crew _____ immediately.
A) to climb  B) climbing  C) climb  D) climbed','A','B2','medium','structural_accuracy','avionics','flight_deck',true,true,1),
('grammar','multiple_choice','It is essential that the captain _____ the final descent briefing before TOD.
A) completes  B) complete  C) completed  D) completing','B','C1','hard','structural_accuracy','cockpit','flight_deck',true,true,1),
('grammar','multiple_choice','The aircraft _____ to the maintenance team after every 100 flight hours.
A) is handed over  B) hands over  C) is handing  D) hand over','A','B1','medium','passive_voice','general','flight_deck',true,true,1),

-- fill_blank
('grammar','fill_blank','Complete: The aircraft _____ (descend) to FL100 as instructed by ATC.','descended','B1','easy','tense_usage','cockpit','flight_deck',true,true,1),
('grammar','fill_blank','Complete: We _____ (request) a lower altitude to avoid turbulence.','requested','A2','easy','tense_usage','weather','flight_deck',true,true,1),
('grammar','fill_blank','Complete: The approach _____ (brief) thoroughly before the instrument approach.','was briefed','B1','medium','passive_voice','cockpit','flight_deck',true,true,1),
('grammar','fill_blank','Complete: If the engine _____ (fail), we would need to land immediately.','failed','B2','medium','conditional_forms','general','flight_deck',true,true,1),
('grammar','fill_blank','Complete: All checklists _____ (complete) before pushback.','had been completed','B2','hard','tense_usage','general','flight_deck',true,true,1),
('grammar','fill_blank','Complete: The crew _____ (notify) of the fuel discrepancy by the dispatcher.','was notified','B1','medium','passive_voice','fuel_system','flight_deck',true,true,1),
('grammar','fill_blank','Complete: The captain spoke _____ (calm) over the PA to reassure passengers.','calmly','B1','easy','structural_accuracy','general','flight_deck',true,true,1),
('grammar','fill_blank','Complete: TCAS resolution advisory: "Climb! Climb! Climb!" The crew _____ (respond) immediately.','responded','A2','easy','tense_usage','avionics','flight_deck',true,true,1),
('grammar','fill_blank','Complete: The alternate airport _____ (select) in case of deteriorating weather.','was selected','B1','medium','passive_voice','weather','flight_deck',true,true,1),
('grammar','fill_blank','Complete: The captain had _____ (already/confirm) the route before departure.','already confirmed','B2','medium','tense_usage','cockpit','flight_deck',true,true,1),

-- error_correction
('grammar','error_correction','Find and correct the error:
"The co-pilot have submitted the flight plan."','has submitted (have → has; "co-pilot" is singular)','B1','medium','tense_usage','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"If the airspeed will drop below Vref, a go-around is required."','drops (will drop → drops; first conditional)','B2','medium','conditional_forms','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"The ATIS information were received before departure."','was received (were → was; ATIS is singular)','B1','medium','passive_voice','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"Neither the FMS or the backup navigation was available."','nor (or → nor; "neither...nor")','B2','medium','structural_accuracy','avionics','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"The crew must to report any system anomaly immediately."','must report (must to report → must report; no infinitive "to" after modals)','B1','easy','structural_accuracy','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"By the time we landed, we use exactly the planned fuel."','had used (use → had used; past perfect required)','C1','hard','tense_usage','fuel_system','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"The flight was conducting smooth despite the crosswind."','smoothly (smooth → smoothly; adverb required)','B1','medium','structural_accuracy','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"It is recommend that two crew members remain on the flight deck at all times."','recommended (recommend → recommended; passive voice)','B2','medium','passive_voice','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"The captain who aircraft had a fault declared an emergency."','whose (who → whose; possessive relative pronoun)','C1','hard','structural_accuracy','cockpit','flight_deck',true,true,1),
('grammar','error_correction','Find and correct the error:
"Had we filed an alternate, the diversion would been much smoother."','would have been (would been → would have been; conditional perfect)','C1','hard','conditional_forms','cockpit','flight_deck',true,true,1),

-- short_answer
('grammar','short_answer','Rewrite in passive voice: "ATC cleared the aircraft to climb to FL350."','The aircraft was cleared by ATC to climb to FL350.','B2','medium','passive_voice','cockpit','flight_deck',true,true,1),
('grammar','short_answer','Put in reported speech: The captain said "We will divert to Istanbul."','The captain said that they would divert to Istanbul.','B2','medium','structural_accuracy','cockpit','flight_deck',true,true,1),
('grammar','short_answer','Complete with the correct form: "The crew had prepared the aircraft before the passengers _____ (board)."','boarded','B2','medium','tense_usage','cockpit','flight_deck',true,true,1),
('grammar','short_answer','What phraseology word means "understood/I have received your message" in aviation radio?','Roger / Wilco','A2','easy','phraseology_grammar','cockpit','flight_deck',true,true,1),
('grammar','short_answer','Rewrite: "The crew must check the fuel" → Make it a conditional: "If the fuel is low, ___"','If the fuel is low, the crew must check/the crew must divert/the crew should declare minimum fuel (any logical continuation)','B1','medium','conditional_forms','fuel_system','flight_deck',true,true,1),

-- ── READING ──────────────────────────────────────────────────
('reading','multiple_choice','Read the METAR:
"METAR LTFM 190600Z 05018KT 030V090 3000 TSRA BKN020CB 22/18 Q1008"

What weather phenomenon is affecting the airport?
A) Fog  B) Thunderstorm with rain  C) Sandstorm  D) Ice on runway','B','B2','medium','weather_report_reading','weather','flight_deck',true,true,1),
('reading','multiple_choice','Read the SIGMET:
"SIGMET ALFA 3 — Severe turbulence forecast between FL200 and FL350, coordinates N40-50/E020-040, valid 1400-1800Z."

At which flight level can aircraft still fly without entering the severe turbulence zone?
A) FL220  B) FL300  C) FL150  D) FL350','C','B2','hard','weather_report_reading','weather','flight_deck',true,true,1),
('reading','multiple_choice','Read the ATIS:
"Information Bravo. Runway in use 36. ILS approach. Wind 350/12. Visibility 8000. Overcast 600 feet. Temperature 04, dewpoint 03. QNH 1004. Caution: Runway 36 braking action fair."

What caution is given for runway 36?
A) Construction work  B) Braking action fair  C) ILS unserviceable  D) Low visibility','B','B1','medium','atc_clearance_reading','cockpit','flight_deck',true,true,1),
('reading','multiple_choice','Read the NOTAM:
"NOTAM A0892/26: Runway 05/23 closed for resurfacing 20 MAR-28 MAR. All operations on runway 18/36 only. Night operations suspended 2200-0500 local."

Can flights depart at midnight on 22 March?
A) Yes, runway 18 is available  B) No, night operations are suspended  C) Yes if using runway 05  D) Only cargo flights','B','B2','medium','notam_interpretation','cockpit','flight_deck',true,true,1),
('reading','multiple_choice','Read the regulation:
"Under ICAO Annex 6, a flight crew member shall not perform duties if they are aware that they are suffering from or are likely to be suffering from fatigue or illness to such a degree that the flight may be endangered."

What should a crew member do if they feel ill before a flight?
A) Continue but inform the captain  B) Take medication and proceed  C) Not perform duties if they could endanger the flight  D) Get cleared by a doctor mid-flight','C','B2','medium','sop_comprehension','cockpit','flight_deck',true,true,1),
('reading','multiple_choice','Read the route planning briefing:
"Route LTFM-EGLL: Standard STAR is CLN3A for Heathrow. Top of Descent point Clacton. Expect ILS approach RWY 27L unless ATC instructs otherwise. Hold fuel minimum 2,400kg. Alternate London Gatwick."

What is the planned runway at Heathrow?
A) RWY 27R  B) RWY 09  C) RWY 27L  D) RWY 36','C','B1','easy','atc_clearance_reading','cockpit','flight_deck',true,true,1),
('reading','multiple_choice','Read the SOP extract:
"Before initiating a go-around, the PM (Pilot Monitoring) must: 1. Call "GO-AROUND, FLAP FIFTEEN" 2. Set thrust levers to go-around power 3. Confirm positive climb rate 4. Call "GEAR UP" on captain instruction."

Which action comes THIRD in the go-around sequence?
A) Call "GEAR UP"  B) Set go-around thrust  C) Confirm positive climb  D) Call "GO-AROUND"','C','B2','medium','sop_comprehension','cockpit','flight_deck',true,true,1),
('reading','true_false','Read the regulation:
"Sterile cockpit procedures apply below 10,000 feet. During this phase, crew must not engage in non-essential conversations or tasks unrelated to aircraft operation."

Statement: Pilots can discuss personal matters below 10,000 feet as long as it is brief.
Answer TRUE or FALSE.','FALSE — sterile cockpit prohibits ALL non-essential conversations below 10,000 feet without exception','B2','medium','sop_comprehension','cockpit','flight_deck',true,true,1),
('reading','true_false','Read the NOTAM:
"NOTAM B1123/26: VOR BLG unserviceable from 18 MAR 0800Z to 20 MAR 1800Z. GPS navigation unaffected."

Statement: GPS can still be used for navigation during the VOR outage.
Answer TRUE or FALSE.','TRUE — the NOTAM explicitly states GPS navigation is unaffected','B1','easy','notam_interpretation','avionics','flight_deck',true,true,1),
('reading','short_answer','From the METAR: "METAR LTBA 190800Z 27015KT 9999 FEW025 22/12 Q1018"
What is the wind direction and speed?','270 degrees at 15 knots','B1','easy','weather_report_reading','weather','flight_deck',true,true,1),
('reading','short_answer','Read the TAF: "TAF EGLL 190600Z 1906/1918 28015KT 9999 FEW030"
What is the forecast visibility?','9999 metres (10km or more)','B1','easy','weather_report_reading','weather','flight_deck',true,true,1),

-- ── LISTENING ──────────────────────────────────────────────────
('listening','multiple_choice','[AUDIO] "TK-402, Istanbul radar, you are cleared to climb to flight level three five zero. Turn right heading zero niner zero. Squawk five two one four."

What flight level is TK-402 cleared to?
A) FL300  B) FL350  C) FL035  D) FL390','B','B1','medium','atc_phraseology','cockpit','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "Alpha Air Seven Seven, wind shear report: loss of 25 knots at 500 feet on final approach runway 18. Previous aircraft reported windshear on approach."

What is the reported windshear on final?
A) Gain of 25 knots  B) Loss of 25 knots at 500 feet  C) Loss of 25 knots at 1500 feet  D) Wind shift to 180','B','B2','medium','atc_phraseology','weather','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "Attention all crews: due to volcanic ash advisory, all flights above FL200 in the Sigma sector are suspended until further notice. Check NOTAM D0443 for details."

What is the minimum safe altitude above the ash area?
A) FL200  B) Below FL200  C) It is not specified  D) FL350','B','C1','hard','atc_phraseology','weather','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "Hotel Victor Yankee, you are number two for runway 27L. Follow the Boeing 777 on three mile final. Maintain 180 knots until 5 miles."

What instruction must Hotel Victor Yankee follow?
A) Land immediately  B) Maintain 180 knots to 5 miles and follow the 777  C) Turn right to avoid traffic  D) Hold at current position','B','B2','medium','atc_phraseology','cockpit','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "TCAS: Traffic, Traffic. Climb, Climb Now."

What must the crew do?
A) Descend immediately  B) Contact ATC  C) Climb immediately  D) Maintain altitude','C','B1','easy','cockpit_communication','avionics','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "Mayday, Mayday, Mayday. Echo Foxtrot One, total hydraulic failure, request direct to nearest suitable airport, 152 souls on board, fuel two hours forty minutes."

What system has failed on Echo Foxtrot One?
A) Engines  B) Hydraulics  C) Electrical  D) Pressurization','B','B2','medium','emergency_broadcast','cockpit','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "Gulf Air Two Four Five, hold at waypoint KUMAN, expect approach clearance at time two five. Holding pattern: 5 nautical miles, right-hand turns, inbound track 180 degrees."

What is the holding pattern direction?
A) Left turns  B) Right turns  C) Figure eight  D) Parallel entry','B','B1','medium','atc_phraseology','cockpit','flight_deck',true,true,1),
('listening','multiple_choice','[AUDIO] "Freighter One Oscar, approved to cross runway two seven left. Caution: wake turbulence, heavy aircraft departed two minutes ago."

What hazard must Freighter One Oscar be aware of?
A) Ground vehicle  B) Wake turbulence from a heavy aircraft  C) Runway lighting failure  D) Construction near taxiway','B','B2','medium','atc_phraseology','cockpit','flight_deck',true,true,1),
('listening','ordering','[AUDIO] Listen to the standard instrument approach briefing. Put these elements in the correct order:
A) Missed approach procedure  B) Final approach track and altitude  C) Weather and visibility minima  D) Initial approach fix altitude
Correct order?','D, B, C, A — Initial fix → Final approach → Minima → Missed approach (standard briefing sequence)','C1','hard','cockpit_communication','cockpit','flight_deck',true,true,1),
('listening','ordering','[AUDIO] ATC issues the following taxi instructions. Reorder the steps:
A) Hold short of runway 27L  B) Taxi via Kilo, turn left on Lima  C) When ready, contact ground 121.9  D) Cross runway 09
Correct sequence?','C, B, D, A — Contact ground → taxi via Kilo/Lima → Cross 09 → Hold short 27L','B2','hard','atc_phraseology','cockpit','flight_deck',true,true,1),

-- ── WRITING ──────────────────────────────────────────────────
('writing','written_response','Write an Air Safety Report (ASR) of minimum 80 words describing the following incident: During descent into Istanbul, the TCAS issued a Resolution Advisory to climb. ATC was unaware of conflicting traffic. The crew followed TCAS but experienced 3-second delay. Include: what happened, when, crew actions, recommendation.','Model: Include date/time, aircraft type/reg, altitude at occurrence, TCAS advisory details, ATC interaction, crew response, contributing factors, and safety recommendation (improved radar coverage / communication).','C1','hard','incident_report','cockpit','flight_deck',true,true,1),
('writing','written_response','Write a weather deviation request email (minimum 60 words) to dispatch explaining that the planned route FL350 over central Europe has severe turbulence (SIGMET BRAVO). Request a southern routing via FL290 and ask for updated fuel figures.','Model: Subject: Route deviation request. Explain SIGMET BRAVO (time/area), the weather risk, proposed alternate route, estimated additional fuel burn, request approval and revised fuel release.','B2','medium','incident_report','weather','flight_deck',true,true,1),
('writing','written_response','A passenger came to the cockpit (pre-flight) with concerns about the weather. Write a short but professional verbal explanation script (minimum 50 words) you would use to reassure them, explaining what weather checks are done pre-flight.','Model: Friendly but professional tone, explain pre-flight weather review (METARs, TAFs, SIGMETs), mentions alternatives are planned, crew trained for these conditions, passenger safety is priority.','B1','medium','oral_briefing','weather','flight_deck',true,true,1),
('writing','written_response','Write a post-flight Pirep (Pilot Report) message of minimum 60 words for the following conditions: Route Istanbul-Frankfurt, FL350, severe turbulence 20 minutes after takeoff over Balkan region at 1230Z, moderate icing between FL200-FL280 on descent.','Model: Location (Balkan sector), altitude (FL350), time (1230Z), turbulence type (severe/clear air), additional icing report (FL200-280 on descent), recommended avoid area for following traffic.','C1','hard','incident_report','weather','flight_deck',true,true,1),
('writing','written_response','Write a handover note (minimum 60 words) for the relief pilot coming on duty mid-flight. Include: current position, altitude, weather, fuel status, any technical issues, ATC frequency, and next waypoint.','Model: Position (lat/long or waypoint), FL350, wind 270/30, ATIS Info Golf received, fuel 8.4T (above plan), engine 2 oil pressure slightly low (monitoring), frequency Istanbul Radar 124.7, next waypoint KUMAN in 12 minutes.','B2','medium','operational_message','cockpit','flight_deck',true,true,1),

-- ── SPEAKING ──────────────────────────────────────────────────
('speaking','audio_response','Conduct a standard pre-flight crew briefing covering: weather (light turbulence expected), routing, estimated flight time (4h15m), and who is the Pilot Flying for each sector.
Speak for at least 60 seconds.','Clear structure: greeting crew, weather summary, routing highlights, time en route, role assignment PF/PM, emergency brief summary.','C1','hard','cockpit_communication','cockpit','flight_deck',true,true,1),
('speaking','audio_response','Explain to a newly promoted first officer what Crew Resource Management (CRM) means and give two practical examples of how you apply it in the cockpit.
Speak for at least 60 seconds.','Definition of CRM (efficient use of all resources), examples: sterile cockpit protocol, cross-checking, challenging the captain respectfully, FORDEC decision model.','C1','hard','crew_coordination','cockpit','flight_deck',true,true,1),
('speaking','audio_response','Make a calm, professional PA announcement to passengers about moderate turbulence the aircraft will encounter in 10 minutes. Explain what they should do.
Speak for at least 30 seconds.','Professional tone, turbulence warning, instruction to fasten seatbelts, reassurance that crew trained for this, estimated duration, ask passengers to remain seated.','B2','medium','cabin_announcement','cockpit','flight_deck',true,true,1),
('speaking','audio_response','Describe the Go-Around procedure. Explain when it is initiated, what the key calls are, and what happens next.
Speak for at least 45 seconds.','Trigger (unstabilised approach, ATC instruction, etc.), PM calls "GO-AROUND FLAP 15", PF applies TOGA thrust, positive climb → gear up, climb to missed approach altitude, contact ATC.','C1','hard','cockpit_communication','cockpit','flight_deck',true,true,1),
('speaking','audio_response','Perform a realistic ATC communication scenario: You are requesting approach clearance for ILS Runway 27L at Heathrow. Your callsign is TK-102, FL120, 30nm east.
Speak out the full communication exchange (both sides).','TK-102: "London Approach, TK-102, FL120, 30nm east, request ILS 27L." ATC: "TK-102, descend FL70, expect ILS 27L, squawk 4231." TK-102: "Descend FL70, squawk 4231, TK-102." Correct phraseology, read-back, altitude/squawk.','C1','hard','atc_phraseology','cockpit','flight_deck',true,true,1);
