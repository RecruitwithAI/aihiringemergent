# Talent Scout - AI System Prompts Configuration

This document details all AI/LLM system prompts used throughout the Talent Scout application.

---

## 1. Current Implementation (server.py)

### Location in Code
**File**: `/app/backend/server.py`  
**Function**: `orchestrate_search()`  
**Lines**: 176-198

### 1.1 System Message (Role Definition)

```python
system_message="You are an expert executive recruiter researching leadership candidates."
```

**Purpose**: 
- Sets the AI's role and expertise domain
- Establishes professional context
- Influences response quality and tone

**Key Characteristics**:
- Expert-level knowledge
- Executive search focus
- Professional demeanor

---

### 1.2 User Message (Search Query)

```python
search_query = f"""Research leadership candidates for the role of {mandate['role']} from {company['name']}.

Looking for candidates with:
- Geography: {mandate['geography']}
- Must-haves: {mandate['must_haves']}
- Ideal backgrounds: {mandate['ideal_backgrounds']}

Provide 2-3 likely candidates in JSON format with fields:
- name
- current_title
- location
- scope (describe their responsibilities)
- achievements
- previous_employers (list)
- education

Return ONLY valid JSON array."""
```

**Purpose**:
- Instructs AI on specific research task
- Provides mandate context (role, geography, requirements)
- Specifies output format (JSON structure)
- Limits response to 2-3 candidates per company

**Dynamic Variables**:
- `{mandate['role']}` - Target position (e.g., "VP of Engineering")
- `{company['name']}` - Company to research (e.g., "Google")
- `{mandate['geography']}` - Location requirement (e.g., "San Francisco Bay Area")
- `{mandate['must_haves']}` - Required qualifications
- `{mandate['ideal_backgrounds']}` - Preferred experience

**Output Constraints**:
- JSON array format
- Specific fields required
- No additional commentary

---

## 2. Prompt Engineering Principles Applied

### 2.1 Clarity
✅ **Clear role definition**: "expert executive recruiter"  
✅ **Explicit task**: "Research leadership candidates"  
✅ **Specific output format**: "JSON format with fields"

### 2.2 Context
✅ **Company context**: Target company name  
✅ **Role context**: Specific position and requirements  
✅ **Geographic context**: Location preferences  

### 2.3 Constraints
✅ **Quantity limit**: "2-3 likely candidates"  
✅ **Format constraint**: "Return ONLY valid JSON array"  
✅ **Field specification**: Exact JSON schema provided

### 2.4 Quality Control
⚠️ **Missing**: Verification instructions  
⚠️ **Missing**: Source citation requirements  
⚠️ **Missing**: Confidence scoring guidance

---

## 3. Enhanced Prompts (Recommended for Phase 2)

### 3.1 Enhanced System Message

```python
SYSTEM_PROMPT_RECRUITER = """You are an expert executive search consultant with 15+ years of experience in technology leadership recruitment. 

Your expertise includes:
- Identifying leadership talent at VP+ levels
- Evaluating career trajectories and scope
- Assessing cultural and organizational fit
- Maintaining high ethical standards in candidate research

Guidelines:
- Only provide information that can be verified from public sources
- Clearly indicate when information is inferred vs. confirmed
- Respect candidate privacy and professional boundaries
- Focus on professional achievements and qualifications

Response Quality:
- Provide specific, concrete examples
- Include measurable achievements when possible
- Note any gaps or uncertainties in candidate information
"""
```

**Improvements**:
- Deeper expertise definition
- Ethical guidelines
- Quality standards
- Uncertainty handling

---

### 3.2 Enhanced Search Query

