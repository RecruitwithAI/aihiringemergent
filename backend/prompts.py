"""
Talent Scout - Centralized Prompt Library

This module contains all AI/LLM prompts used throughout the application.
Organize prompts by category and use case for easy maintenance and A/B testing.
"""

from typing import Dict, Optional


class PromptLibrary:
    """Central repository for all AI prompts with versioning"""
    
    VERSION = "1.0.0"
    LAST_UPDATED = "2026-03-12"
    
    # ==================== SYSTEM PROMPTS ====================
    # Define the AI's role, expertise, and guidelines
    
    SYSTEM_PROMPTS = {
        "recruiter_basic": (
            "You are an expert executive recruiter researching leadership candidates."
        ),
        
        "recruiter_advanced": (
            "You are an expert executive search consultant with 15+ years of experience "
            "in technology leadership recruitment.\n\n"
            "Your expertise includes:\n"
            "- Identifying leadership talent at VP+ levels\n"
            "- Evaluating career trajectories and scope\n"
            "- Assessing cultural and organizational fit\n"
            "- Maintaining high ethical standards in candidate research\n\n"
            "Guidelines:\n"
            "- Only provide information that can be verified from public sources\n"
            "- Clearly indicate when information is inferred vs. confirmed\n"
            "- Respect candidate privacy and professional boundaries\n"
            "- Focus on professional achievements and qualifications\n\n"
            "Response Quality:\n"
            "- Provide specific, concrete examples\n"
            "- Include measurable achievements when possible\n"
            "- Note any gaps or uncertainties in candidate information"
        ),
        
        "company_analyst": (
            "You are a corporate intelligence analyst specializing in organizational "
            "structure research. You analyze companies to understand their leadership "
            "hierarchy, functional divisions, and talent patterns."
        ),
        
        "evidence_verifier": (
            "You are a fact-checking analyst for executive recruitment. Your role is to "
            "assess the verifiability and confidence level of candidate information based "
            "on available public sources."
        ),
        
        "fit_scorer": (
            "You are an executive search consultant specializing in candidate-role matching. "
            "You evaluate how well candidates align with specific role requirements using "
            "structured scoring criteria."
        )
    }
    
    # ==================== TASK PROMPTS ====================
    # Specific instructions for different operations
    
    @staticmethod
    def candidate_search_basic(
        role: str,
        company_name: str,
        geography: str,
        must_haves: str,
        ideal_backgrounds: str
    ) -> str:
        """Basic candidate search prompt (current MVP implementation)"""
        return f"""Research leadership candidates for the role of {role} from {company_name}.
            
Looking for candidates with:
- Geography: {geography}
- Must-haves: {must_haves}
- Ideal backgrounds: {ideal_backgrounds}

Provide 2-3 likely candidates in JSON format with fields:
- name
- current_title
- location
- scope (describe their responsibilities)
- achievements
- previous_employers (list)
- education

Return ONLY valid JSON array."""
    
    @staticmethod
    def candidate_search_enhanced(
        role: str,
        company_name: str,
        geography: str,
        must_haves: str,
        ideal_backgrounds: str,
        no_go_constraints: Optional[str] = None,
        compensation_band: Optional[str] = None
    ) -> str:
        """Enhanced candidate search with more context and validation"""
        return f"""Research executive leadership candidates for the following position:

**TARGET ROLE**: {role}
**COMPANY**: {company_name}
**GEOGRAPHY**: {geography}
{f'**COMPENSATION**: {compensation_band}' if compensation_band else ''}

**REQUIRED QUALIFICATIONS**:
{must_haves or 'Not specified'}

**IDEAL BACKGROUND**:
{ideal_backgrounds}

{f'**EXCLUSIONS**:\n{no_go_constraints}' if no_go_constraints else ''}

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

**CRITICAL**: Return ONLY the JSON array. No introduction, no conclusion, no markdown formatting."""
    
    @staticmethod
    def company_intelligence(company_name: str, target_role: str) -> str:
        """Research company structure and leadership patterns"""
        return f"""Analyze {company_name} and provide leadership structure insights.

Focus on:
- Organizational structure (functional, matrix, divisional)
- Key business divisions and their leaders
- Leadership levels and common titles
- Alternative titles for: {target_role}
- Recent organizational changes

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
    "{target_role}": ["Alternative title 1", "Alternative title 2"]
  }},
  "recent_changes": "Major org changes in last 12 months",
  "data_sources": ["Source URLs"]
}}"""
    
    @staticmethod
    def evidence_verification(
        candidate_name: str,
        claim_text: str,
        field_name: str
    ) -> str:
        """Verify a specific claim about a candidate"""
        return f"""Verify the following candidate claim:

**CLAIM**: {claim_text}
**CANDIDATE**: {candidate_name}
**FIELD**: {field_name}

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
}}"""
    
    @staticmethod
    def fit_scoring_analysis(
        candidate_json: str,
        mandate_json: str
    ) -> str:
        """Analyze candidate-role fit with structured scoring"""
        return f"""Analyze fit between candidate and target role.

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
}}"""
    
    # ==================== OUTPUT SCHEMAS ====================
    # Define expected JSON structures
    
    OUTPUT_SCHEMAS = {
        "candidate_basic": {
            "name": "string",
            "current_title": "string",
            "location": "string",
            "scope": "string",
            "achievements": "string",
            "previous_employers": ["string"],
            "education": "string"
        },
        
        "candidate_enhanced": {
            "name": "string",
            "current_title": "string",
            "current_employer": "string",
            "location": "string",
            "scope": "string",
            "achievements": "string",
            "previous_employers": ["string"],
            "education": "string",
            "years_in_role": "string",
            "total_experience": "string",
            "data_confidence": "high|medium|low",
            "verification_notes": "string"
        },
        
        "company_intelligence": {
            "company_name": "string",
            "sector": "string",
            "size": "string",
            "growth_stage": "string",
            "organizational_structure": "string",
            "key_divisions": ["string"],
            "leadership_levels": ["string"],
            "equivalent_titles": {"target_role": ["string"]},
            "recent_changes": "string",
            "data_sources": ["string"]
        },
        
        "evidence_verification": {
            "claim": "string",
            "assessment": "verifiable|partially_verifiable|unverifiable",
            "confidence_score": "float (0.0-1.0)",
            "reasoning": "string",
            "suggested_sources": ["string"],
            "red_flags": ["string"],
            "recruiter_validation_needed": "boolean"
        },
        
        "fit_scoring": {
            "overall_score": "int (0-100)",
            "criteria_breakdown": {
                "title_relevance": {"score": "int", "reasoning": "string"},
                "scope_similarity": {"score": "int", "reasoning": "string"},
                "industry_adjacency": {"score": "int", "reasoning": "string"},
                "company_quality": {"score": "int", "reasoning": "string"},
                "transformation_signals": {"score": "int", "reasoning": "string"},
                "geography_match": {"score": "int", "reasoning": "string"},
                "career_momentum": {"score": "int", "reasoning": "string"}
            },
            "strengths": ["string"],
            "concerns": ["string"],
            "recommendation": "strong_fit|good_fit|moderate_fit|poor_fit"
        }
    }
    
    # ==================== HELPER METHODS ====================
    
    @classmethod
    def get_system_prompt(cls, prompt_type: str = "recruiter_basic") -> str:
        """Get system prompt by type"""
        return cls.SYSTEM_PROMPTS.get(prompt_type, cls.SYSTEM_PROMPTS["recruiter_basic"])
    
    @classmethod
    def get_schema(cls, schema_type: str) -> Dict:
        """Get output schema by type"""
        return cls.OUTPUT_SCHEMAS.get(schema_type, {})
    
    @classmethod
    def list_prompts(cls) -> Dict[str, list]:
        """List all available prompts"""
        return {
            "system_prompts": list(cls.SYSTEM_PROMPTS.keys()),
            "task_prompts": [
                "candidate_search_basic",
                "candidate_search_enhanced",
                "company_intelligence",
                "evidence_verification",
                "fit_scoring_analysis"
            ],
            "schemas": list(cls.OUTPUT_SCHEMAS.keys())
        }


# ==================== USAGE EXAMPLES ====================

if __name__ == "__main__":
    # Example 1: Get system prompt
    system_msg = PromptLibrary.get_system_prompt("recruiter_advanced")
    print("System Prompt:", system_msg[:100], "...")
    
    # Example 2: Generate search query
    search_query = PromptLibrary.candidate_search_enhanced(
        role="VP of Engineering",
        company_name="Google",
        geography="San Francisco Bay Area",
        must_haves="10+ years engineering leadership",
        ideal_backgrounds="SaaS, enterprise software, team scaling",
        compensation_band="$200k-$300k"
    )
    print("\nSearch Query:", search_query[:200], "...")
    
    # Example 3: List all available prompts
    available = PromptLibrary.list_prompts()
    print("\nAvailable Prompts:", available)
    
    # Example 4: Get output schema
    schema = PromptLibrary.get_schema("candidate_enhanced")
    print("\nCandidate Schema:", schema)
