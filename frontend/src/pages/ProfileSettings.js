import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Briefcase, Phone, MapPin, Globe, FileText, Save, Loader2 } from "lucide-react";

export default function ProfileSettings() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    linkedin_url: "",
    title: "",
    company: "",
    phone_number: "",
    city: "",
    country: "",
    about_me: "",
    help_topics: [],
  });
  const [helpTopicInput, setHelpTopicInput] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        linkedin_url: user.linkedin_url || "",
        title: user.title || "",
        company: user.company || "",
        phone_number: user.phone_number || "",
        city: user.city || "",
        country: user.country || "",
        about_me: user.about_me || "",
        help_topics: user.help_topics || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addHelpTopic = () => {
    if (helpTopicInput.trim() && !formData.help_topics.includes(helpTopicInput.trim())) {
      setFormData({
        ...formData,
        help_topics: [...formData.help_topics, helpTopicInput.trim()],
      });
      setHelpTopicInput("");
    }
  };

  const removeHelpTopic = (topic) => {
    setFormData({
      ...formData,
      help_topics: formData.help_topics.filter((t) => t !== topic),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate LinkedIn URL
    if (formData.linkedin_url && !formData.linkedin_url.toLowerCase().includes("linkedin.com")) {
      toast.error("Please enter a valid LinkedIn URL");
      setLoading(false);
      return;
    }

    // Validate phone number format
    if (formData.phone_number && !/^\+\d{1,3}-\d{5,15}$/.test(formData.phone_number)) {
      toast.error("Phone number must be in format: +XX-XXXXXXXXX");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        `${API}/users/${user.user_id}`,
        formData,
        { withCredentials: true }
      );

      // Update local user state
      setUser(response.data);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090914] via-[#0a0a1a] to-[#090914]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-slate-400">Manage your personal information and professional details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1.5"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url" className="text-slate-300">
                  LinkedIn URL *
                </Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  className="mt-1.5"
                  placeholder="https://linkedin.com/in/johndoe"
                />
                <p className="text-xs text-slate-500 mt-1">Must be a valid LinkedIn profile URL</p>
              </div>
            </div>
          </Card>

          {/* Professional Details */}
          <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Professional Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-300">
                  Job Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1.5"
                  placeholder="Senior Executive Recruiter"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-slate-300">
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="mt-1.5"
                  placeholder="BestPL Executive Search"
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <Phone className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Contact Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone_number" className="text-slate-300">
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="mt-1.5"
                  placeholder="+1-5551234567"
                />
                <p className="text-xs text-slate-500 mt-1">Format: +CountryCode-Number (e.g., +1-5551234567)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-slate-300">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1.5"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-slate-300">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="mt-1.5"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* About & Expertise */}
          <Card className="p-6 bg-[#0f1020]/80 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">About & Expertise</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="about_me" className="text-slate-300">
                  About Me
                </Label>
                <Textarea
                  id="about_me"
                  name="about_me"
                  value={formData.about_me}
                  onChange={handleChange}
                  className="mt-1.5 min-h-[100px]"
                  placeholder="Tell us about your experience and background..."
                />
              </div>

              <div>
                <Label className="text-slate-300">I Can Help Community Members With</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={helpTopicInput}
                    onChange={(e) => setHelpTopicInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHelpTopic())}
                    placeholder="e.g., Executive Search, Tech Hiring"
                  />
                  <Button
                    type="button"
                    onClick={addHelpTopic}
                    variant="outline"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                {/* Help Topics Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.help_topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => removeHelpTopic(topic)}
                        className="hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