```python
SEARCH_QUERY_TEMPLATE = """Research executive leadership candidates for the following position:

**TARGET ROLE**: {role}
**COMPANY**: {company_name}
**GEOGRAPHY**: {geography}
**COMPENSATION**: {compensation_band}

**REQUIRED QUALIFICATIONS**:
{must_haves}

**IDEAL BACKGROUND**:
{ideal_backgrounds}

**EXCLUSIONS**:
{no_go_constraints}

**RESEARCH INSTRUCTIONS**:
1. Identify 2-3 high-potential candidates currently or recently at {company_name}
2. Focus on leaders in adjacent or equivalent roles
3. Consider second-line leaders ready for bigger roles
4. Include ex-employees from the last 2-5 years if highly relevant

**OUTPUT FORMAT** (strict JSON array):
[
  {{
    "name": "Full Name",
    "current_title": "Exact current title",
    "current_employer": "Current company name",
    "location": "City, State/Country",
    "scope": "Detailed description of current responsibilities, team size, budget, technologies",
    "achievements": "Specific, measurable achievements with concrete outcomes",
    "previous_employers": ["Company1", "Company2", "Company3"],
    "education": "Degrees and institutions",
    "years_in_role": "Approximate tenure in current position",
    "total_experience": "Total years of relevant experience",
    "data_confidence": "high|medium|low based on public information availability",
    "verification_notes": "Any caveats or uncertainties about the data"
  }}
]

**CRITICAL**: Return ONLY the JSON array. No introduction, no conclusion, no markdown formatting.
"""
```

**Improvements**:
- Structured sections
- Detailed research instructions
- Expanded JSON schema
- Confidence and verification fields
- Clearer format instructions

---

## 4. Specialized Prompts (Future Use Cases)

### 4.1 Company Intelligence Prompt

```python
COMPANY_MAPPER_PROMPT = """You are a corporate intelligence analyst specializing in organizational structure research.

TASK: Analyze {company_name} and provide leadership structure insights.

Provide JSON output:
{{
  "company_name": "{company_name}",
  "sector": "Industry classification",
  "size": "Employee count range",
  "growth_stage": "startup|growth|mature|enterprise",
  "organizational_structure": "functional|matrix|divisional|hybrid",
  "key_divisions": ["Division names"],
  "leadership_levels": ["C-Suite", "SVP", "VP", "Director"],
  "equivalent_titles": {{
    "target_role": ["Alternative title 1", "Alternative title 2"]
  }},
  "recent_changes": "Major org changes in last 12 months",
  "data_sources": ["Source URLs"]
}}
"""
```

**Purpose**: Build company context before candidate search

---

### 4.2 Evidence Verification Prompt

```python
EVIDENCE_VERIFIER_PROMPT = """You are a fact-checking analyst for executive recruitment.

TASK: Verify the following candidate claim:

CLAIM: {claim_text}
CANDIDATE: {candidate_name}
FIELD: {field_name}

INSTRUCTIONS:
1. Assess the verifiability of this claim
2. Identify what public sources could confirm/deny it
3. Rate confidence level based on information specificity

OUTPUT:
{{
  "claim": "{claim_text}",
  "assessment": "verifiable|partially_verifiable|unverifiable",
  "confidence_score": 0.0-1.0,
  "reasoning": "Explanation of assessment",
  "suggested_sources": ["Where to verify"],
  "red_flags": ["Any concerns or inconsistencies"],
  "recruiter_validation_needed": true|false
}}
"""
```

**Purpose**: Quality control for candidate data

---

### 4.3 Fit Scoring Enhancement Prompt

```python
FIT_SCORING_PROMPT = """You are an executive search consultant specializing in candidate-role matching.

TASK: Analyze fit between candidate and target role.

**CANDIDATE PROFILE**:
{candidate_json}

**TARGET MANDATE**:
{mandate_json}

**SCORING CRITERIA** (total 100 points):
1. Title Relevance (20 points): How well does title match?
2. Scope Similarity (20 points): Comparable responsibility level?
3. Industry Adjacency (15 points): Transferable industry experience?
4. Company Quality (10 points): Comparable company caliber?
5. Transformation Signals (15 points): Growth/scale experience?
6. Geography Match (10 points): Location alignment?
7. Career Momentum (10 points): Upward trajectory?

OUTPUT:
{{
  "overall_score": 0-100,
  "criteria_breakdown": {{
    "title_relevance": {{"score": 0-20, "reasoning": "..."}},
    "scope_similarity": {{"score": 0-20, "reasoning": "..."}},
    "industry_adjacency": {{"score": 0-15, "reasoning": "..."}},
    "company_quality": {{"score": 0-10, "reasoning": "..."}},
    "transformation_signals": {{"score": 0-15, "reasoning": "..."}},
    "geography_match": {{"score": 0-10, "reasoning": "..."}},
    "career_momentum": {{"score": 0-10, "reasoning": "..."}}
  }},
  "strengths": ["Key positive factors"],
  "concerns": ["Potential risks or gaps"],
  "recommendation": "strong_fit|good_fit|moderate_fit|poor_fit"
}}
"""
```

