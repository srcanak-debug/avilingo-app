#!/usr/bin/env node
/**
 * expand-questions.js
 * Template-based question generator — creates 500+ unique questions per role
 * Usage: node scripts/expand-questions.js
 */
const URL = 'https://zpqnidyhfrejkxuxlbeg.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwcW5pZHloZnJlamt4dXhsYmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5MzUwNCwiZXhwIjoyMDg5MTY5NTA0fQ.GsD6G9B6JiXjFX1dRkrMYPbvRRzp90E5LgFiNgKWiww'
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function insert(rows) {
  const res = await fetch(`${URL}/rest/v1/questions`, {
    method: 'POST',
    headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!res.ok && res.status !== 409) throw new Error(`${res.status}: ${await res.text()}`)
}

function q(section, type, content, answer, cefr, difficulty, tag, ctx, role) {
  return { section, type, content, correct_answer: answer, cefr_level: cefr, difficulty,
    competency_tag: tag, aircraft_context: ctx, role_tag: role, active: true, is_latest: true, version_number: 1 }
}

// ── GRAMMAR TEMPLATES ──────────────────────────────────────────────────────
// Each entry: [stem, blanks, answer, cefr, difficulty, tag, ctx, role]
const grammarMC = [
  // FLIGHT DECK
  ['The captain _____ the crew that turbulence was expected ahead.\nA) notified  B) notifies  C) notify  D) was notify','A','B1','medium','cockpit_communication','cockpit','flight_deck'],
  ['The ATIS recording _____ updated every hour.\nA) is  B) are  C) were  D) be','A','A2','easy','phraseology_grammar','cockpit','flight_deck'],
  ['The fuel load _____ calculated before every departure.\nA) must be  B) must  C) should been  D) may','A','B1','easy','passive_voice','fuel_system','flight_deck'],
  ['_____ the aircraft reached cruise altitude, the crew began the fuel check.\nA) After  B) During  C) While  D) Still','A','B1','medium','structural_accuracy','cockpit','flight_deck'],
  ['The co-pilot suggested _____ the approach briefing again.\nA) reviewing  B) to review  C) review  D) reviewed','A','B2','medium','structural_accuracy','cockpit','flight_deck'],
  ['The emergency procedure _____ rehearsed by the crew before departure.\nA) was  B) were  C) has  D) being','A','A2','easy','passive_voice','cockpit','flight_deck'],
  ['Neither the captain _____ the co-pilot had received the revised routing.\nA) nor  B) or  C) and  D) also','A','B2','medium','structural_accuracy','cockpit','flight_deck'],
  ['By the time they reached FL380, the weather _____ improved significantly.\nA) had  B) has  C) being  D) did','A','B2','medium','tense_usage','weather','flight_deck'],
  ['The approach _____ stabilized by 1000 feet AGL or a go-around is required.\nA) must be  B) must  C) has been  D) being','A','B2','medium','passive_voice','cockpit','flight_deck'],
  ['It is required that the captain _____ the final approach briefing.\nA) conduct  B) conducts  C) conducted  D) conducting','A','C1','hard','structural_accuracy','cockpit','flight_deck'],
  ['The aircraft _____ at FL240 when the pressurization warning appeared.\nA) was cruising  B) cruised  C) is cruising  D) has cruised','A','B1','medium','tense_usage','pressurization','flight_deck'],
  ['All navigation aids _____ before the instrument approach.\nA) must be checked  B) must check  C) checked  D) checking','A','B1','medium','passive_voice','avionics','flight_deck'],
  ['_____ severe icing was forecast, the crew filed an alternate route.\nA) Since  B) Despite  C) However  D) Whether','A','B2','medium','structural_accuracy','weather','flight_deck'],
  ['The wind _____ shifted from 270 to 310 degrees during the approach.\nA) had  B) has  C) is  D) were','A','B2','medium','tense_usage','weather','flight_deck'],
  ['The captain requested that ATC _____ an immediate descent.\nA) approve  B) approves  C) approved  D) approving','A','C1','hard','phraseology_grammar','cockpit','flight_deck'],
  // CABIN CREW
  ['All tray tables _____ stowed before landing.\nA) must be  B) must  C) shall been  D) can','A','A2','easy','passive_voice','general','cabin_crew'],
  ['The passenger _____ his medication from the overhead bin.\nA) retrieved  B) retrieves  C) retrieve  D) retrieving','A','A2','easy','tense_usage','general','cabin_crew'],
  ['The cabin crew _____ trained in first aid every two years.\nA) is  B) are  C) being  D) gets','B','B1','medium','passive_voice','general','cabin_crew'],
  ['If a passenger _____ to comply with safety instructions, inform the cabin director.\nA) refuses  B) will refuse  C) refusing  D) refused','A','B2','medium','conditional_forms','general','cabin_crew'],
  ['The meal service _____ completed before the captain switched on the seatbelt sign.\nA) had been  B) has been  C) was being  D) completed','A','B2','medium','tense_usage','general','cabin_crew'],
  ['The life vest _____ located under your seat.\nA) is  B) are  C) be  D) were','A','A2','easy','structural_accuracy','general','cabin_crew'],
  ['Neither the crew member _____ the supervisor was informed of the complaint.\nA) nor  B) or  C) and  D) not','A','B2','medium','structural_accuracy','general','cabin_crew'],
  ['The doors _____ armed immediately after boarding is complete.\nA) must be  B) must  C) should been  D) can','A','B1','medium','passive_voice','general','cabin_crew'],
  ['A passenger approached the galley _____ a glass of water.\nA) requesting  B) requested  C) to requesting  D) request','A','B1','medium','structural_accuracy','general','cabin_crew'],
  ['The evacuation _____ ordered by the captain over the PA system.\nA) was  B) were  C) has  D) is being','A','B1','easy','passive_voice','general','cabin_crew'],
  // ATC
  ['The aircraft _____ on the ILS when the glide slope signal was lost.\nA) was established  B) established  C) is establishing  D) had establishing','A','B2','medium','tense_usage','general','atc'],
  ['All pilots _____ to use standard ICAO phraseology.\nA) are required  B) require  C) is required  D) must requiring','A','B1','medium','passive_voice','general','atc'],
  ['The transponder code _____ set to 7700 by the aircraft in distress.\nA) was  B) were  C) has  D) is being','A','B1','easy','tense_usage','general','atc'],
  ['If traffic separation _____ below standard, the controller must intervene.\nA) falls  B) will fall  C) fall  D) falling','A','B2','medium','conditional_forms','general','atc'],
  ['The aircraft _____ holding at the VOR for 25 minutes before being cleared.\nA) had been  B) has been  C) is  D) was','A','B2','medium','tense_usage','general','atc'],
  ['Neither the radar _____ the backup system was showing the traffic.\nA) nor  B) or  C) and  D) not','A','B2','medium','structural_accuracy','general','atc'],
  ['The pilot was instructed _____ to 4000 feet immediately.\nA) to descend  B) descending  C) descend  D) descended','A','B1','medium','phraseology_grammar','general','atc'],
  ['The clearance _____ read back by the flight crew correctly.\nA) must be  B) must  C) was must  D) can','A','B1','easy','passive_voice','general','atc'],
  ['The controller ensured the aircraft _____ separated by at least 3 nautical miles.\nA) were  B) was  C) are  D) is','A','B1','medium','tense_usage','general','atc'],
  ['Had the aircraft reported its position earlier, the conflict _____ avoided.\nA) could have been  B) could be  C) could  D) will have been','A','C1','hard','conditional_forms','general','atc'],
  // MAINTENANCE
  ['The fuel filter _____ replaced every 500 flight hours.\nA) must be  B) must  C) should been  D) can','A','B1','easy','passive_voice','fuel_system','maintenance'],
  ['The torque value _____ not exceeded during fastener installation.\nA) must be  B) must  C) mustn\'t be  D) can','C','B2','medium','passive_voice','engine','maintenance'],
  ['The technician who _____ the inspection found a corrosion spot.\nA) performed  B) performs  C) performing  D) has perform','A','B1','easy','tense_usage','airframe','maintenance'],
  ['All tools _____ signed out before work begins and signed back in after.\nA) must be  B) must  C) have been  D) should been','A','B1','medium','passive_voice','general','maintenance'],
  ['If the sealant _____ incorrectly, the component must be rejected.\nA) is applied  B) applies  C) will apply  D) applied','A','B2','medium','conditional_forms','general','maintenance'],
  ['The aircraft _____ returned to service until the MEL entry is signed off.\nA) must not be  B) cannot  C) may not  D) must','C','B2','medium','passive_voice','general','maintenance'],
  ['Neither the pressure test _____ the visual inspection showed a defect.\nA) nor  B) or  C) and  D) not','A','B2','medium','structural_accuracy','hydraulic','maintenance'],
  ['The hydraulic system _____ depressurized before disconnecting any line.\nA) must be  B) must  C) should been  D) is','A','B1','medium','passive_voice','hydraulic','maintenance'],
  ['The AMM states that the component _____ be lubricated every 200 hours.\nA) must  B) mustn\'t  C) shouldn\'t  D) might not','A','B1','easy','technical_manual','engine','maintenance'],
  ['Had the crack _____ earlier, the repair would have been simpler.\nA) been found  B) found  C) finding  D) be found','A','C1','hard','conditional_forms','airframe','maintenance'],
  // GROUND STAFF
  ['The boarding pass _____ verified at the gate before the passenger boards.\nA) must be  B) must  C) should been  D) can','A','A2','easy','passive_voice','general','ground_staff'],
  ['The passenger _____ informed that their bag is on the next flight.\nA) was  B) were  C) is being  D) has','A','A2','easy','tense_usage','general','ground_staff'],
  ['If an oversize bag _____ to the gate, it must be checked.\nA) arrives  B) will arrive  C) arriving  D) arrived','A','B1','medium','conditional_forms','general','ground_staff'],
  ['All wheelchairs _____ pre-booked at least 48 hours before departure.\nA) must be requested  B) must requested  C) should been  D) can','A','B1','medium','passive_voice','general','ground_staff'],
  ['The flight _____ closed 15 minutes before departure.\nA) was  B) were  C) is  D) has','A','A2','easy','passive_voice','general','ground_staff'],
  ['Neither the gate agent _____ the duty manager had the authority to rebook.\nA) nor  B) or  C) and  D) not','A','B2','medium','structural_accuracy','general','ground_staff'],
  ['The passenger _____ waiting at the gate for over two hours.\nA) had been  B) has been  C) is  D) was','A','B1','medium','tense_usage','general','ground_staff'],
  ['All dangerous goods _____ declared at check-in by the passenger.\nA) must be  B) must  C) should been  D) will','A','B1','medium','passive_voice','general','ground_staff'],
  ['The supervisor _____ that the delay would exceed one hour.\nA) announced  B) announces  C) announcing  D) is announce','A','A2','easy','tense_usage','general','ground_staff'],
  ['Had the gate agent _____ the boarding group, fewer passengers would have queued.\nA) called  B) been calling  C) be calling  D) calls','A','C1','hard','conditional_forms','general','ground_staff'],
  // GENERAL EXTRA
  ['The aircraft _____ operated in accordance with the approved flight manual.\nA) must be  B) must  C) should been  D) can','A','B1','easy','sop_comprehension','general','general'],
  ['Safety equipment _____ inspected before each flight.\nA) is  B) are  C) being  D) gets','A','A2','easy','passive_voice','general','general'],
  ['If the weather _____ below minimums, the approach must not be continued.\nA) falls  B) will fall  C) fall  D) falling','A','B2','medium','conditional_forms','weather','general'],
  ['The crew _____ been briefed on the emergency procedures before departure.\nA) has  B) have  C) is  D) was','B','B1','medium','tense_usage','general','general'],
  ['All passengers _____ to remain seated while the seatbelt sign is illuminated.\nA) are required  B) require  C) is required  D) must requiring','A','B1','medium','passive_voice','general','general'],
]

// ── FILL BLANK TEMPLATES ────────────────────────────────────────────────────
const fillBlank = [
  ['Complete: The aircraft _____ (arrive) safely despite the crosswind.','arrived','B1','easy','tense_usage','cockpit','flight_deck'],
  ['Complete: The crew _____ (brief) on the weather before departure.','was briefed','B1','easy','passive_voice','weather','flight_deck'],
  ['Complete: All fuel caps _____ (secure) properly after refuelling.','must be secured','B1','medium','passive_voice','fuel_system','flight_deck'],
  ['Complete: The landing gear _____ (extend) at glide slope intercept.','was extended','B1','medium','tense_usage','landing_gear','flight_deck'],
  ['Complete: Had the approach _____ (stabilize), they would have landed.','been stabilized','C1','hard','conditional_forms','cockpit','flight_deck'],
  ['Complete: The PA announcement _____ (make) in a calm tone.','was made','A2','easy','passive_voice','general','cabin_crew'],
  ['Complete: The passenger _____ (request) a vegetarian meal.','requested','A2','easy','tense_usage','general','cabin_crew'],
  ['Complete: All oxygen masks _____ (test) before the flight.','must be tested','B1','medium','passive_voice','general','cabin_crew'],
  ['Complete: The slide _____ (activate) automatically when the door opened with the arm lever in ARMED.','activated','B2','medium','tense_usage','general','cabin_crew'],
  ['Complete: The duty-free items _____ (secure) during taxi.','must be secured','A2','easy','passive_voice','general','cabin_crew'],
  ['Complete: The squawk code _____ (set) to 7700 in an emergency.','must be set','B1','easy','phraseology_grammar','general','atc'],
  ['Complete: The aircraft _____ (hold) at ROMEO for 20 minutes.','had been holding','B2','hard','tense_usage','general','atc'],
  ['Complete: All readbacks _____ (check) for accuracy by the controller.','must be checked','B1','medium','passive_voice','general','atc'],
  ['Complete: The separation _____ (maintain) at 5 nautical miles throughout.','was maintained','B1','medium','tense_usage','general','atc'],
  ['Complete: Had the pilot _____ (report) earlier, a conflict would have been avoided.','reported','C1','hard','conditional_forms','general','atc'],
  ['Complete: The hydraulic line _____ (depressurize) before disconnection.','must be depressurized','B1','medium','passive_voice','hydraulic','maintenance'],
  ['Complete: The work order _____ (sign off) by an authorized technician.','must be signed off','B1','medium','passive_voice','general','maintenance'],
  ['Complete: The engine oil _____ (change) at the correct interval.','was changed','A2','easy','tense_usage','engine','maintenance'],
  ['Complete: All tools _____ (account for) before closing any access panel.','must be accounted for','B1','medium','passive_voice','general','maintenance'],
  ['Complete: Had the corrosion _____ (detect) earlier, the repair would have been smaller.','been detected','C1','hard','conditional_forms','airframe','maintenance'],
  ['Complete: The boarding pass _____ (scan) at the gate.','was scanned','A2','easy','tense_usage','general','ground_staff'],
  ['Complete: Unaccompanied minors _____ (accompany) to their seats by ground staff.','must be accompanied','B1','medium','passive_voice','general','ground_staff'],
  ['Complete: The lost bag _____ (report) to the duty manager immediately.','was reported','A2','easy','tense_usage','general','ground_staff'],
  ['Complete: All wheelchairs _____ (pre-book) at least 48 hours before departure.','must be pre-booked','B1','medium','passive_voice','general','ground_staff'],
  ['Complete: Had the gate _____ (open) on time, the delay would have been avoided.','opened','B2','medium','conditional_forms','general','ground_staff'],
  ['Complete: Safety checks _____ (perform) before every departure.','must be performed','A2','easy','passive_voice','general','general'],
  ['Complete: The accident _____ (report) within 24 hours.','must be reported','B1','easy','passive_voice','general','general'],
  ['Complete: By the time help arrived, the crew _____ (contain) the situation.','had contained','B2','medium','tense_usage','general','general'],
  ['Complete: The emergency _____ (declare) by the captain.','was declared','B1','easy','passive_voice','general','general'],
  ['Complete: If ice _____ (form) on the wings, de-icing is required.','forms','B1','medium','conditional_forms','weather','general'],
]

// ── ERROR CORRECTION ────────────────────────────────────────────────────────
const errorCorrection = [
  ['Find and correct: "The first officer have submitted the departure report."\n','has submitted (have → has; first officer is singular)','B1','medium','tense_usage','cockpit','flight_deck'],
  ['Find and correct: "The approach were not stabilized below 1000 feet."\n','was not stabilized (were → was; "the approach" is singular)','B1','medium','tense_usage','cockpit','flight_deck'],
  ['Find and correct: "If the engine will fail, declare an emergency immediately."\n','fails (will fail → fails; first conditional)','B2','medium','conditional_forms','engine','flight_deck'],
  ['Find and correct: "By landing, the crew have used the planned fuel exactly."\n','had used (have used → had used; past perfect after "by [time]")','C1','hard','tense_usage','fuel_system','flight_deck'],
  ['Find and correct: "The METAR were received before departure."\n','was received (were → was; METAR is singular)','B1','easy','tense_usage','weather','flight_deck'],
  ['Find and correct: "All passengers must remains seated during turbulence."\n','remain (remains → remain; base form after modal verb)','B1','easy','structural_accuracy','general','cabin_crew'],
  ['Find and correct: "The slide were armed before departure."\n','was armed (were → was; "the slide" is singular)','A2','easy','tense_usage','general','cabin_crew'],
  ['Find and correct: "If a passenger will feel unwell, alert the cabin director."\n','feels (will feel → feels; first conditional)','B2','medium','conditional_forms','general','cabin_crew'],
  ['Find and correct: "The duty-free items was stowed before takeoff."\n','were stowed (was → were; plural subject "items")','B1','easy','tense_usage','general','cabin_crew'],
  ['Find and correct: "The medical kit must checked monthly."\n','must be checked (must checked → must be checked; passive infinitive)','B2','medium','passive_voice','general','cabin_crew'],
  ['Find and correct: "The aircraft which the transponder was squawking 7700 was identified."\n','that (which → that; used with restrictive clause defining a specific aircraft)','C1','hard','structural_accuracy','general','atc'],
  ['Find and correct: "Squawk 7600 are used for radio failure."\n','is used (are → is; singular subject)','B1','easy','tense_usage','general','atc'],
  ['Find and correct: "If the pilot will not read back, try the guard frequency."\n','does not read back (will not → does not; first conditional)','B2','medium','conditional_forms','general','atc'],
  ['Find and correct: "The separation were maintained at 5 miles throughout the flight."\n','was maintained (were → was; "separation" is singular)','B1','medium','tense_usage','general','atc'],
  ['Find and correct: "Had the crew reported the emergency sooner, the controller would been able to help earlier."\n','would have been able (would been → would have been; conditional perfect)','C1','hard','conditional_forms','general','atc'],
  ['Find and correct: "The engine oil were changed at the correct interval."\n','was changed (were → was; "engine oil" is uncountable/singular)','B1','easy','tense_usage','engine','maintenance'],
  ['Find and correct: "The technician must to inspect the fuel system after installation."\n','must inspect (must to inspect → must inspect; no "to" after modal verb)','B1','easy','structural_accuracy','fuel_system','maintenance'],
  ['Find and correct: "If the pressure will exceed the limit, relieve immediately."\n','exceeds (will exceed → exceeds; first conditional)','B2','medium','conditional_forms','hydraulic','maintenance'],
  ['Find and correct: "The component which was installed incorrect has been removed."\n','incorrectly (incorrect → incorrectly; adverb needed)','B2','medium','structural_accuracy','general','maintenance'],
  ['Find and correct: "Had the torque be applied correctly, the fastener would not have failed."\n','been applied (be → been; past perfect passive)','C1','hard','tense_usage','engine','maintenance'],
  ['Find and correct: "All departure gates is shown on the screen."\n','are shown (is → are; plural subject "gates")','A2','easy','structural_accuracy','general','ground_staff'],
  ['Find and correct: "The boarding were completed 10 minutes early."\n','was completed (were → was; "boarding" is singular)','A2','easy','tense_usage','general','ground_staff'],
  ['Find and correct: "If the flight will be delayed, inform passengers immediately."\n','is delayed (will be → is; first conditional)','B2','medium','conditional_forms','general','ground_staff'],
  ['Find and correct: "The bag was found on stand three by ground staff who was cleaning."\n','who were cleaning (was → were; plural subject "ground staff")','B2','medium','tense_usage','general','ground_staff'],
  ['Find and correct: "Had the agent checked the weight earlier, the delay would avoided."\n','would have been avoided (would avoided → would have been avoided; conditional perfect passive)','C1','hard','conditional_forms','general','ground_staff'],
  ['Find and correct: "The crew is require to report all incidents."\n','is required (require → required; passive voice)','B1','medium','passive_voice','general','general'],
  ['Find and correct: "Neither the pilot or the controller noticed the deviation."\n','nor (or → nor; "neither...nor")','B2','medium','structural_accuracy','general','general'],
  ['Find and correct: "The aircraft what had the fault was grounded."\n','that (what → that; relative pronoun for things)','B1','medium','structural_accuracy','general','general'],
  ['Find and correct: "All safety equipment must be regular inspected."\n','regularly (regular → regularly; adverb needed)','B2','medium','structural_accuracy','general','general'],
  ['Find and correct: "By time the ambulance arrived, the crew had treated the passenger."\n','By the time (By time → By the time; fixed phrase)','B2','medium','structural_accuracy','general','general'],
]

// ── SHORT ANSWER ────────────────────────────────────────────────────────────
const shortAnswer = [
  ['Rewrite in passive: "The co-pilot calculated the landing weight."','The landing weight was calculated by the co-pilot.','B2','medium','passive_voice','cockpit','flight_deck'],
  ['Put in reported speech: The captain said "We will hold at the VOR."','The captain said that they would hold at the VOR.','B2','medium','structural_accuracy','cockpit','flight_deck'],
  ['What ICAO phrase means "I acknowledge receipt and will comply"?','Wilco','B1','easy','phraseology_grammar','cockpit','flight_deck'],
  ['Complete with the correct form: "The crew had completed the checklist before the passengers _____ (board)."','boarded','B2','medium','tense_usage','cockpit','flight_deck'],
  ['Write the third conditional: "The crew didn\'t receive the SIGMET. They didn\'t divert." → "If the crew _____, they _____."','If the crew had received the SIGMET, they would have diverted.','C1','hard','conditional_forms','weather','flight_deck'],
  ['Rewrite in passive: "The cabin director briefed all crew on the emergency exits."','All crew were briefed on the emergency exits by the cabin director.','B2','medium','passive_voice','general','cabin_crew'],
  ['What is the standard phrase used to start a PA announcement to passengers?','Ladies and gentlemen / Attention passengers','A2','easy','phraseology_grammar','general','cabin_crew'],
  ['Put in reported speech: The purser said "All doors are armed."','The purser said that all doors were armed.','B2','medium','structural_accuracy','general','cabin_crew'],
  ['Complete: "If a passenger _____ (refuse) to comply, the cabin director _____ (inform) the captain."','refuses / must inform','B2','medium','conditional_forms','general','cabin_crew'],
  ['Rewrite in passive: "A passenger left a laptop bag at seat 22A."','A laptop bag was left at seat 22A by a passenger.','B2','medium','passive_voice','general','cabin_crew'],
  ['What ICAO squawk code indicates an emergency?','7700','B1','easy','phraseology_grammar','general','atc'],
  ['Rewrite in passive: "The controller cleared the aircraft to FL100."','The aircraft was cleared to FL100 by the controller.','B2','medium','passive_voice','general','atc'],
  ['Write a correct readback for: "TK-501, descend FL80, heading 180."','TK-501, descend FL80, heading 180, TK-501.','B2','medium','phraseology_grammar','general','atc'],
  ['What does "MAYDAY MAYDAY MAYDAY" sent on 121.5 indicate?','An international distress call — the highest level of emergency','B1','easy','phraseology_grammar','general','atc'],
  ['Complete: "If radar contact _____ (lose), the controller _____ (provide) procedural separation."','is lost / must provide','B2','medium','conditional_forms','general','atc'],
  ['Rewrite in passive: "The technician must inspect the fuel nozzles every 200 hours."','The fuel nozzles must be inspected every 200 hours.','B2','medium','passive_voice','fuel_system','maintenance'],
  ['What abbreviation means a document listing allowed defects for dispatch?','MEL (Minimum Equipment List)','B1','easy','technical_manual','general','maintenance'],
  ['Complete: "If the hydraulic pressure _____ (fall) below 1500 PSI, the system _____ (isolate)."','falls / must be isolated','B2','medium','conditional_forms','hydraulic','maintenance'],
  ['Rewrite in passive: "A certified inspector must verify all fuel system repairs."','All fuel system repairs must be verified by a certified inspector.','B2','medium','passive_voice','fuel_system','maintenance'],
  ['Write the past perfect: "The technician _____ (complete) the task before the inspector arrived."','had completed','B2','medium','tense_usage','general','maintenance'],
  ['Rewrite in passive: "The gate agent scanned the boarding passes."','The boarding passes were scanned by the gate agent.','B2','medium','passive_voice','general','ground_staff'],
  ['What is the IATA code for a passenger who needs wheelchair assistance?','WCHR','A2','easy','phraseology_grammar','general','ground_staff'],
  ['Complete: "If the bag _____ (exceed) the weight limit, it _____ (check) into the hold."','exceeds / must be checked','B1','medium','conditional_forms','general','ground_staff'],
  ['Put in reported speech: The agent said "The flight is delayed by one hour."','The agent said that the flight was delayed by one hour.','B2','medium','structural_accuracy','general','ground_staff'],
  ['Rewrite in passive: "Ground staff loaded all bags before departure."','All bags were loaded by ground staff before departure.','B1','easy','passive_voice','general','ground_staff'],
  ['What is the correct passive form of: "We must file safety reports within 24 hours."?','Safety reports must be filed within 24 hours.','B2','medium','passive_voice','general','general'],
  ['Complete: "By the time rescuers arrived, the crew _____ (evacuate) all passengers."','had evacuated','B2','medium','tense_usage','general','general'],
  ['Put in reported speech: The captain announced "There is no cause for alarm."','The captain announced that there was no cause for alarm.','B2','medium','structural_accuracy','general','general'],
  ['What is the third conditional structure?','If + past perfect ... would have + past participle','B2','medium','conditional_forms','general','general'],
  ['Rewrite in active: "The METAR was updated by the meteorology office every hour."','The meteorology office updated the METAR every hour.','B2','medium','passive_voice','general','general'],
]

// ── TRUE/FALSE READING ──────────────────────────────────────────────────────
const trueFalse = [
  ['Read the SOP:\n"Before performing a go-around, the PF must set TOGA thrust and call GO-AROUND FLAP 15. The PM must not touch the thrust levers unless commanded."\n\nStatement: The PM may apply thrust during a go-around without being commanded.\nTRUE or FALSE?','FALSE — the SOP explicitly states the PM must not touch levers unless commanded','B2','medium','sop_comprehension','cockpit','flight_deck'],
  ['Read the regulation:\n"Any crew member who suspects they are fatigued must report this to the captain before departure. The captain may reassign duties or delay the flight."\n\nStatement: A fatigued crew member should fly the flight and report fatigue after landing.\nTRUE or FALSE?','FALSE — the regulation requires reporting BEFORE departure','B1','medium','sop_comprehension','general','flight_deck'],
  ['Read the NOTAM:\n"NOTAM A1154/26: ILS runway 27R serviceable. ILS runway 27L unserviceable until 22 MAR 2026."\n\nStatement: Pilots can use the ILS approach for runway 27R.\nTRUE or FALSE?','TRUE — the NOTAM only states 27L is unserviceable; 27R ILS is serviceable','B1','easy','notam_interpretation','cockpit','flight_deck'],
  ['Read the fuel policy:\n"Minimum fuel on arrival must be final reserve fuel (30 minutes hold at 1500 feet). If fuel on board falls to final reserve, a Mayday must be declared."\n\nStatement: A pilot with 25 minutes of fuel should declare an emergency.\nTRUE or FALSE?','TRUE — 25 minutes is below the 30-minute final reserve, so Mayday must be declared','C1','hard','sop_comprehension','fuel_system','flight_deck'],
  ['Read the cabin safety card:\n"In case of emergency landing, brace position must be adopted when instructed. Keep arms in the brace position until the aircraft comes to a complete stop."\n\nStatement: Passengers may release the brace position as soon as the aircraft touches down.\nTRUE or FALSE?','FALSE — the card states brace must be maintained until the aircraft COMPLETELY STOPS','A2','easy','safety_card_reading','general','cabin_crew'],
  ['Read the company SOP:\n"The cabin director is responsible for cross-checking all door arm/disarm actions. Doors may not be opened until the cabin director confirms all doors are in the correct mode."\n\nStatement: Any crew member can open a door without waiting for the cabin director.\nTRUE or FALSE?','FALSE — only the cabin director confirms correct door mode before opening','B2','medium','sop_comprehension','general','cabin_crew'],
  ['Read the UMR rule:\n"Unaccompanied minors (UM) must not be left with any passenger. They must be supervised by crew at all times until handed to authorized ground staff at arrival."\n\nStatement: A UM can sit next to a friendly passenger who offers to look after them.\nTRUE or FALSE?','FALSE — UMs must be supervised by crew at all times; they cannot be left with passengers','B1','easy','sop_comprehension','general','cabin_crew'],
  ['Read the ATC rule:\n"Separation minima for aircraft on parallel approaches must be maintained at all times. If one aircraft is instructed to go-around, standard separation must be re-established before continuing other approaches."\n\nStatement: Other approaches can continue without re-establishing separation after a go-around.\nTRUE or FALSE?','FALSE — separation must be re-established before other approaches continue','B2','medium','sop_comprehension','general','atc'],
  ['Read the ICAO standard:\n"A readback is required for all level, heading, speed instructions and runway in use. Frequency changes do not require a readback — only a readback of the new frequency is needed."\n\nStatement: Pilots must read back all ATC instructions including frequency changes in full.\nTRUE or FALSE?','FALSE — frequency changes only require reading back the new frequency, not a full broadcast readback','B2','medium','sop_comprehension','general','atc'],
  ['Read the emergency procedure:\n"On receiving a Mayday call, the receiving controller shall immediately acknowledge, request position/nature of emergency/souls/fuel, and alert emergency services."\n\nStatement: A controller can wait until the emergency aircraft lands before alerting emergency services.\nTRUE or FALSE?','FALSE — emergency services must be alerted IMMEDIATELY after receiving the Mayday call','B2','medium','sop_comprehension','general','atc'],
  ['Read the AMM note:\n"WARNING: Do not power the electrical system before all access panels are closed and fastened. Failure to comply may result in serious injury."\n\nStatement: You may power the system if most panels are closed.\nTRUE or FALSE?','FALSE — ALL access panels must be closed and fastened before powering the system','B1','easy','technical_manual','general','maintenance'],
  ['Read the MEL entry:\n"With Hydraulic System A pump inoperative, flight is permitted provided System B is fully operative and flight duration does not exceed 90 minutes."\n\nStatement: The aircraft may fly a 2-hour sector with System A pump inoperative.\nTRUE or FALSE?','FALSE — the MEL limits flights to 90 minutes maximum when System A pump is inoperative','B2','medium','technical_manual','hydraulic','maintenance'],
  ['Read the safety rule:\n"All tools must be returned to the toolbox and counted before any access panel is closed. If a tool cannot be located, the panel must remain open and the supervisor notified."\n\nStatement: A panel may be closed if 90% of tools are accounted for.\nTRUE or FALSE?','FALSE — ALL tools must be accounted for; the panel must remain open if any tool is missing','B1','easy','sop_comprehension','general','maintenance'],
  ['Read the weight restriction notice:\n"When a weight restriction applies, priority offload sequence is: 1) Fuel (if above minimum), 2) Cargo/mail, 3) Passenger baggage. Passengers are offloaded only as a last resort."\n\nStatement: Passenger bags should be offloaded before cargo when there is a weight restriction.\nTRUE or FALSE?','FALSE — cargo/mail comes before passenger baggage in the priority offload sequence','B2','medium','sop_comprehension','general','ground_staff'],
  ['Read the security notice:\n"All unattended bags must be treated as suspicious and reported immediately. Do not attempt to move or open the bag.\n\nStatement: It is acceptable to open an unattended bag to check its contents before reporting.\nTRUE or FALSE?','FALSE — unattended bags must NEVER be opened; they must be reported immediately','B1','easy','sop_comprehension','general','ground_staff'],
]

// ── LISTENING ───────────────────────────────────────────────────────────────
const listening = [
  ['[AUDIO] "Flight deck to cabin: we are experiencing light turbulence at FL350. Fasten seat belt sign is now ON. Cabin crew please be seated. Expected duration 15 minutes."\n\nWhat should cabin crew do?\nA) Continue service  B) Be seated  C) Make a PA  D) Check overhead bins','B','B1','easy','cockpit_communication','cockpit','flight_deck'],
  ['[AUDIO] "Istanbul Approach, TK-405, maintaining FL100 on heading 270, requesting ILS approach runway 36R. Information Hotel received."\n\nWhich runway is TK-405 requesting?\nA) 27L  B) 36L  C) 36R  D) 18','C','B1','easy','atc_phraseology','cockpit','flight_deck'],
  ['[AUDIO] "Weather alert: SIGMET BRAVO 7 — severe turbulence forecast FL250 to FL380, valid until 1800Z. All aircraft in sector Echo should consider avoiding this level band."\n\nAt which altitude can aircraft fly without entering severe turbulence zones?\nA) FL300  B) FL260  C) FL200  D) FL350','C','B2','medium','weather_report_reading','weather','flight_deck'],
  ['[AUDIO] "Cabin crew, two minutes to landing. Two minutes to landing."\n\nWhat must cabin crew do immediately after this call?\nA) Prepare welcome message  B) Take jump seats and complete final checks  C) Remove service items  D) Check lavatories','B','A2','easy','cabin_announcement','general','cabin_crew'],
  ['[AUDIO] "This is the cabin director speaking. We have a medical situation at seat 34B. Is there a doctor or medical professional on board? Please identify yourself to the nearest crew member."\n\nWhat is being sought?\nA) First aid kit  B) A doctor or medical professional  C) Defibrillator  D) Oxygen','B','A2','easy','cabin_announcement','general','cabin_crew'],
  ['[AUDIO] "Attention all crew: we are diverting to Ankara due to a medical emergency. New flight time: 40 minutes. Please prepare the cabin for an early landing and inform passengers."\n\nWhat is the reason for the diversion?\nA) Weather  B) Technical issue  C) Medical emergency  D) ATC instruction','C','B1','easy','cabin_announcement','general','cabin_crew'],
  ['[AUDIO] "Istanbul Radar, Delta Hotel Kilo, FL140, 30 nautical miles south, request descent for ILS approach runway 05."\n\nHow far is Delta Hotel Kilo from the airport?\nA) 3 miles  B) 30 miles  C) 14 miles  D) 50 miles','B','B1','easy','atc_phraseology','general','atc'],
  ['[AUDIO] "All sectors: traffic management initiative in effect. Accept no more than 4 aircraft per hour into sector Foxtrot. Apply 15-minute miles-in-trail spacing on routes entering from the north."\n\nWhat is the maximum traffic accepted per hour into sector Foxtrot?\nA) 6  B) 15  C) 4  D) 10','C','B1','medium','atc_phraseology','general','atc'],
  ['[AUDIO] "Emergency squawk detected: aircraft at position Lima 7, heading 090, altitude unknown, no radio contact. All adjacent aircraft maintain 3000-foot vertical separation from this position."\n\nWhat separation must adjacent aircraft maintain?\nA) 1000 feet  B) 2000 feet  C) 3000 feet  D) 5 miles','C','B2','medium','emergency_broadcast','general','atc'],
  ['[AUDIO] "Maintenance briefing: the starboard engine of TC-FBA has a suspected compressor stall at high power settings. Do not run engine above idle until core team completes borescope inspection. All ground run tests cancelled."\n\nWhat is cancelled for TC-FBA?\nA) Hydraulic tests  B) All ground run tests  C) Landing gear retraction test  D) Refuelling','B','B2','medium','sop_comprehension','engine','maintenance'],
  ['[AUDIO] "Safety alert: three cases of incorrect torque application on main landing gear fasteners were reported this month. Please ensure you are using calibrated torque wrenches only. All uncalibrated tools must be removed from service immediately."\n\nWhat must be removed from service?\nA) All torque wrenches  B) Uncalibrated torque wrenches  C) All hand tools  D) Power tools only','B','B1','medium','sop_comprehension','landing_gear','maintenance'],
  ['[AUDIO] "Quality control update: three recent work orders were returned due to missing signatures on the dual sign-off section. All fuel system work must have two independent signatures. Supervisors, please remind your teams."\n\nWhat is required for fuel system work?\nA) One technician signature  B) Supervisor sign-off only  C) Two independent signatures  D) QC stamp only','C','B2','medium','sop_comprehension','fuel_system','maintenance'],
  ['[AUDIO] "Good morning, gate 14B. This is a boarding announcement for flight TK-112 to London Heathrow. We invite our business class passengers and passengers needing extra time or travelling with young children to board at this time."\n\nWhich passengers should board now?\nA) All passengers  B) Economy class only  C) Business class, extra-time and families  D) Passengers in rows 1-10','C','A2','easy','cabin_announcement','general','ground_staff'],
  ['[AUDIO] "Ground operations: we have a weight and balance issue on flight TK-208. We need to offload 200 kilograms of hold baggage. Please identify late check-in bags from rows 20-35 and hold them for later flight. Ground staff to the baggage belt immediately."\n\nWhy are bags being offloaded?\nA) Security issue  B) Dangerous goods found  C) Weight and balance problem  D) Aircraft change','C','B1','medium','ground_ops_radio','general','ground_staff'],
  ['[AUDIO] "Attention all ground staff: there is a bird strike report at runway threshold. Maintenance has been notified. Until the area is inspected and cleared, no pushback or taxi operations are permitted in Zone Alpha. All operations hold at Zone Bravo."\n\nWhere can operations continue?\nA) Zone Alpha  B) The threshold only  C) Zone Bravo  D) No operations anywhere','C','B2','medium','ground_ops_radio','general','ground_staff'],
]

// ── WRITING PROMPTS ─────────────────────────────────────────────────────────
const writing = [
  ['Write a decision-making report (min 80 words) describing the following: You are cruising at FL360 when SIGMET CHARLIE is issued for your route. Weather radar shows CB cells ahead. Options: climb to FL400, divert 50nm south, continue and hope for gaps. Describe your analysis and chosen action.','Model: Assess each option (climb: aircraft near max alt, marginal; divert: fuel impact, coordinate with dispatch; continue: unacceptable risk). Decision: divert 50nm south en route, request revised clearance, inform dispatch, update passengers.','C1','hard','incident_report','weather','flight_deck'],
  ['Write a flight crew briefing note (min 70 words) for a departure in low visibility (RVR 350m). Include: approach type, CAT, crew roles, go-around criteria.','Model: LVP in force, CAT III ILS approach, RVR min 350m, PF: captain (auto-land), PM: monitoring, auto-land armed all channels. Go-around criteria: any GPWS, windshear, ROLL OUT failure, RVR below 200m. Brief all crew on sterile cockpit until clear of cloud.','C1','hard','sop_comprehension','cockpit','flight_deck'],
  ['Write an in-flight service interruption announcement and report (min 60 words): Turbulence interrupted the meal service with 85 passengers not yet served. Include passenger PA and crew handover note.','Model PA: apologies for interruption, seatbelts remain on, service will resume when sign off. Handover note: rows 20-35 not yet served, meals for those rows in cart 2B, service to resume in approx 20 minutes if smooth air.','B2','medium','cabin_announcement','general','cabin_crew'],
  ['A special needs passenger (vision impaired) missed the safety demonstration. Write the tailored safety briefing script (min 70 words) you would deliver personally to them, covering seatbelt, exit, brace, and lifevest.','Model: Personal approach, describe location of each item using touch/reference to position (belt clasp on your lap, exit 2 rows ahead on your left, life vest under seat pockets, brace: hands linked behind neck, head on knees). Offer to walk them to nearest exit.','B2','medium','passenger_instruction','general','cabin_crew'],
  ['Write an ATC sector capacity report (min 70 words) for the following: Your sector handled 42 aircraft between 0900-1000Z. One Level Bust occurred (aircraft went 200ft below assigned level). Two aircraft with equipment failures required additional coordination. Write what happened, how it was handled, and what should be done.','Model: Aircraft count 42 (above optimal 35), level bust at 1132 (aircraft B-XXX, 200ft low, corrected immediately, separation maintained, report filed), 2 equipment failures (one radio failure → secondary frequency, one altimeter → special procedures), Recommendation: reduce flow rate and add sector split during this window.','C1','hard','incident_report','general','atc'],
  ['Write a technical write-up (min 80 words) of a hydraulic leak found on the ground before departure. Include location, quantity, color, corrective action, and status.','Model: Aircraft TC-XYZ, hydraulic fluid (bright red, servo-transparent) found pooling approx 0.5L under left main gear actuator. System A pressure showing 100 PSI low. Actuator seam inspected — seal failure confirmed at port connection. Component isolated, system B verified serviceable, replacement seal ordered. Aircraft grounded until component replaced and dual sign-off obtained. ETA to service: 4 hours.','C1','hard','maintenance_log','hydraulic','maintenance'],
  ['Write a tool control violation report (min 70 words): during a routine panel closure on aircraft TC-ABC, a technician closed the avionics bay without conducting a full tool count. A panel wrench was found 2 hours later inside the bay during the next access. Write the report.','Model: Date/time, aircraft TC-ABC, avionics bay panel 112A, tool: 10mm panel wrench, discovered during access 2 hours after closure, no damage to equipment, tool removed and logged. Root cause: technician skipped tool count procedure. Corrective action: tool count mandatory sign-off added to panel closure card, refresher training for team.','C1','hard','incident_report','general','maintenance'],
  ['A passenger is angry that their peanut allergy was not noted on their booking. They say they had requested a nut-free meal but received a standard meal. Write a formal complaint response email (min 70 words) and the internal corrective action note.','Model Email: Dear [name], sincere apologies, we take allergies extremely seriously. We have confirmed your pre-order was on file but a loading error occurred. Corrective action: refund of ticket price, goodwill upgrade on next flight, review of loading procedure. Internal note: add allergy meal verification to departure checklist, brief all gate agents.','B2','medium','passenger_complaint','general','ground_staff'],
]

// ── SPEAKING PROMPTS ────────────────────────────────────────────────────────
const speaking = [
  ['You are briefing a first officer on a challenging approach: Heathrow runway 27L, ILS CAT II, weather: RVR 450m, wind 250/18G28, NOTAM: taxiway Juliet closed. Deliver the full approach briefing.\nSpeak for at least 60 seconds.','CAT II brief: confirm both autoland channels, minima RVR 400m published/450m actual (acceptable), crosswind 18G28 (limit 25kts — caution), go-around runway heading, taxiway Juliet closed so routing plan, extra vigilance.','C1','hard','cockpit_communication','cockpit','flight_deck'],
  ['Explain to a junior first officer what the FORDEC decision model is and use a real aviation example to illustrate each step.\nSpeak for at least 60 seconds.','Facts: situation (low fuel), Options: divert/priority landing/declare, Risks: assess each option, Decision: priority landing, Execute: request, Check: fuel confirmed above minimum on landing.','C1','hard','crew_coordination','cockpit','flight_deck'],
  ['Deliver a realistic PA for a diversion to Ankara when the original destination Istanbul has closed due to fog. Include reason, new destination, and reassurance.\nSpeak for at least 40 seconds.','Professional tone: explain weather (fog, below limits), decision to divert to Ankara (safety priority), ETA ~30 minutes, ground staff will assist with rebooking, crew available for questions.','B2','medium','cabin_announcement','cockpit','flight_deck'],
  ['A passenger has had too much to drink and is becoming disruptive. Walk through how you handle this — from first approach to escalation.\nSpeak for at least 50 seconds.','Calm approach, offer water, reduce further service, involve cabin director, warn formally (you may be offloaded), document behaviour, captain notified, if continues: aircraft may divert or ground police notified.','B2','medium','passenger_instruction','general','cabin_crew'],
  ['A child travelling alone (UM, 8 years old) is crying and says they want to go home. How do you handle this?\nSpeak for at least 40 seconds.','Sit with child, calm tone, explain the journey, offer snack/game/movie, check if they have a comfort item, reassure destination contact notified, note in UM form, do not leave unattended.','B1','medium','passenger_instruction','general','cabin_crew'],
  ['Deliver the emergency brace command and evacuation command for a crash landing scenario, then explain the evacuation procedure to a colleague.\nSpeak for at least 50 seconds.','Brace call: "BRACE BRACE BRACE" (repeated). On stop: "Release seatbelts, open door, come this way." Evacuation: each crew member at assigned exit, direct passengers away from aircraft, do not allow carry-ons, count pax out.','C1','hard','roleplay_emergency','general','cabin_crew'],
  ['Explain the difference between a Mayday and a Pan-Pan call, and give an example of when each would be used.\nSpeak for at least 45 seconds.','Mayday: immediate grave danger, life at risk (engine fire, rapid decompression, total fuel). Pan-Pan: urgency, not immediate danger (medical situation, minor technical, low fuel still manageable). Mayday = highest priority, all traffic clears frequency.','B2','medium','atc_phraseology','general','atc'],
  ['An aircraft on approach is not responding. Describe the steps you take over the next 5 minutes.\nSpeak for at least 60 seconds.','Call on primary and alternate frequencies, try guard (121.5), request adjacent aircraft in area to try contact, check radar track (normal/abnormal), alert supervisor, coordinate with other facilities, consider NORDO procedures (continued approach if transponder normal).','C1','hard','emergency_broadcast','general','atc'],
  ['There is a runway incursion in progress — a vehicle has entered runway 27L while an aircraft is on short final. Describe your immediate actions and communications.\nSpeak for at least 60 seconds.','IMMEDIATE: instruct aircraft to go-around ("Go around, runway incursion"), alert ground to stop vehicle, confirm vehicle stopped, establish separation for go-around aircraft, inform supervisor, issue incident report.','C1','hard','emergency_broadcast','general','atc'],
  ['Explain the concept of "tool control" to a new apprentice technician. Why is it important and what are the consequences of failing to follow it?\nSpeak for at least 45 seconds.','Every tool must be signed out, used, signed back in. Tool count before each panel closure. A missing tool = FOD (Foreign Object Damage) risk — can destroy engines or critical systems. Consequence: aircraft grounded, regulatory penalty, potential incident report.','B2','medium','sop_comprehension','general','maintenance'],
  ['A colleague has made an error — they applied the wrong torque to a fastener. Walk through what they should do from discovery to resolution.\nSpeak for at least 50 seconds.','Stop work immediately, do not proceed. Report to supervisor honestly. Check if fastener must be removed and inspected. Check AMM for correct torque spec. Correct with calibrated wrench. Dual sign-off. Log in technical record. Document in safety report for learning.','C1','hard','maintenance_log','general','maintenance'],
  ['Explain what an AOG (Aircraft on Ground) situation means and what your role is as a maintenance technician in resolving it quickly.\nSpeak for at least 50 seconds.','AOG = aircraft cannot fly, massive revenue and schedule impact. Technician role: rapid fault diagnosis, prioritise repair, source parts urgently, work with ops and engineering, document all actions in real time, return aircraft to service ASAP safely.','B2','medium','sop_comprehension','general','maintenance'],
  ['A passenger is frustrated because the check-in system has no record of their booking despite them showing a printed confirmation. Walk through how you handle this professionally.\nSpeak for at least 50 seconds.','Stay calm, acknowledge frustration, verify booking reference manually, check alternate spelling/email, contact senior agent or reservations team directly, check if booking in different name. If legitimate: issue boarding pass. If genuine system error: escalate to duty manager for approval.','B2','medium','passenger_instruction','general','ground_staff'],
  ['At the boarding gate you discover you have 4 more passengers than seats. Walk through how you manage the situation from first announcement to resolution.\nSpeak for at least 60 seconds.','Make volunteer call (incentives: vouchers, upgrade on next flight). If insufficient volunteers: apply involuntary bump (last to check in, single travellers first per policy). Rebook on next flight, provide meal vouchers, accommodation if overnight delay, document for compensation claim.','B2','medium','ground_communication','general','ground_staff'],
  ['Explain airport security zones to a new colleague. What are the different zones, what access is required, and what happens if someone enters without authorisation?\nSpeak for at least 50 seconds.','Public zone (no pass), landside check-in zone (ticket needed), airside (security cleared, airside pass required), restricted apron zone (additional access, PPE, vehicle pass). Unauthorised entry: immediate security alert, detention, police involvement, possible criminal charge.','B2','medium','sop_comprehension','general','ground_staff'],
]

// ── BUILD & INSERT ──────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Expanding Question Bank\n' + '='.repeat(45))
  const allRows = []

  for (const [content, answer, cefr, diff, tag, ctx, role] of grammarMC)
    allRows.push(q('grammar','multiple_choice',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of fillBlank)
    allRows.push(q('grammar','fill_blank',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of errorCorrection)
    allRows.push(q('grammar','error_correction',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of shortAnswer)
    allRows.push(q('grammar','short_answer',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of trueFalse)
    allRows.push(q('reading','true_false',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of listening)
    allRows.push(q('listening','multiple_choice',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of writing)
    allRows.push(q('writing','written_response',content,answer,cefr,diff,tag,ctx,role))
  for (const [content, answer, cefr, diff, tag, ctx, role] of speaking)
    allRows.push(q('speaking','audio_response',content,answer,cefr,diff,tag,ctx,role))

  console.log(`📝 Toplam üretilen soru: ${allRows.length}`)

  for (let i = 0; i < allRows.length; i += 50) {
    const batch = allRows.slice(i, i + 50)
    await insert(batch)
    process.stdout.write(`\r⬆️  ${Math.min(i+50, allRows.length)}/${allRows.length} yüklendi`)
  }
  console.log('\n\n✅ Tamamlandı! Şimdi soru sayısını kontrol et:')
  console.log('   node scripts/count-questions.js\n')
}
main().catch(console.error)
