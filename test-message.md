# Three-Tier Intelligence System Test

## Test Message
"I need to go to the dentist next Friday at 2 PM downtown with Dr. Smith"

## Expected Processing Flow

### 1. Classification (WHO I AM / WHAT I DID / WHAT I'LL DO)
- **Expected**: EXPERIENCE (future appointment)
- **Reason**: Contains future reference "next Friday"

### 2. Entity Extraction (ExperienceEntities)
- **who**: ["Dr. Smith"]
- **what**: ["dentist", "appointment"]  
- **when**: ["next Friday at 2 PM"]
- **where**: ["downtown"]
- **why**: [] (none specified)
- **how**: [] (none specified)

### 3. Date Resolution (ResolvedDate[])
```json
[{
  "original": "next Friday at 2 PM",
  "type": "date",
  "value": "2025-08-08", // calculated from current timestamp
  "confidence": 0.9
}]
```

### 4. System Actions Triggered
1. **Memory Creation**: Store in memories table with EXPERIENCE classification
2. **Experience Creation**: Create experience record with resolved dates
3. **Contact Creation**: Create/update Dr. Smith contact record as dentist
4. **System Task**: Generate hidden proactive follow-up task (4 hours after appointment)

### 5. Database Records Created
- **memories**: 1 record (classification: "EXPERIENCE")
- **experiences**: 1 record (with resolvedDates)
- **contacts**: 1 record (Dr. Smith, type: "dentist", incomplete: true)
- **system_tasks**: 1 hidden task (proactive_followup)

## Success Criteria
✅ Correct classification (EXPERIENCE)
✅ Proper entity extraction 
✅ Date resolution working ("next Friday" → actual date)
✅ Contact creation (Dr. Smith as dentist)
✅ System task generation (hidden proactive follow-up)
✅ No TypeScript compilation errors
✅ All database records created successfully

This test validates the complete three-tier intelligence pipeline from classification through specialized processing.