**Purpose**: ML-enhanced scoring with explanations

---

## 5. Prompt Management Best Practices

### 5.1 Configuration File Structure

**Recommended**: Create `/app/backend/prompts.py`

```python
from typing import Dict

class PromptLibrary:
    """Central repository for all AI prompts"""
    
    # System prompts (role definitions)
    SYSTEM_PROMPTS = {
        "recruiter": "You are an expert executive recruiter...",
        "analyst": "You are a corporate intelligence analyst...",
        "verifier": "You are a fact-checking analyst...",
        "scorer": "You are an executive search consultant..."
    }
    
    # Task prompts (specific instructions)
    TASK_PROMPTS = {
        "candidate_search": """Research leadership candidates...""",
        "company_intel": """Analyze {company_name}...""",
        "evidence_check": """Verify the following claim...""",
        "fit_analysis": """Analyze fit between candidate..."""
    }
    
    # Output schemas
    OUTPUT_SCHEMAS = {
        "candidate": {
            "name": "string",
            "current_title": "string",
            # ... full schema
        }
    }
    
    @staticmethod
    def get_system_prompt(prompt_type: str) -> str:
        return PromptLibrary.SYSTEM_PROMPTS.get(prompt_type, "")
    
    @staticmethod
    def get_task_prompt(prompt_type: str, **kwargs) -> str:
        template = PromptLibrary.TASK_PROMPTS.get(prompt_type, "")
        return template.format(**kwargs)
```

### 5.2 Usage in Code

```python
from prompts import PromptLibrary

# In orchestrate_search()
chat = LlmChat(
    api_key=openai_key,
    session_id=f"search_{company['id']}",
    system_message=PromptLibrary.get_system_prompt("recruiter")
).with_model("openai", "gpt-5.2")

search_query = PromptLibrary.get_task_prompt(
    "candidate_search",
    role=mandate['role'],
    company_name=company['name'],
    geography=mandate['geography'],
    must_haves=mandate['must_haves'],
    ideal_backgrounds=mandate['ideal_backgrounds'],
    no_go_constraints=mandate.get('no_go_constraints', 'None'),
    compensation_band=mandate.get('compensation_band', 'Not specified')
)
```

### 5.3 Version Control

```python
class PromptVersion:
    VERSION = "1.0.0"
    LAST_UPDATED = "2026-03-12"
    
    CHANGELOG = {
        "1.0.0": "Initial prompts for MVP",
        "1.1.0": "Added evidence verification",
        "1.2.0": "Enhanced with confidence scoring"
    }
```

---

## 6. Prompt Testing & Iteration

### 6.1 Test Cases

```python
# Test different prompt variations
test_prompts = [
    {
        "version": "v1_basic",
        "system": "You are an expert recruiter.",
        "expected_quality": "baseline"
    },
    {
        "version": "v2_detailed",
        "system": "You are an expert executive recruiter with 15+ years...",
        "expected_quality": "improved"
    }
]

# Evaluate outputs
def evaluate_prompt_quality(response: dict) -> float:
    score = 0
    if "name" in response: score += 10
    if "achievements" in response and len(response["achievements"]) > 50: score += 20
    # ... more criteria
    return score
```

### 6.2 A/B Testing

```python
async def orchestrate_search_ab_test(request: SearchRequest):
    # 50% get prompt v1, 50% get prompt v2
    prompt_version = "v1" if random.random() < 0.5 else "v2"
    
    # Log for analysis
    await db.prompt_experiments.insert_one({
        "mandate_id": request.mandate_id,
        "prompt_version": prompt_version,
        "timestamp": datetime.now(timezone.utc)
    })
```

---

## 7. Prompt Optimization Techniques

### 7.1 Few-Shot Learning

