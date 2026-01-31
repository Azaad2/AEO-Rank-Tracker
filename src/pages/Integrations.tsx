import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Slack, Webhook, Zap, Bell, ArrowRight, Check, Loader2 } from "lucide-react";

const Integrations = () => {
  const { toast } = useToast();
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [zapierWebhook, setZapierWebhook] = useState("");
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [isTestingZapier, setIsTestingZapier] = useState(false);

  const handleTestSlack = async () => {
    if (!slackWebhook) {
      toast({
        title: "Missing webhook URL",
        description: "Please enter your Slack webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsTestingSlack(true);
    try {
      await fetch(slackWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🎉 Test message from AI Mention You! Your Slack integration is working.",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "🎉 *Test message from AI Mention You!*\n\nYour Slack integration is working correctly."
              }
            }
          ]
        }),
      });

      toast({
        title: "Test sent!",
        description: "Check your Slack channel for the test message.",
      });
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "Please check your webhook URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingSlack(false);
    }
  };

  const handleTestZapier = async () => {
    if (!zapierWebhook) {
      toast({
        title: "Missing webhook URL",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsTestingZapier(true);
    try {
      await fetch(zapierWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          source: "AI Mention You",
          message: "Test webhook from AI Mention You integration",
        }),
      });

      toast({
        title: "Request sent!",
        description: "Check your Zap's history to confirm it was triggered.",
      });
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "Please check your webhook URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingZapier(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              <span className="text-yellow-400">Integrations</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Connect AI Mention You to your favorite tools. Get real-time alerts and automate your AI visibility workflow.
            </p>
          </div>

          {/* Integration Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Slack Integration */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#4A154B] rounded-lg">
                    <Slack className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Slack</CardTitle>
                    <CardDescription className="text-gray-400">
                      Get AI visibility alerts in Slack
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook" className="text-gray-300">Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    <a 
                      href="https://api.slack.com/messaging/webhooks" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:underline"
                    >
                      How to create a Slack webhook →
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack-channel" className="text-gray-300">Channel Name (optional)</Label>
                  <Input
                    id="slack-channel"
                    placeholder="#ai-visibility-alerts"
                    value={slackChannel}
                    onChange={(e) => setSlackChannel(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-gray-300">Enable Alerts</Label>
                    <p className="text-xs text-gray-500">Receive scan results automatically</p>
                  </div>
                  <Switch
                    checked={slackEnabled}
                    onCheckedChange={setSlackEnabled}
                  />
                </div>

                <Button 
                  onClick={handleTestSlack}
                  disabled={isTestingSlack || !slackWebhook}
                  className="w-full bg-[#4A154B] hover:bg-[#611f69] text-white"
                >
                  {isTestingSlack ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Send Test Message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Zapier/Webhook Integration */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#FF4A00] rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Zapier / Webhooks</CardTitle>
                    <CardDescription className="text-gray-400">
                      Connect to 5000+ apps via Zapier
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zapier-webhook" className="text-gray-300">Webhook URL</Label>
                  <Input
                    id="zapier-webhook"
                    placeholder="https://hooks.zapier.com/..."
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    <a 
                      href="https://zapier.com/apps/webhook/integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:underline"
                    >
                      Create a Zapier webhook trigger →
                    </a>
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-300 font-medium">Webhook payload includes:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-400" />
                      Domain scanned
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-400" />
                      AI visibility score
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-400" />
                      Mention & citation status
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-400" />
                      Top competitors found
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleTestZapier}
                  disabled={isTestingZapier || !zapierWebhook}
                  className="w-full bg-[#FF4A00] hover:bg-[#e04300] text-white"
                >
                  {isTestingZapier ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Webhook className="mr-2 h-4 w-4" />
                      Test Webhook
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Use Cases Section */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 mb-12">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              What You Can Automate
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Daily Visibility Reports",
                  description: "Get automatic Slack alerts with your daily AI visibility score"
                },
                {
                  title: "Competitor Alerts",
                  description: "Notify your team when new competitors appear in AI answers"
                },
                {
                  title: "Score Drop Warnings",
                  description: "Trigger alerts when your visibility drops below a threshold"
                },
                {
                  title: "CRM Updates",
                  description: "Sync scan data to Salesforce, HubSpot, or your CRM via Zapier"
                },
                {
                  title: "Spreadsheet Logging",
                  description: "Automatically log all scan results to Google Sheets"
                },
                {
                  title: "Team Notifications",
                  description: "Send alerts to email, SMS, or Microsoft Teams"
                },
              ].map((item, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Need help setting up integrations?
            </p>
            <Link to="/contact">
              <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Integrations;