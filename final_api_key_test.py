#!/usr/bin/env python3

import requests
import json
import sys

def test_complete_api_key_flow():
    """Test the complete API key flow including using personal keys"""
    base_url = "https://api-key-mgmt-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔧 Testing Complete API Key Flow")
    print("="*50)
    
    # Login
    session = requests.Session()
    login_response = session.post(
        f"{api_url}/auth/login",
        json={"email": "saba@bestpl.ai", "password": "Bestpl2026!"},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code != 200:
        print("❌ Login failed")
        return False
    
    cookies = login_response.cookies
    print("✅ Login successful")
    
    # Save personal API key
    save_response = session.post(
        f"{api_url}/ai/save-api-key",
        json={"api_key": "sk-test-personal-key-abcdef123456"},
        headers={'Content-Type': 'application/json'},
        cookies=cookies
    )
    
    if save_response.status_code == 200:
        print("✅ Personal API key saved")
        
        # Verify key is saved
        usage_response = session.get(
            f"{api_url}/ai/usage",
            cookies=cookies
        )
        
        if usage_response.status_code == 200:
            usage_data = usage_response.json()
            if usage_data.get('has_own_api_key'):
                print("✅ Personal API key detected in usage stats")
                
                # Try AI generation (should use personal key but will fail since it's fake)
                ai_response = session.post(
                    f"{api_url}/ai/generate",
                    json={
                        "tool_type": "jd-builder",
                        "prompt": "Create a JD for DevOps Engineer",
                        "context": "Cloud-native company"
                    },
                    headers={'Content-Type': 'application/json'},
                    cookies=cookies
                )
                
                print(f"AI generation status: {ai_response.status_code}")
                if ai_response.status_code == 200:
                    print("✅ AI generation worked with personal key")
                else:
                    print("⚠️ AI generation failed (expected with fake key)")
                    try:
                        error = ai_response.json()
                        print(f"   Error: {error}")
                    except:
                        print(f"   Error: {ai_response.text[:200]}")
                
                # Clean up - delete the API key
                delete_response = session.delete(
                    f"{api_url}/ai/delete-api-key",
                    cookies=cookies
                )
                
                if delete_response.status_code == 200:
                    print("✅ Personal API key deleted")
                else:
                    print("❌ Failed to delete API key")
                
                return True
            else:
                print("❌ Personal API key not detected")
        else:
            print("❌ Failed to get usage stats")
    else:
        print("❌ Failed to save personal API key")
    
    return False

if __name__ == "__main__":
    success = test_complete_api_key_flow()
    sys.exit(0 if success else 1)