```python
FEW_SHOT_EXAMPLES = """
Example 1:
Input: "VP of Engineering at Google"
Output: {
  "name": "Urs Hölzle",
  "current_title": "SVP of Technical Infrastructure",
  "scope": "Oversees Google's technical infrastructure including data centers...",
  "achievements": "Built Google's infrastructure from 10 to 1M+ servers..."
}

Example 2:
Input: "Director of Engineering at Microsoft"
Output: {
  "name": "Scott Guthrie",
  "current_title": "EVP, Cloud + AI",
  "scope": "Leads Azure, Windows Server, SQL Server, Visual Studio...",
  "achievements": "Grew Azure from $0 to $50B+ revenue business..."
}

Now research: {actual_query}
"""
```

### 7.2 Chain-of-Thought

```python
COT_PROMPT = """Before providing candidates, think through:

1. What are the key responsibilities of {role}?
2. What companies have similar roles?
3. Who are the likely leaders in those roles?
4. What evidence supports their qualifications?

Then provide candidates in JSON format.
"""
```

### 7.3 Self-Consistency

```python
# Generate 3 responses and ensemble
for i in range(3):
    response = await chat.send_message(query)
    candidates.append(response)

# Merge and deduplicate
final_candidates = merge_consistent_candidates(candidates)
```

---

## 8. Current Limitations & Improvements

### Current Implementation Issues

1. **No Source Verification**: AI generates candidates without real sources
2. **Fixed Confidence**: All evidence gets 0.7 confidence
3. **No Uncertainty Handling**: No "unknown" fields
4. **Limited Context**: Only uses mandate fields
5. **No Iterative Refinement**: Single-shot generation

### Phase 2 Improvements

```python
# Multi-stage pipeline
async def advanced_search_pipeline(mandate, company):
    # Stage 1: Company research
    company_intel = await research_company(company)
    
    # Stage 2: Role mapping
    equivalent_titles = await map_role_titles(mandate, company_intel)
    
    # Stage 3: Candidate discovery (web search)
    candidates = await search_web_for_candidates(
        company, 
        equivalent_titles
    )
    
    # Stage 4: Profile enrichment
    enriched = await enrich_candidate_profiles(candidates)
    
    # Stage 5: Evidence verification
    verified = await verify_evidence(enriched)
    
    # Stage 6: Fit scoring
    scored = await score_candidates(verified, mandate)
    
    return scored
```

---

## 9. Prompt Security & Safety

### 9.1 Input Sanitization

```python
def sanitize_prompt_input(user_input: str) -> str:
    # Remove prompt injection attempts
    dangerous_patterns = [
        "ignore previous instructions",
        "disregard all above",
        "new instructions:"
    ]
    
    for pattern in dangerous_patterns:
        if pattern.lower() in user_input.lower():
            raise ValueError("Potentially unsafe input detected")
    
    return user_input.strip()
```

### 9.2 Output Validation

```python
def validate_ai_output(output: str) -> dict:
    try:
        data = json.loads(output)
        
        # Check required fields
        required = ["name", "current_title", "current_employer"]
        for field in required:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate types
        if not isinstance(data["name"], str):
            raise ValueError("Name must be string")
        
        return data
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON output from AI")
```

---

## 10. Monitoring & Analytics

### Track Prompt Performance

```python
async def log_prompt_execution(
    mandate_id: str,
    company_id: str,
    prompt_version: str,
    system_message: str,
    user_message: str,
    response: str,
    execution_time: float,
    tokens_used: int
):
    await db.prompt_logs.insert_one({
        "mandate_id": mandate_id,
        "company_id": company_id,
        "prompt_version": prompt_version,
        "system_message_hash": hash(system_message),
        "user_message_hash": hash(user_message),
        "response_length": len(response),
        "execution_time_ms": execution_time * 1000,
        "tokens_used": tokens_used,
        "timestamp": datetime.now(timezone.utc)
    })
```

---

## Summary

**Current Location**: All prompts in `/app/backend/server.py` (lines 176-198)

**Recommendation**: 
1. Extract prompts to `/app/backend/prompts.py`
2. Implement `PromptLibrary` class
3. Add version control
4. Enable A/B testing
5. Add monitoring and analytics

**Next Steps**:
1. Review and enhance current prompts
2. Add evidence verification prompts
3. Implement multi-stage pipeline prompts
4. Create prompt testing framework

---

**Document Version**: 1.0  
**Last Updated**: March 12, 2026  
**Related**: TalentScoutPRD.md
