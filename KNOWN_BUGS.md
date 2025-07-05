# 🐛 MAGIS - Known Bugs & Issues

This document tracks known bugs and issues in the MAGIS AI Assistant that are documented but not yet prioritized for fixing.

## 🎤 **Voice Input Issues**

### 1. Auto-send After Speech Won't Work (Intermittent)
**Status:** 🔴 Known Issue  
**Severity:** Medium  
**Frequency:** Intermittent (browser-dependent)

**Description:**  
Voice input successfully transcribes speech to text input field, but auto-send functionality fails to trigger automatically when speech recognition stops.

**Symptoms:**
- ✅ Speech recognition works correctly
- ✅ Text appears in input field while speaking
- ✅ Speech recognition stops automatically
- ❌ Message doesn't auto-send after stopping
- ✅ Manual click on send button works

**Root Causes:**
- Speech Recognition API `onend` event not always triggered consistently across browsers
- Timing issues between transcript completion and auto-send trigger
- Browser-specific implementation differences (especially Safari vs Chrome)

**Workarounds:**
- 3-second fallback timeout implemented (partially effective)
- Multiple auto-send attempts with increasing delays
- Manual send button always works

**Technical Details:**
```javascript
// Current implementation has multiple fallback attempts
handleVoiceEnd() -> Multiple attempts (100ms, 500ms, 1000ms)
onresult() -> Immediate auto-send attempt when final transcript received
Fallback timeout -> 3 seconds after transcript received
```

**Browsers Affected:**
- 🟡 Safari: Moderate issues
- 🟢 Chrome: Minor issues
- 🟡 Firefox: Limited speech recognition support
- 🟡 Edge: Similar to Chrome

---

## 💬 **UI/UX Issues**

### 2. Text Flash During Streaming-to-Convex Transition
**Status:** 🔴 Known Issue  
**Severity:** Low (Cosmetic)  
**Frequency:** Always

**Description:**  
When AI response streaming completes and the message is saved to Convex database, there's a brief visual flash as the UI transitions from the streaming bubble to the permanent message bubble.

**Symptoms:**
- ✅ Streaming bubble appears and updates correctly
- ✅ Text streams in real-time
- ❌ Brief flash when streaming ends
- ✅ Final message appears correctly with timestamp

**Root Cause:**
Different data sources with slightly different timing:
```
aiMessages[] (useChat hook) → Streaming bubble with "MAGIS is responding..."
     ↓ (onFinish triggers)
messages[] (Convex query) → Permanent bubble with timestamp + metadata
```

**Technical Flow:**
1. Stream ends → `isLoading = false`
2. Streaming bubble disappears
3. `onFinish()` saves to Convex  
4. Convex reactive query updates
5. Permanent bubble appears
6. **Gap between steps 2-5 causes flash**

**Visual Impact:**
```
[Streaming: "Hello world" + "MAGIS is responding..."] 
           ↓ FLASH
[Permanent: "Hello world" + "2:30 PM • openai"]
```

**Potential Solutions (Future):**
- Delay hiding streaming bubble until Convex message appears
- Use CSS transitions for smoother handoff
- Implement message deduplication logic
- Use single data source for both streaming and permanent states

---

## 📋 **Bug Triage Status**

| Bug | Priority | Difficulty | Impact | Timeline |
|-----|----------|------------|--------|----------|
| Auto-send Voice | 🟡 Medium | 🔴 Hard | User workflow | Future sprint |
| Text Flash | 🟢 Low | 🟡 Medium | Visual polish | Backlog |

---

## 🔧 **Development Notes**

### For Auto-send Issue:
- Consider implementing Web Speech API event listeners debugging
- Test different browser configurations
- May need platform-specific implementations

### For Text Flash Issue:
- Investigate React state management optimization
- Consider using single data source pattern
- CSS transition implementation could help

---

## 📊 **Testing Scenarios**

### Voice Auto-send Testing:
1. Test in different browsers (Chrome, Safari, Firefox, Edge)
2. Test with different speech patterns (short vs long utterances)
3. Test with different network conditions (slow vs fast)
4. Test with different languages (Portuguese, English, Spanish)

### Text Flash Testing:
1. Send messages via text input
2. Send messages via voice input  
3. Test with different response lengths (short vs long)
4. Test with different AI providers (OpenAI vs Claude)

---

**Last Updated:** 2025-01-05  
**Version:** Day 2 Implementation  
**Reporter:** Development Team